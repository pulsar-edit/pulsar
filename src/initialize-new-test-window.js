const ipcHelpers = require('./ipc-helpers');
const { requireModule } = require('./module-utils');
const fs = require('fs');
const path = require('path');
const vm = require('vm')

module.exports = async function({ blobStore }) {
  const { remote } = require('electron');
  const getWindowLoadSettings = require('./get-window-load-settings');

  console.log("WATTT????")

  const exitWithStatusCode = function(status) {
    remote.app.emit('will-quit');
    remote.process.exit(status);
  };

  try {
    const path = require('path');
    const { ipcRenderer } = require('electron');
    const CompileCache = require('./compile-cache');
    const AtomEnvironment = require('../src/atom-environment');
    const ApplicationDelegate = require('../src/application-delegate');
    const Clipboard = require('../src/clipboard');
    const TextEditor = require('../src/text-editor');
    const { updateProcessEnv } = require('./update-process-env');
    require('./electron-shims');

    ipcRenderer.on('environment', (event, env) => updateProcessEnv(env));

    const {
      testRunnerPath,
      headless,
      logFile,
      testPaths,
      env
    } = getWindowLoadSettings();

    if (headless) {
      // Install console functions that output to stdout and stderr.
      const util = require('util');

      Object.defineProperties(process, {
        stdout: { value: remote.process.stdout },
        stderr: { value: remote.process.stderr }
      });

      console.log = (...args) =>
        process.stdout.write(`${util.format(...args)}\n`);
      console.error = (...args) =>
        process.stderr.write(`${util.format(...args)}\n`);
    } else {
      // Show window synchronously so a focusout doesn't fire on input elements
      // that are focused in the very first spec run.
      remote.getCurrentWindow().show();
    }

    const handleKeydown = function(event) {
      // Reload: cmd-r / ctrl-r
      if ((event.metaKey || event.ctrlKey) && event.keyCode === 82) {
        ipcHelpers.call('window-method', 'reload');
      }

      // Toggle Dev Tools: cmd-alt-i (Mac) / ctrl-shift-i (Linux/Windows)
      if (
        event.keyCode === 73 &&
        ((process.platform === 'darwin' && event.metaKey && event.altKey) ||
          (process.platform !== 'darwin' && event.ctrlKey && event.shiftKey))
      ) {
        ipcHelpers.call('window-method', 'toggleDevTools');
      }

      // Close: cmd-w / ctrl-w
      if ((event.metaKey || event.ctrlKey) && event.keyCode === 87) {
        ipcHelpers.call('window-method', 'close');
      }

      // Copy: cmd-c / ctrl-c
      if ((event.metaKey || event.ctrlKey) && event.keyCode === 67) {
        atom.clipboard.write(window.getSelection().toString());
      }
    };

    window.addEventListener('keydown', handleKeydown, { capture: true });

    // Add 'exports' to module search path.
    const exportsPath = path.join(
      getWindowLoadSettings().resourcePath,
      'exports'
    );
    // require('module').globalPaths.push(exportsPath);
    process.env.NODE_PATH = exportsPath; // Set NODE_PATH env variable since tasks may need it.

    updateProcessEnv(env);

    // Set up optional transpilation for packages under test if any
    const FindParentDir = require('find-parent-dir');
    const packageRoot = FindParentDir.sync(testPaths[0], 'package.json');
    if (packageRoot) {
      const packageMetadata = require(path.join(packageRoot, 'package.json'));
      if (packageMetadata.atomTranspilers) {
        CompileCache.addTranspilerConfigForPath(
          packageRoot,
          packageMetadata.name,
          packageMetadata,
          packageMetadata.atomTranspilers
        );
      }
    }

    document.title = 'Test Suite';

    const clipboard = new Clipboard();
    TextEditor.setClipboard(clipboard);
    TextEditor.viewForItem = item => atom.views.getView(item);

    // const testRunner = requireModule(testRunnerPath);
    const buildDefaultApplicationDelegate = () => new ApplicationDelegate();
    const buildAtomEnvironment = function(params) {
      // params = Object.create(params);
      if (!params.hasOwnProperty('clipboard')) {
        params.clipboard = clipboard;
      }
      if (!params.hasOwnProperty('blobStore')) {
        params.blobStore = blobStore;
      }
      if (!params.hasOwnProperty('onlyLoadBaseStyleSheets')) {
        params.onlyLoadBaseStyleSheets = true;
      }
      const atomEnvironment = new AtomEnvironment(params);
      atomEnvironment.initialize(params);
      TextEditor.setScheduler(atomEnvironment.views);
      return atomEnvironment;
    };

    const applicationDelegate = new ApplicationDelegate();
    applicationDelegate.setRepresentedFilename = function() {};
    applicationDelegate.setWindowDocumentEdited = function() {};
    window.atom = buildAtomEnvironment({
      applicationDelegate, window, document
    })

    // Set load paths for the package's test runner
    let loadPaths = vm.runInThisContext('module.paths')
    testPaths.forEach(testPath => {
      let currentPath = testPath;
      while(currentPath !== path.dirname(currentPath)) {
        const modulesPath = path.join(currentPath, 'node_modules')
        if(fs.existsSync(modulesPath)) {
          loadPaths.unshift(modulesPath)
        }
        currentPath = path.dirname(currentPath);
      }
    })

    // }, 2000)


    prepareUI();
  //   // const statusCode = await testRunner({
  //   //   logFile,
  //   //   headless,
  //   //   testPaths,
  //   //   buildAtomEnvironment,
  //   //   buildDefaultApplicationDelegate,
  //   //   legacyTestRunner
  //   // });
  //
  //   // if (getWindowLoadSettings().headless) {
  //   //   exitWithStatusCode(statusCode);
  //   // }
  } catch (error) {
  //   // if (getWindowLoadSettings().headless) {
  //   //   console.error(error.stack || error);
  //   //   exitWithStatusCode(1);
  //   // } else {
      console.error(error.stack)
      throw error;
    // }
  }
}

function prepareUI() {
  // Requires mocha under the context of the new window
  vm.runInThisContext('const Mocha = require("mocha")')
  const Reporter = require('./mocha-test-runner/reporter')
  Reporter.setMocha(Mocha)

  let mocha = new Mocha()
  mocha.addFile(
    '/home/mauricio/projects/pulsar_repos/star-ring/test/star-linter-test.js'
  )
  mocha.reporter(Reporter)
  mocha.run()

  // const Workspace = require('./workspace');
  // const w = new Workspace()
  // p = new PanelContainer({
  //       viewRegistry: atom.workspace.viewRegistry,
  //       location: 'right',
  //       dock: d
  //     })
  // const workspace = document.createElement('atom-workspace')
  // document.body.append
}
