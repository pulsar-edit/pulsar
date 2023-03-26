const superagent = require("superagent");

module.exports = class PPM {
  constructor() {
    // TODO: Allow this to be configurable
    this.apiURL = "https://api.pulsar-edit.dev";
  }

  request(path, opts = { header: {}, query: {} }) {
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
          "User-Agent": navigator.userAgent
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

  _formatError(err) {
    // Again this mirrors what PPM currently does, even if I don't like it
    // Also the `settings-view` package expects having a message object
    // The wierd handling in PPM is to support CLI usage and internal usage
    if (err.statusCode === 503) {
      return { message: `${err.req.host} is temporarily unavailable, please try again later.` };
    }

    return { message: `Requesting packages failed: ${err.response.body?.message}` };
  }

  cliClient(options) {
    return new Promise((resolve, reject) => {
      reject("Bundled PPM CLI Client!");
    });
  }

  getFeaturedPackages(callback) {
    return new Promise((resolve, reject) => {
      // TODO check if cached
      this.request("/api/packages/featured")
        .then((data) => {

          let packages = this._formatPackageList(data);

          if (typeof callback === "function") {
            resolve(callback(null, packages));
          }

          resolve(packages);
        })
        .catch((err) => {
          if (typeof callback === "function") {
            reject(callback(this._formatError(err), null));
          }

          reject(this._formatError(err));
        });
    });
  }

  getFeaturedThemes(callback) {
    return new Promise((resolve, reject) => {
      // TODO check if cached
      this.request("/api/themes/featured")
        .then((data) => {
          let packages = this._formatPackageList(data);

          if (typeof callback === "function") {
            resolve(callback(null, packages));
          }
          resolve(packages);
        })
        .catch((err) => {
          if (typeof callback === "function") {
            reject(callback(this._formatError(err), null));
          }

          reject(this._formatError(err));
        });
    });
  }

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

      this.request("/api/packages/search", {
        query: params
      })
        .then((data) => {
          let packages = this._formatPackageList(data);

          if (typeof callback === "function") {
            resolve(callback(null, packages));
          }
          resolve(packages);
        })
        .catch((err) => {
          let error = new Error(`Searching for \u201C${query}\u201D failed.\n`);
          error.stderr = `API returned: ${err.response?.body?.message}`;

          if (typeof callback === "function") {
            reject(callback(error, null));
          }
          reject(error);
        });
    });
  }

  package(name, callback) {
    return new Promise((resolve, reject) => {
      let packagePath = `packages/${name}`;
      // TODO Cached
      this.request(`/api/packages/${name}`)
        .then((data) => {
          // Doesn't look like settings-view needs any handling of the raw package data
          if (typeof callback === "function") {
            resolve(callback(null, data));
          }
          resolve(data);
        })
        .catch((err) => {
          if (typeof callback === "function") {
            reject(callback(null, this._formatError(err)));
          }
          reject(this._formatError(err));
        });
    });
  }

  avatar(login, callback) {
    return new Promise((resolve, reject) => {
      // TODO cached
      // TODO rest of this
    });
  }

};
