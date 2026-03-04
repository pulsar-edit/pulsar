const _ = require('underscore-plus');
const ChildProcess = require('child_process');
const { Emitter } = require('event-kit');

// Private: Like {Task}, but designed for file-watcher processes. Does not
// start automatically; once it starts, it expects to run indefinitely.
class WatcherTask {
  emitter = new Emitter();
  constructor(taskPath) {
    console.log('[PathWatcher] new WatcherTask:', taskPath);
    this.taskPath = taskPath;
  }

  createChildProcess () {
    let compileCachePath = require('./compile-cache').getCacheDirectory();
    let env = Object.assign({}, process.env, {
      userAgent: navigator.userAgent,
      ELECTRON_RUN_AS_NODE: '1',
      ELECTRON_NO_ATTACH_CONSOLE: '1',
      PULSAR_COMPILE_CACHE_PATH: compileCachePath
    });
    if (window.atom?.unloading) {
      this.childProcess = null;
    } else {
      console.log('Creating child process at task path:', this.taskPath);
      this.childProcess = ChildProcess.fork(
        require.resolve('./watcher-task-bootstrap'),
        ['--no-deprecation', this.taskPath],
        { env, silent: true, windowsHide: true }
      );
    }
    this.handleEvents();
  }

  handleEvents () {
    if (!this.childProcess) return;
    this.childProcess.removeAllListeners();
    this.childProcess.on('message', ({ event, args }) => {
      if (!this.childProcess) return;
      this.emitter.emit(event, args);
    });

    const { stdout, stderr } = this.childProcess;

    // Catch the errors that happened before bootstrap.
    if (stdout != null) {
      stdout.removeAllListeners();
      stdout.on('data', data => console.log(data.toString()));
    }

    if (stderr != null) {
      stderr.removeAllListeners();
      stderr.on('data', data => console.error(data.toString()));
    }
  }

  start (...args) {
    console.log('[PathWatcher] Start called for worker with task path:', this.taskPath);
    // Don't spawn any workers during shutdown.
    if (window.atom?.unloading) return;
    const [callback] = args.splice(-1);
    this.createChildProcess();
    if (_.isFunction(callback)) {
      this.callback = callback;
    } else {
      args.push(callback);
    }
    this.send({ event: 'start', args });
    return;
  }

  send (message) {
    console.log('Sending:', message, 'to process with task path:', this.taskPath);
    if (!this.childProcess) {
      return;
      // throw new Error('Cannot send message to terminated process');
    }
    this.childProcess.send(message);
    return;
  }

  on (eventName, callback) {
    return this.emitter.on(eventName, (args) => {
      callback(...(args || []))
    });
  }

  once (eventName, callback) {
    return this.emitter.once(eventName, (args) => {
      callback(...(args || []))
    });
  }

  terminate () {
    if (!this.childProcess) return false;
    this.childProcess.removeAllListeners();
    this.childProcess.stdout?.removeAllListeners();
    this.childProcess.stderr?.removeAllListeners();
    this.childProcess.kill();
    this.childProcess = null;
    return true;
  }

  cancel () {
    let didForcefullyTerminate = this.terminate();
    if (didForcefullyTerminate) {
      this.emitter.emit('task:cancelled');
    }
    return didForcefullyTerminate;
  }
}

module.exports = WatcherTask;
