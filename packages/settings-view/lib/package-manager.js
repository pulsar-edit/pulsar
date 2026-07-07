const _ = require("underscore-plus");
const { BufferedProcess, CompositeDisposable, Emitter } = require("atom");
const CSON = require("season");
const fs = require("fs-plus");
const hostedGitInfo = require("hosted-git-info");
const os = require("os");
const path = require("path");
const semver = require("semver");

const Client = require("./atom-io-client");

module.exports = class PackageManager {
  constructor() {
    // Millisecond expiry for cached loadOutdated, etc. values
    this.CACHE_EXPIRY = 1000 * 60 * 10;
    this.setProxyServers = this.setProxyServers.bind(this);
    this.setProxyServersAsync = this.setProxyServersAsync.bind(this);
    this.packagePromises = [];
    this.apmCache = {
      loadOutdated: {
        value: null,
        expiry: 0,
      },
    };

    this.emitter = new Emitter();
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
    const grammars = atom.grammars.getGrammars() != null ? atom.grammars.getGrammars() : [];
    for (let grammar of Array.from(grammars)) {
      if (grammar.path) {
        if (grammar.packageName === packageName) {
          return true;
        }
      }
    }

    const pack = atom.packages.getLoadedPackage(packageName);
    if (pack != null && !atom.packages.isPackageActive(packageName)) {
      pack.activateConfig();
    }
    const schema = atom.config.getSchema(packageName);
    return schema != null && schema.type !== "any";
  }

  setProxyServers(callback) {
    const { session } = atom.getCurrentWindow().webContents;
    session.resolveProxy("http://atom.io", (httpProxy) => {
      this.applyProxyToEnv("http_proxy", httpProxy);
      session.resolveProxy("https://pulsar-edit.dev", (httpsProxy) => {
        this.applyProxyToEnv("https_proxy", httpsProxy);
        return callback();
      });
    });
  }

  setProxyServersAsync(callback) {
    const httpProxyPromise = atom
      .resolveProxy("http://atom.io")
      .then((proxy) => this.applyProxyToEnv("http_proxy", proxy));
    const httpsProxyPromise = atom
      .resolveProxy("https://pulsar-edit.dev")
      .then((proxy) => this.applyProxyToEnv("https_proxy", proxy));
    return Promise.all([httpProxyPromise, httpsProxyPromise]).then(callback);
  }

  applyProxyToEnv(envName, proxy) {
    if (proxy != null) {
      proxy = proxy.split(" ");
      switch (proxy[0].trim().toUpperCase()) {
        case "DIRECT":
          delete process.env[envName];
          break;
        case "PROXY":
          process.env[envName] = "http://" + proxy[1];
          break;
      }
    }
  }

  runCommand(args, callback) {
    const command = atom.packages.getApmPath();
    const outputLines = [];
    const stdout = (lines) => outputLines.push(lines);
    const errorLines = [];
    const stderr = (lines) => errorLines.push(lines);
    const exit = (code) => callback(code, outputLines.join("\n"), errorLines.join("\n"));

    args.push("--no-color");

    if (atom.config.get("core.useProxySettingsWhenCallingApm")) {
      const bufferedProcess = new BufferedProcess({
        command,
        args,
        stdout,
        stderr,
        exit,
        autoStart: false,
      });
      if (atom.resolveProxy != null) {
        this.setProxyServersAsync(() => bufferedProcess.start());
      } else {
        this.setProxyServers(() => bufferedProcess.start());
      }
      return bufferedProcess;
    } else {
      return new BufferedProcess({ command, args, stdout, stderr, exit });
    }
  }

  loadInstalled(callback) {
    try {
      return callback(null, this.getLocalPackages());
    } catch (error) {
      return callback(error);
    }
  }

  loadFeatured(loadThemes, callback) {
    if (!callback) {
      callback = loadThemes;
      loadThemes = false;
    }

    return callback(null, []);
  }

  loadOutdated(clearCache, callback) {
    if (clearCache) {
      this.clearOutdatedCache();
      // Short circuit if we have cached data.
    } else if (this.apmCache.loadOutdated.value && this.apmCache.loadOutdated.expiry > Date.now()) {
      return callback(null, this.apmCache.loadOutdated.value);
    }

    this.getGitPackageUpdates().then((updatablePackages) => {
      this.apmCache.loadOutdated = {
        value: updatablePackages,
        expiry: Date.now() + this.CACHE_EXPIRY,
      };

      for (const pack of Array.from(updatablePackages)) {
        this.emitPackageEvent("update-available", pack);
      }

      return callback(null, updatablePackages);
    }, callback);
  }

  getVersionPinnedPackages() {
    let left;
    return (left = atom.config.get("core.versionPinnedPackages")) != null ? left : [];
  }

  clearOutdatedCache() {
    return (this.apmCache.loadOutdated = {
      value: null,
      expiry: 0,
    });
  }

  loadPackage(packageName, callback) {
    const pack = this.getAllLocalPackages().find((pack) => pack.name === packageName);
    if (pack) {
      return callback(null, pack);
    } else {
      return callback(new Error(`Package '${packageName}' is not installed.`));
    }
  }

  loadCompatiblePackageVersion(packageName, callback) {
    return this.loadPackage(packageName, (error, pack) => callback(null, error ? {} : pack));
  }

  getInstalled() {
    return new Promise((resolve, reject) => {
      this.loadInstalled(function (error, result) {
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
      return this.loadFeatured(!!loadThemes, function (error, result) {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }

  getOutdated(clearCache) {
    if (clearCache == null) {
      clearCache = false;
    }
    return new Promise((resolve, reject) => {
      this.loadOutdated(clearCache, function (error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  getPackage(packageName) {
    return this.packagePromises[packageName] != null
      ? this.packagePromises[packageName]
      : (this.packagePromises[packageName] = new Promise((resolve, reject) => {
          this.loadPackage(packageName, function (error, result) {
            if (error) {
              return reject(error);
            } else {
              return resolve(result);
            }
          });
        }));
  }

  satisfiesVersion(version, metadata) {
    const engine =
      (metadata.engines != null ? metadata.engines.atom : undefined) != null
        ? metadata.engines != null
          ? metadata.engines.atom
          : undefined
        : "*";
    if (!semver.validRange(engine)) {
      return false;
    }
    return semver.satisfies(version, engine);
  }

  normalizeVersion(version) {
    if (typeof version === "string") {
      [version] = Array.from(version.split("-"));
    }
    return version;
  }

  update(pack, newVersion, callback) {
    const { name, theme, apmInstallSource } = pack;

    const errorMessage = newVersion
      ? `Updating to \u201C${name}@${newVersion}\u201D failed.`
      : "Updating to latest sha failed.";
    const onError = (error) => {
      error.packageInstallError = !theme;
      this.emitPackageEvent("update-failed", pack, error);
      return typeof callback === "function" ? callback(error) : undefined;
    };

    if ((apmInstallSource != null ? apmInstallSource.type : undefined) !== "git") {
      const error = new Error("Only GitHub package updates are supported.");
      error.packageInstallError = !theme;
      return onError(error);
    }

    this.emitPackageEvent("updating", pack);
    this.installGitHubPackage(_.extend({}, pack, { name: apmInstallSource.source })).then(
      (updatedPack) => {
        this.clearOutdatedCache();
        if (typeof callback === "function") {
          callback();
        }
        return this.emitPackageEvent("updated", updatedPack);
      },
      (error) => {
        error.message = error.message || errorMessage;
        return onError(error);
      },
    );
  }

  unload(name) {
    if (atom.packages.isPackageLoaded(name)) {
      if (atom.packages.isPackageActive(name)) {
        atom.packages.deactivatePackage(name);
      }
      return atom.packages.unloadPackage(name);
    }
  }

  install(pack, callback) {
    let { name, version, theme } = pack;
    const activateOnSuccess = !theme;
    const activateOnFailure = atom.packages.isPackageActive(name);
    const nameWithVersion = version != null ? `${name}@${version}` : name;

    const errorMessage = `Installing \u201C${nameWithVersion}\u201D failed.`;
    const onError = (error) => {
      error.packageInstallError = !theme;
      this.emitPackageEvent("install-failed", pack, error);
      return typeof callback === "function" ? callback(error) : undefined;
    };

    this.emitPackageEvent("installing", pack);
    this.installGitHubPackage(pack).then(
      (installedPack) => {
        pack = _.extend({}, pack, installedPack);
        ({ name } = pack);
        this.clearOutdatedCache();
        if (activateOnSuccess && !atom.packages.isPackageDisabled(name)) {
          atom.packages.activatePackage(name);
        } else {
          atom.packages.loadPackage(name);
        }

        if (typeof callback === "function") {
          callback();
        }
        return this.emitPackageEvent("installed", pack);
      },
      (error) => {
        if (activateOnFailure) {
          atom.packages.activatePackage(name);
        }
        error.message = error.message || errorMessage;
        return onError(error);
      },
    );
  }

  uninstall(pack, callback) {
    const { name } = pack;

    if (atom.packages.isPackageActive(name)) {
      atom.packages.deactivatePackage(name);
    }

    const errorMessage = `Uninstalling \u201C${name}\u201D failed.`;
    const onError = (error) => {
      this.emitPackageEvent("uninstall-failed", pack, error);
      return typeof callback === "function" ? callback(error) : undefined;
    };

    try {
      this.emitPackageEvent("uninstalling", pack);
      const packagePath =
        atom.packages.resolvePackagePath(name) || path.join(this.getAtomPackagesDirectory(), name);
      if (atom.packages.isPackageActive(name)) {
        atom.packages.deactivatePackage(name);
      }
      if (atom.packages.isPackageLoaded(name)) {
        atom.packages.unloadPackage(name);
      }
      if (fs.isDirectorySync(packagePath)) {
        fs.removeSync(packagePath);
      }
      this.clearOutdatedCache();
      this.removePackageNameFromDisabledPackages(name);
      if (typeof callback === "function") {
        callback();
      }
      return this.emitPackageEvent("uninstalled", pack);
    } catch (error) {
      error.message = error.message || errorMessage;
      return onError(error);
    }
  }

  canUpgrade(installedPackage, availableVersion) {
    if (installedPackage == null) {
      return false;
    }

    const installedVersion = installedPackage.metadata.version;
    if (!semver.valid(installedVersion)) {
      return false;
    }
    if (!semver.valid(availableVersion)) {
      return false;
    }

    return semver.gt(availableVersion, installedVersion);
  }

  getPackageTitle({ name }) {
    return _.undasherize(_.uncamelcase(name));
  }

  getRepositoryUrl({ metadata }) {
    let left;
    const { repository } = metadata;
    let repoUrl =
      (left =
        (repository != null ? repository.url : undefined) != null
          ? repository != null
            ? repository.url
            : undefined
          : repository) != null
        ? left
        : "";
    if (repoUrl.match("git@github")) {
      const repoName = repoUrl.split(":")[1];
      repoUrl = `https://github.com/${repoName}`;
    }
    return repoUrl
      .replace(/\.git$/, "")
      .replace(/\/+$/, "")
      .replace(/^git\+/, "");
  }

  getRepositoryBugUri({ metadata }) {
    let bugUri;
    const { bugs } = metadata;
    if (typeof bugs === "string") {
      bugUri = bugs;
    } else {
      let left;
      bugUri =
        (left =
          (bugs != null ? bugs.url : undefined) != null
            ? bugs != null
              ? bugs.url
              : undefined
            : bugs != null
              ? bugs.email
              : undefined) != null
          ? left
          : this.getRepositoryUrl({ metadata }) + "/issues/new";
      if (bugUri.includes("@")) {
        bugUri = "mailto:" + bugUri;
      }
    }
    return bugUri;
  }

  checkNativeBuildTools() {
    return Promise.all([
      this.runProcess(this.getGitCommand(), ["--version"]),
      this.runProcess(this.getNpmCommand(), ["--version"]),
    ]);
  }

  getAtomPackagesDirectory() {
    return path.join(process.env.ATOM_HOME, "packages");
  }

  getGitCommand() {
    return "git";
  }

  getNpmCommand() {
    return process.platform === "win32" ? "npm.cmd" : "npm";
  }

  runProcess(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      const process = new BufferedProcess({
        command,
        args,
        options,
        stdout(output) {
          stdout += output;
        },
        stderr(output) {
          stderr += output;
        },
        exit(code) {
          if (code === 0) {
            resolve({ code, stdout, stderr });
          } else {
            const error = new Error(stderr || stdout || `${command} failed with exit code ${code}`);
            error.stdout = stdout;
            error.stderr = stderr;
            reject(error);
          }
        },
      });

      process.onWillThrowError(({ error, handle }) => {
        handle();
        error.stdout = stdout;
        error.stderr = stderr || error.message;
        reject(error);
      });
    });
  }

  getGitHubInfo(source) {
    const gitUrlInfo = hostedGitInfo.fromUrl(source);
    return gitUrlInfo && gitUrlInfo.type === "github" ? gitUrlInfo : null;
  }

  getCloneUrl(source) {
    const gitUrlInfo = this.getGitHubInfo(source);
    if (!gitUrlInfo) {
      throw new Error(
        "Enter a GitHub repository such as owner/repo or https://github.com/owner/repo.",
      );
    }

    if (gitUrlInfo.default === "sshurl") {
      return gitUrlInfo.toString();
    } else {
      return gitUrlInfo.https().replace(/^git\+https:/, "https:");
    }
  }

  async installGitHubPackage(pack) {
    const source = pack.name;
    const cloneUrl = this.getCloneUrl(source);
    const cloneDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lumine-package-")));

    await this.runProcess(this.getGitCommand(), ["clone", "--depth", "1", cloneUrl, cloneDir]);
    const { stdout: shaOutput } = await this.runProcess(
      this.getGitCommand(),
      ["rev-parse", "HEAD"],
      { cwd: cloneDir },
    );
    await this.runProcess(this.getNpmCommand(), ["install", "--production"], { cwd: cloneDir });

    const metadataFilePath = CSON.resolve(path.join(cloneDir, "package"));
    if (!metadataFilePath) {
      throw new Error(
        "The GitHub repository does not contain a package.json or package.cson file.",
      );
    }

    const metadata = CSON.readFileSync(metadataFilePath);
    const sha = shaOutput.trim();
    metadata.apmInstallSource = {
      type: "git",
      source,
      sha,
    };
    this.writePackageMetadata(metadataFilePath, metadata);

    const packageName = metadata.name || path.basename(source);
    this.unload(packageName);
    const targetDir = path.join(this.getAtomPackagesDirectory(), packageName);
    fs.removeSync(targetDir);
    fs.copySync(cloneDir, targetDir);
    fs.removeSync(path.join(targetDir, ".git"));
    fs.removeSync(cloneDir);

    return _.extend({}, pack, metadata, {
      name: packageName,
      installPath: targetDir,
      gitUrlInfo: pack.gitUrlInfo,
      apmInstallSource: metadata.apmInstallSource,
    });
  }

  writePackageMetadata(metadataFilePath, metadata) {
    if (path.extname(metadataFilePath) === ".json") {
      fs.writeFileSync(metadataFilePath, `${JSON.stringify(metadata, null, 2)}\n`);
    } else {
      CSON.writeFileSync(metadataFilePath, metadata);
    }
  }

  getLocalPackages() {
    const packages = { dev: [], user: [], core: [], git: [] };
    const configDirPath = atom.getConfigDirPath ? atom.getConfigDirPath() : process.env.ATOM_HOME;
    const devPackagesPath = path.join(configDirPath, "dev", "packages");

    for (const pack of atom.packages.getAvailablePackages()) {
      const metadata = atom.packages.loadPackageMetadata(pack, true) || {};
      const packageInfo = _.extend({}, metadata, {
        name: metadata.name || pack.name,
        path: pack.path,
      });

      if (packageInfo.apmInstallSource && packageInfo.apmInstallSource.type === "git") {
        packages.git.push(packageInfo);
      } else if (pack.isBundled) {
        packages.core.push(packageInfo);
      } else if (pack.path && pack.path.startsWith(devPackagesPath)) {
        packages.dev.push(packageInfo);
      } else {
        packages.user.push(packageInfo);
      }
    }

    return packages;
  }

  getAllLocalPackages() {
    const packages = this.getLocalPackages();
    return [].concat(packages.dev, packages.user, packages.core, packages.git);
  }

  async getGitPackageUpdates() {
    const updates = [];
    const pinnedPackages = this.getVersionPinnedPackages();
    const gitPackages = this.getLocalPackages().git;

    for (const pack of gitPackages) {
      if (pinnedPackages.includes(pack.name)) {
        continue;
      }
      const source = pack.apmInstallSource && pack.apmInstallSource.source;
      const currentSha = pack.apmInstallSource && pack.apmInstallSource.sha;
      if (!source || !currentSha) {
        continue;
      }

      try {
        const cloneUrl = this.getCloneUrl(source);
        const { stdout } = await this.runProcess(this.getGitCommand(), [
          "ls-remote",
          cloneUrl,
          "HEAD",
        ]);
        const latestSha = stdout.trim().split(/\s+/)[0];
        if (latestSha && latestSha !== currentSha) {
          updates.push(_.extend({}, pack, { latestSha }));
        }
      } catch (error) {}
    }

    return updates;
  }

  removePackageNameFromDisabledPackages(packageName) {
    return atom.config.removeAtKeyPath("core.disabledPackages", packageName);
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
    const theme =
      pack.theme != null ? pack.theme : pack.metadata != null ? pack.metadata.theme : undefined;
    eventName = theme ? `theme-${eventName}` : `package-${eventName}`;
    return this.emitter.emit(eventName, { pack, error });
  }

  on(selectors, callback) {
    const subscriptions = new CompositeDisposable();
    for (let selector of Array.from(selectors.split(" "))) {
      subscriptions.add(this.emitter.on(selector, callback));
    }
    return subscriptions;
  }
};

const createJsonParseError = (message, parseError, stdout) => {
  const error = new Error(message);
  error.stdout = "";
  error.stderr = `${parseError.message}: ${stdout}`;
  return error;
};

const createProcessError = (message, processError) => {
  const error = new Error(message);
  error.stdout = "";
  error.stderr = processError.message;
  return error;
};

const handleProcessErrors = (apmProcess, message, callback) =>
  apmProcess.onWillThrowError(function ({ error, handle }) {
    handle();
    return callback(createProcessError(message, error));
  });
