const superagent = require("superagent");

module.exports = class PPM {
  constructor() {
    // TODO: Allow this to be configurable
    this.apiURL = "https://api.pulsar-edit.dev";
  }

  request(path) {
    return new Promise((resolve, reject) => {
      superagent
        .get(`${this.apiURL}${path}`)
        .set({
          "User-Agent": navigator.userAgent
        })
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

  getFeaturedPackages(callback) {
    return new Promise((resolve, reject) => {
      // TODO check if cached
      this.request("/api/packages/featured")
        .then((data) => {
          if (typeof callback === "function") {
            callback(data);
          }
          console.log(data);
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
};
