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

temp.track();

module.exports = function({logFile, headless, testPaths, buildAtomEnvironment}) {
  const object = require('../vendor/jasmine');
  for (let key in object) { const value = object[key]; window[key] = value; }

  require('jasmine-tagged');

  // Rewrite global jasmine functions to have support for async tests.
  // This way packages can create async specs without having to import these from the
  // async-spec-helpers file.
  global.it = asyncifyJasmineFn(global.it, 1);
  global.fit = asyncifyJasmineFn(global.fit, 1);
  global.ffit = asyncifyJasmineFn(global.ffit, 1);
  global.fffit = asyncifyJasmineFn(global.fffit, 1);
  global.beforeEach = asyncifyJasmineFn(global.beforeEach, 0);
  global.afterEach = asyncifyJasmineFn(global.afterEach, 0);

  // Allow document.title to be assigned in specs without screwing up spec window title
  let documentTitle = null;
  Object.defineProperty(document, 'title', {
    get() { return documentTitle; },
    set(title) { return documentTitle = title; }
  }
  );

  const userHome = process.env.ATOM_HOME || path.join(fs.getHomeDirectory(), '.atom');
  const atomHome = temp.mkdirSync({prefix: 'atom-test-home-'});
  if (process.env.APM_TEST_PACKAGES) {
    const testPackages = process.env.APM_TEST_PACKAGES.split(/\s+/);
    fs.makeTreeSync(path.join(atomHome, 'packages'));
    for (let packName of Array.from(testPackages)) {
      const userPack = path.join(userHome, 'packages', packName);
      const loadablePack = path.join(atomHome, 'packages', packName);

      try {
        fs.symlinkSync(userPack, loadablePack, 'dir');
      } catch (error) {
        fs.copySync(userPack, loadablePack);
      }
    }
  }

  const ApplicationDelegate = require('../src/application-delegate');
  const applicationDelegate = new ApplicationDelegate();
  applicationDelegate.setRepresentedFilename = function() {};
  applicationDelegate.setWindowDocumentEdited = function() {};
  window.atom = buildAtomEnvironment({
    applicationDelegate, window, document,
    configDirPath: atomHome,
    enablePersistence: false
  });

  require('./spec-helper');
  if (process.env.JANKY_SHA1 || process.env.CI) { disableFocusMethods(); }
  for (let testPath of Array.from(testPaths)) { requireSpecs(testPath); }

  setSpecType('user');

  let resolveWithExitCode = null;
  const promise = new Promise((resolve, reject) => resolveWithExitCode = resolve);
  const jasmineEnv = jasmine.getEnv();
  jasmineEnv.addReporter(buildReporter({logFile, headless, resolveWithExitCode}));

  if(process.env.SPEC_FILTER) {
    const {getFullDescription} = require('./jasmine-list-reporter');
    const regex = new RegExp(process.env.SPEC_FILTER)
    jasmineEnv.specFilter = (spec) => getFullDescription(spec, false).match(regex)
  }

  if (process.env.TEST_JUNIT_XML_PATH) {
    const {JasmineJUnitReporter} = require('./jasmine-junit-reporter');
    process.stdout.write(`Outputting JUnit XML to <${process.env.TEST_JUNIT_XML_PATH}>\n`);
    const outputDir = path.dirname(process.env.TEST_JUNIT_XML_PATH);
    const fileBase = path.basename(process.env.TEST_JUNIT_XML_PATH, '.xml');

    jasmineEnv.addReporter(new JasmineJUnitReporter(outputDir, true, false, fileBase, true));
  }

  jasmineEnv.setIncludedTags([process.platform]);

  const jasmineContent = document.createElement('div');
  jasmineContent.setAttribute('id', 'jasmine-content');

  document.body.appendChild(jasmineContent);

  jasmineEnv.execute();
  return promise;
};

var asyncifyJasmineFn = (fn, callbackPosition) => (function(...args) {
  if (typeof args[callbackPosition] === 'function') {
    const callback = args[callbackPosition];

    args[callbackPosition] = function(...args) {
      const result = callback.apply(this, args);
      if (result instanceof Promise) {
        return waitsForPromise(() => result);
      }
    };
  }

  return fn.apply(this, args);
});

var waitsForPromise = function(fn) {
  const promise = fn();

  return global.waitsFor('spec promise to resolve', done => promise.then(done, function(error) {
    jasmine.getEnv().currentSpec.fail(error);
    return done();
  }));
};

var disableFocusMethods = () => ['fdescribe', 'ffdescribe', 'fffdescribe', 'fit', 'ffit', 'fffit'].forEach(function(methodName) {
  const focusMethod = window[methodName];
  return window[methodName] = function(description) {
    const error = new Error('Focused spec is running on CI');
    return focusMethod(description, function() { throw error; });
  };
});

var requireSpecs = function(testPath, specType) {
  if (fs.isDirectorySync(testPath)) {
    return (() => {
      const result = [];
      for (let testFilePath of Array.from(fs.listTreeSync(testPath))) {
        if (/-spec\.(coffee|js)$/.test(testFilePath)) {
          require(testFilePath);
          // Set spec directory on spec for setting up the project in spec-helper
          result.push(setSpecDirectory(testPath));
        }
      }
      return result;
    })();
  } else {
    require(testPath);
    return setSpecDirectory(path.dirname(testPath));
  }
};

const setSpecField = function(name, value) {
  const specs = jasmine.getEnv().currentRunner().specs();
  if (specs.length === 0) { return; }
  return (() => {
    const result = [];
    for (let start = specs.length-1, index = start, asc = start <= 0; asc ? index <= 0 : index >= 0; asc ? index++ : index--) {
      if (specs[index][name] != null) { break; }
      result.push(specs[index][name] = value);
    }
    return result;
  })();
};

var setSpecType = specType => setSpecField('specType', specType);

var setSpecDirectory = specDirectory => setSpecField('specDirectory', specDirectory);

var buildReporter = function({logFile, headless, resolveWithExitCode}) {
  if (headless) {
    return buildTerminalReporter(logFile, resolveWithExitCode);
  } else {
    let reporter;
    const AtomReporter = require('./atom-reporter.js');
    return reporter = new AtomReporter();
  }
};

var buildTerminalReporter = function(logFile, resolveWithExitCode) {
  let logStream;
  if (logFile != null) { logStream = fs.openSync(logFile, 'w'); }
  const log = function(str) {
    if (logStream != null) {
      return fs.writeSync(logStream, str);
    } else {
      return ipcRenderer.send('write-to-stderr', str);
    }
  };

  const options = {
    print(str) {
      return log(str);
    },
    onComplete(runner) {
      if (logStream != null) { fs.closeSync(logStream); }
      if (Grim.getDeprecationsLength() > 0) {
        Grim.logDeprecations();
        resolveWithExitCode(1);
        return;
      }

      if (runner.results().failedCount > 0) {
        return resolveWithExitCode(1);
      } else {
        return resolveWithExitCode(0);
      }
    }
  };

  if (process.env.ATOM_JASMINE_REPORTER === 'list') {
    const {JasmineListReporter} = require('./jasmine-list-reporter');
    return new JasmineListReporter(options);
  } else {
    const {TerminalReporter} = require('jasmine-tagged');
    return new TerminalReporter(options);
  }
};
