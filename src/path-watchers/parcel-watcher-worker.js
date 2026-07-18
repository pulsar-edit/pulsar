/* global emit */

// A worker script for `@parcel/watcher`. Runs as a `WatcherTask` (see
// src/watcher-task.js).
//
// Manages any number of individual folder watchers in a single process,
// communicating over IPC.
//
// Requests to watch files (rather than directories) are handled via Node's
// builtin `fs.watch` API.

const watcher = require("@parcel/watcher");
const fs = require("fs");
const nodejsWatcher = require("./nodejs-watcher");

// A shim over the real `console` methods so that they send log messages back
// to the renderer process instead of making us dig into their own console.
const console = {
  enabled: false,
  log(...args) {
    if (!this.enabled) return;
    emit("console:log", ["parcel-worker", ...args]);
  },
  warn(...args) {
    if (!this.enabled) return;
    emit("console:warn", ["parcel-worker", ...args]);
  },
  error(...args) {
    // Send errors whether logging is enabled or not.
    emit("console:error", ["parcel-worker", ...args]);
  },
};

const EVENT_MAP = {
  update: "updated",
  delete: "deleted",
  create: "created",
  rename: "renamed",
  change: "updated",
};

// The default backend probes for a Watchman server first; on Windows that
// probe runs `watchman get-sockname` through `_popen` (cmd.exe), which
// flashes an empty console window. Pin the backend there so the probe never
// runs; elsewhere the probe is windowless and the default order is fine.
const BACKEND = process.platform === "win32" ? "windows" : undefined;

// Maps the non-recursive watcher's low-level event types to the normalized
// action vocabulary the renderer expects.
const NODE_EVENT_MAP = {
  change: "updated",
  create: "created",
  delete: "deleted",
  rename: "renamed",
};

// Reacts to events from the non-recursive `nodejs-watcher` (single files and
// non-recursive directories) and sends batches back to the renderer process.
function nodejsHandler(instance, eventType, eventPath, oldPath) {
  let action = NODE_EVENT_MAP[eventType] ?? `unexpected (${eventType})`;
  let payload = { action, path: eventPath };
  if (oldPath) payload.oldPath = oldPath;

  if (/file\.markdown|file2\.md/.test(`${eventPath || ""}${oldPath || ""}`)) {
    console.error("NWDIAG worker emit", eventType, eventPath, oldPath);
  }

  console.log("Sending events:", [payload]);

  emit("watcher:events", {
    id: instance,
    events: [payload],
  });
}

// Reacts to filesystem events and sends batches back to the renderer process.
function handler(instance, err, events) {
  if (err) {
    emit("watcher:error", { id: instance, error: err.message });
    return;
  }

  let normalizedEvents = events.map((event) => {
    let action = EVENT_MAP[event.type] ?? `unexpected (${event.type})`;
    let payload = { action };
    if (event.path) {
      payload.path = event.path;
    }
    return payload;
  });

  console.log("Sending events:", events);

  emit("watcher:events", {
    id: instance,
    events: normalizedEvents,
  });
}

// Organizes watchers by unique ID.
const WATCHERS_BY_PATH = new Map();

// Reacts to messages sent by the renderer.
async function handleMessage(message) {
  let { id, event = null, args } = JSON.parse(message);
  switch (event) {
    case "watcher:watch": // fallthrough
    case "watcher:update": {
      // `instance` is a unique ID for the watcher instance. We use it when we
      // push filesystem events so that they can be routed back to the correct
      // instance.
      let { normalizedPath, instance, ignored = [], recursive = true } = args;
      // If this instance already exists, then the renderer will call
      // `watcher:update` if it wants to change the exclusions. In this worker,
      // the two commands have the same effect. If there already was a watcher
      // for this instance, we hold onto the existing watcher until the new one
      // has started.
      let existing = WATCHERS_BY_PATH.get(instance);
      let wrappedHandler = (err, events) => handler(instance, err, events);
      let wrappedNodejsHandler = (eventType, eventPath, oldPath) =>
        nodejsHandler(instance, eventType, eventPath, oldPath);
      try {
        let isDirectory = false;
        try {
          isDirectory = fs.statSync(normalizedPath).isDirectory();
        } catch {
          // The path may not exist yet (e.g. a config file); the non-recursive
          // watcher handles that by watching the parent directory.
        }
        let handle;
        if (isDirectory && recursive) {
          // Recursive tree watch → `@parcel/watcher`.
          let ignore = ignored.reduce((prev, ignoredName) => {
            prev.push(`${ignoredName}`, `**/${ignoredName}`);
            return prev;
          }, []);
          console.log("Generated ignore globs:", ignore);
          handle = await watcher.subscribe(normalizedPath, wrappedHandler, {
            ignore,
            backend: BACKEND,
          });
        } else {
          // Single file, or a non-recursive directory watch → reliable
          // parent-directory technique (see nodejs-watcher.js).
          console.log("Watching non-recursively:", normalizedPath);
          if (/file\.markdown|file2\.md/.test(normalizedPath)) {
            console.error("NWDIAG worker watch-nonrecursive", normalizedPath);
          }
          handle = nodejsWatcher.watch(normalizedPath, wrappedNodejsHandler);
        }
        WATCHERS_BY_PATH.set(instance, handle);
        if (existing) {
          // If there was a pre-existing watcher at this instance, we wait
          // until the new one is up and running before stopping this one.
          await existing.unsubscribe();
        }
        emit("watcher:reply", { id, args: instance });
      } catch (err) {
        console.error("Error trying to watch path:", normalizedPath, err.message);
        emit("watcher:reply", { id, error: err.message });
      }
      break;
    }
    case "watcher:unwatch": {
      let { instance } = args;
      let handle = WATCHERS_BY_PATH.get(instance);
      if (handle) {
        await handle.unsubscribe();
      }
      emit("watcher:reply", { id, args: instance });
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
  console.log("@parcel/watcher worker starting");
  process.on("message", handleMessage);
  emit("watcher:ready");
}

process.on("uncaughtException", (error) => {
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
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
});

process.title = `Lumine file watcher worker (Parcel) [PID: ${process.pid}]`;

// eslint-disable-next-line n/no-process-exit
process.on("disconnect", () => process.exit(0));

module.exports = run;
