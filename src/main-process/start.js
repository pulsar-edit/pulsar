const { app, crashReporter } = require('electron');
const path = require('path');
const temp = require('temp');
const parseCommandLine = require('./parse-command-line');
const { getReleaseChannel, getConfigFilePath } = require('../get-app-details.js');
const atomPaths = require('../atom-paths');
const fs = require('fs');
const CSON = require('season');
const Config = require('../config');
const StartupTime = require('../startup-time');

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

  app.commandLine.appendSwitch('enable-experimental-web-platform-features');

  const args = parseCommandLine(process.argv.slice(1));

  args.resourcePath = normalizeDriveLetterName(resourcePath);
  args.devResourcePath = normalizeDriveLetterName(devResourcePath);

  const releaseChannel = getReleaseChannel(app.getVersion());
  process.env.ATOM_CHANNEL ??= releaseChannel;
  atomPaths.setAtomHome(app.getPath('home'));
  atomPaths.setUserData(app);

  // Now that we can be sure `ATOM_HOME` is set, we can set our custom crash
  // dump path.
  app.setPath('crashDumps', path.resolve(process.env.ATOM_HOME, 'crashdumps'))

  // By default, we're using the crash reporter on Windows and Linux, but not
  // macOS. That's because:
  //
  // * macOS already generates great crash reports with stacktraces
  //   (Console.app -> Crash Reports);
  // * if we enable crash reporting, thse crash reports stop being generated,
  //   even when `ignoreSystemCrashHandler` is `false`.
  //
  // Still, it's nice to have a way to opt into the crash reporter even on
  // macOS. Hence the `--crashdump` command-line switch.
  let shouldStartCrashReporter = args.useCrashReporter || process.platform !== 'darwin';
  if (shouldStartCrashReporter) {
    console.log("Starting crash reporter; crash reports will be saved to", app.getPath('crashDumps'))
    crashReporter.start({
      productName: 'PulsarNext',
      companyName: 'Pulsar-Edit',
      submitURL: '',
      uploadToServer: false,
      ignoreSystemCrashHandler: false,
      compress: false
    });
  }

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
