var $$,
  KeyboardLayout,
  KeymapManager,
  appendContent,
  buildKeydownEvent,
  buildKeyupEvent,
  fs,
  getFakeClock,
  mockProcessPlatform,
  nativeFs,
  os,
  path,
  restoreProcessPlatform,
  stub,
  temp;

({ $$ } = require("space-pencil"));

fs = require("@lumine-code/fs-plus");

nativeFs = require("fs");

os = require("os");

path = require("path");

temp = {
  mkdirSync: function (prefix) {
    return nativeFs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  },
};

KeyboardLayout = require("@lumine-code/keyboard-layout");

KeymapManager = require("../src/keymap-manager");

({
  appendContent,
  stub,
  getFakeClock,
  mockProcessPlatform,
  restoreProcessPlatform,
  buildKeydownEvent,
  buildKeyupEvent,
} = require("./keymap-spec-helpers/helpers"));
const { installHooks, useRealClock, realWait } = require("./keymap-spec-helpers/helpers");
const assert = require("./keymap-spec-helpers/assert");

describe("KeymapManager", function () {
  installHooks();
  var keymapManager;
  keymapManager = null;
  beforeEach(function () {
    mockProcessPlatform("darwin");
    return (keymapManager = new KeymapManager());
  });
  afterEach(function () {
    return keymapManager.destroy();
  });
  describe("::handleKeyboardEvent(event)", function () {
    describe("when the keystroke matches no bindings", function () {
      return it("does not prevent the event's default action", function () {
        var event;
        event = buildKeydownEvent({
          key: "q",
        });
        keymapManager.handleKeyboardEvent(event);
        return assert(!event.defaultPrevented);
      });
    });
    describe("when the keystroke matches one binding on any particular element", function () {
      var elementA, elementB, events;
      [events, elementA, elementB] = [];
      beforeEach(function () {
        elementA = appendContent(
          $$(function () {
            return this.div(
              {
                class: "a",
              },
              function () {
                return this.div({
                  class: "b c",
                });
              },
            );
          }),
        );
        elementB = elementA.firstChild;
        events = [];
        elementA.addEventListener("x-command", function (e) {
          return events.push(e);
        });
        elementA.addEventListener("y-command", function (e) {
          return events.push(e);
        });
        return keymapManager.add("test", {
          ".a": {
            "ctrl-x": "x-command",
            "ctrl-y": "y-command",
          },
          ".c": {
            "ctrl-y": "z-command",
          },
          ".b": {
            "ctrl-y": "y-command",
          },
        });
      });
      it("dispatches the matching binding's command event on the keyboard event's target", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementB,
          }),
        );
        assert.equal(events.length, 1);
        assert.equal(events[0].type, "y-command");
        assert.equal(events[0].target, elementB);
        events = [];
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "x",
            ctrlKey: true,
            target: elementB,
          }),
        );
        assert.equal(events.length, 1);
        assert.equal(events[0].type, "x-command");
        return assert.equal(events[0].target, elementB);
      });
      it("prevents the default action", function () {
        var event;
        event = buildKeydownEvent({
          key: "y",
          ctrlKey: true,
          target: elementB,
        });
        keymapManager.handleKeyboardEvent(event);
        return assert(event.defaultPrevented);
      });
      describe("if .abortKeyBinding() is called on the command event", function () {
        return it("proceeds directly to the next matching binding and does not prevent the keyboard event's default action", function () {
          var event;
          elementB.addEventListener("y-command", function (e) {
            events.push(e);
            return e.abortKeyBinding();
          });
          elementB.addEventListener("y-command", function (e) {
            return events.push(e); // should never be called
          });
          elementB.addEventListener("z-command", function (e) {
            events.push(e);
            return e.abortKeyBinding();
          });
          event = buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementB,
          });
          keymapManager.handleKeyboardEvent(event);
          assert(!event.defaultPrevented);
          assert.equal(events.length, 3);
          assert.equal(events[0].type, "y-command");
          assert.equal(events[0].target, elementB);
          assert.equal(events[1].type, "z-command");
          assert.equal(events[1].target, elementB);
          assert.equal(events[2].type, "y-command");
          return assert.equal(events[2].target, elementB);
        });
      });
      describe("if the keyboard event's target is document.body", function () {
        return it("starts matching keybindings at the .defaultTarget", function () {
          keymapManager.defaultTarget = elementA;
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "y",
              ctrlKey: true,
              target: document.body,
            }),
          );
          assert.equal(events.length, 1);
          assert.equal(events[0].type, "y-command");
          return assert.equal(events[0].target, elementA);
        });
      });
      describe("if the matching binding's command is 'native!'", function () {
        return it("terminates without preventing the browser's default action", function () {
          var event;
          elementA.addEventListener("native!", function (e) {
            return events.push(e);
          });
          keymapManager.add("test", {
            ".b": {
              "ctrl-y": "native!",
            },
          });
          event = buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementB,
          });
          keymapManager.handleKeyboardEvent(event);
          assert.deepEqual(events, []);
          return assert(!event.defaultPrevented);
        });
      });
      describe("if the matching binding's command is 'unset!'", function () {
        return it("continues searching for a matching binding on the parent element", function () {
          var event;
          elementA.addEventListener("unset!", function (e) {
            return events.push(e);
          });
          keymapManager.add("test", {
            ".a": {
              "ctrl-y": "x-command",
            },
            ".b": {
              "ctrl-y": "unset!",
            },
          });
          event = buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementB,
          });
          keymapManager.handleKeyboardEvent(event);
          assert.equal(events.length, 1);
          assert.equal(events[0].type, "x-command");
          return assert.equal(event.defaultPrevented, true);
        });
      });
      describe("if the matching binding's command is 'unset!' and there is another match", function () {
        return it("immediately matches the other match", function () {
          var event;
          elementA.addEventListener("unset!", function (e) {
            return events.push(e);
          });
          keymapManager.add("test", {
            ".a": {
              "ctrl-y": "x-command",
              "ctrl-y ctrl-y": "unset!",
            },
          });
          event = buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          });
          keymapManager.handleKeyboardEvent(event);
          assert.equal(events.length, 1);
          return assert.equal(events[0].type, "x-command");
        });
      });
      return describe("if the matching binding's command is 'abort!'", function () {
        return it("stops searching for a matching binding immediately and emits no command event", function () {
          var event;
          elementA.addEventListener("abort!", function (e) {
            return events.push(e);
          });
          keymapManager.add("test", {
            ".a": {
              "ctrl-y": "y-command",
              "ctrl-x": "x-command",
            },
            ".b": {
              "ctrl-y": "abort!",
            },
          });
          event = buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementB,
          });
          keymapManager.handleKeyboardEvent(event);
          assert.equal(events.length, 0);
          assert(event.defaultPrevented);
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "x",
              ctrlKey: true,
              target: elementB,
            }),
          );
          return assert.equal(events.length, 1);
        });
      });
    });
    describe("when the keystroke matches multiple bindings on the same element", function () {
      var elementA, elementB, events;
      [elementA, elementB, events] = [];
      beforeEach(function () {
        elementA = appendContent(
          $$(function () {
            return this.div(
              {
                class: "a",
              },
              function () {
                return this.div({
                  class: "b c d",
                });
              },
            );
          }),
        );
        elementB = elementA.firstChild;
        events = [];
        elementA.addEventListener(
          "command-1",
          function (e) {
            return events.push(e);
          },
          false,
        );
        elementA.addEventListener(
          "command-2",
          function (e) {
            return events.push(e);
          },
          false,
        );
        return elementA.addEventListener(
          "command-3",
          function (e) {
            return events.push(e);
          },
          false,
        );
      });
      describe("when the bindings have the same priority", function () {
        describe("when the bindings have selectors with different specificity", function () {
          beforeEach(function () {
            return keymapManager.add("test", {
              ".b.c": {
                "ctrl-x": "command-1",
              },
              ".b": {
                "ctrl-x": "command-2",
              },
            });
          });
          return it("dispatches the command associated with the most specific binding", function () {
            keymapManager.handleKeyboardEvent(
              buildKeydownEvent({
                key: "x",
                ctrlKey: true,
                target: elementB,
              }),
            );
            assert.equal(events.length, 1);
            assert.equal(events[0].type, "command-1");
            return assert.equal(events[0].target, elementB);
          });
        });
        return describe("when the bindings have selectors with the same specificity", function () {
          return it("dispatches the command associated with the most recently added binding", function () {
            keymapManager.add("test", {
              ".b.c": {
                "ctrl-x": "command-1",
              },
              ".c.d": {
                "ctrl-x": "command-2",
              },
            });
            keymapManager.handleKeyboardEvent(
              buildKeydownEvent({
                key: "x",
                ctrlKey: true,
                target: elementB,
              }),
            );
            assert.equal(events.length, 1);
            assert.equal(events[0].type, "command-2");
            return assert.equal(events[0].target, elementB);
          });
        });
      });
      return describe("when bindings have different priorities", function () {
        return it("dispatches the command associated with the binding which has the highest priority", function () {
          keymapManager.add(
            "keybindings-with-super-priority",
            {
              ".c": {
                "ctrl-x": "command-1",
              },
            },
            2,
          );
          keymapManager.add(
            "keybindings-with-priority",
            {
              ".b.c.d": {
                "ctrl-x": "command-2",
              },
            },
            1,
          );
          keymapManager.add(
            "normal-keybindings",
            {
              ".b.c.d": {
                "ctrl-x": "command-3",
              },
            },
            0,
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "x",
              ctrlKey: true,
              target: elementB,
            }),
          );
          assert.equal(events.length, 1);
          assert.equal(events[0].type, "command-1");
          return assert.equal(events[0].target, elementB);
        });
      });
    });
    describe("when the keystroke partially matches bindings", function () {
      var editor, events, workspace;
      [workspace, editor, events] = [];
      beforeEach(function () {
        workspace = appendContent(
          $$(function () {
            return this.div(
              {
                class: "workspace",
              },
              function () {
                return this.div({
                  class: "editor",
                });
              },
            );
          }),
        );
        editor = workspace.firstChild;
        keymapManager.add("test", {
          ".workspace": {
            "d o g": "dog",
            "d p": "dp",
            "v i v a": "viva!",
            "v i v": "viv",
            "shift shift-S x": "shift-then-s",
          },
          ".editor": {
            v: "enter-visual-mode",
          },
          ".editor.visual-mode": {
            "i w": "select-inside-word",
          },
        });
        events = [];
        editor.addEventListener("textInput", function (event) {
          return events.push(`input:${event.data}`);
        });
        workspace.addEventListener("dog", function () {
          return events.push("dog");
        });
        workspace.addEventListener("dp", function () {
          return events.push("dp");
        });
        workspace.addEventListener("viva!", function () {
          return events.push("viva!");
        });
        workspace.addEventListener("viv", function () {
          return events.push("viv");
        });
        workspace.addEventListener("select-inside-word", function () {
          return events.push("select-inside-word");
        });
        return workspace.addEventListener("enter-visual-mode", function () {
          events.push("enter-visual-mode");
          return editor.classList.add("visual-mode");
        });
      });
      describe("when subsequent keystrokes yield an exact match", function () {
        return it("dispatches the command associated with the matched multi-keystroke binding", function () {
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "i",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "i",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "a",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "a",
              target: editor,
            }),
          );
          return assert.deepEqual(events, ["viva!"]);
        });
      });
      describe("when subsequent keystrokes yield no matches", function () {
        it("disables the bindings with the longest keystroke sequences and replays the queued keystrokes", function () {
          var iEvent, kEvent, vEvent, wEvent;
          keymapManager.handleKeyboardEvent(
            (vEvent = buildKeydownEvent({
              key: "v",
              target: editor,
            })),
          );
          keymapManager.handleKeyboardEvent(
            (iEvent = buildKeydownEvent({
              key: "i",
              target: editor,
            })),
          );
          keymapManager.handleKeyboardEvent(
            (wEvent = buildKeydownEvent({
              key: "w",
              target: editor,
            })),
          );
          assert.equal(vEvent.defaultPrevented, true);
          assert.equal(iEvent.defaultPrevented, true);
          assert.equal(wEvent.defaultPrevented, true);
          assert.deepEqual(events, ["enter-visual-mode", "select-inside-word"]);
          events = [];
          keymapManager.handleKeyboardEvent(
            (vEvent = buildKeydownEvent({
              key: "v",
              target: editor,
            })),
          );
          keymapManager.handleKeyboardEvent(
            (iEvent = buildKeydownEvent({
              key: "i",
              target: editor,
            })),
          );
          keymapManager.handleKeyboardEvent(
            (kEvent = buildKeydownEvent({
              key: "k",
              target: editor,
            })),
          );
          assert.equal(vEvent.defaultPrevented, true);
          assert.equal(iEvent.defaultPrevented, true);
          assert.equal(kEvent.defaultPrevented, false);
          return assert.deepEqual(events, ["enter-visual-mode", "input:i"]);
        });
        // FIXME
        // expect(clearTimeout).toHaveBeenCalled()
        return it("dispatches a text-input event for any replayed keyboard events that would have inserted characters", function () {
          var lastEvent;
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "d",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "o",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            (lastEvent = buildKeydownEvent({
              key: "q",
              target: editor,
            })),
          );
          assert.deepEqual(events, ["input:d", "input:o"]);
          assert(!lastEvent.defaultPrevented);
          events = [];
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "Shift",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "S",
              target: editor,
              shiftKey: true,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "y",
              target: editor,
            }),
          );
          return assert.deepEqual(events, ["input:S"]);
        });
      });
      describe("when the currently queued keystrokes exactly match at least one binding", function () {
        it("disables partially-matching bindings and replays the queued keystrokes if the ::partialMatchTimeout expires", function () {
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "v",
              target: editor,
            }),
          );
          assert.deepEqual(events, []);
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          assert.deepEqual(events, ["enter-visual-mode"]);
          events = [];
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "i",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "i",
              target: editor,
            }),
          );
          assert.deepEqual(events, []);
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          assert.deepEqual(events, ["enter-visual-mode", "input:i"]);
          events = [];
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "v",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "i",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeyupEvent({
              key: "i",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "v",
              target: editor,
            }),
          );
          assert.deepEqual(events, []);
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          return assert.deepEqual(events, ["viv"]);
        });
        it("disables partially-matching bindings and replays the queued keystrokes if the ::partialMatchTimeout expires, even when the exact match contains the control or meta key", function () {
          keymapManager.add("test", {
            ".workspace": {
              "ctrl-d o g": "control-dog",
              "ctrl-d": "control-d",
            },
          });
          workspace.addEventListener("control-dog", function () {
            return events.push("control-dog");
          });
          workspace.addEventListener("control-d", function () {
            return events.push("control-d");
          });
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "d",
              ctrlKey: true,
              target: editor,
            }),
          );
          assert.deepEqual(events, []);
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          assert.deepEqual(events, ["control-d"]);
          // Also make sure we canceled the arpeggio.
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "o",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "g",
              target: editor,
            }),
          );
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          assert.deepEqual(events, ["control-d"]);
          // Alright, now let's just double check with meta instead of control.
          events = [];
          keymapManager.add("test", {
            ".workspace": {
              "cmd-d o g": "meta-dog",
              "cmd-d": "meta-d",
            },
          });
          workspace.addEventListener("meta-dog", function () {
            return events.push("meta-dog");
          });
          workspace.addEventListener("meta-d", function () {
            return events.push("meta-d");
          });
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "d",
              metaKey: true,
              target: editor,
            }),
          );
          assert.deepEqual(events, []);
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          assert.deepEqual(events, ["meta-d"]);
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "o",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "g",
              target: editor,
            }),
          );
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          return assert.deepEqual(events, ["meta-d"]);
        });
        return it("does not enter a pending state or prevent the default action if the matching binding's command is 'native!'", function () {
          var event;
          keymapManager.add("test", {
            ".workspace": {
              v: "native!",
            },
          });
          event = buildKeydownEvent({
            key: "v",
            target: editor,
          });
          keymapManager.handleKeyboardEvent(event);
          assert(!event.defaultPrevented);
          getFakeClock().next();
          return assert.equal(keymapManager.queuedKeyboardEvents.length, 0);
        });
      });
      describe("when the first queued keystroke corresponds to a character insertion", function () {
        return it("disables partially-matching bindings and replays the queued keystrokes if the ::partialMatchTimeout expires", function () {
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "d",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "o",
              target: editor,
            }),
          );
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          return assert.deepEqual(events, ["input:d", "input:o"]);
        });
      });
      describe("when the currently queued keystrokes don't exactly match any bindings", function () {
        return it("never times out of the pending state", function () {
          keymapManager.add("test", {
            ".workspace": {
              "ctrl-d o g": "control-dog",
            },
          });
          workspace.addEventListener("control-dog", function () {
            return events.push("control-dog");
          });
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "d",
              ctrlKey: true,
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "o",
              target: editor,
            }),
          );
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          getFakeClock().tick(keymapManager.getPartialMatchTimeout());
          assert.deepEqual(events, []);
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "g",
              target: editor,
            }),
          );
          return assert.deepEqual(events, ["control-dog"]);
        });
      });
      describe("when the partially matching bindings all map to the 'unset!' directive", function () {
        return it("ignores the 'unset!' bindings and invokes the command associated with the matching binding as normal", function () {
          keymapManager.add("test-2", {
            ".workspace": {
              "v i v a": "unset!",
              "v i v": "unset!",
            },
          });
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "v",
              target: editor,
            }),
          );
          return assert.deepEqual(events, ["enter-visual-mode"]);
        });
      });
      return describe("when a subsequent keystroke begins a new match of an already pending binding", function () {
        return it("recognizes the match", function () {
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "d",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "o",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "d",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "o",
              target: editor,
            }),
          );
          keymapManager.handleKeyboardEvent(
            buildKeydownEvent({
              key: "g",
              target: editor,
            }),
          );
          return assert.deepEqual(events, ["input:d", "input:o", "dog"]);
        });
      });
    });
    describe("when the binding specifies a keyup handler", function () {
      var elementA, events;
      [events, elementA] = [];
      beforeEach(function () {
        elementA = appendContent(
          $$(function () {
            return this.div({
              class: "a",
            });
          }),
        );
        events = [];
        elementA.addEventListener("y-command", function (_e) {
          return events.push("y-keydown");
        });
        elementA.addEventListener("y-command-ctrl-up", function (_e) {
          return events.push("y-ctrl-keyup");
        });
        elementA.addEventListener("x-command-ctrl-up", function (_e) {
          return events.push("x-ctrl-keyup");
        });
        elementA.addEventListener("y-command-y-up-ctrl-up", function (_e) {
          return events.push("y-up-ctrl-keyup");
        });
        elementA.addEventListener("abc-secret-code-command", function (_e) {
          return events.push("abc-secret-code");
        });
        elementA.addEventListener("z-command-d-e-f", function (_e) {
          return events.push("z-keydown-d-e-f");
        });
        return keymapManager.add("test", {
          ".a": {
            "ctrl-y": "y-command",
            "ctrl-y ^ctrl": "y-command-ctrl-up",
            "ctrl-x ^ctrl": "x-command-ctrl-up",
            "ctrl-y ^y ^ctrl": "y-command-y-up-ctrl-up",
            "a b c ^b ^a ^c": "abc-secret-code-command",
            "ctrl-z d e f": "z-command-d-e-f",
          },
        });
      });
      it("dispatches the command for a binding containing only keydown events immediately even when there is a corresponding multi-stroke binding that contains only other keyup events", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        return assert.deepEqual(events, ["y-keydown"]);
      });
      it("dispatches the command when a matching keystroke precedes it", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "y",
            ctrlKey: true,
            metaKey: true,
            shiftKey: true,
            altKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "Control",
            target: elementA,
          }),
        );
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        return assert.deepEqual(events, ["y-keydown", "y-up-ctrl-keyup"]);
      });
      it("dispatches the command when the keyup comes after the partial match timeout", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "y",
            ctrlKey: true,
            cmd: true,
            shift: true,
            alt: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "ctrl",
            target: elementA,
          }),
        );
        return assert.deepEqual(events, ["y-keydown", "y-up-ctrl-keyup"]);
      });
      it("dispatches the command multiple times when multiple keydown events for the binding come in before the binding with a keyup handler", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown", "y-keydown"]);
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        return assert.deepEqual(events, ["y-keydown", "y-keydown"]);
      });
      it("dispatches the command when the modifier is lifted before the character", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "Control",
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown", "y-ctrl-keyup"]);
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        return assert.deepEqual(events, ["y-keydown", "y-ctrl-keyup"]);
      });
      it("dispatches the command when extra user-generated keyup events are not specified in the binding", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "x",
            ctrlKey: true,
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "x",
            ctrlKey: true,
            target: elementA, // not specified in binding
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "Control",
            target: elementA,
          }),
        );
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        return assert.deepEqual(events, ["x-ctrl-keyup"]);
      });
      it("dispatches the command when extra user-generated keydown events not specified in the binding occur between keydown and keyup", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "y",
            ctrlKey: true,
            target: elementA,
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "j",
            ctrlKey: true,
            target: elementA, // not specified in binding
          }),
        );
        assert.deepEqual(events, ["y-keydown"]);
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "Control",
            target: elementA,
          }),
        );
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        return assert.deepEqual(events, ["y-keydown", "y-ctrl-keyup"]);
      });
      it("does _not_ dispatch the command when extra user-generated keydown events not specified in the binding occur between keydowns", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent("z", {
            ctrl: true,
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent("ctrl", {
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent("ctrl", {
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent("z", {
            target: elementA, // not specified in binding
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent("d", {
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent("e", {
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent("f", {
            target: elementA,
          }),
        );
        return assert.deepEqual(events, []);
      });
      return it("dispatches the command when multiple keyup keystrokes are specified", function () {
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "a",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "b",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "c",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "a",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "b",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "c",
            target: elementA,
          }),
        );
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        assert.deepEqual(events, []);
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "a",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "b",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeydownEvent({
            key: "c",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "b",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "a",
            target: elementA,
          }),
        );
        keymapManager.handleKeyboardEvent(
          buildKeyupEvent({
            key: "c",
            target: elementA,
          }),
        );
        getFakeClock().tick(keymapManager.getPartialMatchTimeout());
        return assert.deepEqual(events, ["abc-secret-code"]);
      });
    });
    it("only counts entire keystrokes when checking for partial matches", function () {
      var element, events;
      element = $$(function () {
        return this.div({
          class: "a",
        });
      });
      keymapManager.add("test", {
        ".a": {
          "ctrl-alt-a": "command-a",
          "ctrl-a": "command-b",
        },
      });
      events = [];
      element.addEventListener("command-a", function () {
        return events.push("command-a");
      });
      element.addEventListener("command-b", function () {
        return events.push("command-b");
      });
      // Should *only* match ctrl-a, not ctrl-alt-a (can't just use a textual prefix match)
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "a",
          ctrlKey: true,
          target: element,
        }),
      );
      return assert.deepEqual(events, ["command-b"]);
    });
    it("does not enqueue keydown events consisting only of modifier keys", function () {
      var element, events;
      element = $$(function () {
        return this.div({
          class: "a",
        });
      });
      keymapManager.add("test", {
        ".a": {
          "ctrl-a ctrl-alt-b": "command",
        },
      });
      events = [];
      element.addEventListener("command", function () {
        return events.push("command");
      });
      // Simulate keydown events for the modifier key being pressed on its own
      // prior to the key it is modifying.
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "Control",
          ctrlKey: true,
          target: element,
        }),
      );
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "a",
          ctrlKey: true,
          target: element,
        }),
      );
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "Control",
          ctrlKey: true,
          target: element,
        }),
      );
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "Alt",
          ctrlKey: true,
          target: element,
        }),
      );
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "b",
          ctrlKey: true,
          altKey: true,
          target: element,
        }),
      );
      return assert.deepEqual(events, ["command"]);
    });
    it("allows solo modifier-keys to be bound", function () {
      var element, events;
      element = $$(function () {
        return this.div({
          class: "a",
        });
      });
      keymapManager.add("test", {
        ".a": {
          ctrl: "command",
        },
      });
      events = [];
      element.addEventListener("command", function () {
        return events.push("command");
      });
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "Control",
          target: element,
        }),
      );
      return assert.deepEqual(events, ["command"]);
    });
    return it("simulates bubbling if the target is detached", function () {
      var elementA, elementB, elementC, events;
      elementA = $$(function () {
        return this.div(
          {
            class: "a",
          },
          function () {
            return this.div(
              {
                class: "b",
              },
              function () {
                return this.div({
                  class: "c",
                });
              },
            );
          },
        );
      });
      elementB = elementA.firstChild;
      elementC = elementB.firstChild;
      keymapManager.add("test", {
        ".c": {
          x: "command",
        },
      });
      events = [];
      elementA.addEventListener("command", function () {
        return events.push("a");
      });
      elementB.addEventListener("command", function (e) {
        events.push("b1");
        return e.stopImmediatePropagation();
      });
      elementB.addEventListener("command", function (e) {
        events.push("b2");
        assert.equal(e.target, elementC);
        return assert.equal(e.currentTarget, elementB);
      });
      elementC.addEventListener("command", function (e) {
        events.push("c");
        assert.equal(e.target, elementC);
        return assert.equal(e.currentTarget, elementC);
      });
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "x",
          target: elementC,
        }),
      );
      return assert.deepEqual(events, ["c", "b1"]);
    });
  });
  describe("::build(source, bindings)", function () {
    it("normalizes keystrokes containing capitalized alphabetic characters", function () {
      var commandA, commandB, commandC;
      commandA = keymapManager.build("test", {
        "*": {
          "ctrl-shift-l": "a",
        },
      });
      commandB = keymapManager.build("test", {
        "*": {
          "ctrl-shift-L": "b",
        },
      });
      commandC = keymapManager.build("test", {
        "*": {
          "ctrl-L": "c",
        },
      });
      assert.equal(commandA[0].keystrokes, "ctrl-shift-L");
      assert.equal(commandB[0].keystrokes, "ctrl-shift-L");
      return assert.equal(commandC[0].keystrokes, "ctrl-shift-L");
    });
    it("normalizes the order of modifier keys based on the Apple interface guidelines", function () {
      var commandA, commandB, commandC, commandD;
      commandA = keymapManager.build("test", {
        "*": {
          "alt-cmd-ctrl-shift-l": "a",
        },
      });
      commandB = keymapManager.build("test", {
        "*": {
          "shift-ctrl-l": "b",
        },
      });
      commandC = keymapManager.build("test", {
        "*": {
          "alt-ctrl-l": "c",
        },
      });
      commandD = keymapManager.build("test", {
        "*": {
          "ctrl-alt--": "d",
        },
      });
      assert.equal(commandA[0].keystrokes, "ctrl-alt-shift-cmd-L");
      assert.equal(commandB[0].keystrokes, "ctrl-shift-L");
      assert.equal(commandC[0].keystrokes, "ctrl-alt-l");
      return assert.equal(commandD[0].keystrokes, "ctrl-alt--");
    });
    it("rejects bindings with unknown modifier keys and logs a warning to the console", function () {
      var commandA;
      stub(console, "warn");
      commandA = keymapManager.build("test", {
        "*": {
          "meta-shift-A": "a",
        },
      });
      assert.equal(console.warn.callCount, 1);
      return assert.lengthOf(commandA, 0);
    });
    it("rejects bindings with an invalid selector and logs a warning to the console", function () {
      stub(console, "warn");
      assert.lengthOf(
        keymapManager.build("test", {
          "<>": {
            "shift-a": "a",
          },
        }),
        0,
      );
      return assert.equal(console.warn.callCount, 1);
    });
    it("ignores bindings with an invalid selector when throwOnInvalidSelector is false", function () {
      stub(console, "warn");
      assert.lengthOf(
        keymapManager.build(
          "test",
          {
            "<>": {
              "shift-a": "a",
            },
          },
          0,
          false,
        ),
        1,
      );
      return assert.equal(console.warn.callCount, 0);
    });
    it("rejects bindings with an empty command and logs a warning to the console", function () {
      stub(console, "warn");
      assert.lengthOf(
        keymapManager.build("test", {
          body: {
            "shift-a": "",
          },
        }),
        0,
      );
      return assert.equal(console.warn.callCount, 1);
    });
    it("rejects bindings without a command and logs a warning to the console", function () {
      stub(console, "warn");
      assert.lengthOf(
        keymapManager.build("test", {
          body: {
            "shift-a": null,
          },
        }),
        0,
      );
      return assert.equal(console.warn.callCount, 1);
    });
    return it("rejects bindings with a non object command", function () {
      stub(console, "warn");
      assert.lengthOf(
        keymapManager.build("test", {
          body: "my-sweet-command:that-is-evil",
        }),
        0,
      );
      return assert.equal(console.warn.callCount, 1);
    });
  });
  describe("::add(source, bindings)", function () {
    it("registers the new bindings", function () {
      var event;
      keymapManager.add("foo", {
        body: {
          "ctrl-a": "x",
          "ctrl-b": "y",
        },
      });
      event = buildKeydownEvent({
        key: "A",
        ctrlKey: true,
        target: document.body,
      });
      keymapManager.handleKeyboardEvent(event);
      return assert.isTrue(event.defaultPrevented);
    });
    return it("returns a disposable allowing the added bindings to be removed", function () {
      var disposable2;
      keymapManager.add("foo", {
        ".a": {
          "ctrl-a": "x",
        },
        ".b": {
          "ctrl-b": "y",
        },
      });
      disposable2 = keymapManager.add("bar", {
        ".c": {
          "ctrl-c": "z",
        },
      });
      assert.equal(
        keymapManager.findKeyBindings({
          command: "x",
        }).length,
        1,
      );
      assert.equal(
        keymapManager.findKeyBindings({
          command: "y",
        }).length,
        1,
      );
      assert.equal(
        keymapManager.findKeyBindings({
          command: "z",
        }).length,
        1,
      );
      disposable2.dispose();
      assert.equal(
        keymapManager.findKeyBindings({
          command: "x",
        }).length,
        1,
      );
      assert.equal(
        keymapManager.findKeyBindings({
          command: "y",
        }).length,
        1,
      );
      return assert.equal(
        keymapManager.findKeyBindings({
          command: "z",
        }).length,
        0,
      );
    });
  });
  describe("::keystrokeForKeyboardEvent(event)", function () {
    describe("when no extra modifiers are pressed", function () {
      return it("returns a string that identifies the unmodified keystroke", function () {
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "a",
            }),
          ),
          "a",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "A",
              shiftKey: true,
            }),
          ),
          "shift-A",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "[",
            }),
          ),
          "[",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "*",
              shiftKey: true,
            }),
          ),
          "*",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "ArrowLeft",
            }),
          ),
          "left",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Backspace",
            }),
          ),
          "backspace",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Delete",
            }),
          ),
          "delete",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "PageUp",
            }),
          ),
          "pageup",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: " ",
              code: "Space",
            }),
          ),
          "space",
        );
      });
    });
    describe("when a modifier key is combined with a non-modifier key", function () {
      return it("returns a string that identifies the modified keystroke", function () {
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "a",
              altKey: true,
            }),
          ),
          "alt-a",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "[",
              metaKey: true,
            }),
          ),
          "cmd-[",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "[",
              code: "BracketLeft",
              shiftKey: true,
              metaKey: true,
            }),
          ),
          "cmd-{",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "*",
              ctrlKey: true,
              shiftKey: true,
            }),
          ),
          "ctrl-*",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "8",
              code: "Digit8",
              ctrlKey: true,
              shiftKey: true,
            }),
          ),
          "ctrl-*",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "ArrowLeft",
              ctrlKey: true,
              altKey: true,
              metaKey: true,
            }),
          ),
          "ctrl-alt-cmd-left",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "A",
              shiftKey: true,
            }),
          ),
          "shift-A",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "A",
              ctrlKey: true,
              shiftKey: true,
            }),
          ),
          "ctrl-shift-A",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "{",
              shiftKey: true,
            }),
          ),
          "{",
        );
      });
    });
    describe("when the KeyboardEvent.key is a capital letter due to caps lock, but shift is not pressed", function () {
      return it("converts the letter to lower case", function () {
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "A",
              shiftKey: false,
            }),
          ),
          "a",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "A",
              shiftKey: false,
              altKey: true,
            }),
          ),
          "alt-a",
        );
      });
    });
    describe("when the KeyboardEvent.key is a lower-case letter due to caps lock + shift", function () {
      it("converts the letter to upper case and honors the shift key", function () {
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "a",
              shiftKey: true,
            }),
          ),
          "shift-A",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "a",
              shiftKey: true,
              altKey: true,
            }),
          ),
          "alt-shift-A",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "a",
              shiftKey: true,
              ctrlKey: true,
            }),
          ),
          "ctrl-shift-A",
        );
      });
      return it("doesn't drop the ctrl-alt modifiers when there is no AltGraph variant", function () {
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "p",
              shiftKey: true,
              altKey: true,
              ctrlKey: true,
            }),
          ),
          "ctrl-alt-shift-P",
        );
      });
    });
    describe("when the KeyboardEvent.key is 'Delete' but KeyboardEvent.code is 'Backspace' due to pressing ctrl-delete with numlock enabled on Windows", function () {
      return it("translates as ctrl-backspace instead of ctrl-delete", function () {
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Delete",
              code: "Backspace",
              ctrlKey: true,
            }),
          ),
          "ctrl-backspace",
        );
      });
    });
    describe("when the KeyboardEvent.key is '' but the KeyboardEvent.code is 'NumpadDecimal' and getModifierState('NumLock') returns false", function () {
      return it("translates as delete to work around a Chrome bug on Linux", function () {
        mockProcessPlatform("linux");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: ".",
              code: "NumpadDecimal",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          ".",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "",
              code: "NumpadDecimal",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "delete",
        );
      });
    });
    describe("when numlock is on", function () {
      return it("translates numpad digits using KeyboardEvent.code", function () {
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "0",
              code: "Numpad0",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad0",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "1",
              code: "Numpad1",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad1",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "2",
              code: "Numpad2",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad2",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "3",
              code: "Numpad3",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad3",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "4",
              code: "Numpad4",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad4",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "5",
              code: "Numpad5",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad5",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "6",
              code: "Numpad6",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad6",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "7",
              code: "Numpad7",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad7",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "8",
              code: "Numpad8",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad8",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "9",
              code: "Numpad9",
              modifierState: {
                NumLock: true,
              },
            }),
          ),
          "numpad9",
        );
      });
    });
    describe("when numlock is off", function () {
      return it("doesn't translate numpad digits using KeyboardEvent.code", function () {
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Insert",
              code: "Numpad0",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "insert",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "End",
              code: "Numpad1",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "end",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "ArrowDown",
              code: "Numpad2",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "down",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "PageDown",
              code: "Numpad3",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "pagedown",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "ArrowLeft",
              code: "Numpad4",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "left",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Clear",
              code: "Numpad5",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "clear",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "ArrowRight",
              code: "Numpad6",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "right",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Home",
              code: "Numpad7",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "home",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "ArrowUp",
              code: "Numpad8",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "up",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "PageUp",
              code: "Numpad9",
              modifierState: {
                NumLock: false,
              },
            }),
          ),
          "pageup",
        );
      });
    });
    describe("when the Dvorak QWERTY-⌘ layout is in use on macOS", function () {
      return it("uses the US layout equivalent when the command key is held down", function () {
        mockProcessPlatform("darwin");
        stub(KeyboardLayout, "getCurrentKeymap", function () {
          return require("./keymap-spec-helpers/keymaps/mac-dvorak-qwerty-cmd");
        });
        stub(KeyboardLayout, "getCurrentKeyboardLayout", function () {
          return "com.apple.keylayout.DVORAK-QWERTYCMD";
        });
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "l",
              code: "KeyP",
              altKey: true,
            }),
          ),
          "alt-l",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "l",
              code: "KeyP",
              ctrlKey: true,
              altKey: true,
            }),
          ),
          "ctrl-alt-l",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "l",
              code: "KeyP",
              metaKey: true,
            }),
          ),
          "cmd-p",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "L",
              code: "KeyP",
              metaKey: true,
              shiftKey: true,
            }),
          ),
          "shift-cmd-P",
        );
      });
    });
    describe("when a custom Dvorak QWERTY-⌘ layout is in use on macOS", function () {
      return it("uses the US layout equivalent when the command key is held down", function () {
        mockProcessPlatform("darwin");
        stub(KeyboardLayout, "getCurrentKeymap", function () {
          return require("./keymap-spec-helpers/keymaps/mac-dvorak-qwerty-cmd");
        });
        stub(KeyboardLayout, "getCurrentKeyboardLayout", function () {
          return "org.unknown.keylayout.DVORAK-QWERTYCMD";
        });
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "l",
              code: "KeyP",
              altKey: true,
            }),
          ),
          "alt-l",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "l",
              code: "KeyP",
              ctrlKey: true,
              altKey: true,
            }),
          ),
          "ctrl-alt-l",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "l",
              code: "KeyP",
              metaKey: true,
            }),
          ),
          "cmd-p",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "L",
              code: "KeyP",
              metaKey: true,
              shiftKey: true,
            }),
          ),
          "shift-cmd-P",
        );
      });
    });
    describe("when the current system keymap cannot be obtained on macOS", function () {
      return it("does not throw exceptions and just takes the current key value", function () {
        mockProcessPlatform("darwin");
        stub(KeyboardLayout, "getCurrentKeymap", function () {
          return null;
        });
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              code: "KeyG",
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "@",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Dead",
              code: "KeyU",
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "alt-dead",
        );
      });
    });
    describe("international layouts", function () {
      var currentKeymap;
      currentKeymap = null;
      beforeEach(function () {
        currentKeymap = null;
        return stub(KeyboardLayout, "getCurrentKeymap", function () {
          return currentKeymap;
        });
      });
      it("correctly resolves to AltGraph to ctrl-alt when key is AltGraph on Windows", function () {
        mockProcessPlatform("win32");
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "AltGraph",
              code: "AltRight",
              ctrlKey: true,
              altKey: true,
            }),
          ),
          "ctrl-alt",
        );
      });
      it("allows ASCII characters (<= 127) to be typed via an option modifier on macOS", function () {
        mockProcessPlatform("darwin");
        currentKeymap = require("./keymap-spec-helpers/keymaps/mac-swiss-german");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              code: "KeyG",
              altKey: true,
            }),
          ),
          "@",
        );
        // Does not use alt variant characters outside of basic ASCII range
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "‚",
              code: "KeyG",
              altKey: true,
              shiftKey: true,
            }),
          ),
          "alt-shift-G",
        );
        // Does not use alt variant character if ctrl modifier is used
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              code: "KeyG",
              ctrlKey: true,
              altKey: true,
            }),
          ),
          "ctrl-alt-g",
        );
      });
      it("allows ASCII characters (<= 127) to be typed via the ctrl-alt- modifiers on Windows", function () {
        mockProcessPlatform("win32");
        currentKeymap = require("./keymap-spec-helpers/keymaps/windows-swiss-german");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              code: "Digit2",
              ctrlKey: true,
              altKey: true,
            }),
          ),
          "@",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "°",
              code: "Digit4",
              ctrlKey: true,
              altKey: true,
            }),
          ),
          "ctrl-alt-4",
        );
        currentKeymap = require("./keymap-spec-helpers/keymaps/windows-us-international");
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "¢",
              code: "KeyC",
              ctrlKey: true,
              altKey: true,
              shiftKey: true,
            }),
          ),
          "ctrl-alt-shift-C",
        );
      });
      it("allows arbitrary characters to be typed via an altgraph modifier on Linux", function () {
        mockProcessPlatform("linux");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "@",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "€",
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "€",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Ë",
              shiftKey: true,
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "shift-Ë",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "g",
              altKey: true,
              altGraphKey: false,
            }),
          ),
          "alt-g",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "e",
              altKey: true,
              altGraphKey: false,
            }),
          ),
          "alt-e",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "E",
              altKey: true,
              shiftKey: true,
              altGraphKey: false,
            }),
          ),
          "alt-shift-E",
        );
      });
      it("falls back to the non-alt key if other modifiers are combined with ALtGraph on Linux", function () {
        mockProcessPlatform("linux");
        currentKeymap = require("./keymap-spec-helpers/keymaps/linux-swiss-german");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              code: "KeyG",
              ctrlKey: true,
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "ctrl-alt-g",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              code: "KeyG",
              metaKey: true,
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "alt-cmd-g",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "@",
              code: "KeyG",
              altKey: true,
              modifierState: {
                AltGraph: true,
              },
            }),
          ),
          "alt-g",
        );
      });
      it("resolves events with a key value of Unknown and a code of IntlRo to '/' (this occurs on a Brazillian Portuguese keyboard layout on Mint Linux)", function () {
        mockProcessPlatform("linux");
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Unidentified",
              code: "IntlRo",
              ctrlKey: true,
            }),
          ),
          "ctrl-/",
        );
      });
      it("on non-Latin keyboards, converts keystrokes with modifiers to U.S. layout equivalent characters", function () {
        currentKeymap = require("./keymap-spec-helpers/keymaps/mac-greek");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "δ",
              code: "KeyD",
            }),
          ),
          "d",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Δ",
              code: "KeyD",
              shiftKey: true,
            }),
          ),
          "shift-D",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "÷",
              altKey: true,
              code: "KeyD",
            }),
          ),
          "alt-d",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "δ",
              code: "KeyD",
              metaKey: true,
            }),
          ),
          "cmd-d",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Δ",
              code: "KeyD",
              metaKey: true,
              shiftKey: true,
            }),
          ),
          "shift-cmd-D",
        );
        // If *any* key on the keyboard is non-Latin, even characters that *are* Latin remap to the U.S. equivalent character for the physical key
        currentKeymap = require("./keymap-spec-helpers/keymaps/mac-russian-pc");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: ".",
              code: "Slash",
              ctrlKey: true,
            }),
          ),
          "ctrl-/",
        );
        currentKeymap = require("./keymap-spec-helpers/keymaps/mac-hebrew");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "]",
              code: "BracketLeft",
              ctrlKey: true,
            }),
          ),
          "ctrl-[",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "[",
              code: "BracketRight",
              ctrlKey: true,
            }),
          ),
          "ctrl-]",
        );
        // Don't use U.S. counterpart for keyboards with all Latin characters
        currentKeymap = require("./keymap-spec-helpers/keymaps/mac-turkish");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "ö",
              code: "KeyX",
              metaKey: true,
            }),
          ),
          "cmd-ö",
        );
        // Don't blow up if A, S, D, or F don't have entries in the keymap
        currentKeymap = {
          KeyA: null,
          KeyS: null,
          KeyD: null,
          KeyF: null,
        };
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "a",
              code: "KeyA",
              ctrlKey: true,
            }),
          ),
          "ctrl-a",
        );
      });
      return it("translates dead keys to their printable equivalents on macOS, but not Windows", function () {
        mockProcessPlatform("darwin");
        currentKeymap = require("./keymap-spec-helpers/keymaps/mac-swedish");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Dead",
              code: "BracketRight",
            }),
          ),
          "¨",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Dead",
              code: "BracketRight",
              shiftKey: true,
            }),
          ),
          "^",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Dead",
              code: "BracketRight",
              altKey: true,
            }),
          ),
          "~",
        );
        // We can't determine the character for a dead key on Windows without breaking dead key handling
        // in some cases because they have a terrible API, so we don't try.
        mockProcessPlatform("win32");
        currentKeymap = require("./keymap-spec-helpers/keymaps/windows-swedish");
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Dead",
              code: "BracketRight",
            }),
          ),
          "dead",
        );
        assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Dead",
              code: "BracketRight",
              shiftKey: true,
            }),
          ),
          "shift-dead",
        );
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(
            buildKeydownEvent({
              key: "Dead",
              code: "BracketRight",
              ctrlKey: true,
              altKey: true,
              shiftKey: true,
            }),
          ),
          "ctrl-alt-shift-dead",
        );
      });
    });
    return describe("when custom keystroke resolvers are installed", function () {
      return it("resolves to the keystroke string of the most recently-installed resolver returning a defined value", function () {
        var currentKeymap, currentLayoutName, disposable2, expectedKeystroke, keydownEvent;
        mockProcessPlatform("darwin");
        currentKeymap = require("./keymap-spec-helpers/keymaps/mac-swiss-german");
        currentLayoutName = "com.apple.keylayout.SwissGerman";
        stub(KeyboardLayout, "getCurrentKeymap", function () {
          return currentKeymap;
        });
        stub(KeyboardLayout, "getCurrentKeyboardLayout", function () {
          return currentLayoutName;
        });
        keydownEvent = buildKeydownEvent({
          key: "@",
          code: "KeyG",
          ctrlKey: true,
          altKey: true,
        });
        keymapManager.addKeystrokeResolver(function ({ keystroke, event, layoutName, keymap }) {
          assert.equal(keystroke, "ctrl-alt-g");
          assert.equal(event, keydownEvent);
          assert.equal(layoutName, currentLayoutName);
          assert.equal(keymap, currentKeymap);
          // simulate the user wishing to honor the alt-modified character in the presence of other modifiers
          return "ctrl-@";
        });
        assert.equal(keymapManager.keystrokeForKeyboardEvent(keydownEvent), "ctrl-@");
        // Test that multiple keytsroke resolvers cascade
        disposable2 = keymapManager.addKeystrokeResolver(function ({ keystroke }) {
          assert.equal(keystroke, "ctrl-@");
          // Ensure that we normalize the returned custom keystroke resolved
          return "alt-ctrl-X";
        });
        expectedKeystroke = "ctrl-alt-shift-X";
        keymapManager.addKeystrokeResolver(function ({ keystroke }) {
          assert.equal(keystroke, expectedKeystroke);
          return null;
        });
        assert.equal(keymapManager.keystrokeForKeyboardEvent(keydownEvent), expectedKeystroke);
        // Test that keystroke resolvers can be disposed
        disposable2.dispose();
        expectedKeystroke = "ctrl-@";
        return assert.equal(
          keymapManager.keystrokeForKeyboardEvent(keydownEvent),
          expectedKeystroke,
        );
      });
    });
  });
  describe("::findKeyBindings({command, target, keystrokes})", function () {
    var elementA, elementB;
    [elementA, elementB] = [];
    beforeEach(function () {
      elementA = appendContent(
        $$(function () {
          return this.div(
            {
              class: "a",
            },
            function () {
              this.div({
                class: "b c",
              });
              return this.div({
                class: "d",
              });
            },
          );
        }),
      );
      elementB = elementA.querySelector(".b.c");
      return keymapManager.add("test", {
        ".a": {
          "ctrl-a": "x",
          "ctrl-b": "y",
        },
        ".b": {
          "ctrl-c": "x",
        },
        ".b.c": {
          "ctrl-d": "x",
        },
        ".d": {
          "ctrl-e": "x",
        },
      });
    });
    describe("when only passed a command", function () {
      return it("returns all bindings that dispatch the given command", function () {
        var keystrokes;
        keystrokes = keymapManager
          .findKeyBindings({
            command: "x",
          })
          .map(function (b) {
            return b.keystrokes;
          })
          .sort();
        return assert.deepEqual(keystrokes, ["ctrl-a", "ctrl-c", "ctrl-d", "ctrl-e"]);
      });
    });
    describe("when only passed a target", function () {
      return it("returns all bindings that can be invoked from the given target", function () {
        var keystrokes;
        keystrokes = keymapManager
          .findKeyBindings({
            target: elementB,
          })
          .map(function (b) {
            return b.keystrokes;
          });
        return assert.deepEqual(keystrokes, ["ctrl-d", "ctrl-c", "ctrl-b", "ctrl-a"]);
      });
    });
    describe("when passed keystrokes", function () {
      return it("returns all bindings that can be invoked with the given keystrokes", function () {
        var keystrokes;
        keystrokes = keymapManager
          .findKeyBindings({
            keystrokes: "ctrl-a",
          })
          .map(function (b) {
            return b.keystrokes;
          });
        return assert.deepEqual(keystrokes, ["ctrl-a"]);
      });
    });
    return describe("when passed a command and a target", function () {
      return it("returns all bindings that would invoke the given command from the given target element, ordered by specificity", function () {
        var keystrokes;
        keystrokes = keymapManager
          .findKeyBindings({
            command: "x",
            target: elementB,
          })
          .map(function (b) {
            return b.keystrokes;
          });
        return assert.deepEqual(keystrokes, ["ctrl-d", "ctrl-c", "ctrl-a"]);
      });
    });
  });
  describe("::loadKeymap(path, options)", function () {
    beforeEach(function () {
      getFakeClock().uninstall();
      return restoreProcessPlatform();
    });
    describe("if called with a file path", function () {
      it("loads the keybindings from the file at the given path", function () {
        keymapManager.loadKeymap(path.join(__dirname, "fixtures", "a.json"));
        return assert.equal(
          keymapManager.findKeyBindings({
            command: "x",
          }).length,
          1,
        );
      });
      return describe("if called with watch: true", function () {
        var keymapFilePath, subscription;
        [keymapFilePath, subscription] = [];
        // File-watching runs through the async `watchPath` worker on real
        // timers; the fake clock can't drive it.
        beforeEach(() => useRealClock());
        beforeEach(async function () {
          keymapFilePath = path.join(temp.mkdirSync("keymap-manager-spec"), "keymapManager.cson");
          fs.writeFileSync(keymapFilePath, `'.a': 'ctrl-a': 'x'`);
          keymapManager.loadKeymap(keymapFilePath, {
            watch: true,
          });
          subscription = keymapManager.watchSubscriptions[keymapFilePath];
          assert.equal(
            keymapManager.findKeyBindings({
              command: "x",
            }).length,
            1,
          );
          // Wait for the async watcher to arm before tests modify the file.
          await keymapManager.watchStartPromises[keymapFilePath];
        });
        describe("when the file is changed", function () {
          // File watching runs on real timers via the async worker; a single
          // write can emit more than one event, so guard `done` on the expected
          // end state instead of debouncing with a (faked) timer.
          it("reloads the file's key bindings and notifies ::onDidReloadKeymap observers with the keymap path", function (done) {
            let finished = false;
            keymapManager.onDidReloadKeymap(function (event) {
              if (finished || keymapManager.findKeyBindings({ command: "y" }).length !== 1) return;
              finished = true;
              assert.equal(event.path, keymapFilePath);
              assert.equal(keymapManager.findKeyBindings({ command: "x" }).length, 0);
              assert.equal(keymapManager.findKeyBindings({ command: "y" }).length, 1);
              assert.equal(keymapManager.findKeyBindings({ command: "z" }).length, 1);
              done();
            });
            fs.writeFileSync(
              keymapFilePath,
              `'.a': 'ctrl-a': 'y'
'.b': 'ctrl-b': 'z'`,
            );
          });
          it("reloads the file's key bindings and notifies ::onDidReloadKeymap observers with the keymap path even if the file is empty", function (done) {
            let finished = false;
            keymapManager.onDidReloadKeymap(function (event) {
              if (finished || keymapManager.getKeyBindings().length !== 0) return;
              finished = true;
              assert.equal(event.path, keymapFilePath);
              assert.equal(keymapManager.getKeyBindings().length, 0);
              done();
            });
            fs.writeFileSync(keymapFilePath, "");
          });
          it("reloads the file's key bindings and notifies ::onDidReloadKeymap observers with the keymap path even if the file has only comments", function (done) {
            let finished = false;
            keymapManager.onDidReloadKeymap(function (event) {
              if (finished || keymapManager.getKeyBindings().length !== 0) return;
              finished = true;
              assert.equal(event.path, keymapFilePath);
              assert.equal(keymapManager.getKeyBindings().length, 0);
              done();
            });
            fs.writeFileSync(
              keymapFilePath,
              `#  '.a': 'ctrl-a': 'y'
#  '.b': 'ctrl-b': 'z'`,
            );
          });
          return it("emits an event, logs a warning and does not reload if there is a problem reloading the file", function (done) {
            let finished = false;
            stub(console, "warn");
            keymapManager.onDidFailToReadFile(function () {
              if (finished) return;
              finished = true;
              assert(console.warn.callCount > 0);
              assert.equal(keymapManager.findKeyBindings({ command: "x" }).length, 1);
              done();
            });
            fs.writeFileSync(keymapFilePath, "junk1.");
          });
        });
        describe("when the file is removed", function () {
          return it("removes the bindings and notifies ::onDidUnloadKeymap observers with keymap path", function (done) {
            keymapManager.onDidUnloadKeymap(function (event) {
              assert.equal(event.path, keymapFilePath);
              assert.equal(
                keymapManager.findKeyBindings({
                  command: "x",
                }).length,
                0,
              );
              return done();
            });
            return fs.removeSync(keymapFilePath);
          });
        });
        describe("when the file is moved", function () {
          return it("removes the bindings", function (done) {
            var newFilePath;
            newFilePath = path.join(temp.mkdirSync("keymap-manager-spec"), "other-guy.cson");
            keymapManager.onDidUnloadKeymap(function (event) {
              assert.equal(event.path, keymapFilePath);
              assert.equal(
                keymapManager.findKeyBindings({
                  command: "x",
                }).length,
                0,
              );
              return done();
            });
            return fs.moveSync(keymapFilePath, newFilePath);
          });
        });
        return it("allows the watch to be cancelled via the returned subscription", async function () {
          subscription.dispose();
          let reloaded = false;
          keymapManager.onDidReloadKeymap(function () {
            reloaded = true;
          });
          fs.writeFileSync(
            keymapFilePath,
            `'.a': 'ctrl-a': 'y'
'.b': 'ctrl-b': 'z'`,
          );
          // Give a change ample real-time to (not) be observed now the watch is
          // gone (the fake clock can't drive the async watcher worker).
          await realWait(500);
          assert(!reloaded);
          assert.equal(keymapManager.findKeyBindings({ command: "x" }).length, 1);
        });
      });
    });
    return describe("if called with a directory path", function () {
      return it("loads all platform compatible keybindings files in the directory", function () {
        stub(keymapManager, "getOtherPlatforms").returns(["os2"]);
        keymapManager.loadKeymap(path.join(__dirname, "fixtures"));
        assert.equal(
          keymapManager.findKeyBindings({
            command: "x",
          }).length,
          1,
        );
        assert.equal(
          keymapManager.findKeyBindings({
            command: "y",
          }).length,
          1,
        );
        assert.equal(
          keymapManager.findKeyBindings({
            command: "z",
          }).length,
          1,
        );
        assert.equal(
          keymapManager.findKeyBindings({
            command: "X",
          }).length,
          0,
        );
        return assert.equal(
          keymapManager.findKeyBindings({
            command: "Y",
          }).length,
          0,
        );
      });
    });
  });
  return describe("events", function () {
    it("emits `matched` when a key binding matches an event", function () {
      var binding, handler, keyboardEventTarget, keystrokes;
      handler = stub();
      keymapManager.onDidMatchBinding(handler);
      keymapManager.add("test", {
        body: {
          "ctrl-x": "used-command",
        },
        "*": {
          "ctrl-x": "unused-command",
        },
        ".not-in-the-dom": {
          "ctrl-x": "unmached-command",
        },
      });
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "x",
          ctrlKey: true,
          target: document.body,
        }),
      );
      assert.equal(handler.callCount, 1);
      ({ keystrokes, binding, keyboardEventTarget } = handler.firstCall.args[0]);
      assert.equal(keystrokes, "ctrl-x");
      assert.equal(binding.command, "used-command");
      return assert.equal(keyboardEventTarget, document.body);
    });
    it("emits `matched-partially` when a key binding partially matches an event", function () {
      var handler, keyboardEventTarget, keystrokes, partiallyMatchedBindings;
      handler = stub();
      keymapManager.onDidPartiallyMatchBindings(handler);
      keymapManager.add("test", {
        body: {
          "ctrl-x 1": "command-1",
          "ctrl-x 2": "command-2",
          "a c ^c ^a": "command-3",
        },
      });
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "x",
          ctrlKey: true,
          target: document.body,
        }),
      );
      assert.equal(handler.callCount, 1);
      ({ keystrokes, partiallyMatchedBindings, keyboardEventTarget } = handler.firstCall.args[0]);
      assert.equal(keystrokes, "ctrl-x");
      assert.equal(partiallyMatchedBindings.length, 2);
      assert.deepEqual(
        partiallyMatchedBindings.map(function ({ command }) {
          return command;
        }),
        ["command-1", "command-2"],
      );
      return assert.equal(keyboardEventTarget, document.body);
    });
    it("emits `matched-partially` when a key binding that contains keyup keystrokes partially matches an event", function () {
      var handler, keyboardEventTarget, keystrokes, partiallyMatchedBindings;
      handler = stub();
      keymapManager.onDidPartiallyMatchBindings(handler);
      keymapManager.add("test", {
        body: {
          "a c ^c ^a": "command-1",
        },
      });
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "a",
          target: document.body,
        }),
      );
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "c",
          target: document.body,
        }),
      );
      assert(handler.callCount > 0);
      ({ keystrokes } = handler.firstCall.args[0]);
      assert.equal(keystrokes, "a");
      ({ keystrokes, partiallyMatchedBindings, keyboardEventTarget } = handler.getCall(1).args[0]);
      assert.equal(keystrokes, "a c");
      assert.equal(partiallyMatchedBindings.length, 1);
      assert.deepEqual(
        partiallyMatchedBindings.map(function ({ command }) {
          return command;
        }),
        ["command-1"],
      );
      assert.equal(keyboardEventTarget, document.body);
      handler.reset();
      keymapManager.handleKeyboardEvent(
        buildKeyupEvent({
          key: "c",
          target: document.body,
        }),
      );
      assert.equal(handler.callCount, 1);
      ({ keystrokes, partiallyMatchedBindings, keyboardEventTarget } = handler.firstCall.args[0]);
      assert.equal(keystrokes, "a c ^c");
      assert.equal(partiallyMatchedBindings.length, 1);
      assert.deepEqual(
        partiallyMatchedBindings.map(function ({ command }) {
          return command;
        }),
        ["command-1"],
      );
      return assert.equal(keyboardEventTarget, document.body);
    });
    return it("emits `match-failed` when no key bindings match the event", function () {
      var handler, keyboardEventTarget, keystrokes;
      handler = stub();
      keymapManager.onDidFailToMatchBinding(handler);
      keymapManager.add("test", {
        body: {
          "ctrl-x": "command",
        },
      });
      keymapManager.handleKeyboardEvent(
        buildKeydownEvent({
          key: "y",
          ctrlKey: true,
          target: document.body,
        }),
      );
      assert.equal(handler.callCount, 1);
      ({ keystrokes, keyboardEventTarget } = handler.firstCall.args[0]);
      assert.equal(keystrokes, "ctrl-y");
      return assert.equal(keyboardEventTarget, document.body);
    });
  });
});
