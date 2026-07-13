const _ = require("underscore-plus");
const { BufferedProcess, CompositeDisposable, Emitter } = require("atom");
const CSON = require("season");
const fs = require("fs-plus");
const hostedGitInfo = require("hosted-git-info");
const os = require("os");
const path = require("path");
const semver = require("semver");
const {
  cloneUrlForRepository,
  parsePackageSource,
  resolvePackageSource,
} = require("../../../src/package-source"); // eslint-disable-line n/no-unpublished-require

const Client = require("./atom-io-client");
const CommunityPackageCatalogClient = require("./community-package-catalog-client");
const PulsarPackageClient = require("./pulsar-package-client");
const { packageOrigin, repoReferenceFromRepository } = require("./utils");

module.exports = class PackageManager {
  constructor() {
    // Millisecond expiry for cached loadOutdated, etc. values
    this.CACHE_EXPIRY = 1000 * 60 * 10;
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

  getCatalogClient() {
    return this.catalogClient != null
      ? this.catalogClient
      : (this.catalogClient = new CommunityPackageCatalogClient());
  }

  getPulsarClient() {
    return this.pulsarClient != null
      ? this.pulsarClient
      : (this.pulsarClient = new PulsarPackageClient());
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
      const error = new Error("Only Git repository package updates are supported.");
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

  async unload(name) {
    if (atom.packages.isPackageLoaded(name)) {
      if (atom.packages.isPackageActive(name)) {
        // Deactivation may be async; await it so unloadPackage() doesn't throw
        // "Tried to unload active package".
        await atom.packages.deactivatePackage(name);
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

  async uninstall(pack, callback) {
    const { name } = pack;

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
        // Await async deactivation before unloading (see ::unload).
        await atom.packages.deactivatePackage(name);
      }
      if (atom.packages.isPackageLoaded(name)) {
        atom.packages.unloadPackage(name);
      }
      if (fs.isDirectorySync(packagePath)) {
        await this.removePackageDir(packagePath);
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
    const { repository } = parsePackageSource(source);
    const gitUrlInfo = hostedGitInfo.fromUrl(repository);
    return gitUrlInfo && gitUrlInfo.type === "github" ? gitUrlInfo : null;
  }

  getCloneUrl(source) {
    return cloneUrlForRepository(parsePackageSource(source).repository);
  }

  resolvePackageSource(source) {
    return resolvePackageSource(source, async (cloneUrl, options, patterns) => {
      const { stdout } = await this.runProcess(this.getGitCommand(), [
        "ls-remote",
        ...options,
        cloneUrl,
        ...patterns,
      ]);
      return stdout;
    });
  }

  // Builds the source pinned to a specific version, honoring shorthand vs URL.
  pinSourceToVersion(parsed, version) {
    if (/^[\w.-]+\/[\w.-]+$/.test(parsed.repository)) {
      return `${parsed.repository}@${version}`;
    }
    return `${parsed.repository}#tag:${version}`;
  }

  // Removes a directory tree robustly and asynchronously. Async matters: a
  // synchronous remove of a deep node_modules tree blocks the renderer thread
  // and freezes the editor. Node's rm also retries on Windows' transient
  // ENOTEMPTY/EBUSY/EPERM (antivirus/indexer locks) and force-removes read-only
  // entries such as those under .git — fs-plus's bundled rimraf does neither.
  removePackageDir(dirPath) {
    return require("fs").promises.rm(dirPath, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }

  // Copies a directory tree asynchronously, so copying a large package (deep
  // node_modules) doesn't block the renderer thread like fs.copySync would.
  copyPackageDir(sourceDir, targetDir) {
    return require("fs").promises.cp(sourceDir, targetDir, { recursive: true });
  }

  async installGitHubPackage(pack) {
    const requestedSource =
      pack.installSource ||
      (pack.apmInstallSource &&
        pack.apmInstallSource.type === "git" &&
        pack.apmInstallSource.source) ||
      // The repository (owner/repo or a Git URL) is the reliable origin; fall
      // back to it before the bare package name, which is not a valid Git source
      // on its own. Catalog/registry packs may omit an explicit installSource.
      (typeof pack.repository === "string" && pack.repository) ||
      pack.name;
    const parsed = parsePackageSource(requestedSource);
    // For a fresh install of an unpinned source with a known version, install
    // exactly the version the user was looking at — a release pushed between
    // browsing and installing shouldn't be silently substituted. The recorded
    // update policy stays "latest-tag" so future updates still track releases.
    let pinnedVersion =
      !pack.apmInstallSource &&
      parsed.selector.type === "latest" &&
      pack.version &&
      semver.valid(pack.version)
        ? pack.version
        : null;
    let source = pinnedVersion ? this.pinSourceToVersion(parsed, pinnedVersion) : requestedSource;

    let resolvedSource;
    try {
      resolvedSource = await this.resolvePackageSource(source);
    } catch (error) {
      if (!pinnedVersion) throw error;
      // The exact version tag was not found; fall back to the latest available.
      pinnedVersion = null;
      source = requestedSource;
      resolvedSource = await this.resolvePackageSource(source);
    }

    const cloneDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lumine-package-")));

    try {
      await this.runProcess(this.getGitCommand(), ["init"], { cwd: cloneDir });
      await this.runProcess(
        this.getGitCommand(),
        ["remote", "add", "origin", resolvedSource.cloneUrl],
        { cwd: cloneDir },
      );
      await this.runProcess(
        this.getGitCommand(),
        ["fetch", "--depth", "1", "origin", resolvedSource.fetchRef],
        { cwd: cloneDir },
      );
      await this.runProcess(this.getGitCommand(), ["checkout", "--detach", "FETCH_HEAD"], {
        cwd: cloneDir,
      });
      const { stdout: shaOutput } = await this.runProcess(
        this.getGitCommand(),
        ["rev-parse", "HEAD"],
        { cwd: cloneDir },
      );
      const sha = shaOutput.trim();
      if (resolvedSource.sha && sha !== resolvedSource.sha) {
        throw new Error(`Repository ref changed while installing ${source}; please try again.`);
      }

      await this.runProcess(this.getNpmCommand(), ["install", "--omit=dev"], { cwd: cloneDir });

      const metadataFilePath = CSON.resolve(path.join(cloneDir, "package"));
      if (!metadataFilePath) {
        throw new Error("The repository does not contain a package.json or package.cson file.");
      }

      const metadata = CSON.readFileSync(metadataFilePath);
      metadata.apmInstallSource = {
        type: "git",
        // The canonical origin (owner/repo) of what was actually cloned. This is
        // the package's authoritative identity — recorded once here so no reader
        // ever re-derives it from the package.json "repository" field, which is
        // unreliable in forks.
        origin: repoReferenceFromRepository(resolvedSource.repository),
        // When pinned to a browsed version, record the unpinned source and a
        // latest-tag policy so updates keep tracking new releases even though a
        // specific version was installed now.
        source: pinnedVersion ? parsed.repository : resolvedSource.source,
        repository: resolvedSource.repository,
        selector: pinnedVersion
          ? { type: "latest", value: resolvedSource.selector.value }
          : resolvedSource.selector,
        updatePolicy: pinnedVersion ? "latest-tag" : resolvedSource.updatePolicy,
        version: resolvedSource.version,
        sha,
      };
      this.writePackageMetadata(metadataFilePath, metadata);

      const packageName = metadata.name || path.basename(resolvedSource.repository);
      this.assertNoNameCollision(packageName, resolvedSource);
      await this.unload(packageName);
      const targetDir = path.join(this.getAtomPackagesDirectory(), packageName);
      await this.removePackageDir(targetDir);
      await this.copyPackageDir(cloneDir, targetDir);
      await this.removePackageDir(path.join(targetDir, ".git"));

      return _.extend({}, pack, metadata, {
        name: packageName,
        installPath: targetDir,
        gitUrlInfo: pack.gitUrlInfo,
        apmInstallSource: metadata.apmInstallSource,
      });
    } finally {
      await this.removePackageDir(cloneDir);
    }
  }

  // Enforces the install-slot invariant: a name can be installed once. Refuses
  // to overwrite a package that shares its name with the one being installed but
  // comes from a different origin (source path). Reinstalls and updates of the
  // same package — same origin — are allowed through.
  assertNoNameCollision(packageName, resolvedSource) {
    if (atom.packages.isBundledPackage(packageName)) {
      throw new Error(`"${packageName}" is bundled with Lumine and cannot be replaced.`);
    }

    const installedDir = path.join(this.getAtomPackagesDirectory(), packageName);
    let metadata = null;
    try {
      const metadataFilePath = CSON.resolve(path.join(installedDir, "package"));
      if (metadataFilePath) metadata = CSON.readFileSync(metadataFilePath);
    } catch {
      return;
    }
    if (!metadata) return;

    const installedOrigin = packageOrigin(metadata);
    if (!installedOrigin) return;

    const candidateOrigin = packageOrigin({
      installSource: resolvedSource.source,
      repository: resolvedSource.repository,
    });
    if (candidateOrigin && candidateOrigin === installedOrigin) return;

    const installedFrom =
      typeof metadata.repository === "string"
        ? metadata.repository
        : metadata.repository && metadata.repository.url;
    throw new Error(
      `A different package named "${packageName}" is already installed${
        installedFrom ? ` from ${installedFrom}` : ""
      }. Uninstall it before installing this one.`,
    );
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

      // Record the install directory's own name so the UI can flag a package
      // whose folder does not match its package.json "name" — the folder IS the
      // install slot, so a mismatch breaks require, commands, config, and
      // activation. Bundled packages are curated and always match; skip them.
      if (!pack.isBundled && pack.path) {
        packageInfo.directoryName = path.basename(pack.path);
      }

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
    const gitPackages = this.getLocalPackages().git;

    for (const pack of gitPackages) {
      const source = pack.apmInstallSource && pack.apmInstallSource.source;
      const currentSha = pack.apmInstallSource && pack.apmInstallSource.sha;
      if (!source || !currentSha) {
        continue;
      }

      if (pack.apmInstallSource.updatePolicy === "pinned") {
        continue;
      }

      try {
        // Old installs did not record a selector and tracked the default branch.
        const resolved = pack.apmInstallSource.updatePolicy
          ? await this.resolvePackageSource(source)
          : null;
        let latestSha;
        let latestVersion;
        if (resolved) {
          latestSha = resolved.sha;
          latestVersion = resolved.version;
        } else {
          const cloneUrl = this.getCloneUrl(source);
          const { stdout } = await this.runProcess(this.getGitCommand(), [
            "ls-remote",
            cloneUrl,
            "HEAD",
          ]);
          latestSha = stdout.trim().split(/\s+/)[0];
        }
        if (latestSha && latestSha !== currentSha) {
          updates.push(_.extend({}, pack, { latestSha, latestVersion }));
        }
      } catch {
        // A single unreachable repository must not prevent other update checks.
      }
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
