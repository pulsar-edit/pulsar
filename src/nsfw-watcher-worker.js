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
const path = require('path');

const ACTION_MAP = new Map([
  [nsfw.actions.MODIFIED, 'modified'],
  [nsfw.actions.CREATED, 'created'],
  [nsfw.actions.DELETED, 'deleted'],
  [nsfw.actions.RENAMED, 'renamed']
]);

// Organize watchers by unique ID.
const WATCHERS_BY_PATH = new Map();

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

  console.log('File events:', normalizedEvents)

  emit('watcher:events', {
    id: instance,
    events: normalizedEvents
  });
}

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

// Given a root path and a list of globs, generates a list of excluded paths to
// pass to the `nsfw` watcher.
//
// This is _painful_! It drives us nuts because what we really want is to give
// these globs to `nsfw` and have it use them when adding a recursive watcher.
// (On Linux, it does this by spidering its way through the descendant folders
// and adding `inotify` watches on each, but it should ignore some altogether!)
//
// But `nsfw` doesn't take globs; it takes explicit absolute paths. So we have
// to do the filesystem crawling ourselves.
async function buildExcludedPaths(normalizedPath, ignoredNames = []) {
  let results = [];
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
      let wrappedHandler = (err, events) => handler(instance, err, events);
      try {
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
      await watcher.updateExcludedPaths(excludedPaths);
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
