const superagent = require("superagent");
const { shell } = require("electron");

/**
  * @class PPM
  * @classdesc A Bundled Version of PPM (Pulsar Package Manager) available on
  * the `atom.ppm` global API. Aimed at mirroring, and eventually replacing the
  * PPM repo.
*/
module.exports = class PPM {
  constructor(opts) {
    // TODO: Allow this to be configurable
    this.apiURL = "https://api.pulsar-edit.dev/";
    this.webURL = "https://web.pulsar-edit.dev/";
    this.userAgent;

    // 5 Hour Expiry on Cache
    this.cacheExpiry = 1000 * 60 * 60 * 5;
    this.useCache = opts?.useCache ?? true;
    this.headless = opts?.headless ?? false;

    if (this.headless && this.useCache) {
      this.useCache = false; // Just in case it isn't set excplicitly, we can't
      // use the cache when in headless mode.
    }

    this._determineUserAgent();
  }

  /**
    * @name _determineUserAgent
    * @private
    * @memberof PPM
    * @desc Returns a valid user agent for the running environment.
  */
  _determineUserAgent() {
    if (!this.headless) {
      this.userAgent = navigator.userAgent;
    } else {
      // We are running headless and don't have access to the user agent.
      this.userAgent = "Pulsar/BundledPPM"; // This will be set later on
    }
  }

  /**
    * @name _request
    * @private
    * @memberof PPM
    * @desc Handles making any and all web requests within the PPM class.
    * @param {string} path - The URL string following the `this.apiURL` to make the request to.
    * @param {object} [opts] - Any additional options to set.
    * @param {object} [opts.header] - Any options to set to the header. Directly
    * implements `superagent`
    * @param {object} [opts.query] - Any options to set as the `query` function.
    * Directly implements `superagent`
    * @returns {object} A promise, which resolves with the `body` object or `err` object.
    * @see {@link https://ladjs.github.io/superagent/}
  */
  _request(path, opts = { header: {}, query: {} }) {
    if (typeof opts.header !== "object") {
      opts.header = {};
    }
    if (typeof opts.query !== "object") {
      opts.query = {};
    }
    return new Promise((resolve, reject) => {
      superagent
        .get(`${this.apiURL}${path}`)
        .set({
          "User-Agent": this.userAgent
        })
        .set(opts.header)
        .query(opts.query)
        .end((err, res) => {
          if (res.ok) {
            // Superagent will already parse our JSON response for us
            resolve(res.body);
          }

          // We could add fancy error checking here
          // But based on current behavior of `settings-view` we just return
          reject(err);
        });
    });
  }

  /**
    * @name _formatPackageList
    * @private
    * @memberof PPM
    * @desc Formats an array of packages, to be usable within `settings-view`
    * @param {array} data - The array of packages, as taken directly from the API.
    * @returns {array} A formated array of packages.
  */
  _formatPackageList(data) {
    // Now this data is normally processed by PPM to be slightly modified,
    // While I may not like all of these filtering methods, for the time being I'll
    // mirror them, so the change is seemless
    let packages = [];
    packages = data.filter(pack => pack?.releases);
    packages = packages.map((origPack) => {
      let pack = origPack.metadata;
      pack.readme = origPack.readme;
      pack.downloads = origPack.downloads;
      pack.stargazers_count = origPack.stargazers_count;
      pack.repository = origPack.repository.url;
      return pack;
    });
    packages = packages.sort((a, b) => a.name.localeCompare(b.name));
    return packages;
  }

  /**
    * @name _formatError
    * @private
    * @memberof PPM
    * @desc Formats an error for easy consumption in `settings-view`
    * @param {object} err - An error object from `this._request()`
    * @returns {object} An object that can be directly consumed by `settings-view`.
  */
  _formatError(err) {
    // Again this mirrors what PPM currently does, even if I don't like it
    // Also the `settings-view` package expects having a message object
    // The wierd handling in PPM is to support CLI usage and internal usage
    if (err.statusCode === 503) {
      return { message: `${err.req.host} is temporarily unavailable, please try again later.` };
    }
    return { message: `Requesting packages failed: ${err.response?.body?.message}` };
  }

  /**
    * @name _fetchFromCache
    * @private
    * @memberof PPM
    * @desc Retreives items from the `localStorage` cache if available.
    * @params {string} path - The cache path of the item to retrieve.
    * @returns {object|false} The JavaScript object of the data cached. Or false if unavailable.
  */
  _fetchFromCache(path) {
    if (!this.useCache) {
      return false;
    }

    let cached = localStorage.getItem(this._cacheKeyForPath(path));
    if (cached) {
      cached = JSON.parse(cached);
    }

    if (cached && (!navigator.onLine || cached.createdOn < this.cacheExpiry)) {
      return cached.data;
    } else {
      return false;
    }
  }

  /**
    * @name _deepCache
    * @private
    * @memberof PPM
    * @desc Sets items into the `localStorage` cache.
    * @params {string} path - The cache path of the item.
    * @params {object} data - The data to cache.
  */
  _deepCache(path, data) {
    if (!this.useCache) {
      return;
    }

    let cache = {
      data: data,
      createdOn: Date.now()
    };

    localStorage.setItem(this._cacheKeyForPath(path), JSON.stringify(cache));
    if (Array.isArray(data)) {
      data.forEach((child) => {
        this._deepCache(`packages/${child.name}`, child);
      });
    }
    return;
  }

  /**
    * @name _cacheKeyForPath
    * @private
    * @memberof PPM
    * @desc Creates a valid PPM scoped cache path. To avoid conflicts with other caches.
    * @params {string} path - The path of the item cache.
    * @returns {string} Returns the namespaces cache path.
  */
  _cacheKeyForPath(path) {
    return `ppm-cache:${path}`;
  }

  /**
    * @name _getRepository
    * @private
    * @memberof PPM
    * @desc Returns the normalized URL to a repository.
    * @params {object} pack - The package object as returned from the API.
    * @returns {string} The normalized URL.
  */
  _getRepository(pack) {
    let repo = pack.repository?.url ?? pack.repository;
    return repo.replace(/\.git$/, "");
  }

  /**
    * @name _dynamicReturn
    * @private
    * @memberof PPM
    * @desc Avoid repetative return patterns when handling callbacks and promises as once.
    * @params {object} opts - The options needed to work.
    * @params {function} opts.callback - The callback function.
    * @params {function} opts.function - The `resolve()` or `reject()` function
    * of the promise to invoke.
    * @params {object} opts.err - The error to pass when returning an error.
    * Must be set, but if no error is being returned set it to `null`
    * @params {object} opts.data - The data to return on success.
  */
  _dynamicReturn(opts) {
    // Since we want to keep support for invoking this API in so many different
    // ways, returning can be messy and gross looking. So this function
    // is a small helper that can simplify writing a return, even if a
    // little obscurity is added

    if (typeof opts.callback === "function") {
      // TODO: I had some worries about a promise being rejected
      // when in the context of an anonymous arrow function, as I was worried it
      // wouldn't be caught properly. I'll keep an eye on it,
      // but if needed we would add apts.resolve, and specificly resolve on callback returns
      opts.function(opts.callback(opts.err, opts.data));
    }

    let returnData = opts.err ?? opts.data;
    opts.function(returnData);

  }

  /**
    * @name cliClient
    * @private
    * @memberof PPM
    * @desc The CLI Client of the bundled PPM. For use when invoked via the CLI.
    * @todo WIP
  */
  cliClient(options) {
    // So the options we receive are the default supported ones with Pulsar.
    // Either we do major reworking of how args are handled, or we do this hacky here.
    // Since we can't use `--themes` natively, since that would require them to be
    // passed down significantly within the program, we will just destructure everything
    // from the `pathsToOpen` array natively supported.
    // Such as pulsar --ppm featured themes
    // Rather than ppm featured --themes

    // Lets now set our user agent, since we can access the version within options
    this.userAgent = `Pulsar/BundledPPM-${options.version}`;
    return new Promise((resolve, reject) => {
      if (options.pathsToOpen.includes("featured")) {
        // We will now only consider handling featured items
        if (options.pathsToOpen.includes("themes")) {
          this.getFeaturedThemes((error, packages) => {
            if (error) {
              reject(error);
            }
            resolve(packages);
          });
        } else {
          // Default to packages
          this.getFeaturedThemes((res) => {
            resolve(res);
          });
        }
      }

      //reject("The Bundled PPM Client is not totally supported yet.");
    });
  }

  /**
    * @name getFeaturedPackages
    * @memberof PPM
    * @desc Returns the featured packages from cache or remote API.
    * @params {function} [callback] - The callback to invoke.
    * @returns {object[]} An array of package objects.
  */
  getFeaturedPackages(callback) {
    return new Promise((resolve, reject) => {
      let featuredCache = this._fetchFromCache("packages/featured");

      if (featuredCache) {
        // If the value is anything but false, we successfully retreived a cache

        return this._dynamicReturn({
          function: resolve,
          callback: callback,
          err: null,
          data: featuredCache
        });

      }

      this._request("api/packages/featured")
        .then((data) => {

          let packages = this._formatPackageList(data);

          // Then cache the data we just got
          this._deepCache("packages/featured", packages);

          return this._dynamicReturn({
            function: resolve,
            callback: callback,
            err: null,
            data: packages
          });

        })
        .catch((err) => {
          return this._dynamicReturn({
            function: reject,
            callback: callback,
            err: err,
            data: null
          });

        });
    });
  }

  /**
    * @name getFeaturedThemes
    * @memberof PPM
    * @desc Returns the featured themes from cache or remote API.
    * @params {function} [callback] - The callback to invoke.
    * @returns {object[]} An array of pacakge objects.
  */
  getFeaturedThemes(callback) {
    return new Promise((resolve, reject) => {
      let featuredCache = this._fetchFromCache("themes/featured");

      if (featuredCache) {
        // If the value is anything but false, we successfully retreived a cache

        return this._dynamicReturn({
          function: resolve,
          callback: callback,
          err: null,
          data: featuredCache,
        });
      }

      this._request("api/themes/featured")
        .then((data) => {
          let packages = this._formatPackageList(data);

          // Then cache the data we just got
          this._deepCache("themes/featured", packages);

          return this._dynamicReturn({
            function: resolve,
            callback: callback,
            err: null,
            data: packages,
          });

        })
        .catch((err) => {
          return this._dynamicReturn({
            function: reject,
            callback: callback,
            err: this._formatError(err),
            data: null
          });

        });
    });
  }

  /**
    * @name search
    * @memberof PPM
    * @desc Preforms a search on the remote API.
    * @params {string} query - The search string.
    * @params {object} options - The options to provide during search.
    * @params {function} [callback] The callback to invoke.
    * @returns {object[]} An array of package objects.
  */
  search(query, options, callback) {
    return new Promise((resolve, reject) => {
      let params = {
        q: query
      };

      if (options.themes) {
        params.filter = 'theme';
      }
      if (options.packages) {
        params.filter = 'package';
      }

      // TODO filter by package or themes
      this._request("api/packages/search", {
        query: params
      })
        .then((data) => {
          let packages = this._formatPackageList(data);

          return this._dynamicReturn({
            function: resolve,
            callback: callback,
            err: null,
            data: packages
          });

        })
        .catch((err) => {
          let error = new Error(`Searching for \u201C${query}\u201D failed.\n`);
          error.stderr = `API returned: ${err.response?.body?.message}`;

          return this._dynamicReturn({
            function: reject,
            callback: callback,
            err: error,
            data: null
          });

        });
    });
  }

  /**
    * @name package
    * @memberof PPM
    * @desc Returns the details of a pacakge from the API.
    * @params {string} name - The name of the package.
    * @params {function} [callback] - The callback to invoke.
    * @returns {object} The package object.
  */
  package(name, callback) {
    return new Promise((resolve, reject) => {
      let packageCache = this._fetchFromCache(`packages/${name}`);

      if (packageCache) {
        // If this value is anything but false, we got cached data
        return this._dynamicReturn({
          function: resolve,
          callback: callback,
          err: null,
          data: packageCache,
        });

      }

      this._request(`api/packages/${name}`)
        .then((data) => {
          // Doesn't look like settings-view needs any handling of the raw package data
          // Then to cache this data
          this._deepCache(`packages/${name}`, data);

          return this._dynamicReturn({
            function: resolve,
            callback: callback,
            err: null,
            data: data,
          });

        })
        .catch((err) => {
          return this._dynamicReturn({
            function: reject,
            callback: callback,
            err: this._formatError(err),
            data: null
          });

        });
    });
  }

  /**
    * @name avatar
    * @private
    * @memberof PPM
    * @desc Retrieves the file path to a users avatar.
    * @todo WIP
  */
  avatar(login, callback) {
    return new Promise((resolve, reject) => {
      // TODO cached
      // TODO rest of this
    });
  }

  /**
    * @name docs
    * @memberof PPM
    * @desc Either returns the URL to a packages homepage, or opens it in the
    * default browser.
    * @params {string} packageName - The name of the package
    * @params {object} [options] - Options to configure this behavior
    * @params {boolean} [options.print] - `true` returns the string URL to the
    * packages homepage, while `false` or unset will open this URL in the browser.
    * @returns {string} The URL to the homepage, (only when `opts.print=true`)
  */
  docs(packageName, options = {}, callback) {
    // options: { print: true } can be used to return the URL, rather than open it.
    return new Promise((resolve, reject) => {
      let errMsg = `Package ${packageName} does not contain a repository URL.`;
      let packageCache = this._fetchFromCache(`packages/${packageName}`);

      if (packageCache) {
        let repo = this._getRepository(packageCache);

        if (typeof repo !== "string") {
          // The repo is invalid
          return this._dynamicReturn({
            function: reject,
            callback: callback,
            err: errMsg,
            data: null
          });
        }

        if (options.print) {

          return this._dynamicReturn({
            function: resolve,
            callback: callback,
            err: null,
            data: repo
          });

        }
        // Open URL
        shell.openExternal(repo);
        resolve();

      }
      // We don't have cached data, retrieve it instead
      // TODO: We could use async within our promise, to simplify this callback hell
      this.package(packageName, (error, packageData) => {
        if (error) {
          return this._dynamicReturn({
            function: reject,
            callback: callback,
            err: errMsg,
            data: null
          });

        } else {
          let repo = this._getRepository(packageData);

          if (typeof repo !== "string") {
            // We failed to get the repo from the string
            return this._dynamicReturn({
              function: reject,
              callback: callback,
              err: errMsg,
              data: null
            });
          }

          if (options.print) {
            return this._dynamicReturn({
              function: resolve,
              callback: callback,
              err: null,
              data: repo
            });

          }
          // Open URL
          shell.openExternal(repo);
          resolve();
        }

      });
    });
  }

};
