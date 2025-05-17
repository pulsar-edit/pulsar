const startTime = Date.now();
const StartupTime = require('../startup-time');
StartupTime.setStartTime();

const path = require('path');
const fs = require('fs-plus');
const CSON = require('season');
const yargs = require('yargs');
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    transparent: false,
    backgroundColor: '#FFF',
    hardwareAcceleration: false,
  });

  mainWindow.loadFile('index.html');
}

  mainWindow.on('minimize', () => {
    mainWindow.hide();
  });

  mainWindow.on('restore', () => {
    mainWindow.show();
  });
}

if (process.argv.includes('--screen-capture-mode')) {
  app.disableHardwareAcceleration();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const args = yargs(process.argv)
  // Don't handle --help or --version here; they will be handled later.
  .help(false)
  .version(false)
  .alias('d', 'dev')
  .alias('t', 'test')
  .alias('r', 'resource-path').argv;

function isAtomRepoPath(repoPath) {
  let packageJsonPath = path.join(repoPath, 'package.json');
  if (fs.statSyncNoException(packageJsonPath)) {
    try {
      let packageJson = CSON.readFileSync(packageJsonPath);
      return packageJson.name === 'atom';
    } catch (e) {
      return false;
    }
  }

  return false;
}

let resourcePath;
let devResourcePath;

if (args.resourcePath) {
  resourcePath = args.resourcePath;
  devResourcePath = resourcePath;
} else {
  const stableResourcePath = path.dirname(path.dirname(__dirname));
  const defaultRepositoryPath = path.join(
    // Setting the path for the app
    app.getPath('home'),
    'github',
    'pulsar'
  );

  if (process.env.ATOM_DEV_RESOURCE_PATH) {
    devResourcePath = process.env.ATOM_DEV_RESOURCE_PATH;
  } else if (isAtomRepoPath(process.cwd())) {
    devResourcePath = process.cwd();
  } else if (fs.statSyncNoException(defaultRepositoryPath)) {
    devResourcePath = defaultRepositoryPath;
  } else {
    devResourcePath = stableResourcePath;
  }

  if (args.dev || args.test) {
    resourcePath = devResourcePath;
  } else {
    resourcePath = stableResourcePath;
  }
}

const start = require(path.join(resourcePath, 'src', 'main-process', 'start'));
start(resourcePath, devResourcePath, startTime);
