const startTime = Date.now();
const StartupTime = require("./startup-time");
StartupTime.setStartTime();

const path = require("path");
const fs = require("@lumine-code/fs-plus");
const CSON = require("@lumine-code/season");
const yargs = require("yargs");
const { app, protocol } = require("electron");

// Declare the `atom://` scheme privileged before the app is ready, so packages
// can load fonts and use fetch/XHR against atom:// URLs from the file://
// renderer (otherwise Chromium blocks them as cross-origin/CORS violations).
protocol.registerSchemesAsPrivileged([
  {
    scheme: "atom",
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

const args = yargs(process.argv)
  // Don't handle --help or --version here; they will be handled later.
  .help(false)
  .version(false)
  .alias("d", "dev")
  .alias("t", "test")
  .alias("r", "resource-path").argv;

function isAtomRepoPath(repoPath) {
  let packageJsonPath = path.join(repoPath, "package.json");
  if (fs.statSyncNoException(packageJsonPath)) {
    try {
      let packageJson = CSON.readFileSync(packageJsonPath);
      return packageJson.name === "lumine";
    } catch {
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
    app.getPath("home"),
    "github",
    "lumine",
  );

  if (process.env.LUMINE_RESOURCE_PATH) {
    devResourcePath = process.env.LUMINE_RESOURCE_PATH;
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

const start = require(path.join(resourcePath, "src", "start"));
start(resourcePath, devResourcePath, startTime);
