// Non-recursive filesystem watcher built on Node's `fs.watch`, used inside the
// watcher worker (see parcel-watcher-worker.js) for single files and for
// non-recursive directory watches. Recursive tree watching is handled
// separately by `@parcel/watcher`.
//
// The design follows VS Code's non-recursive watcher, and exists because
// `fs.watch` pointed *directly* at a file is unreliable: editors save
// atomically (write a temp file, then rename it over the original), which swaps
// the file's inode and orphans a file-level watch handle so every later edit is
// missed.
//
//   * A *file* is watched via its containing directory on every platform (the
//     directory's inode is stable across atomic saves, so no events are lost)
//     and filtered down to the target basename. When the platform withholds the
//     changed child's name (possible on macOS), the event is reported anyway so
//     the change is never missed — at worst a sibling change causes a redundant
//     re-read, which every consumer already tolerates.
//   * A *directory* is watched directly and reports events for its direct
//     children only (non-recursive). Used for the config directory.
//
// The callback is invoked with `(eventType, eventPath, oldPath)` where
// `eventType` is one of `'change'`, `'create'`, `'delete'`, or `'rename'`.

const fs = require("fs");
const path = require("path");

// Live watchers, for leak detection and global teardown.
const ACTIVE = new Set();

// Delay before deciding whether a vanished file was truly deleted or merely
// atomically replaced. VS Code uses ~100ms for the same purpose.
const RENAME_VERIFY_DELAY = 60;

function isCaseInsensitive() {
  return process.platform === "win32" || process.platform === "darwin";
}

function normalizeName(name) {
  if (name == null) return name;
  // macOS delivers decomposed (NFD) filenames; normalize to the composed (NFC)
  // form callers use so comparisons match.
  return process.platform === "darwin" ? name.normalize("NFC") : name;
}

function namesEqual(a, b) {
  if (a == null || b == null) return false;
  a = normalizeName(a);
  b = normalizeName(b);
  return isCaseInsensitive() ? a.toLowerCase() === b.toLowerCase() : a === b;
}

class NodejsWatcher {
  constructor(watchedPath) {
    this.path = path.resolve(watchedPath);

    // Resolve symlinks so we watch the real entry; fall back to the given path.
    // Prefer `realpathSync.native`: on Windows it expands 8.3 short names (e.g.
    // `ASILOI~1` in temp paths). `fs.watch` on a short-name path aborts the
    // process via a libuv assertion when the OS reports long-form event paths.
    try {
      this.realPath = fs.realpathSync.native(this.path);
    } catch {
      try {
        this.realPath = fs.realpathSync(this.path);
      } catch {
        this.realPath = this.path;
      }
    }

    let stat = null;
    try {
      stat = fs.statSync(this.realPath);
    } catch {
      // The target does not exist yet. Treat it as a file and watch its parent
      // so we can report its (re)creation.
    }

    this.isDirectory = stat ? stat.isDirectory() : false;
    this.exists = stat != null;
    // Remember the inode so a file that vanishes can be distinguished from one
    // that was moved (renamed) to a sibling path.
    this.ino = stat ? stat.ino : null;

    if (this.isDirectory) {
      // Non-recursive directory watch.
      this.mode = "dir";
      this.watchRoot = this.realPath;
      this.fileName = null;
      // macOS/Windows watch a file directly; watch the parent elsewhere.
      this.watchDirectly = true;
    } else {
      this.mode = "file";
      this.fileName = path.basename(this.realPath);
      // Always watch the (stable) parent directory and filter to our basename.
      // Watching a file directly is unreliable: atomic saves swap the file's
      // inode and orphan the handle, and macOS `fs.watch` pointed at a file
      // frequently drops in-place content events entirely. The directory's
      // inode is stable, so no events are lost. This matches VS Code's
      // non-recursive watcher, which also watches single files via their parent.
      this.watchDirectly = false;
      this.watchRoot = path.dirname(this.realPath);
    }

    this.callback = null;
    this.closed = false;
    this.handle = null;
    this.verifyTimer = null;

    ACTIVE.add(this);
  }

  onDidChange(callback) {
    this.callback = callback;
    this.startWatching();
    return this;
  }

  startWatching() {
    if (this.closed || this.handle) return;
    try {
      this.handle = fs.watch(this.watchRoot, { persistent: true }, (eventType, fileName) => {
        this.handleRawEvent(eventType, fileName);
      });
      this.handle.on("error", (err) => this.handleError(err));
    } catch (err) {
      this.handleError(err);
    }
  }

  handleRawEvent(eventType, rawName) {
    if (this.closed) return;

    if (this.mode === "dir") {
      this.handleDirEvent(eventType, rawName);
      return;
    }

    // File target watched via its parent dir: `fs.watch` reports the child
    // filename on Linux/Windows; ignore events for siblings. (When watching the
    // file directly, or when the platform omits the name, we can't filter.)
    if (!this.watchDirectly && rawName != null && !namesEqual(rawName, this.fileName)) {
      return;
    }

    if (eventType === "change") {
      // Content changed in place.
      if (!this.exists) {
        // The file appeared (created). Capture its identity and report it.
        this.captureIdentity();
        this.emit(this.exists ? "create" : "change", this.path);
      } else {
        this.emit("change", this.path);
      }
      return;
    }

    // A `rename` for our file means it was created, deleted, moved, or replaced.
    // macOS reports ordinary in-place writes as `rename` too. If the file is
    // still present, report it immediately (an in-place change or a completed
    // atomic save) rather than waiting out the rename-verify delay — the delay
    // is only needed to distinguish a delete from a move, i.e. when the file is
    // gone from its path.
    let existsNow = false;
    try {
      fs.statSync(this.realPath);
      existsNow = true;
    } catch {
      existsNow = false;
    }
    if (existsNow) {
      const wasAbsent = !this.exists;
      this.captureIdentity();
      this.emit(wasAbsent ? "create" : "change", this.path);
      return;
    }
    // Gone from its path — defer briefly to decide delete vs. move.
    this.scheduleVerify();
  }

  handleDirEvent(eventType, rawName) {
    // Report events for direct children only. `rename` fires on add/remove/move;
    // `change` fires on a child's content change (Linux/Windows). Consumers
    // filter by basename.
    // Report paths in the requested (`this.path`) form, but stat/access against
    // the real path so existence checks work.
    let childPath = rawName != null ? path.join(this.path, rawName) : this.path;
    let realChildPath = rawName != null ? path.join(this.realPath, rawName) : this.realPath;

    if (eventType === "change") {
      this.emit("change", childPath);
      return;
    }

    // `rename`: a child was added, removed, or moved. Decide by existence.
    if (rawName == null) {
      // Platform withheld the name (e.g. macOS). Report a generic change so the
      // consumer re-scans.
      this.emit("change", this.path);
      return;
    }
    fs.access(realChildPath, (err) => {
      if (this.closed) return;
      this.emit(err ? "delete" : "change", childPath);
    });
  }

  captureIdentity() {
    try {
      const stat = fs.statSync(this.realPath);
      this.ino = stat.ino;
      this.exists = true;
    } catch {
      this.exists = false;
      this.ino = null;
    }
  }

  scheduleVerify() {
    if (this.verifyTimer) clearTimeout(this.verifyTimer);
    this.verifyTimer = setTimeout(() => {
      this.verifyTimer = null;
      if (this.closed) return;
      fs.access(this.realPath, (err) => {
        if (this.closed) return;
        if (err) {
          // Gone from its path. It may have been moved rather than deleted —
          // look for a sibling with the same inode and report a rename.
          const renamedTo = this.findRenameTarget();
          if (renamedTo) {
            const oldPath = this.path;
            this.emit("rename", renamedTo, oldPath);
          } else {
            this.exists = false;
            this.emit("delete", this.path);
          }
        } else {
          // Present again. On a direct file watch (macOS) an atomic save
          // replaced the inode and left the handle on the old one; re-arm.
          const wasAbsent = !this.exists;
          this.captureIdentity();
          if (this.watchDirectly) {
            this.stopHandle();
            this.startWatching();
          }
          this.emit(wasAbsent ? "create" : "change", this.path);
        }
      });
    }, RENAME_VERIFY_DELAY);
  }

  // Find a sibling of the (now missing) watched file that has the same inode —
  // i.e. the file was moved there. Returns the new path, or null.
  findRenameTarget() {
    if (this.ino == null) return null;
    const realDir = path.dirname(this.realPath);
    const reportDir = path.dirname(this.path);
    let entries;
    try {
      entries = fs.readdirSync(realDir);
    } catch {
      return null;
    }
    for (const name of entries) {
      const candidate = path.join(realDir, name);
      if (candidate === this.realPath) continue;
      let st;
      try {
        st = fs.statSync(candidate);
      } catch {
        continue;
      }
      // Report the moved-to path in the requested (`this.path`) form.
      if (st.ino && st.ino === this.ino) return path.join(reportDir, name);
    }
    return null;
  }

  emit(eventType, eventPath, oldPath) {
    if (this.closed || !this.callback) return;
    this.callback(eventType, eventPath, oldPath);
  }

  handleError(err) {
    // ENOENT means the watched root vanished. For a file watcher, the
    // containing directory is gone, so the file is gone too.
    if (this.mode === "file" && err && err.code === "ENOENT") {
      this.exists = false;
      this.emit("delete", this.path);
    }
    this.stopHandle();
  }

  stopHandle() {
    if (this.handle) {
      this.handle.removeAllListeners();
      this.handle.close();
      this.handle = null;
    }
  }

  // Stop watching and release the underlying `fs.watch` handle.
  close() {
    if (this.closed) return;
    this.closed = true;
    if (this.verifyTimer) {
      clearTimeout(this.verifyTimer);
      this.verifyTimer = null;
    }
    this.stopHandle();
    this.callback = null;
    ACTIVE.delete(this);
  }

  // Async alias so the worker can treat file and directory (parcel) handles
  // uniformly — parcel's handle exposes `unsubscribe()`.
  async unsubscribe() {
    this.close();
  }
}

// Watch a single file or a directory (non-recursively). The `callback` receives
// `(eventType, eventPath, oldPath)`. Returns the watcher, which exposes
// `close()` and `unsubscribe()`.
function watch(pathToWatch, callback) {
  const watcher = new NodejsWatcher(pathToWatch);
  watcher.onDidChange(callback);
  return watcher;
}

// Return the distinct roots currently watched. Used for leak detection.
function getWatchedPaths() {
  const result = new Set();
  for (const w of ACTIVE) result.add(w.watchRoot);
  return Array.from(result);
}

// Close every live non-recursive watcher.
function closeAllNodejsWatchers() {
  for (const w of Array.from(ACTIVE)) w.close();
}

module.exports = { NodejsWatcher, watch, getWatchedPaths, closeAllNodejsWatchers };
