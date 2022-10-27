// This will be the parent to help expose all PPM functions from the PPM folder.
// Allowing PPM to be used as a Global API rather than a totally seperate Package.

const superagent = require("superagent");
const apiUrl = "https://api.pulsar-edit.dev/api";

// Operates on the API Search Endpoint.
// Takes optional values of `packages` and `themes` to act as a filter for either, similar to the original APM.
// Takes an object, with a required `qs` object as the query, with additional optional arguments.
async function search(args) {
  args = {
    qs: args.qs ? args.qs : "",
    packages: args.packages ? args.packages : false,
    themes: args.themes ? args.themes : false,
    page: args.page ? args.page : 0,
    sort: args.sort ? args.sort : "relevance",
    direction: args.direction ? args.direction : "desc"
  };

  if (args.qs == "") {
    return "Missing equired Search String";
  }

  if (args.packages || !args.themes) {
    // default handling for search, and packages specific filtered search
    superagent
      .get(`${apiUrl}/packages/search`)
      .query({ sort: args.sort, page: args.page, direction: args.direction, q: args.qs })
      .then(res => {
        console.log(res.body);
        return res.body;
      })
      .catch(err => {
        console.log(err);
        return err;
      });
  } else if (args.themes) {
    let res = await superagent
      .get(`${apiUrl}/themes/search`)
      .query({ sort: args.sort, page: args.page, direction: args.direction, q: args.qs })
      .then(res => {
        return res.body;
      })
      .catch(err => {
        console.log(err);
        return err;
      });
  }
}

async function view(packageName) {
  if (!packageName || packageName == "") {
    return "Missing required package name";
  }

  superagent
    .get(`${apiUrl}/packages/${packageName}`)
    .then(res => {
      console.log(res.body);
      return res.body;
    })
    .catch(err => {
      console.log(err);
      return err;
    });
}

module.exports = {
  search,
  view,
};
