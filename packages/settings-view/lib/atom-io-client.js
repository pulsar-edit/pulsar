const fs = require('fs-plus');
const path = require('path');
const {remote} = require('electron');
const glob = require('glob');
const request = require('request');

module.exports = class AtomIoClient {
  constructor(packageManager, baseURL) {
    this.packageManager = packageManager;
    this.baseURL = baseURL;
    if (this.baseURL == null) { this.baseURL = 'https://api.pulsar-edit.dev/api/'; }
    // 5 hour expiry
    this.expiry = 1000 * 60 * 60 * 5;
    this.createAvatarCache();
    this.expireAvatarCache();
  }

  // Public: Get an avatar image from the filesystem, fetching it first if necessary
  avatar(login, callback) {
    this.cachedAvatar(login, (err, cached) => {
      let stale;
      if (cached) { stale = (Date.now() - parseInt(cached.split('-').pop())) > this.expiry; }
      if (cached && (!stale || !this.online())) {
        return callback(null, cached);
      } else {
        return this.fetchAndCacheAvatar(login, callback);
      }
    });
  }

  // Public: get a package from the atom.io API, with the appropriate level of
  // caching.
  package(name, callback) {
    const packagePath = `packages/${name}`;
    const data = this.fetchFromCache(packagePath);
    if (data) {
      return callback(null, data);
    } else {
      return this.request(packagePath, callback);
    }
  }

  featuredPackages(callback) {
    // TODO clean up caching copypasta
    const data = this.fetchFromCache('packages/featured');
    if (data) {
      return callback(null, data);
    } else {
      return this.getFeatured(false, callback);
    }
  }

  featuredThemes(callback) {
    // TODO clean up caching copypasta
    const data = this.fetchFromCache('themes/featured');
    if (data) {
      return callback(null, data);
    } else {
      return this.getFeatured(true, callback);
    }
  }

  getFeatured(loadThemes, callback) {
    // apm already does this, might as well use it instead of request i guess? The
    // downside is that I need to repeat caching logic here.
    this.packageManager.getFeatured(loadThemes)
      .then(packages => {
        // copypasta from below
        const key = loadThemes ? 'themes/featured' : 'packages/featured';
        const cached = this.deepCache(key, packages);
          // data: packages
          // createdOn: Date.now()
        // localStorage.setItem(@cacheKeyForPath(key), JSON.stringify(cached))
        // end copypasta
        return callback(null, packages);
    }).catch(error => callback(error, null));
  }

  request(path, callback) {
    const options = {
      url: `${this.baseURL}${path}`,
      headers: {'User-Agent': navigator.userAgent},
      gzip: true
    };

    request(options, (err, res, body) => {
      if (err) { return callback(err); }

      try {
        // NOTE: request's json option does not populate err if parsing fails,
        // so we do it manually
        body = this.parseJSON(body);
        delete body.versions;

        const cached = this.deepCache(path, body);
        // cached =
        //   data: body
        //   createdOn: Date.now()
        // localStorage.setItem(@cacheKeyForPath(path), JSON.stringify(cached))
        return callback(err, cached.data);
      } catch (error) {
        return callback(error);
      }
    });
  }

  deepCache(path, body) {
    const cached = {
      data: body,
      createdOn: Date.now()
    };
    localStorage.setItem(this.cacheKeyForPath(path), JSON.stringify(cached));
    if(body instanceof Array) {
      body.forEach(child => this.deepCache(`packages/${child.name}`, child));
    }
    return cached;
  }

  cacheKeyForPath(path) {
    return `settings-view:${path}`;
  }

  online() {
    return navigator.onLine;
  }

  // This could use a better name, since it checks whether it's appropriate to return
  // the cached data and pretends it's null if it's stale and we're online
  fetchFromCache(packagePath) {
    let cached = localStorage.getItem(this.cacheKeyForPath(packagePath));
    cached = cached ? this.parseJSON(cached) : undefined;
    if ((cached != null) && (!this.online() || ((Date.now() - cached.createdOn) < this.expiry))) {
      return cached.data;
    } else {
      // falsy data means "try to hit the network"
      return null;
    }
  }

  createAvatarCache() {
    return fs.makeTree(this.getCachePath());
  }

  avatarPath(login) {
    return path.join(this.getCachePath(), `${login}-${Date.now()}`);
  }

  cachedAvatar(login, callback) {
    glob(this.avatarGlob(login), (err, files) => {
      if (err) { return callback(err); }
      files.sort().reverse();
      for (let imagePath of Array.from(files)) {
        const filename = path.basename(imagePath);
        const array = filename.split('-'), createdOn = array[array.length - 1];
        if ((Date.now() - parseInt(createdOn)) < this.expiry) {
          return callback(null, imagePath);
        }
      }
      return callback(null, null);
    });
  }

  avatarGlob(login) {
    return path.join(this.getCachePath(), `${login}-*([0-9])`);
  }

  fetchAndCacheAvatar(login, callback) {
    if (!this.online()) {
      return callback(null, null);
    } else {
      const imagePath = this.avatarPath(login);
      const requestObject = {
        url: `https://avatars.githubusercontent.com/${login}`,
        headers: {'User-Agent': navigator.userAgent}
      };
      return request.head(requestObject, function(error, response, body) {
        if ((error != null) || (response.statusCode !== 200) || !response.headers['content-type'].startsWith('image/')) {
          return callback(error);
        } else {
          const writeStream = fs.createWriteStream(imagePath);
          writeStream.on('finish', () => callback(null, imagePath));
          writeStream.on('error', function(error) {
            writeStream.close();
            try {
              if (fs.existsSync(imagePath)) { fs.unlinkSync(imagePath); }
            } catch (error1) {}
            return callback(error);
          });
          return request(requestObject).pipe(writeStream);
        }
      });
    }
  }

  // The cache expiry doesn't need to be clever, or even compare dates, it just
  // needs to always keep around the newest item, and that item only. The localStorage
  // cache updates in place, so it doesn't need to be purged.

  expireAvatarCache() {
    const deleteAvatar = child => {
      const avatarPath = path.join(this.getCachePath(), child);
      fs.unlink(avatarPath, function(error) {
        if (error && (error.code !== 'ENOENT')) { // Ignore cache paths that don't exist
          return console.warn(`Error deleting avatar (${error.code}): ${avatarPath}`);
        }
      });
    };

    return fs.readdir(this.getCachePath(), function(error, _files) {
      let key;
      if (_files == null) { _files = []; }
      const files = {};
      for (let filename of Array.from(_files)) {
        const parts = filename.split('-');
        const stamp = parts.pop();
        key = parts.join('-');
        if (files[key] == null) { files[key] = []; }
        files[key].push(`${key}-${stamp}`);
      }

      const result = [];
      for (key in files) {
        const children = files[key];
        children.sort();
        children.pop(); // keep
        // Right now a bunch of clients might be instantiated at once, so
        // we can just ignore attempts to unlink files that have already been removed
        // - this should be fixed with a singleton client
        result.push(children.forEach(deleteAvatar));
      }
      return result;
    });
  }

  getCachePath() {
    return this.cachePath != null ? this.cachePath : (this.cachePath = path.join(remote.app.getPath('userData'), 'Cache', 'settings-view'));
  }

  search(query, options) {
    const qs = {q: query};

    if (options.themes) {
      qs.filter = 'theme';
    } else if (options.packages) {
      qs.filter = 'package';
    }

    options = {
      url: `${this.baseURL}packages/search`,
      headers: {'User-Agent': navigator.userAgent},
      qs,
      gzip: true
    };

    return new Promise((resolve, reject) => {
      request(options, (err, res, textBody) => {
        let error;
        if (err) {
          error = new Error(`Searching for \u201C${query}\u201D failed.`);
          error.stderr = err.message;
          return reject(error);
        } else {
          try {
            // NOTE: request's json option does not populate err if parsing fails,
            // so we do it manually
            const body = this.parseJSON(textBody);
            if (body.filter) {
              resolve(
                body.filter(pkg => (pkg.releases != null ? pkg.releases.latest : undefined) != null)
                    .map(({readme, metadata, downloads, stargazers_count, repository, badges}) => Object.assign(metadata, {readme, downloads, stargazers_count, badges, repository: repository.url}))
              );
            }
            else {}
            error = new Error(`Searching for \u201C${query}\u201D failed.\n`);
            error.stderr = "API returned: " + textBody;
            return reject(error);

          } catch (e) {
            error = new Error(`Searching for \u201C${query}\u201D failed.`);
            error.stderr = e.message + '\n' + textBody;
            return reject(error);
          }
        }
      });
    });
  }

  parseJSON(s) {
    return JSON.parse(s);
  }
};
