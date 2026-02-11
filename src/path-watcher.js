const fs = require('fs');
const path = require('path');

// Lazy-loaded: electron is not available when this module is loaded in a Task
// child process (plain Node.js with ELECTRON_RUN_AS_NODE=1).
let ipcRenderer = null;
function getIpcRenderer() {
  if (!ipcRenderer) {
    ipcRenderer = require('electron').ipcRenderer;
  }
  return ipcRenderer;
}

const { Emitter, Disposable, CompositeDisposable } = require('event-kit');
const { NativeWatcherRegistry } = require('./native-watcher-registry');

// Private: Possible states of a {NativeWatcher}.
const WATCHER_STATE = {
  STOPPED:  Symbol('stopped'),
  STARTING: Symbol('starting'),
  RUNNING:  Symbol('running'),
  STOPPING: Symbol('stopping')
};

// Private: Interface with and normalize events from a filesystem watcher
// implementation.
class NativeWatcher {

  // Private: Initialize a native watcher on a path.
  //
  // Events will not be produced until {start()} is called.
  constructor(normalizedPath) {
    this.normalizedPath = normalizedPath;
    this.emitter = new Emitter();
    this.subs = new CompositeDisposable();

    this.state = WATCHER_STATE.STOPPED;

    this.onEvents = this.onEvents.bind(this);
    this.onError = this.onError.bind(this);
  }

  // Private: Begin watching for filesystem events.
  //
  // Has no effect if the watcher has already been started.
  async start() {
    if (this.state !== WATCHER_STATE.STOPPED) {
      return;
    }
    this.state = WATCHER_STATE.STARTING;

    await this.doStart();

    this.state = WATCHER_STATE.RUNNING;
    this.emitter.emit('did-start');
  }

  doStart() {
    return Promise.reject(new Error('doStart() not overridden'));
  }

  // Private: Return true if the underlying watcher is actively listening for filesystem events.
  isRunning() {
    return this.state === WATCHER_STATE.RUNNING;
  }

  // Private: Register a callback to be invoked when the filesystem watcher has been initialized.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onDidStart(callback) {
    return this.emitter.on('did-start', callback);
  }

  // Private: Register a callback to be invoked with normalized filesystem events as they arrive. Starts the watcher
  // automatically if it is not already running. The watcher will be stopped automatically when all subscribers
  // dispose their subscriptions.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onDidChange(callback) {
    this.start();

    const sub = this.emitter.on('did-change', callback);
    return new Disposable(() => {
      sub.dispose();
      if (this.emitter.listenerCountForEventName('did-change') === 0) {
        this.stop();
      }
    });
  }

  // Private: Register a callback to be invoked when a {Watcher} should attach to a different {NativeWatcher}.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onShouldDetach(callback) {
    return this.emitter.on('should-detach', callback);
  }

  // Private: Register a callback to be invoked when a {NativeWatcher} is about to be stopped.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onWillStop(callback) {
    return this.emitter.on('will-stop', callback);
  }

  // Private: Register a callback to be invoked when the filesystem watcher has been stopped.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onDidStop(callback) {
    return this.emitter.on('did-stop', callback);
  }

  // Private: Register a callback to be invoked with any errors reported from the watcher.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onDidError(callback) {
    return this.emitter.on('did-error', callback);
  }

  // Private: Broadcast an `onShouldDetach` event to prompt any {Watcher} instances bound here to attach to a new
  // {NativeWatcher} instead.
  //
  // * `replacement` the new {NativeWatcher} instance that a live {Watcher} instance should reattach to instead.
  // * `watchedPath` absolute path watched by the new {NativeWatcher}.
  reattachTo(replacement, watchedPath, options) {
    this.emitter.emit('should-detach', { replacement, watchedPath, options });
  }

  // Private: Stop the native watcher and release any operating system resources associated with it.
  //
  // Has no effect if the watcher is not running.
  async stop() {
    if (this.state !== WATCHER_STATE.RUNNING) {
      return;
    }
    this.state = WATCHER_STATE.STOPPING;
    this.emitter.emit('will-stop');

    await this.doStop();

    this.state = WATCHER_STATE.STOPPED;
    this.emitter.emit('did-stop');
  }

  doStop() {
    return Promise.resolve();
  }

  // Private: Detach any event subscribers.
  dispose() {
    this.emitter.dispose();
  }

  // Private: Callback function invoked by the native watcher when a debounced
  // group of filesystem events arrive. Normalize and re-broadcast them to any
  // subscribers.
  //
  // * `events` An Array of filesystem events.
  onEvents(events) {
    this.emitter.emit('did-change', events);
  }

  // Private: Callback function invoked by the native watcher when an error
  // occurs.
  //
  // * `err` The native filesystem error.
  onError(err) {
    this.emitter.emit('did-error', err);
  }
}

// Build ignore globs from the `core.ignoredNames` setting.
function buildIgnoreGlobs(ignoredNames) {
  if (!ignoredNames || !ignoredNames.length) return [];
  let globs = [];
  for (let name of ignoredNames) {
    globs.push(name, `**/${name}`);
  }
  return globs;
}

let nextWatcherId = 0;

// Private: Implement a native watcher that delegates to @parcel/watcher running
// in the main process. Communication happens via Electron IPC, which provides
// crash isolation and avoids macOS kqueue issues entirely (the main process
// watches directories via @parcel/watcher which uses FSEvents on macOS).
class ParcelNativeWatcher extends NativeWatcher {
  constructor(...args) {
    super(...args);
    this.watcherId = `w-${process.pid}-${Date.now()}-${nextWatcherId++}`;
    this._ipcHandler = null;
    this._ipcErrorHandler = null;

    this.subs.add(
      atom.config.observe('core.ignoredNames', (newValue) => {
        this.setIgnoredNames(newValue);
      })
    );
  }

  dispose() {
    this._removeIpcListeners();
    super.dispose();
    this.subs.dispose();
  }

  setIgnoredNames(ignoredNames) {
    this.ignoredNames = ignoredNames;
    if (this.state === WATCHER_STATE.RUNNING) {
      this.resubscribe();
    }
  }

  // Re-subscribe with updated ignore patterns via IPC.
  async resubscribe() {
    const ignore = buildIgnoreGlobs(this.ignoredNames);
    await getIpcRenderer().invoke('watcher:update', {
      id: this.watcherId,
      options: { ignore }
    });
  }

  _setupIpcListeners() {
    this._ipcHandler = (_event, { id, events }) => {
      if (id === this.watcherId) {
        this.onEvents(events);
      }
    };
    this._ipcErrorHandler = (_event, { id, error }) => {
      if (id === this.watcherId) {
        this.onError(new Error(error));
      }
    };
    getIpcRenderer().on('watcher:events', this._ipcHandler);
    getIpcRenderer().on('watcher:error', this._ipcErrorHandler);
  }

  _removeIpcListeners() {
    if (this._ipcHandler) {
      getIpcRenderer().removeListener('watcher:events', this._ipcHandler);
      this._ipcHandler = null;
    }
    if (this._ipcErrorHandler) {
      getIpcRenderer().removeListener('watcher:error', this._ipcErrorHandler);
      this._ipcErrorHandler = null;
    }
  }

  async doStart() {
    const ignore = buildIgnoreGlobs(this.ignoredNames);
    this._setupIpcListeners();
    try {
      await getIpcRenderer().invoke('watcher:subscribe', {
        id: this.watcherId,
        path: this.normalizedPath,
        options: { ignore }
      });
    } catch (err) {
      this._removeIpcListeners();
      throw err;
    }
  }

  async doStop() {
    this._removeIpcListeners();
    try {
      await getIpcRenderer().invoke('watcher:unsubscribe', {
        id: this.watcherId
      });
    } catch (err) {
      // Best effort — main process may have already cleaned up.
    }
  }
}

// Extended: Manage a subscription to filesystem events that occur beneath a
// root directory. Construct these by calling `watchPath`. To watch for events
// within active project directories, use {Project::onDidChangeFiles} instead.
//
// Multiple PathWatchers may be backed by a single native watcher to conserve
// operation system resources.
//
// Call {::dispose} to stop receiving events and, if possible, release
// underlying resources. A PathWatcher may be added to a {CompositeDisposable}
// to manage its lifetime along with other {Disposable} resources like event
// subscriptions.
//
// ```js
// const {watchPath} = require('atom')
//
// const disposable = await watchPath('/var/log', {}, events => {
//   console.log(`Received batch of ${events.length} events.`)
//   for (const event of events) {
//     // "created", "modified", "deleted", "renamed"
//     console.log(`Event action: ${event.action}`)
//
//     // absolute path to the filesystem entry that was touched
//     console.log(`Event path: ${event.path}`)
//
//     if (event.action === 'renamed') {
//       console.log(`.. renamed from: ${event.oldPath}`)
//     }
//   }
// })
//
//  // Immediately stop receiving filesystem events. If this is the last
//  // watcher, asynchronously release any OS resources required to
//  // subscribe to these events.
//  disposable.dispose()
// ```
//
// `watchPath` accepts the following arguments:
//
// * `rootPath` {String} specifies the absolute path to the root of the
//   filesystem content to watch.
// * `options` Control the watcher's behavior. Currently a placeholder.
// * `eventCallback` {Function} to be called each time a batch of filesystem
//   events is observed. Each event object has the keys:
//   * `action`, a {String} describing the filesystem action that occurred, one
//     of `"created"`, `"modified"`, `"deleted"`, or `"renamed"`;
//   * `path`, a {String} containing the absolute path to the filesystem entry
//     that was acted upon;
//   * `oldPath` (for `renamed` events only), a {String} containing the
//     filesystem entry's former absolute path.
class PathWatcher {
  // Private: Instantiate a new PathWatcher. Call {watchPath} instead.
  //
  // * `nativeWatcherRegistry` {NativeWatcherRegistry} used to find and
  //   consolidate redundant watchers.
  // * `watchedPath` {String} containing the absolute path to the root of the
  //   watched filesystem tree.
  // * `options` See {watchPath} for options.
  //
  constructor(nativeWatcherRegistry, watchedPath, options) {
    this.watchedPath = watchedPath;
    this.nativeWatcherRegistry = nativeWatcherRegistry;
    this.options = { realPaths: true, ...options };

    this.normalizedPath = null;
    this.native = null;
    this.changeCallbacks = new Map();

    this.attachedPromise = new Promise(resolve => {
      this.resolveAttachedPromise = resolve;
    });

    this.startPromise = new Promise((resolve, reject) => {
      this.resolveStartPromise = resolve;
      this.rejectStartPromise = reject;
    });

    this.normalizedPathPromise = new Promise((resolve, reject) => {
      fs.realpath(watchedPath, (err, real) => {
        if (err) {
          reject(err);
          return;
        }

        this.normalizedPath = real;
        resolve(real);
      });
    });
    this.normalizedPathPromise.catch(err => this.rejectStartPromise(err));

    this.emitter = new Emitter();
    this.subs = new CompositeDisposable();
  }

  // Private: Return a {Promise} that will resolve with the normalized root
  // path.
  getNormalizedPathPromise() {
    return this.normalizedPathPromise;
  }

  // Private: Return a {Promise} that will resolve the first time that this
  // watcher is attached to a native watcher.
  getAttachedPromise() {
    return this.attachedPromise;
  }

  // Extended: Return a {Promise} that will resolve when the underlying native
  // watcher is ready to begin sending events. When testing filesystem
  // watchers, it's important to await this promise before making filesystem
  // changes that you intend to assert about because there will be a delay
  // between the instantiation of the watcher and the activation of the
  // underlying OS resources that feed its events.
  //
  // PathWatchers acquired through `watchPath` are already started.
  //
  // ```js
  // const {watchPath} = require('atom')
  // const ROOT = path.join(__dirname, 'fixtures')
  // const FILE = path.join(ROOT, 'filename.txt')
  //
  // describe('something', function () {
  //   it("doesn't miss events", async function () {
  //     const watcher = watchPath(ROOT, {}, events => {})
  //     await watcher.getStartPromise()
  //     fs.writeFile(FILE, 'contents\n', err => {
  //       // The watcher is listening and the event should be
  //       // received asynchronously
  //     }
  //   })
  // })
  // ```
  getStartPromise() {
    return this.startPromise;
  }

  // Private: Attach another {Function} to be called with each batch of
  // filesystem events. See {watchPath} for the spec of the callback's
  // argument.
  //
  // * `callback` {Function} to be called with each batch of filesystem events.
  //
  // Returns a {Disposable} that will stop the underlying watcher when all
  // callbacks mapped to it have been disposed.
  onDidChange(callback) {
    if (this.native) {
      const sub = this.native.onDidChange(events =>
        this.onNativeEvents(events, callback)
      );
      this.changeCallbacks.set(callback, sub);

      this.native.start();
    } else {
      // Attach to a new native listener and retry
      this.nativeWatcherRegistry.attach(this).then(() => {
        this.onDidChange(callback);
      });
    }

    return new Disposable(() => {
      const sub = this.changeCallbacks.get(callback);
      this.changeCallbacks.delete(callback);
      sub.dispose();
    });
  }

  // Extended: Invoke a {Function} when any errors related to this watcher are
  // reported.
  //
  // * `callback` {Function} to be called when an error occurs.
  //   * `err` An {Error} describing the failure condition.
  //
  // Returns a {Disposable}.
  onDidError(callback) {
    return this.emitter.on('did-error', callback);
  }

  // Private: Wire this watcher to an operating system-level native watcher
  // implementation.
  attachToNative(native) {
    this.subs.dispose();
    this.native = native;

    if (native.isRunning()) {
      this.resolveStartPromise();
    } else {
      this.subs.add(
        native.onDidStart(() => {
          this.resolveStartPromise();
        })
      );
    }

    // Transfer any native event subscriptions to the new NativeWatcher.
    for (const [callback, formerSub] of this.changeCallbacks) {
      const newSub = native.onDidChange(events =>
        this.onNativeEvents(events, callback)
      );
      this.changeCallbacks.set(callback, newSub);
      formerSub.dispose();
    }

    this.subs.add(
      native.onDidError(err => {
        this.emitter.emit('did-error', err);
      })
    );

    this.subs.add(
      native.onShouldDetach(({ replacement, watchedPath }) => {
        // Don't re-attach if the entire environment is disposing.
        if (atom.isDestroying) return;
        if (
          this.native === native &&
          replacement !== native &&
          this.normalizedPath.startsWith(watchedPath)
        ) {
          this.attachToNative(replacement);
        }
      })
    );

    this.subs.add(
      native.onWillStop(() => {
        if (this.native === native) {
          this.subs.dispose();
          this.native = null;
        }
      })
    );

    this.resolveAttachedPromise();
  }

  // Private: Given a "real" filesystem path, adjusts it (if necesssary) to
  // match the path that the user subscribed to.
  //
  // This saves the user from having to make their own calls to `fs.realpath`
  // on their end just to do path equality checks.
  denormalizePath(filePath) {
    if (this.options.realPaths) return filePath;
    if (this.watchedPath === this.normalizedPath) return filePath;
    if (!filePath.startsWith(this.normalizedPath)) return filePath;
    let rest = filePath.substring(this.normalizedPath.length);
    return path.join(this.watchedPath, rest);
  }

  // Private: Given an event that happened at a "real" filesystem path, adjusts
  // it (if necessary) to match the path that the user subscribed to.
  //
  // This saves the user from having to make their own calls to `fs.realpath`
  // on their end just to do path equality checks.
  denormalizeEvent(event) {
    if (this.options.realPaths) return event;
    if (this.watchedPath === this.normalizedPath) return event;
    let result = { ...event };
    result.path = this.denormalizePath(event.path);
    if (event.oldPath) {
      result.oldPath = this.denormalizePath(event.oldPath);
    }
    return result;
  }

  // Private: Invoked when the attached native watcher creates a batch of
  // native filesystem events. The native watcher's events may include events
  // for paths above this watcher's root path, so filter them to only include
  // the relevant ones, then re-broadcast them to our subscribers.
  onNativeEvents(events, callback) {
    const isWatchedPath = eventPath =>
      eventPath.startsWith(this.normalizedPath);

    const filtered = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.action === 'renamed') {
        const srcWatched = isWatchedPath(event.oldPath);
        const destWatched = isWatchedPath(event.path);

        if (srcWatched && destWatched) {
          filtered.push(event);
        } else if (srcWatched && !destWatched) {
          filtered.push(this.denormalizeEvent({
            action: 'deleted',
            kind: event.kind,
            path: event.oldPath
          }));
        } else if (!srcWatched && destWatched) {
          filtered.push(this.denormalizeEvent({
            action: 'created',
            kind: event.kind,
            path: event.path
          }));
        }
      } else {
        if (isWatchedPath(event.path)) {
          filtered.push(this.denormalizeEvent(event));
        }
      }
    }

    if (filtered.length > 0) {
      callback(filtered);
    }
  }

  // Extended: Unsubscribe all subscribers from filesystem events. Native
  // resources will be released asynchronously, but this watcher will stop
  // broadcasting events immediately.
  dispose() {
    this.disposing = true;
    for (const sub of this.changeCallbacks.values()) {
      sub.dispose();
    }

    this.emitter.dispose();
    this.subs.dispose();
  }
}

// Private: Globally tracked state used to de-duplicate related
// [PathWatchers]{PathWatcher} backed by emulated Pulsar events or NSFW.
class PathWatcherManager {
  // Private: Access the currently active manager instance, creating one if
  // necessary.
  static active() {
    if (!this.activeManager) {
      this.activeManager = new PathWatcherManager(
        atom.config.get('core.fileSystemWatcher')
      );
      this.sub = atom.config.onDidChange(
        'core.fileSystemWatcher',
        ({ newValue }) => {
          this.transitionTo(newValue);
        }
      );
    }
    return this.activeManager;
  }

  // Private: Replace the active {PathWatcherManager} with a new one that
  // creates [NativeWatchers]{NativeWatcher} based on the value of `setting`.
  static async transitionTo(setting) {
    const current = this.active();

    if (this.transitionPromise) {
      await this.transitionPromise;
    }

    if (current.setting === setting) {
      return;
    }
    current.isShuttingDown = true;

    let resolveTransitionPromise = () => {};
    this.transitionPromise = new Promise(resolve => {
      resolveTransitionPromise = resolve;
    });

    const replacement = new PathWatcherManager(setting);
    this.activeManager = replacement;

    await Promise.all(
      Array.from(current.live, async ([root, native]) => {
        const w = await replacement.createWatcher(root, () => {});
        native.reattachTo(w.native, root, w.native.options || {});
      })
    );

    current.stopAllWatchers();

    resolveTransitionPromise();
    this.transitionPromise = null;
  }

  // Private: Initialize global {PathWatcher} state.
  constructor(setting) {
    this.setting = setting;
    this.live = new Map();

    this.nativeRegistry = new NativeWatcherRegistry(normalizedPath => {
      const nativeWatcher = new ParcelNativeWatcher(normalizedPath);

      this.live.set(normalizedPath, nativeWatcher);
      const sub = nativeWatcher.onWillStop(() => {
        this.live.delete(normalizedPath);
        sub.dispose();
      });

      return nativeWatcher;
    });

    this.isShuttingDown = false;
  }

  // Private: Create a {PathWatcher} tied to this global state. See {watchPath}
  // for detailed arguments.
  async createWatcher(rootPath, eventCallback, options) {
    if (this.isShuttingDown) {
      await this.constructor.transitionPromise;
      return PathWatcherManager.active().createWatcher(
        rootPath,
        eventCallback,
        options
      );
    }

    const w = new PathWatcher(this.nativeRegistry, rootPath, options);
    w.onDidChange(eventCallback);
    await w.getStartPromise();
    return w;
  }

  // Private: Return a {String} depicting the currently active native watchers.
  print() {
    return this.nativeRegistry.print();
  }

  // Private: Stop all living watchers.
  //
  // Returns a {Promise} that resolves when all native watcher resources are
  // disposed.
  stopAllWatchers() {
    return Promise.all(Array.from(this.live, ([, w]) => w.stop()));
  }
}

// Extended: Invoke a callback with each filesystem event that occurs beneath a
// specified path. If you only need to watch events within the project's root
// paths, use {Project::onDidChangeFiles} instead.
//
// watchPath handles the efficient re-use of operating system resources across
// living watchers. Watching the same path more than once, or the child of a
// watched path, will re-use the existing native watcher.
//
// * `rootPath` {String} specifies the absolute path to the root of the
//   filesystem content to watch.
// * `options` Control the watcher's behavior:
//   * `realPaths` {Boolean} Whether to report real paths on disk for
//     filesystem events. Default is `true`; a value of `false` will instead
//     return paths on disk that will always descend from the given path, even
//     if the real path of the file is different due to symlinks.
// * `eventCallback` {Function} or other callable to be called each time a
//   batch of filesystem events is observed.
//    * `events` {Array} of objects that describe the events that have occurred.
//      * `action` {String} describing the filesystem action that occurred. One
//        of `"created"`, `"modified"`, `"deleted"`, or `"renamed"`.
//      * `path` {String} containing the absolute path to the filesystem entry
//        that was acted upon.
//      * `oldPath` For rename events, {String} containing the filesystem
//        entry's former absolute path.
//
// Returns a {Promise} that will resolve to a {PathWatcher} once it has
// started. Note that every {PathWatcher} is a {Disposable}, so they can be
// managed by a {CompositeDisposable} if desired.
//
// ```js
// const {watchPath} = require('atom')
//
// const disposable = await watchPath('/var/log', {}, events => {
//   console.log(`Received batch of ${events.length} events.`)
//   for (const event of events) {
//     // "created", "modified", "deleted", "renamed"
//     console.log(`Event action: ${event.action}`)
//     // absolute path to the filesystem entry that was touched
//     console.log(`Event path: ${event.path}`)
//     if (event.action === 'renamed') {
//       console.log(`.. renamed from: ${event.oldPath}`)
//     }
//   }
// })
//
//  // Immediately stop receiving filesystem events. If this is the last
//  // watcher, asynchronously release any OS resources required to subscribe
//  // to these events.
//  disposable.dispose()
// ```
//
function watchPath(rootPath, options, eventCallback) {
  return PathWatcherManager.active().createWatcher(
    rootPath,
    eventCallback,
    options
  );
}

// Private: Return a Promise that resolves when all {NativeWatcher} instances
// associated with a FileSystemManager have stopped listening. This is useful
// for `afterEach()` blocks in unit tests.
function stopAllWatchers() {
  return PathWatcherManager.active().stopAllWatchers();
}

// Private: Show the currently active native watchers in a formatted {String}.
watchPath.printWatchers = function () {
  return PathWatcherManager.active().print();
};


module.exports = { watchPath, stopAllWatchers };
