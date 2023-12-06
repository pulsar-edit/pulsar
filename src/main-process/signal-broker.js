const { ipcMain } = require('electron');

// The easiest way to send a message from the main Electron process to a
// renderer process is via a `WebContents` instance. That instance is sent to
// us as part of the event metadata whenever a renderer process sends a message
// to the main process. So we'll keep track of each of these instances in a
// set. A new window is responsible for sending us a message upon
// initialization so that we can keep track of it.
const instances = new Set;
let initialized = false;

function start() {
  if (initialized) return;

  ipcMain.on('signal-register', (event) => {
    // The first time we hear from a window, we'll add it to our instance list.
    instances.add(event.sender);
  });

  ipcMain.on('signal-message', (event, bundle, { includeSelf = false } = {}) => {
    let { sender } = event;

    for (let instance of instances) {
      if (sender === instance && !includeSelf) continue;
      // We could require instances to unregister themselves when they close,
      // but it's just as easy for us to do a quick check before we send a
      // message. If this instance is stale, we can remove it from the list.
      if (instance?.isDestroyed()) {
        instances.delete(instance);
        continue;
      }

      try {
        instance.send('signal-message-reply', bundle);
      } catch (err) {
        instances.delete(instance);
      }
    }
  });
  initialized = true;
}

function stop() {
  ipcMain.removeHandler('signal-register');
  ipcMain.removeHandler('signal-message');
  initialized = false;
}

module.exports = { start, stop };
