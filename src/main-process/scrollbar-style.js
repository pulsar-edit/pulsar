const { EventEmitter } = require('events');
const { Disposable } = require('event-kit');
const { systemPreferences } = require('electron');

// We've written a small Node module to help us get this value from macOS.
//
// We could have each window `require` it directly, but that doesn't get us
// much:
//
// * It's used in only one place — the root workspace element observes this
//   value and reacts by setting a class name on itself.
// * For that reason, community packages don't need to consume it; they can
//   read that same class name.
// * It's a native module — a trivial one, sure, but life is still easier if we
//   try to keep those in the main process absent a compelling reason not to.
// * The renderer can still imperatively get the scrollbar style; it just has
//   to go (briefly) async to do it.
const getScrollbarStyle = require('get-scrollbar-style');

let subscriptionId;
const EMITTER = new EventEmitter();

function observeScrollbarStyle(callback) {
  callback(getScrollbarStyle());
  return onDidChangeScrollbarStyle(callback);
}

function onDidChangeScrollbarStyle(callback) {
  EMITTER.on('did-change-scrollbar-style', callback);
  return new Disposable(() => {
    EMITTER.off('did-change-scrollbar-style', callback);
  });
}

function initialize() {
  // Scrollbar style is a macOS-only thing, so other platforms don't need to
  // bother with it.
  if (process.platform !== 'darwin') return;
  subscriptionId = systemPreferences.subscribeLocalNotification(
    'NSPreferredScrollerStyleDidChangeNotification',
    (event, userInfo, object) => {
      console.log('[scrollbar-style] Metadata:', event, userInfo, object);
      EMITTER.emit(
        'did-change-scrollbar-style',
        valueForNSScrollerStyle(userInfo.NSScrollerStyle)
      );
    }
  );
}

// Turns raw enum values into string equivalents.
function valueForNSScrollerStyle(value) {
  switch (value) {
    case 0:
      return 'legacy';
    case 1:
      return 'overlay';
    default:
      // The native module returns `unknown` for values it doesn't recognize,
      // so we'll do the same. This would only happen if macOS added other
      // scrollbar styles in the future.
      return 'unknown';
  }
}

function destroy() {
  if (subscriptionId) {
    systemPreferences.unsubscribeNotification(subscriptionId);
  }
}

initialize();

module.exports = {
  observeScrollbarStyle,
  onDidChangeScrollbarStyle,
  getScrollbarStyle,
  destroy
};
