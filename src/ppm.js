// This will be the parent to help expose all PPM functions from the PPM folder.
// Allowing PPM to be used as a Global API rather than a totally seperate Package.

const superagent = require("superagent");
const apiUrl = "https://api.pulsar-edit.com/api";

// Operates on the API Search Endpoint.
// Takes optional values of `packages` and `themes` to act as a filter for either, similar to the original APM.
// Takes additional optional values to expose all API parameters compatible with the api server. Taking their same defaults.
async function search(qs, packages = false, themes = false, page = 1, sort = "relevance", direction = "desc") {
  
}

module.exports = {
  search,
};
