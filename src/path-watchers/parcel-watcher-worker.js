/* global emit */

// A worker script for `@parcel/watcher`. Runs as a `WatcherTask` (see
// src/worker-task.js).
//
// Manages any number of individual folder watchers in a single process,
// communicating over IPC.
//
// Requests to watch files (rather than directories) are handled via Node's
// builtin `fs.watch` API.

const watcher = require('@parcel/watcher');
const fs = require('fs');
const path = require('path');

// How long to collect events for a single-file watch before sending them as a
// batch. `@parcel/watcher` batches directory events natively and `nsfw`
// debounces at 200ms; `fs.watch` hands us raw events, so we do it ourselves.
const FILE_BATCH_INTERVAL_MS = 50;

// A shim over the real `console` methods so that they send log messages back
// to the renderer process instead of making us dig into their own console.
const console = {
  enabled: false,
  log(...args) {
    if (!this.enabled) return;
    emit('console:log', ['parcel-worker', ...args]);
  },
  warn(...args) {
    if (!this.enabled) return;
    emit('console:warn', ['parcel-worker', ...args]);
  },
  error(...args) {
    // Send errors whether logging is enabled or not.
    emit('console:error', ['parcel-worker', ...args]);
  }
};

const EVENT_MAP = {
  update: 'modified',
  delete: 'deleted',
  create: 'created'
};

// A class designed to imitate the object that is returned by `@parcel/watcher`
// when it watches directories; this one is for when we watch individual files.
class FileHandle {
  constructor(controller, onUnsubscribe) {
    this.controller = controller;
    this.onUnsubscribe = onUnsubscribe;
  }

  // Async to match `@parcel/watcher`’s API.
  async unsubscribe() {
    this.onUnsubscribe?.();
    return this.controller.abort();
  }
}

// `fs.watch` on a file follows the `inode` rather than the path (at least on
// some platforms), so an atomic save (as performed by many tools) leaves us
// watching a file that no longer has a name. Watching the containing directory
// instead survives the file being replaced, deleted, or recreated.
//
// Despite the fact that we're not watching the file directly, we still use
// `fs.watch` rather than `@parcel/watcher` because the latter has no
// non-recursive mode. We don't want to pay the cost of a recursive watcher
// only to discard any events that are reported for descendant paths we don't
// care about.
//
// Note: if an *ancestor* directory is moved or unmounted, this watch can go
// stale silently. On Linux the `inotify` watch follows the `inode`, so it
// stays alive while describing a path we no longer care about. Outright
// deletion is fine (`rm -rf` unlinks the file first, while this watch is still
// valid).
//
// Luckily (?), this is the same "watch root moved" limitation the recursive
// adapters have at their own roots, not something specific to watching a
// single file.
//
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
    // Deliberately not reset on each event: this is a collection window, not
    // a debounce, so a file being written continuously still reports on time.
    timer ??= setTimeout(flush, FILE_BATCH_INTERVAL_MS);
  };

  let fsWatcher = fs.watch(dir, { signal: controller.signal }, (eventType, filename) => {
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

  return new FileHandle(controller, () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = [];
  });
}

// Reacts to filesystem events and sends batches back to the renderer process.
function handler(instance, err, events) {
  if (err) {
    emit('watcher:error', { id: instance, error: err.message });
    return;
  }

  let normalizedEvents = events.map(event => {
    let action = EVENT_MAP[event.type] ?? `unexpected (${event.type})`;
    let payload = { action };
    if (event.path) {
      payload.path = event.path;
    }
    return payload;
  });

  console.log('Sending events:', events);

  emit('watcher:events', {
    id: instance,
    events: normalizedEvents
  });
}


// Organizes watchers by unique ID.
const WATCHERS_BY_PATH = new Map();

// Reacts to messages sent by the renderer.
async function handleMessage(message) {
  let { id, event = null, args } = JSON.parse(message);
  switch (event) {
    case 'watcher:watch': // fallthrough
    case 'watcher:update': {
      // `instance` is a unique ID for the watcher instance. We use it when we
      // push filesystem events so that they can be routed back to the correct
      // instance.
      let { normalizedPath, instance, ignored = [] } = args;
      // If this instance already exists, then the worker will call
      // `watcher:update` if it wants to change the exclusions. In this worker,
      // the two commands have the same effect. If there already was a watcher
      // for this instance, we hold onto the existing watcher until the new one
      // has started.
      let existing = WATCHERS_BY_PATH.get(instance);
      let wrappedHandler = (err, events) => handler(instance, err, events);
      try {
        let ignore = ignored.reduce((prev, ignoredName) => {
          prev.push(`${ignoredName}`, `**/${ignoredName}`);
          return prev;
        }, []);
        console.log('Generated ignore globs:', ignore);
        if (fs.lstatSync(normalizedPath).isDirectory()) {
          let handle = await watcher.subscribe(normalizedPath, wrappedHandler, {
            ignore
          });
          WATCHERS_BY_PATH.set(instance, handle);
        } else {
          console.log('Watching file path:', normalizedPath);
          let handler = watchSingleFile(instance, normalizedPath);
          WATCHERS_BY_PATH.set(instance, handler);
        }
        if (existing) {
          // If there was a pre-existing watcher at this instance, we wait
          // until the new one is up and running before stopping this one.
          await existing.unsubscribe();
        }
        emit('watcher:reply', { id, args: instance });
      } catch (err) {
        console.error('Error trying to watch path:', normalizedPath, err.message);
        emit('watcher:reply', { id, error: err.message });
      }
      break;
    }
    case 'watcher:unwatch': {
      let { instance } = args;
      let handle = WATCHERS_BY_PATH.get(instance);
      if (handle) {
        await handle.unsubscribe();
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
  console.log('@parcel/watcher worker starting');
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

process.title = `Pulsar file watcher worker (Parcel) [PID: ${process.pid}]`;

process.on('disconnect', () => process.exit(0));

module.exports = run;
