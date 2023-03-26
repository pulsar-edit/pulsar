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
