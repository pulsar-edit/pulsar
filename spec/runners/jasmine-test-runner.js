/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Grim = require("grim");
const fs = require("fs-plus");
const temp = require("temp");
const path = require("path");
const { ipcRenderer } = require("electron");
const { ConsoleReporter } = require("@jasminejs/reporters");
const ListReporter = require("../helpers/jasmine2-list-reporter");

temp.track();

const specMetadataById = new Map();
let currentLegacyAsyncQueue = null;
const realSetTimeout = window.setTimeout.bind(window);
const realClearTimeout = window.clearTimeout.bind(window);

module.exports = function ({ logFile, headless, testPaths, buildAtomEnvironment }) {
  // Load Jasmine
  require("../helpers/jasmine2-singleton");
  defineJasmineHelpersOnWindow(jasmine.getEnv());

  // Build Atom Environment
  const { atomHome, applicationDelegate } = require("../helpers/build-atom-environment");
  window.atom = buildAtomEnvironment({
    applicationDelegate,
    window,
    document,
    configDirPath: atomHome,
    enablePersistence: false,
  });

  // Load general helpers
  require("../../src/window");
  require("../helpers/normalize-comments");
  require("../helpers/document-title");
  require("../helpers/load-jasmine-stylesheet");
  require("../helpers/fixture-packages");
  require("../helpers/set-prototype-extensions");
  require("../helpers/default-timeout");
  require("../helpers/attach-to-dom");
  require("../helpers/deprecation-snapshots");
  require("../helpers/platform-filter");

  const jasmineContent = document.createElement("div");
  jasmineContent.setAttribute("id", "jasmine-content");
  document.body.appendChild(jasmineContent);

  if (process.env.CI) {
    disableFocusMethods();
  }

  return loadSpecsAndRunThem(logFile, headless, testPaths)
    .then((result) => {
      // Retrying failures only really makes sense in headless mode,
      // otherwise the whole HTML view is replaced before the user can inspect the details of the failures
      if (!headless) return result;
      // All specs passed, don't need to rerun any of them - pass the results to handle possible Grim deprecations
      if (result.failedSpecs.length === 0) return result;

      console.log("\n", "\n", `Retrying ${result.failedSpecs.length} spec(s)`, "\n", "\n");

      // Gather the full names of the failed specs - this is the closest to be a unique identifier for all specs
      const fullNamesOfFailedSpecs = result.failedSpecs.map((spec) => {
        return spec.fullName;
      });

      // Force-delete the current env - this way Jasmine will reset and we'll be able to re-run failed specs only. The next time the code calls getEnv(), it'll generate a new environment
      resetJasmineEnv();

      // As all the jasmine helpers (it, describe, etc..) were registered to the previous environment, we need to re-set them on window
      defineJasmineHelpersOnWindow(jasmine.getEnv());

      // Set up a specFilter to disable all passing spec and re-run only the flaky ones
      setSpecFilter((spec) => fullNamesOfFailedSpecs.includes(getSpecFullName(spec)));

      // Run the specs again - due to the spec filter, only the failed specs will run this time
      return loadSpecsAndRunThem(logFile, headless, testPaths);
    })
    .then((result) => {
      // Some of the specs failed, we should return with a non-zero exit code
      if (result.failedSpecs.length !== 0) return 1;

      // Some of the tests had deprecation warnings, we should log them and return with a non-zero exit code
      if (result.hasDeprecations) {
        Grim.logDeprecations();
        return 1;
      }

      // Everything went good, time to return with a zero exit code
      return 0;
    });
};

const defineJasmineHelpersOnWindow = (jasmineEnv) => {
  installLegacyTimeoutCompatibility(jasmineEnv);

  for (let key in jasmineEnv) {
    window[key] = jasmineEnv[key];
  }

  setupLegacySpyCompatibility();
  setupLegacyAsyncCompatibility();

  ["describe", "fdescribe", "xdescribe"].forEach((key) => {
    window[key] = (name, originalFn) => {
      if (typeof originalFn !== "function") {
        return jasmineEnv[key](name, originalFn);
      }

      return jasmineEnv[key](name, function () {
        Promise.resolve(originalFn.call(this)).catch((error) => {
          setTimeout(() => {
            throw error;
          });
        });
      });
    };
  });

  ["it", "fit", "xit"].forEach((key) => {
    window[key] = (name, originalFn, timeout) => {
      if (typeof originalFn !== "function") {
        return jasmineEnv[key](name, originalFn, timeout);
      }

      jasmineEnv[key](name, function (done) {
        installLegacyUserContext(this, jasmineEnv);
        try {
          if (originalFn.length === 0) {
            runWithLegacyAsyncQueue(() => originalFn.call(this)).then(() => done(), (error) => {
              if (isPendingException(error)) {
                done();
              } else {
                failDone(done, error);
              }
            });
          } else {
            originalFn.call(this, done);
          }
        } catch (err) {
          if (isPendingException(err)) {
            // A test marked itself as pending. Swallow the exception and
            // proceed.
            done();
            return;
          }
          throw err;
        }
      }, timeout);
    };
  });

  ["beforeEach", "afterEach"].forEach((key) => {
    window[key] = (originalFn, timeout) => {
      jasmineEnv[key](function (done) {
        installLegacyUserContext(this, jasmineEnv);
        try {
          if (originalFn.length === 0) {
            runWithLegacyAsyncQueue(() => originalFn.call(this)).then(() => done(), (error) => {
              if (isPendingException(error)) {
                done();
              } else {
                failDone(done, error);
              }
            });
          } else {
            originalFn.call(this, done);
          }
        } catch (error) {
          failDone(done, error);
        }
      }, timeout);
    };
  });
};

const installLegacyTimeoutCompatibility = (jasmineEnv) => {
  const descriptor = Object.getOwnPropertyDescriptor(jasmineEnv, "defaultTimeoutInterval");
  if (descriptor?.get != null && descriptor?.set != null) {
    return;
  }

  Object.defineProperty(jasmineEnv, "defaultTimeoutInterval", {
    configurable: true,
    get() {
      return jasmine.DEFAULT_TIMEOUT_INTERVAL;
    },
    set(value) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = value;
    },
  });
};

const installLegacyUserContext = (context, jasmineEnv) => {
  if (context == null || context.__legacyUserContextCompatibility) {
    return;
  }

  Object.defineProperty(context, "__legacyUserContextCompatibility", {
    value: true,
  });

  context.addMatchers = (matchers) => {
    jasmineEnv.addMatchers(convertLegacyMatchers(matchers));
  };
};

const convertLegacyMatchers = (matchers) => {
  const convertedMatchers = {};
  for (const [name, matcher] of Object.entries(matchers)) {
    convertedMatchers[name] = () => ({
      compare(actual, ...expected) {
        const context = { actual };
        const pass = matcher.apply(context, expected);
        return {
          pass,
          message: context.message,
        };
      },
    });
  }
  return convertedMatchers;
};

const setupLegacySpyCompatibility = () => {
  const originalSpyOn = window.spyOn;
  window.spyOn = (target, methodName) => {
    const existingValue = target?.[methodName];
    if (isSpy(existingValue)) {
      return decorateSpy(existingValue);
    }
    try {
      return decorateSpy(originalSpyOn(target, methodName));
    } catch (error) {
      if (/already been spied upon/.test(error.message) && isSpy(existingValue)) {
        return decorateSpy(existingValue);
      }
      throw error;
    }
  };

  if (window.jasmine.__legacyJasmineFacade) {
    return;
  }

  const originalJasmine = window.jasmine;
  const jasmineFacade = Object.create(originalJasmine);

  Object.defineProperty(jasmineFacade, "__legacyJasmineFacade", {
    value: true,
  });

  Object.defineProperty(jasmineFacade, "createSpy", {
    configurable: true,
    value: (...args) => decorateSpy(originalJasmine.createSpy.apply(originalJasmine, args)),
  });

  Object.defineProperty(jasmineFacade, "createSpyObj", {
    configurable: true,
    value: (...args) => {
      const spyObj = originalJasmine.createSpyObj.apply(originalJasmine, args);
      for (const value of Object.values(spyObj)) {
        decorateSpy(value);
      }
      return spyObj;
    },
  });

  window.jasmine = jasmineFacade;
};

const setupLegacyAsyncCompatibility = () => {
  window.runs = (fn) => enqueueLegacyAsyncStep(() => Promise.resolve(fn()));

  window.waitsFor = (...args) => {
    const { label, timeout, condition } = parseWaitsForArgs(args);
    return enqueueLegacyAsyncStep(() => waitForCondition(condition, label, timeout));
  };

  window.waits = (timeout = 0) => {
    return enqueueLegacyAsyncStep(
      () => new Promise((resolve) => realSetTimeout(resolve, timeout)),
    );
  };

  window.waitsForPromise = (...args) => {
    const { label, shouldReject, promiseFactory } = parseWaitsForPromiseArgs(args);
    return enqueueLegacyAsyncStep(() => {
      return Promise.resolve()
        .then(promiseFactory)
        .then(
          () => {
            if (shouldReject) {
              throw new Error(`Expected ${label} to be rejected, but it was resolved`);
            }
          },
          (error) => {
            if (!shouldReject) {
              throw error;
            }
          },
        );
    });
  };

  global.runs = window.runs;
  global.waits = window.waits;
  global.waitsFor = window.waitsFor;
  global.waitsForPromise = window.waitsForPromise;
};

const runWithLegacyAsyncQueue = (fn) => {
  const previousQueue = currentLegacyAsyncQueue;
  currentLegacyAsyncQueue = [];

  return Promise.resolve()
    .then(fn)
    .then(() => flushLegacyAsyncQueue())
    .finally(() => {
      currentLegacyAsyncQueue = previousQueue;
    });
};

const enqueueLegacyAsyncStep = (step) => {
  if (currentLegacyAsyncQueue == null) {
    return step();
  }
  currentLegacyAsyncQueue.push(step);
};

const flushLegacyAsyncQueue = async () => {
  while (currentLegacyAsyncQueue.length > 0) {
    const step = currentLegacyAsyncQueue.shift();
    await step();
  }
};

const parseWaitsForArgs = (args) => {
  let label = "condition";
  let timeout = 5000;
  let condition;

  if (typeof args[0] === "string") {
    label = args[0];
    if (typeof args[1] === "number") {
      timeout = args[1];
      condition = args[2];
    } else {
      condition = args[1];
      if (typeof args[2] === "number") {
        timeout = args[2];
      }
    }
  } else {
    condition = args[0];
    if (typeof args[1] === "string") {
      label = args[1];
    }
    if (typeof args[2] === "number") {
      timeout = args[2];
    } else if (typeof args[1] === "number") {
      timeout = args[1];
    }
  }

  return { label, timeout, condition };
};

const parseWaitsForPromiseArgs = (args) => {
  let label = "promise to be resolved or rejected";
  let shouldReject = false;
  let promiseFactory = args[0];

  if (args.length > 1 && typeof args[0] === "object") {
    label = args[0].label ?? label;
    shouldReject = args[0].shouldReject ?? false;
    promiseFactory = args[1];
  }

  return {
    label,
    shouldReject,
    promiseFactory: typeof promiseFactory === "function" ? promiseFactory : () => promiseFactory,
  };
};

const waitForCondition = (condition, label, timeout) => {
  if (typeof condition !== "function") {
    return Promise.resolve();
  }

  if (condition.length > 0) {
    return new Promise((resolve, reject) => {
      const timeoutId = realSetTimeout(
        () => reject(new Error(`Timed out waiting for ${label}`)),
        timeout,
      );
      condition(() => {
        realClearTimeout(timeoutId);
        resolve();
      });
    });
  }

  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      let result;
      try {
        result = condition();
      } catch (error) {
        reject(error);
        return;
      }

      if (result) {
        resolve();
      } else if (Date.now() - startedAt > timeout) {
        reject(new Error(`Timed out waiting for ${label}`));
      } else {
        realSetTimeout(check, 100);
      }
    };

    check();
  });
};

const decorateSpy = (spy) => {
  if (typeof spy !== "function" || spy.__legacySpyCompatibility) {
    return spy;
  }

  Object.defineProperty(spy, "__legacySpyCompatibility", {
    value: true,
  });

  spy.andCallFake = (fn) => spy.and.callFake(fn);
  spy.andCallThrough = () => spy.and.callThrough();
  spy.andReturn = (value) => spy.and.returnValue(value);
  spy.andThrow = (error) => spy.and.throwError(error);
  spy.reset = () => spy.calls.reset();

  Object.defineProperty(spy, "callCount", {
    configurable: true,
    get() {
      return spy.calls.count();
    },
    set(value) {
      if (value === 0) {
        spy.calls.reset();
      }
    },
  });

  Object.defineProperty(spy, "mostRecentCall", {
    configurable: true,
    get() {
      return spy.calls.mostRecent();
    },
  });

  Object.defineProperty(spy, "argsForCall", {
    configurable: true,
    get() {
      return spy.calls.allArgs();
    },
  });

  Object.defineProperty(spy, "wasCalled", {
    configurable: true,
    get() {
      return spy.calls.any();
    },
  });

  return spy;
};

const isSpy = (value) => {
  return window.jasmine.isSpy?.(value) || (typeof value === "function" && value.and != null && value.calls != null);
};

const isPendingException = (error) => {
  return error?.toString?.().includes("=> marked Pending") || false;
};

const failDone = (done, error) => {
  if (typeof done.fail === "function") {
    done.fail(error);
  } else {
    throw error;
  }
};

const resetJasmineEnv = () => {
  if (jasmine.private?.currentEnv_ != null) {
    jasmine.private.currentEnv_ = null;
  } else {
    jasmine.currentEnv_ = null;
  }
  specMetadataById.clear();
};

const setSpecFilter = (specFilter) => {
  configureJasmineEnv({ specFilter });
};

const configureJasmineEnv = (config) => {
  const jasmineEnv = jasmine.getEnv();
  if (typeof jasmineEnv.configure === "function") {
    jasmineEnv.configure(config);
  } else {
    Object.assign(jasmineEnv, config);
  }
};

const getSpecFullName = (spec) => {
  return spec.result?.fullName ?? spec.fullName ?? spec.getFullName?.();
};

function disableFocusMethods() {
  for (let methodName of ["fdescribe", "fit"]) {
    let focusMethod = window[methodName];
    window[methodName] = function (description) {
      const error = new Error("Focused spec is running on CI");
      return focusMethod(description, () => {
        throw error;
      });
    };
  }
}

const loadSpecsAndRunThem = (logFile, headless, testPaths) => {
  return new Promise((resolve) => {
    const jasmineEnv = jasmine.getEnv();
    // jasmine 3+ randomizes spec order by default; these specs assume the
    // deterministic order they had under jasmine 2, so keep it sequential.
    configureJasmineEnv({ forbidDuplicateNames: false, random: false });

    // Load before and after hooks, custom matchers
    require("../helpers/jasmine2-custom-matchers").register(jasmineEnv);
    require("../helpers/jasmine2-spies").register(jasmineEnv);
    require("../helpers/jasmine2-time").register(jasmineEnv);
    require("../helpers/jasmine2-warnings").register(jasmineEnv);

    // Load specs and set spec type
    for (let testPath of Array.from(testPaths)) {
      requireSpecs(testPath);
    }
    setSpecType("user");

    // Add the reporter and register the promise resolve as a callback
    jasmineEnv.addReporter(buildMetadataReporter());
    jasmineEnv.addReporter(buildReporter({ logFile, headless }));
    jasmineEnv.addReporter(buildRetryReporter(resolve));

    // And finally execute the tests
    jasmineEnv.execute();
  });
};

// This is a helper function to remove a file from the require cache.
// We are using this to force a re-evaluation of the test files when we need to re-run some flaky tests
const unrequire = (requiredPath) => {
  for (const path in require.cache) {
    if (path === requiredPath) {
      delete require.cache[path];
    }
  }
};

const requireSpecs = (testPath) => {
  if (fs.isDirectorySync(testPath)) {
    for (let testFilePath of fs.listTreeSync(testPath)) {
      if (/-spec\.js$/.test(testFilePath)) {
        unrequire(testFilePath);
        require(testFilePath);
        // Set spec directory on spec for setting up the project in spec-helper
        setSpecDirectory(testPath);
      }
    }
  } else {
    unrequire(testPath);
    require(testPath);
    setSpecDirectory(path.dirname(testPath));
  }
};

const setSpecField = (name, value) => {
  const specs = getRegisteredSpecs();
  if (specs.length === 0) {
    return;
  }

  for (let index = specs.length - 1; index >= 0; index--) {
    const spec = specs[index];
    if (spec[name] != null || spec.result?.[name] != null) {
      break;
    }
    spec[name] = value;
    if (spec.result != null) {
      spec.result[name] = value;
    }

    const metadata = specMetadataById.get(spec.id) ?? {};
    metadata[name] = value;
    specMetadataById.set(spec.id, metadata);
  }
};

const setSpecType = (specType) => setSpecField("specType", specType);

const setSpecDirectory = (specDirectory) => setSpecField("specDirectory", specDirectory);

const getRegisteredSpecs = () => {
  const specs = [];
  const visit = (suite) => {
    for (const child of suite.children ?? []) {
      if (child.children != null) {
        visit(child);
      } else {
        specs.push(child);
      }
    }
  };

  visit(jasmine.getEnv().topSuite());
  return specs;
};

const buildMetadataReporter = () => {
  return {
    specDone: (spec) => {
      Object.assign(spec, specMetadataById.get(spec.id));
    },
  };
};

const buildReporter = ({ logFile, headless }) => {
  if (headless) {
    return buildConsoleReporter(logFile);
  } else {
    const AtomReporter = require("../helpers/jasmine2-atom-reporter.js");
    return new AtomReporter();
  }
};

const buildRetryReporter = (onCompleteCallback) => {
  const failedSpecs = [];

  return {
    jasmineStarted: () => {},
    suiteStarted: () => {},
    specStarted: () => {},
    suiteDone: () => {},

    specDone: (spec) => {
      if (spec.status === "failed") {
        failedSpecs.push(spec);
      }
    },

    jasmineDone: () => {
      onCompleteCallback({
        failedSpecs,
        hasDeprecations: Grim.getDeprecationsLength() > 0,
      });
    },
  };
};

class Timer {
  constructor() {
    this.startTime = -1;
  }

  start() {
    this.startTime = performance.now();
  }

  elapsed() {
    return (performance.now() - this.startTime).toFixed(0);
  }
}

const buildConsoleReporter = (logFile) => {
  let logStream;
  if (logFile != null) {
    logStream = fs.openSync(logFile, "w");
  }

  const log = (str) => {
    if (logStream != null) {
      fs.writeSync(logStream, str);
    } else {
      ipcRenderer.send("write-to-stderr", str);
    }
  };

  const options = {
    print(str) {
      log(str);
    },
    onComplete() {
      if (logStream != null) {
        fs.closeSync(logStream);
      }
    },
    printDeprecation: (msg) => {
      console.log(msg);
    },
    timer: new Timer(),
  };

  if (process.env.ATOM_JASMINE_REPORTER === "list") {
    return new ListReporter(options);
  } else {
    const reporter = new ConsoleReporter();
    reporter.configure({
      print: log,
      color: process.stderr.isTTY,
    });

    const jasmineDone = reporter.jasmineDone.bind(reporter);
    reporter.jasmineDone = (result) => {
      jasmineDone(result);
      options.onComplete();
    };

    return reporter;
  }
};
