const { Emitter } = require('event-kit');
const { ipcRenderer } = require('electron');

// Used to send messages between different Pulsar windows.
//
// Every Pulsar window is a new instance of a web page at its core. Hence each
// one is isolated and has no easy way to communicate with other windows.
//
// To make this possible, `SignalManager` uses the main process as a broker
// that forwards messages from one window to all windows.
//
// ## Usage
//
// Suppose you need to share data between two windows in a reactive way. For
// instance, if someone changes a value in one window, another Pulsar window
// needs to know about it. You could use `atom.config` for this, but that'd
// result in changes to the user's `config.cson`, which may not be appropriate.
//
// Instead, you can send a signal from one window to all the others:
//
// ```js
// atom.signal.send('my-package', { data: someData });
// ```
//
// By default, all windows _other than_ the window that sent the message will
// receive this message in the `my-package` channel.
//
// If _all_ windows should react to a message, even the window that sent it,
// you can use an `includeSelf` option:
//
// ```js
// atom.signal.send(
//   'my-package',
//   { data: someData },
//   { includeSelf: true }
// );
// ```
//
// To have windows act on that message, you can set up a listener:
//
// ```js
// atom.signal.onMessage('my-package', (message) => {
//   synchronize(message.data);
// });
// ```
//

class SignalManager {
  constructor(storage = window.localStorage) {
    this.clear();
    this.storage = storage;
  }

  clear() {
    this.emitter = new Emitter();
    ipcRenderer.send('signal-register');
    ipcRenderer.on('signal-message-reply', (event, bundle) => {
      console.warn('Received message:', bundle);
      let { channel, message } = bundle;
      this.emitter.emit(`message-${channel}`, message);
      this.emitter.emit('message', bundle);
    });
  }

  destroy() {
    ipcRenderer.removeAllListeners('signal-message-reply');
  }

  // Add a listener for messages on a given channel. If `channel` is `null`,
  // your callback will be called when a message is sent on any channel.
  //
  // * `channel` (optional) {String} name of the channel to listen on, or
  //   `null` to listen on all channels.
  // * `callback` {Function} to call when a message is received on the given
  //   channel. If listening on one channel, argument will be the value sent.
  //   If listening on all channels, argument will be an object with keys
  //   `channel` and `message`.
  onMessage(channel, callback) {
    if (channel) {
      return this.emitter.on(`message-${channel}`, callback);
    } else {
      return this.emitter.on(`message`, callback);
    }
  }

  // Send a message on a given channel.
  //
  // * `channel` {String} name of the channel to send on.
  // * `message` the message to be sent. Can be any serializable value or object.
  // * `options` (optional) {Object}
  //   * `includeSelf` (optional) {Boolean} whether to send the message to the
  //     same window that originated it. Defaults to `false`, in which case
  //     only the non-originating windows receive the message. If `true`, all
  //     windows receive the message.
  send(channel, message, { includeSelf = false } = {}) {
    let bundle = { channel, message, includeSelf };
    ipcRenderer.send('signal-message', bundle);
  }
}

module.exports = SignalManager;
