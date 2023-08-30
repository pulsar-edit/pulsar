const _ = require('underscore-plus');
const {BufferedProcess, CompositeDisposable, Emitter} = require('atom');
const semver = require('semver');

const Client = require('./atom-io-client');

module.exports = class PackageManager {
  constructor() {
    // Millisecond expiry for cached loadOutdated, etc. values
    this.CACHE_EXPIRY = 1000*60*10;
    this.setProxyServers = this.setProxyServers.bind(this);
    this.setProxyServersAsync = this.setProxyServersAsync.bind(this);
    this.packagePromises = [];
    this.apmCache = {
      loadOutdated: {
        value: null,
        expiry: 0
      }
    };

    this.emitter = new Emitter;
  }

  getClient() {
    return this.client != null ? this.client : (this.client = new Client(this));
  }

  isPackageInstalled(packageName) {
    if (atom.packages.isPackageLoaded(packageName)) {
      return true;
    } else {
      return atom.packages.getAvailablePackageNames().indexOf(packageName) > -1;
    }
  }

  packageHasSettings(packageName) {
    const grammars = (atom.grammars.getGrammars() != null) ? atom.grammars.getGrammars() : [];
    for (let grammar of Array.from(grammars)) {
      if (grammar.path) {
        if (grammar.packageName === packageName) { return true; }
      }
    }

    const pack = atom.packages.getLoadedPackage(packageName);
    if ((pack != null) && !atom.packages.isPackageActive(packageName)) { pack.activateConfig(); }
    const schema = atom.config.getSchema(packageName);
    return (schema != null) && (schema.type !== 'any');
  }

  setProxyServers(callback) {
    const {
      session
    } = atom.getCurrentWindow().webContents;
    session.resolveProxy('http://atom.io', httpProxy => {
      this.applyProxyToEnv('http_proxy', httpProxy);
      session.resolveProxy('https://pulsar-edit.dev', httpsProxy => {
        this.applyProxyToEnv('https_proxy', httpsProxy);
        return callback();
      });
    });
  }

  setProxyServersAsync(callback) {
    const httpProxyPromise = atom.resolveProxy('http://atom.io').then(proxy => this.applyProxyToEnv('http_proxy', proxy));
    const httpsProxyPromise = atom.resolveProxy('https://pulsar-edit.dev').then(proxy => this.applyProxyToEnv('https_proxy', proxy));
    return Promise.all([httpProxyPromise, httpsProxyPromise]).then(callback);
  }

  applyProxyToEnv(envName, proxy) {
    if (proxy != null) {
      proxy = proxy.split(' ');
      switch (proxy[0].trim().toUpperCase()) {
        case 'DIRECT': delete process.env[envName]; break;
        case 'PROXY':  process.env[envName] = 'http://' + proxy[1]; break;
      }
    }
  }

  runCommand(args, callback) {
    const command = atom.packages.getApmPath();
    const outputLines = [];
    const stdout = lines => outputLines.push(lines);
    const errorLines = [];
    const stderr = lines => errorLines.push(lines);
    const exit = code => callback(code, outputLines.join('\n'), errorLines.join('\n'));

    args.push('--no-color');

    if (atom.config.get('core.useProxySettingsWhenCallingApm')) {
      const bufferedProcess = new BufferedProcess({command, args, stdout, stderr, exit, autoStart: false});
      if (atom.resolveProxy != null) {
        this.setProxyServersAsync(() => bufferedProcess.start());
      } else {
        this.setProxyServers(() => bufferedProcess.start());
      }
      return bufferedProcess;
    } else {
      return new BufferedProcess({command, args, stdout, stderr, exit});
    }
  }

  loadInstalled(callback) {
    const args = ['ls', '--json'];
    const errorMessage = 'Fetching local packages failed.';
    const apmProcess = this.runCommand(args, function(code, stdout, stderr) {
      let error;
      if (code === 0) {
        let packages;
        try {
          packages = (JSON.parse(stdout) != null) ? JSON.parse(stdout) : [];
        } catch (parseError) {
          error = createJsonParseError(errorMessage, parseError, stdout);
          return callback(error);
        }
        return callback(null, packages);
      } else {
        error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return callback(error);
      }
    });

    return handleProcessErrors(apmProcess, errorMessage, callback);
  }

  loadFeatured(loadThemes, callback) {
    if (!callback) {
      callback = loadThemes;
      loadThemes = false;
    }

    const args = ['featured', '--json'];
    const version = atom.getVersion();
    if (loadThemes) { args.push('--themes'); }
    if (semver.valid(version)) { args.push('--compatible', version); }
    const errorMessage = 'Fetching featured packages failed.';

    const apmProcess = this.runCommand(args, function(code, stdout, stderr) {
      let error;
      if (code === 0) {
        let packages;
        try {
          let left;
          packages = (left = JSON.parse(stdout)) != null ? left : [];
        } catch (parseError) {
          error = createJsonParseError(errorMessage, parseError, stdout);
          return callback(error);
        }

        return callback(null, packages);
      } else {
        error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return callback(error);
      }
    });

    return handleProcessErrors(apmProcess, errorMessage, callback);
  }

  loadOutdated(clearCache, callback) {
    if (clearCache) {
      this.clearOutdatedCache();
    // Short circuit if we have cached data.
    } else if (this.apmCache.loadOutdated.value && (this.apmCache.loadOutdated.expiry > Date.now())) {
      return callback(null, this.apmCache.loadOutdated.value);
    }

    const args = ['outdated', '--json'];
    const version = atom.getVersion();
    if (semver.valid(version)) { args.push('--compatible', version); }
    const errorMessage = 'Fetching outdated packages and themes failed.';

    const apmProcess = this.runCommand(args, (code, stdout, stderr) => {
      let error;
      let pack;
      if (code === 0) {
        let packages;
        try {
          let left;
          packages = (left = JSON.parse(stdout)) != null ? left : [];
        } catch (parseError) {
          error = createJsonParseError(errorMessage, parseError, stdout);
          return callback(error);
        }

        const updatablePackages = ((() => {
          const result = [];
          for (pack of Array.from(packages)) {
            if (!this.getVersionPinnedPackages().includes(pack != null ? pack.name : undefined)) {
              result.push(pack);
            }
          }
          return result;
        })());

        this.apmCache.loadOutdated = {
          value: updatablePackages,
          expiry: Date.now() + this.CACHE_EXPIRY
        };

        for (pack of Array.from(updatablePackages)) {
          this.emitPackageEvent('update-available', pack);
        }

        return callback(null, updatablePackages);
      } else {
        error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return callback(error);
      }
    });

    return handleProcessErrors(apmProcess, errorMessage, callback);
  }

  getVersionPinnedPackages() {
    let left;
    return (left = atom.config.get('core.versionPinnedPackages')) != null ? left : [];
  }

  clearOutdatedCache() {
    return this.apmCache.loadOutdated = {
      value: null,
      expiry: 0
    };
  }

  loadPackage(packageName, callback) {
    const args = ['view', packageName, '--json'];
    const errorMessage = `Fetching package '${packageName}' failed.`;

    const apmProcess = this.runCommand(args, function(code, stdout, stderr) {
      let error;
      if (code === 0) {
        let packages;
        try {
          let left;
          packages = (left = JSON.parse(stdout)) != null ? left : [];
        } catch (parseError) {
          error = createJsonParseError(errorMessage, parseError, stdout);
          return callback(error);
        }

        return callback(null, packages);
      } else {
        error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return callback(error);
      }
    });

    return handleProcessErrors(apmProcess, errorMessage, callback);
  }

  loadCompatiblePackageVersion(packageName, callback) {
    const args = ['view', packageName, '--json', '--compatible', this.normalizeVersion(atom.getVersion())];
    const errorMessage = `Fetching package '${packageName}' failed.`;

    const apmProcess = this.runCommand(args, function(code, stdout, stderr) {
      let error;
      if (code === 0) {
        let packages;
        try {
          let left;
          packages = (left = JSON.parse(stdout)) != null ? left : [];
        } catch (parseError) {
          error = createJsonParseError(errorMessage, parseError, stdout);
          return callback(error);
        }

        return callback(null, packages);
      } else {
        error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return callback(error);
      }
    });

    return handleProcessErrors(apmProcess, errorMessage, callback);
  }

  getInstalled() {
    return new Promise((resolve, reject) => {
      this.loadInstalled(function(error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  getFeatured(loadThemes) {
    return new Promise((resolve, reject) => {
      return this.loadFeatured(!!loadThemes, function(error, result) {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }

  getOutdated(clearCache) {
    if (clearCache == null) { clearCache = false; }
    return new Promise((resolve, reject) => {
      this.loadOutdated(clearCache, function(error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  getPackage(packageName) {
      return this.packagePromises[packageName] != null ?
        this.packagePromises[packageName] :
        (this.packagePromises[packageName] = new Promise((resolve, reject) => {
          this.loadPackage(packageName, function(error, result) {
            if (error) {
              return reject(error);
            } else {
              return resolve(result);
            }
          });
      }));
    }

  satisfiesVersion(version, metadata) {
    const engine = (metadata.engines != null ? metadata.engines.atom : undefined) != null ? (metadata.engines != null ? metadata.engines.atom : undefined) : '*';
    if (!semver.validRange(engine)) { return false; }
    return semver.satisfies(version, engine);
  }

  normalizeVersion(version) {
    if (typeof version === 'string') { [version] = Array.from(version.split('-')); }
    return version;
  }

  update(pack, newVersion, callback) {
    let args;
    const {name, theme, apmInstallSource} = pack;

    const errorMessage = newVersion ?
      `Updating to \u201C${name}@${newVersion}\u201D failed.`
    :
      "Updating to latest sha failed.";
    const onError = error => {
      error.packageInstallError = !theme;
      this.emitPackageEvent('update-failed', pack, error);
      return (typeof callback === 'function' ? callback(error) : undefined);
    };

    if ((apmInstallSource != null ? apmInstallSource.type : undefined) === 'git') {
      args = ['install', apmInstallSource.source];
    } else {
      args = ['install', `${name}@${newVersion}`];
    }

    const exit = (code, stdout, stderr) => {
      if (code === 0) {
        this.clearOutdatedCache();
        if (typeof callback === 'function') {
          callback();
        }
        return this.emitPackageEvent('updated', pack);
      } else {
        const error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return onError(error);
      }
    };

    this.emitPackageEvent('updating', pack);
    const apmProcess = this.runCommand(args, exit);
    return handleProcessErrors(apmProcess, errorMessage, onError);
  }

  unload(name) {
    if (atom.packages.isPackageLoaded(name)) {
      if (atom.packages.isPackageActive(name)) { atom.packages.deactivatePackage(name); }
      return atom.packages.unloadPackage(name);
    }
  }

  install(pack, callback) {
    let {name, version, theme} = pack;
    const activateOnSuccess = !theme && !atom.packages.isPackageDisabled(name);
    const activateOnFailure = atom.packages.isPackageActive(name);
    const nameWithVersion = (version != null) ? `${name}@${version}` : name;

    this.unload(name);
    const args = ['install', nameWithVersion, '--json'];

    const errorMessage = `Installing \u201C${nameWithVersion}\u201D failed.`;
    const onError = error => {
      error.packageInstallError = !theme;
      this.emitPackageEvent('install-failed', pack, error);
      return (typeof callback === 'function' ? callback(error) : undefined);
    };

    const exit = (code, stdout, stderr) => {
      if (code === 0) {
        // get real package name from package.json
        try {
          const packageInfo = JSON.parse(stdout)[0];
          pack = _.extend({}, pack, packageInfo.metadata);
          ({
            name
          } = pack);
        } catch (err) {}
          // using old apm without --json support
        this.clearOutdatedCache();
        if (activateOnSuccess) {
          atom.packages.activatePackage(name);
        } else {
          atom.packages.loadPackage(name);
        }

        if (typeof callback === 'function') {
          callback();
        }
        return this.emitPackageEvent('installed', pack);
      } else {
        if (activateOnFailure) { atom.packages.activatePackage(name); }
        const error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return onError(error);
      }
    };

    this.emitPackageEvent('installing', pack);
    const apmProcess = this.runCommand(args, exit);
    return handleProcessErrors(apmProcess, errorMessage, onError);
  }

  uninstall(pack, callback) {
    const {name} = pack;

    if (atom.packages.isPackageActive(name)) { atom.packages.deactivatePackage(name); }

    const errorMessage = `Uninstalling \u201C${name}\u201D failed.`;
    const onError = error => {
      this.emitPackageEvent('uninstall-failed', pack, error);
      return (typeof callback === 'function' ? callback(error) : undefined);
    };

    this.emitPackageEvent('uninstalling', pack);
    const apmProcess = this.runCommand(['uninstall', '--hard', name], (code, stdout, stderr) => {
      if (code === 0) {
        this.clearOutdatedCache();
        this.unload(name);
        this.removePackageNameFromDisabledPackages(name);
        if (typeof callback === 'function') {
          callback();
        }
        return this.emitPackageEvent('uninstalled', pack);
      } else {
        const error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        return onError(error);
      }
    });

    return handleProcessErrors(apmProcess, errorMessage, onError);
  }

  canUpgrade(installedPackage, availableVersion) {
    if (installedPackage == null) { return false; }

    const installedVersion = installedPackage.metadata.version;
    if (!semver.valid(installedVersion)) { return false; }
    if (!semver.valid(availableVersion)) { return false; }

    return semver.gt(availableVersion, installedVersion);
  }

  getPackageTitle({name}) {
    return _.undasherize(_.uncamelcase(name));
  }

  getRepositoryUrl({metadata}) {
    let left;
    const {repository} = metadata;
    let repoUrl = (left = (repository != null ? repository.url : undefined) != null ? (repository != null ? repository.url : undefined) : repository) != null ? left : '';
    if (repoUrl.match('git@github')) {
      const repoName = repoUrl.split(':')[1];
      repoUrl = `https://github.com/${repoName}`;
    }
    return repoUrl.replace(/\.git$/, '').replace(/\/+$/, '').replace(/^git\+/, '');
  }

  getRepositoryBugUri({metadata}) {
    let bugUri;
    const {bugs} = metadata;
    if (typeof bugs === 'string') {
      bugUri = bugs;
    } else {
      let left;
      bugUri = (left = (bugs != null ? bugs.url : undefined) != null ? (bugs != null ? bugs.url : undefined) : (bugs != null ? bugs.email : undefined)) != null ? left : this.getRepositoryUrl({metadata}) + '/issues/new';
      if (bugUri.includes('@')) {
        bugUri = 'mailto:' + bugUri;
      }
    }
    return bugUri;
  }

  checkNativeBuildTools() {
    return new Promise((resolve, reject) => {
      const apmProcess = this.runCommand(['install', '--check'], function(code, stdout, stderr) {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error());
        }
      });

      apmProcess.onWillThrowError(function({error, handle}) {
        handle();
        reject(error);
      });
    });
  }

  removePackageNameFromDisabledPackages(packageName) {
    return atom.config.removeAtKeyPath('core.disabledPackages', packageName);
  }

  // Emits the appropriate event for the given package.
  //
  // All events are either of the form `theme-foo` or `package-foo` depending on
  // whether the event is for a theme or a normal package. This method standardizes
  // the logic to determine if a package is a theme or not and formats the event
  // name appropriately.
  //
  // eventName - The event name suffix {String} of the event to emit.
  // pack - The package for which the event is being emitted.
  // error - Any error information to be included in the case of an error.
  emitPackageEvent(eventName, pack, error) {
    const theme = pack.theme != null ? pack.theme : (pack.metadata != null ? pack.metadata.theme : undefined);
    eventName = theme ? `theme-${eventName}` : `package-${eventName}`;
    return this.emitter.emit(eventName, {pack, error});
  }

  on(selectors, callback) {
    const subscriptions = new CompositeDisposable;
    for (let selector of Array.from(selectors.split(" "))) {
      subscriptions.add(this.emitter.on(selector, callback));
    }
    return subscriptions;
  }
}

const createJsonParseError = (message, parseError, stdout) => {
  const error = new Error(message);
  error.stdout = '';
  error.stderr = `${parseError.message}: ${stdout}`;
  return error;
};

const createProcessError = (message, processError) => {
  const error = new Error(message);
  error.stdout = '';
  error.stderr = processError.message;
  return error;
};

const handleProcessErrors = (apmProcess, message, callback) => apmProcess.onWillThrowError(function({error, handle}) {
  handle();
  return callback(createProcessError(message, error));
});
