const AtomEnvironment = require('./atom-environment');
const ApplicationDelegate = require('./application-delegate');
const Clipboard = require('./clipboard');
const TextEditor = require('./text-editor');

require('./text-editor-component');
require('./file-system-blob-store');
require('./native-compile-cache');
require('./compile-cache');
require('./module-cache');

const clipboard = new Clipboard();
TextEditor.setClipboard(clipboard);
TextEditor.viewForItem = item => atom.views.getView(item);

global.atom = new AtomEnvironment({
  clipboard,
  applicationDelegate: new ApplicationDelegate(),
  enablePersistence: true
});

TextEditor.setScheduler(global.atom.views);
global.atom.preloadPackages();

// Like sands through the hourglass, so are the days of our lives.
module.exports = function({ blobStore }) {
  const { updateProcessEnv } = require('./update-process-env');
  const path = require('path');
  require('./window');
  const getWindowLoadSettings = require('./get-window-load-settings');
  const { ipcRenderer } = require('electron');
  const { resourcePath, devMode } = getWindowLoadSettings();
  require('./electron-shims');
  const Module = require('module');

  // Add application-specific exports to module search path.
  const exportsPath = path.join(resourcePath, 'exports');

  // `Module.globalPaths` is no longer a thing. Wrapping this function ensures
  // that the `exports` folder is treated as a search path of last resort for
  // global modules; this allows `require('clipboard')` and the like to keep
  // working even though Electron has deprecated them.
  const _originalResolveLookupPaths = Module._resolveLookupPaths;
  Module._resolveLookupPaths = function (request, parent) {
    const original = _originalResolveLookupPaths(request, parent);
    const firstChar = request.charAt(0);
    const isRelativeOrAbsolute = firstChar === '.' || firstChar === '/';
    if (isRelativeOrAbsolute || original === null) {
      return original;
    }
    return original.concat(exportsPath);
  };

  process.env.NODE_PATH = exportsPath;

  // Make React faster
  if (!devMode && process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'production';
  }

  global.atom.initialize({
    window,
    document,
    blobStore,
    configDirPath: process.env.ATOM_HOME,
    env: process.env
  });

  return global.atom.startEditorWindow().then(function() {
    // Workaround for focus getting cleared upon window creation
    const windowFocused = function() {
      window.removeEventListener('focus', windowFocused);
      setTimeout(() => document.querySelector('atom-workspace').focus(), 0);
    };
    window.addEventListener('focus', windowFocused);

    ipcRenderer.on('environment', (event, env) => updateProcessEnv(env));
  });
};
