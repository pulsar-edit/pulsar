/* global emit */

// A worker script for `@parcel/watcher`. Runs as a `Task` (see src/task.js).
//
// Manages any number of individual folder watchers in a single process,
// communicating over IPC.
//
// Requests to watch files (rather than directories) are handled via Node's
// builtin `fs.watch` API.

const watcher = require("@parcel/watcher");
const fs = require('fs');

const EVENT_MAP = {
  update: 'updated',
  delete: 'deleted',
  create: 'created',
  rename: 'renamed',
  change: 'updated'
};

// A class designed to imitate the object that is returned by `@parcel/watcher`
// when it watches directories; this one is for when we watch individual files.
class FileHandle {
  constructor(controller) {
    this.controller = controller;
  }

  // Async to match `@parcel/watcher`’s API.
  async unsubscribe() {
    return this.controller.abort();
  }
}

// Reacts to events on individual files and sends batches back to the renderer
// process.
function fileHandler(instance, eventType, normalizedPath) {
  let action = EVENT_MAP[eventType] ?? `unexpected (${eventType})`;
  let payload = { action, path: normalizedPath };

  console.log('Sending events:', [payload]);

  emit('watcher:events', {
    id: instance,
    events: [payload]
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
      let wrappedFileHandler = (eventType, _) => fileHandler(instance, eventType, normalizedPath);
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
          let controller = new AbortController();
          fs.watch(normalizedPath, { signal: controller.signal }, wrappedFileHandler);
          WATCHERS_BY_PATH.set(instance, new FileHandle(controller));
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

module.exports = run;
