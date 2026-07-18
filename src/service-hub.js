const { Disposable, CompositeDisposable } = require("event-kit");
const { Range, SemVer } = require("semver");

function splitKeyPath(keyPath) {
  if (keyPath == null) {
    return [];
  }
  let startIndex = 0;
  const keys = [];
  for (let i = 0; i < keyPath.length; i++) {
    const char = keyPath[i];
    if (char === "." && (i === 0 || keyPath[i - 1] !== "\\")) {
      keys.push(keyPath.substring(startIndex, i));
      startIndex = i + 1;
    }
  }
  keys.push(keyPath.substr(startIndex, keyPath.length));
  return keys;
}

function getValueAtKeyPath(object, keyPath) {
  const keys = splitKeyPath(keyPath);
  for (const key of keys) {
    object = object[key];
    if (object == null) {
      return;
    }
  }
  return object;
}

function setValueAtKeyPath(object, keyPath, value) {
  const keys = splitKeyPath(keyPath);
  while (keys.length > 1) {
    const key = keys.shift();
    if (object[key] == null) {
      object[key] = {};
    }
    object = object[key];
  }
  return (object[keys.shift()] = value);
}

class Consumer {
  constructor(keyPath, versionRange, callback) {
    this.keyPath = keyPath;
    this.callback = callback;
    this.versionRange = new Range(versionRange);
  }
}

class Provider {
  constructor(keyPath, servicesByVersion) {
    this.consumersDisposable = new CompositeDisposable();
    this.servicesByVersion = {};
    this.versions = [];
    for (const version in servicesByVersion) {
      const service = servicesByVersion[version];
      this.servicesByVersion[version] = {};
      this.versions.push(new SemVer(version));
      setValueAtKeyPath(this.servicesByVersion[version], keyPath, service);
    }
    this.versions.sort((a, b) => b.compare(a));
  }

  provide(consumer) {
    for (const version of this.versions) {
      if (consumer.versionRange.test(version)) {
        const value = getValueAtKeyPath(
          this.servicesByVersion[version.toString()],
          consumer.keyPath,
        );
        if (value) {
          const consumerDisposable = consumer.callback.call(null, value);
          if (typeof consumerDisposable?.dispose === "function") {
            this.consumersDisposable.add(consumerDisposable);
          }
          return;
        }
      }
    }
  }

  destroy() {
    return this.consumersDisposable.dispose();
  }
}

module.exports = class ServiceHub {
  constructor() {
    this.consumers = [];
    this.providers = [];
  }

  // Public: Provide a service by invoking the callback of all current and future
  // consumers matching the given key path and version range.
  //
  // * `keyPath` A {String} of `.` separated keys indicating the services's
  //   location in the namespace of all services.
  // * `version` A {String} containing a [semantic version](http://semver.org/)
  //   for the service's API.
  // * `service` An object exposing the service API.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to remove the
  // provided service.
  provide(keyPath, version, service) {
    let servicesByVersion;
    if (service != null) {
      servicesByVersion = {};
      servicesByVersion[version] = service;
    } else {
      servicesByVersion = version;
    }
    const provider = new Provider(keyPath, servicesByVersion);
    this.providers.push(provider);
    for (const consumer of this.consumers.slice()) {
      if (!consumer.isDestroyed) {
        provider.provide(consumer);
      }
    }
    return new Disposable(() => {
      provider.destroy();
      const index = this.providers.indexOf(provider);
      return this.providers.splice(index, 1);
    });
  }

  // Public: Consume a service by invoking the given callback for all current
  // and future provided services matching the given key path and version range.
  //
  // * `keyPath` A {String} of `.` separated keys indicating the services's
  //   location in the namespace of all services.
  // * `versionRange` A {String} containing a [semantic version range](https://www.npmjs.org/doc/misc/semver.html)
  //   that any provided services for the given key path must satisfy.
  // * `callback` A {Function} to be called with current and future matching
  //   service objects.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to remove the
  // consumer.
  consume(keyPath, versionRange, callback) {
    const consumer = new Consumer(keyPath, versionRange, callback);
    this.consumers.push(consumer);
    for (const provider of this.providers.slice()) {
      provider.provide(consumer);
    }
    return new Disposable(() => {
      const index = this.consumers.indexOf(consumer);
      if (index >= 0) {
        return this.consumers.splice(index, 1);
      }
    });
  }

  // Public: Clear out all service consumers and providers, disposing of any
  // disposables returned by previous consumers.
  clear() {
    for (const provider of this.providers.slice()) {
      provider.destroy();
    }
    this.providers = [];
    return (this.consumers = []);
  }
};
