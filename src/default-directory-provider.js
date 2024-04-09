const {Directory} = require('pathwatcher');
const fs = require('fs-plus');
const path = require('path');
const url = require('url');

/**
 * @class DefaultDirectoryProvider
 */
module.exports = class DefaultDirectoryProvider {
  /**
   * @name directoryForURISync
   * @memberof DefaultDirectoryProvider
   * @desc Public: Create a Directory that corresponds to the specified URI.
   * @param {string} uri - The path to the directory to add. This is guaranteed
   * not to be contained by a {Directory} in `atom.project`.
   * @returns {Directory|null} Directory if the given URI is compatible with
   * this provider. `null` if the given URI is not compatible with this provider.
   */
  directoryForURISync(uri) {
    const normalizedPath = this.normalizePath(uri);
    const {host} = url.parse(uri);
    let directoryPath;
    if (host) {
       directoryPath = uri;
    }
    else if (!fs.isDirectorySync(normalizedPath) && fs.isDirectorySync(path.dirname(normalizedPath))) {
      directoryPath = path.dirname(normalizedPath);
    }
    else {
      directoryPath = normalizedPath;
    }
    // TODO: Stop normalizing the path in pathwatcher's Directory.
    const directory = new Directory(directoryPath);
    if (host) {
      directory.path = directoryPath;
      if (fs.isCaseInsensitive()) {
        directory.lowerCasePath = directoryPath.toLowerCase();
      }
    }
    return directory;
  }

  /**
   * @name directoryForURI
   * @memberof DefaultDirectoryProvider
   * @desc Public: Create a Directory that corresponds to the specified URI.
   * @param {string} uri - The path to the directory to add. This is guaranteed
   * not to be contained by a {Directory} in `atom.project`.
   * @returns {Promise} - A promise that resolves to:
   *    * {Directory} if the given URI is compatible with this provider.
   *    * `null` if the given URI is not compatible with this provider.
   */
  directoryForURI(uri) {
    return Promise.resolve(this.directoryForURISync(uri));
  }

  /**
   * @name normalizePath
   * @memberof DefaultDirectoryProvider
   * @desc Public: Normalizes path.
   * @param {string} uri - The path that should be normalized.
   * @returns {string} A normalized path.
   */
  normalizePath(uri) {
    let matchData, pathWithNormalizedDiskDriveLetter;
    // Normalize disk drive letter on Windows to avoid opening two buffers for the same file
    pathWithNormalizedDiskDriveLetter = uri;
    if (process.platform === 'win32' && (matchData = uri.match(/^([a-z]):/))) {
      pathWithNormalizedDiskDriveLetter = `${matchData[1].toUpperCase()}${uri.slice(1)}`;
    }
    return path.normalize(pathWithNormalizedDiskDriveLetter);
  }

};
