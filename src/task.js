const _ = require('underscore-plus');
const ChildProcess = require('child_process');
const {Emitter} = require('event-kit');
const Grim = require('grim');

// Extended: Run a node script in a separate process.
//
// Used by the fuzzy-finder and [find in project](https://github.com/pulsar-edit/pulsar/blob/master/src/scan-handler.js).
//
// For a real-world example, see the [scan-handler](https://github.com/pulsar-edit/pulsar/blob/master/src/scan-handler.js)
// and the [instantiation of the task](https://github.com/pulsar-edit/pulsar/blob/master/src/project.js).
//
// ## Examples
//
// In your package code:
//
// ```javascript
// const {Task} = require('atom');
//
// let task = Task.once('/path/to/task-file.js', parameter1, parameter2, function() {
//   console.log('task has finished');
// });
//
// task.on('some-event-from-the-task', (data) => {
//   console.log(data.someString); // prints 'yep this is it'
// });
// ```
//
// In `'/path/to/task-file.js'`:
//
// ```javascript
// module.exports = function(parameter1, parameter2) {
//   // Indicates that this task will be async.
//   // Call the `callback` to finish the task
//   const callback = this.async();
//   emit('some-event-from-the-task', {
//     someString: 'yep this is it'
//   });
//   return callback();
// };
// ```
module.exports = class Task {
  // Public: A helper method to easily launch and run a task once.
  //
  // * `taskPath` The {String} path to the CoffeeScript/JavaScript file which
  //   exports a single {Function} to execute.
  // * `args` The arguments to pass to the exported function.

  // Returns the created {Task}.
  static once(taskPath, ...args) {
    const task = new Task(taskPath);
    task.once('task:completed', () => task.terminate());
    task.start(...args);
    return task;
  }

  // Called upon task completion.
  //
  // It receives the same arguments that were passed to the task.
  //
  // If subclassed, this is intended to be overridden. However if {::start}
  // receives a completion callback, this is overridden.
  callback = null;

  // Public: Creates a task. You should probably use {.once}
  //
  // * `taskPath` The {String} path to the CoffeeScript/JavaScript file that
  //   exports a single {Function} to execute.
  constructor(taskPath) {
    this.emitter = new Emitter();
    const compileCachePath = require('./compile-cache').getCacheDirectory();
    taskPath = require.resolve(taskPath);
    const env = Object.assign({}, process.env, {userAgent: navigator.userAgent});
    this.childProcess = ChildProcess.fork(require.resolve('./task-bootstrap'), [compileCachePath, taskPath], { env, silent: true});

    this.on("task:deprecations", (deprecations) => {
      for (let i = 0; i < deprecations.length; i++) {
        Grim.addSerializedDeprecation(deprecations[i]);
      }
    });
    this.on("task:completed", (...args) => {
      if (typeof this.callback === "function") {
        this.callback(...args)
      }
    });
    this.handleEvents();
  }

  // Routes messages from the child to the appropriate event.
  handleEvents() {
    this.childProcess.removeAllListeners();
    this.childProcess.on('message', ({event, args}) => {
      if (this.childProcess != null) {
        this.emitter.emit(event, args);
      }
    });
    // Catch the errors that happened before task-bootstrap.
    if (this.childProcess.stdout != null) {
      this.childProcess.stdout.removeAllListeners();
      this.childProcess.stdout.on('data', (data) => console.log(data.toString()));
    }
    if (this.childProcess.stderr != null) {
      this.childProcess.stderr.removeAllListeners();
      this.childProcess.stderr.on('data', (data) => console.error(data.toString()));
    }
  }

  // Public: Starts the task.
  //
  // Throws an error if this task has already been terminated or if sending a
  // message to the child process fails.
  //
  // * `args` The arguments to pass to the function exported by this task's script.
  // * `callback` (optional) A {Function} to call when the task completes.
  start(...args) {
    const [callback] = args.splice(-1);
    if (this.childProcess == null) {
      throw new Error('Cannot start terminated process');
    }
    this.handleEvents();
    if (_.isFunction(callback)) {
      this.callback = callback;
    } else {
      args.push(callback);
    }
    this.send({event: 'start', args});
    return undefined;
  }

  // Public: Send message to the task.
  //
  // Throws an error if this task has already been terminated or if sending a
  // message to the child process fails.
  //
  // * `message` The message to send to the task.
  send(message) {
    if (this.childProcess != null) {
      this.childProcess.send(message);
    } else {
      throw new Error('Cannot send message to terminated process');
    }
    return undefined;
  }

  // Public: Call a function when an event is emitted by the child process
  //
  // * `eventName` The {String} name of the event to handle.
  // * `callback` The {Function} to call when the event is emitted.
  //
  // Returns a {Disposable} that can be used to stop listening for the event.
  on(eventName, callback) {
    return this.emitter.on(eventName, (args) => callback(...(args || [])));
  }

  once(eventName, callback) {
    var disposable = this.on(eventName, function (...args) {
      disposable.dispose();
      callback(...args);
    });
  }

  // Public: Forcefully stop the running task.

  // No more events are emitted once this method is called.
  terminate() {
    if (this.childProcess == null) {
      return false;
    }
    this.childProcess.removeAllListeners();
    if (this.childProcess.stdout != null) {
      this.childProcess.stdout.removeAllListeners();
    }
    if (this.childProcess.stderr != null) {
      this.childProcess.stderr.removeAllListeners();
    }
    this.childProcess.kill();
    this.childProcess = null;
    return true;
  }

  // Public: Cancel the running task and emit an event if it was canceled.
  //
  // Returns a {Boolean} indicating whether the task was terminated.
  cancel() {
    const didForcefullyTerminate = this.terminate();
    if (didForcefullyTerminate) {
      this.emitter.emit('task:cancelled');
    }
    return didForcefullyTerminate;
  }

};
