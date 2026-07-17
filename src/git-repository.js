const path = require("path");
const fs = require("@lumine-code/fs-plus");
const _ = require("@lumine-code/underscore-plus");
const { Emitter, Disposable, CompositeDisposable } = require("event-kit");
const GitUtils = require("@lumine-code/git-utils");
const {
  GitHostStatusProvider,
  GitHostRefsProvider,
  GitHostDiffProvider,
  GitHostHistoryProvider,
} = require("./git-host-providers");
const { parseDiffPatch } = require("./repository-diff");
const {
  parseCommitRecords,
  parseNameStatusTokens,
  parseBlamePorcelain,
} = require("./repository-history");
const { EMPTY_STATUS_SNAPSHOT, parseStatusSnapshot } = require("./repository-status-snapshot");
const { EMPTY_REFS_SNAPSHOT, parseRefsSnapshot } = require("./repository-refs-snapshot");
const { relativize: relativizePath } = require("./repository-paths");

let nextId = 0;

function statusPathKey(filePath) {
  const normalized = filePath.split(path.sep).join("/").replace(/^\.\//, "");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

// Classify a snapshot entry the way the legacy git-utils status bits were
// classified by consumers (modified beats added, matching the old
// isStatusModified-first checks) so hybrid rendering never flickers when the
// snapshot supersedes the synchronous cache.
function summaryFromStatusEntry(entry) {
  const conflicted = entry.conflicted;
  const modified =
    !conflicted &&
    ((entry.indexStatus != null && entry.indexStatus !== "A") || entry.worktreeStatus != null);
  const added = !conflicted && !modified && (entry.untracked || entry.indexStatus === "A");
  return Object.freeze({
    source: "snapshot",
    conflicted,
    modified,
    added,
    renamed: entry.kind === "renamed" || entry.kind === "copied",
  });
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
    let git;
    try {
      git = this.open(path);
    } catch {
      // A dubious-ownership rejection (or any other open failure) means we
      // cannot vouch for a repository here; treat it as absent.
      return false;
    }
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
    } catch (error) {
      // Surface a dubious-ownership rejection so the caller can offer a bypass;
      // every other failure just means "no repository here".
      if (error && error.code === "DubiousOwnership") {
        throw error;
      }
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

    // Cache the working directory and filesystem traits once so path routing
    // (getWorkingDirectory/relativize) needs no native call per query. These are
    // fixed for the repository's lifetime.
    this.workingDirectoryPath = this.repo.getWorkingDirectory();
    this.openedWorkingDirectoryPath = this.repo.openedWorkingDirectory || null;
    this.caseInsensitiveFs = this.repo.caseInsensitiveFs === true;

    this.statusRefreshCount = 0;
    this.statuses = {};
    this.statusSnapshotProvider = options.statusSnapshotProvider || new GitHostStatusProvider();
    this.statusSnapshot = EMPTY_STATUS_SNAPSHOT;
    this.statusSnapshotCacheKey = null;
    this.statusSnapshotRefreshCount = 0;
    this.statusEntriesByPath = new Map();
    this.directoryStatusAggregates = new Map();
    this.ignoredFileKeys = new Set();
    this.ignoredDirKeys = [];
    this.statusSnapshotSubscriberCount = 0;
    this.statusSnapshotDebounceMs = options.statusSnapshotDebounceMs ?? 150;
    this.statusSnapshotRefreshTimer = null;
    this.pendingStatusSnapshotLoad = null;
    this.refsSnapshotProvider = options.refsSnapshotProvider || new GitHostRefsProvider();
    this.refsSnapshot = EMPTY_REFS_SNAPSHOT;
    this.refsSnapshotCacheKey = null;
    this.refsSnapshotRefreshCount = 0;
    this.refsSnapshotSubscriberCount = 0;
    this.refsSnapshotDebounceMs = options.refsSnapshotDebounceMs ?? 150;
    this.refsSnapshotRefreshTimer = null;
    this.pendingRefsSnapshotLoad = null;
    this.diffProvider = options.diffProvider || new GitHostDiffProvider();
    this.historyProvider = options.historyProvider || new GitHostHistoryProvider();
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
        // Refresh the Dugite snapshots (subscriber-gated) rather than the
        // legacy libgit2 status cache when the window regains focus.
        this.scheduleStatusSnapshotRefresh();
        this.scheduleRefsSnapshotRefresh();
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
    this.refsSnapshotRefreshCount++;
    this.repo = null;
    this.operations = null;
    this.statusSnapshotProvider = null;
    this.refsSnapshotProvider = null;
    this.diffProvider = null;
    this.historyProvider = null;
    this.statusEntriesByPath.clear();
    this.directoryStatusAggregates.clear();
    if (this.statusSnapshotRefreshTimer != null) {
      clearTimeout(this.statusSnapshotRefreshTimer);
      this.statusSnapshotRefreshTimer = null;
    }
    if (this.refsSnapshotRefreshTimer != null) {
      clearTimeout(this.refsSnapshotRefreshTimer);
      this.refsSnapshotRefreshTimer = null;
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

  // Public: Invoke the given callback when the repository refs snapshot
  // changes. Subscribing declares interest exactly like
  // {::onDidChangeStatusSnapshot}: the first subscriber triggers a lazy load
  // and refs stay fresh with debounced background refreshes.
  //
  // * `callback` {Function} called with an immutable refs snapshot.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeRefsSnapshot(callback) {
    this.refsSnapshotSubscriberCount++;
    this.scheduleRefsSnapshotRefresh();
    const subscription = this.emitter.on("did-change-refs-snapshot", callback);
    let disposed = false;
    return new Disposable(() => {
      if (disposed) return;
      disposed = true;
      this.refsSnapshotSubscriberCount--;
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
    return this.workingDirectoryPath;
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
    return relativizePath(
      path,
      this.workingDirectoryPath,
      this.openedWorkingDirectoryPath,
      this.caseInsensitiveFs,
    );
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
    // For the top-level repository, read the head from the status snapshot
    // (reliably loaded whenever the UI shows this repo). Submodule paths and the
    // pre-snapshot beat fall back to libgit2 (removed in a later phase).
    if (!path && this.statusSnapshot.initialized && this.statusSnapshot.head) {
      const head = this.statusSnapshot.head;
      if (head.name) return head.name;
      if (head.detached && head.oid) return head.oid.slice(0, 7);
    }
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

  // Public: Like {::isPathIgnored}, but resolved synchronously from the Dugite
  // status snapshot's ignored entries instead of libgit2. Falls back to
  // {::isPathIgnored} until the first snapshot loads so first paint is unchanged.
  //
  // * `filePath` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `filePath` is ignored.
  isPathIgnoredCached(filePath) {
    if (this.isDestroyed()) return false;

    if (this.statusSnapshot.initialized) {
      const relativePath = this.relativize(String(filePath));
      if (relativePath == null || relativePath === "") return false;
      const key = statusPathKey(relativePath);
      if (this.ignoredFileKeys.has(key)) return true;
      return this.ignoredDirKeys.some((dir) => key === dir || key.startsWith(`${dir}/`));
    }

    // Pre-snapshot fallback (removed with git-utils in a later phase).
    return this.getRepo().isIgnored(this.relativize(filePath));
  }

  // Refresh the cached git-utils status of a single path. Internal engine for
  // {::getPathStatusSummary}; consumers read summaries instead of status bits.
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

  // Cached git-utils status bits for a path. Internal; consumers read
  // {::getPathStatusSummary} instead.
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
    // Ignored entries are included by default so tree-view/tabs can resolve
    // ignore state synchronously from the snapshot ({::isPathIgnoredCached}).
    // Pass `includeIgnored: false` explicitly to opt out.
    const includeIgnored = options.includeIgnored !== false;
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
    this.directoryStatusAggregates = this.buildDirectoryStatusAggregates(snapshot);
    this.rebuildIgnoredIndex(snapshot);
    this.emitter.emit("did-change-status-snapshot", snapshot);
    return snapshot;
  }

  // Index the snapshot's ignored entries for O(1) `isPathIgnoredCached` lookups.
  // `git status --ignored=matching` collapses a fully-ignored directory to a
  // single `path/` entry, so those are kept as directory prefixes and everything
  // beneath them counts as ignored; individually-ignored files are exact keys.
  rebuildIgnoredIndex(snapshot) {
    const ignoredFileKeys = new Set();
    const ignoredDirKeys = [];
    for (const entry of snapshot.files) {
      if (!entry.ignored) continue;
      if (entry.path.endsWith("/")) {
        ignoredDirKeys.push(statusPathKey(entry.path.slice(0, -1)));
      } else {
        ignoredFileKeys.add(statusPathKey(entry.path));
      }
    }
    this.ignoredFileKeys = ignoredFileKeys;
    this.ignoredDirKeys = ignoredDirKeys;
  }

  // One pass over the snapshot's changed files, OR-ing each file's
  // classification into every ancestor directory ("" is the repository root),
  // so directory queries never rescan the file list.
  buildDirectoryStatusAggregates(snapshot) {
    const aggregates = new Map();
    for (const entry of snapshot.files) {
      if (entry.ignored) continue;
      const summary = summaryFromStatusEntry(entry);
      if (!summary.conflicted && !summary.modified && !summary.added) continue;

      let key = statusPathKey(entry.path);
      do {
        const separatorIndex = key.lastIndexOf("/");
        key = separatorIndex === -1 ? "" : key.slice(0, separatorIndex);
        let aggregate = aggregates.get(key);
        if (!aggregate) {
          aggregate = { conflicted: false, modified: false, added: false };
          aggregates.set(key, aggregate);
        }
        aggregate.conflicted = aggregate.conflicted || summary.conflicted;
        aggregate.modified = aggregate.modified || summary.modified;
        aggregate.added = aggregate.added || summary.added;
      } while (key !== "");
    }
    return aggregates;
  }

  // Public: Classified status for one path, independent of git-utils status
  // bits. Prefers the detailed status snapshot when it has loaded and falls
  // back to the synchronous cache, so consumers paint instantly on startup and
  // upgrade automatically. Paths only the synchronous cache knows (files
  // inside submodules) always use the cache.
  //
  // * `filePath` A {String} path, absolute or repository-relative.
  //
  // Returns a frozen `{source, conflicted, modified, added, renamed}` object
  // where `source` is `"snapshot"` or `"cache"`, or `null` for clean, ignored,
  // and unknown paths.
  getPathStatusSummary(filePath) {
    if (filePath == null || this.isDestroyed()) return null;

    if (this.statusSnapshot.initialized) {
      const entry = this.getStatusEntry(filePath);
      if (entry) return entry.ignored ? null : summaryFromStatusEntry(entry);
    }

    const status = this.statuses[this.relativize(String(filePath))];
    if (!status) return null;
    const modified = this.isStatusModified(status);
    const added = !modified && this.isStatusNew(status);
    if (!modified && !added) return null;
    return Object.freeze({ source: "cache", conflicted: false, modified, added, renamed: false });
  }

  // Public: Aggregate classified status for a directory, including the
  // repository root. Same sourcing and shape as {::getPathStatusSummary}
  // (without `renamed`); returns `null` when nothing below the directory has
  // a reportable status.
  getDirectoryStatusSummary(directoryPath) {
    if (directoryPath == null || this.isDestroyed()) return null;
    const relativePath = this.relativize(String(directoryPath));
    if (relativePath == null) return null;

    if (this.statusSnapshot.initialized) {
      const aggregate = this.directoryStatusAggregates.get(statusPathKey(relativePath));
      if (aggregate) {
        return Object.freeze({
          source: "snapshot",
          conflicted: aggregate.conflicted,
          modified: aggregate.modified,
          added: aggregate.added,
        });
      }
      // No aggregate: the directory is clean as far as the snapshot knows.
      // Fall through to the cache, which additionally tracks changes inside
      // submodules that the root-repository snapshot cannot see.
    }

    const prefix = relativePath === "" ? "" : `${relativePath}/`;
    let combinedStatus = 0;
    for (const statusPath in this.statuses) {
      if (prefix === "" || statusPath.startsWith(prefix)) {
        combinedStatus |= this.statuses[statusPath];
      }
    }
    if (combinedStatus === 0) return null;
    const modified = this.isStatusModified(combinedStatus);
    const added = !modified && this.isStatusNew(combinedStatus);
    if (!modified && !added) return null;
    return Object.freeze({ source: "cache", conflicted: false, modified, added });
  }

  // Public: Return the latest immutable refs snapshot. It contains `head`,
  // local `branches` with upstream tracking, `remoteBranches`, `tags`,
  // `remotes` with fetch and push URLs, `worktrees`, and a monotonic
  // `generation`. The initial snapshot has `initialized: false`; subscribe
  // with {::onDidChangeRefsSnapshot} or call {::ensureRefsSnapshot} to load
  // it.
  getRefsSnapshot() {
    return this.refsSnapshot;
  }

  // Public: Resolve with an initialized refs snapshot, loading it on first
  // call. Concurrent callers share one in-flight refresh.
  //
  // Returns a {Promise} that resolves to the snapshot.
  async ensureRefsSnapshot(options = {}) {
    if (this.refsSnapshot.initialized) return this.refsSnapshot;
    if (!this.pendingRefsSnapshotLoad) {
      this.pendingRefsSnapshotLoad = this.refreshRefsSnapshot(options).finally(() => {
        this.pendingRefsSnapshotLoad = null;
      });
    }
    return this.pendingRefsSnapshotLoad;
  }

  // Schedule a background refs refresh with the same coalescing rules as
  // {::scheduleStatusSnapshotRefresh}.
  scheduleRefsSnapshotRefresh() {
    if (this.isDestroyed() || this.refsSnapshotSubscriberCount === 0) return;
    if (this.refsSnapshotRefreshTimer != null) return;
    this.refsSnapshotRefreshTimer = setTimeout(() => {
      this.refsSnapshotRefreshTimer = null;
      if (this.isDestroyed()) return;
      this.refreshRefsSnapshot().catch(() => {});
    }, this.refsSnapshotDebounceMs);
  }

  // Public: Refresh the refs snapshot with Dugite. Reads branches, tags,
  // remotes, worktrees, and the exact HEAD state in one pass; stale
  // out-of-order responses are discarded and identical raw output does not
  // emit a change event.
  async refreshRefsSnapshot(options = {}) {
    const provider = this.refsSnapshotProvider;
    if (!provider || this.isDestroyed()) throw new Error("Repository has been destroyed");

    const refreshCount = ++this.refsSnapshotRefreshCount;
    const outputs = await provider.getRefs(this.getWorkingDirectory(), options);

    if (this.isDestroyed() || refreshCount !== this.refsSnapshotRefreshCount) {
      return this.refsSnapshot;
    }

    const cacheKey = [
      outputs.forEachRef,
      outputs.remotes,
      outputs.worktrees,
      outputs.symbolicHead,
      outputs.headOid,
    ].join("\0");
    if (cacheKey === this.refsSnapshotCacheKey) return this.refsSnapshot;

    const snapshot = parseRefsSnapshot(outputs, {
      generation: this.refsSnapshot.generation + 1,
    });
    this.refsSnapshot = snapshot;
    this.refsSnapshotCacheKey = cacheKey;
    this.emitter.emit("did-change-refs-snapshot", snapshot);
    return snapshot;
  }

  // Public: Compute a structured diff between two endpoints.
  //
  // * `options` An {Object} with the following keys:
  //   * `from` and `to`, endpoint objects — one of `{type: "commit", revision}`,
  //     `{type: "index"}`, `{type: "worktree"}`, `{type: "file", path}`, or
  //     `{type: "empty"}`. Supported pairs: index→worktree (default),
  //     commit→index, commit→worktree, commit→commit, file→file, empty↔file.
  //   * `paths` An {Array} of pathspecs limiting the diff.
  //   * `context` {Number} of context lines (default 3).
  //   * `ignoreWhitespace` {Boolean} to pass `--ignore-all-space`.
  //   * `maxBytes` {Number} output limit; exceeding it rejects with an error
  //     whose `code` is `ERR_GIT_DIFF_TOO_LARGE`.
  //   * `signal` An `AbortSignal` for cancellation.
  //
  // Returns a {Promise} resolving to a frozen
  // `{schemaVersion, files, rawPatch}` object; each file carries paths,
  // status, similarity, binary flag, modes, and hunks with classified lines.
  async getDiff({
    from = { type: "index" },
    to = { type: "worktree" },
    paths = [],
    context = 3,
    ignoreWhitespace = false,
    maxBytes = 10 * 1024 * 1024,
    signal,
  } = {}) {
    const provider = this.diffProvider;
    if (!provider || this.isDestroyed()) throw new Error("Repository has been destroyed");

    let rawPatch;
    try {
      rawPatch = await provider.getDiffPatch(
        this.getWorkingDirectory(),
        { from, to, paths, context, ignoreWhitespace },
        { maxBuffer: maxBytes, signal },
      );
    } catch (error) {
      if (error?.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
        const tooLarge = new Error(
          `Git diff output exceeded the ${maxBytes} byte limit; raise maxBytes or narrow paths`,
        );
        tooLarge.code = "ERR_GIT_DIFF_TOO_LARGE";
        tooLarge.cause = error;
        throw tooLarge;
      }
      throw error;
    }

    const { files } = parseDiffPatch(rawPatch);
    return Object.freeze({ schemaVersion: 1, files, rawPatch });
  }

  // Turn an absolute or repository-relative path into the forward-slash
  // relative form Git commands expect in pathspecs and `rev:path` arguments.
  posixRelativePath(filePath) {
    const relativePath = this.relativize(String(filePath));
    if (relativePath == null) return String(filePath).split(path.sep).join("/");
    return relativePath.split(path.sep).join("/");
  }

  requireHistoryProvider() {
    const provider = this.historyProvider;
    if (!provider || this.isDestroyed()) throw new Error("Repository has been destroyed");
    return provider;
  }

  // Public: Read paginated commit history.
  //
  // * `options` An {Object} with the following keys:
  //   * `revision` {String} starting revision (default `"HEAD"`).
  //   * `path` {String} to limit history to one path, following renames.
  //   * `limit` {Number} page size (default 50).
  //   * `cursor` the `nextCursor` value from a previous page.
  //   * `signal` An `AbortSignal` for cancellation.
  //
  // Returns a {Promise} resolving to a frozen `{commits, hasMore, nextCursor}`
  // object. Each commit has `sha`, `parents`, `author`, `committer`,
  // `subject`, and `body`. An unborn repository resolves to an empty page.
  async getCommits({
    revision = "HEAD",
    path: pathOption = null,
    limit = 50,
    cursor = null,
    signal,
  } = {}) {
    const provider = this.requireHistoryProvider();
    const effectiveRevision = cursor?.revision ?? revision;
    const skip = cursor?.skip ?? 0;

    const output = await provider.getLog(
      this.getWorkingDirectory(),
      {
        revision: effectiveRevision,
        path: pathOption ? this.posixRelativePath(pathOption) : null,
        limit: limit + 1,
        skip,
      },
      { signal },
    );

    const records = parseCommitRecords(output);
    const hasMore = records.length > limit;
    const commits = Object.freeze(records.slice(0, limit));
    return Object.freeze({
      commits,
      hasMore,
      nextCursor: hasMore
        ? Object.freeze({ revision: effectiveRevision, skip: skip + limit })
        : null,
    });
  }

  // Public: Read one commit with its changed-file summary.
  //
  // * `sha` The {String} commit id or any revision expression.
  //
  // Returns a {Promise} resolving to the commit object extended with
  // `changedFiles`: `[{path, originalPath, status, similarity}]`.
  async getCommit(sha, { signal } = {}) {
    const provider = this.requireHistoryProvider();
    const workingDirectory = this.getWorkingDirectory();
    const [logOutput, nameStatusOutput] = await Promise.all([
      provider.getLog(workingDirectory, { revision: sha, limit: 1 }, { signal }),
      provider.getNameStatus(workingDirectory, sha, { signal }),
    ]);

    const [commit] = parseCommitRecords(logOutput);
    if (!commit) return null;
    return Object.freeze({
      ...commit,
      changedFiles: Object.freeze(parseNameStatusTokens(nameStatusOutput)),
    });
  }

  // Public: Read a file's contents at a revision.
  //
  // * `filePath` A {String} path, absolute or repository-relative.
  // * `revision` A {String} revision expression.
  // * `options` An optional {Object}: `encoding` (default `"utf8"`, pass
  //   `"buffer"` for a {Buffer}) and `signal`.
  //
  // Returns a {Promise} resolving to the contents, or `null` when the path
  // does not exist at that revision.
  getFileAtRevision(filePath, revision, { encoding = "utf8", signal } = {}) {
    const provider = this.requireHistoryProvider();
    return provider.getFileAtRevision(
      this.getWorkingDirectory(),
      this.posixRelativePath(filePath),
      revision,
      { encoding: encoding === "buffer" ? "buffer" : encoding, signal },
    );
  }

  // Public: Read line-by-line blame for a file.
  //
  // * `filePath` A {String} path, absolute or repository-relative.
  // * `options` An optional {Object}: `revision` to blame at a specific
  //   revision, and `signal`.
  //
  // Returns a {Promise} resolving to a frozen `{revision, lines}` object
  // where each line has `line`, `originalLine`, `sha`, `author`, `summary`.
  async getBlame(filePath, { revision = null, signal } = {}) {
    const provider = this.requireHistoryProvider();
    const output = await provider.getBlame(
      this.getWorkingDirectory(),
      this.posixRelativePath(filePath),
      { revision },
      { signal },
    );
    return Object.freeze({ revision, lines: parseBlamePorcelain(output) });
  }

  // Internal git-utils status-bit classifiers behind the summary API.
  isStatusModified(status) {
    return this.getRepo().isStatusModified(status);
  }

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

  // Public: Like {::getLineDiffs}, but computed off the renderer thread by the
  // git-host worker (fetching and caching the HEAD blob, diffing in JS) instead
  // of synchronously via libgit2.
  //
  // * `filePath` The {String} path relative to the repository.
  // * `text` The {String} to compare against the `HEAD` contents.
  //
  // Returns a {Promise} resolving to the same hunk {Array} as {::getLineDiffs}.
  getLineDiffsAsync(filePath, text) {
    if (this.isDestroyed()) return Promise.resolve([]);
    const repo = this.getRepo(filePath);
    const relativePosixPath = repo.relativize(filePath).split(path.sep).join("/");
    // The status snapshot's head oid keys the worker's blob cache. It only
    // applies to the top-level repository; a file inside a submodule resolves
    // its own HEAD in the worker (headOid left null).
    const headOid = repo === this.repo ? (this.statusSnapshot?.head?.oid ?? null) : null;
    return this.diffProvider.getLineDiffs(repo.getWorkingDirectory(), {
      relativePosixPath,
      headOid,
      text,
      ignoreEolWhitespace: process.platform === "win32",
    });
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
    this.scheduleRefsSnapshotRefresh();
  }
};
