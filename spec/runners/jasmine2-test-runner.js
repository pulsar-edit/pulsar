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
  // Load Jasmine 2.x
  require('../helpers/jasmine2-singleton');
  require('../helpers/jasmine2-custom-matchers');

  // Load helpers
  require('../helpers/normalize-comments');
  require('../helpers/document-title');

  // Build Atom Environment
  const { atomHome, applicationDelegate } = require('../helpers/build-atom-environment');
  window.atom = buildAtomEnvironment({
    applicationDelegate, window, document,
    configDirPath: atomHome,
    enablePersistence: false
  });

  require('../../src/window');
  require('../helpers/load-jasmine-stylesheet');
  require('../helpers/fixture-packages');
  require('../helpers/set-prototype-extensions');
  require('../helpers/jasmine2-spies');
  require('../helpers/jasmine2-time');
  require('../helpers/jasmine2-warnings');
  require('../helpers/default-timeout');
  require('../helpers/attach-to-dom');
  require('../helpers/deprecation-snapshots');
  require('../helpers/platform-filter');

  for (let testPath of Array.from(testPaths)) { requireSpecs(testPath); }

  setSpecType('user');

  let resolveWithExitCode = null;
  const promise = new Promise((resolve, reject) => resolveWithExitCode = resolve);
  const jasmineEnv = jasmine.getEnv();
  jasmineEnv.addReporter(buildReporter({logFile, headless, resolveWithExitCode}));

  const jasmineContent = document.createElement('div');
  jasmineContent.setAttribute('id', 'jasmine-content');

  document.body.appendChild(jasmineContent);

  jasmine.getEnv().execute();
  return promise;
};

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
  const specs = (new jasmine.JsApiReporter({})).specs();
  if (specs.length === 0) { return; }

  for (let index = specs.length - 1; index >= 0; index--) {
    if (specs[index][name] != null) { break; }
    specs[index][name] = value;
  }
};

var setSpecType = specType => setSpecField('specType', specType);

var setSpecDirectory = specDirectory => setSpecField('specDirectory', specDirectory);

var buildReporter = function({logFile, headless, resolveWithExitCode}) {
  if (headless) {
    return buildTerminalReporter(logFile, resolveWithExitCode);
  } else {
    const AtomReporter = require('./atom-reporter.js');
    return new AtomReporter();
  }
};

var buildTerminalReporter = function(logFile, resolveWithExitCode) {
  let logStream;
  if (logFile != null) { logStream = fs.openSync(logFile, 'w'); }
  const log = function(str) {
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
    onComplete(failureCountIsZero) {
      if (logStream != null) { fs.closeSync(logStream); }
      if (Grim.getDeprecationsLength() > 0) {
        Grim.logDeprecations();
        resolveWithExitCode(1);
        return;
      }

      if (!failureCountIsZero) {
        return resolveWithExitCode(1);
      } else {
        return resolveWithExitCode(0);
      }
    },
    printDeprecation: (msg) => {
      console.log(msg)
    }
  };

  return new jasmine.ConsoleReporter(options);
};
