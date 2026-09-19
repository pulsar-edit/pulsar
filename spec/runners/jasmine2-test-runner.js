/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Grim = require('grim');
const fs = require('fs-plus');
const temp = require('temp');
const path = require('path');
const {ipcRenderer} = require('electron');
const ListReporter = require('../helpers/jasmine2-list-reporter');

temp.track();

module.exports = function ({logFile, headless, testPaths, buildAtomEnvironment}) {
  // Load Jasmine 2.x
  require('../helpers/jasmine2-singleton');
  defineJasmineHelpersOnWindow(jasmine.getEnv())

  // Build Atom Environment
  const { atomHome, applicationDelegate } = require('../helpers/build-atom-environment');
  window.atom = buildAtomEnvironment({
    applicationDelegate, window, document,
    configDirPath: atomHome,
    enablePersistence: false
  });

  // Load general helpers
  require('../../src/window');
  require('../helpers/normalize-comments');
  require('../helpers/document-title');
  require('../helpers/load-jasmine-stylesheet');
  require('../helpers/fixture-packages');
  require('../helpers/set-prototype-extensions');
  require('../helpers/default-timeout');
  require('../helpers/attach-to-dom');
  require('../helpers/deprecation-snapshots');
  require('../helpers/platform-filter');

  const jasmineContent = document.createElement('div');
  jasmineContent.setAttribute('id', 'jasmine-content');
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

      console.log('\n', '\n', `Retrying ${result.failedSpecs.length} spec(s)`, '\n', '\n');

      // Gather the full names of the failed specs - this is the closest to be a unique identifier for all specs
      const fullNamesOfFailedSpecs = result.failedSpecs.map((spec) => {
        return spec.fullName;
      })

      // Force-delete the current env - this way Jasmine will reset and we'll be able to re-run failed specs only. The next time the code calls getEnv(), it'll generate a new environment
      jasmine.currentEnv_ = null;

      // As all the jasmine helpers (it, describe, etc..) were registered to the previous environment, we need to re-set them on window
      defineJasmineHelpersOnWindow(jasmine.getEnv());

      // Set up a specFilter to disable all passing spec and re-run only the flaky ones
      jasmine.getEnv().specFilter = (spec) => {
        return fullNamesOfFailedSpecs.includes(spec.result.fullName);
      };

      // Run the specs again - due to the spec filter, only the failed specs will run this time
      return loadSpecsAndRunThem(logFile, headless, testPaths);
    }).then((result) => {
      // Some of the specs failed, we should return with a non-zero exit code
      if (result.failedSpecs.length !== 0) return 1;

      // Some of the tests had deprecation warnings, we should log them and return with a non-zero exit code
      if (result.hasDeprecations) {
        Grim.logDeprecations();
        return 1;
      }

      // Everything went good, time to return with a zero exit code
      return 0;
    })
};


const defineJasmineHelpersOnWindow = (jasmineEnv) => {
  for (let key in jasmineEnv) {
    window[key] = jasmineEnv[key];
  }

  ['it', 'fit', 'xit'].forEach((key) => {
    window[key] = (name, originalFn) => {
      jasmineEnv[key](name, async (done) => {
        const startedAt = Date.now();
        let recorded = false;
        const finish = () => {
          if (recorded) return;
          recorded = true;
          recordPhase('it', startedAt);
        };
        try {
          if (originalFn.length === 0) {
            await originalFn();
            finish();
            done();
          } else {
            originalFn(wrapDone(done, finish));
          }
        } catch (err) {
          finish();
          if (typeof err === 'string' && err.includes('Pending')) {
            // A test marked itself as pending. Swallow the exception and
            // proceed.
            return;
          }
          throw err;
        }
      });
    }
  });


  ['beforeEach', 'afterEach'].forEach((key) => {
    window[key] = (originalFn) => {
      jasmineEnv[key](async (done) => {
        const startedAt = Date.now();
        let recorded = false;
        const finish = () => {
          if (recorded) return;
          recorded = true;
          recordPhase(key, startedAt);
        };
        if (originalFn.length === 0) {
          await originalFn()
          finish();
          done();
        } else {
          originalFn(wrapDone(done, finish));
        }
      })
    }
  });
}

function disableFocusMethods() {
  for (let methodName of ['fdescribe', 'fit']) {
    let focusMethod = window[methodName];
    window[methodName] = function (description) {
      const error = new Error('Focused spec is running on CI');
      return focusMethod(description, () => { throw error; });
    }
  }
}

// TEMPORARY (troubleshooting): where does the wall-clock actually go? The
// Windows suite runs ~5x slower than Linux and macOS, and knowing whether
// that is setup, the spec bodies, or teardown narrows the search far more
// than any single theory. Teardown is the one to watch: Windows cannot
// delete a file while a handle is open, so per-spec temp cleanup racing the
// file watchers would retry with backoff.
const PHASE = {
  beforeEach: { ms: 0, n: 0 },
  it: { ms: 0, n: 0 },
  afterEach: { ms: 0, n: 0 }
};
// Jasmine hands hooks a `done` callback that carries extra properties (notably
// `done.fail`). Replacing it with a bare arrow function would silently drop
// those, so copy them across.
const wrapDone = (done, finish) => {
  const wrapped = (...args) => {
    finish();
    return done(...args);
  };
  for (const key of Object.keys(done)) wrapped[key] = done[key];
  if (typeof done.fail === "function") {
    wrapped.fail = (...args) => {
      finish();
      return done.fail(...args);
    };
  }
  return wrapped;
};

const recordPhase = (phase, startedAt) => {
  PHASE[phase].ms += Date.now() - startedAt;
  PHASE[phase].n += 1;
  // Report periodically rather than only at the end: a jasmineDone reporter
  // that implements just one method does not appear to be dispatched here, and
  // more importantly the Windows suite crashes often enough that an end-of-run
  // summary is lost exactly when it is most wanted.
  if (phase === 'it' && PHASE.it.n % 250 === 0) reportPhases();
};
const reportPhases = () => {
  const part = p =>
    `${p} ${(PHASE[p].ms / 1000).toFixed(1)}s over ${PHASE[p].n}`;
  console.log(
    `[phase-timing] platform=${process.platform} ` +
      [part('beforeEach'), part('it'), part('afterEach')].join('  ')
  );
};

// TEMPORARY (troubleshooting): measure how fast frames and timers actually
// tick in this window. The Windows CI suite runs ~5x slower than Linux and
// macOS with per-spec times clustering at one- and two-second boundaries,
// which looks like starved `requestAnimationFrame` — but that has been
// inferred from timings rather than measured. This measures it directly:
// count callbacks over a fixed 2s window, so the probe costs the same
// wall-clock time no matter what the answer is.
const probeFrameRate = () => {
  return new Promise(resolve => {
    let frames = 0;
    let timers = 0;
    const started = Date.now();
    const onFrame = () => { frames++; requestAnimationFrame(onFrame); };
    const onTimer = () => { timers++; setTimeout(onTimer, 0); };
    requestAnimationFrame(onFrame);
    setTimeout(onTimer, 0);
    setTimeout(() => {
      const elapsed = Date.now() - started;
      console.log(
        `[frame-probe] platform=${process.platform} ` +
          `rAF=${frames} callbacks in ${elapsed}ms (${(frames / (elapsed / 1000)).toFixed(1)}/s) ` +
          `setTimeout0=${timers} (${(timers / (elapsed / 1000)).toFixed(1)}/s)`
      );
      resolve();
    }, 2000);
  });
};

const loadSpecsAndRunThem = (logFile, headless, testPaths) => {
  return new Promise((resolve) => {
    const jasmineEnv = jasmine.getEnv();

    // Load before and after hooks, custom matchers
    require('../helpers/jasmine2-custom-matchers').register(jasmineEnv);
    require('../helpers/jasmine2-spies').register(jasmineEnv);
    require('../helpers/jasmine2-time').register(jasmineEnv);
    require('../helpers/jasmine2-warnings').register(jasmineEnv);

    // Load specs and set spec type
    for (let testPath of Array.from(testPaths)) { requireSpecs(testPath); }
    setSpecType('user');

    // Add the reporter and register the promise resolve as a callback
    jasmineEnv.addReporter(buildReporter({logFile, headless}));
    // Before the retry reporter: that one resolves the run promise, and a
    // reporter added after it can be cut off before it reports.
    jasmineEnv.addReporter({ jasmineDone: reportPhases });
    jasmineEnv.addReporter(buildRetryReporter(resolve));

    // And finally execute the tests, after the frame-rate probe above has
    // reported. TEMPORARY: remove with the rest of the slowness diagnosis.
    probeFrameRate().then(() => jasmineEnv.execute());
  })
}

// This is a helper function to remove a file from the require cache.
// We are using this to force a re-evaluation of the test files when we need to re-run some flaky tests
const unrequire = (requiredPath) => {
  for (const path in require.cache) {
    if (path === requiredPath) {
      delete require.cache[path];
    }
  }
}

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
  const specs = (new jasmine.JsApiReporter({})).specs();
  if (specs.length === 0) { return; }

  for (let index = specs.length - 1; index >= 0; index--) {
    if (specs[index][name] != null) { break; }
    specs[index][name] = value;
  }
};

const setSpecType = specType => setSpecField('specType', specType);

const setSpecDirectory = specDirectory => setSpecField('specDirectory', specDirectory);

const buildReporter = ({logFile, headless}) => {
  if (headless) {
    return buildConsoleReporter(logFile);
  } else {
    const AtomReporter = require('../helpers/jasmine2-atom-reporter.js');
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
      if (spec.status === 'failed') {
        failedSpecs.push(spec);
      }
    },

    jasmineDone: () => {
      onCompleteCallback({
        failedSpecs,
        hasDeprecations: Grim.getDeprecationsLength() > 0
      });
    }
  };
}

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
    logStream = fs.openSync(logFile, 'w');
  }

  const log = (str) => {
    if (logStream != null) {
      fs.writeSync(logStream, str);
    } else {
      ipcRenderer.send('write-to-stderr', str);
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
    timer: new Timer()
  };

  if (process.env.ATOM_JASMINE_REPORTER === 'list') {
    return new ListReporter(options);
  } else {
    return new jasmine.ConsoleReporter(options);
  }
};
