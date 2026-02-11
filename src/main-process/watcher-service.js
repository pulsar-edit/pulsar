const path = require('path');
const { ipcMain, utilityProcess, webContents } = require('electron');

// Main process service that manages @parcel/watcher subscriptions via a
// dedicated UtilityProcess. This provides full crash isolation: if the native
// watcher module segfaults, only the utility process dies — the main process
// and all renderers survive. The service automatically respawns the worker and
// re-establishes all active subscriptions on crash.
//
// Architecture:
//   Renderer ←→ Main Process (this service) ←→ UtilityProcess (watcher-worker.js)
//
class WatcherService {
  constructor() {
    // id → { webContentsId, watchedPath, ignore }
    this.subscriptions = new Map();
    this._handlersRegistered = false;
    this._worker = null;
    this._workerReady = null;
    this._pendingRequests = new Map();
    this._disposing = false;
  }

  // Register IPC handlers and spawn the watcher worker process.
  // Call once during application initialization (after app.ready).
  initialize() {
    if (this._handlersRegistered) return;

    this._spawnWorker();

    ipcMain.handle('watcher:subscribe', (event, { id, path: watchPath, options }) =>
      this._subscribe(event.sender, id, watchPath, options)
    );

    ipcMain.handle('watcher:unsubscribe', (event, { id }) =>
      this._unsubscribe(id)
    );

    ipcMain.handle('watcher:update', (event, { id, options }) =>
      this._update(id, options)
    );

    this._handlersRegistered = true;
  }

  // Spawn the UtilityProcess that runs @parcel/watcher. Sets up message
  // handling and crash recovery. Returns (via this._workerReady) a promise
  // that resolves once the worker signals it's ready.
  _spawnWorker() {
    const workerPath = path.join(__dirname, 'watcher-worker.js');
    let resolved = false;

    this._workerReady = new Promise((resolve, reject) => {
      this._worker = utilityProcess.fork(workerPath, [], {
        serviceName: 'pulsar-file-watcher'
      });

      this._worker.on('message', (msg) => {
        if (msg.type === 'ready') {
          resolved = true;
          resolve();
        } else {
          this._handleWorkerMessage(msg);
        }
      });

      this._worker.on('exit', (code) => {
        if (!resolved) {
          reject(new Error(`Watcher worker exited before ready (code ${code})`));
        }
        this._handleWorkerExit(code);
      });
    });
  }

  // Route messages from the worker process to the appropriate handler.
  _handleWorkerMessage(msg) {
    switch (msg.type) {
      case 'subscribed': {
        const pending = this._pendingRequests.get(msg.id);
        if (pending) {
          this._pendingRequests.delete(msg.id);
          pending.resolve();
        }
        break;
      }
      case 'subscribe-error': {
        const pending = this._pendingRequests.get(msg.id);
        if (pending) {
          this._pendingRequests.delete(msg.id);
          pending.reject(new Error(msg.error));
        }
        break;
      }
      case 'events': {
        const record = this.subscriptions.get(msg.id);
        if (record) {
          this._sendEvents(record.webContentsId, msg.id, msg.events);
        }
        break;
      }
      case 'error': {
        const record = this.subscriptions.get(msg.id);
        if (record) {
          this._sendError(record.webContentsId, msg.id, msg.error);
        }
        break;
      }
    }
  }

  // Handle unexpected worker exit. Reject in-flight requests, then respawn
  // and re-establish all active subscriptions.
  _handleWorkerExit(code) {
    if (this._disposing) return;

    // Reject all pending subscribe requests — callers will see an error.
    for (const [key, { reject }] of this._pendingRequests) {
      reject(new Error(`Watcher process exited unexpectedly (code ${code})`));
    }
    this._pendingRequests.clear();

    // Always respawn so the worker is available for future subscriptions.
    // If there are active subscriptions, re-establish them after respawn.
    this._spawnWorker();
    if (this.subscriptions.size > 0) {
      this._workerReady.then(() => {
        for (const [id, record] of this.subscriptions) {
          try {
            this._worker.postMessage({
              type: 'subscribe',
              id,
              path: record.watchedPath,
              options: { ignore: record.ignore || [] }
            });
          } catch (e) {
            // Worker may have died again during re-subscribe.
          }
        }
      });
    }
  }

  // Subscribe to filesystem events for a path. The actual watching is done
  // by @parcel/watcher in the utility process.
  async _subscribe(sender, id, watchPath, options = {}) {
    const webContentsId = sender.id;

    this.subscriptions.set(id, {
      webContentsId,
      watchedPath: watchPath,
      ignore: options.ignore
    });

    await this._workerReady;

    return new Promise((resolve, reject) => {
      this._pendingRequests.set(id, { resolve, reject });
      try {
        this._worker.postMessage({
          type: 'subscribe',
          id,
          path: watchPath,
          options
        });
      } catch (e) {
        this._pendingRequests.delete(id);
        this.subscriptions.delete(id);
        reject(e);
      }
    });
  }

  // Unsubscribe a watcher by ID. Fire-and-forget to the worker — the renderer
  // gets an immediate response.
  _unsubscribe(id) {
    this.subscriptions.delete(id);
    try {
      if (this._worker) {
        this._worker.postMessage({ type: 'unsubscribe', id });
      }
    } catch (e) {
      // Worker may have died — subscription is already gone from our map.
    }
  }

  // Update ignore patterns for an existing watcher.
  async _update(id, options = {}) {
    const record = this.subscriptions.get(id);
    if (!record) return;

    record.ignore = options.ignore;

    await this._workerReady;
    try {
      this._worker.postMessage({ type: 'update', id, options });
    } catch (e) {
      // Worker may have died — will be re-subscribed on respawn.
    }
  }

  // Clean up all subscriptions belonging to a specific webContents (identified
  // by its ID). Called when a window closes or reloads.
  cleanupForWebContents(webContentsId) {
    for (const [id, record] of this.subscriptions) {
      if (record.webContentsId === webContentsId) {
        this._unsubscribe(id);
      }
    }
  }

  // Kill the worker and remove IPC handlers. Called on app quit.
  async dispose() {
    this._disposing = true;

    this.subscriptions.clear();

    // Reject any pending requests.
    for (const [key, { reject }] of this._pendingRequests) {
      reject(new Error('WatcherService is disposing'));
    }
    this._pendingRequests.clear();

    if (this._worker) {
      this._worker.kill();
      this._worker = null;
    }

    if (this._handlersRegistered) {
      ipcMain.removeHandler('watcher:subscribe');
      ipcMain.removeHandler('watcher:unsubscribe');
      ipcMain.removeHandler('watcher:update');
      this._handlersRegistered = false;
    }
  }

  // Send filesystem events to the renderer that owns the subscription.
  _sendEvents(webContentsId, id, events) {
    try {
      const sender = this._getWebContents(webContentsId);
      if (sender) {
        sender.send('watcher:events', { id, events });
      }
    } catch (e) {
      // webContents may have been destroyed.
    }
  }

  // Send an error to the renderer that owns the subscription.
  _sendError(webContentsId, id, error) {
    try {
      const sender = this._getWebContents(webContentsId);
      if (sender) {
        sender.send('watcher:error', { id, error });
      }
    } catch (e) {
      // webContents may have been destroyed.
    }
  }

  // Retrieve a webContents by ID, returning null if it's been destroyed.
  _getWebContents(webContentsId) {
    const wc = webContents.fromId(webContentsId);
    return wc && !wc.isDestroyed() ? wc : null;
  }
}

module.exports = WatcherService;
