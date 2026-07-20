/*
 * decaffeinate suggestions:
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const fs = require("@lumine-code/fs-plus");
const path = require("path");
const { join } = path;
const temp = require("./text-buffer-helpers/temp");
const Random = require("random-seed");
const Point = require("../src/point");
const Range = require("../src/range");
const DisplayLayer = require("../src/display-layer");
const DefaultHistoryProvider = require("../src/default-history-provider");
const TextBuffer = require("../src/text-buffer");
fs.readFileSync(join(__dirname, "fixtures", "sample.js"), "utf8");
const { buildRandomLines, getRandomBufferRange } = require("./text-buffer-helpers/random");
const NullLanguageMode = require("../src/null-language-mode");

describe("TextBuffer", function () {
  let buffer = null;

  beforeEach(function () {
    temp.track();
    jasmine.addCustomEqualityTester(require("@lumine-code/underscore-plus").isEqual);
    // When running specs in Atom, setTimeout is spied on by default.
    jasmine.useRealClock?.();
  });

  afterEach(function () {
    buffer?.destroy();
    buffer = null;
  });

  describe("construction", function () {
    it("can be constructed empty", function () {
      buffer = new TextBuffer();
      expect(buffer.getLineCount()).toBe(1);
      expect(buffer.getText()).toBe("");
      expect(buffer.lineForRow(0)).toBe("");
      expect(buffer.lineEndingForRow(0)).toBe("");
    });

    it("can be constructed with initial text containing no trailing newline", function () {
      const text = "hello\nworld\r\nhow are you doing?\r\nlast";
      buffer = new TextBuffer(text);
      expect(buffer.getLineCount()).toBe(4);
      expect(buffer.getText()).toBe(text);
      expect(buffer.lineForRow(0)).toBe("hello");
      expect(buffer.lineEndingForRow(0)).toBe("\n");
      expect(buffer.lineForRow(1)).toBe("world");
      expect(buffer.lineEndingForRow(1)).toBe("\r\n");
      expect(buffer.lineForRow(2)).toBe("how are you doing?");
      expect(buffer.lineEndingForRow(2)).toBe("\r\n");
      expect(buffer.lineForRow(3)).toBe("last");
      expect(buffer.lineEndingForRow(3)).toBe("");
    });

    it("can be constructed with initial text containing a trailing newline", function () {
      const text = "first\n";
      buffer = new TextBuffer(text);
      expect(buffer.getLineCount()).toBe(2);
      expect(buffer.getText()).toBe(text);
      expect(buffer.lineForRow(0)).toBe("first");
      expect(buffer.lineEndingForRow(0)).toBe("\n");
      expect(buffer.lineForRow(1)).toBe("");
      expect(buffer.lineEndingForRow(1)).toBe("");
    });

    it("automatically assigns a unique identifier to new buffers", function () {
      const bufferIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(() =>
        new TextBuffer().getId(),
      );
      const uniqueBufferIds = new Set(bufferIds);

      expect(uniqueBufferIds.size).toBe(bufferIds.length);
    });
  });

  describe("::destroy()", () =>
    it("clears the buffer's state", function (done) {
      const filePath = temp.openSync("atom").path;
      buffer = new TextBuffer();
      buffer.setPath(filePath);
      buffer.append("a");
      buffer.append("b");
      buffer.destroy();

      expect(buffer.getText()).toBe("");
      buffer.undo();
      expect(buffer.getText()).toBe("");
      buffer.save().catch(function (error) {
        expect(error.message).toMatch(/Can't save destroyed buffer/);
        done();
      });
    }));

  describe("::setTextInRange(range, text)", function () {
    beforeEach(() => (buffer = new TextBuffer("hello\nworld\r\nhow are you doing?")));

    it("can replace text on a single line with a standard newline", function () {
      buffer.setTextInRange(
        [
          [0, 2],
          [0, 4],
        ],
        "y y",
      );
      expect(buffer.getText()).toEqual("hey yo\nworld\r\nhow are you doing?");
    });

    it("can replace text on a single line with a carriage-return/newline", function () {
      buffer.setTextInRange(
        [
          [1, 3],
          [1, 5],
        ],
        "ms",
      );
      expect(buffer.getText()).toEqual("hello\nworms\r\nhow are you doing?");
    });

    it("can replace text in a region spanning multiple lines, ending on the last line", function () {
      buffer.setTextInRange(
        [
          [0, 2],
          [2, 3],
        ],
        "y there\r\ncat\nwhat",
        { normalizeLineEndings: false },
      );
      expect(buffer.getText()).toEqual("hey there\r\ncat\nwhat are you doing?");
    });

    it("can replace text in a region spanning multiple lines, ending with a carriage-return/newline", function () {
      buffer.setTextInRange(
        [
          [0, 2],
          [1, 3],
        ],
        "y\nyou're o",
        { normalizeLineEndings: false },
      );
      expect(buffer.getText()).toEqual("hey\nyou're old\r\nhow are you doing?");
    });

    describe("after a change", () =>
      it("notifies, in order: the language mode, display layers, and display layer ::onDidChange observers with the relevant details", function () {
        buffer = new TextBuffer("hello\nworld\r\nhow are you doing?");

        const events = [];
        const languageMode = {
          bufferDidChange(e) {
            events.push({ source: "language-mode", event: e });
          },
          bufferDidFinishTransaction() {},
          onDidChangeHighlighting() {
            return { dispose() {} };
          },
        };
        const displayLayer1 = buffer.addDisplayLayer();
        const displayLayer2 = buffer.addDisplayLayer();
        spyOn(displayLayer1, "bufferDidChange").and.callFake(function (e) {
          events.push({ source: "display-layer-1", event: e });
          return DisplayLayer.prototype.bufferDidChange.call(displayLayer1, e);
        });
        spyOn(displayLayer2, "bufferDidChange").and.callFake(function (e) {
          events.push({ source: "display-layer-2", event: e });
          return DisplayLayer.prototype.bufferDidChange.call(displayLayer2, e);
        });
        buffer.setLanguageMode(languageMode);
        buffer.onDidChange((e) =>
          events.push({ source: "buffer", event: JSON.parse(JSON.stringify(e)) }),
        );
        displayLayer1.onDidChange((e) => events.push({ source: "display-layer-event", event: e }));

        buffer.transact(function () {
          buffer.setTextInRange(
            [
              [0, 2],
              [2, 3],
            ],
            "y there\r\ncat\nwhat",
            { normalizeLineEndings: false },
          );
          buffer.setTextInRange(
            [
              [1, 1],
              [1, 2],
            ],
            "abc",
            { normalizeLineEndings: false },
          );
        });

        const changeEvent1 = {
          oldRange: [
            [0, 2],
            [2, 3],
          ],
          newRange: [
            [0, 2],
            [2, 4],
          ],
          oldText: "llo\nworld\r\nhow",
          newText: "y there\r\ncat\nwhat",
        };
        const changeEvent2 = {
          oldRange: [
            [1, 1],
            [1, 2],
          ],
          newRange: [
            [1, 1],
            [1, 4],
          ],
          oldText: "a",
          newText: "abc",
        };
        expect(events).toEqual([
          { source: "language-mode", event: changeEvent1 },
          { source: "display-layer-1", event: changeEvent1 },
          { source: "display-layer-2", event: changeEvent1 },

          { source: "language-mode", event: changeEvent2 },
          { source: "display-layer-1", event: changeEvent2 },
          { source: "display-layer-2", event: changeEvent2 },

          {
            source: "buffer",
            event: {
              oldRange: Range(Point(0, 2), Point(2, 3)),
              newRange: Range(Point(0, 2), Point(2, 4)),
              changes: [
                {
                  oldRange: Range(Point(0, 2), Point(2, 3)),
                  newRange: Range(Point(0, 2), Point(2, 4)),
                  oldText: "llo\nworld\r\nhow",
                  newText: "y there\r\ncabct\nwhat",
                },
              ],
            },
          },
          {
            source: "display-layer-event",
            event: [
              {
                oldRange: Range(Point(0, 0), Point(3, 0)),
                newRange: Range(Point(0, 0), Point(3, 0)),
              },
            ],
          },
        ]);
      }));

    it("returns the newRange of the change", () =>
      expect(
        buffer.setTextInRange(
          [
            [0, 2],
            [2, 3],
          ],
          "y there\r\ncat\nwhat",
        ),
        { normalizeLineEndings: false },
      ).toEqual([
        [0, 2],
        [2, 4],
      ]));

    it("clips the given range", function () {
      buffer.setTextInRange(
        [
          [-1, -1],
          [0, 1],
        ],
        "y",
      );
      buffer.setTextInRange(
        [
          [0, 10],
          [0, 100],
        ],
        "w",
      );
      expect(buffer.lineForRow(0)).toBe("yellow");
    });

    it("preserves the line endings of existing lines", function () {
      buffer.setTextInRange(
        [
          [0, 1],
          [0, 2],
        ],
        "o",
      );
      expect(buffer.lineEndingForRow(0)).toBe("\n");
      buffer.setTextInRange(
        [
          [1, 1],
          [1, 3],
        ],
        "i",
      );
      expect(buffer.lineEndingForRow(1)).toBe("\r\n");
    });

    it("freezes change event ranges", function () {
      let changedOldRange = null;
      let changedNewRange = null;
      buffer.onDidChange(function ({ oldRange, newRange }) {
        oldRange.start = Point(0, 3);
        oldRange.start.row = 1;
        newRange.start = Point(4, 4);
        newRange.end.row = 2;
        changedOldRange = oldRange;
        changedNewRange = newRange;
      });

      buffer.setTextInRange(Range(Point(0, 2), Point(0, 4)), "y y");

      expect(changedOldRange).toEqual([
        [0, 2],
        [0, 4],
      ]);
      expect(changedNewRange).toEqual([
        [0, 2],
        [0, 5],
      ]);
    });

    describe("when the undo option is 'skip'", function () {
      // The `undo` option is deprecated; suppress the deprecation so lumine's
      // no-deprecated-calls spec guard doesn't fail these regression tests.
      beforeEach(() => spyOn(require("grim"), "deprecate"));

      it("replaces the contents of the buffer with the given text", function () {
        buffer.setTextInRange(
          [
            [0, 0],
            [0, 1],
          ],
          "y",
        );
        buffer.setTextInRange(
          [
            [0, 10],
            [0, 100],
          ],
          "w",
          { undo: "skip" },
        );
        expect(buffer.lineForRow(0)).toBe("yellow");

        expect(buffer.undo()).toBe(true);
        expect(buffer.lineForRow(0)).toBe("hello");
      });

      it("still emits marker change events (regression)", function () {
        const markerLayer = buffer.addMarkerLayer();
        const marker = markerLayer.markRange([
          [0, 0],
          [0, 3],
        ]);

        let markerLayerUpdateEventsCount = 0;
        const markerChangeEvents = [];
        markerLayer.onDidUpdate(() => markerLayerUpdateEventsCount++);
        marker.onDidChange((event) => markerChangeEvents.push(event));

        buffer.setTextInRange(
          [
            [0, 0],
            [0, 1],
          ],
          "",
          { undo: "skip" },
        );
        expect(markerLayerUpdateEventsCount).toBe(1);
        expect(markerChangeEvents).toEqual([
          {
            wasValid: true,
            isValid: true,
            hadTail: true,
            hasTail: true,
            oldProperties: {},
            newProperties: {},
            oldHeadPosition: Point(0, 3),
            newHeadPosition: Point(0, 2),
            oldTailPosition: Point(0, 0),
            newTailPosition: Point(0, 0),
            textChanged: true,
          },
        ]);
        markerChangeEvents.length = 0;

        buffer.transact(() =>
          buffer.setTextInRange(
            [
              [0, 0],
              [0, 1],
            ],
            "",
            { undo: "skip" },
          ),
        );
        expect(markerLayerUpdateEventsCount).toBe(2);
        expect(markerChangeEvents).toEqual([
          {
            wasValid: true,
            isValid: true,
            hadTail: true,
            hasTail: true,
            oldProperties: {},
            newProperties: {},
            oldHeadPosition: Point(0, 2),
            newHeadPosition: Point(0, 1),
            oldTailPosition: Point(0, 0),
            newTailPosition: Point(0, 0),
            textChanged: true,
          },
        ]);
      });

      it("still emits text change events (regression)", function (done) {
        const didChangeEvents = [];
        buffer.onDidChange((event) => didChangeEvents.push(event));

        buffer.onDidStopChanging(function ({ changes }) {
          assertChangesEqual(changes, [
            {
              oldRange: [
                [0, 0],
                [0, 1],
              ],
              newRange: [
                [0, 0],
                [0, 1],
              ],
              oldText: "h",
              newText: "z",
            },
          ]);
          done();
        });

        buffer.setTextInRange(
          [
            [0, 0],
            [0, 1],
          ],
          "y",
          { undo: "skip" },
        );
        expect(didChangeEvents.length).toBe(1);
        assertChangesEqual(didChangeEvents[0].changes, [
          {
            oldRange: [
              [0, 0],
              [0, 1],
            ],
            newRange: [
              [0, 0],
              [0, 1],
            ],
            oldText: "h",
            newText: "y",
          },
        ]);

        buffer.transact(() =>
          buffer.setTextInRange(
            [
              [0, 0],
              [0, 1],
            ],
            "z",
            { undo: "skip" },
          ),
        );
        expect(didChangeEvents.length).toBe(2);
        assertChangesEqual(didChangeEvents[1].changes, [
          {
            oldRange: [
              [0, 0],
              [0, 1],
            ],
            newRange: [
              [0, 0],
              [0, 1],
            ],
            oldText: "y",
            newText: "z",
          },
        ]);
      });
    });

    describe("when the normalizeLineEndings argument is true (the default)", function () {
      describe("when the range's start row has a line ending", () =>
        it("normalizes inserted line endings to match the line ending of the range's start row", function () {
          const changeEvents = [];
          buffer.onDidChange((e) => changeEvents.push(e));

          expect(buffer.lineEndingForRow(0)).toBe("\n");
          buffer.setTextInRange(
            [
              [0, 2],
              [0, 5],
            ],
            "y\r\nthere\r\ncrazy",
          );
          expect(buffer.lineEndingForRow(0)).toBe("\n");
          expect(buffer.lineEndingForRow(1)).toBe("\n");
          expect(buffer.lineEndingForRow(2)).toBe("\n");
          expect(changeEvents[0].newText).toBe("y\nthere\ncrazy");

          expect(buffer.lineEndingForRow(3)).toBe("\r\n");
          buffer.setTextInRange(
            [
              [3, 3],
              [4, Infinity],
            ],
            "ms\ndo you\r\nlike\ndirt",
          );
          expect(buffer.lineEndingForRow(3)).toBe("\r\n");
          expect(buffer.lineEndingForRow(4)).toBe("\r\n");
          expect(buffer.lineEndingForRow(5)).toBe("\r\n");
          expect(buffer.lineEndingForRow(6)).toBe("");
          expect(changeEvents[1].newText).toBe("ms\r\ndo you\r\nlike\r\ndirt");

          buffer.setTextInRange(
            [
              [5, 1],
              [5, 3],
            ],
            "\r",
          );
          expect(changeEvents[2].changes).toEqual([
            {
              oldRange: [
                [5, 1],
                [5, 3],
              ],
              newRange: [
                [5, 1],
                [6, 0],
              ],
              oldText: "ik",
              newText: "\r\n",
            },
          ]);

          buffer.undo();
          expect(changeEvents[3].changes).toEqual([
            {
              oldRange: [
                [5, 1],
                [6, 0],
              ],
              newRange: [
                [5, 1],
                [5, 3],
              ],
              oldText: "\r\n",
              newText: "ik",
            },
          ]);

          buffer.redo();
          expect(changeEvents[4].changes).toEqual([
            {
              oldRange: [
                [5, 1],
                [5, 3],
              ],
              newRange: [
                [5, 1],
                [6, 0],
              ],
              oldText: "ik",
              newText: "\r\n",
            },
          ]);
        }));

      describe("when the range's start row has no line ending (because it's the last line of the buffer)", function () {
        describe("when the buffer contains no newlines", () =>
          it("honors the newlines in the inserted text", function () {
            buffer = new TextBuffer("hello");
            buffer.setTextInRange(
              [
                [0, 2],
                [0, Infinity],
              ],
              "hey\r\nthere\nworld",
            );
            expect(buffer.lineEndingForRow(0)).toBe("\r\n");
            expect(buffer.lineEndingForRow(1)).toBe("\n");
            expect(buffer.lineEndingForRow(2)).toBe("");
          }));

        describe("when the buffer contains newlines", () =>
          it("normalizes inserted line endings to match the line ending of the penultimate row", function () {
            expect(buffer.lineEndingForRow(1)).toBe("\r\n");
            buffer.setTextInRange(
              [
                [2, 0],
                [2, Infinity],
              ],
              "what\ndo\r\nyou\nwant?",
            );
            expect(buffer.lineEndingForRow(2)).toBe("\r\n");
            expect(buffer.lineEndingForRow(3)).toBe("\r\n");
            expect(buffer.lineEndingForRow(4)).toBe("\r\n");
            expect(buffer.lineEndingForRow(5)).toBe("");
          }));
      });
    });

    describe("when the normalizeLineEndings argument is false", () =>
      it("honors the newlines in the inserted text", function () {
        buffer.setTextInRange(
          [
            [1, 0],
            [1, 5],
          ],
          "moon\norbiting\r\nhappily\nthere",
          { normalizeLineEndings: false },
        );
        expect(buffer.lineEndingForRow(1)).toBe("\n");
        expect(buffer.lineEndingForRow(2)).toBe("\r\n");
        expect(buffer.lineEndingForRow(3)).toBe("\n");
        expect(buffer.lineEndingForRow(4)).toBe("\r\n");
        expect(buffer.lineEndingForRow(5)).toBe("");
      }));
  });

  describe("::setText(text)", () =>
    it("replaces the contents of the buffer with the given text", function () {
      buffer = new TextBuffer("hello\nworld\r\nyou are cool");
      buffer.setText("goodnight\r\nmoon\nit's been good");
      expect(buffer.getText()).toBe("goodnight\r\nmoon\nit's been good");
      buffer.undo();
      expect(buffer.getText()).toBe("hello\nworld\r\nyou are cool");
    }));

  describe("::insert(position, text, normalizeNewlinesn)", function () {
    it("inserts text at the given position", function () {
      buffer = new TextBuffer("hello world");
      buffer.insert([0, 5], " there");
      expect(buffer.getText()).toBe("hello there world");
    });

    it("honors the normalizeNewlines option", function () {
      buffer = new TextBuffer("hello\nworld");
      buffer.insert([0, 5], "\r\nthere\r\nlittle", { normalizeLineEndings: false });
      expect(buffer.getText()).toBe("hello\r\nthere\r\nlittle\nworld");
    });
  });

  describe("::append(text, normalizeNewlines)", function () {
    it("appends text to the end of the buffer", function () {
      buffer = new TextBuffer("hello world");
      buffer.append(", how are you?");
      expect(buffer.getText()).toBe("hello world, how are you?");
    });

    it("honors the normalizeNewlines option", function () {
      buffer = new TextBuffer("hello\nworld");
      buffer.append("\r\nhow\r\nare\nyou?", { normalizeLineEndings: false });
      expect(buffer.getText()).toBe("hello\nworld\r\nhow\r\nare\nyou?");
    });
  });

  describe("::delete(range)", () =>
    it("deletes text in the given range", function () {
      buffer = new TextBuffer("hello world");
      buffer.delete([
        [0, 5],
        [0, 11],
      ]);
      expect(buffer.getText()).toBe("hello");
    }));

  describe("::deleteRows(startRow, endRow)", function () {
    beforeEach(() => (buffer = new TextBuffer("first\nsecond\nthird\nlast")));

    describe("when the endRow is less than the last row of the buffer", () =>
      it("deletes the specified rows", function () {
        buffer.deleteRows(1, 2);
        expect(buffer.getText()).toBe("first\nlast");
        buffer.deleteRows(0, 0);
        expect(buffer.getText()).toBe("last");
      }));

    describe("when the endRow is the last row of the buffer", () =>
      it("deletes the specified rows", function () {
        buffer.deleteRows(2, 3);
        expect(buffer.getText()).toBe("first\nsecond");
        buffer.deleteRows(0, 1);
        expect(buffer.getText()).toBe("");
      }));

    it("clips the given row range", function () {
      buffer.deleteRows(-1, 0);
      expect(buffer.getText()).toBe("second\nthird\nlast");
      buffer.deleteRows(1, 5);
      expect(buffer.getText()).toBe("second");

      buffer.deleteRows(-2, -1);
      expect(buffer.getText()).toBe("second");
      buffer.deleteRows(1, 2);
      expect(buffer.getText()).toBe("second");
    });

    it("handles out of order row ranges", function () {
      buffer.deleteRows(2, 1);
      expect(buffer.getText()).toBe("first\nlast");
    });
  });

  describe("::getText()", () =>
    it("returns the contents of the buffer as a single string", function () {
      buffer = new TextBuffer("hello\nworld\r\nhow are you?");
      expect(buffer.getText()).toBe("hello\nworld\r\nhow are you?");
      buffer.setTextInRange(
        [
          [1, 0],
          [1, 5],
        ],
        "mom",
      );
      expect(buffer.getText()).toBe("hello\nmom\r\nhow are you?");
    }));

  describe("::undo() and ::redo()", function () {
    beforeEach(() => (buffer = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" })));

    it("undoes and redoes multiple changes", function () {
      buffer.setTextInRange(
        [
          [0, 5],
          [0, 5],
        ],
        " there",
      );
      buffer.setTextInRange(
        [
          [1, 0],
          [1, 5],
        ],
        "friend",
      );
      expect(buffer.getText()).toBe("hello there\nfriend\r\nhow are you doing?");

      buffer.undo();
      expect(buffer.getText()).toBe("hello there\nworld\r\nhow are you doing?");

      buffer.undo();
      expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

      buffer.undo();
      expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

      buffer.redo();
      expect(buffer.getText()).toBe("hello there\nworld\r\nhow are you doing?");

      buffer.undo();
      expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

      buffer.redo();
      buffer.redo();
      expect(buffer.getText()).toBe("hello there\nfriend\r\nhow are you doing?");

      buffer.redo();
      expect(buffer.getText()).toBe("hello there\nfriend\r\nhow are you doing?");
    });

    it("clears the redo stack upon a fresh change", function () {
      buffer.setTextInRange(
        [
          [0, 5],
          [0, 5],
        ],
        " there",
      );
      buffer.setTextInRange(
        [
          [1, 0],
          [1, 5],
        ],
        "friend",
      );
      expect(buffer.getText()).toBe("hello there\nfriend\r\nhow are you doing?");

      buffer.undo();
      expect(buffer.getText()).toBe("hello there\nworld\r\nhow are you doing?");

      buffer.setTextInRange(
        [
          [1, 3],
          [1, 5],
        ],
        "m",
      );
      expect(buffer.getText()).toBe("hello there\nworm\r\nhow are you doing?");

      buffer.redo();
      expect(buffer.getText()).toBe("hello there\nworm\r\nhow are you doing?");

      buffer.undo();
      expect(buffer.getText()).toBe("hello there\nworld\r\nhow are you doing?");

      buffer.undo();
      expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");
    });

    it("does not allow the undo stack to grow without bound", function () {
      buffer = new TextBuffer({ maxUndoEntries: 12 });

      // Each transaction is treated as a single undo entry. We can undo up
      // to 12 of them.
      buffer.setText("");
      buffer.clearUndoStack();
      for (var i = 0; i < 13; i++) {
        buffer.transact(function () {
          buffer.append(String(i));
          buffer.append("\n");
        });
      }
      expect(buffer.getLineCount()).toBe(14);

      let undoCount = 0;
      while (buffer.undo()) {
        undoCount++;
      }
      expect(undoCount).toBe(12);
      expect(buffer.getText()).toBe("0\n");
    });
  });

  describe("::createMarkerSnapshot", function () {
    let markerLayers = null;

    beforeEach(function () {
      buffer = new TextBuffer();

      markerLayers = [
        buffer.addMarkerLayer({ maintainHistory: true, role: "selections" }),
        buffer.addMarkerLayer({ maintainHistory: true }),
        buffer.addMarkerLayer({ maintainHistory: true, role: "selections" }),
        buffer.addMarkerLayer({ maintainHistory: true }),
      ];
    });

    describe("when selectionsMarkerLayer is not passed", () =>
      it("takes a snapshot of all markerLayers", function () {
        const snapshot = buffer.createMarkerSnapshot();
        const markerLayerIdsInSnapshot = Object.keys(snapshot);
        expect(markerLayerIdsInSnapshot.length).toBe(4);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[0].id)).toBe(true);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[1].id)).toBe(true);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[2].id)).toBe(true);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[3].id)).toBe(true);
      }));

    describe("when selectionsMarkerLayer is passed", () =>
      it("skips snapshotting of other 'selection' role marker layers", function () {
        let snapshot = buffer.createMarkerSnapshot(markerLayers[0]);
        let markerLayerIdsInSnapshot = Object.keys(snapshot);
        expect(markerLayerIdsInSnapshot.length).toBe(3);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[0].id)).toBe(true);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[1].id)).toBe(true);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[2].id)).toBe(false);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[3].id)).toBe(true);

        snapshot = buffer.createMarkerSnapshot(markerLayers[2]);
        markerLayerIdsInSnapshot = Object.keys(snapshot);
        expect(markerLayerIdsInSnapshot.length).toBe(3);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[0].id)).toBe(false);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[1].id)).toBe(true);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[2].id)).toBe(true);
        expect(markerLayerIdsInSnapshot.includes(markerLayers[3].id)).toBe(true);
      }));
  });

  describe("selective snapshotting and restoration on transact/undo/redo for selections marker layer", function () {
    let markerLayers, marker0, marker1, marker2, textUndo, textRedo, rangesBefore, rangesAfter;
    const ensureMarkerLayer = function (markerLayer, range) {
      const markers = markerLayer.findMarkers({});
      expect(markers.length).toBe(1);
      expect(markers[0].getRange()).toEqual(range);
    };

    const getFirstMarker = (markerLayer) => markerLayer.findMarkers({})[0];

    beforeEach(function () {
      buffer = new TextBuffer({ text: "00000000\n11111111\n22222222\n33333333\n" });

      markerLayers = [
        buffer.addMarkerLayer({ maintainHistory: true, role: "selections" }),
        buffer.addMarkerLayer({ maintainHistory: true, role: "selections" }),
        buffer.addMarkerLayer({ maintainHistory: true, role: "selections" }),
      ];

      textUndo = "00000000\n11111111\n22222222\n33333333\n";
      textRedo = "00000000\n11111111\n22222222\n33333333\n44444444\n";

      rangesBefore = [
        [
          [0, 1],
          [0, 1],
        ],
        [
          [0, 2],
          [0, 2],
        ],
        [
          [0, 3],
          [0, 3],
        ],
      ];
      rangesAfter = [
        [
          [2, 1],
          [2, 1],
        ],
        [
          [2, 2],
          [2, 2],
        ],
        [
          [2, 3],
          [2, 3],
        ],
      ];

      marker0 = markerLayers[0].markRange(rangesBefore[0]);
      marker1 = markerLayers[1].markRange(rangesBefore[1]);
      marker2 = markerLayers[2].markRange(rangesBefore[2]);
    });

    it("restores a snapshot from other selections marker layers on undo/redo", function () {
      // Snapshot is taken for markerLayers[0] only, markerLayer[1] and markerLayer[2] are skipped
      buffer.transact({ selectionsMarkerLayer: markerLayers[0] }, function () {
        buffer.append("44444444\n");
        marker0.setRange(rangesAfter[0]);
        marker1.setRange(rangesAfter[1]);
        marker2.setRange(rangesAfter[2]);
      });

      buffer.undo({ selectionsMarkerLayer: markerLayers[0] });
      expect(buffer.getText()).toBe(textUndo);

      ensureMarkerLayer(markerLayers[0], rangesBefore[0]);
      ensureMarkerLayer(markerLayers[1], rangesAfter[1]);
      ensureMarkerLayer(markerLayers[2], rangesAfter[2]);
      expect(getFirstMarker(markerLayers[0])).toBe(marker0);
      expect(getFirstMarker(markerLayers[1])).toBe(marker1);
      expect(getFirstMarker(markerLayers[2])).toBe(marker2);

      buffer.redo({ selectionsMarkerLayer: markerLayers[0] });
      expect(buffer.getText()).toBe(textRedo);

      ensureMarkerLayer(markerLayers[0], rangesAfter[0]);
      ensureMarkerLayer(markerLayers[1], rangesAfter[1]);
      ensureMarkerLayer(markerLayers[2], rangesAfter[2]);
      expect(getFirstMarker(markerLayers[0])).toBe(marker0);
      expect(getFirstMarker(markerLayers[1])).toBe(marker1);
      expect(getFirstMarker(markerLayers[2])).toBe(marker2);

      buffer.undo({ selectionsMarkerLayer: markerLayers[1] });
      expect(buffer.getText()).toBe(textUndo);

      ensureMarkerLayer(markerLayers[0], rangesAfter[0]);
      ensureMarkerLayer(markerLayers[1], rangesBefore[0]);
      ensureMarkerLayer(markerLayers[2], rangesAfter[2]);
      expect(getFirstMarker(markerLayers[0])).toBe(marker0);
      expect(getFirstMarker(markerLayers[1])).not.toBe(marker1);
      expect(getFirstMarker(markerLayers[2])).toBe(marker2);
      expect(marker1.isDestroyed()).toBe(true);

      buffer.redo({ selectionsMarkerLayer: markerLayers[2] });
      expect(buffer.getText()).toBe(textRedo);

      ensureMarkerLayer(markerLayers[0], rangesAfter[0]);
      ensureMarkerLayer(markerLayers[1], rangesBefore[0]);
      ensureMarkerLayer(markerLayers[2], rangesAfter[0]);
      expect(getFirstMarker(markerLayers[0])).toBe(marker0);
      expect(getFirstMarker(markerLayers[1])).not.toBe(marker1);
      expect(getFirstMarker(markerLayers[2])).not.toBe(marker2);
      expect(marker1.isDestroyed()).toBe(true);
      expect(marker2.isDestroyed()).toBe(true);

      buffer.undo({ selectionsMarkerLayer: markerLayers[2] });
      expect(buffer.getText()).toBe(textUndo);

      ensureMarkerLayer(markerLayers[0], rangesAfter[0]);
      ensureMarkerLayer(markerLayers[1], rangesBefore[0]);
      ensureMarkerLayer(markerLayers[2], rangesBefore[0]);
      expect(getFirstMarker(markerLayers[0])).toBe(marker0);
      expect(getFirstMarker(markerLayers[1])).not.toBe(marker1);
      expect(getFirstMarker(markerLayers[2])).not.toBe(marker2);
      expect(marker1.isDestroyed()).toBe(true);
      expect(marker2.isDestroyed()).toBe(true);
    });

    it("can restore a snapshot taken at a destroyed selections marker layer given selectionsMarkerLayer", function () {
      buffer.transact({ selectionsMarkerLayer: markerLayers[1] }, function () {
        buffer.append("44444444\n");
        marker0.setRange(rangesAfter[0]);
        marker1.setRange(rangesAfter[1]);
        marker2.setRange(rangesAfter[2]);
      });

      markerLayers[1].destroy();
      expect(buffer.getMarkerLayer(markerLayers[0].id)).toBeTruthy();
      expect(buffer.getMarkerLayer(markerLayers[1].id)).toBeFalsy();
      expect(buffer.getMarkerLayer(markerLayers[2].id)).toBeTruthy();
      expect(marker0.isDestroyed()).toBe(false);
      expect(marker1.isDestroyed()).toBe(true);
      expect(marker2.isDestroyed()).toBe(false);

      buffer.undo({ selectionsMarkerLayer: markerLayers[0] });
      expect(buffer.getText()).toBe(textUndo);

      ensureMarkerLayer(markerLayers[0], rangesBefore[1]);
      ensureMarkerLayer(markerLayers[2], rangesAfter[2]);
      expect(marker0.isDestroyed()).toBe(true);
      expect(marker2.isDestroyed()).toBe(false);

      buffer.redo({ selectionsMarkerLayer: markerLayers[0] });
      expect(buffer.getText()).toBe(textRedo);
      ensureMarkerLayer(markerLayers[0], rangesAfter[1]);
      ensureMarkerLayer(markerLayers[2], rangesAfter[2]);

      markerLayers[3] = markerLayers[2].copy();
      ensureMarkerLayer(markerLayers[3], rangesAfter[2]);
      markerLayers[0].destroy();
      markerLayers[2].destroy();
      expect(buffer.getMarkerLayer(markerLayers[0].id)).toBeFalsy();
      expect(buffer.getMarkerLayer(markerLayers[1].id)).toBeFalsy();
      expect(buffer.getMarkerLayer(markerLayers[2].id)).toBeFalsy();
      expect(buffer.getMarkerLayer(markerLayers[3].id)).toBeTruthy();

      buffer.undo({ selectionsMarkerLayer: markerLayers[3] });
      expect(buffer.getText()).toBe(textUndo);
      ensureMarkerLayer(markerLayers[3], rangesBefore[1]);
      buffer.redo({ selectionsMarkerLayer: markerLayers[3] });
      expect(buffer.getText()).toBe(textRedo);
      ensureMarkerLayer(markerLayers[3], rangesAfter[1]);
    });

    it("falls back to normal behavior when the snaphot includes multiple layerSnapshots of selections marker layers", function () {
      // Transact without selectionsMarkerLayer.
      // Taken snapshot includes layerSnapshot of markerLayer[0], markerLayer[1] and markerLayer[2]
      buffer.transact(function () {
        buffer.append("44444444\n");
        marker0.setRange(rangesAfter[0]);
        marker1.setRange(rangesAfter[1]);
        marker2.setRange(rangesAfter[2]);
      });

      buffer.undo({ selectionsMarkerLayer: markerLayers[0] });
      expect(buffer.getText()).toBe(textUndo);

      ensureMarkerLayer(markerLayers[0], rangesBefore[0]);
      ensureMarkerLayer(markerLayers[1], rangesBefore[1]);
      ensureMarkerLayer(markerLayers[2], rangesBefore[2]);
      expect(getFirstMarker(markerLayers[0])).toBe(marker0);
      expect(getFirstMarker(markerLayers[1])).toBe(marker1);
      expect(getFirstMarker(markerLayers[2])).toBe(marker2);

      buffer.redo({ selectionsMarkerLayer: markerLayers[0] });
      expect(buffer.getText()).toBe(textRedo);

      ensureMarkerLayer(markerLayers[0], rangesAfter[0]);
      ensureMarkerLayer(markerLayers[1], rangesAfter[1]);
      ensureMarkerLayer(markerLayers[2], rangesAfter[2]);
      expect(getFirstMarker(markerLayers[0])).toBe(marker0);
      expect(getFirstMarker(markerLayers[1])).toBe(marker1);
      expect(getFirstMarker(markerLayers[2])).toBe(marker2);
    });

    describe("selections marker layer's selective snapshotting on createCheckpoint, groupChangesSinceCheckpoint", () =>
      it("skips snapshotting of other marker layers with the same role as the selectionsMarkerLayer", function () {
        jasmine.createSpy("eventHandler");

        const args = [];
        spyOn(buffer, "createMarkerSnapshot").and.callFake((arg) => args.push(arg));

        const checkpoint1 = buffer.createCheckpoint({ selectionsMarkerLayer: markerLayers[0] });
        const checkpoint2 = buffer.createCheckpoint();
        const checkpoint3 = buffer.createCheckpoint({ selectionsMarkerLayer: markerLayers[2] });
        const checkpoint4 = buffer.createCheckpoint({ selectionsMarkerLayer: markerLayers[1] });
        expect(args).toEqual([markerLayers[0], undefined, markerLayers[2], markerLayers[1]]);

        buffer.groupChangesSinceCheckpoint(checkpoint4, { selectionsMarkerLayer: markerLayers[0] });
        buffer.groupChangesSinceCheckpoint(checkpoint3, { selectionsMarkerLayer: markerLayers[2] });
        buffer.groupChangesSinceCheckpoint(checkpoint2);
        buffer.groupChangesSinceCheckpoint(checkpoint1, { selectionsMarkerLayer: markerLayers[1] });
        expect(args).toEqual([
          markerLayers[0],
          undefined,
          markerLayers[2],
          markerLayers[1],

          markerLayers[0],
          markerLayers[2],
          undefined,
          markerLayers[1],
        ]);
      }));
  });

  describe("transactions", function () {
    let now = null;

    beforeEach(function () {
      now = 0;
      spyOn(Date, "now").and.callFake(() => now);

      buffer = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" });
      buffer.setTextInRange(
        [
          [1, 3],
          [1, 5],
        ],
        "ms",
      );
    });

    describe("::transact(groupingInterval, fn)", function () {
      it("groups all operations in the given function in a single transaction", function () {
        buffer.transact(function () {
          buffer.setTextInRange(
            [
              [0, 2],
              [0, 5],
            ],
            "y",
          );
          buffer.transact(() =>
            buffer.setTextInRange(
              [
                [2, 13],
                [2, 14],
              ],
              "igg",
            ),
          );
        });

        expect(buffer.getText()).toBe("hey\nworms\r\nhow are you digging?");
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");
      });

      it("halts execution of the function if the transaction is aborted", function () {
        let innerContinued = false;
        let outerContinued = false;

        buffer.transact(function () {
          buffer.setTextInRange(
            [
              [0, 2],
              [0, 5],
            ],
            "y",
          );
          buffer.transact(function () {
            buffer.setTextInRange(
              [
                [2, 13],
                [2, 14],
              ],
              "igg",
            );
            buffer.abortTransaction();
            innerContinued = true;
          });
          outerContinued = true;
        });

        expect(innerContinued).toBe(false);
        expect(outerContinued).toBe(true);
        expect(buffer.getText()).toBe("hey\nworms\r\nhow are you doing?");
      });

      it("groups all operations performed within the given function into a single undo/redo operation", function () {
        buffer.transact(function () {
          buffer.setTextInRange(
            [
              [0, 2],
              [0, 5],
            ],
            "y",
          );
          buffer.setTextInRange(
            [
              [2, 13],
              [2, 14],
            ],
            "igg",
          );
        });

        expect(buffer.getText()).toBe("hey\nworms\r\nhow are you digging?");

        // subsequent changes are not included in the transaction
        buffer.setTextInRange(
          [
            [1, 0],
            [1, 0],
          ],
          "little ",
        );
        buffer.undo();
        expect(buffer.getText()).toBe("hey\nworms\r\nhow are you digging?");

        // this should undo all changes in the transaction
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        // previous changes are not included in the transaction
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

        buffer.redo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        // this should redo all changes in the transaction
        buffer.redo();
        expect(buffer.getText()).toBe("hey\nworms\r\nhow are you digging?");

        // this should redo the change following the transaction
        buffer.redo();
        expect(buffer.getText()).toBe("hey\nlittle worms\r\nhow are you digging?");
      });

      it("does not push the transaction to the undo stack if it is empty", function () {
        buffer.transact(function () {});
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

        buffer.redo();
        buffer.transact(() => buffer.abortTransaction());
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");
      });

      it("halts execution undoes all operations since the beginning of the transaction if ::abortTransaction() is called", function () {
        let continuedPastAbort = false;
        buffer.transact(function () {
          buffer.setTextInRange(
            [
              [0, 2],
              [0, 5],
            ],
            "y",
          );
          buffer.setTextInRange(
            [
              [2, 13],
              [2, 14],
            ],
            "igg",
          );
          buffer.abortTransaction();
          continuedPastAbort = true;
        });

        expect(continuedPastAbort).toBe(false);

        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

        buffer.redo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        buffer.redo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");
      });

      it("preserves the redo stack until a content change occurs", function () {
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

        // no changes occur in this transaction before aborting
        buffer.transact(function () {
          buffer.markRange([
            [0, 0],
            [0, 5],
          ]);
          buffer.abortTransaction();
          buffer.setTextInRange(
            [
              [0, 0],
              [0, 5],
            ],
            "hey",
          );
        });

        buffer.redo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

        buffer.transact(function () {
          buffer.setTextInRange(
            [
              [0, 0],
              [0, 5],
            ],
            "hey",
          );
          buffer.abortTransaction();
        });
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");

        buffer.redo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");
      });

      it("allows nested transactions", function () {
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        buffer.transact(function () {
          buffer.setTextInRange(
            [
              [0, 2],
              [0, 5],
            ],
            "y",
          );
          buffer.transact(function () {
            buffer.setTextInRange(
              [
                [2, 13],
                [2, 14],
              ],
              "igg",
            );
            buffer.setTextInRange(
              [
                [2, 18],
                [2, 19],
              ],
              "'",
            );
          });
          expect(buffer.getText()).toBe("hey\nworms\r\nhow are you diggin'?");
          buffer.undo();
          expect(buffer.getText()).toBe("hey\nworms\r\nhow are you doing?");
          buffer.redo();
          expect(buffer.getText()).toBe("hey\nworms\r\nhow are you diggin'?");
        });

        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        buffer.redo();
        expect(buffer.getText()).toBe("hey\nworms\r\nhow are you diggin'?");

        buffer.undo();
        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworld\r\nhow are you doing?");
      });

      it("groups adjacent transactions within each other's grouping intervals", function () {
        now += 1000;
        buffer.transact(101, () =>
          buffer.setTextInRange(
            [
              [0, 2],
              [0, 5],
            ],
            "y",
          ),
        );

        now += 100;
        buffer.transact(201, () =>
          buffer.setTextInRange(
            [
              [0, 3],
              [0, 3],
            ],
            "yy",
          ),
        );

        now += 200;
        buffer.transact(201, () =>
          buffer.setTextInRange(
            [
              [0, 5],
              [0, 5],
            ],
            "yy",
          ),
        );

        // not grouped because the previous transaction's grouping interval
        // is only 200ms and we've advanced 300ms
        now += 300;
        buffer.transact(301, () =>
          buffer.setTextInRange(
            [
              [0, 7],
              [0, 7],
            ],
            "!!",
          ),
        );

        expect(buffer.getText()).toBe("heyyyyy!!\nworms\r\nhow are you doing?");

        buffer.undo();
        expect(buffer.getText()).toBe("heyyyyy\nworms\r\nhow are you doing?");

        buffer.undo();
        expect(buffer.getText()).toBe("hello\nworms\r\nhow are you doing?");

        buffer.redo();
        expect(buffer.getText()).toBe("heyyyyy\nworms\r\nhow are you doing?");

        buffer.redo();
        expect(buffer.getText()).toBe("heyyyyy!!\nworms\r\nhow are you doing?");
      });

      it("allows undo/redo within transactions, but not beyond the start of the containing transaction", function () {
        buffer.setText("");
        buffer.markPosition([0, 0]);

        buffer.append("a");

        buffer.transact(function () {
          buffer.append("b");
          buffer.transact(() => buffer.append("c"));
          buffer.append("d");

          expect(buffer.undo()).toBe(true);
          expect(buffer.getText()).toBe("abc");

          expect(buffer.undo()).toBe(true);
          expect(buffer.getText()).toBe("ab");

          expect(buffer.undo()).toBe(true);
          expect(buffer.getText()).toBe("a");

          expect(buffer.undo()).toBe(false);
          expect(buffer.getText()).toBe("a");

          expect(buffer.redo()).toBe(true);
          expect(buffer.getText()).toBe("ab");

          expect(buffer.redo()).toBe(true);
          expect(buffer.getText()).toBe("abc");

          expect(buffer.redo()).toBe(true);
          expect(buffer.getText()).toBe("abcd");

          expect(buffer.redo()).toBe(false);
          expect(buffer.getText()).toBe("abcd");
        });

        expect(buffer.undo()).toBe(true);
        expect(buffer.getText()).toBe("a");
      });

      it("does not error if the buffer is destroyed in a change callback within the transaction", function () {
        buffer.onDidChange(() => buffer.destroy());
        const result = buffer.transact(function () {
          buffer.append("!");
          return "hi";
        });
        expect(result).toBe("hi");
      });
    });
  });

  describe("checkpoints", function () {
    beforeEach(() => (buffer = new TextBuffer()));

    describe("::getChangesSinceCheckpoint(checkpoint)", function () {
      it("returns a list of changes that have been made since the checkpoint", function () {
        buffer.setText("abc\ndef\nghi\njkl\n");
        buffer.append("mno\n");
        const checkpoint = buffer.createCheckpoint();
        buffer.transact(function () {
          buffer.append("pqr\n");
          buffer.append("stu\n");
        });
        buffer.append("vwx\n");
        buffer.setTextInRange(
          [
            [1, 0],
            [1, 2],
          ],
          "yz",
        );

        expect(buffer.getText()).toBe("abc\nyzf\nghi\njkl\nmno\npqr\nstu\nvwx\n");
        assertChangesEqual(buffer.getChangesSinceCheckpoint(checkpoint), [
          {
            oldRange: [
              [1, 0],
              [1, 2],
            ],
            newRange: [
              [1, 0],
              [1, 2],
            ],
            oldText: "de",
            newText: "yz",
          },
          {
            oldRange: [
              [5, 0],
              [5, 0],
            ],
            newRange: [
              [5, 0],
              [8, 0],
            ],
            oldText: "",
            newText: "pqr\nstu\nvwx\n",
          },
        ]);
      });

      it("returns an empty list of changes when no change has been made since the checkpoint", function () {
        const checkpoint = buffer.createCheckpoint();
        expect(buffer.getChangesSinceCheckpoint(checkpoint)).toEqual([]);
      });

      it("returns an empty list of changes when the checkpoint doesn't exist", function () {
        buffer.transact(function () {
          buffer.append("abc\n");
          buffer.append("def\n");
        });
        buffer.append("ghi\n");
        expect(buffer.getChangesSinceCheckpoint(-1)).toEqual([]);
      });
    });

    describe("::revertToCheckpoint(checkpoint)", () =>
      it("undoes all changes following the checkpoint", function () {
        buffer.append("hello");
        const checkpoint = buffer.createCheckpoint();

        buffer.transact(function () {
          buffer.append("\n");
          buffer.append("world");
        });

        buffer.append("\n");
        buffer.append("how are you?");

        const result = buffer.revertToCheckpoint(checkpoint);
        expect(result).toBe(true);
        expect(buffer.getText()).toBe("hello");

        buffer.redo();
        expect(buffer.getText()).toBe("hello");
      }));

    describe("::groupChangesSinceCheckpoint(checkpoint)", function () {
      it("combines all changes since the checkpoint into a single transaction", function () {
        const historyLayer = buffer.addMarkerLayer({ maintainHistory: true });

        buffer.append("one\n");
        const marker = historyLayer.markRange([
          [0, 1],
          [0, 2],
        ]);
        marker.setProperties({ a: "b" });

        const checkpoint = buffer.createCheckpoint();
        buffer.append("two\n");
        buffer.transact(function () {
          buffer.append("three\n");
          buffer.append("four");
        });

        marker.setRange([
          [0, 1],
          [2, 3],
        ]);
        marker.setProperties({ a: "c" });
        const result = buffer.groupChangesSinceCheckpoint(checkpoint);

        expect(result).toBeTruthy();
        expect(buffer.getText()).toBe(`\
one
two
three
four\
`);
        expect(marker.getRange()).toEqual([
          [0, 1],
          [2, 3],
        ]);
        expect(marker.getProperties()).toEqual({ a: "c" });

        buffer.undo();
        expect(buffer.getText()).toBe("one\n");
        expect(marker.getRange()).toEqual([
          [0, 1],
          [0, 2],
        ]);
        expect(marker.getProperties()).toEqual({ a: "b" });

        buffer.redo();
        expect(buffer.getText()).toBe(`\
one
two
three
four\
`);
        expect(marker.getRange()).toEqual([
          [0, 1],
          [2, 3],
        ]);
        expect(marker.getProperties()).toEqual({ a: "c" });
      });

      it("skips any later checkpoints when grouping changes", function () {
        buffer.append("one\n");
        const checkpoint = buffer.createCheckpoint();
        buffer.append("two\n");
        const checkpoint2 = buffer.createCheckpoint();
        buffer.append("three");

        buffer.groupChangesSinceCheckpoint(checkpoint);
        expect(buffer.revertToCheckpoint(checkpoint2)).toBe(false);

        expect(buffer.getText()).toBe(`\
one
two
three\
`);

        buffer.undo();
        expect(buffer.getText()).toBe("one\n");

        buffer.redo();
        expect(buffer.getText()).toBe(`\
one
two
three\
`);
      });

      it("does nothing when no changes have been made since the checkpoint", function () {
        buffer.append("one\n");
        const checkpoint = buffer.createCheckpoint();
        const result = buffer.groupChangesSinceCheckpoint(checkpoint);
        expect(result).toBeTruthy();
        buffer.undo();
        expect(buffer.getText()).toBe("");
      });

      it("returns false and does nothing when the checkpoint is not in the buffer's history", function () {
        buffer.append("hello\n");
        const checkpoint = buffer.createCheckpoint();
        buffer.undo();
        buffer.append("world");
        const result = buffer.groupChangesSinceCheckpoint(checkpoint);
        expect(result).toBeFalsy();
        buffer.undo();
        expect(buffer.getText()).toBe("");
      });
    });

    it("skips checkpoints when undoing", function () {
      buffer.append("hello");
      buffer.createCheckpoint();
      buffer.createCheckpoint();
      buffer.createCheckpoint();
      buffer.undo();
      expect(buffer.getText()).toBe("");
    });

    it("preserves checkpoints across undo and redo", function () {
      buffer.append("a");
      buffer.append("b");
      const checkpoint1 = buffer.createCheckpoint();
      buffer.append("c");
      const checkpoint2 = buffer.createCheckpoint();

      buffer.undo();
      expect(buffer.getText()).toBe("ab");

      buffer.redo();
      expect(buffer.getText()).toBe("abc");

      buffer.append("d");

      expect(buffer.revertToCheckpoint(checkpoint2)).toBe(true);
      expect(buffer.getText()).toBe("abc");
      expect(buffer.revertToCheckpoint(checkpoint1)).toBe(true);
      expect(buffer.getText()).toBe("ab");
    });

    it("handles checkpoints created when there have been no changes", function () {
      const checkpoint = buffer.createCheckpoint();
      buffer.undo();
      buffer.append("hello");
      buffer.revertToCheckpoint(checkpoint);
      expect(buffer.getText()).toBe("");
    });

    it("returns false when the checkpoint is not in the buffer's history", function () {
      buffer.append("hello\n");
      const checkpoint = buffer.createCheckpoint();
      buffer.undo();
      buffer.append("world");
      expect(buffer.revertToCheckpoint(checkpoint)).toBe(false);
      expect(buffer.getText()).toBe("world");
    });

    it("does not allow changes based on checkpoints outside of the current transaction", function () {
      const checkpoint = buffer.createCheckpoint();

      buffer.append("a");

      buffer.transact(function () {
        expect(buffer.revertToCheckpoint(checkpoint)).toBe(false);
        expect(buffer.getText()).toBe("a");

        buffer.append("b");

        expect(buffer.groupChangesSinceCheckpoint(checkpoint)).toBeFalsy();
      });

      buffer.undo();
      expect(buffer.getText()).toBe("a");
    });
  });

  describe("::groupLastChanges()", () =>
    it("groups the last two changes into a single transaction", function () {
      buffer = new TextBuffer();
      const layer = buffer.addMarkerLayer({ maintainHistory: true });

      buffer.append("a");

      // Group two transactions, ensure before/after markers snapshots are preserved
      const marker = layer.markPosition([0, 0]);
      buffer.transact(() => buffer.append("b"));
      buffer.createCheckpoint();
      buffer.transact(function () {
        buffer.append("ccc");
        marker.setHeadPosition([0, 2]);
      });

      expect(buffer.groupLastChanges()).toBe(true);
      buffer.undo();
      expect(marker.getHeadPosition()).toEqual([0, 0]);
      expect(buffer.getText()).toBe("a");
      buffer.redo();
      expect(marker.getHeadPosition()).toEqual([0, 2]);
      buffer.undo();

      // Group two bare changes
      buffer.transact(function () {
        buffer.append("b");
        buffer.createCheckpoint();
        buffer.append("c");
        expect(buffer.groupLastChanges()).toBe(true);
        buffer.undo();
        expect(buffer.getText()).toBe("a");
      });

      // Group a transaction with a bare change
      buffer.transact(function () {
        buffer.transact(function () {
          buffer.append("b");
          buffer.append("c");
        });
        buffer.append("d");
        expect(buffer.groupLastChanges()).toBe(true);
        buffer.undo();
        expect(buffer.getText()).toBe("a");
      });

      // Group a bare change with a transaction
      buffer.transact(function () {
        buffer.append("b");
        buffer.transact(function () {
          buffer.append("c");
          buffer.append("d");
        });
        expect(buffer.groupLastChanges()).toBe(true);
        buffer.undo();
        expect(buffer.getText()).toBe("a");
      });

      // Can't group past the beginning of an open transaction
      buffer.transact(function () {
        expect(buffer.groupLastChanges()).toBe(false);
        buffer.append("b");
        expect(buffer.groupLastChanges()).toBe(false);
        buffer.append("c");
        expect(buffer.groupLastChanges()).toBe(true);
        buffer.undo();
        expect(buffer.getText()).toBe("a");
      });
    }));

  describe("::setHistoryProvider(provider)", () =>
    it("replaces the currently active history provider with the passed one", function () {
      buffer = new TextBuffer({ text: "" });
      buffer.insert([0, 0], "Lorem ");
      buffer.insert([0, 6], "ipsum ");
      expect(buffer.getText()).toBe("Lorem ipsum ");

      buffer.undo();
      expect(buffer.getText()).toBe("Lorem ");

      buffer.setHistoryProvider(new DefaultHistoryProvider(buffer));
      buffer.undo();
      expect(buffer.getText()).toBe("Lorem ");

      buffer.insert([0, 6], "dolor ");
      expect(buffer.getText()).toBe("Lorem dolor ");

      buffer.undo();
      expect(buffer.getText()).toBe("Lorem ");
    }));

  describe("::getHistory(maxEntries) and restoreDefaultHistoryProvider(history)", function () {
    it("returns a base text and the state of the last `maxEntries` entries in the undo and redo stacks", function () {
      buffer = new TextBuffer({ text: "" });
      const markerLayer = buffer.addMarkerLayer({ maintainHistory: true });

      buffer.append("Lorem ");
      buffer.append("ipsum ");
      buffer.append("dolor ");
      markerLayer.markPosition([0, 2]);
      const markersSnapshotAtCheckpoint1 = buffer.createMarkerSnapshot();
      const checkpoint1 = buffer.createCheckpoint();
      buffer.append("sit ");
      buffer.append("amet ");
      buffer.append("consecteur ");
      markerLayer.markPosition([0, 4]);
      const markersSnapshotAtCheckpoint2 = buffer.createMarkerSnapshot();
      const checkpoint2 = buffer.createCheckpoint();
      buffer.append("adipiscit ");
      buffer.append("elit ");
      buffer.undo();
      buffer.undo();
      buffer.undo();

      const history = buffer.getHistory(3);
      expect(history.baseText).toBe("Lorem ipsum dolor ");
      expect(history.nextCheckpointId).toBe(buffer.createCheckpoint());
      expect(history.undoStack).toEqual([
        {
          type: "checkpoint",
          id: checkpoint1,
          markers: markersSnapshotAtCheckpoint1,
        },
        {
          type: "transaction",
          changes: [
            {
              oldStart: Point(0, 18),
              oldEnd: Point(0, 18),
              newStart: Point(0, 18),
              newEnd: Point(0, 22),
              oldText: "",
              newText: "sit ",
            },
          ],
          markersBefore: markersSnapshotAtCheckpoint1,
          markersAfter: markersSnapshotAtCheckpoint1,
        },
        {
          type: "transaction",
          changes: [
            {
              oldStart: Point(0, 22),
              oldEnd: Point(0, 22),
              newStart: Point(0, 22),
              newEnd: Point(0, 27),
              oldText: "",
              newText: "amet ",
            },
          ],
          markersBefore: markersSnapshotAtCheckpoint1,
          markersAfter: markersSnapshotAtCheckpoint1,
        },
      ]);
      expect(history.redoStack).toEqual([
        {
          type: "transaction",
          changes: [
            {
              oldStart: Point(0, 38),
              oldEnd: Point(0, 38),
              newStart: Point(0, 38),
              newEnd: Point(0, 48),
              oldText: "",
              newText: "adipiscit ",
            },
          ],
          markersBefore: markersSnapshotAtCheckpoint2,
          markersAfter: markersSnapshotAtCheckpoint2,
        },
        {
          type: "checkpoint",
          id: checkpoint2,
          markers: markersSnapshotAtCheckpoint2,
        },
        {
          type: "transaction",
          changes: [
            {
              oldStart: Point(0, 27),
              oldEnd: Point(0, 27),
              newStart: Point(0, 27),
              newEnd: Point(0, 38),
              oldText: "",
              newText: "consecteur ",
            },
          ],
          markersBefore: markersSnapshotAtCheckpoint1,
          markersAfter: markersSnapshotAtCheckpoint1,
        },
      ]);

      buffer.createCheckpoint();
      buffer.append("x");
      buffer.undo();
      buffer.clearUndoStack();

      expect(buffer.getHistory()).not.toEqual(history);
      buffer.restoreDefaultHistoryProvider(history);
      expect(buffer.getHistory()).toEqual(history);
    });

    it("throws an error when called within a transaction", function () {
      buffer = new TextBuffer();
      expect(() => buffer.transact(() => buffer.getHistory(3))).toThrowError();
    });
  });

  describe("::getTextInRange(range)", function () {
    it("returns the text in a given range", function () {
      buffer = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" });
      expect(
        buffer.getTextInRange([
          [1, 1],
          [1, 4],
        ]),
      ).toBe("orl");
      expect(
        buffer.getTextInRange([
          [0, 3],
          [2, 3],
        ]),
      ).toBe("lo\nworld\r\nhow");
      expect(
        buffer.getTextInRange([
          [0, 0],
          [2, 18],
        ]),
      ).toBe(buffer.getText());
    });

    it("clips the given range", function () {
      buffer = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" });
      expect(
        buffer.getTextInRange([
          [-100, -100],
          [100, 100],
        ]),
      ).toBe(buffer.getText());
    });
  });

  describe("::clipPosition(position)", function () {
    it("returns a valid position closest to the given position", function () {
      buffer = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" });
      expect(buffer.clipPosition([-1, -1])).toEqual([0, 0]);
      expect(buffer.clipPosition([-1, 2])).toEqual([0, 0]);
      expect(buffer.clipPosition([0, -1])).toEqual([0, 0]);
      expect(buffer.clipPosition([0, 20])).toEqual([0, 5]);
      expect(buffer.clipPosition([1, -1])).toEqual([1, 0]);
      expect(buffer.clipPosition([1, 20])).toEqual([1, 5]);
      expect(buffer.clipPosition([10, 0])).toEqual([2, 18]);
      expect(buffer.clipPosition([Infinity, 0])).toEqual([2, 18]);
    });

    it("throws an error when given an invalid point", function () {
      buffer = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" });
      expect(() => buffer.clipPosition([NaN, 1])).toThrowError("Invalid Point: (NaN, 1)");
      expect(() => buffer.clipPosition([0, NaN])).toThrowError("Invalid Point: (0, NaN)");
      expect(() => buffer.clipPosition([0, {}])).toThrowError(
        "Invalid Point: (0, [object Object])",
      );
    });
  });

  describe("::characterIndexForPosition(position)", function () {
    beforeEach(() => (buffer = new TextBuffer({ text: "zero\none\r\ntwo\nthree" })));

    it("returns the absolute character offset for the given position", function () {
      expect(buffer.characterIndexForPosition([0, 0])).toBe(0);
      expect(buffer.characterIndexForPosition([0, 1])).toBe(1);
      expect(buffer.characterIndexForPosition([0, 4])).toBe(4);
      expect(buffer.characterIndexForPosition([1, 0])).toBe(5);
      expect(buffer.characterIndexForPosition([1, 1])).toBe(6);
      expect(buffer.characterIndexForPosition([1, 3])).toBe(8);
      expect(buffer.characterIndexForPosition([2, 0])).toBe(10);
      expect(buffer.characterIndexForPosition([2, 1])).toBe(11);
      expect(buffer.characterIndexForPosition([3, 0])).toBe(14);
      expect(buffer.characterIndexForPosition([3, 5])).toBe(19);
    });

    it("clips the given position before translating", function () {
      expect(buffer.characterIndexForPosition([-1, -1])).toBe(0);
      expect(buffer.characterIndexForPosition([1, 100])).toBe(8);
      expect(buffer.characterIndexForPosition([100, 100])).toBe(19);
    });
  });

  describe("::positionForCharacterIndex(offset)", function () {
    beforeEach(() => (buffer = new TextBuffer({ text: "zero\none\r\ntwo\nthree" })));

    it("returns the position for the given absolute character offset", function () {
      expect(buffer.positionForCharacterIndex(0)).toEqual([0, 0]);
      expect(buffer.positionForCharacterIndex(1)).toEqual([0, 1]);
      expect(buffer.positionForCharacterIndex(4)).toEqual([0, 4]);
      expect(buffer.positionForCharacterIndex(5)).toEqual([1, 0]);
      expect(buffer.positionForCharacterIndex(6)).toEqual([1, 1]);
      expect(buffer.positionForCharacterIndex(8)).toEqual([1, 3]);
      expect(buffer.positionForCharacterIndex(10)).toEqual([2, 0]);
      expect(buffer.positionForCharacterIndex(11)).toEqual([2, 1]);
      expect(buffer.positionForCharacterIndex(14)).toEqual([3, 0]);
      expect(buffer.positionForCharacterIndex(19)).toEqual([3, 5]);
    });

    it("clips the given offset before translating", function () {
      expect(buffer.positionForCharacterIndex(-1)).toEqual([0, 0]);
      expect(buffer.positionForCharacterIndex(20)).toEqual([3, 5]);
    });
  });

  describe("serialization", function () {
    const expectSameMarkers = function (left, right) {
      const markers1 = left.getMarkers().sort((a, b) => a.compare(b));
      const markers2 = right.getMarkers().sort((a, b) => a.compare(b));
      expect(markers1.length).toBe(markers2.length);
      for (let i = 0; i < markers1.length; i++) {
        var marker1 = markers1[i];
        expect(marker1).toEqual(markers2[i]);
      }
    };

    it("can serialize / deserialize the buffer along with its history, marker layers, and display layers", function (done) {
      const bufferA = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" });
      const displayLayer1A = bufferA.addDisplayLayer();
      const displayLayer2A = bufferA.addDisplayLayer();
      displayLayer1A.foldBufferRange([
        [0, 1],
        [0, 3],
      ]);
      displayLayer2A.foldBufferRange([
        [0, 0],
        [0, 2],
      ]);
      bufferA.createCheckpoint();
      bufferA.setTextInRange(
        [
          [0, 5],
          [0, 5],
        ],
        " there",
      );
      bufferA.transact(() =>
        bufferA.setTextInRange(
          [
            [1, 0],
            [1, 5],
          ],
          "friend",
        ),
      );
      const layerA = bufferA.addMarkerLayer({ maintainHistory: true, persistent: true });
      layerA.markRange(
        [
          [0, 6],
          [0, 8],
        ],
        { reversed: true, foo: 1 },
      );
      const layerB = bufferA.addMarkerLayer({
        maintainHistory: true,
        persistent: true,
        role: "selections",
      });
      const marker2A = bufferA.markPosition([2, 2], { bar: 2 });
      bufferA.transact(function () {
        bufferA.setTextInRange(
          [
            [1, 0],
            [1, 0],
          ],
          "good ",
        );
        bufferA.append("?");
        marker2A.setProperties({ bar: 3, baz: 4 });
      });
      layerA.markRange(
        [
          [0, 4],
          [0, 5],
        ],
        { invalidate: "inside" },
      );
      bufferA.setTextInRange(
        [
          [0, 5],
          [0, 5],
        ],
        "oo",
      );
      bufferA.undo();

      const state = JSON.parse(JSON.stringify(bufferA.serialize()));
      TextBuffer.deserialize(state).then(function (bufferB) {
        expect(bufferB.getText()).toBe("hello there\ngood friend\r\nhow are you doing??");
        expectSameMarkers(bufferB.getMarkerLayer(layerA.id), layerA);
        expect(
          bufferB.getDisplayLayer(displayLayer1A.id).foldsIntersectingBufferRange([
            [0, 1],
            [0, 3],
          ]).length,
        ).toBe(1);
        expect(
          bufferB.getDisplayLayer(displayLayer2A.id).foldsIntersectingBufferRange([
            [0, 0],
            [0, 2],
          ]).length,
        ).toBe(1);
        const displayLayer3B = bufferB.addDisplayLayer();
        expect(displayLayer3B.id).toBeGreaterThan(displayLayer1A.id);
        expect(displayLayer3B.id).toBeGreaterThan(displayLayer2A.id);

        expect(bufferB.getMarkerLayer(layerB.id).getRole()).toBe("selections");
        expect(bufferB.selectionsMarkerLayerIds.has(layerB.id)).toBe(true);
        expect(bufferB.selectionsMarkerLayerIds.size).toBe(1);

        bufferA.redo();
        bufferB.redo();
        expect(bufferB.getText()).toBe("hellooo there\ngood friend\r\nhow are you doing??");
        expectSameMarkers(bufferB.getMarkerLayer(layerA.id), layerA);
        expect(bufferB.getMarkerLayer(layerA.id).maintainHistory).toBe(true);
        expect(bufferB.getMarkerLayer(layerA.id).persistent).toBe(true);

        bufferA.undo();
        bufferB.undo();
        expect(bufferB.getText()).toBe("hello there\ngood friend\r\nhow are you doing??");
        expectSameMarkers(bufferB.getMarkerLayer(layerA.id), layerA);

        bufferA.undo();
        bufferB.undo();
        expect(bufferB.getText()).toBe("hello there\nfriend\r\nhow are you doing?");
        expectSameMarkers(bufferB.getMarkerLayer(layerA.id), layerA);

        bufferA.undo();
        bufferB.undo();
        expect(bufferB.getText()).toBe("hello there\nworld\r\nhow are you doing?");
        expectSameMarkers(bufferB.getMarkerLayer(layerA.id), layerA);

        bufferA.undo();
        bufferB.undo();
        expect(bufferB.getText()).toBe("hello\nworld\r\nhow are you doing?");
        expectSameMarkers(bufferB.getMarkerLayer(layerA.id), layerA);

        // Accounts for deserialized markers when selecting the next marker's id
        const marker3A = layerA.markRange([
          [0, 1],
          [2, 3],
        ]);
        const marker3B = bufferB.getMarkerLayer(layerA.id).markRange([
          [0, 1],
          [2, 3],
        ]);
        expect(marker3B.id).toBe(marker3A.id);

        // Doesn't try to reload the buffer since it has no file.
        setTimeout(function () {
          expect(bufferB.getText()).toBe("hello\nworld\r\nhow are you doing?");
          done();
        }, 50);
      });
    });

    it("serializes / deserializes the buffer's persistent custom marker layers", function (done) {
      const bufferA = new TextBuffer("abcdefghijklmnopqrstuvwxyz");

      const layer1A = bufferA.addMarkerLayer();
      const layer2A = bufferA.addMarkerLayer({ persistent: true });

      layer1A.markRange([
        [0, 1],
        [0, 2],
      ]);
      layer1A.markRange([
        [0, 3],
        [0, 4],
      ]);

      layer2A.markRange([
        [0, 5],
        [0, 6],
      ]);
      layer2A.markRange([
        [0, 7],
        [0, 8],
      ]);

      TextBuffer.deserialize(JSON.parse(JSON.stringify(bufferA.serialize()))).then(
        function (bufferB) {
          const layer1B = bufferB.getMarkerLayer(layer1A.id);
          const layer2B = bufferB.getMarkerLayer(layer2A.id);
          expect(layer2B.persistent).toBe(true);

          expect(layer1B).toBe(undefined);
          expectSameMarkers(layer2A, layer2B);
          done();
        },
      );
    });

    it("doesn't serialize the default marker layer", function (done) {
      const bufferA = new TextBuffer({ text: "hello\nworld\r\nhow are you doing?" });
      bufferA.getDefaultMarkerLayer();
      const marker1A = bufferA.markRange(
        [
          [0, 1],
          [1, 2],
        ],
        { foo: 1 },
      );

      TextBuffer.deserialize(bufferA.serialize()).then(function (bufferB) {
        bufferB.getDefaultMarkerLayer();
        expect(bufferB.getMarker(marker1A.id)).toBeUndefined();
        done();
      });
    });

    it("doesn't attempt to serialize snapshots for destroyed marker layers", function () {
      buffer = new TextBuffer({ text: "abc" });
      const markerLayer = buffer.addMarkerLayer({ maintainHistory: true, persistent: true });
      markerLayer.markPosition([0, 3]);
      buffer.insert([0, 0], "x");
      markerLayer.destroy();

      expect(() => buffer.serialize()).not.toThrowError();
    });

    it("doesn't remember marker layers when calling serialize with {markerLayers: false}", function (done) {
      const bufferA = new TextBuffer({ text: "world" });
      const layerA = bufferA.addMarkerLayer({ maintainHistory: true });
      const markerA = layerA.markPosition([0, 3]);
      let markerB = null;
      bufferA.transact(function () {
        bufferA.insert([0, 0], "hello ");
        markerB = layerA.markPosition([0, 5]);
      });
      bufferA.undo();

      TextBuffer.deserialize(bufferA.serialize({ markerLayers: false })).then(function (bufferB) {
        expect(bufferB.getText()).toBe("world");
        expect(bufferB.getMarkerLayer(layerA.id)?.getMarker(markerA.id)).toBeUndefined();
        expect(bufferB.getMarkerLayer(layerA.id)?.getMarker(markerB.id)).toBeUndefined();

        bufferB.redo();
        expect(bufferB.getText()).toBe("hello world");
        expect(bufferB.getMarkerLayer(layerA.id)?.getMarker(markerA.id)).toBeUndefined();
        expect(bufferB.getMarkerLayer(layerA.id)?.getMarker(markerB.id)).toBeUndefined();

        bufferB.undo();
        expect(bufferB.getText()).toBe("world");
        expect(bufferB.getMarkerLayer(layerA.id)?.getMarker(markerA.id)).toBeUndefined();
        expect(bufferB.getMarkerLayer(layerA.id)?.getMarker(markerB.id)).toBeUndefined();
        done();
      });
    });

    it("doesn't remember history when calling serialize with {history: false}", function (done) {
      const bufferA = new TextBuffer({ text: "abc" });
      bufferA.append("def");
      bufferA.append("ghi");

      TextBuffer.deserialize(bufferA.serialize({ history: false })).then(function (bufferB) {
        expect(bufferB.getText()).toBe("abcdefghi");
        expect(bufferB.undo()).toBe(false);
        expect(bufferB.getText()).toBe("abcdefghi");
        done();
      });
    });

    it("serializes / deserializes the buffer's unique identifier", function (done) {
      const bufferA = new TextBuffer();
      TextBuffer.deserialize(JSON.parse(JSON.stringify(bufferA.serialize()))).then(
        function (bufferB) {
          expect(bufferB.getId()).toEqual(bufferA.getId());
          done();
        },
      );
    });

    it("doesn't deserialize a state that was serialized with a different buffer version", function (done) {
      const bufferA = new TextBuffer();
      const serializedBuffer = JSON.parse(JSON.stringify(bufferA.serialize()));
      serializedBuffer.version = 123456789;

      TextBuffer.deserialize(serializedBuffer).then(function (bufferB) {
        expect(bufferB).toBeUndefined();
        done();
      });
    });

    it("doesn't deserialize a state referencing a file that no longer exists", function (done) {
      const tempDir = fs.realpathSync(temp.mkdirSync("text-buffer"));
      const filePath = join(tempDir, "file.txt");
      fs.writeFileSync(filePath, "something\n");

      const bufferA = TextBuffer.loadSync(filePath);
      const state = bufferA.serialize();

      fs.unlinkSync(filePath);

      state.mustExist = true;
      TextBuffer.deserialize(state)
        .then(
          () => expect("serialization succeeded with mustExist: true").toBeUndefined(),
          (err) => expect(err.code).toBe("ENOENT"),
        )
        .then(done, done);
    });

    describe("when the serialized buffer was unsaved and had no path", () =>
      it("restores the previous unsaved state of the buffer", function (done) {
        buffer = new TextBuffer();
        buffer.setText("abc");

        TextBuffer.deserialize(buffer.serialize()).then(function (buffer2) {
          expect(buffer2.getPath()).toBeUndefined();
          expect(buffer2.getText()).toBe("abc");
          done();
        });
      }));
  });

  describe("::getRange()", () =>
    it("returns the range of the entire buffer text", function () {
      buffer = new TextBuffer("abc\ndef\nghi");
      expect(buffer.getRange()).toEqual([
        [0, 0],
        [2, 3],
      ]);
    }));

  describe("::getLength()", () =>
    it("returns the lenght of the entire buffer text", function () {
      buffer = new TextBuffer("abc\ndef\nghi");
      expect(buffer.getLength()).toBe("abc\ndef\nghi".length);
    }));

  describe("::rangeForRow(row, includeNewline)", function () {
    beforeEach(() => (buffer = new TextBuffer("this\nis a test\r\ntesting")));

    describe("if includeNewline is false (the default)", () =>
      it("returns a range from the beginning of the line to the end of the line", function () {
        expect(buffer.rangeForRow(0)).toEqual([
          [0, 0],
          [0, 4],
        ]);
        expect(buffer.rangeForRow(1)).toEqual([
          [1, 0],
          [1, 9],
        ]);
        expect(buffer.rangeForRow(2)).toEqual([
          [2, 0],
          [2, 7],
        ]);
      }));

    describe("if includeNewline is true", () =>
      it("returns a range from the beginning of the line to the beginning of the next (if it exists)", function () {
        expect(buffer.rangeForRow(0, true)).toEqual([
          [0, 0],
          [1, 0],
        ]);
        expect(buffer.rangeForRow(1, true)).toEqual([
          [1, 0],
          [2, 0],
        ]);
        expect(buffer.rangeForRow(2, true)).toEqual([
          [2, 0],
          [2, 7],
        ]);
      }));

    describe("if the given row is out of range", () =>
      it("returns the range of the nearest valid row", function () {
        expect(buffer.rangeForRow(-1)).toEqual([
          [0, 0],
          [0, 4],
        ]);
        expect(buffer.rangeForRow(10)).toEqual([
          [2, 0],
          [2, 7],
        ]);
      }));
  });

  describe("::onDidChangePath()", function () {
    let filePath, newPath, bufferToChange;

    beforeEach(function () {
      const tempDir = fs.realpathSync(temp.mkdirSync("text-buffer"));
      filePath = join(tempDir, "manipulate-me");
      newPath = `${filePath}-i-moved`;
      fs.writeFileSync(filePath, "");
      bufferToChange = TextBuffer.loadSync(filePath);
    });

    afterEach(function () {
      bufferToChange.destroy();
      fs.removeSync(filePath);
      fs.removeSync(newPath);
    });

    it("notifies observers when the buffer is saved to a new path", function (done) {
      bufferToChange.onDidChangePath(function (p) {
        expect(p).toBe(newPath);
        done();
      });
      bufferToChange.saveAs(newPath);
    });

    it("notifies observers when the buffer's file is moved", async function () {
      // FIXME: This doesn't pass on Linux
      if (["linux", "win32"].includes(process.platform)) {
        return;
      }

      // The file watcher arms asynchronously; wait for it before moving the file
      // so the rename is observed.
      await bufferToChange.getFileWatchStartPromise();

      const renamed = new Promise((resolve) => bufferToChange.onDidChangePath(resolve));

      fs.removeSync(newPath);
      fs.moveSync(filePath, newPath);

      expect(await renamed).toBe(newPath);
    });
  });

  // This spec is no longer needed because `onWillThrowWatchError` is a no-op.
  // `pathwatcher` can't fulfill the callback because it chooses not to reload
  // the entire file every time it changes (for performance reasons), hence it
  // stopped throwing this error a long time ago.
  //
  // (Indeed, this test is tautological, since it manually generates the event.)
  xdescribe("::onWillThrowWatchError", () =>
    it("notifies observers when the file has a watch error", function () {
      const filePath = temp.openSync("atom").path;
      fs.writeFileSync(filePath, "");

      buffer = TextBuffer.loadSync(filePath);

      const eventHandler = jasmine.createSpy("eventHandler");
      buffer.onWillThrowWatchError(eventHandler);

      buffer.file.emitter.emit("will-throw-watch-error", "arg");
      expect(eventHandler).toHaveBeenCalledWith("arg");
    }));

  describe("::getLines()", () =>
    it("returns an array of lines in the text contents", function () {
      const filePath = require.resolve("./fixtures/sample.js");
      const fileContents = fs.readFileSync(filePath, "utf8");
      buffer = TextBuffer.loadSync(filePath);
      expect(buffer.getLines().length).toBe(fileContents.split("\n").length);
      expect(buffer.getLines().join("\n")).toBe(fileContents);
    }));

  describe("::setTextInRange(range, string)", function () {
    let changeHandler = null;

    beforeEach(function (done) {
      const filePath = require.resolve("./fixtures/sample.js");
      fs.readFileSync(filePath, "utf8");
      TextBuffer.load(filePath).then(function (result) {
        buffer = result;
        changeHandler = jasmine.createSpy("changeHandler");
        buffer.onDidChange(changeHandler);
        done();
      });
    });

    describe("when used to insert (called with an empty range and a non-empty string)", function () {
      describe("when the given string has no newlines", () =>
        it("inserts the string at the location of the given range", function () {
          const range = [
            [3, 4],
            [3, 4],
          ];
          buffer.setTextInRange(range, "foo");

          expect(buffer.lineForRow(2)).toBe("    if (items.length <= 1) return items;");
          expect(buffer.lineForRow(3)).toBe(
            "    foovar pivot = items.shift(), current, left = [], right = [];",
          );
          expect(buffer.lineForRow(4)).toBe("    while(items.length > 0) {");

          expect(changeHandler).toHaveBeenCalled();
          const [event] = changeHandler.calls.allArgs()[0];
          expect(event.oldRange).toEqual(range);
          expect(event.newRange).toEqual([
            [3, 4],
            [3, 7],
          ]);
          expect(event.oldText).toBe("");
          expect(event.newText).toBe("foo");
        }));

      describe("when the given string has newlines", () =>
        it("inserts the lines at the location of the given range", function () {
          const range = [
            [3, 4],
            [3, 4],
          ];

          buffer.setTextInRange(range, "foo\n\nbar\nbaz");

          expect(buffer.lineForRow(2)).toBe("    if (items.length <= 1) return items;");
          expect(buffer.lineForRow(3)).toBe("    foo");
          expect(buffer.lineForRow(4)).toBe("");
          expect(buffer.lineForRow(5)).toBe("bar");
          expect(buffer.lineForRow(6)).toBe(
            "bazvar pivot = items.shift(), current, left = [], right = [];",
          );
          expect(buffer.lineForRow(7)).toBe("    while(items.length > 0) {");

          expect(changeHandler).toHaveBeenCalled();
          const [event] = changeHandler.calls.allArgs()[0];
          expect(event.oldRange).toEqual(range);
          expect(event.newRange).toEqual([
            [3, 4],
            [6, 3],
          ]);
          expect(event.oldText).toBe("");
          expect(event.newText).toBe("foo\n\nbar\nbaz");
        }));
    });

    describe("when used to remove (called with a non-empty range and an empty string)", function () {
      describe("when the range is contained within a single line", () =>
        it("removes the characters within the range", function () {
          const range = [
            [3, 4],
            [3, 7],
          ];
          buffer.setTextInRange(range, "");

          expect(buffer.lineForRow(2)).toBe("    if (items.length <= 1) return items;");
          expect(buffer.lineForRow(3)).toBe(
            "     pivot = items.shift(), current, left = [], right = [];",
          );
          expect(buffer.lineForRow(4)).toBe("    while(items.length > 0) {");

          expect(changeHandler).toHaveBeenCalled();
          const [event] = changeHandler.calls.allArgs()[0];
          expect(event.oldRange).toEqual(range);
          expect(event.newRange).toEqual([
            [3, 4],
            [3, 4],
          ]);
          expect(event.oldText).toBe("var");
          expect(event.newText).toBe("");
        }));

      describe("when the range spans 2 lines", () =>
        it("removes the characters within the range and joins the lines", function () {
          const range = [
            [3, 16],
            [4, 4],
          ];
          buffer.setTextInRange(range, "");

          expect(buffer.lineForRow(2)).toBe("    if (items.length <= 1) return items;");
          expect(buffer.lineForRow(3)).toBe("    var pivot = while(items.length > 0) {");
          expect(buffer.lineForRow(4)).toBe("      current = items.shift();");

          expect(changeHandler).toHaveBeenCalled();
          const [event] = changeHandler.calls.allArgs()[0];
          expect(event.oldRange).toEqual(range);
          expect(event.newRange).toEqual([
            [3, 16],
            [3, 16],
          ]);
          expect(event.oldText).toBe("items.shift(), current, left = [], right = [];\n    ");
          expect(event.newText).toBe("");
        }));

      describe("when the range spans more than 2 lines", () =>
        it("removes the characters within the range, joining the first and last line and removing the lines in-between", function () {
          buffer.setTextInRange(
            [
              [3, 16],
              [11, 9],
            ],
            "",
          );

          expect(buffer.lineForRow(2)).toBe("    if (items.length <= 1) return items;");
          expect(buffer.lineForRow(3)).toBe("    var pivot = sort(Array.apply(this, arguments));");
          expect(buffer.lineForRow(4)).toBe("};");
        }));
    });

    describe("when used to replace text with other text (called with non-empty range and non-empty string)", () =>
      it("replaces the old text with the new text", function () {
        const range = [
          [3, 16],
          [11, 9],
        ];
        const oldText = buffer.getTextInRange(range);

        buffer.setTextInRange(range, "foo\nbar");

        expect(buffer.lineForRow(2)).toBe("    if (items.length <= 1) return items;");
        expect(buffer.lineForRow(3)).toBe("    var pivot = foo");
        expect(buffer.lineForRow(4)).toBe("barsort(Array.apply(this, arguments));");
        expect(buffer.lineForRow(5)).toBe("};");

        expect(changeHandler).toHaveBeenCalled();
        const [event] = changeHandler.calls.allArgs()[0];
        expect(event.oldRange).toEqual(range);
        expect(event.newRange).toEqual([
          [3, 16],
          [4, 3],
        ]);
        expect(event.oldText).toBe(oldText);
        expect(event.newText).toBe("foo\nbar");
      }));

    it("allows a change to be undone safely from an ::onDidChange callback", function () {
      buffer.onDidChange(() => buffer.undo());
      buffer.setTextInRange(
        [
          [0, 0],
          [0, 0],
        ],
        "hello",
      );
      expect(buffer.lineForRow(0)).toBe("var quicksort = function () {");
    });
  });

  describe("::setText(text)", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    describe("when the buffer contains newlines", () =>
      it("changes the entire contents of the buffer and emits a change event", function () {
        const lastRow = buffer.getLastRow();
        const expectedPreRange = [
          [0, 0],
          [lastRow, buffer.lineForRow(lastRow).length],
        ];
        const changeHandler = jasmine.createSpy("changeHandler");
        buffer.onDidChange(changeHandler);

        const newText = "I know you are.\nBut what am I?";
        buffer.setText(newText);

        expect(buffer.getText()).toBe(newText);
        expect(changeHandler).toHaveBeenCalled();

        const [event] = changeHandler.calls.allArgs()[0];
        expect(event.newText).toBe(newText);
        expect(event.oldRange).toEqual(expectedPreRange);
        expect(event.newRange).toEqual([
          [0, 0],
          [1, 14],
        ]);
      }));

    describe("with windows newlines", () =>
      it("changes the entire contents of the buffer", function () {
        buffer = new TextBuffer("first\r\nlast");
        const lastRow = buffer.getLastRow();
        const expectedPreRange = [
          [0, 0],
          [lastRow, buffer.lineForRow(lastRow).length],
        ];
        const changeHandler = jasmine.createSpy("changeHandler");
        buffer.onDidChange(changeHandler);

        const newText = "new first\r\nnew last";
        buffer.setText(newText);

        expect(buffer.getText()).toBe(newText);
        expect(changeHandler).toHaveBeenCalled();

        const [event] = changeHandler.calls.allArgs()[0];
        expect(event.newText).toBe(newText);
        expect(event.oldRange).toEqual(expectedPreRange);
        expect(event.newRange).toEqual([
          [0, 0],
          [1, 8],
        ]);
      }));
  });

  describe("::setTextViaDiff(text)", function () {
    beforeEach(function (done) {
      const filePath = require.resolve("./fixtures/sample.js");
      TextBuffer.load(filePath).then(function (result) {
        buffer = result;
        done();
      });
    });

    it("can change the entire contents of the buffer when there are no newlines", function () {
      buffer.setText("BUFFER CHANGE");
      const newText = "DISK CHANGE";
      buffer.setTextViaDiff(newText);
      expect(buffer.getText()).toBe(newText);
    });

    it("can change a buffer that contains lone carriage returns", function () {
      const oldText = "one\rtwo\nthree\rfour\n";
      const newText = "one\rtwo and\nthree\rfour\n";
      buffer.setText(oldText);
      buffer.setTextViaDiff(newText);
      expect(buffer.getText()).toBe(newText);
      buffer.undo();
      expect(buffer.getText()).toBe(oldText);
    });

    it("preserves markers outside the changed regions", function () {
      buffer.setText("aaa\nbbb\nccc\nddd\neee");
      const layer = buffer.addMarkerLayer();
      const marker = layer.markRange([
        [3, 0],
        [3, 3],
      ]);
      buffer.setTextViaDiff("aaa\nBBB\nccc\nddd\neee");
      expect(buffer.getText()).toBe("aaa\nBBB\nccc\nddd\neee");
      expect(
        marker.getRange().isEqual([
          [3, 0],
          [3, 3],
        ]),
      ).toBe(true);
    });

    it("preserves markers on unchanged lines when the texts differ beyond the native edit-distance bound", function () {
      const oldLines = [];
      const newLines = [];
      for (let i = 0; i < 3000; i++) {
        oldLines.push(`line ${i}`);
        newLines.push(i < 1000 || i >= 2000 ? `LINE ${i}` : `line ${i}`);
      }
      buffer.setText(oldLines.join("\n"));
      const layer = buffer.addMarkerLayer();
      const marker = layer.markRange([
        [1500, 0],
        [1500, 4],
      ]);
      buffer.setTextViaDiff(newLines.join("\n"));
      expect(buffer.getText()).toBe(newLines.join("\n"));
      expect(
        marker.getRange().isEqual([
          [1500, 0],
          [1500, 4],
        ]),
      ).toBe(true);
    });

    describe("with standard newlines", function () {
      it("can change the entire contents of the buffer with no newline at the end", function () {
        const newText = "I know you are.\nBut what am I?";
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("can change the entire contents of the buffer with a newline at the end", function () {
        const newText = "I know you are.\nBut what am I?\n";
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("can change a few lines at the beginning in the buffer", function () {
        const newText = buffer.getText().replace(/function/g, "omgwow");
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("can change a few lines in the middle of the buffer", function () {
        const newText = buffer.getText().replace(/shift/g, "omgwow");
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("can adds a newline at the end", function () {
        const newText = buffer.getText() + "\n";
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });
    });

    describe("with windows newlines", function () {
      beforeEach(() => buffer.setText(buffer.getText().replace(/\n/g, "\r\n")));

      it("adds a newline at the end", function () {
        const newText = buffer.getText() + "\r\n";
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("changes the entire contents of the buffer with smaller content with no newline at the end", function () {
        const newText = "I know you are.\r\nBut what am I?";
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("changes the entire contents of the buffer with smaller content with newline at the end", function () {
        const newText = "I know you are.\r\nBut what am I?\r\n";
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("changes a few lines at the beginning in the buffer", function () {
        const newText = buffer.getText().replace(/function/g, "omgwow");
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });

      it("changes a few lines in the middle of the buffer", function () {
        const newText = buffer.getText().replace(/shift/g, "omgwow");
        buffer.setTextViaDiff(newText);
        expect(buffer.getText()).toBe(newText);
      });
    });
  });

  describe("::getTextInRange(range)", function () {
    beforeEach(function (done) {
      const filePath = require.resolve("./fixtures/sample.js");
      TextBuffer.load(filePath).then(function (result) {
        buffer = result;
        done();
      });
    });

    describe("when range is empty", () =>
      it("returns an empty string", function () {
        const range = [
          [1, 1],
          [1, 1],
        ];
        expect(buffer.getTextInRange(range)).toBe("");
      }));

    describe("when range spans one line", () =>
      it("returns characters in range", function () {
        let range = [
          [2, 8],
          [2, 13],
        ];
        expect(buffer.getTextInRange(range)).toBe("items");

        const lineLength = buffer.lineForRow(2).length;
        range = [
          [2, 0],
          [2, lineLength],
        ];
        expect(buffer.getTextInRange(range)).toBe("    if (items.length <= 1) return items;");
      }));

    describe("when range spans multiple lines", () =>
      it("returns characters in range (including newlines)", function () {
        let range = [
          [2, 0],
          [3, 0],
        ];
        expect(buffer.getTextInRange(range)).toBe("    if (items.length <= 1) return items;\n");

        range = [
          [2, 10],
          [4, 10],
        ];
        expect(buffer.getTextInRange(range)).toBe(
          "ems.length <= 1) return items;\n    var pivot = items.shift(), current, left = [], right = [];\n    while(",
        );
      }));

    describe("when the range starts before the start of the buffer", () =>
      it("clips the range to the start of the buffer", () =>
        expect(
          buffer.getTextInRange([
            [-Infinity, -Infinity],
            [0, Infinity],
          ]),
        ).toBe(buffer.lineForRow(0))));

    describe("when the range ends after the end of the buffer", () =>
      it("clips the range to the end of the buffer", () =>
        expect(buffer.getTextInRange([[12], [13, Infinity]])).toBe(buffer.lineForRow(12))));
  });

  describe("::scan(regex, fn)", function () {
    beforeEach(() => (buffer = TextBuffer.loadSync(require.resolve("./fixtures/sample.js"))));

    it("calls the given function with the information about each match", function () {
      const matches = [];
      buffer.scan(/current/g, (match) => matches.push(match));
      expect(matches.length).toBe(5);

      expect(matches[0].matchText).toBe("current");
      expect(matches[0].range).toEqual([
        [3, 31],
        [3, 38],
      ]);
      expect(matches[0].lineText).toBe(
        "    var pivot = items.shift(), current, left = [], right = [];",
      );
      expect(matches[0].lineTextOffset).toBe(0);
      expect(matches[0].leadingContextLines.length).toBe(0);
      expect(matches[0].trailingContextLines.length).toBe(0);

      expect(matches[1].matchText).toBe("current");
      expect(matches[1].range).toEqual([
        [5, 6],
        [5, 13],
      ]);
      expect(matches[1].lineText).toBe("      current = items.shift();");
      expect(matches[1].lineTextOffset).toBe(0);
      expect(matches[1].leadingContextLines.length).toBe(0);
      expect(matches[1].trailingContextLines.length).toBe(0);
    });

    it("calls the given function with the information about each match including context lines", function () {
      const matches = [];
      buffer.scan(
        /current/g,
        { leadingContextLineCount: 1, trailingContextLineCount: 2 },
        (match) => matches.push(match),
      );
      expect(matches.length).toBe(5);

      expect(matches[0].matchText).toBe("current");
      expect(matches[0].range).toEqual([
        [3, 31],
        [3, 38],
      ]);
      expect(matches[0].lineText).toBe(
        "    var pivot = items.shift(), current, left = [], right = [];",
      );
      expect(matches[0].lineTextOffset).toBe(0);
      expect(matches[0].leadingContextLines.length).toBe(1);
      expect(matches[0].leadingContextLines[0]).toBe("    if (items.length <= 1) return items;");
      expect(matches[0].trailingContextLines.length).toBe(2);
      expect(matches[0].trailingContextLines[0]).toBe("    while(items.length > 0) {");
      expect(matches[0].trailingContextLines[1]).toBe("      current = items.shift();");

      expect(matches[1].matchText).toBe("current");
      expect(matches[1].range).toEqual([
        [5, 6],
        [5, 13],
      ]);
      expect(matches[1].lineText).toBe("      current = items.shift();");
      expect(matches[1].lineTextOffset).toBe(0);
      expect(matches[1].leadingContextLines.length).toBe(1);
      expect(matches[1].leadingContextLines[0]).toBe("    while(items.length > 0) {");
      expect(matches[1].trailingContextLines.length).toBe(2);
      expect(matches[1].trailingContextLines[0]).toBe(
        "      current < pivot ? left.push(current) : right.push(current);",
      );
      expect(matches[1].trailingContextLines[1]).toBe("    }");
    });
  });

  describe("::backwardsScan(regex, fn)", function () {
    beforeEach(() => (buffer = TextBuffer.loadSync(require.resolve("./fixtures/sample.js"))));

    it("calls the given function with the information about each match in backwards order", function () {
      const matches = [];
      buffer.backwardsScan(/current/g, (match) => matches.push(match));
      expect(matches.length).toBe(5);

      expect(matches[0].matchText).toBe("current");
      expect(matches[0].range).toEqual([
        [6, 56],
        [6, 63],
      ]);
      expect(matches[0].lineText).toBe(
        "      current < pivot ? left.push(current) : right.push(current);",
      );
      expect(matches[0].lineTextOffset).toBe(0);
      expect(matches[0].leadingContextLines.length).toBe(0);
      expect(matches[0].trailingContextLines.length).toBe(0);

      expect(matches[1].matchText).toBe("current");
      expect(matches[1].range).toEqual([
        [6, 34],
        [6, 41],
      ]);
      expect(matches[1].lineText).toBe(
        "      current < pivot ? left.push(current) : right.push(current);",
      );
      expect(matches[1].lineTextOffset).toBe(0);
      expect(matches[1].leadingContextLines.length).toBe(0);
      expect(matches[1].trailingContextLines.length).toBe(0);
    });
  });

  describe("::scanInRange(range, regex, fn)", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    describe("when given a regex with a ignore case flag", () =>
      it("does a case-insensitive search", function () {
        const matches = [];
        buffer.scanInRange(
          /cuRRent/i,
          [
            [0, 0],
            [12, 0],
          ],
          ({ match, range: _range }) => matches.push(match),
        );
        expect(matches.length).toBe(1);
      }));

    describe("when given a regex with no global flag", () =>
      it("calls the iterator with the first match for the given regex in the given range", function () {
        const matches = [];
        const ranges = [];
        buffer.scanInRange(
          /cu(rr)ent/,
          [
            [4, 0],
            [6, 44],
          ],
          function ({ match, range }) {
            matches.push(match);
            ranges.push(range);
          },
        );

        expect(matches.length).toBe(1);
        expect(ranges.length).toBe(1);

        expect(matches[0][0]).toBe("current");
        expect(matches[0][1]).toBe("rr");
        expect(ranges[0]).toEqual([
          [5, 6],
          [5, 13],
        ]);
      }));

    describe("when given a regex with a global flag", () =>
      it("calls the iterator with each match for the given regex in the given range", function () {
        const matches = [];
        const ranges = [];
        buffer.scanInRange(
          /cu(rr)ent/g,
          [
            [4, 0],
            [6, 59],
          ],
          function ({ match, range }) {
            matches.push(match);
            ranges.push(range);
          },
        );

        expect(matches.length).toBe(3);
        expect(ranges.length).toBe(3);

        expect(matches[0][0]).toBe("current");
        expect(matches[0][1]).toBe("rr");
        expect(ranges[0]).toEqual([
          [5, 6],
          [5, 13],
        ]);

        expect(matches[1][0]).toBe("current");
        expect(matches[1][1]).toBe("rr");
        expect(ranges[1]).toEqual([
          [6, 6],
          [6, 13],
        ]);

        expect(matches[2][0]).toBe("current");
        expect(matches[2][1]).toBe("rr");
        expect(ranges[2]).toEqual([
          [6, 34],
          [6, 41],
        ]);
      }));

    describe("when the last regex match exceeds the end of the range", function () {
      describe("when the portion of the match within the range also matches the regex", () =>
        it("calls the iterator with the truncated match", function () {
          const matches = [];
          const ranges = [];
          buffer.scanInRange(
            /cu(r*)/g,
            [
              [4, 0],
              [6, 9],
            ],
            function ({ match, range }) {
              matches.push(match);
              ranges.push(range);
            },
          );

          expect(matches.length).toBe(2);
          expect(ranges.length).toBe(2);

          expect(matches[0][0]).toBe("curr");
          expect(matches[0][1]).toBe("rr");
          expect(ranges[0]).toEqual([
            [5, 6],
            [5, 10],
          ]);

          expect(matches[1][0]).toBe("cur");
          expect(matches[1][1]).toBe("r");
          expect(ranges[1]).toEqual([
            [6, 6],
            [6, 9],
          ]);
        }));

      describe("when the portion of the match within the range does not matches the regex", () =>
        it("does not call the iterator with the truncated match", function () {
          const matches = [];
          const ranges = [];
          buffer.scanInRange(
            /cu(r*)e/g,
            [
              [4, 0],
              [6, 9],
            ],
            function ({ match, range }) {
              matches.push(match);
              ranges.push(range);
            },
          );

          expect(matches.length).toBe(1);
          expect(ranges.length).toBe(1);

          expect(matches[0][0]).toBe("curre");
          expect(matches[0][1]).toBe("rr");
          expect(ranges[0]).toEqual([
            [5, 6],
            [5, 11],
          ]);
        }));
    });

    describe("when the iterator calls the 'replace' control function with a replacement string", function () {
      it("replaces each occurrence of the regex match with the string", function () {
        const ranges = [];
        buffer.scanInRange(
          /cu(rr)ent/g,
          [
            [4, 0],
            [6, 59],
          ],
          function ({ range, replace }) {
            ranges.push(range);
            replace("foo");
          },
        );

        expect(ranges[0]).toEqual([
          [5, 6],
          [5, 13],
        ]);
        expect(ranges[1]).toEqual([
          [6, 6],
          [6, 13],
        ]);
        expect(ranges[2]).toEqual([
          [6, 30],
          [6, 37],
        ]);

        expect(buffer.lineForRow(5)).toBe("      foo = items.shift();");
        expect(buffer.lineForRow(6)).toBe(
          "      foo < pivot ? left.push(foo) : right.push(current);",
        );
      });

      it("allows the match to be replaced with the empty string", function () {
        buffer.scanInRange(
          /current/g,
          [
            [4, 0],
            [6, 59],
          ],
          ({ replace }) => replace(""),
        );

        expect(buffer.lineForRow(5)).toBe("       = items.shift();");
        expect(buffer.lineForRow(6)).toBe("       < pivot ? left.push() : right.push(current);");
      });
    });

    describe("when the iterator calls the 'stop' control function", () =>
      it("stops the traversal", function () {
        const ranges = [];
        buffer.scanInRange(
          /cu(rr)ent/g,
          [
            [4, 0],
            [6, 59],
          ],
          function ({ range, stop }) {
            ranges.push(range);
            if (ranges.length === 2) {
              stop();
            }
          },
        );

        expect(ranges.length).toBe(2);
      }));

    it("returns the same results as a regex match on a regular string", function () {
      const regexps = [
        /\w+/g, // 1 word
        /\w+\n\s*\w+/g, // 2 words separated by an newline (escape sequence)
        // eslint-disable-next-line no-control-regex -- matches literal control characters on purpose
        RegExp("\\w+\n\\s*w+", "g"), // 2 words separated by a newline (literal)
        /\w+\s+\w+/g, // 2 words separated by some whitespace
        /\w+[^\w]+\w+/g, // 2 words separated by anything
        /\w+\n\s*\w+\n\s*\w+/g, // 3 words separated by newlines (escape sequence)
        // eslint-disable-next-line no-control-regex -- matches literal control characters on purpose
        RegExp("\\w+\n\\s*\\w+\n\\s*\\w+", "g"), // 3 words separated by newlines (literal)
        /\w+[^\w]+\w+[^\w]+\w+/g, // 3 words separated by anything
      ];

      let i = 0;
      while (i < 20) {
        var left;
        var seed = Date.now();
        var random = new Random(seed);

        var text = buildRandomLines(random, 40);
        buffer = new TextBuffer({ text });
        buffer.backwardsScanChunkSize = random.intBetween(100, 1000);

        var range = getRandomBufferRange(random, buffer)
          .union(getRandomBufferRange(random, buffer))
          .union(getRandomBufferRange(random, buffer));
        var regex = regexps[random(regexps.length)];

        var expectedMatches =
          (left = buffer.getTextInRange(range).match(regex)) != null ? left : [];
        if (!(expectedMatches.length > 0)) {
          continue;
        }
        i++;

        var forwardRanges = [];
        var forwardMatches = [];
        buffer.scanInRange(regex, range, function ({ range, matchText }) {
          forwardRanges.push(range);
          forwardMatches.push(matchText);
        });
        expect(forwardMatches).toEqual(expectedMatches, `Seed: ${seed}`);

        var backwardRanges = [];
        var backwardMatches = [];
        buffer.backwardsScanInRange(regex, range, function ({ range, matchText }) {
          backwardRanges.push(range);
          backwardMatches.push(matchText);
        });
        expect(backwardMatches).toEqual(expectedMatches.reverse(), `Seed: ${seed}`);
      }
    });

    it("does not return empty matches at the end of the range", function () {
      const ranges = [];
      buffer.scanInRange(
        /[ ]*/gm,
        [
          [0, 29],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [0, 29],
          [0, 29],
        ],
        [
          [1, 0],
          [1, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.scanInRange(
        /[ ]*/gm,
        [
          [1, 0],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [1, 0],
          [1, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.scanInRange(
        /\s*/gm,
        [
          [0, 29],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [0, 29],
          [1, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.scanInRange(
        /\s*/gm,
        [
          [1, 0],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [1, 0],
          [1, 2],
        ],
      ]);
    });

    it("allows empty matches at the end of a range, when the range ends at column 0", function () {
      const ranges = [];
      buffer.scanInRange(
        /^[ ]*/gm,
        [
          [9, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [9, 0],
          [9, 2],
        ],
        [
          [10, 0],
          [10, 0],
        ],
      ]);

      ranges.length = 0;
      buffer.scanInRange(
        /^[ ]*/gm,
        [
          [10, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [10, 0],
          [10, 0],
        ],
      ]);

      ranges.length = 0;
      buffer.scanInRange(
        /^\s*/gm,
        [
          [9, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [9, 0],
          [9, 2],
        ],
        [
          [10, 0],
          [10, 0],
        ],
      ]);

      ranges.length = 0;
      buffer.scanInRange(
        /^\s*/gm,
        [
          [10, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [10, 0],
          [10, 0],
        ],
      ]);

      ranges.length = 0;
      buffer.scanInRange(
        /^\s*/gm,
        [
          [11, 0],
          [12, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [11, 0],
          [11, 2],
        ],
        [
          [12, 0],
          [12, 0],
        ],
      ]);
    });

    it("handles multi-line patterns", function () {
      const matchStrings = [];

      // The '\s' character class
      buffer.scan(/{\s+var/, ({ matchText }) => matchStrings.push(matchText));
      expect(matchStrings).toEqual(["{\n  var"]);

      // A literal newline character
      matchStrings.length = 0;
      // eslint-disable-next-line no-control-regex, no-regex-spaces -- matches literal control characters on purpose
      buffer.scan(RegExp("{\n  var"), ({ matchText }) => matchStrings.push(matchText));
      expect(matchStrings).toEqual(["{\n  var"]);

      // A '\n' escape sequence
      matchStrings.length = 0;
      buffer.scan(/{\n {2}var/, ({ matchText }) => matchStrings.push(matchText));
      expect(matchStrings).toEqual(["{\n  var"]);

      // A negated character class in the middle of the pattern
      matchStrings.length = 0;
      buffer.scan(/{[^a] {2}var/, ({ matchText }) => matchStrings.push(matchText));
      expect(matchStrings).toEqual(["{\n  var"]);

      // A negated character class at the beginning of the pattern
      matchStrings.length = 0;
      buffer.scan(/[^a] {2}var/, ({ matchText }) => matchStrings.push(matchText));
      expect(matchStrings).toEqual(["\n  var"]);
    });
  });

  describe("::find(regex)", () =>
    it("resolves with the first range that matches the given regex", function (done) {
      buffer = new TextBuffer("abc\ndefghi");
      buffer.find(/\wf\w*/).then(function (range) {
        expect(range).toEqual(Range(Point(1, 1), Point(1, 6)));
        done();
      });
    }));

  describe("::findAllSync(regex)", () =>
    it("returns all the ranges that match the given regex", function () {
      buffer = new TextBuffer("abc\ndefghi");
      expect(buffer.findAllSync(/[bf]\w+/)).toEqual([
        Range(Point(0, 1), Point(0, 3)),
        Range(Point(1, 2), Point(1, 6)),
      ]);
    }));

  describe("::findAndMarkAllInRangeSync(markerLayer, regex, range, options)", () =>
    it("populates the marker index with the matching ranges", function () {
      buffer = new TextBuffer("abc def\nghi jkl\n");
      const layer = buffer.addMarkerLayer();
      let markers = buffer.findAndMarkAllInRangeSync(
        layer,
        /\w+/g,
        [
          [0, 1],
          [1, 6],
        ],
        { invalidate: "inside" },
      );
      expect(markers.map((marker) => marker.getRange())).toEqual([
        [
          [0, 1],
          [0, 3],
        ],
        [
          [0, 4],
          [0, 7],
        ],
        [
          [1, 0],
          [1, 3],
        ],
        [
          [1, 4],
          [1, 6],
        ],
      ]);
      expect(markers[0].getInvalidationStrategy()).toBe("inside");
      expect(markers[0].isExclusive()).toBe(true);

      markers = buffer.findAndMarkAllInRangeSync(
        layer,
        /abc/g,
        [
          [0, 0],
          [1, 0],
        ],
        { invalidate: "touch" },
      );
      expect(markers.map((marker) => marker.getRange())).toEqual([
        [
          [0, 0],
          [0, 3],
        ],
      ]);
      expect(markers[0].getInvalidationStrategy()).toBe("touch");
      expect(markers[0].isExclusive()).toBe(false);
    }));

  describe("::findWordsWithSubsequence and ::findWordsWithSubsequenceInRange", function () {
    it("resolves with all words matching the given query", function (done) {
      buffer = new TextBuffer("banana bandana ban_ana bandaid band bNa\nbanana");
      buffer.findWordsWithSubsequence("bna", "_", 4).then(function (results) {
        const expected = [
          {
            score: 29,
            matchIndices: [0, 1, 2],
            positions: [{ row: 0, column: 36 }],
            word: "bNa",
          },
          {
            score: 16,
            matchIndices: [0, 2, 4],
            positions: [{ row: 0, column: 15 }],
            word: "ban_ana",
          },
          {
            score: 12,
            matchIndices: [0, 2, 3],
            positions: [
              { row: 0, column: 0 },
              { row: 1, column: 0 },
            ],
            word: "banana",
          },
          {
            score: 7,
            matchIndices: [0, 5, 6],
            positions: [{ row: 0, column: 7 }],
            word: "bandana",
          },
        ];
        // JSON serialization doesn't work properly with `SubsequenceMatch`
        // results, so we use another strategy to test deep equality.
        for (var i in results) {
          var result = results[i];
          for (var value = 0; value < result.length; value++) {
            var prop = result[value];
            expect(value).toEqual(expected[i][prop]);
          }
        }
        done();
      });
    });

    it("resolves with all words matching the given query and range", function (done) {
      const range = { start: { column: 0, row: 0 }, end: { column: 22, row: 0 } };
      buffer = new TextBuffer("banana bandana ban_ana bandaid band bNa\nbanana");
      buffer.findWordsWithSubsequenceInRange("bna", "_", 3, range).then(function (results) {
        const expected = [
          {
            score: 16,
            matchIndices: [0, 2, 4],
            positions: [{ row: 0, column: 15 }],
            word: "ban_ana",
          },
          {
            score: 12,
            matchIndices: [0, 2, 3],
            positions: [{ row: 0, column: 0 }],
            word: "banana",
          },
          {
            score: 7,
            matchIndices: [0, 5, 6],
            positions: [{ row: 0, column: 7 }],
            word: "bandana",
          },
        ];
        // JSON serialization doesn't work properly with `SubsequenceMatch`
        // results, so we use another strategy to test deep equality.
        for (var i in results) {
          var result = results[i];
          for (var value = 0; value < result.length; value++) {
            var prop = result[value];
            expect(value).toEqual(expected[i][prop]);
          }
        }
        done();
      });
    });
  });

  describe("::backwardsScanInRange(range, regex, fn)", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    describe("when given a regex with no global flag", () =>
      it("calls the iterator with the last match for the given regex in the given range", function () {
        const matches = [];
        const ranges = [];
        buffer.backwardsScanInRange(
          /cu(rr)ent/,
          [
            [4, 0],
            [6, 44],
          ],
          function ({ match, range }) {
            matches.push(match);
            ranges.push(range);
          },
        );

        expect(matches.length).toBe(1);
        expect(ranges.length).toBe(1);

        expect(matches[0][0]).toBe("current");
        expect(matches[0][1]).toBe("rr");
        expect(ranges[0]).toEqual([
          [6, 34],
          [6, 41],
        ]);
      }));

    describe("when given a regex with a global flag", () =>
      it("calls the iterator with each match for the given regex in the given range, starting with the last match", function () {
        const matches = [];
        const ranges = [];
        buffer.backwardsScanInRange(
          /cu(rr)ent/g,
          [
            [4, 0],
            [6, 59],
          ],
          function ({ match, range }) {
            matches.push(match);
            ranges.push(range);
          },
        );

        expect(matches.length).toBe(3);
        expect(ranges.length).toBe(3);

        expect(matches[0][0]).toBe("current");
        expect(matches[0][1]).toBe("rr");
        expect(ranges[0]).toEqual([
          [6, 34],
          [6, 41],
        ]);

        expect(matches[1][0]).toBe("current");
        expect(matches[1][1]).toBe("rr");
        expect(ranges[1]).toEqual([
          [6, 6],
          [6, 13],
        ]);

        expect(matches[2][0]).toBe("current");
        expect(matches[2][1]).toBe("rr");
        expect(ranges[2]).toEqual([
          [5, 6],
          [5, 13],
        ]);
      }));

    describe("when the last regex match starts at the beginning of the range", () =>
      it("calls the iterator with the match", function () {
        let matches = [];
        let ranges = [];
        buffer.scanInRange(
          /quick/g,
          [
            [0, 4],
            [2, 0],
          ],
          function ({ match, range }) {
            matches.push(match);
            ranges.push(range);
          },
        );

        expect(matches.length).toBe(1);
        expect(ranges.length).toBe(1);

        expect(matches[0][0]).toBe("quick");
        expect(ranges[0]).toEqual([
          [0, 4],
          [0, 9],
        ]);

        matches = [];
        ranges = [];
        buffer.scanInRange(
          /^/,
          [
            [0, 0],
            [2, 0],
          ],
          function ({ match, range }) {
            matches.push(match);
            ranges.push(range);
          },
        );

        expect(matches.length).toBe(1);
        expect(ranges.length).toBe(1);

        expect(matches[0][0]).toBe("");
        expect(ranges[0]).toEqual([
          [0, 0],
          [0, 0],
        ]);
      }));

    describe("when the first regex match exceeds the end of the range", function () {
      describe("when the portion of the match within the range also matches the regex", () =>
        it("calls the iterator with the truncated match", function () {
          const matches = [];
          const ranges = [];
          buffer.backwardsScanInRange(
            /cu(r*)/g,
            [
              [4, 0],
              [6, 9],
            ],
            function ({ match, range }) {
              matches.push(match);
              ranges.push(range);
            },
          );

          expect(matches.length).toBe(2);
          expect(ranges.length).toBe(2);

          expect(matches[0][0]).toBe("cur");
          expect(matches[0][1]).toBe("r");
          expect(ranges[0]).toEqual([
            [6, 6],
            [6, 9],
          ]);

          expect(matches[1][0]).toBe("curr");
          expect(matches[1][1]).toBe("rr");
          expect(ranges[1]).toEqual([
            [5, 6],
            [5, 10],
          ]);
        }));

      describe("when the portion of the match within the range does not matches the regex", () =>
        it("does not call the iterator with the truncated match", function () {
          const matches = [];
          const ranges = [];
          buffer.backwardsScanInRange(
            /cu(r*)e/g,
            [
              [4, 0],
              [6, 9],
            ],
            function ({ match, range }) {
              matches.push(match);
              ranges.push(range);
            },
          );

          expect(matches.length).toBe(1);
          expect(ranges.length).toBe(1);

          expect(matches[0][0]).toBe("curre");
          expect(matches[0][1]).toBe("rr");
          expect(ranges[0]).toEqual([
            [5, 6],
            [5, 11],
          ]);
        }));
    });

    describe("when the iterator calls the 'replace' control function with a replacement string", () =>
      it("replaces each occurrence of the regex match with the string", function () {
        const ranges = [];
        buffer.backwardsScanInRange(
          /cu(rr)ent/g,
          [
            [4, 0],
            [6, 59],
          ],
          function ({ range, replace }) {
            ranges.push(range);
            if (!range.start.isEqual([6, 6])) {
              replace("foo");
            }
          },
        );

        expect(ranges[0]).toEqual([
          [6, 34],
          [6, 41],
        ]);
        expect(ranges[1]).toEqual([
          [6, 6],
          [6, 13],
        ]);
        expect(ranges[2]).toEqual([
          [5, 6],
          [5, 13],
        ]);

        expect(buffer.lineForRow(5)).toBe("      foo = items.shift();");
        expect(buffer.lineForRow(6)).toBe(
          "      current < pivot ? left.push(foo) : right.push(current);",
        );
      }));

    describe("when the iterator calls the 'stop' control function", () =>
      it("stops the traversal", function () {
        const ranges = [];
        buffer.backwardsScanInRange(
          /cu(rr)ent/g,
          [
            [4, 0],
            [6, 59],
          ],
          function ({ range, stop }) {
            ranges.push(range);
            if (ranges.length === 2) {
              stop();
            }
          },
        );

        expect(ranges.length).toBe(2);
        expect(ranges[0]).toEqual([
          [6, 34],
          [6, 41],
        ]);
        expect(ranges[1]).toEqual([
          [6, 6],
          [6, 13],
        ]);
      }));

    describe("when called with a random range", () => {
      it("returns the same results as ::scanInRange, but in the opposite order", () => {
        for (let i = 1; i < 50; i++) {
          var seed = Date.now();
          var random = new Random(seed);

          buffer.backwardsScanChunkSize = random.intBetween(1, 80);

          var [startRow, endRow] = [
            random(buffer.getLineCount()),
            random(buffer.getLineCount()),
          ].sort();
          var startColumn = random(buffer.lineForRow(startRow).length);
          var endColumn = random(buffer.lineForRow(endRow).length);
          var range = [
            [startRow, startColumn],
            [endRow, endColumn],
          ];

          var regex = [/\w/g, /\w{2}/g, /\w{3}/g, /.{5}/g][random(4)];

          if (random(2) > 0) {
            var forwardRanges = [];
            var backwardRanges = [];
            var forwardMatches = [];
            var backwardMatches = [];

            buffer.scanInRange(regex, range, function ({ range, matchText }) {
              forwardMatches.push(matchText);
              forwardRanges.push(range);
            });

            buffer.backwardsScanInRange(regex, range, function ({ range, matchText }) {
              backwardMatches.unshift(matchText);
              backwardRanges.unshift(range);
            });

            expect(backwardRanges).toEqual(forwardRanges, `Seed: ${seed}`);
            expect(backwardMatches).toEqual(forwardMatches, `Seed: ${seed}`);
          } else {
            var referenceBuffer = new TextBuffer({ text: buffer.getText() });
            referenceBuffer.scanInRange(regex, range, ({ matchText, replace }) =>
              replace(matchText + "."),
            );

            buffer.backwardsScanInRange(regex, range, ({ matchText, replace }) =>
              replace(matchText + "."),
            );

            expect(buffer.getText()).toBe(referenceBuffer.getText(), `Seed: ${seed}`);
          }
        }
      });
    });

    it("does not return empty matches at the end of the range", function () {
      const ranges = [];

      buffer.backwardsScanInRange(
        /[ ]*/gm,
        [
          [1, 0],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [1, 0],
          [1, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.backwardsScanInRange(
        /[ ]*/m,
        [
          [0, 29],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [1, 0],
          [1, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.backwardsScanInRange(
        /\s*/gm,
        [
          [1, 0],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [1, 0],
          [1, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.backwardsScanInRange(
        /\s*/m,
        [
          [0, 29],
          [1, 2],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [0, 29],
          [1, 2],
        ],
      ]);
    });

    it("allows empty matches at the end of a range, when the range ends at column 0", function () {
      const ranges = [];
      buffer.backwardsScanInRange(
        /^[ ]*/gm,
        [
          [9, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [10, 0],
          [10, 0],
        ],
        [
          [9, 0],
          [9, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.backwardsScanInRange(
        /^[ ]*/gm,
        [
          [10, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [10, 0],
          [10, 0],
        ],
      ]);

      ranges.length = 0;
      buffer.backwardsScanInRange(
        /^\s*/gm,
        [
          [9, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [10, 0],
          [10, 0],
        ],
        [
          [9, 0],
          [9, 2],
        ],
      ]);

      ranges.length = 0;
      buffer.backwardsScanInRange(
        /^\s*/gm,
        [
          [10, 0],
          [10, 0],
        ],
        ({ range }) => ranges.push(range),
      );
      expect(ranges).toEqual([
        [
          [10, 0],
          [10, 0],
        ],
      ]);
    });
  });

  describe("::characterIndexForPosition(position)", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    it("returns the total number of characters that precede the given position", function () {
      expect(buffer.characterIndexForPosition([0, 0])).toBe(0);
      expect(buffer.characterIndexForPosition([0, 1])).toBe(1);
      expect(buffer.characterIndexForPosition([0, 29])).toBe(29);
      expect(buffer.characterIndexForPosition([1, 0])).toBe(30);
      expect(buffer.characterIndexForPosition([2, 0])).toBe(61);
      expect(buffer.characterIndexForPosition([12, 2])).toBe(408);
      expect(buffer.characterIndexForPosition([Infinity])).toBe(408);
    });

    describe("when the buffer contains crlf line endings", () =>
      it("returns the total number of characters that precede the given position", function () {
        buffer.setText("line1\r\nline2\nline3\r\nline4");
        expect(buffer.characterIndexForPosition([1])).toBe(7);
        expect(buffer.characterIndexForPosition([2])).toBe(13);
        expect(buffer.characterIndexForPosition([3])).toBe(20);
      }));
  });

  describe("::positionForCharacterIndex(position)", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    it("returns the position based on character index", function () {
      expect(buffer.positionForCharacterIndex(0)).toEqual([0, 0]);
      expect(buffer.positionForCharacterIndex(1)).toEqual([0, 1]);
      expect(buffer.positionForCharacterIndex(29)).toEqual([0, 29]);
      expect(buffer.positionForCharacterIndex(30)).toEqual([1, 0]);
      expect(buffer.positionForCharacterIndex(61)).toEqual([2, 0]);
      expect(buffer.positionForCharacterIndex(408)).toEqual([12, 2]);
    });

    describe("when the buffer contains crlf line endings", () =>
      it("returns the position based on character index", function () {
        buffer.setText("line1\r\nline2\nline3\r\nline4");
        expect(buffer.positionForCharacterIndex(7)).toEqual([1, 0]);
        expect(buffer.positionForCharacterIndex(13)).toEqual([2, 0]);
        expect(buffer.positionForCharacterIndex(20)).toEqual([3, 0]);
      }));
  });

  describe("::isEmpty()", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    it("returns true for an empty buffer", function () {
      buffer.setText("");
      expect(buffer.isEmpty()).toBeTruthy();
    });

    it("returns false for a non-empty buffer", function () {
      buffer.setText("a");
      expect(buffer.isEmpty()).toBeFalsy();
      buffer.setText("a\nb\nc");
      expect(buffer.isEmpty()).toBeFalsy();
      buffer.setText("\n");
      expect(buffer.isEmpty()).toBeFalsy();
    });
  });

  describe("::hasAstral()", function () {
    it("returns true for buffers containing surrogate pairs", () =>
      expect(new TextBuffer("hooray 😄").hasAstral()).toBeTruthy());

    it("returns false for buffers that do not contain surrogate pairs", () =>
      expect(new TextBuffer("nope").hasAstral()).toBeFalsy());
  });

  describe("::onWillChange(callback)", () =>
    it("notifies observers before a transaction, an undo or a redo", function () {
      let changeCount = 0;
      let expectedText = "";

      buffer = new TextBuffer();
      const checkpoint = buffer.createCheckpoint();

      buffer.onWillChange(function (_change) {
        expect(buffer.getText()).toBe(expectedText);
        changeCount++;
      });

      buffer.append("a");
      expect(changeCount).toBe(1);
      expectedText = "a";

      buffer.transact(function () {
        buffer.append("b");
        buffer.append("c");
      });
      expect(changeCount).toBe(2);
      expectedText = "abc";

      // Empty transactions do not cause onWillChange listeners to be called
      buffer.transact(function () {});
      expect(changeCount).toBe(2);

      buffer.undo();
      expect(changeCount).toBe(3);
      expectedText = "a";

      buffer.redo();
      expect(changeCount).toBe(4);
      expectedText = "abc";

      buffer.revertToCheckpoint(checkpoint);
      expect(changeCount).toBe(5);
    }));

  describe("::onDidChange(callback)", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    it("notifies observers after a transaction, an undo or a redo", function () {
      let textChanges = [];
      buffer.onDidChange(({ changes }) => textChanges.push(...(changes || [])));

      buffer.insert([0, 0], "abc");
      buffer.delete([
        [0, 0],
        [0, 1],
      ]);

      assertChangesEqual(textChanges, [
        {
          oldRange: [
            [0, 0],
            [0, 0],
          ],
          newRange: [
            [0, 0],
            [0, 3],
          ],
          oldText: "",
          newText: "abc",
        },
        {
          oldRange: [
            [0, 0],
            [0, 1],
          ],
          newRange: [
            [0, 0],
            [0, 0],
          ],
          oldText: "a",
          newText: "",
        },
      ]);

      textChanges = [];
      buffer.transact(function () {
        buffer.insert([1, 0], "v");
        buffer.insert([1, 1], "x");
        buffer.insert([1, 2], "y");
        buffer.insert([2, 3], "zw");
        buffer.delete([
          [2, 3],
          [2, 4],
        ]);
      });

      assertChangesEqual(textChanges, [
        {
          oldRange: [
            [1, 0],
            [1, 0],
          ],
          newRange: [
            [1, 0],
            [1, 3],
          ],
          oldText: "",
          newText: "vxy",
        },
        {
          oldRange: [
            [2, 3],
            [2, 3],
          ],
          newRange: [
            [2, 3],
            [2, 4],
          ],
          oldText: "",
          newText: "w",
        },
      ]);

      textChanges = [];
      buffer.undo();
      assertChangesEqual(textChanges, [
        {
          oldRange: [
            [1, 0],
            [1, 3],
          ],
          newRange: [
            [1, 0],
            [1, 0],
          ],
          oldText: "vxy",
          newText: "",
        },
        {
          oldRange: [
            [2, 3],
            [2, 4],
          ],
          newRange: [
            [2, 3],
            [2, 3],
          ],
          oldText: "w",
          newText: "",
        },
      ]);

      textChanges = [];
      buffer.redo();
      assertChangesEqual(textChanges, [
        {
          oldRange: [
            [1, 0],
            [1, 0],
          ],
          newRange: [
            [1, 0],
            [1, 3],
          ],
          oldText: "",
          newText: "vxy",
        },
        {
          oldRange: [
            [2, 3],
            [2, 3],
          ],
          newRange: [
            [2, 3],
            [2, 4],
          ],
          oldText: "",
          newText: "w",
        },
      ]);

      textChanges = [];
      buffer.transact(() => buffer.transact(() => buffer.insert([0, 0], "j")));

      // we emit only one event for nested transactions
      assertChangesEqual(textChanges, [
        {
          oldRange: [
            [0, 0],
            [0, 0],
          ],
          newRange: [
            [0, 0],
            [0, 1],
          ],
          oldText: "",
          newText: "j",
        },
      ]);
    });

    it("doesn't notify observers after an empty transaction", function () {
      const didChangeTextSpy = jasmine.createSpy();
      buffer.onDidChange(didChangeTextSpy);
      buffer.transact(function () {});
      expect(didChangeTextSpy).not.toHaveBeenCalled();
    });

    it("doesn't throw an error when clearing the undo stack within a transaction", function () {
      let didChangeTextSpy;
      buffer.onDidChange((didChangeTextSpy = jasmine.createSpy()));
      expect(() => buffer.transact(() => buffer.clearUndoStack())).not.toThrowError();
      expect(didChangeTextSpy).not.toHaveBeenCalled();
    });
  });

  describe("::onDidStopChanging(callback)", function () {
    let delay, didStopChangingCallback;

    const wait = (milliseconds, callback) => setTimeout(callback, milliseconds);

    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
      delay = buffer.stoppedChangingDelay;
      didStopChangingCallback = jasmine.createSpy("didStopChangingCallback");
      buffer.onDidStopChanging(didStopChangingCallback);
    });

    it("notifies observers after a delay passes following changes", function (done) {
      buffer.insert([0, 0], "a");
      expect(didStopChangingCallback).not.toHaveBeenCalled();

      wait(delay / 2, function () {
        buffer.transact(() =>
          buffer.transact(function () {
            buffer.insert([0, 0], "b");
            buffer.insert([1, 0], "c");
            buffer.insert([1, 1], "d");
          }),
        );
        expect(didStopChangingCallback).not.toHaveBeenCalled();

        wait(delay / 2, function () {
          expect(didStopChangingCallback).not.toHaveBeenCalled();

          wait(delay, function () {
            expect(didStopChangingCallback).toHaveBeenCalled();
            assertChangesEqual(didStopChangingCallback.calls.mostRecent().args[0].changes, [
              {
                oldRange: [
                  [0, 0],
                  [0, 0],
                ],
                newRange: [
                  [0, 0],
                  [0, 2],
                ],
                oldText: "",
                newText: "ba",
              },
              {
                oldRange: [
                  [1, 0],
                  [1, 0],
                ],
                newRange: [
                  [1, 0],
                  [1, 2],
                ],
                oldText: "",
                newText: "cd",
              },
            ]);

            didStopChangingCallback.calls.reset();
            buffer.undo();
            buffer.undo();
            wait(delay * 2, function () {
              expect(didStopChangingCallback).toHaveBeenCalled();
              assertChangesEqual(didStopChangingCallback.calls.mostRecent().args[0].changes, [
                {
                  oldRange: [
                    [0, 0],
                    [0, 2],
                  ],
                  newRange: [
                    [0, 0],
                    [0, 0],
                  ],
                  oldText: "ba",
                  newText: "",
                },
                {
                  oldRange: [
                    [1, 0],
                    [1, 2],
                  ],
                  newRange: [
                    [1, 0],
                    [1, 0],
                  ],
                  oldText: "cd",
                  newText: "",
                },
              ]);
              done();
            });
          });
        });
      });
    });

    it("provides the correct changes when the buffer is mutated in the onDidChange callback", function (done) {
      buffer.onDidChange(function ({ changes }) {
        switch (changes[0].newText) {
          case "a":
            buffer.insert(changes[0].newRange.end, "b");
            break;
          case "b":
            buffer.insert(changes[0].newRange.end, "c");
            break;
          case "c":
            buffer.insert(changes[0].newRange.end, "d");
            break;
        }
      });

      buffer.insert([0, 0], "a");

      wait(delay * 2, function () {
        expect(didStopChangingCallback).toHaveBeenCalled();
        assertChangesEqual(didStopChangingCallback.calls.mostRecent().args[0].changes, [
          {
            oldRange: [
              [0, 0],
              [0, 0],
            ],
            newRange: [
              [0, 0],
              [0, 4],
            ],
            oldText: "",
            newText: "abcd",
          },
        ]);
        done();
      });
    });
  });

  describe("::append(text)", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    it("adds text to the end of the buffer", function () {
      buffer.setText("");
      buffer.append("a");
      expect(buffer.getText()).toBe("a");
      buffer.append("b\nc");
      expect(buffer.getText()).toBe("ab\nc");
    });
  });

  describe("::setLanguageMode", function () {
    it("destroys the previous language mode", function () {
      buffer = new TextBuffer();

      const languageMode1 = {
        alive: true,
        destroy() {
          this.alive = false;
        },
        onDidChangeHighlighting() {
          return { dispose() {} };
        },
      };

      const languageMode2 = {
        alive: true,
        destroy() {
          this.alive = false;
        },
        onDidChangeHighlighting() {
          return { dispose() {} };
        },
      };

      buffer.setLanguageMode(languageMode1);
      expect(languageMode1.alive).toBe(true);
      expect(languageMode2.alive).toBe(true);

      buffer.setLanguageMode(languageMode2);
      expect(languageMode1.alive).toBe(false);
      expect(languageMode2.alive).toBe(true);

      buffer.destroy();
      expect(languageMode1.alive).toBe(false);
      expect(languageMode2.alive).toBe(false);
    });

    it("notifies ::onDidChangeLanguageMode observers when the language mode changes", function () {
      buffer = new TextBuffer();
      expect(buffer.getLanguageMode() instanceof NullLanguageMode).toBe(true);

      const events = [];
      buffer.onDidChangeLanguageMode((newMode, oldMode) => events.push({ newMode, oldMode }));

      const languageMode = {
        onDidChangeHighlighting() {
          return { dispose() {} };
        },
      };

      buffer.setLanguageMode(languageMode);
      expect(buffer.getLanguageMode()).toBe(languageMode);
      expect(events.length).toBe(1);
      expect(events[0].newMode).toBe(languageMode);
      expect(events[0].oldMode instanceof NullLanguageMode).toBe(true);

      buffer.setLanguageMode(null);
      expect(buffer.getLanguageMode() instanceof NullLanguageMode).toBe(true);
      expect(events.length).toBe(2);
      expect(events[1].newMode).toBe(buffer.getLanguageMode());
      expect(events[1].oldMode).toBe(languageMode);
    });
  });

  describe("line ending support", function () {
    beforeEach(function () {
      const filePath = require.resolve("./fixtures/sample.js");
      buffer = TextBuffer.loadSync(filePath);
    });

    describe(".getText()", () =>
      it("returns the text with the corrent line endings for each row", function () {
        buffer.setText("a\r\nb\nc");
        expect(buffer.getText()).toBe("a\r\nb\nc");
        buffer.setText("a\r\nb\nc\n");
        expect(buffer.getText()).toBe("a\r\nb\nc\n");
      }));

    describe("when editing a line", () =>
      it("preserves the existing line ending", function () {
        buffer.setText("a\r\nb\nc");
        buffer.insert([0, 1], "1");
        expect(buffer.getText()).toBe("a1\r\nb\nc");
      }));

    describe("when inserting text with multiple lines", function () {
      describe("when the current line has a line ending", () =>
        it("uses the same line ending as the line where the text is inserted", function () {
          buffer.setText("a\r\n");
          buffer.insert([0, 1], "hello\n1\n\n2");
          expect(buffer.getText()).toBe("ahello\r\n1\r\n\r\n2\r\n");
        }));

      describe("when the current line has no line ending (because it's the last line of the buffer)", function () {
        describe("when the buffer contains only a single line", () =>
          it("honors the line endings in the inserted text", function () {
            buffer.setText("initialtext");
            buffer.append("hello\n1\r\n2\n");
            expect(buffer.getText()).toBe("initialtexthello\n1\r\n2\n");
          }));

        describe("when the buffer contains a preceding line", () =>
          it("uses the line ending of the preceding line", function () {
            buffer.setText("\ninitialtext");
            buffer.append("hello\n1\r\n2\n");
            expect(buffer.getText()).toBe("\ninitialtexthello\n1\n2\n");
          }));
      });
    });

    describe("::setPreferredLineEnding(lineEnding)", function () {
      it("uses the given line ending when normalizing, rather than inferring one from the surrounding text", function () {
        buffer = new TextBuffer({ text: "a \r\n" });

        expect(buffer.getPreferredLineEnding()).toBe(null);
        buffer.append(" b \n");
        expect(buffer.getText()).toBe("a \r\n b \r\n");

        buffer.setPreferredLineEnding("\n");
        expect(buffer.getPreferredLineEnding()).toBe("\n");
        buffer.append(" c \n");
        expect(buffer.getText()).toBe("a \r\n b \r\n c \n");

        buffer.setPreferredLineEnding(null);
        buffer.append(" d \r\n");
        expect(buffer.getText()).toBe("a \r\n b \r\n c \n d \n");
      });

      it("persists across serialization and deserialization", function (done) {
        const bufferA = new TextBuffer();
        bufferA.setPreferredLineEnding("\r\n");

        TextBuffer.deserialize(bufferA.serialize()).then(function (bufferB) {
          expect(bufferB.getPreferredLineEnding()).toBe("\r\n");
          done();
        });
      });
    });
  });
});

describe("when a buffer is already open", () => {
  const filePath = path.join(__dirname, "fixtures", "sample.js");
  const buffer = new TextBuffer();

  it("replaces foo( with bar( using /\bfoo\\(\b/gim", () => {
    buffer.setPath(filePath);
    buffer.setText("foo(x)");
    buffer.replace(/\bfoo\(\b/gim, "bar(");

    expect(buffer.getText()).toBe("bar(x)");
  });

  describe("Texts should be replaced properly with strings containing literals when using the regex option", () => {
    it("replaces tstat_fvars()->curr_setpoint[HEAT_EN] with tstat_set_curr_setpoint($1, $2);", () => {
      buffer.setPath(filePath);
      buffer.setText("tstat_fvars()->curr_setpoint[HEAT_EN] = new_tptr->heat_limit;");
      buffer.replace(
        /tstat_fvars\(\)->curr_setpoint\[(.+?)\] = (.+?);/,
        "tstat_set_curr_setpoint($1, $2);",
      );

      expect(buffer.getText()).toBe("tstat_set_curr_setpoint(HEAT_EN, new_tptr->heat_limit);");
    });

    it("replaces atom/flight-manualatomio with $1", () => {
      buffer.setText("atom/flight-manualatomio");
      buffer.replace(/\.(atom)\./, "$1");

      expect(buffer.getText()).toBe("atom/flight-manualatomio");
    });
  });
});

function assertChangesEqual(actualChanges, expectedChanges) {
  expect(actualChanges.length).toBe(expectedChanges.length);
  for (let i = 0; i < actualChanges.length; i++) {
    var actualChange = actualChanges[i];
    var expectedChange = expectedChanges[i];
    expect(actualChange.oldRange).toEqual(expectedChange.oldRange);
    expect(actualChange.newRange).toEqual(expectedChange.newRange);
    expect(actualChange.oldText).toEqual(expectedChange.oldText);
    expect(actualChange.newText).toEqual(expectedChange.newText);
  }
}
