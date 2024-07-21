const { app } = require('electron');
const path = require('path');
const temp = require('temp');
const parseCommandLine = require('./parse-command-line');
const { getReleaseChannel, getConfigFilePath } = require('../get-app-details.js');
const atomPaths = require('../atom-paths');
const CSON = require('season');
const Config = require('../config');
const StartupTime = require('../startup-time');
const cp = require('child_process');

StartupTime.setStartTime();

module.exports = function start(resourcePath, devResourcePath, startTime) {
  global.shellStartTime = startTime;
  StartupTime.addMarker('main-process:start');

  process.on('uncaughtException', function (error = {}) {
    if (error.message != null) {
      console.log(error.message);
    }

    if (error.stack != null) {
      console.log(error.stack);
    }
  });

  process.on('unhandledRejection', function (error = {}) {
    if (error.message != null) {
      console.log(error.message);
    }

    if (error.stack != null) {
      console.log(error.stack);
    }
  });

  // TodoElectronIssue this should be set to true before Electron 12 - https://github.com/electron/electron/issues/18397
  app.allowRendererProcessReuse = false;

  app.commandLine.appendSwitch('enable-experimental-web-platform-features');

  const args = parseCommandLine(process.argv.slice(1));

  if (args.packageMode) {
    // Forward a command to `ppm`, then exit.
    ppmCommand(args.ppmArgs).then((exitCode) => {
      process.exit(exitCode);
    });
    return;
  }

  args.resourcePath = normalizeDriveLetterName(resourcePath);
  args.devResourcePath = normalizeDriveLetterName(devResourcePath);

  atomPaths.setAtomHome(app.getPath('home'));
  atomPaths.setUserData(app);

  const config = getConfig();
  const colorProfile = config.get('core.colorProfile');
  if (colorProfile && colorProfile !== 'default') {
    app.commandLine.appendSwitch('force-color-profile', colorProfile);
  }

  if (args.test && args.mainProcess) {
    app.setPath(
      'userData',
      temp.mkdirSync('atom-user-data-dir-for-main-process-tests')
    );
    app.on('ready', function () {
      const testRunner = require(path.join(
        args.resourcePath,
        'spec/main-process/mocha-test-runner'
      ));
      testRunner(args.pathsToOpen);
    });
    return;
  }

  const releaseChannel = getReleaseChannel(app.getVersion());
  let appUserModelId = 'dev.pulsar-edit.pulsar.' + process.arch;

  // If the release channel is not stable, we append it to the app user model id.
  // This allows having the different release channels as separate items in the taskbar.
  if (releaseChannel !== 'stable') {
    appUserModelId += `-${releaseChannel}`;
  }

  // NB: This prevents Win10 from showing dupe items in the taskbar.
  app.setAppUserModelId(appUserModelId);

  function addPathToOpen(event, pathToOpen) {
    event.preventDefault();
    args.pathsToOpen.push(pathToOpen);
  }

  function addUrlToOpen(event, urlToOpen) {
    event.preventDefault();
    args.urlsToOpen.push(urlToOpen);
  }

  app.on('open-file', addPathToOpen);
  app.on('open-url', addUrlToOpen);

  if (args.userDataDir != null) {
    app.setPath('userData', args.userDataDir);
  } else if (args.test) {
    app.setPath('userData', temp.mkdirSync('atom-test-data'));
  }

  StartupTime.addMarker('main-process:electron-onready:start');
  app.on('ready', function () {
    StartupTime.addMarker('main-process:electron-onready:end');
    app.removeListener('open-file', addPathToOpen);
    app.removeListener('open-url', addUrlToOpen);
    const AtomApplication = require(path.join(
      args.resourcePath,
      'src',
      'main-process',
      'atom-application'
    ));
    AtomApplication.open(args);
  });
};

async function ppmCommand(ppmArgs) {
  const PackageManager = require('../package-manager');
  const ppmPath = PackageManager.possibleApmPaths();
  return new Promise((resolve) => {
    let child = cp.spawn(
      ppmPath,
      ppmArgs,
      { stdio: 'pipe' }
    );
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', resolve);
  });
}

function getConfig() {
  const config = new Config();

  let configFilePath = getConfigFilePath();

  if (configFilePath) {
    CSON.readFile(configFilePath, (error, data) => {
      // Duplicated from `./src/config-file.js`.reload()
      if (error) {
        console.log(error.message);
      } else {
        config.resetUserSettings(data);
      }
    });
  }

  return config;
}

function normalizeDriveLetterName(filePath) {
  if (process.platform === 'win32' && filePath) {
    return filePath.replace(
      /^([a-z]):/,
      ([driveLetter]) => driveLetter.toUpperCase() + ':'
    );
  } else {
    return filePath;
  }
}
