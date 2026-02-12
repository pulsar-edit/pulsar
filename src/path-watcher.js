const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { Emitter, Disposable, CompositeDisposable } = require('event-kit');
const nsfw = require('nsfw');
const { NativeWatcherRegistry } = require('./native-watcher-registry');
const Task = require('./task');

// Private: Associate native watcher action flags with descriptive String
// equivalents.
const ACTION_MAP = new Map([
  [nsfw.actions.MODIFIED, 'modified'],
  [nsfw.actions.CREATED,  'created' ],
  [nsfw.actions.DELETED,  'deleted' ],
  [nsfw.actions.RENAMED,  'renamed' ]
]);

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

// A file-watcher implementation that uses `@parcel/watcher`.
//
// We briefly experimented with importing it directly into the renderer
// process, but it caused crashes on window reload for reasons that haven't
// been fully tracked down. That's fine, though; we can run it in its own
// long-running task, much like VS Code does.
class ParcelWatcherNativeWatcher extends NativeWatcher {
  static task = new Task(require.resolve('./parcel-watcher-worker.js'), { autoStart: false });

  // Whether the task has been started.
  static started = false;

  // Whether the task has had its listeners attached.
  static initialized = false;

  // Job IDs for request/response cycles.
  static PROMISE_META = new Map();

  // All instances of this watcher organized by unique ID.
  static INSTANCES = new Map();

  static register(instance) {
    this.initialize();
    this.INSTANCES.set(instance.id, instance);
  }

  static unregister(instance) {
    this.INSTANCES.delete(instance.id);
    if (this.INSTANCES.size === 0) {
      this.task.terminate();
      this.started = false;
      this.initialized = false;
      // Once a task is terminated, it cannot be started again. We have to
      // replace it with a new instance.
      this.task = new Task(require.resolve('./parcel-watcher-worker.js'), { autoStart: false });
      this.PROMISE_META.clear();
      this.initialize();
    }
  }

  static initialize() {
    if (this.initialized) return;

    // Emitted when the worker responds to a method call.
    this.task.on('watcher:reply', ({ id, args, error }) => {
      let meta = this.PROMISE_META.get(id);
      if (!meta) return;
      if (error) {
        meta.reject(new Error(error));
      } else {
        meta.resolve(args);
      }
      this.PROMISE_META.delete(id);
    });

    // Emitted when the worker pushes events.
    this.task.on('watcher:events', ({ id, events }) => {
      let instance = this.INSTANCES.get(id);
      instance?.onEvents(events);
    });

    // Emitted when the worker pushes a watcher error.
    this.task.on('watcher:error', ({ id, error }) => {
      let instance = this.INSTANCES.get(id);
      instance?.onError(new Error(error));
    });

    // Emitted when the worker is created and ready to receive method calls.
    this.task.on('watcher:ready', () => {
      this.PROMISE_META.get('self:start')?.resolve?.();
    });

    // Logging from the worker.
    this.task.on('console:log', (args) => {
      console.log(...args);
    });

    this.task.on('console:warn', (args) => {
      console.warn(...args);
    });

    this.task.on('console:error', (args) => {
      console.error(...args);
    });

    this.initialized = true;
  }

  static async startTask() {
    // This is an unusual one-off task, so we'll use a special key for its
    // promise metadata.
    let meta = this.PROMISE_META.get('self:start');
    if (!meta) {
      meta = {};
      let promise = new Promise((resolve, reject) => {
        meta.resolve = resolve;
        meta.reject = reject;
        this.task.start();
      });
      meta.promise = promise;
      this.PROMISE_META.set('self:start', meta);
    }
    this.started = true;
    await meta.promise;
  }

  static async sendEvent(event, args) {
    let id = this.getID();
    let bundle = { id, event, args };
    let meta = {};
    let promise = new Promise((resolve, reject) => {
      meta.resolve = resolve;
      meta.reject = reject;
    });
    meta.promise = promise;
    this.PROMISE_META.set(id, meta);
    this.task.send(JSON.stringify(bundle));
    return await promise;
  }

  // Both instances and jobs have randomly-generated IDs. We use the job IDs
  // for standard request/response cycles initiated by the renderer. We use
  // the instance IDs for worker-initiated pushes that are routed directly
  // to the corresponding watcher instance.
  static getID() {
    let id;
    // Generate an ID that does not collide with any other IDs we're currently
    // using.
    do {
      id = crypto.randomBytes(5).toString('hex');
    } while (this.INSTANCES.has(id) || this.PROMISE_META.has(id));
    return id;
  }

  dispose() {
    super.dispose();
    this.constructor.unregister(this);
  }

  constructor(...args) {
    super(...args);
    this.id = this.constructor.getID();

    this.subs.add(
      atom.config.observe('core.ignoredNames', (newValue) => {
        this.setIgnoredNames(newValue);
      })
    );
  }

  async send(event, args) {
    await this.constructor.sendEvent(event, args);
  }

  setIgnoredNames(ignoredNames) {
    this.ignoredNames = ignoredNames;
    if (this.state === WATCHER_STATE.RUNNING) {
      // This watcher can't update ignores after starting, but that's its own
      // implementation detail to work out. It will respond to this command by
      // creating a new watcher, waiting for it to start, then stopping the old
      // one.
      this.send('watcher:update', {
        normalizedPath: this.normalizedPath,
        instance: this.id,
        ignored: this.ignoredNames
      });
    }
  }

  async doStart() {
    // “Registration” would ordinarily happen earlier in the lifecycle of this
    // instance. But (a) the purpose of it is to make the constructor know
    // about our ID so it can funnel events to us, which isn't necessary until
    // the watcher action starts; (b) if we register just before starting a
    // watcher and unregister just after ending a watcher, we get to use it as
    // a sort of reference-counting. That helps us know when the task itself
    // can be killed.
    this.constructor.register(this);
    if (!ParcelWatcherNativeWatcher.started) {
      await ParcelWatcherNativeWatcher.startTask();
    }

    return await this.send('watcher:watch', {
      normalizedPath: this.normalizedPath,
      instance: this.id,
      ignored: this.ignoredNames
    });
  }

  async doStop() {
    let result = await this.send('watcher:unwatch', {
      normalizedPath: this.normalizedPath,
      instance: this.id
    });
    this.constructor.unregister(this);
    return result;
  }
}

// A file-watcher implementation that uses `nsfw`. Runs in a separate process.
class NSFWNativeWatcher extends NativeWatcher {
  static task = new Task(require.resolve('./nsfw-watcher-worker.js'), { autoStart: false });

  // Whether the task has been started.
  static started = false;

  // Whether the task has had its listeners attached.
  static initialized = false;

  // Job IDs for request/response cycles.
  static PROMISE_META = new Map();

  // All instances of this watcher organized by unique ID.
  static INSTANCES = new Map();

  static register(instance) {
    this.initialize();
    this.INSTANCES.set(instance.id, instance);
  }

  static unregister(instance) {
    this.INSTANCES.delete(instance.id);
    if (this.INSTANCES.size === 0) {
      this.task.terminate();
      this.started = false;
      this.initialized = false;
      // Once a task is terminated, it cannot be started again. We have to
      // replace it with a new instance.
      this.task = new Task(require.resolve('./nsfw-watcher-worker.js'), { autoStart: false });
      this.PROMISE_META.clear();
      this.initialize();
    }
  }

  static initialize() {
    if (this.initialized) return;

    // Emitted when the worker responds to a method call.
    this.task.on('watcher:reply', ({ id, args, error }) => {
      let meta = this.PROMISE_META.get(id);
      if (!meta) return;
      if (error) {
        meta.reject(new Error(error));
      } else {
        meta.resolve(args);
      }
      this.PROMISE_META.delete(id);
    });

    // Emitted when the worker pushes events.
    this.task.on('watcher:events', ({ id, events }) => {
      let instance = this.INSTANCES.get(id);
      instance?.onEvents(events);
    });

    // Emitted when the worker pushes a watcher error.
    this.task.on('watcher:error', ({ id, error }) => {
      let instance = this.INSTANCES.get(id);
      instance?.onError(new Error(error));
    });

    // Emitted when the worker is created and ready to receive method calls.
    this.task.on('watcher:ready', () => {
      this.PROMISE_META.get('self:start')?.resolve?.();
    });

    // Logging from the worker.
    this.task.on('console:log', (args) => {
      console.log(...args);
    });

    this.task.on('console:warn', (args) => {
      console.warn(...args);
    });

    this.task.on('console:error', (args) => {
      console.error(...args);
    });

    this.initialized = true;
  }

  static async startTask() {
    // This is an unusual one-off task, so we'll use a special key for its
    // promise metadata.
    let meta = this.PROMISE_META.get('self:start');
    if (!meta) {
      meta = {};
      let promise = new Promise((resolve, reject) => {
        meta.resolve = resolve;
        meta.reject = reject;
        this.task.start();
      });
      meta.promise = promise;
      this.PROMISE_META.set('self:start', meta);
    }
    this.started = true;
    await meta.promise;
  }

  static async sendEvent(event, args) {
    let id = this.getID();
    let bundle = { id, event, args };
    let meta = {};
    let promise = new Promise((resolve, reject) => {
      meta.resolve = resolve;
      meta.reject = reject;
    });
    meta.promise = promise;
    this.PROMISE_META.set(id, meta);
    this.task.send(JSON.stringify(bundle));
    let result = await promise;
    return result;
  }

  // Both instances and jobs have randomly-generated IDs. We use the job IDs
  // for standard request/response cycles initiated by the renderer. We use
  // the instance IDs for worker-initiated pushes that are routed directly
  // to the corresponding watcher instance.
  static getID() {
    let id;
    // Generate an ID that does not collide with any other IDs we're currently
    // using.
    do {
      id = crypto.randomBytes(5).toString('hex');
    } while (this.INSTANCES.has(id) || this.PROMISE_META.has(id));
    return id;
  }

  dispose() {
    super.dispose();
    this.constructor.unregister(this);
  }

  constructor(...args) {
    super(...args);
    this.id = this.constructor.getID();

    this.subs.add(
      atom.config.observe('core.ignoredNames', (value) => {
        this.setIgnoredNames(value);
      })
    );
  }

  setIgnoredNames(ignoredNames) {
    this.ignoredNames = ignoredNames;
    if (this.state === WATCHER_STATE.RUNNING) {
      // We can update this watcher without restarting it. We send a special
      // event name that will look up the watcher, generate new ignores, and
      // update the excluded paths list.
      this.send('watcher:update', {
        normalizedPath: this.normalizedPath,
        instance: this.id,
        ignored: this.ignoredNames
      });
    }
  }

  async send(event, args) {
    await this.constructor.sendEvent(event, args);
  }

  async doStart() {
    // “Registration” would ordinarily happen earlier in the lifecycle of this
    // instance. But (a) the purpose of it is to make the constructor know
    // about our ID so it can funnel events to us, which isn't necessary until
    // the watcher action starts; (b) if we register just before starting a
    // watcher and unregister just after ending a watcher, we get to use it as
    // a sort of reference-counting. That helps us know when the task itself
    // can be killed.
    this.constructor.register(this);
    if (!NSFWNativeWatcher.started) {
      await NSFWNativeWatcher.startTask();
    }

    return await this.send('watcher:watch', {
      normalizedPath: this.normalizedPath,
      instance: this.id,
      ignored: this.ignoredNames
    });
  }

  async doStop() {
    let result = await this.send('watcher:unwatch', {
      normalizedPath: this.normalizedPath,
      instance: this.id
    });
    this.constructor.unregister(this);
    return result;
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

  static DEFAULT_OPTIONS = {
    // Whether to normalize filesystem paths to take symlinks into account. The
    // default, `true`, means that real paths will always be reported; a value
    // of `false` means that the appropriate path for the watcher will be
    // reported, even if this means converting a real path to a symlinked path.
    realPaths: true
  }

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
    this.options = { ...PathWatcher.DEFAULT_OPTIONS, ...options };

    this.normalizedPath = null;
    this.native = null;
    this.changeCallbacks = new Map();

    // Whether the entire `AtomEnvironment` is destroying.
    this.isDestroying = false;

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
        // Ordinarily, when a single native watcher detaches, it might prompt
        // the _creation_ of new watchers, since there might've been some paths
        // that piggy-backed onto an existing watcher.
        //
        // But if the native watcher is detaching because the entire
        // environment is destroying, then we absolutely should not attach a
        // replacement watcher.
        if (this.isDestroying) return;
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

    this.subs.add(
      atom.onWillDestroy(() => {
        this.isDestroying = true;
        // TODO: Be proactive about stopping file watchers? Or just set the
        // flag so that they aren't recreated during teardown?
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
    let index = {};
    for (let event of events) {
      index[event.action] ??= [];
      index[event.action].push(event);
    }

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
            path: this.denormalizePath(event.path)
          }));
        }
      } else {
        if (isWatchedPath(event.path)) {
          let denormalizedEvent = this.denormalizeEvent(event);
          filtered.push(denormalizedEvent);
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
    PathWatcherManager.transitionPromise ??= Promise.resolve();
    this.setting = setting;
    this.live = new Map();

    const initLocal = (NativeConstructor) => {
      this.nativeRegistry = new NativeWatcherRegistry(normalizedPath => {
        const nativeWatcher = new NativeConstructor(normalizedPath);
        this.live.set(normalizedPath, nativeWatcher);
        const sub = nativeWatcher.onWillStop(() => {
          this.live.delete(normalizedPath);
          sub.dispose();
        });

        return nativeWatcher;
      });
    }

    // Look up the proper watcher implementation based on the current value of
    // the `core.fileSystemWatcher` setting.
    let WatcherClass = WATCHERS_BY_VALUE[setting] ?? WATCHERS_BY_VALUE['default'];
    initLocal(WatcherClass);

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
// `watchPath` handles the efficient re-use of operating system resources
// across living watchers. Watching the same path more than once, or the child
// of a watched path, will re-use the existing native watcher.
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
// The specific library used for file watching may vary over time and may be
// configurable via the `core.fileSystemWatcher` setting. Some implementations
// may work better than others on certain platforms, but all will abide by the
// same contract and should behave in similar fashion to one another.
//
// __Important note:__ `watchPath` will _always_ respect the patterns specified
// by the `core.ignoredNames` setting and will pass those exclusions to the
// underlying native file watcher implementation. This helps reduce the cost of
// recursive file-watching on certain platforms.
//
// Files that match `core.ignoredNames` may still trigger change handlers, but
// _directories_ that match `core.ignoredNames` will be excluded from recursive
// watchers. No filesystem activity that occurs within an excluded directory
// will ever trigger a change handler for `watchPath`.
//
// If you have a legitimate need to watch a path that will or could be listed
// in `core.ignoredNames`, you must instead use a non-recursive watcher on that
// path via {Directory::onDidChange}.
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
watchPath.printWatchers = function printWatchers() {
  return PathWatcherManager.active().print();
};

// Private: Wait for new watchers to be created after a change to
// `core.fileSystemWatcher`. This is useful to have in the specs.
watchPath.waitForTransition = async function waitForTransition() {
  await PathWatcherManager.transitionPromise;
};

// Private: Stop all watchers and reset `PathWatcherManager` to its initial
// state.
watchPath.reset = function reset() {
  return PathWatcherManager.active().stopAllWatchers().then(() => {
    PathWatcherManager.activeManager = null;
  });
}

// Which implementation to use for each possible value of
// `core.fileSystemWatcher`.
//
// The 'default' value — which is, uh, the default — allows us to switch the
// default at a later date without affecting users that have opted into a
// specific watcher.
const WATCHERS_BY_VALUE = {
  'default': NSFWNativeWatcher,
  'nsfw': NSFWNativeWatcher,
  'parcel': ParcelWatcherNativeWatcher
};

module.exports = { watchPath, stopAllWatchers };
