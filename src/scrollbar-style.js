const { EventEmitter } = require("events");
const { Disposable } = require("event-kit");
const { systemPreferences } = require("electron");

// Scrollbar style is a macOS-only concern: the "Show scroll bars…" setting in
// System Settings decides whether scrollbars are always visible ("legacy") or
// appear only while scrolling ("overlay").
//
// Each renderer measures the current style itself (see `workspace-element`);
// the main process only watches the system setting so it can broadcast
// changes to every window.

let subscriptionId;
const EMITTER = new EventEmitter();

function onDidChangeScrollbarStyle(callback) {
  EMITTER.on("did-change-scrollbar-style", callback);
  return new Disposable(() => {
    EMITTER.off("did-change-scrollbar-style", callback);
  });
}

function initialize() {
  // Scrollbar style is a macOS-only thing, so other platforms don't need to
  // bother with it.
  if (process.platform !== "darwin") return;
  subscriptionId = systemPreferences.subscribeLocalNotification(
    "NSPreferredScrollerStyleDidChangeNotification",
    (event, userInfo) => {
      EMITTER.emit("did-change-scrollbar-style", valueForNSScrollerStyle(userInfo.NSScrollerStyle));
    },
  );
}

// Turns raw enum values into string equivalents.
function valueForNSScrollerStyle(value) {
  switch (value) {
    case 0:
      return "legacy";
    case 1:
      return "overlay";
    default:
      // This would only happen if macOS added other scrollbar styles in the
      // future.
      return "unknown";
  }
}

function destroy() {
  if (subscriptionId) {
    systemPreferences.unsubscribeNotification(subscriptionId);
  }
}

initialize();

module.exports = {
  onDidChangeScrollbarStyle,
  destroy,
};
