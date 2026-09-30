const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { Emitter, Disposable, CompositeDisposable } = require('event-kit');
const { NativeWatcherRegistry } = require('./native-watcher-registry');
const WatcherTask = require('./watcher-task');

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
  #startingPromise = null;
  #stoppingPromise = null;

  // Private: Initialize a native watcher on a path.
  //
  // Events will not be produced until {::start} is called.
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
  // Has no effect if the watcher has already been started, but acts
  // idempotently. You may call `await watcher.start()` if you want to
  // guarantee it has been started before acting.
  async start() {
    if (this.state !== WATCHER_STATE.STOPPED) {
      return this.#startingPromise ?? Promise.resolve();
    }

    this.#startingPromise = this.performStart()
      .finally(() => this.#startingPromise = null);
    return this.#startingPromise;
  }

  async performStart() {
    this.state = WATCHER_STATE.STARTING;

    try {
      await this.doStart();
    } catch (err) {
      // Any errors encountered during start would leave us stuck in
      // `STARTING`, so instead we catch them and reset to `STOPPED`.
      this.state = WATCHER_STATE.STOPPED;
      this.onError(err);
      return;
    }

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

  // Private: Register a callback to be invoked with normalized filesystem
  // events as they arrive. Starts the watcher automatically if it is not
  // already running. The watcher will be stopped automatically when all
  // subscribers dispose their subscriptions.
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

  // Private: Register a callback to be invoked when a {Watcher} should attach
  // to a different {NativeWatcher}.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onShouldDetach(callback) {
    return this.emitter.on('should-detach', callback);
  }

  // Private: Register a callback to be invoked when a {NativeWatcher} is about
  // to be stopped.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onWillStop(callback) {
    return this.emitter.on('will-stop', callback);
  }

  // Private: Register a callback to be invoked when the filesystem watcher has
  // been stopped.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onDidStop(callback) {
    return this.emitter.on('did-stop', callback);
  }

  // Private: Register a callback to be invoked with any errors reported from
  // the watcher.
  //
  // Consumers should listen for errors because they may reflect gaps where
  // filesystem events were missed. An `onDidError` handler could recover from
  // this failure in a manner appropriate for the use case — for instance,
  // examining file modification times.
  //
  // Errors are typically not fatal, so consumers should not assume that a
  // watcher is in an unrecoverable state simply because this callback was
  // invoked.
  //
  // * `callback` A callback to invoke. Will be given a single parameter
  //   containing an {Error} describing what went wrong.
  //
  // Returns: A {Disposable} to revoke the subscription.
  onDidError(callback) {
    return this.emitter.on('did-error', callback);
  }

  // Private: Broadcast an `onShouldDetach` event to prompt any {Watcher}
  // instances bound here to attach to a new {NativeWatcher} instead.
  //
  // * `replacement` the new {NativeWatcher} instance that a live {Watcher}
  //   instance should reattach to instead.
  // * `watchedPath` absolute path watched by the new {NativeWatcher}.
  reattachTo(replacement, watchedPath, options) {
    this.emitter.emit('should-detach', { replacement, watchedPath, options });
  }

  // Private: Stop the native watcher and release any operating system
  // resources associated with it.
  //
  // Has no effect if the watcher is not running.
  stop() {
    if (this.state === WATCHER_STATE.STOPPED) {
      return Promise.resolve();
    }

    // If a stop is already in progress, return that promise.
    if (this.#stoppingPromise) return this.#stoppingPromise;

    this.#stoppingPromise = this.performStop()
      .finally(() => this.#stoppingPromise = null);

    return this.#stoppingPromise;
  }

  async performStop() {
    // A stop that arrives mid-start has nothing to stop yet. The worker won't
    // know about this watcher until `doStart` completes. So we'll wait for the
    // start to finish before we try to stop it.
    if (this.state === WATCHER_STATE.STARTING) {
      await (this.#startingPromise ?? Promise.resolve());
    }

    // The start may have failed, in which case we're already stopped.
    if (this.state !== WATCHER_STATE.RUNNING) return;

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

// A `NativeWatcher` that delegates file-watching to a worker process.
class WorkerProcessWatcher extends NativeWatcher {
  // The path to the worker script.
  static taskPath = undefined;
  // An instance of `WatcherTask`.
  static task = undefined;

  // Whether the watcher task has been created and had its events bound.
  static initialized = false;

  // Whether the watcher's worker is in the process of respawning.
  static pendingRespawn = false;

  // Whether the watcher task is currently running in its own process.
  static started = false;

  // Whether we've already told the user that file-watching has failed. Reset
  // when a new task is created so that a later failure can report afresh.
  static reportedFatalFailure = false;

  // How long to wait for the worker to answer a request before giving up on it.
  //
  // Generous on purpose: a `watcher:watch` over a large tree has real work to do
  // first (walking it to turn ignore globs into exclusions), and a spurious
  // rejection would surface to the user as a watcher error. This is a "something
  // is wrong" threshold, not a latency budget.
  static REPLY_TIMEOUT_MS = 60000;

  // Unexpected worker restarts since the last time we mentioned them to the
  // user. Unlike `WatcherTask`'s own accounting, this does not expire; it's how
  // we notice a worker that crashes steadily but slowly enough to be restarted
  // every time.
  static respawnCount = 0;

  // How many restarts to tolerate before suggesting a different watcher.
  //
  // Deliberately greater than `WatcherTask`'s `MAX_RESTARTS`: a single burst of
  // rapid crashes ends in `task:failed` and reports itself as a fatal error, and
  // we don't want a warning about the same incident alongside it.
  static MAX_RESPAWNS_BEFORE_WARNING = 6;

  // Keeps track of instances of `WorkerProcessWatch` indexed by ID.
  static INSTANCES = new Map();

  // Keeps track of pending method calls indexed by ID.
  static PROMISE_META = new Map();

  static createWatcherTask() {
    this.started = false;
    this.initialized = false;
    this.pendingRespawn = false;
    this.logging = this.readLoggingSetting();
    this.reportedFatalFailure = false;
    this.respawnCount = 0;
    this.task = new WatcherTask(this.taskPath);
  }

  // Private: A button that takes the user to the settings where they can choose
  // a different file-watcher implementation.
  static openSettingsButton() {
    return {
      text: 'Open Settings',
      onDidClick: () => atom.workspace.open('atom://config/core')
    };
  }

  // Private: Tell the user that the worker keeps crashing, even though it has
  // recovered each time. Events are lost with every restart, so a watcher in
  // this state is worth mentioning without being fatal.
  static reportRepeatedCrashes() {
    atom.notifications?.addWarning('Pulsar’s file watcher keeps crashing.', {
      description:
        'It has restarted several times, and changes to your files may have been missed each time. You can try a different implementation with the **Core → File System Watcher** setting.',
      dismissable: true,
      buttons: [this.openSettingsButton()]
    });
  }

  // Private: Tell the user that file-watching has stopped working.
  //
  // Called when the worker has failed in a way it can't recover from — either
  // it never started, or it exhausted its restarts. In both cases every watcher
  // is now dead, and the user's only recourse is to try another implementation,
  // so point them at the setting.
  static reportFatalFailure(error) {
    if (this.reportedFatalFailure) return;
    this.reportedFatalFailure = true;
    atom.notifications?.addError('Pulsar’s file watcher has failed.', {
      description:
        'Pulsar can no longer detect changes that other programs make to your files. You can try a different implementation with the **Core → File System Watcher** setting.',
      detail: error?.message,
      dismissable: true,
      buttons: [this.openSettingsButton()]
    });
  }

  // Private: Whether the worker should report its activity to the renderer's
  // console. Read afresh whenever a worker is spawned; `restartTask` applies a
  // change to an already-running worker.
  static readLoggingSetting() {
    return atom.config.get('core.fileSystemWatcherLogging') ?? false;
  }

  // Private: Tell a running worker that the logging setting has changed. A
  // worker that hasn't spawned yet needs no message; `createWatcherTask` reads
  // the setting for itself.
  static async updateLogging() {
    this.logging = this.readLoggingSetting();
    if (!this.task || !this.started) return;

    // The worker installs its own message handler inside `run`, immediately
    // before emitting `watcher:ready` — so waiting on the start promise
    // guarantees there's something on the other end to receive this.
    await this.PROMISE_META.get('self:start')?.promise?.catch(() => {});
    if (!this.task) return;

    try {
      await this.sendEvent('watcher:logging', { logging: this.logging });
    } catch (error) {
      // Nothing worth surfacing to the user: the worker keeps logging the way
      // it was, and a respawn will pick up the new value regardless.
    }
  }

  static destroyWatcherTask() {
    if (!this.initialized) return;
    this.task?.terminate();
    this.task = null;
    this.started = false;
    this.initialized = false;
    this.pendingRespawn = false;
    this.PROMISE_META.clear();
  }

  static register(instance) {
    this.initialize();
    this.INSTANCES.set(instance.id, instance);
  }

  static unregister(instance) {
    this.INSTANCES.delete(instance.id);
    if (this.INSTANCES.size === 0) {
      this.destroyWatcherTask();
    }
  }

  static initialize() {
    if (this.initialized) return;
    if (!this.task) this.createWatcherTask();

    // Create new copies of these maps so that we don't accidentally share
    // state with any other subclasses of `WorkerProcessWatcher`.
    this.PROMISE_META = new Map();
    this.INSTANCES = new Map();

    // Response to a method call. Look up the promise and its resolvers in the
    // table and call the appropriate one.
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

    // Filesystem events reported by the watcher.
    this.task.on('watcher:events', ({ id, events }) => {
      let instance = this.INSTANCES.get(id);
      instance?.onEvents(events);
    });

    // Errors reported by the watcher.
    this.task.on('watcher:error', ({ id, error }) => {
      let instance = this.INSTANCES.get(id);
      instance?.onError(new Error(error));
    });

    // The watcher signaling that it's ready to start listening to files.
    this.task.on('watcher:ready', () => {
      // Clear the entry as well as resolving it, so that the presence of a
      // `self:start` entry always means a start is genuinely in flight.
      this.PROMISE_META.get('self:start')?.resolve?.();
      this.PROMISE_META.delete('self:start');
      if (!this.pendingRespawn) return;
      this.pendingRespawn = false;
      for (let instance of this.INSTANCES.values()) {
        instance.reestablish();
      }
    });

    this.task.on('task:respawned', () => {
      // Everything still in flight is waiting on a process that no longer
      // exists.
      for (let [id, meta] of this.PROMISE_META) {
        if (id === 'self:start') continue;
        meta.reject(new Error('File watcher worker exited unexpectedly'));
        this.PROMISE_META.delete(id);
      }
      this.pendingRespawn = true;

      // Reset rather than latch: a worker that goes on crashing should be able
      // to say so again later, rather than mentioning it once per window.
      this.respawnCount++;
      if (this.respawnCount >= this.MAX_RESPAWNS_BEFORE_WARNING) {
        this.respawnCount = 0;
        this.reportRepeatedCrashes();
      }
    });

    this.task.on('task:failed', (error) => {
      // Anyone waiting for the worker to start is waiting for something that
      // will never happen, so reject instead of leaving them hanging. Clearing
      // the flag and the promise means a later `startTask` can try again from
      // scratch.
      // Whether or not anyone is waiting on a start, the task is no longer
      // running anything. Clearing the flag means the next `doStart` calls
      // `startTask` again rather than posting messages to a worker that isn't
      // there — by then the rapid-failure window will have drained, so it gets
      // a real attempt.
      this.started = false;

      let startMeta = this.PROMISE_META.get('self:start');
      if (startMeta) {
        this.PROMISE_META.delete('self:start');
        startMeta.reject(error);
      }

      // Every watcher this task was serving is now dead, so this is worth
      // interrupting the user over — unlike the `did-error` reports below,
      // which are frequent enough that the console is the right place for them.
      this.reportFatalFailure(error);

      for (let instance of this.INSTANCES.values()) {
        instance.onError(error);
      }
    });

    this.initialized = true;
  }

  // Tell the worker to set up file-watching.
  static async startTask() {
    let meta = this.PROMISE_META.get('self:start');
    if (!meta) {
      meta = {};
      let promise = new Promise((resolve, reject) => {
        meta.resolve = resolve;
        meta.reject = reject;
        this.task.start({ logging: this.logging });
      });
      meta.promise = promise;
      this.PROMISE_META.set('self:start', meta);
    }
    this.started = true;
    await meta.promise;
  }

  // Generate a unique ID to identify a watcher or a method call.
  static generateID() {
    let id;
    // The ID must not clash with any IDs we're already using.
    do {
      id = crypto.randomBytes(5).toString('hex');
    } while (this.INSTANCES.has(id) || this.PROMISE_META.has(id));
    return id;
  }

  // Send an event to the worker and wait for its response.
  static async sendEvent(event, args) {
    let id = this.generateID();
    let bundle = { id, event, args };
    let meta = {};
    let promise = new Promise((resolve, reject) => {
      meta.resolve = resolve;
      meta.reject = reject;
    });
    meta.promise = promise;
    this.PROMISE_META.set(id, meta);
    if (!this.task?.send(JSON.stringify(bundle))) {
      // Nothing received this, so nothing will ever reply to it. Waiting would
      // mean waiting forever.
      this.PROMISE_META.delete(id);
      throw new Error(`Cannot reach the file watcher worker to send: ${event}`);
    }

    // A worker that accepts a message and then never answers it used to hang the
    // caller for the life of the window — and since `stop` and `dispose` go
    // through here too, that could strand teardown as easily as startup. Time it
    // out instead, and say what went unanswered.
    let timer = setTimeout(() => {
      if (!this.PROMISE_META.has(id)) return;
      this.PROMISE_META.delete(id);
      let where = args?.normalizedPath ? ` (path: ${args.normalizedPath})` : '';
      meta.reject(
        new Error(
          `File watcher worker did not reply to ${event} within ${this.REPLY_TIMEOUT_MS}ms${where}`
        )
      );
    }, this.REPLY_TIMEOUT_MS);

    try {
      return await promise;
    } finally {
      // However it settled — a reply, a respawn, or the timeout above — the
      // timer has no further use.
      clearTimeout(timer);
    }
  }

  constructor(...args) {
    super(...args);
    this.id = this.constructor.generateID();

    // TODO: Optional handling of ignored names.
    //
    // It is a good idea to improve worker performance and cut down on
    // wastefulness by having recursive watchers respect the editor's and
    // project's settings for ignored names. This is how VS Code handles
    // recursive watchers; anything that wants to watch below an ignored path
    // must set up its own non-recursive watcher.
    //
    // However, this is hard for us to do, both because of backward
    // compatibility (some of our own watchers rely on the behavior we're
    // trying to prohibit!) and because we try to share/reuse watchers.
    //
    // One way around this would be to allow watchers to opt into ignored-name
    // behavior, then have two "pools," each of which could share instances
    // with other watchers in the same pool.
  }

  dispose() {
    super.dispose();
    this.constructor.unregister(this);
  }

  async send(event, args) {
    await this.constructor.sendEvent(event, args);
  }

  // Private: Update the list of ignored names so the watcher can respond
  // accordingly.
  //
  // This is laying the groundwork for a future enhancement, so this should not
  // be treated as binding just yet.
  setIgnoredNames(ignoredNames) {
    this.ignoredNames = ignoredNames;
    if (this.state === WATCHER_STATE.RUNNING) {
      // Deliberately swallowed: if there's no worker to tell, the names we just
      // stored will be sent along with the `watcher:watch` that starts the next
      // one, so they'll be accurate regardless. Nothing here is worth reporting.
      this.send('watcher:update', {
        normalizedPath: this.normalizedPath,
        instance: this.id,
        ignored: this.ignoredNames
      }).catch(() => {});
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

    try {
      if (!this.constructor.started) {
        await this.constructor.startTask();
      }
      return await this.send('watcher:watch', this.buildWatchParams());
    } catch (err) {
      // We registered above. If the watch never took, we have to undo that, or
      // else the instance will keep the worker open for the life of the
      // window.
      this.constructor.unregister(this);
      throw err;
    }
  }

  async doStop() {
    try {
      await this.send('watcher:unwatch', {
        normalizedPath: this.normalizedPath,
        instance: this.id
      });
    } catch (error) {
      // A worker we can't reach has already stopped watching on our behalf,
      // which is all this method wanted. Consumers are usually disposing, and
      // there is nothing for them to do about it.
    } finally {
      // Either way: a stop that skipped this would keep the worker alive for the
      // rest of the window, since the task is only destroyed once the last
      // instance unregisters.
      this.constructor.unregister(this);
    }
  }

  // Private: Re-create this watcher's subscription in a freshly respawned
  // worker process.
  //
  // The previous worker died along with its watchers, so the new one has never
  // heard of this instance; from its perspective this is an ordinary
  // `watcher:watch`. Filesystem activity between the crash and this call is
  // lost with no way to replay it.
  async reestablish() {
    // Anything that isn't currently running either never finished starting or
    // is on its way down. We can skip these.
    if (this.state !== WATCHER_STATE.RUNNING) return;
    try {
      await this.send('watcher:watch', this.buildWatchParams());
      // We're watching again, but it's still worth surfacing an error to
      // consumers so that they can decide what to do about it. Since we
      // might've lost some events, it's only fair to let the consumer know so
      // they can optionally re-read from disk manually.
      this.onError(new Error('File watcher worker restarted; some events may have been missed.'));
    } catch (error) {
      // Report rather than throw. We're called in a loop, so a throw here
      // would prevent the other instances from recovering.
      this.onError(error);
    }
  }

  // Private: Build the payload for a `watcher:watch` request.
  buildWatchParams() {
    return {
      normalizedPath: this.normalizedPath,
      instance: this.id,
      ignored: this.ignoredNames
    }
  }
}

// A file-watcher implementation that uses `@parcel/watcher`.
//
// We briefly experimented with importing it directly into the renderer
// process, but it caused crashes on window reload for reasons that haven't
// been fully tracked down. That's fine, though; we can run it in its own
// long-running task, much like VS Code does.
class ParcelWatcher extends WorkerProcessWatcher {
  static taskPath = require.resolve('./path-watchers/parcel-watcher-worker.js');
}

// A file-watcher implementation that uses `nsfw`.
//
// This has been the main file-watcher for most of Pulsar's existence, but we
// are moving away from it for a number of reasons. It remains an option,
// however. It used to run in the renderer process, but we've moved it to a
// worker to match the other options, and because it makes it more feasible to
// implement ignored paths.
class NSFWWatcher extends WorkerProcessWatcher {
  static taskPath = require.resolve('./path-watchers/nsfw-watcher-worker.js');
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
      this.nativeWatcherRegistry.attach(this).then(
        () => {
          this.onDidChange(callback);
        },
        // `attach` awaits the normalized path and nothing else, so the only way
        // it rejects is a path we couldn't resolve — which the constructor has
        // already turned into a rejected `startPromise`, where the caller of
        // `watchPath` will see it. There's no second audience for it here (no
        // watcher is ever handed out to subscribe with), so this handler exists
        // only to keep the rejection from going unhandled.
        () => {}
      );
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
        // A native watcher that fails before it ever starts will never emit
        // `did-start`, so anyone awaiting `getStartPromise` — which is every
        // `watchPath` caller — would otherwise wait forever. Rejecting a
        // promise that has already settled is a no-op, so errors after a
        // successful start keep reporting through `did-error` alone.
        this.rejectStartPromise(err);
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
          this.pathStartsWith(this.normalizedPath, watchedPath)
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
    if (!this.pathStartsWith(filePath, this.normalizedPath)) return filePath;
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

  // Private: Whether `candidate` is `base` itself or lies beneath it. A plain
  // `startsWith` also matches a sibling whose name merely begins with `base` —
  // `/foo/barbaz` against `/foo/bar`, or the `thud.js.tmp` an atomic save
  // leaves beside a watched `thud.js`.
  //
  // On Windows the comparison ignores case, because the filesystem does: a
  // watcher rooted at `C:\Users\Someone\project` has to recognize an event
  // reported as `C:\users\someone\project\file.txt` as its own. Every event a
  // shared native watcher delivers is filtered through here, so a spelling we
  // don't recognize isn't an event delivered to the wrong watcher — it's an
  // event silently delivered to nobody.
  //
  // This does not cover 8.3 short names (`RUNNER~1`), which no amount of case
  // folding will reconcile; those would need `fs.realpath.native` on both sides.
  pathStartsWith(candidate, base) {
    if (process.platform === 'win32') {
      candidate = candidate.toLowerCase();
      base = base.toLowerCase();
    }
    return candidate === base || candidate.startsWith(base + path.sep);
  }

  // Private: Invoked when the attached native watcher creates a batch of
  // native filesystem events. The native watcher's events may include events
  // for paths above this watcher's root path, so filter them to only include
  // the relevant ones, then re-broadcast them to our subscribers.
  onNativeEvents(events, callback) {
    const isWatchedPath = eventPath =>
      this.pathStartsWith(eventPath, this.normalizedPath);

    const filtered = [];

    // TEMPORARY diagnostic. Remove with the rest of the Windows investigation.
    //
    // This is the one thing we have never observed. The worker logs what it
    // sends; nothing has ever logged what the renderer receives. So when a spec
    // times out waiting for an event we cannot currently tell "the backend never
    // reported it" from "it arrived and we dropped it here" — and this method,
    // with its path-prefix filter, is where dropping would happen.
    const diagnosing =
      atom?.config?.get('core.fileSystemWatcherLogging') ?? false;
    if (diagnosing) {
      console.log(
        `[pathwatcher] received ${events.length} event(s) for ${this.normalizedPath}:`,
        events.map(e => `${e.action} ${e.path}`).join(' | ')
      );
    }

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.action === 'renamed') {
        if (!event.oldPath) {
          // An adapter reported a rename with no origin. Treat it as a
          // creation at the destination rather than throwing.
          if (isWatchedPath(event.path)) {
            filtered.push(
              this.denormalizeEvent({ ...event, action: 'created' })
            );
          }
          // Anything else is something we don't know how to react to, since we
          // weren't told where this file came from. Ignore it.
          continue;
        }
        const srcWatched = isWatchedPath(event.oldPath);
        const destWatched = isWatchedPath(event.path);

        if (srcWatched && destWatched) {
          filtered.push(this.denormalizeEvent(event));
        } else if (srcWatched && !destWatched) {
          filtered.push(this.denormalizeEvent({
            action: 'deleted',
            path: event.oldPath
          }));
        } else if (!srcWatched && destWatched) {
          filtered.push(this.denormalizeEvent({
            action: 'created',
            path: event.path
          }));
        }
      } else {
        if (isWatchedPath(event.path)) {
          let denormalizedEvent = this.denormalizeEvent(event);
          filtered.push(denormalizedEvent);
        }
      }
    }

    if (diagnosing) {
      const kept = filtered.map(e => `${e.action} ${e.path}`);
      console.log(
        `[pathwatcher] kept ${filtered.length} of ${events.length} for ${this.normalizedPath}` +
          (kept.length ? `: ${kept.join(' | ')}` : ' (all dropped)')
      );
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
      // A change of backend replaces the watcher class, and with it the worker.
      // A change of logging keeps the same worker, which has to be told.
      this.loggingSub = atom.config.onDidChange(
        'core.fileSystemWatcherLogging',
        () => this.activeManager?.updateWatcherLogging()
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
    this.WatcherClass = WatcherClass;
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

  // Private: Pass a change in the logging setting along to this manager's
  // worker, if it has one.
  updateWatcherLogging() {
    this.WatcherClass?.updateLogging?.();
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
// same contract and should behave in similar fashion to one another — but with
// these __caveats__:
//
// 1. Many file-watching libraries do not attempt to detect when files are
//    renamed. This is fair because it's often a heuristic at best. The
//    existence of `renamed` as a possible event action does not imply that it
//    will be used on renames; if it isn't, renames will manifest as separate
//    `deleted` and `created` events.
// 2. Likewise, differences between platforms make it hard to cleanly separate
//    the `created` and `modified` events. For instance: a modification to a
//    file that was very recently created may still manifest as a `created`
//    event because of macOS’s `FSEvents` API and how it accumulates event
//    metadata.
// 3. If a watcher has to restart, it may drop events. As part of the contract,
//    any failure that would cause a restart will guarantee an eventual
//    triggering of callbacks attached via {PathWatcher::onDidError}. It is a
//    good idea to subscribe to that error callback; if it fires, it indicates
//    that some file events could have been missed.
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
    PathWatcherManager.sub.dispose();
    PathWatcherManager.loggingSub?.dispose();
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
  'default': NSFWWatcher,
  'nsfw': NSFWWatcher,
  'parcel': ParcelWatcher
};

module.exports = { watchPath, stopAllWatchers };
