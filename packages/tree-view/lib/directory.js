const path = require("path");

const { CompositeDisposable, Emitter } = require("atom");
const fs = require("./fs-compat");
const File = require("./file");
const { repoForPath } = require("./helpers");

module.exports = class Directory {
  constructor({ name, fullPath, symlink, expansionState, isRoot, ignoredNames, useSyncFS, stats }) {
    this.name = name;
    this.symlink = symlink;
    this.expansionState = expansionState;
    this.isRoot = isRoot;
    this.ignoredNames = ignoredNames;
    this.useSyncFS = useSyncFS;
    this.stats = stats;
    this.destroyed = false;
    this.emitter = new Emitter();
    this.subscriptions = new CompositeDisposable();

    if (atom.config.get("tree-view.squashDirectoryNames") && !this.isRoot) {
      fullPath = this.squashDirectoryNames(fullPath);
    }

    this.path = fullPath;
    this.realPath = this.path;
    if (fs.isCaseInsensitive()) {
      this.lowerCasePath = this.path.toLowerCase();
      this.lowerCaseRealPath = this.lowerCasePath;
    }

    if (this.isRoot == null) {
      this.isRoot = false;
    }

    if (this.expansionState == null) {
      this.expansionState = {};
    }

    if (this.expansionState.isExpanded == null) {
      this.expansionState.isExpanded = false;
    }

    if (!(this.expansionState.entries instanceof Map)) {
      this.expansionState.entries = new Map();
    }

    this.status = null;
    this.entries = new Map();

    const repo = repoForPath(this.path);
    this.submodule = repo && repo.isSubmodule(this.path);

    this.subscribeToRepo();
    this.updateStatus();
    this.loadRealPath();
  }

  destroy() {
    this.destroyed = true;
    this.unwatch();
    this.subscriptions.dispose();
    this.emitter.emit("did-destroy");
  }

  onDidDestroy(callback) {
    return this.emitter.on("did-destroy", callback);
  }

  onDidStatusChange(callback) {
    return this.emitter.on("did-status-change", callback);
  }

  onDidAddEntries(callback) {
    return this.emitter.on("did-add-entries", callback);
  }

  onDidRemoveEntries(callback) {
    return this.emitter.on("did-remove-entries", callback);
  }

  onDidCollapse(callback) {
    return this.emitter.on("did-collapse", callback);
  }

  onDidExpand(callback) {
    return this.emitter.on("did-expand", callback);
  }

  loadRealPathPromise() {
    return new Promise((resolve) => this.loadRealPath(resolve));
  }

  loadRealPath(callback = null) {
    if (this.useSyncFS) {
      this.realPath = fs.realpathSync(this.path);
      if (fs.isCaseInsensitive()) {
        this.lowerCaseRealPath = this.realPath.toLowerCase();
      }
      callback?.();
    } else {
      fs.realpath(this.path, (error, realPath) => {
        // FIXME: Add actual error handling
        if (error || this.destroyed) return;
        if (realPath && realPath !== this.path) {
          this.realPath = realPath;
          if (fs.isCaseInsensitive()) {
            this.lowerCaseRealPath = this.realPath.toLowerCase();
          }
          this.updateStatus();
        }
        callback?.();
      });
    }
  }

  // Subscribe to project's repo for changes to the Git status of this directory.
  subscribeToRepo() {
    const repo = repoForPath(this.path);
    if (repo == null) return;

    this.subscriptions.add(
      repo.onDidChangeStatus((event) => {
        if (this.contains(event.path)) {
          this.updateStatus(repo);
        }
      }),
    );
    this.subscriptions.add(
      repo.onDidChangeStatuses(() => {
        this.updateStatus(repo);
      }),
    );
  }

  // Update the status property of this directory using the repo.
  updateStatus() {
    const repo = repoForPath(this.path);
    if (repo == null) return;

    let newStatus = null;
    if (repo.isPathIgnored(this.path)) {
      newStatus = "ignored";
    } else if (this.ignoredNames.matches(this.path)) {
      newStatus = "ignored-name";
    } else {
      let status = 0;
      if (repo.relativize(this.path) === "") {
        // repo.getDirectoryStatus will always fail for the
        // repository root because the path is relativized + concatenated with '/'
        // making the matching string be '/'.  Then path.indexOf('/')
        // is run and will never match beginning of string with a leading '/'
        for (let statusPath in repo.statuses) {
          status |= parseInt(repo.statuses[statusPath], 10);
        }
      } else {
        status = repo.getDirectoryStatus(this.path);
      }

      if (repo.isStatusModified(status)) {
        newStatus = "modified";
      } else if (repo.isStatusNew(status)) {
        newStatus = "added";
      }
    }

    if (newStatus !== this.status) {
      this.status = newStatus;
      this.emitter.emit("did-status-change", newStatus);
    }
  }

  // Is the given path ignored?
  isPathIgnored(filePath) {
    if (atom.config.get("tree-view.hideVcsIgnoredFiles")) {
      const repo = repoForPath(this.path);
      if (repo && repo.isPathIgnored(filePath)) return true;
    }

    if (atom.config.get("tree-view.hideIgnoredNames")) {
      if (this.ignoredNames.matches(filePath)) return true;
    }

    return false;
  }

  // Does given full path start with the given prefix?
  isPathPrefixOf(prefix, fullPath) {
    return fullPath.indexOf(prefix) === 0 && fullPath[prefix.length] === path.sep;
  }

  isPathEqual(pathToCompare) {
    return this.path === pathToCompare || this.realPath === pathToCompare;
  }

  // Public: Does this directory contain the given path?
  //
  // See atom.Directory::contains for more details.
  contains(pathToCheck) {
    if (!pathToCheck) return false;

    // Normalize forward slashes to back slashes on Windows
    if (process.platform === "win32") {
      pathToCheck = pathToCheck.replace(/\//g, "\\");
    }

    let directoryPath;
    if (fs.isCaseInsensitive()) {
      directoryPath = this.lowerCasePath;
      pathToCheck = pathToCheck.toLowerCase();
    } else {
      directoryPath = this.path;
    }

    if (this.isPathPrefixOf(directoryPath, pathToCheck)) return true;

    // Check real path
    if (this.realPath !== this.path) {
      if (fs.isCaseInsensitive()) {
        directoryPath = this.lowerCaseRealPath;
      } else {
        directoryPath = this.realPath;
      }

      return this.isPathPrefixOf(directoryPath, pathToCheck);
    }

    return false;
  }

  // Public: Stop watching this directory for changes.
  unwatch() {
    this.watcherAbortController?.abort();
    this.watcherAbortController = null;
    this.watchSubscription = null;

    for (let [key, entry] of this.entries) {
      entry.destroy();
      this.entries.delete(key);
    }
  }

  // Public: Watch this directory for changes.
  async watch() {
    if (this.watchSubscription) {
      return;
    }
    try {
      await this.loadRealPathPromise();
      this.watcherAbortController = new AbortController();

      let reloadTimer = null;
      const debouncedReload = () => {
        if (reloadTimer) return;
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          if (!this.destroyed) this.reload();
        }, 100);
      };

      // We can get away with `fs.watch` here because we just care about when
      // to remove or reload this directory.
      this.watchSubscription = fs.watch(
        this.realPath,
        { signal: this.watcherAbortController.signal },
        (eventType, filename) => {
          // Modifying files does not require reloading the tree view.
          if (eventType === "change") {
            return;
          }
          // Deletions are represented as `rename` events, so if this
          // directory itself is "renamed," that means it's probably been
          // deleted.
          if ((filename === this.path || filename === this.realPath) && eventType === "rename") {
            if (!fs.existsSync(this.path)) {
              if (reloadTimer) {
                clearTimeout(reloadTimer);
                reloadTimer = null;
              }
              this.destroy();
              return;
            }
          }
          debouncedReload();
        },
      );
      // "On Windows, no events will be emitted if the watched directory is
      // moved or renamed. An EPERM error is reported when the watched
      // directory is deleted."
      this.watchSubscription.on("error", (error) => {
        if (error.code === "EPERM") this.destroy();
      });
    } catch (error) {
      console.error(error);
    }
  }

  getEntries() {
    let names;
    try {
      names = fs.readdirSync(this.path);
    } catch (error) {
      names = [];
    }
    names.sort(getSortComparator());

    const files = [];
    const directories = [];

    for (let name of names) {
      const fullPath = path.join(this.path, name);
      if (this.isPathIgnored(fullPath)) continue;

      let stat = fs.lstatSyncNoException(fullPath);
      const symlink = typeof stat.isSymbolicLink === "function" && stat.isSymbolicLink();
      if (symlink) {
        stat = fs.statSyncNoException(fullPath);
      }

      // Read the date getters from the original Stats object: as of Node 24
      // atime/mtime/ctime/birthtime are prototype getters, so Object.assign
      // (own enumerable only) no longer copies them onto statFlat.
      const statFlat = Object.assign({}, stat);
      for (let key of ["atime", "birthtime", "ctime", "mtime"]) {
        statFlat[key] = stat[key] && stat[key].getTime();
      }

      if (typeof stat.isDirectory === "function" && stat.isDirectory()) {
        if (this.entries.has(name)) {
          // push a placeholder since this entry already exists but this helps
          // track the insertion index for the created views
          directories.push(name);
        } else {
          const expansionState = this.expansionState.entries.get(name);
          directories.push(
            new Directory({
              name,
              fullPath,
              symlink,
              expansionState,
              ignoredNames: this.ignoredNames,
              useSyncFS: this.useSyncFS,
              stats: statFlat,
            }),
          );
        }
      } else if (typeof stat.isFile === "function" && stat.isFile()) {
        if (this.entries.has(name)) {
          // push a placeholder since this entry already exists but this helps
          // track the insertion index for the created views
          files.push(name);
        } else {
          files.push(
            new File({
              name,
              fullPath,
              symlink,
              ignoredNames: this.ignoredNames,
              useSyncFS: this.useSyncFS,
              stats: statFlat,
            }),
          );
        }
      }
    }

    return this.sortEntries(directories.concat(files));
  }

  compareEntries(firstName, secondName) {
    return getSortComparator()(firstName, secondName);
  }

  normalizeEntryName(value) {
    return value.name ? value.name : value;
  }

  sortEntries(combinedEntries) {
    if (atom.config.get("tree-view.sortFoldersBeforeFiles")) {
      return combinedEntries;
    } else {
      return combinedEntries.sort(getSortComparator());
    }
  }

  // Public: Perform a synchronous reload of the directory.
  reload() {
    const newEntries = [];
    const removedEntries = new Map(this.entries);

    let index = 0;
    for (let entry of this.getEntries()) {
      if (this.entries.has(entry)) {
        removedEntries.delete(entry);
        index++;
        continue;
      }

      entry.indexInParentDirectory = index;
      index++;
      newEntries.push(entry);
    }

    let entriesRemoved = false;
    for (let [name, entry] of removedEntries) {
      entriesRemoved = true;
      entry.destroy();

      if (this.entries.has(name)) {
        this.entries.delete(name);
      }

      if (this.expansionState.entries.has(name)) {
        this.expansionState.entries.delete(name);
      }
    }

    // Convert removedEntries to a Set containing only the entries for O(1) lookup
    if (entriesRemoved) {
      this.emitter.emit("did-remove-entries", new Set(removedEntries.values()));
    }

    if (newEntries.length > 0) {
      for (let entry of newEntries) {
        this.entries.set(entry.name, entry);
      }
      this.emitter.emit("did-add-entries", newEntries);
    }
  }

  // Public: Collapse this directory and stop watching it.
  collapse() {
    this.expansionState.isExpanded = false;
    this.expansionState = this.serializeExpansionState();
    this.unwatch();
    this.emitter.emit("did-collapse");
  }

  // Public: Expand this directory, load its children, and start watching it for
  // changes.
  async expand() {
    this.expansionState.isExpanded = true;
    this.reload();
    await this.watch();
    this.emitter.emit("did-expand");
  }

  serializeExpansionState() {
    const expansionState = {};
    expansionState.isExpanded = this.expansionState.isExpanded;
    expansionState.entries = new Map();
    for (let [name, entry] of this.entries) {
      if (entry.expansionState == null) continue;
      expansionState.entries.set(name, entry.serializeExpansionState());
    }
    return expansionState;
  }

  squashDirectoryNames(fullPath) {
    const squashedDirs = [this.name];
    let contents;
    while (true) {
      // eslint-disable-line no-constant-condition
      try {
        contents = fs.listSync(fullPath);
      } catch (error) {
        break;
      }

      if (contents.length !== 1) break;
      if (!fs.isDirectorySync(contents[0])) break;
      const relativeDir = path.relative(fullPath, contents[0]);
      squashedDirs.push(relativeDir);
      fullPath = path.join(fullPath, relativeDir);
    }

    if (squashedDirs.length > 1) {
      this.squashedNames = [
        squashedDirs.slice(0, squashedDirs.length - 1).join(path.sep) + path.sep,
        squashedDirs[squashedDirs.length - 1],
      ];
    }

    return fullPath;
  }

  filePathIsChildOfDirectory(filePath) {
    let dirname = path.dirname(filePath);
    return this.path === dirname || this.realPath === dirname;
  }
};

const naturalCompare = require("natural-compare-lite");
const collatorCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
  .compare;

function getCompareFn() {
  return atom.config.get("tree-view.sortMethod") === "natural" ? naturalCompare : collatorCompare;
}

function parseEntryName(value) {
  const name = typeof value === "string" ? value : value.name || "";
  const dot = name.lastIndexOf(".");
  if (dot > 0) {
    return { base: name.slice(0, dot).toLowerCase(), ext: name.slice(dot).toLowerCase() };
  }
  return { base: name.toLowerCase(), ext: "" };
}

function getSortComparator() {
  const cmp = getCompareFn();
  const byBase = atom.config.get("tree-view.sortByBase");
  if (byBase) {
    return (first, second) => {
      const a = parseEntryName(first);
      const b = parseEntryName(second);
      const result = cmp(a.base, b.base);
      return result !== 0 ? result : cmp(a.ext, b.ext);
    };
  }
  return (first, second) => {
    const a = typeof first === "string" ? first.toLowerCase() : (first.name || "").toLowerCase();
    const b = typeof second === "string" ? second.toLowerCase() : (second.name || "").toLowerCase();
    return cmp(a, b);
  };
}
