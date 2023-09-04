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

function getConfigFilePath(opts = {}) {
  const fs = require("fs");
  const path = require("path");

  let configFilePath = [ "config.json", "config.cson" ].map(file =>
    path.join(process.env.ATOM_HOME, file)
  ).find(f => fs.existsSync(f));

  if (configFilePath) {
    return configFilePath;
  } else {
    if (opts.returnPlaceholder) {
      // This is only used when `./src/main-process/atom-application.js` initializes
      // the `ConfigFile` instance. Since it must provide a path, even if it turns
      // out the path doesn't exist. By default if the path doesn't exist then
      // `null` is returned.
      return path.join(process.env.ATOM_HOME, "config.cson");
    } else {
      return null;
    }
  }
}

module.exports = {
  getReleaseChannel,
  getAppName,
  getConfigFilePath,
};
