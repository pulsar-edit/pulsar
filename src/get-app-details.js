// External modules must be imported within each function. As the context
// (eg renderer or main process) is different depending on where these functions
// are being called.

function getReleaseChannel(version) {
  // This matches stable, dev (with or without commit hash) and any other
  // release channel following the pattern '1.00.0-channel0'
  const match = version.match(/\d+\.\d+\.\d+(-([a-z]+)(\d+|-\w{4,})?)?$/);
  if (!match) {
    return "unrecognized";
  } else if (match[2]) {
    return match[2];
  }

  return "stable";
}

function getAppName() {
  const { app } = require("electron");

  if (process.type === "renderer") {
    return atom.getAppName();
  }

  const releaseChannel = getReleaseChannel(app.getVersion());
  const appNameParts = [app.getName()];

  if (releaseChannel !== "stable") {
    appNameParts.push(
      releaseChannel.charAt(0).toUpperCase() + releaseChannel.slice(1)
    );
  }

  return appNameParts.join(" ");
}

function getConfigFilePath() {
  const fs = require("fs");
  const path = require("path");

  let configFilePath = [ "config.json", "config.cson" ].map(file =>
    path.join(process.env.ATOM_HOME, file)
  ).find(f => fs.existsSync(f));

  if (configFilePath) {
    return configFilePath;
  } else {
    return null;
  }
}

function getPlaceholderConfigFilePath() {
  // This is only used when `./src/main-process/atom-application.js` initializes
  // the `ConfigFile` instance. Since it passes the config file path, without any
  // recovery logic for being unable to find it, we must provide a path to `ConfigFile`
  // even if incorrect. Instead of passing `null` on being unable to find the config.
  const path = require("path");

  return path.join(process.env.ATOM_HOME, "config.cson");
}

module.exports = {
  getReleaseChannel,
  getAppName,
  getConfigFilePath,
  getPlaceholderConfigFilePath,
};
