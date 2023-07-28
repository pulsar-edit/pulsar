// Simple caching utilities

// The rough shape of an object will be: (This matches the cache in settings-view)
// {
//    "createdOn": "epoch time",
//    "data": "cache object"
// }

function setCacheItem(key, item) {
  let obj = {
    createdOn: Date.now(),
    data: JSON.stringify(item),
  };

  localStorage.setItem(cacheKeyForPath(key), JSON.stringify(obj));
}

function getCacheItem(key) {
  let obj = localStorage.getItem(cacheKeyForPath(key));
  if (!obj) {
    return null;
  }

  let cached = JSON.parse(obj);

  if (typeof cached === "object" && !isItemExpired(cached)) {
    return JSON.parse(cached.data);
  }

  return null;
}

function empty(key) {
  localStorage.removeItem(cacheKeyForPath(key));
}

function isItemExpired(item, key) {
  if (key === "last-update-check") {
    // the last update check item never expires, to ensure skipping version
    // preferences are permanent
    return false;
  }

  if (!online() || Date.now() - item.createdOn < expiry()) {
    return false;
  } else {
    return true;
  }
}

function online() {
  return navigator.onLine;
}

function cacheKeyForPath(path) {
  return `pulsar-updater:${path}`;
}

function expiry() {
  // TODO get this from the package's config

  // 5 hour expiry by default
  return 1000 * 60 * 60 * 5;
}

module.exports = {
  setCacheItem,
  getCacheItem,
  isItemExpired,
  empty,
  cacheKeyForPath,
  online,
};
