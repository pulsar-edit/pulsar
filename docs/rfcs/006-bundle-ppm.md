# Bundle PPM

## Status

WIP

## Summary

TODO

## Examples

The new PPM API is modeled closely off of the `./packages/settings-view/lib/atom-io-client.coffee`. Since this is the only JavaScript based API we have, while also considering the way that data is managed via the existing PPM repo.

The API is additionally made to be as usable as possible, trying to take into account all possibilities.

By utilizing optional callbacks, and other intelligent behavior here are some examples of it's usage.

```javascript
// ====== getFeaturedPackages && getFeaturedThemes

// === Anonymous Arrow Functions

atom.ppm.getFeaturedPackages((error, packages) => {
  if (error) {
    // Error has occured
  }
  // Otherwise we have packages
});

// === Chaining Functions

atom.ppm.getFeaturedPackages()
  .then((packages) => {
    // We have packages
  })
  .catch((error) => {
    // An error has occured
  });

// === Async Functions

try {
  let packages = await atom.ppm.getFeaturedPackages();

  // We have packages
} catch(error) {
  // An error has occured
}

// ====== search

// === Anyonymous Arrow Functions

atom.ppm.search("search-string", {}, (error, packages) => {
  if (error) {
    // Error has occured
  }
  // We have packages
});

// === Chaining Functions

atom.ppm.search("search-string")
  .then((packages) => {
    // We have packages
  })
  .catch((error) => {
    // An error occured
  });

// === Async Functions

try {
  let packages = await atom.ppm.search("search-string");

  // We have packages
} catch(error) {
  // An error occured
}
```

### API Definition

##### Non-Public Functions

There are some functions not intended to be used by other packages, but that I'll detail here anyways.

* `_determineUserAgent()`: Set's the PPM Classes `this.userAgent` to either `Pulsar/BundledPPM` or the userAgent based on whether or not it's running in headless mode.
* `_request()`: This is the only function that actually makes outbound requests.
* `_formatPackageList()`: Formats a packages data from what's returned by the API.
* `_formatError()`: Used to format error messages.
* `_fetchFromCache()`: Fetch's data from the cache via `localStorage`
* `_deepCache()`: Cache's data into `localStorage`
* `_cacheKeyForPath()`: Used to generate the path data will be cached into.
* `_getRepository()`: Used to retreive a normalized repository link.
* `_dynamicReturn()`: To avoid the repeated return pattern that was needed to support the function running in as many ways as it does. This was created to assist in returns when needed. A quick example:

```javascript
// Previous Return Pattern
if (typeof callback === "function") {
  reject(callback(err, null));
  // or
  resolve(callback(null, data));
}
reject(err);
// or
resolve(data);

// When using `_dynamicReturn()`
return this._dynamicReturn({
  function: reject | resolve,
  callback: callback,
  err: err | null,
  data: data | null
});
```

##### Non-Editor Functions

There's some functions that will only be intended to be used when running via the CLI or `headless` mode.

* `cliClient()`: Is the main handler for PPM CLI interaction. When using the bundled PPM.

##### Public Functions

These functions should retain compatibility as much as possible between versions, and are intended to be used by packages, or the editor.

* `getFeaturedPackages(<callback>)`: Returns an array of featured packages.
* `getFeaturedThemes(<callback>)`: Returns an array of featured themes.
* `search(query, options, <callback>)`: Searches for a packge on the backend.
* `package(name, <callback>)`: Gets the details of a specific package.
* `avatar(login, <callback>)`: Get's a users avatar.
* `docs(packageName, options, <callback>)`: Opens a web browser to a packge's homepage, or can return that URL.
