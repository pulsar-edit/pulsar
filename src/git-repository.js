const path = require("path");
const fs = require("@lumine-code/fs-plus");
const _ = require("@lumine-code/underscore-plus");
const { Emitter, Disposable, CompositeDisposable } = require("event-kit");
const GitUtils = require("@lumine-code/git-utils");
const DugiteRepositoryStatusProvider = require("./dugite-repository-status-provider");
const { EMPTY_STATUS_SNAPSHOT, parseStatusSnapshot } = require("./repository-status-snapshot");

let nextId = 0;

function statusPathKey(filePath) {
  const normalized = filePath.split(path.sep).join("/").replace(/^\.\//, "");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

// Extended: Represents the underlying git operations performed by Lumine.
//
// This class shouldn't be instantiated directly but instead by accessing the
// `atom.repositories` and calling `getRepositories()` or `getForPath()`. It is
// independent from project roots and may represent containing or nested repos.
//
// This class handles submodules automatically by taking a `path` argument to many
// of the methods.  This `path` argument will determine which underlying
// repository is used.
//
// For a repository with submodules this would have the following outcome:
//
// ```coffee
// repo = atom.repositories.getRepositories()[0]
// repo.getShortHead() # 'master'
// repo.getShortHead('vendor/path/to/a/submodule') # 'dead1234'
// ```
//
// ## Examples
//
// ### Logging the URL of the origin remote
//
// ```coffee
// git = atom.repositories.getRepositories()[0]
// console.log git.getOriginURL()
// ```
//
// ### Requiring in packages
//
// ```coffee
// {GitRepository} = require 'atom'
// ```
module.exports = class GitRepository {
  static exists(path) {
    const git = this.open(path);
    if (git) {
      git.destroy();
      return true;
    } else {
      return false;
    }
  }

  /*
  Section: Construction and Destruction
  */

  // Public: Creates a new GitRepository instance.
  //
  // * `path` The {String} path to the Git repository to open.
  // * `options` An optional {Object} with the following keys:
  //   * `refreshOnWindowFocus` A {Boolean}, `true` to refresh the index and
  //     statuses when the window is focused.
  //
  // Returns a {GitRepository} instance or `null` if the repository could not be opened.
  static open(path, options) {
    if (!path) {
      return null;
    }
    try {
      return new GitRepository(path, options);
    } catch {
      return null;
    }
  }

  constructor(path, options = {}) {
    this.id = nextId++;
    this.emitter = new Emitter();
    this.subscriptions = new CompositeDisposable();
    this.repo = GitUtils.open(path);
    if (this.repo == null) {
      throw new Error(`No Git repository found searching path: ${path}`);
    }

    this.statusRefreshCount = 0;
    this.statuses = {};
    this.statusSnapshotProvider =
      options.statusSnapshotProvider || new DugiteRepositoryStatusProvider();
    this.statusSnapshot = EMPTY_STATUS_SNAPSHOT;
    this.statusSnapshotCacheKey = null;
    this.statusSnapshotRefreshCount = 0;
    this.statusEntriesByPath = new Map();
    this.statusSnapshotSubscriberCount = 0;
    this.statusSnapshotDebounceMs = options.statusSnapshotDebounceMs ?? 150;
    this.statusSnapshotRefreshTimer = null;
    this.pendingStatusSnapshotLoad = null;
    this.upstream = { ahead: 0, behind: 0 };
    for (let submodulePath in this.repo.submodules) {
      const submoduleRepo = this.repo.submodules[submodulePath];
      submoduleRepo.upstream = { ahead: 0, behind: 0 };
    }

    this.project = options.project;
    this.config = options.config;
    this.operations = null;

    if (options.refreshOnWindowFocus || options.refreshOnWindowFocus == null) {
      const onWindowFocus = () => {
        this.refreshIndex();
        this.refreshStatus();
      };

      window.addEventListener("focus", onWindowFocus);
      this.subscriptions.add(
        new Disposable(() => window.removeEventListener("focus", onWindowFocus)),
      );
    }

    if (this.project != null) {
      this.project.getBuffers().forEach((buffer) => this.subscribeToBuffer(buffer));
      this.subscriptions.add(
        this.project.onDidAddBuffer((buffer) => this.subscribeToBuffer(buffer)),
      );
    }
  }

  // Public: Destroy this {GitRepository} object.
  //
  // This destroys any tasks and subscriptions and releases the underlying
  // libgit2 repository handle. This method is idempotent.
  destroy() {
    this.statusSnapshotRefreshCount++;
    this.repo = null;
    this.operations = null;
    this.statusSnapshotProvider = null;
    this.statusEntriesByPath.clear();
    if (this.statusSnapshotRefreshTimer != null) {
      clearTimeout(this.statusSnapshotRefreshTimer);
      this.statusSnapshotRefreshTimer = null;
    }

    if (this.emitter) {
      this.emitter.emit("did-destroy");
      this.emitter.dispose();
      this.emitter = null;
    }

    if (this.subscriptions) {
      this.subscriptions.dispose();
      this.subscriptions = null;
    }
  }

  // Public: Returns a {Boolean} indicating if this repository has been destroyed.
  isDestroyed() {
    return this.repo == null;
  }

  // Public: Returns whether this repository's Git directory still exists.
  isPresent() {
    return !this.isDestroyed() && fs.existsSync(this.path || this.getPath());
  }

  // Public: Returns the stable write facade assigned by atom.repositories.
  // Its methods are enabled by atom.repository-operation-provider services.
  getOperations() {
    return this.operations;
  }

  setOperations(operations) {
    this.operations = operations;
  }

  // Public: Invoke the given callback when this GitRepository's destroy() method
  // is invoked.
  //
  // * `callback` {Function}
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidDestroy(callback) {
    return this.emitter.once("did-destroy", callback);
  }

  /*
  Section: Event Subscription
  */

  // Public: Invoke the given callback when a specific file's status has
  // changed. When a file is updated, reloaded, etc, and the status changes, this
  // will be fired.
  //
  // * `callback` {Function}
  //   * `event` {Object}
  //     * `path` {String} the path whose status changed
  //     * `pathStatus` {Number} representing the status. This value can be passed to
  //       {::isStatusModified} or {::isStatusNew} to get more information.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeStatus(callback) {
    return this.emitter.on("did-change-status", callback);
  }

  // Public: Invoke the given callback when multiple files' statuses have
  // changed. For example, on window focus, the status of all the paths in the
  // repo is checked. If any of them have changed, this will be fired. Call
  // {::getPathStatus} to get the status for your path of choice.
  //
  // * `callback` {Function}
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeStatuses(callback) {
    return this.emitter.on("did-change-statuses", callback);
  }

  // Public: Invoke the given callback when the detailed repository status
  // snapshot changes.
  //
  // Subscribing declares interest: the repository lazily loads the first
  // snapshot and keeps it fresh with debounced background refreshes while at
  // least one subscriber exists. Consumers never call
  // {::refreshStatusSnapshot} themselves.
  //
  // * `callback` {Function} called with an immutable status snapshot.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeStatusSnapshot(callback) {
    this.statusSnapshotSubscriberCount++;
    this.scheduleStatusSnapshotRefresh();
    const subscription = this.emitter.on("did-change-status-snapshot", callback);
    let disposed = false;
    return new Disposable(() => {
      if (disposed) return;
      disposed = true;
      this.statusSnapshotSubscriberCount--;
      subscription.dispose();
    });
  }

  /*
  Section: Repository Details
  */

  // Public: A {String} indicating the type of version control system used by
  // this repository.
  //
  // Returns `"git"`.
  getType() {
    return "git";
  }

  // Public: Returns the {String} path of the repository.
  getPath() {
    if (this.path == null) {
      this.path = fs.absolute(this.getRepo().getPath());
    }
    return this.path;
  }

  // Public: Returns the {String} working directory path of the repository.
  getWorkingDirectory() {
    return this.getRepo().getWorkingDirectory();
  }

  // Public: Returns true if at the root, false if in a subfolder of the
  // repository.
  isProjectAtRoot() {
    if (this.projectAtRoot == null) {
      this.projectAtRoot =
        this.project && this.project.relativize(this.getWorkingDirectory()) === "";
    }
    return this.projectAtRoot;
  }

  // Public: Makes a path relative to the repository's working directory.
  relativize(path) {
    return this.getRepo().relativize(path);
  }

  // Public: Returns true if the given branch exists.
  hasBranch(branch) {
    return this.getReferenceTarget(`refs/heads/${branch}`) != null;
  }

  // Public: Retrieves a shortened version of the HEAD reference value.
  //
  // This removes the leading segments of `refs/heads`, `refs/tags`, or
  // `refs/remotes`.  It also shortens the SHA-1 of a detached `HEAD` to 7
  // characters.
  //
  // * `path` An optional {String} path in the repository to get this information
  //   for, only needed if the repository contains submodules.
  //
  // Returns a {String}.
  getShortHead(path) {
    return this.getRepo(path).getShortHead();
  }

  // Public: Is the given path a submodule in the repository?
  //
  // * `filePath` The {String} path to check.
  //
  // Returns a {Boolean}.
  isSubmodule(filePath) {
    if (!filePath) return false;

    const repo = this.getRepo(filePath);
    if (repo.isSubmodule(repo.relativize(filePath))) {
      return true;
    } else {
      // Check if the filePath is a working directory in a repo that isn't the root.
      return repo !== this.getRepo() && repo.relativize(path.join(filePath, "dir")) === "dir";
    }
  }

  // Public: Returns the number of commits behind the current branch is from the
  // its upstream remote branch.
  //
  // * `reference` The {String} branch reference name.
  // * `path`      The {String} path in the repository to get this information for,
  //   only needed if the repository contains submodules.
  getAheadBehindCount(reference, path) {
    return this.getRepo(path).getAheadBehindCount(reference);
  }

  // Public: Get the cached ahead/behind commit counts for the current branch's
  // upstream branch.
  //
  // * `path` An optional {String} path in the repository to get this information
  //   for, only needed if the repository has submodules.
  //
  // Returns an {Object} with the following keys:
  //   * `ahead`  The {Number} of commits ahead.
  //   * `behind` The {Number} of commits behind.
  getCachedUpstreamAheadBehindCount(path) {
    return this.getRepo(path).upstream || this.upstream;
  }

  // Public: Returns the git configuration value specified by the key.
  //
  // * `key`  The {String} key for the configuration to lookup.
  // * `path` An optional {String} path in the repository to get this information
  //   for, only needed if the repository has submodules.
  getConfigValue(key, path) {
    return this.getRepo(path).getConfigValue(key);
  }

  // Public: Returns the origin url of the repository.
  //
  // * `path` (optional) {String} path in the repository to get this information
  //   for, only needed if the repository has submodules.
  getOriginURL(path) {
    return this.getConfigValue("remote.origin.url", path);
  }

  // Public: Returns the upstream branch for the current HEAD, or null if there
  // is no upstream branch for the current HEAD.
  //
  // * `path` An optional {String} path in the repo to get this information for,
  //   only needed if the repository contains submodules.
  //
  // Returns a {String} branch name such as `refs/remotes/origin/master`.
  getUpstreamBranch(path) {
    return this.getRepo(path).getUpstreamBranch();
  }

  // Public: Gets all the local and remote references.
  //
  // * `path` An optional {String} path in the repository to get this information
  //   for, only needed if the repository has submodules.
  //
  // Returns an {Object} with the following keys:
  //  * `heads`   An {Array} of head reference names.
  //  * `remotes` An {Array} of remote reference names.
  //  * `tags`    An {Array} of tag reference names.
  getReferences(path) {
    return this.getRepo(path).getReferences();
  }

  // Public: Returns the current {String} SHA for the given reference.
  //
  // * `reference` The {String} reference to get the target of.
  // * `path` An optional {String} path in the repo to get the reference target
  //   for. Only needed if the repository contains submodules.
  getReferenceTarget(reference, path) {
    return this.getRepo(path).getReferenceTarget(reference);
  }

  /*
  Section: Reading Status
  */

  // Public: Returns true if the given path is modified.
  //
  // * `path` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `path` is modified.
  isPathModified(path) {
    return this.isStatusModified(this.getPathStatus(path));
  }

  // Public: Returns true if the given path is new.
  //
  // * `path` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `path` is new.
  isPathNew(path) {
    return this.isStatusNew(this.getPathStatus(path));
  }

  // Public: Is the given path ignored?
  //
  // * `path` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `path` is ignored.
  isPathIgnored(path) {
    return this.getRepo().isIgnored(this.relativize(path));
  }

  // Public: Get the status of a directory in the repository's working directory.
  //
  // * `directoryPath` The {String} directory path to check.
  //
  // Returns a {Number} representing the status. This value can be passed to
  // {::isStatusModified} or {::isStatusNew} to get more information.
  getDirectoryStatus(directoryPath) {
    directoryPath = `${this.relativize(directoryPath)}/`;
    let directoryStatus = 0;
    for (let statusPath in this.statuses) {
      const status = this.statuses[statusPath];
      if (statusPath.startsWith(directoryPath)) directoryStatus |= status;
    }
    return directoryStatus;
  }

  // Public: Get the status of a single path in the repository.
  //
  // * `path` A {String} repository-relative path.
  //
  // Returns a {Number} representing the status. This value can be passed to
  // {::isStatusModified} or {::isStatusNew} to get more information.
  getPathStatus(path) {
    const repo = this.getRepo(path);
    const relativePath = this.relativize(path);
    const currentPathStatus = this.statuses[relativePath] || 0;
    let pathStatus = repo.getStatus(repo.relativize(path)) || 0;
    if (repo.isStatusIgnored(pathStatus)) pathStatus = 0;
    if (pathStatus > 0) {
      this.statuses[relativePath] = pathStatus;
    } else {
      delete this.statuses[relativePath];
    }
    if (currentPathStatus !== pathStatus) {
      this.emitter.emit("did-change-status", { path, pathStatus });
      this.scheduleStatusSnapshotRefresh();
    }

    return pathStatus;
  }

  // Public: Get the cached status for the given path.
  //
  // * `path` A {String} path in the repository, relative or absolute.
  //
  // Returns a status {Number} or null if the path is not in the cache.
  getCachedPathStatus(path) {
    return this.statuses[this.relativize(path)];
  }

  // Public: Return the latest immutable detailed status snapshot. It contains
  // `head`, `upstream`, per-file staged/unstaged/conflict state, aggregate
  // `counts`, and a monotonic `generation`. The initial snapshot has
  // `initialized: false`; subscribe with {::onDidChangeStatusSnapshot} or call
  // {::ensureStatusSnapshot} to load it.
  getStatusSnapshot() {
    return this.statusSnapshot;
  }

  // Public: Resolve with an initialized status snapshot, loading it on first
  // call. Concurrent callers share one in-flight refresh.
  //
  // Returns a {Promise} that resolves to the snapshot.
  async ensureStatusSnapshot(options = {}) {
    if (this.statusSnapshot.initialized) return this.statusSnapshot;
    if (!this.pendingStatusSnapshotLoad) {
      this.pendingStatusSnapshotLoad = this.refreshStatusSnapshot(options).finally(() => {
        this.pendingStatusSnapshotLoad = null;
      });
    }
    return this.pendingStatusSnapshotLoad;
  }

  // Schedule a background snapshot refresh. Calls within the debounce window
  // coalesce into a single Git subprocess; the window is not extended by
  // repeated calls, so a continuous event stream cannot starve the refresh.
  scheduleStatusSnapshotRefresh() {
    if (this.isDestroyed() || this.statusSnapshotSubscriberCount === 0) return;
    if (this.statusSnapshotRefreshTimer != null) return;
    this.statusSnapshotRefreshTimer = setTimeout(() => {
      this.statusSnapshotRefreshTimer = null;
      if (this.isDestroyed()) return;
      // Background refreshes must never surface as unhandled rejections; the
      // stale-suppression counter and cache key keep failed runs harmless.
      this.refreshStatusSnapshot().catch(() => {});
    }, this.statusSnapshotDebounceMs);
  }

  // Public: Return detailed cached status for a repository path, or `null`.
  getStatusEntry(filePath) {
    if (filePath == null) return null;
    const inputPath = String(filePath);
    const relativePath = path.isAbsolute(inputPath) ? this.relativize(inputPath) : inputPath;
    return this.statusEntriesByPath.get(statusPathKey(relativePath)) || null;
  }

  // Public: Refresh the detailed branch and file status snapshot with Dugite.
  // This is intentionally independent from the synchronous git-utils cache so
  // hot path coloring never waits for a Git subprocess.
  async refreshStatusSnapshot(options = {}) {
    const provider = this.statusSnapshotProvider;
    if (!provider || this.isDestroyed()) throw new Error("Repository has been destroyed");

    const refreshCount = ++this.statusSnapshotRefreshCount;
    const includeIgnored = options.includeIgnored === true;
    const output = await provider.getStatus(this.getWorkingDirectory(), {
      ...options,
      includeIgnored,
    });

    if (this.isDestroyed() || refreshCount !== this.statusSnapshotRefreshCount) {
      return this.statusSnapshot;
    }

    const cacheKey = `${includeIgnored ? "ignored" : "tracked"}\0${output}`;
    if (cacheKey === this.statusSnapshotCacheKey) return this.statusSnapshot;

    const snapshot = parseStatusSnapshot(output, {
      generation: this.statusSnapshot.generation + 1,
      includesIgnored: includeIgnored,
    });
    this.statusSnapshot = snapshot;
    this.statusSnapshotCacheKey = cacheKey;
    this.statusEntriesByPath = new Map(
      snapshot.files.map((entry) => [statusPathKey(entry.path), entry]),
    );
    this.emitter.emit("did-change-status-snapshot", snapshot);
    return snapshot;
  }

  // Public: Returns true if the given status indicates modification.
  //
  // * `status` A {Number} representing the status.
  //
  // Returns a {Boolean} that's true if the `status` indicates modification.
  isStatusModified(status) {
    return this.getRepo().isStatusModified(status);
  }

  // Public: Returns true if the given status indicates a new path.
  //
  // * `status` A {Number} representing the status.
  //
  // Returns a {Boolean} that's true if the `status` indicates a new path.
  isStatusNew(status) {
    return this.getRepo().isStatusNew(status);
  }

  /*
  Section: Retrieving Diffs
  */

  // Public: Retrieves the number of lines added and removed to a path.
  //
  // This compares the working directory contents of the path to the `HEAD`
  // version.
  //
  // * `path` The {String} path to check.
  //
  // Returns an {Object} with the following keys:
  //   * `added` The {Number} of added lines.
  //   * `deleted` The {Number} of deleted lines.
  getDiffStats(path) {
    const repo = this.getRepo(path);
    return repo.getDiffStats(repo.relativize(path));
  }

  // Public: Retrieves the line diffs comparing the `HEAD` version of the given
  // path and the given text.
  //
  // * `path` The {String} path relative to the repository.
  // * `text` The {String} to compare against the `HEAD` contents
  //
  // Returns an {Array} of hunk {Object}s with the following keys:
  //   * `oldStart` The line {Number} of the old hunk.
  //   * `newStart` The line {Number} of the new hunk.
  //   * `oldLines` The {Number} of lines in the old hunk.
  //   * `newLines` The {Number} of lines in the new hunk
  getLineDiffs(path, text) {
    // Ignore eol of line differences on windows so that files checked in as
    // LF don't report every line modified when the text contains CRLF endings.
    const options = { ignoreEolWhitespace: process.platform === "win32" };
    const repo = this.getRepo(path);
    return repo.getLineDiffs(repo.relativize(path), text, options);
  }

  /*
  Section: Checking Out
  */

  // Public: Restore the contents of a path in the working directory and index
  // to the version at `HEAD`.
  //
  // This is essentially the same as running:
  //
  // ```sh
  //   git reset HEAD -- <path>
  //   git checkout HEAD -- <path>
  // ```
  //
  // * `path` The {String} path to checkout.
  //
  // Returns a {Boolean} that's true if the method was successful.
  checkoutHead(path) {
    const repo = this.getRepo(path);
    const headCheckedOut = repo.checkoutHead(repo.relativize(path));
    if (headCheckedOut) this.getPathStatus(path);
    return headCheckedOut;
  }

  // Public: Checks out a branch in your repository.
  //
  // * `reference` The {String} reference to checkout.
  // * `create`    A {Boolean} value which, if true creates the new reference if
  //   it doesn't exist.
  //
  // Returns a Boolean that's true if the method was successful.
  checkoutReference(reference, create) {
    return this.getRepo().checkoutReference(reference, create);
  }

  /*
  Section: Private
  */

  // Subscribes to buffer events.
  subscribeToBuffer(buffer) {
    const getBufferPathStatus = () => {
      const bufferPath = buffer.getPath();
      if (bufferPath && !this.isDestroyed()) this.getPathStatus(bufferPath);
    };

    getBufferPathStatus();
    const bufferSubscriptions = new CompositeDisposable();
    bufferSubscriptions.add(buffer.onDidSave(getBufferPathStatus));
    bufferSubscriptions.add(buffer.onDidReload(getBufferPathStatus));
    bufferSubscriptions.add(buffer.onDidChangePath(getBufferPathStatus));
    bufferSubscriptions.add(
      buffer.onDidDestroy(() => {
        bufferSubscriptions.dispose();
        return this.subscriptions.remove(bufferSubscriptions);
      }),
    );
    this.subscriptions.add(bufferSubscriptions);
  }

  // Subscribes to editor view event.
  checkoutHeadForEditor(editor) {
    const buffer = editor.getBuffer();
    const bufferPath = buffer.getPath();
    if (bufferPath) {
      this.checkoutHead(bufferPath);
      return buffer.reload();
    }
  }

  // Returns the corresponding {Repository}
  getRepo(path) {
    if (this.repo) {
      return this.repo.submoduleForPath(path) || this.repo;
    } else {
      throw new Error("Repository has been destroyed");
    }
  }

  // Reread the index to update any values that have changed since the
  // last time the index was read.
  refreshIndex() {
    return this.getRepo().refreshIndex();
  }

  // Refreshes the current git status in an outside process and asynchronously
  // updates the relevant properties.
  async refreshStatus() {
    const statusRefreshCount = ++this.statusRefreshCount;
    const repo = this.getRepo();

    const relativeProjectPaths =
      this.project &&
      this.project
        .getPaths()
        .map((projectPath) => this.relativize(projectPath))
        .filter((projectPath) => projectPath.length > 0 && !path.isAbsolute(projectPath));

    const branch = await repo.getHeadAsync();
    const upstream = await repo.getAheadBehindCountAsync();

    const statuses = {};
    const repoStatus =
      relativeProjectPaths?.length > 0
        ? await repo.getStatusAsync(relativeProjectPaths)
        : await repo.getStatusAsync();
    for (let filePath in repoStatus) {
      statuses[filePath] = repoStatus[filePath];
    }

    const submodules = {};
    for (let submodulePath in repo.submodules) {
      const submoduleRepo = repo.submodules[submodulePath];
      submodules[submodulePath] = {
        branch: await submoduleRepo.getHeadAsync(),
        upstream: await submoduleRepo.getAheadBehindCountAsync(),
      };

      const workingDirectoryPath = submoduleRepo.getWorkingDirectory();
      const submoduleStatus = await submoduleRepo.getStatusAsync();
      for (let filePath in submoduleStatus) {
        const absolutePath = path.join(workingDirectoryPath, filePath);
        const relativizePath = repo.relativize(absolutePath);
        statuses[relativizePath] = submoduleStatus[filePath];
      }
    }

    if (this.statusRefreshCount !== statusRefreshCount || this.isDestroyed()) return;

    const statusesUnchanged =
      _.isEqual(branch, this.branch) &&
      _.isEqual(statuses, this.statuses) &&
      _.isEqual(upstream, this.upstream) &&
      _.isEqual(submodules, this.submodules);

    this.branch = branch;
    this.statuses = statuses;
    this.upstream = upstream;
    this.submodules = submodules;

    for (let submodulePath in repo.submodules) {
      repo.submodules[submodulePath].upstream = submodules[submodulePath].upstream;
    }

    if (!statusesUnchanged) this.emitter.emit("did-change-statuses");
    this.scheduleStatusSnapshotRefresh();
  }
};
