const Module = require('module');
const path = require('path');
const getWindowLoadSettings = require('./get-window-load-settings');
const { apis, apiConsumer } = require('./services/pulsar-apis');

// a require function with both ES5 and ES6 default export support
function requireModule(path) {
  const modul = require(path);
  if (modul === null || modul === undefined) {
    // if null do not bother
    return modul;
  } else {
    if (
      modul.__esModule === true &&
      (modul.default !== undefined && modul.default !== null)
    ) {
      // __esModule flag is true and default is exported, which means that
      // an object containing the main functions (e.g. activate, etc) is default exported
      return modul.default;
    } else {
      return modul;
    }
  }
}

function addAtomExport(globalAtom) {
  const exportsPath = path.join(
    getWindowLoadSettings().resourcePath,
    'exports'
  );
  Module.globalPaths.push(exportsPath);
  process.env.NODE_PATH = exportsPath; // Set NODE_PATH env variable since tasks may need it.
  patchRequire(globalAtom);
}

const originalLoad = Module._load;
function patchRequire(globalAtom) {
  globalAtom.packages.serviceHub.consume('pulsar.api', '0.1.0', apiConsumer);
  Module._load = function(request, parent, isMain) {
    const fromProvider = apis.get(request)
    if (fromProvider) {
      return fromProvider.exports || fromProvider.exportFunction()
    }
    return originalLoad(request, parent, isMain);
  };
}

module.exports = { requireModule, addAtomExport };
