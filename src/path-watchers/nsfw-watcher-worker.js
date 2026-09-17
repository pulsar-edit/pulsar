/* global emit */

// A worker script for `nsfw`. Runs as a `WatcherTask` (see
// src/worker-task.js).
//
// Manages any number of individual folder watchers in a single process,
// communicating over IPC.
//
// Since `nsfw` doesn't accept glob exclusions (making you specify every single
// path you want to ignore), `fdir` and `minimatch` are used to turn a glob
// into a set of excluded paths.

const nsfw = require('nsfw');
const minimatch = require('minimatch');
const { fdir } = require('fdir');
const fs = require('fs');
const path = require('path');

// A shim over the real `console` methods so that they send log messages back
// to the renderer process instead of making us dig into their own console.
const console = {
  enabled: false,
  log(...args) {
    if (!this.enabled) return;
    emit('console:log', ['nsfw-worker', ...args]);
  },
  warn(...args) {
    if (!this.enabled) return;
    emit('console:warn', ['nsfw-worker', ...args]);
  },
  error(...args) {
    // Send errors whether logging is enabled or not.
    emit('console:error', ['nsfw-worker', ...args]);
  }
};

const ACTION_MAP = new Map([
  [nsfw.actions.MODIFIED, 'modified'],
  [nsfw.actions.CREATED, 'created'],
  [nsfw.actions.DELETED, 'deleted'],
  [nsfw.actions.RENAMED, 'renamed']
]);

// Organize watchers by unique ID.
const WATCHERS_BY_PATH = new Map();

// How long to collect events for a single-file watch before sending them as a
// batch. The directory watchers get batching for free — `nsfw` debounces at
// 200ms — but `fs.watch` hands us raw events, so we do it ourselves.
const FILE_BATCH_INTERVAL_MS = 50;

function onError(instance, err) {
  emit('watcher:error', { id: instance, error: err.message });
}

function handler(instance, events) {
  let normalizedEvents = events.map((event) => {
    const action =
      ACTION_MAP.get(event.action) || `unexpected (${event.action})`;
    const payload = { action };

    if (event.file) {
      payload.path = path.join(event.directory, event.file);
    } else {
      payload.oldPath = path.join(
        event.directory,
        typeof event.oldFile === 'undefined' ? '' : event.oldFile
      );
      payload.path = path.join(
        event.directory,
        typeof event.newFile === 'undefined' ? '' : event.newFile
      );
    }

    return payload;
  });

  console.log('File events:', normalizedEvents);

  emit('watcher:events', {
    id: instance,
    events: normalizedEvents
  });
}

// `nsfw` accepts a file path, and it works on macOS and Linux, but on Windows
// modification events for a directly-watched file routinely never arrive. So we
// watch the containing directory and filter, which is reliable everywhere.
//
// That also fixes a subtler bug on every platform: a watch on a file follows the
// inode rather than the path (at least on some platforms), so an atomic save (as
// performed by many tools) leaves us watching a file that no longer has a name.
// Watching the directory survives the file being replaced, deleted, or recreated.
//
// Note: if an *ancestor* directory is moved or unmounted, this watch can go
// stale silently. On Linux the `inotify` watch follows the inode, so it stays
// alive while describing a path we no longer care about. Outright deletion is
// fine (`rm -rf` unlinks the file first, while this watch is still valid). This
// is the same "watch root moved" limitation the recursive adapters have at their
// own roots, not something specific to watching a single file.
//
// NOTE: `parcel-watcher-worker.js` has its own copy of this. The two workers are
// self-contained scripts and don't share code; if you fix something here, look
// there too. `path-watcher-spec.js` runs the same single-file specs against both
// backends, so a divergence should surface as a failure rather than a mystery.
function watchSingleFile(instance, normalizedPath) {
  const dir = path.dirname(normalizedPath);
  const base = path.basename(normalizedPath).normalize('NFC');
  const controller = new AbortController();

  let pending = [];
  let timer = null;
  let exists = fs.existsSync(normalizedPath);

  const flush = () => {
    timer = null;
    const events = pending;
    pending = [];
    if (events.length > 0) {
      emit('watcher:events', { id: instance, events });
    }
  };

  const enqueue = (action) => {
    // Collapse runs of identical actions — one save can produce several
    // `change` events — but keep genuine transitions in order, so a consumer
    // never loses a creation or a deletion to coalescing.
    const last = pending[pending.length - 1];
    if (last?.action !== action) {
      pending.push({ action, path: normalizedPath });
    }
    // Deliberately not reset on each event: this is a collection window, not a
    // debounce, so a file being written continuously still reports on time.
    timer ??= setTimeout(flush, FILE_BATCH_INTERVAL_MS);
  };

  const fsWatcher = fs.watch(dir, { signal: controller.signal }, (eventType, filename) => {
    if (filename != null && filename.normalize('NFC') !== base) return;

    if (eventType === 'change') {
      enqueue('modified');
      return;
    }

    // A `rename` only tells us the directory entry appeared or disappeared;
    // `fs.watch` can never give us an origin path.
    const existsNow = fs.existsSync(normalizedPath);
    enqueue(existsNow ? (exists ? 'modified' : 'created') : 'deleted');
    exists = existsNow;
  });

  // Without this, an error on the watched directory (deleted, unmounted,
  // permissions changed) is thrown as an uncaught exception and takes down the
  // whole worker along with every unrelated watcher in it.
  fsWatcher.on('error', (error) => {
    emit('watcher:error', { id: instance, error: error.message });
  });

  // Shaped to match the `nsfw` watcher objects this worker stores alongside it,
  // so `watcher:unwatch` doesn't need to care which kind it got.
  return {
    async stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = [];
      return controller.abort();
    }
  };
}

// Given a root path and a list of globs, generates a list of excluded paths to
// pass to the `nsfw` watcher.
//
// This is _painful_! It drives us nuts because what we really want is to give
// these globs to `nsfw` and have it use them when adding a recursive watcher.
// (On Linux, `nsfw` watches recursively by spidering its way through the
// descendant folders and adding `inotify` watches on each, but it wastes time
// on some paths that ought to be ignored, like `node_modules`!)
//
// But `nsfw` doesn't take globs; it takes explicit absolute paths. So we have
// to do the filesystem crawling ourselves.
async function buildExcludedPaths(normalizedPath, ignoredNames = []) {
  let results = [];

  // Skip this altogether if the watcher didn't ask us to ignore anything.
  if (ignoredNames.length === 0) return results;

  // Skip this altogether if we're watching a file rather than a directory.
  let isDirectory = fs.lstatSync(normalizedPath)?.isDirectory();
  if (!isDirectory) return results;

  let _totalTimeSpentMinimatching = 0;
  let start = new Date().valueOf();
  console.log('Beginning generation of exclusions', normalizedPath, ignoredNames, performance.now());
  await new fdir()
    .withDirs()
    .onlyDirs()
    // Treat symlinks as though they're genuinely in the places they pretend to
    // be.
    .withSymlinks({ resolvePaths: false })
    .exclude((_, dirPath) => {
      // This is a trick. Returning `true` from this handler will prevent the
      // filesystem crawler from diving any deeper down this path. That's what
      // we want for each directory that matches any of our globs. So we
      // assemble the results at the same time that we prevent further crawling
      // for a certain path.
      let start = performance.now();
      let matches = ignoredNames.some(pattern => minimatch(dirPath, pattern, { matchBase: true }))
      let stop = performance.now();
      _totalTimeSpentMinimatching += (stop - start);
      if (matches) {
        results.push(dirPath);
        return true;
      }
    })
    // Don't actually return any results, since we compile our exclusions a
    // different way. This probably doesn't help much, but no sense in building
    // a big array full of paths when we're not going to use it.
    .filter(() => false)
    .crawl(normalizedPath)
    // We could go synchronous here because we're in a worker and it won't lock
    // up the renderer process. But some tests suggest that this actually
    // finishes faster if we let it go async.
    .withPromise();

  let end = new Date().valueOf();

  console.log('Generated exclusions in', end - start, 'ms', 'with time spent minimatching:', _totalTimeSpentMinimatching);
  let excludedPaths = results;
  return excludedPaths;
}

// Reacts to messages sent by the renderer.
async function handleMessage(message) {
  let { id, event = null, args } = JSON.parse(message);
  switch (event) {
    case 'watcher:watch': {
      // `instance` is a unique ID for the watcher instance. We use it when we
      // push filesystem events so that they can be routed back to the correct
      // instance.
      let { normalizedPath, instance, ignored } = args;
      let wrappedHandler = (events) => handler(instance, events);
      try {
        if (!fs.lstatSync(normalizedPath).isDirectory()) {
          WATCHERS_BY_PATH.set(instance, watchSingleFile(instance, normalizedPath));
          emit('watcher:reply', { id, args: instance });
          break;
        }

        let excludedPaths = await buildExcludedPaths(normalizedPath, ignored);
        let watcher = await nsfw(normalizedPath, wrappedHandler, {
          debounceMS: 200,
          errorCallback: (error) => onError(instance, error),
          excludedPaths
        });
        await watcher.start();
        WATCHERS_BY_PATH.set(instance, watcher);
        emit('watcher:reply', { id, args: instance });
      } catch (err) {
        console.error('Error trying to watch path:', normalizedPath, err.message);
        emit('watcher:reply', { id, error: err.message });
      }
      break;
    }
    case 'watcher:update': {
      let { normalizedPath, instance, ignored } = args;
      let watcher = WATCHERS_BY_PATH.get(instance);
      if (!watcher) {
        console.error('Error trying to update watcher for instance:', instance);
        emit('watcher:reply', { id, error: 'No such watcher' });
        break;
      }
      let excludedPaths = await buildExcludedPaths(normalizedPath, ignored);
      // Single-file watches have no exclusions to update — `buildExcludedPaths`
      // bails out for non-directories anyway.
      if (watcher.updateExcludedPaths) {
        await watcher.updateExcludedPaths(excludedPaths);
      }
      emit('watcher:reply', { id, args: instance });
      break;
    }
    case 'watcher:unwatch': {
      let { instance } = args;
      let watcher = WATCHERS_BY_PATH.get(instance);
      if (watcher) {
        await watcher.stop();
      }
      emit('watcher:reply', { id, args: instance });
      break;
    }
    default: {
      console.warn(`Unrecognized event:`, event);
    }
  }
}

function run() {
  // Run a no-op on an interval just to keep the task alive.
  setInterval(() => {}, 10000);
  process.on('message', handleMessage);
  emit('watcher:ready');
}

process.on('uncaughtException', (error) => {
  // Dilemma: most of the things that can cause exceptions in this worker are
  // things that prevent us from communicating the error to anything — e.g.,
  // ERR_IPC_CHANNEL_CLOSED.
  //
  // The goal here is to try to emit the exception and then fall back to
  // exiting the process no matter what. But `uncaughtException` is
  // unrecoverable and we shouldn't try to keep the worker going; we should
  // just try to gather forensic data while we have the chance.
  //
  // See also:
  // https://github.com/AtomLinter/linter-eslint-node/blob/main/lib/worker.js#L413-L429
  try {
    console.error(error?.message ?? error);
  } finally {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
});

process.title = `Pulsar file watcher worker (NSFW) [PID: ${process.pid}]`;

process.on('disconnect', () => process.exit(0));

module.exports = run;
