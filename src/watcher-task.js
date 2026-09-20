const _ = require('underscore-plus');
const ChildProcess = require('child_process');
const { Emitter } = require('event-kit');

// Private: Like {Task}, but designed for file-watcher processes. Does not
// start automatically; once it starts, it expects to run indefinitely.
class WatcherTask {

  RESTART_WINDOW_MS = 5000;
  MAX_RESTARTS = 5;
  terminated = false;
  restarts = [];

  emitter = new Emitter();
  constructor(taskPath) {
    this.taskPath = taskPath;
  }

  createChildProcess() {
    let compileCachePath = require('./compile-cache').getCacheDirectory();
    let env = Object.assign({}, process.env, {
      userAgent: navigator.userAgent,
      ELECTRON_RUN_AS_NODE: '1',
      ELECTRON_NO_ATTACH_CONSOLE: '1',
      PULSAR_COMPILE_CACHE_PATH: compileCachePath
    });
    if (window.atom?.unloading) {
      // Guard against spurious re-declarations of a `WatcherTask` while the
      // environment is unloading.
      this.childProcess = null;
    } else {
      // Fork the existing process. Electron patches this to automatically pass
      // `ELECTRON_RUN_AS_NODE=1` (or else Node libraries that think they’re
      // in a pure Node environment would be in for a rude awakening), but we
      // set it anyway above just out of paranoia.
      this.childProcess = ChildProcess.fork(
        require.resolve('./watcher-task-bootstrap'),
        ['--no-deprecation', this.taskPath],
        { env, silent: true, windowsHide: true }
      );
    }
    this.handleEvents();
  }

  handleEvents() {
    if (!this.childProcess) return;
    this.childProcess.removeAllListeners();

    let child = this.childProcess;
    const handleDeath = (error, code, signal) => {
      child.removeAllListeners();
      if (this.childProcess !== child) return;
      this.handleUnexpectedExit(error, code, signal);
    };

    child.on('exit', (code, signal) => handleDeath(null, code, signal));
    child.on('error', (error) => handleDeath(error));
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

  start(...args) {
    // Don't spawn any workers during shutdown.
    if (window.atom?.unloading) return;
    this.startArgs = args;
    this.terminated = false;

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

  send(message) {
    this.childProcess?.send(message);
  }

  on(eventName, callback) {
    return this.emitter.on(eventName, (args = []) => {
      callback(...args);
    });
  }

  once(eventName, callback) {
    return this.emitter.once(eventName, (args = []) => {
      callback(...args);
    });
  }

  terminate() {
    if (!this.childProcess) return false;
    this.terminated = true;
    this.childProcess.removeAllListeners();
    this.childProcess.stdout?.removeAllListeners();
    this.childProcess.stderr?.removeAllListeners();
    this.childProcess.kill();
    this.childProcess = null;
    return true;
  }

  cancel() {
    let didForcefullyTerminate = this.terminate();
    if (didForcefullyTerminate) {
      this.emitter.emit('task:cancelled');
    }
    return didForcefullyTerminate;
  }

  handleUnexpectedExit(error, code, signal) {
    this.childProcess = null;
    // `code` could be `0` here; a child process fires `exit` when it exits
    // successfully. But that's not a guarantee that this exit was unexpected!
    // Lots of failure cases exist that would result in the worker task making
    // a clean exit.
    //
    // The true test of whether we expected this exit to happen is whether we
    // explicitly called `terminate` on it. Also, any killed workers during
    // window teardown are similarly expected.
    if (this.terminated || window.atom?.unloading) return;

    let now = Date.now();
    this.restarts = this.restarts.filter(t => now - t < this.RESTART_WINDOW_MS);
    if (this.restarts.length >= this.MAX_RESTARTS) {
      let cause = error ?? new Error(`exited with code ${code} and signal ${signal}`);
      this.emitter.emit('task:failed', [
        new Error(`File watcher worker exited repeatedly. Last failure: ${cause.message}`, { cause })
      ]);
      return;
    }
    this.restarts.push(now);

    this.createChildProcess();
    this.send({ event: 'start', args: this.startArgs });
    this.emitter.emit('task:respawned', []);
  }
}

module.exports = WatcherTask;
