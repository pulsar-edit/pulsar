const { Emitter } = require('atom');
const _ = require('underscore-plus');

// Synchronous throws from callbacks are already sent to `reportError` by
// Pulsar's event-kit hook. Give rejections from `async` callbacks the same
// treatment.
function reportRejection(result) {
  result?.catch?.(reportError);
}

class FileOperations {
  emitter = new Emitter();
  queue = Promise.resolve();

  dispose () {
    this.emitter.dispose();
  }

  onWill (type, callback) {
    return this.emitter.on(`will-${type}`, ({ actions, handle }) => {
      reportRejection(callback(actions, handle));
    });
  }

  onDid (type, callback) {
    return this.emitter.on(`did-${type}`, (actions) => {
      reportRejection(callback(actions));
    });
  }

  // Public: Run a batch of file operations of one type.
  //
  // * `type` {String} one of `create`, `move`, or `delete`.
  // * `actions` An {Array} of action objects as defined by the service, or a
  //   {Function} that returns one (or a promise for one). A function runs
  //   only once earlier operations have finished, so that its planning sees
  //   the filesystem they left behind — e.g., two quick pastes of the same
  //   file pick different names.
  // * `perform` An async {Function} that takes `actions`, does the filesystem
  //   work, and returns the subset that succeeded.
  //
  // Returns a promise for the actions that succeeded.
  run(type, actions, perform) {
    let result = this.queue.then(async () => {
      let resolved = typeof actions === 'function' ? await actions() : actions;
      return this._run(type, resolved, perform);
    });
    // Keep this chain alive even if the operation fails.
    this.queue = result.catch(() => {});
    return result;
  }

  async _run (type, actions, perform) {
    if (actions.length === 0) return [];
    await this._consult(type, actions);
    let succeeded = await perform(actions);
    if (succeeded.length > 0) {
      this.emitter.emit(`did-${type}`, succeeded);
    }
    return succeeded;
  }

  async _consult (type, actions) {
    let controller = new AbortController();
    let pending = [];
    let accepting = true;

    let handle = {
      signal: controller.signal,
      waitUntil (fn) {
        if (!accepting) {
          throw new Error(`waitUntil must be called synchronously within an onWill${_.capitalize(type)} callback`);
        }
        pending.push(
          (async () => fn())().catch(reportError)
        );
        // This function returns nothing. The consumer can check the
        // `AbortSignal` to know if/when the file operation has already
        // happened.
      }
    };

    this.emitter.emit(`will-${type}`, { actions, handle });
    accepting = false;

    if (pending.length === 0) return;

    let budget = atom.config.get('tree-view.fileOperationTimeout') ?? 2000;
    let outcome = 'timeout';
    if (budget > 0) {
      let timer;
      let timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve('timeout'), budget);
      });
      outcome = await Promise.race([
        Promise.all(pending).then(() => 'done'),
        timeout
      ]);
      clearTimeout(timer);
    }
    if (outcome === 'timeout') {
      controller.abort(new DOMException('tree-view stopped waiting', 'TimeoutError'));
    }
  }
}

module.exports = FileOperations;
