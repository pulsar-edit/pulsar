const path = require("path");
const fs = require("@lumine-code/fs-plus");
const { Emitter, Disposable, CompositeDisposable } = require("event-kit");
const { discoverRepositoryDescriptor } = require("./git-repository-descriptor");
const {
  GitHostStatusProvider,
  GitHostRefsProvider,
  GitHostConfigProvider,
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
    this.descriptor = discoverRepositoryDescriptor(path);
    if (this.descriptor == null) {
      throw new Error(`No Git repository found searching path: ${path}`);
    }

    // Cache the working directory and filesystem traits once so path routing
    // (getWorkingDirectory/relativize) needs no filesystem walk per query. These
    // are fixed for the repository's lifetime.
    this.workingDirectoryPath = this.descriptor.getWorkingDirectory();
    this.openedWorkingDirectoryPath = this.descriptor.openedWorkingDirectory || null;
    this.caseInsensitiveFs = this.descriptor.caseInsensitiveFs === true;

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
    this.configProvider = options.configProvider || new GitHostConfigProvider();
    this.upstream = { ahead: 0, behind: 0 };

    this.project = options.project;
    this.config = options.config;
    this.operations = null;

    if (options.refreshOnWindowFocus || options.refreshOnWindowFocus == null) {
      const onWindowFocus = () => {
        // Refresh the Git snapshots (subscriber-gated) rather than the
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
    this.descriptor = null;
    this.operations = null;
    this.statusSnapshotProvider = null;
    this.refsSnapshotProvider = null;
    this.diffProvider = null;
    this.historyProvider = null;
    this.configProvider = null;
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
    return this.descriptor == null;
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
  //     * `pathStatus` {Number} representing the status.
  //
  // Note: prefer {::onDidChangeStatusSnapshot}, which fires for every status
  // change; this legacy per-path event is retained for API compatibility.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeStatus(callback) {
    return this.emitter.on("did-change-status", callback);
  }

  // Public: Invoke the given callback when multiple files' statuses have
  // changed. Prefer {::onDidChangeStatusSnapshot}; this legacy event is retained
  // for API compatibility.
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
      if (this.isDestroyed()) throw new Error("Repository has been destroyed");
      this.path = fs.absolute(this.descriptor.getPath());
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
  getShortHead() {
    if (this.isDestroyed()) throw new Error("Repository has been destroyed");
    // Read the head from whichever snapshot has loaded. Both carry the branch
    // name (or a shortened oid for a detached HEAD); the status snapshot is the
    // one the file-tree/tab UI keeps warm, the refs snapshot backs the branch
    // switcher and window title.
    for (const snapshot of [this.statusSnapshot, this.refsSnapshot]) {
      if (snapshot.initialized && snapshot.head) {
        const head = snapshot.head;
        if (head.name) return head.name;
        if (head.detached && head.oid) return head.oid.slice(0, 7);
      }
    }
    return "";
  }

  // Public: Is the given path a submodule in the repository?
  //
  // * `filePath` The {String} path to check.
  //
  // Returns a {Boolean}.
  isSubmodule(filePath) {
    if (!filePath || this.isDestroyed()) return false;
    return this.descriptor.isSubmodule(this.relativize(filePath));
  }

  // Public: Returns the number of commits behind the current branch is from the
  // its upstream remote branch.
  //
  // * `reference` The {String} branch reference name.
  // * `path`      The {String} path in the repository to get this information for,
  //   only needed if the repository contains submodules.
  getAheadBehindCount(reference) {
    if (this.refsSnapshot.initialized) {
      const branch = this.refsSnapshotBranchForReference(reference);
      if (branch?.upstream) {
        return { ahead: branch.upstream.ahead, behind: branch.upstream.behind };
      }
    }
    return { ahead: 0, behind: 0 };
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
  getCachedUpstreamAheadBehindCount() {
    if (this.refsSnapshot.initialized) {
      const branch = this.refsSnapshot.branches.find((entry) => entry.isHead);
      if (branch?.upstream) {
        return { ahead: branch.upstream.ahead, behind: branch.upstream.behind };
      }
    }
    return this.upstream;
  }

  // Public: Returns the git configuration value specified by the key.
  //
  // * `key`  The {String} key for the configuration to lookup.
  // * `path` An optional {String} path in the repository to get this information
  //   for, only needed if the repository has submodules.
  // Public: Asynchronously read a git configuration value via the git-host
  // worker (`git config --get`), the off-thread replacement for the synchronous
  // libgit2 config lookup. Resolves to the value or `null` when unset.
  //
  // * `key` The {String} configuration key to look up.
  //
  // Returns a {Promise} resolving to a {String} or `null`.
  getConfigValueAsync(key) {
    if (!this.configProvider || this.isDestroyed()) return Promise.resolve(null);
    return this.configProvider.getConfigValue(this.getWorkingDirectory(), key);
  }

  // Public: Returns the origin url of the repository, read from the refs
  // snapshot's remotes. Returns `null` until the snapshot has loaded or when the
  // repository has no `origin` remote.
  getOriginURL() {
    if (this.refsSnapshot.initialized) {
      const origin = this.refsSnapshot.remotes.find((remote) => remote.name === "origin");
      if (origin) return origin.fetchUrl ?? null;
    }
    return null;
  }

  // Public: Returns the upstream branch for the current HEAD, or null if there
  // is no upstream branch for the current HEAD.
  //
  // * `path` An optional {String} path in the repo to get this information for,
  //   only needed if the repository contains submodules.
  //
  // Returns a {String} branch name such as `refs/remotes/origin/master`.
  getUpstreamBranch() {
    if (this.refsSnapshot.initialized) {
      const branch = this.refsSnapshot.branches.find((entry) => entry.isHead);
      return branch?.upstream?.ref ?? null;
    }
    return null;
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
  getReferences() {
    const snapshot = this.refsSnapshot;
    return {
      heads: snapshot.branches.map((branch) => branch.ref),
      remotes: snapshot.remoteBranches.map((branch) => branch.ref),
      tags: snapshot.tags.map((tag) => tag.ref),
    };
  }

  // Public: Returns the current {String} SHA for the given reference.
  //
  // * `reference` The {String} reference to get the target of.
  // * `path` An optional {String} path in the repo to get the reference target
  //   for. Only needed if the repository contains submodules.
  getReferenceTarget(reference) {
    if (this.refsSnapshot.initialized) {
      const target = this.refsSnapshotReferenceTarget(reference);
      if (target !== undefined) return target;
    }
    return null;
  }

  // Resolve the branch entry a ref/name refers to in the refs snapshot, or the
  // current HEAD branch when no reference is given.
  refsSnapshotBranchForReference(reference) {
    if (!reference) {
      return this.refsSnapshot.branches.find((branch) => branch.isHead) || null;
    }
    return (
      this.refsSnapshot.branches.find(
        (branch) => branch.ref === reference || branch.name === reference,
      ) || null
    );
  }

  // Resolve a fully-qualified ref (or `HEAD`) to its object id using the refs
  // snapshot. Returns `undefined` when the snapshot cannot resolve it, so the
  // caller can fall back to a live lookup.
  refsSnapshotReferenceTarget(reference) {
    if (!reference) return undefined;
    if (reference === "HEAD") return this.refsSnapshot.head?.oid ?? null;
    const snapshot = this.refsSnapshot;
    const branch = snapshot.branches.find((entry) => entry.ref === reference);
    if (branch) return branch.oid;
    const remoteBranch = snapshot.remoteBranches.find((entry) => entry.ref === reference);
    if (remoteBranch) return remoteBranch.oid;
    const tag = snapshot.tags.find((entry) => entry.ref === reference);
    if (tag) return tag.oid;
    return undefined;
  }

  /*
  Section: Reading Status
  */

  // Public: Returns true if the given path is modified, read from the detailed
  // status snapshot. Returns false until the snapshot has loaded.
  //
  // * `path` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `path` is modified.
  isPathModified(path) {
    const summary = this.getPathStatusSummary(path);
    return Boolean(summary && summary.modified);
  }

  // Public: Returns true if the given path is new, read from the detailed status
  // snapshot. Returns false until the snapshot has loaded.
  //
  // * `path` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `path` is new.
  isPathNew(path) {
    const summary = this.getPathStatusSummary(path);
    return Boolean(summary && summary.added);
  }

  // Public: Is the given path ignored? Resolved from the detailed status
  // snapshot's ignored entries; returns false until the snapshot has loaded.
  //
  // * `path` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `path` is ignored.
  isPathIgnored(path) {
    return this.isPathIgnoredCached(path);
  }

  // Public: Whether the given path is ignored, resolved synchronously from the
  // Git status snapshot's ignored entries. Returns false until the first
  // snapshot loads.
  //
  // * `filePath` The {String} path to check.
  //
  // Returns a {Boolean} that's true if the `filePath` is ignored.
  isPathIgnoredCached(filePath) {
    if (this.isDestroyed() || !this.statusSnapshot.initialized) return false;

    const relativePath = this.relativize(String(filePath));
    if (relativePath == null || relativePath === "") return false;
    const key = statusPathKey(relativePath);
    if (this.ignoredFileKeys.has(key)) return true;
    return this.ignoredDirKeys.some((dir) => key === dir || key.startsWith(`${dir}/`));
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

  // Public: Refresh the detailed branch and file status snapshot with Git.
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

  // Public: Classified status for one path, read from the detailed status
  // snapshot.
  //
  // * `filePath` A {String} path, absolute or repository-relative.
  //
  // Returns a frozen `{source, conflicted, modified, added, renamed}` object
  // (`source` is always `"snapshot"`), or `null` for clean, ignored, unknown,
  // and pre-snapshot paths.
  getPathStatusSummary(filePath) {
    if (filePath == null || this.isDestroyed() || !this.statusSnapshot.initialized) return null;

    const entry = this.getStatusEntry(filePath);
    if (!entry || entry.ignored) return null;
    return summaryFromStatusEntry(entry);
  }

  // Public: Aggregate classified status for a directory, including the
  // repository root. Same sourcing and shape as {::getPathStatusSummary}
  // (without `renamed`); returns `null` when nothing below the directory has
  // a reportable status.
  getDirectoryStatusSummary(directoryPath) {
    if (directoryPath == null || this.isDestroyed() || !this.statusSnapshot.initialized) {
      return null;
    }
    const relativePath = this.relativize(String(directoryPath));
    if (relativePath == null) return null;

    const aggregate = this.directoryStatusAggregates.get(statusPathKey(relativePath));
    if (!aggregate) return null;
    return Object.freeze({
      source: "snapshot",
      conflicted: aggregate.conflicted,
      modified: aggregate.modified,
      added: aggregate.added,
    });
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

  // Public: Refresh the refs snapshot with Git. Reads branches, tags,
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
    detectRenames = true,
    diffFilter = null,
    maxBytes = 10 * 1024 * 1024,
    signal,
  } = {}) {
    const provider = this.diffProvider;
    if (!provider || this.isDestroyed()) throw new Error("Repository has been destroyed");

    let rawPatch;
    try {
      rawPatch = await provider.getDiffPatch(
        this.getWorkingDirectory(),
        { from, to, paths, context, ignoreWhitespace, detectRenames, diffFilter },
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

  // Public: Read a blob's contents by object id (`git cat-file -p <oid>`).
  //
  // * `oid` A {String} blob object id.
  // * `options` An optional {Object}: `encoding` (default `"utf8"`, pass
  //   `"buffer"` for a {Buffer}) and `signal`.
  //
  // Returns a {Promise} resolving to the contents, or `null` when the oid does
  // not name an object.
  getBlob(oid, { encoding = "utf8", signal } = {}) {
    const provider = this.requireHistoryProvider();
    return provider.getBlob(this.getWorkingDirectory(), oid, {
      encoding: encoding === "buffer" ? "buffer" : encoding,
      signal,
    });
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

  /*
  Section: Retrieving Diffs
  */

  // Public: Computes gutter line diffs off the renderer thread via the
  // git-host worker (fetching and caching the HEAD blob, diffing in JS) instead
  // of synchronously via libgit2.
  //
  // * `filePath` The {String} path relative to the repository.
  // * `text` The {String} to compare against the `HEAD` contents.
  //
  // Returns a {Promise} resolving to an {Array} of hunk {Object}s, each with
  // `oldStart`, `newStart`, `oldLines`, and `newLines`.
  getLineDiffsAsync(filePath, text) {
    if (this.isDestroyed()) return Promise.resolve([]);
    const relativePosixPath = this.relativize(filePath).split(path.sep).join("/");
    // The status snapshot's head oid keys the worker's blob cache; a HEAD move
    // produces a fresh key. Files inside submodules are owned by their own
    // repository, so this repository always keys against its own HEAD.
    const headOid = this.statusSnapshot?.head?.oid ?? null;
    return this.diffProvider.getLineDiffs(this.getWorkingDirectory(), {
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
  // to the version at `HEAD`, via the repository operation provider
  // (`git checkout HEAD -- <path>`).
  //
  // * `filePath` The {String} path to checkout.
  //
  // Returns a {Promise} resolving to a {Boolean} that's true on success.
  async checkoutHead(filePath) {
    if (this.isDestroyed()) return false;
    const operations = this.getOperations();
    if (!operations) return false;

    await operations.checkoutFiles([this.posixRelativePath(filePath)], "HEAD");
    this.scheduleStatusSnapshotRefresh();
    return true;
  }

  // Public: Checks out a branch in your repository via the repository operation
  // provider.
  //
  // * `reference` The {String} reference to checkout.
  // * `create`    A {Boolean} value which, if true creates the new reference if
  //   it doesn't exist.
  //
  // Returns a {Promise} resolving to a {Boolean} that's true on success.
  async checkoutReference(reference, create) {
    if (this.isDestroyed()) return false;
    const operations = this.getOperations();
    if (!operations) return false;

    await operations.checkout(reference, { createNew: create });
    this.scheduleStatusSnapshotRefresh();
    this.scheduleRefsSnapshotRefresh();
    return true;
  }

  /*
  Section: Private
  */

  // Subscribes to buffer events.
  subscribeToBuffer(buffer) {
    const refreshStatusForBuffer = () => {
      const bufferPath = buffer.getPath();
      if (bufferPath && !this.isDestroyed()) this.scheduleStatusSnapshotRefresh();
    };

    const bufferSubscriptions = new CompositeDisposable();
    bufferSubscriptions.add(buffer.onDidSave(refreshStatusForBuffer));
    bufferSubscriptions.add(buffer.onDidReload(refreshStatusForBuffer));
    bufferSubscriptions.add(buffer.onDidChangePath(refreshStatusForBuffer));
    bufferSubscriptions.add(
      buffer.onDidDestroy(() => {
        bufferSubscriptions.dispose();
        return this.subscriptions.remove(bufferSubscriptions);
      }),
    );
    this.subscriptions.add(bufferSubscriptions);
  }

  // Subscribes to editor view event.
  async checkoutHeadForEditor(editor) {
    const buffer = editor.getBuffer();
    const bufferPath = buffer.getPath();
    if (!bufferPath) return;

    // Reload the buffer from disk even if the checkout could not run (no
    // operation provider, or a Git failure), matching the previous behavior
    // where the reload always followed the checkout attempt.
    try {
      await this.checkoutHead(bufferPath);
    } catch {
      // Swallowed: the reload below still discards the in-memory edits.
    }
    return buffer.reload();
  }
};
