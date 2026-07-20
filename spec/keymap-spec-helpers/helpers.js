"use strict";

const FakeTimers = require("@sinonjs/fake-timers");
const sinon = require("sinon");

let sinonSandbox, fakeClock, processPlatform, originalProcessPlatform;
let appendedElements = [];

// Capture the real timer at module-load time (before any fake clock is
// installed) so specs that drive the async file-watcher worker can wait real
// wall-clock time even while the sinon fake clock is active.
const realSetTimeout = global.setTimeout;
function realWait(ms) {
  return new Promise((resolve) => realSetTimeout(resolve, ms));
}

originalProcessPlatform = process.platform;
processPlatform = process.platform;

// Register the per-spec setup/teardown. Called from within a spec's `describe`
// so the fake clock and sinon sandbox are scoped to that block rather than the
// whole lumine suite (which auto-loads no helpers of its own).
function installHooks() {
  beforeEach(function () {
    // Re-install the `process.platform` getter each spec. Other lumine specs
    // (buffered-process, clipboard, grammar-registry, menu-manager, …) redefine
    // `process.platform` as a fixed data property and restore it the same way,
    // which clobbers this accessor. Without re-installing it here,
    // `mockProcessPlatform` becomes a no-op whenever one of those specs has run
    // first, so the platform-specific keystroke branches read the real OS.
    processPlatform = originalProcessPlatform;
    Object.defineProperty(process, "platform", {
      get: () => processPlatform,
      configurable: true,
    });
    // Don't wipe `document.body` — lumine's harness owns the test container
    // (`#jasmine-content`). Track our own appended elements and remove them.
    appendedElements = [];
    sinonSandbox = sinon.createSandbox();
    fakeClock = FakeTimers.install();
  });

  afterEach(function () {
    if (fakeClock) {
      fakeClock.uninstall();
      fakeClock = null;
    }
    sinonSandbox.restore();
    // Restore a normal writable/configurable data property so later specs can
    // redefine or plain-assign `process.platform` as they expect.
    Object.defineProperty(process, "platform", {
      value: originalProcessPlatform,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    for (const el of appendedElements) el.remove();
    appendedElements = [];
  });
}

// Switch a spec (or describe) back to real timers. Needed for specs that
// exercise the async file-watcher worker, which runs on real timers and can't
// be driven by the sinon fake clock.
function useRealClock() {
  if (fakeClock) {
    fakeClock.uninstall();
    fakeClock = null;
  }
}

function appendContent(element) {
  document.body.appendChild(element);
  appendedElements.push(element);
  return element;
}

function stub() {
  const [object, method, replacement] = arguments;
  if (object == null) return sinonSandbox.stub();
  const result = sinonSandbox.stub(object, method);
  return replacement ? result.callsFake(replacement) : result;
}

function getFakeClock() {
  return fakeClock;
}

function mockProcessPlatform(platform) {
  processPlatform = platform;
}

function restoreProcessPlatform() {
  processPlatform = originalProcessPlatform;
}

function buildKeydownEvent(props) {
  return buildKeyboardEvent("keydown", props);
}

function buildKeyupEvent(props) {
  return buildKeyboardEvent("keyup", props);
}

function buildKeyboardEvent(type, props) {
  let { key, code, ctrlKey, shiftKey, altKey, metaKey, target, modifierState } = props;
  if (!modifierState) modifierState = {};

  if (process.platform === "darwin") {
    if (modifierState.AltGraph) {
      altKey = true;
    }
  } else if (process.platform === "win32") {
    if (modifierState.AltGraph) {
      ctrlKey = true;
      altKey = true;
    } else if (ctrlKey && altKey) {
      modifierState.AltGraph = true;
    }
  }

  const event = new KeyboardEvent(type, {
    key,
    code,
    ctrlKey,
    shiftKey,
    altKey,
    metaKey,
    cancelable: true,
    bubbles: true,
  });

  if (target) {
    Object.defineProperty(event, "target", { get: () => target });
    Object.defineProperty(event, "path", { get: () => [target] });
  }

  Object.defineProperty(event, "getModifierState", {
    value: (key) => {
      return !!modifierState[key];
    },
  });

  return event;
}

module.exports = {
  installHooks,
  useRealClock,
  realWait,
  appendContent,
  stub,
  getFakeClock,
  mockProcessPlatform,
  restoreProcessPlatform,
  buildKeydownEvent,
  buildKeyupEvent,
};
