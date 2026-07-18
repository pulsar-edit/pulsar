const FS = require("@lumine-code/fs-plus");
const Path = require("path");

// A minimal, watch-free directory value object returned by
// `DefaultDirectoryProvider` for `atom.project`. It is the path-helper subset
// of the old pathwatcher `Directory` — with no filesystem watching (the project
// watches its roots through `watchPath`) and no public `require('atom').Directory`
// export. The path semantics match pathwatcher's `Directory` so that project
// management, `contains`/`relativize`, and repository discovery are unaffected.
module.exports = class ProjectDirectory {
  constructor(directoryPath) {
    if (directoryPath) {
      directoryPath = Path.normalize(directoryPath);
      if (directoryPath.length > 1 && directoryPath.endsWith(Path.sep)) {
        directoryPath = directoryPath.substring(0, directoryPath.length - 1);
      }
    }
    this.path = directoryPath;
    if (FS.isCaseInsensitive()) {
      this.lowerCasePath = this.path.toLowerCase();
    }
  }

  getPath() {
    return this.path;
  }

  getBaseName() {
    return Path.basename(this.path);
  }

  exists() {
    return new Promise((resolve) => FS.exists(this.getPath(), resolve));
  }

  existsSync() {
    return FS.existsSync(this.getPath());
  }

  getRealPathSync() {
    if (!this.realPath) {
      try {
        this.realPath = FS.realpathSync(this.path);
        if (FS.isCaseInsensitive()) this.lowerCaseRealPath = this.realPath.toLowerCase();
      } catch {
        this.realPath = this.path;
        if (FS.isCaseInsensitive()) this.lowerCaseRealPath = this.lowerCasePath;
      }
    }
    return this.realPath;
  }

  getParent() {
    return new ProjectDirectory(Path.join(this.path, ".."));
  }

  isRoot() {
    return this.getRealPathSync() === this.getParent().getRealPathSync();
  }

  resolve(relativePath) {
    if (!relativePath) return;
    if (relativePath.match(/[A-Za-z0-9+-.]+:\/\//)) {
      // Leave the path alone if it has a scheme.
      return relativePath;
    } else if (FS.isAbsolute(relativePath)) {
      return Path.normalize(FS.resolveHome(relativePath));
    } else {
      return Path.normalize(FS.resolveHome(Path.join(this.getPath(), relativePath)));
    }
  }

  relativize(fullPath) {
    if (!fullPath) return fullPath;
    if (process.platform === "win32") fullPath = fullPath.replace(/\//g, "\\");

    let pathToCheck;
    let directoryPath;
    if (FS.isCaseInsensitive()) {
      pathToCheck = fullPath.toLowerCase();
      directoryPath = this.lowerCasePath;
    } else {
      pathToCheck = fullPath;
      directoryPath = this.path;
    }

    if (pathToCheck === directoryPath) {
      return "";
    } else if (this.isPathPrefixOf(directoryPath, pathToCheck)) {
      return fullPath.substring(directoryPath.length + 1);
    }

    // Check the real path.
    this.getRealPathSync();
    directoryPath = FS.isCaseInsensitive() ? this.lowerCaseRealPath : this.realPath;

    if (pathToCheck === directoryPath) {
      return "";
    } else if (this.isPathPrefixOf(directoryPath, pathToCheck)) {
      return fullPath.substring(directoryPath.length + 1);
    } else {
      return fullPath;
    }
  }

  contains(pathToCheck) {
    if (!pathToCheck) return false;
    if (process.platform === "win32") pathToCheck = pathToCheck.replace(/\//g, "\\");

    let directoryPath;
    if (FS.isCaseInsensitive()) {
      directoryPath = this.lowerCasePath;
      pathToCheck = pathToCheck.toLowerCase();
    } else {
      directoryPath = this.path;
    }

    if (this.isPathPrefixOf(directoryPath, pathToCheck)) return true;

    // Check the real path.
    this.getRealPathSync();
    directoryPath = FS.isCaseInsensitive() ? this.lowerCaseRealPath : this.realPath;
    return this.isPathPrefixOf(directoryPath, pathToCheck);
  }

  isPathPrefixOf(prefix, fullPath) {
    return fullPath.startsWith(prefix) && fullPath[prefix.length] === Path.sep;
  }
};
