const { difference, times, uniq } = require("@lumine-code/underscore-plus");
const TextBuffer = require("../src/text-buffer");

describe("Marker", function () {
  let buffer, markerCreations, markersUpdatedCount;

  beforeEach(function () {
    jasmine.addCustomEqualityTester(require("@lumine-code/underscore-plus").isEqual);
    buffer = new TextBuffer({ text: "abcdefghijklmnopqrstuvwxyz" });
    markerCreations = [];
    buffer.onDidCreateMarker((marker) => markerCreations.push(marker));
    markersUpdatedCount = 0;
    buffer.onDidUpdateMarkers(() => markersUpdatedCount++);
  });

  describe("creation", function () {
    describe("TextBuffer::markRange(range, properties)", function () {
      it("creates a marker for the given range with the given properties", function () {
        const marker = buffer.markRange([
          [0, 3],
          [0, 6],
        ]);
        expect(marker.getRange()).toEqual([
          [0, 3],
          [0, 6],
        ]);
        expect(marker.getHeadPosition()).toEqual([0, 6]);
        expect(marker.getTailPosition()).toEqual([0, 3]);
        expect(marker.isReversed()).toBe(false);
        expect(marker.hasTail()).toBe(true);
        expect(markerCreations).toEqual([marker]);
        expect(markersUpdatedCount).toBe(1);
      });

      it("allows a reversed marker to be created", function () {
        const marker = buffer.markRange(
          [
            [0, 3],
            [0, 6],
          ],
          { reversed: true },
        );
        expect(marker.getRange()).toEqual([
          [0, 3],
          [0, 6],
        ]);
        expect(marker.getHeadPosition()).toEqual([0, 3]);
        expect(marker.getTailPosition()).toEqual([0, 6]);
        expect(marker.isReversed()).toBe(true);
        expect(marker.hasTail()).toBe(true);
      });

      it("allows an invalidation strategy to be assigned", function () {
        const marker = buffer.markRange(
          [
            [0, 3],
            [0, 6],
          ],
          { invalidate: "inside" },
        );
        expect(marker.getInvalidationStrategy()).toBe("inside");
      });

      it("allows an exclusive marker to be created independently of its invalidation strategy", function () {
        const layer = buffer.addMarkerLayer({ maintainHistory: true });
        const marker1 = layer.markRange(
          [
            [0, 3],
            [0, 6],
          ],
          { invalidate: "overlap", exclusive: true },
        );
        const marker2 = marker1.copy();
        const marker3 = marker1.copy({ exclusive: false });
        const marker4 = marker1.copy({ exclusive: null, invalidate: "inside" });

        buffer.insert([0, 3], "something");

        expect(marker1.getStartPosition()).toEqual([0, 12]);
        expect(marker1.isExclusive()).toBe(true);
        expect(marker2.getStartPosition()).toEqual([0, 12]);
        expect(marker2.isExclusive()).toBe(true);
        expect(marker3.getStartPosition()).toEqual([0, 3]);
        expect(marker3.isExclusive()).toBe(false);
        expect(marker4.getStartPosition()).toEqual([0, 12]);
        expect(marker4.isExclusive()).toBe(true);
      });

      it("allows custom state to be assigned", function () {
        const marker = buffer.markRange(
          [
            [0, 3],
            [0, 6],
          ],
          { foo: 1, bar: 2 },
        );
        expect(marker.getProperties()).toEqual({ foo: 1, bar: 2 });
      });

      it("clips the range before creating a marker with it", function () {
        const marker = buffer.markRange([
          [-100, -100],
          [100, 100],
        ]);
        expect(marker.getRange()).toEqual([
          [0, 0],
          [0, 26],
        ]);
      });

      it("throws an error if an invalid point is given", function () {
        const marker1 = buffer.markRange([
          [0, 1],
          [0, 2],
        ]);

        expect(() =>
          buffer.markRange([
            [0, NaN],
            [0, 2],
          ]),
        ).toThrowError("Invalid Point: (0, NaN)");
        expect(() =>
          buffer.markRange([
            [0, 1],
            [0, NaN],
          ]),
        ).toThrowError("Invalid Point: (0, NaN)");

        expect(buffer.findMarkers({})).toEqual([marker1]);
        expect(buffer.getMarkers()).toEqual([marker1]);
      });

      it("allows arbitrary properties to be assigned", function () {
        const marker = buffer.markRange(
          [
            [0, 6],
            [0, 8],
          ],
          { foo: "bar" },
        );
        expect(marker.getProperties()).toEqual({ foo: "bar" });
      });
    });

    describe("TextBuffer::markPosition(position, properties)", function () {
      it("creates a tail-less marker at the given position", function () {
        const marker = buffer.markPosition([0, 6]);
        expect(marker.getRange()).toEqual([
          [0, 6],
          [0, 6],
        ]);
        expect(marker.getHeadPosition()).toEqual([0, 6]);
        expect(marker.getTailPosition()).toEqual([0, 6]);
        expect(marker.isReversed()).toBe(false);
        expect(marker.hasTail()).toBe(false);
        expect(markerCreations).toEqual([marker]);
      });

      it("allows an invalidation strategy to be assigned", function () {
        const marker = buffer.markPosition([0, 3], { invalidate: "inside" });
        expect(marker.getInvalidationStrategy()).toBe("inside");
      });

      it("throws an error if an invalid point is given", function () {
        const marker1 = buffer.markPosition([0, 1]);

        expect(() => buffer.markPosition([0, NaN])).toThrowError("Invalid Point: (0, NaN)");

        expect(buffer.findMarkers({})).toEqual([marker1]);
        expect(buffer.getMarkers()).toEqual([marker1]);
      });

      it("allows arbitrary properties to be assigned", function () {
        const marker = buffer.markPosition([0, 6], { foo: "bar" });
        expect(marker.getProperties()).toEqual({ foo: "bar" });
      });
    });
  });

  describe("direct updates", function () {
    let marker, changes;

    beforeEach(function () {
      marker = buffer.markRange([
        [0, 6],
        [0, 9],
      ]);
      changes = [];
      markersUpdatedCount = 0;
      marker.onDidChange((change) => changes.push(change));
    });

    describe("::setHeadPosition(position, state)", function () {
      it("sets the head position of the marker, flipping its orientation if necessary", function () {
        marker.setHeadPosition([0, 12]);
        expect(marker.getRange()).toEqual([
          [0, 6],
          [0, 12],
        ]);
        expect(marker.isReversed()).toBe(false);
        expect(markersUpdatedCount).toBe(1);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 12],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 6],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.setHeadPosition([0, 3]);
        expect(markersUpdatedCount).toBe(2);
        expect(marker.getRange()).toEqual([
          [0, 3],
          [0, 6],
        ]);
        expect(marker.isReversed()).toBe(true);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 12],
            newHeadPosition: [0, 3],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 6],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.setHeadPosition([0, 9]);
        expect(markersUpdatedCount).toBe(3);
        expect(marker.getRange()).toEqual([
          [0, 6],
          [0, 9],
        ]);
        expect(marker.isReversed()).toBe(false);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 3],
            newHeadPosition: [0, 9],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 6],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);
      });

      it("does not give the marker a tail if it doesn't have one already", function () {
        marker.clearTail();
        expect(marker.hasTail()).toBe(false);
        marker.setHeadPosition([0, 15]);
        expect(marker.hasTail()).toBe(false);
        expect(marker.getRange()).toEqual([
          [0, 15],
          [0, 15],
        ]);
      });

      it("does not notify ::onDidChange observers and returns false if the position isn't actually changed", function () {
        expect(marker.setHeadPosition(marker.getHeadPosition())).toBe(false);
        expect(markersUpdatedCount).toBe(0);
        expect(changes.length).toBe(0);
      });

      it("clips the assigned position", function () {
        marker.setHeadPosition([100, 100]);
        expect(marker.getHeadPosition()).toEqual([0, 26]);
      });
    });

    describe("::setTailPosition(position, state)", function () {
      it("sets the head position of the marker, flipping its orientation if necessary", function () {
        marker.setTailPosition([0, 3]);
        expect(marker.getRange()).toEqual([
          [0, 3],
          [0, 9],
        ]);
        expect(marker.isReversed()).toBe(false);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 9],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 3],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.setTailPosition([0, 12]);
        expect(marker.getRange()).toEqual([
          [0, 9],
          [0, 12],
        ]);
        expect(marker.isReversed()).toBe(true);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 9],
            oldTailPosition: [0, 3],
            newTailPosition: [0, 12],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.setTailPosition([0, 6]);
        expect(marker.getRange()).toEqual([
          [0, 6],
          [0, 9],
        ]);
        expect(marker.isReversed()).toBe(false);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 9],
            oldTailPosition: [0, 12],
            newTailPosition: [0, 6],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);
      });

      it("plants the tail of the marker if it does not have a tail", function () {
        marker.clearTail();
        expect(marker.hasTail()).toBe(false);
        marker.setTailPosition([0, 0]);
        expect(marker.hasTail()).toBe(true);
        expect(marker.getRange()).toEqual([
          [0, 0],
          [0, 9],
        ]);
      });

      it("does not notify ::onDidChange observers and returns false if the position isn't actually changed", function () {
        expect(marker.setTailPosition(marker.getTailPosition())).toBe(false);
        expect(changes.length).toBe(0);
      });

      it("clips the assigned position", function () {
        marker.setTailPosition([100, 100]);
        expect(marker.getTailPosition()).toEqual([0, 26]);
      });
    });

    describe("::setRange(range, options)", function () {
      it("sets the head and tail position simultaneously, flipping the orientation if the 'isReversed' option is true", function () {
        marker.setRange([
          [0, 8],
          [0, 12],
        ]);
        expect(marker.getRange()).toEqual([
          [0, 8],
          [0, 12],
        ]);
        expect(marker.isReversed()).toBe(false);
        expect(marker.getHeadPosition()).toEqual([0, 12]);
        expect(marker.getTailPosition()).toEqual([0, 8]);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 12],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 8],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.setRange(
          [
            [0, 3],
            [0, 9],
          ],
          { reversed: true },
        );
        expect(marker.getRange()).toEqual([
          [0, 3],
          [0, 9],
        ]);
        expect(marker.isReversed()).toBe(true);
        expect(marker.getHeadPosition()).toEqual([0, 3]);
        expect(marker.getTailPosition()).toEqual([0, 9]);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 12],
            newHeadPosition: [0, 3],
            oldTailPosition: [0, 8],
            newTailPosition: [0, 9],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);
      });

      it("plants the tail of the marker if it does not have a tail", function () {
        marker.clearTail();
        expect(marker.hasTail()).toBe(false);
        marker.setRange([
          [0, 1],
          [0, 10],
        ]);
        expect(marker.hasTail()).toBe(true);
        expect(marker.getRange()).toEqual([
          [0, 1],
          [0, 10],
        ]);
      });

      it("clips the assigned range", function () {
        marker.setRange([
          [-100, -100],
          [100, 100],
        ]);
        expect(marker.getRange()).toEqual([
          [0, 0],
          [0, 26],
        ]);
      });

      it("reports clipped positions to ::onDidChange observers", function () {
        marker.setRange([
          [0, 3],
          [100, 100],
        ]);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 26],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 3],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        // The stored event state also reflects the clipped range, so the next
        // event's old positions are the marker's actual previous positions.
        changes = [];
        marker.setRange([
          [0, 1],
          [0, 2],
        ]);
        expect(changes[0].oldHeadPosition).toEqual([0, 26]);
        expect(changes[0].oldTailPosition).toEqual([0, 3]);
      });

      it("emits the right events when called inside of an ::onDidChange handler", function () {
        marker.onDidChange(function (change) {
          if (marker.getHeadPosition().isEqual([0, 5])) {
            marker.setHeadPosition([0, 6]);
          }
        });

        marker.setHeadPosition([0, 5]);

        const headPositions = (() => {
          const result = [];
          for (var { oldHeadPosition, newHeadPosition } of changes) {
            result.push({ old: oldHeadPosition, new: newHeadPosition });
          }
          return result;
        })();

        expect(headPositions).toEqual([
          { old: [0, 9], new: [0, 5] },
          { old: [0, 5], new: [0, 6] },
        ]);
      });

      it("throws an error if an invalid range is given", function () {
        expect(() =>
          marker.setRange([
            [0, NaN],
            [0, 12],
          ]),
        ).toThrowError("Invalid Point: (0, NaN)");

        expect(buffer.findMarkers({})).toEqual([marker]);
        expect(marker.getRange()).toEqual([
          [0, 6],
          [0, 9],
        ]);
      });
    });

    describe("::clearTail() / ::plantTail()", () => {
      it("clears the tail / plants the tail at the current head position", function () {
        marker.setRange(
          [
            [0, 6],
            [0, 9],
          ],
          { reversed: true },
        );

        changes = [];
        marker.clearTail();
        expect(marker.getRange()).toEqual([
          [0, 6],
          [0, 6],
        ]);
        expect(marker.hasTail()).toBe(false);
        expect(marker.isReversed()).toBe(false);

        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 6],
            newHeadPosition: [0, 6],
            oldTailPosition: [0, 9],
            newTailPosition: [0, 6],
            hadTail: true,
            hasTail: false,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.setHeadPosition([0, 12]);
        expect(marker.getRange()).toEqual([
          [0, 12],
          [0, 12],
        ]);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 6],
            newHeadPosition: [0, 12],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 12],
            hadTail: false,
            hasTail: false,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.plantTail();
        expect(marker.hasTail()).toBe(true);
        expect(marker.isReversed()).toBe(false);
        expect(marker.getRange()).toEqual([
          [0, 12],
          [0, 12],
        ]);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 12],
            newHeadPosition: [0, 12],
            oldTailPosition: [0, 12],
            newTailPosition: [0, 12],
            hadTail: false,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.setHeadPosition([0, 15]);
        expect(marker.getRange()).toEqual([
          [0, 12],
          [0, 15],
        ]);
        expect(changes).toEqual([
          {
            oldHeadPosition: [0, 12],
            newHeadPosition: [0, 15],
            oldTailPosition: [0, 12],
            newTailPosition: [0, 12],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        changes = [];
        marker.plantTail();
        expect(marker.getRange()).toEqual([
          [0, 12],
          [0, 15],
        ]);
        expect(changes).toEqual([]);
      });
    });

    describe("::setProperties(properties)", () => {
      it("merges the given properties into the current properties", function () {
        marker.setProperties({ foo: 1 });
        expect(marker.getProperties()).toEqual({ foo: 1 });
        marker.setProperties({ bar: 2 });
        expect(marker.getProperties()).toEqual({ foo: 1, bar: 2 });
        expect(markersUpdatedCount).toBe(2);
      });
    });
  });

  describe("indirect updates (due to buffer changes)", function () {
    let allStrategies, neverMarker, surroundMarker, overlapMarker, insideMarker, touchMarker;

    beforeEach(function () {
      overlapMarker = buffer.markRange(
        [
          [0, 6],
          [0, 9],
        ],
        { invalidate: "overlap" },
      );
      neverMarker = overlapMarker.copy({ invalidate: "never" });
      surroundMarker = overlapMarker.copy({ invalidate: "surround" });
      insideMarker = overlapMarker.copy({ invalidate: "inside" });
      touchMarker = overlapMarker.copy({ invalidate: "touch" });
      allStrategies = [neverMarker, surroundMarker, overlapMarker, insideMarker, touchMarker];
      markersUpdatedCount = 0;
    });

    it("defers notifying Marker::onDidChange observers until after notifying Buffer::onDidChange observers", function () {
      for (let marker of allStrategies) {
        marker.changes = [];
        marker.onDidChange((change) => marker.changes.push(change));
      }

      let changedCount = 0;
      const changeSubscription = buffer.onDidChange(function (change) {
        changedCount++;
        expect(markersUpdatedCount).toBe(0);
        for (let marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 8],
            [0, 11],
          ]);
          expect(marker.isValid()).toBe(true);
          expect(marker.changes.length).toBe(0);
        }
      });

      buffer.setTextInRange(
        [
          [0, 1],
          [0, 2],
        ],
        "ABC",
      );

      expect(changedCount).toBe(1);

      for (let marker of allStrategies) {
        expect(marker.changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 11],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 8],
            hadTail: true,
            hasTail: true,
            wasValid: true,
            isValid: true,
            oldProperties: {},
            newProperties: {},
            textChanged: true,
          },
        ]);
      }
      expect(markersUpdatedCount).toBe(1);

      for (const marker of allStrategies) {
        marker.changes = [];
      }
      changeSubscription.dispose();
      changedCount = 0;
      markersUpdatedCount = 0;
      buffer.onDidChange(function (change) {
        changedCount++;
        expect(markersUpdatedCount).toBe(0);
        for (const marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 6],
            [0, 9],
          ]);
          expect(marker.isValid()).toBe(true);
          expect(marker.changes.length).toBe(0);
        }
      });
    });

    it("notifies ::onDidUpdateMarkers observers even if there are no Marker::onDidChange observers", function () {
      expect(markersUpdatedCount).toBe(0);
      buffer.insert([0, 0], "123");
      expect(markersUpdatedCount).toBe(1);
      overlapMarker.setRange([
        [0, 1],
        [0, 2],
      ]);
      expect(markersUpdatedCount).toBe(2);
    });

    it("emits onDidChange events when undoing/redoing text changes that move the marker", function () {
      const marker = buffer.markRange([
        [0, 4],
        [0, 8],
      ]);
      buffer.insert([0, 0], "ABCD");

      const changes = [];
      marker.onDidChange((change) => changes.push(change));
      buffer.undo();
      expect(changes.length).toBe(1);
      expect(changes[0].newHeadPosition).toEqual([0, 8]);
      buffer.redo();
      expect(changes.length).toBe(2);
      expect(changes[1].newHeadPosition).toEqual([0, 12]);
    });

    describe("when a change precedes a marker", () => {
      it("shifts the marker based on the characters inserted or removed by the change", function () {
        let marker;
        buffer.setTextInRange(
          [
            [0, 1],
            [0, 2],
          ],
          "ABC",
        );
        for (const marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 8],
            [0, 11],
          ]);
          expect(marker.isValid()).toBe(true);
        }

        buffer.setTextInRange(
          [
            [0, 1],
            [0, 1],
          ],
          "\nDEF",
        );
        for (const marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [1, 10],
            [1, 13],
          ]);
          expect(marker.isValid()).toBe(true);
        }
      });
    });

    describe("when a change follows a marker", () => {
      it("does not shift the marker", function () {
        buffer.setTextInRange(
          [
            [0, 10],
            [0, 12],
          ],
          "ABC",
        );
        for (var marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 6],
            [0, 9],
          ]);
          expect(marker.isValid()).toBe(true);
        }
      });
    });

    describe("when a change starts at a marker's start position", function () {
      describe("when the marker has a tail", () => {
        it("interprets the change as being inside the marker for all invalidation strategies", function () {
          buffer.setTextInRange(
            [
              [0, 6],
              [0, 7],
            ],
            "ABC",
          );

          for (var marker of difference(allStrategies, [insideMarker, touchMarker])) {
            expect(marker.getRange()).toEqual([
              [0, 6],
              [0, 11],
            ]);
            expect(marker.isValid()).toBe(true);
          }

          expect(insideMarker.getRange()).toEqual([
            [0, 9],
            [0, 11],
          ]);
          expect(insideMarker.isValid()).toBe(false);
          expect(touchMarker.getRange()).toEqual([
            [0, 6],
            [0, 11],
          ]);
          expect(touchMarker.isValid()).toBe(false);
        });
      });

      describe("when the marker has no tail", () => {
        it("interprets the change as being outside the marker for all invalidation strategies", function () {
          let marker;
          for (const marker of allStrategies) {
            marker.setRange(
              [
                [0, 6],
                [0, 11],
              ],
              { reversed: true },
            );
            marker.clearTail();
            expect(marker.getRange()).toEqual([
              [0, 6],
              [0, 6],
            ]);
          }

          buffer.setTextInRange(
            [
              [0, 6],
              [0, 6],
            ],
            "ABC",
          );

          for (marker of difference(allStrategies, [touchMarker])) {
            expect(marker.getRange()).toEqual([
              [0, 9],
              [0, 9],
            ]);
            expect(marker.isValid()).toBe(true);
          }

          expect(touchMarker.getRange()).toEqual([
            [0, 9],
            [0, 9],
          ]);
          expect(touchMarker.isValid()).toBe(false);

          buffer.setTextInRange(
            [
              [0, 9],
              [0, 9],
            ],
            "DEF",
          );

          for (marker of difference(allStrategies, [touchMarker])) {
            expect(marker.getRange()).toEqual([
              [0, 12],
              [0, 12],
            ]);
            expect(marker.isValid()).toBe(true);
          }

          expect(touchMarker.getRange()).toEqual([
            [0, 12],
            [0, 12],
          ]);
          expect(touchMarker.isValid()).toBe(false);
        });
      });
    });

    describe("when a change ends at a marker's start position but starts before it", () => {
      it("interprets the change as being outside the marker for all invalidation strategies", function () {
        buffer.setTextInRange(
          [
            [0, 4],
            [0, 6],
          ],
          "ABC",
        );

        for (var marker of difference(allStrategies, [touchMarker])) {
          expect(marker.getRange()).toEqual([
            [0, 7],
            [0, 10],
          ]);
          expect(marker.isValid()).toBe(true);
        }

        expect(touchMarker.getRange()).toEqual([
          [0, 7],
          [0, 10],
        ]);
        expect(touchMarker.isValid()).toBe(false);
      });
    });

    describe("when a change starts and ends at a marker's start position", () => {
      it("interprets the change as being inside the marker for all invalidation strategies except 'inside'", function () {
        buffer.insert([0, 6], "ABC");

        for (var marker of difference(allStrategies, [insideMarker, touchMarker])) {
          expect(marker.getRange()).toEqual([
            [0, 6],
            [0, 12],
          ]);
          expect(marker.isValid()).toBe(true);
        }

        expect(insideMarker.getRange()).toEqual([
          [0, 9],
          [0, 12],
        ]);
        expect(insideMarker.isValid()).toBe(true);

        expect(touchMarker.getRange()).toEqual([
          [0, 6],
          [0, 12],
        ]);
        expect(touchMarker.isValid()).toBe(false);
      });
    });

    describe("when a change starts at a marker's end position", function () {
      describe("when the change is an insertion", () => {
        it("interprets the change as being inside the marker for all invalidation strategies except 'inside'", function () {
          buffer.setTextInRange(
            [
              [0, 9],
              [0, 9],
            ],
            "ABC",
          );

          for (var marker of difference(allStrategies, [insideMarker, touchMarker])) {
            expect(marker.getRange()).toEqual([
              [0, 6],
              [0, 12],
            ]);
            expect(marker.isValid()).toBe(true);
          }

          expect(insideMarker.getRange()).toEqual([
            [0, 6],
            [0, 9],
          ]);
          expect(insideMarker.isValid()).toBe(true);

          expect(touchMarker.getRange()).toEqual([
            [0, 6],
            [0, 12],
          ]);
          expect(touchMarker.isValid()).toBe(false);
        });
      });

      describe("when the change replaces some existing text", () => {
        it("interprets the change as being outside the marker for all invalidation strategies", function () {
          buffer.setTextInRange(
            [
              [0, 9],
              [0, 11],
            ],
            "ABC",
          );

          for (var marker of difference(allStrategies, [touchMarker])) {
            expect(marker.getRange()).toEqual([
              [0, 6],
              [0, 9],
            ]);
            expect(marker.isValid()).toBe(true);
          }

          expect(touchMarker.getRange()).toEqual([
            [0, 6],
            [0, 9],
          ]);
          expect(touchMarker.isValid()).toBe(false);
        });
      });
    });

    describe("when a change surrounds a marker", () => {
      it("truncates the marker to the end of the change and invalidates every invalidation strategy except 'never'", function () {
        let marker;
        buffer.setTextInRange(
          [
            [0, 5],
            [0, 10],
          ],
          "ABC",
        );

        for (const marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 8],
            [0, 8],
          ]);
        }

        for (marker of difference(allStrategies, [neverMarker])) {
          expect(marker.isValid()).toBe(false);
        }

        expect(neverMarker.isValid()).toBe(true);
      });
    });

    describe("when a change is inside a marker", () => {
      it("adjusts the marker's end position and invalidates markers with an 'inside' or 'touch' strategy", function () {
        let marker;
        buffer.setTextInRange(
          [
            [0, 7],
            [0, 8],
          ],
          "AB",
        );

        for (const marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 6],
            [0, 10],
          ]);
        }

        for (marker of difference(allStrategies, [insideMarker, touchMarker])) {
          expect(marker.isValid()).toBe(true);
        }

        expect(insideMarker.isValid()).toBe(false);
        expect(touchMarker.isValid()).toBe(false);
      });
    });

    describe("when a change overlaps the start of a marker", () => {
      it("moves the start of the marker to the end of the change and invalidates the marker if its stategy is 'overlap', 'inside', or 'touch'", function () {
        buffer.setTextInRange(
          [
            [0, 5],
            [0, 7],
          ],
          "ABC",
        );

        for (var marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 8],
            [0, 10],
          ]);
        }

        expect(neverMarker.isValid()).toBe(true);
        expect(surroundMarker.isValid()).toBe(true);
        expect(overlapMarker.isValid()).toBe(false);
        expect(insideMarker.isValid()).toBe(false);
        expect(touchMarker.isValid()).toBe(false);
      });
    });

    describe("when a change overlaps the end of a marker", () => {
      it("moves the end of the marker to the end of the change and invalidates the marker if its stategy is 'overlap', 'inside', or 'touch'", function () {
        buffer.setTextInRange(
          [
            [0, 8],
            [0, 10],
          ],
          "ABC",
        );

        for (var marker of allStrategies) {
          expect(marker.getRange()).toEqual([
            [0, 6],
            [0, 11],
          ]);
        }

        expect(neverMarker.isValid()).toBe(true);
        expect(surroundMarker.isValid()).toBe(true);
        expect(overlapMarker.isValid()).toBe(false);
        expect(insideMarker.isValid()).toBe(false);
        expect(touchMarker.isValid()).toBe(false);
      });
    });

    describe("when multiple changes occur in a transaction", () => {
      it("emits one change event for each marker that was indirectly updated", function () {
        for (let strategy of allStrategies) {
          strategy.changes = [];
          strategy.onDidChange((change) => strategy.changes.push(change));
        }

        buffer.transact(function () {
          buffer.insert([0, 7], ".");
          buffer.append("!");

          for (let strategy of allStrategies) {
            expect(strategy.changes.length).toBe(0);
          }

          neverMarker.setRange([
            [0, 0],
            [0, 1],
          ]);
        });

        expect(neverMarker.changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 1],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 0],
            wasValid: true,
            isValid: true,
            hadTail: true,
            hasTail: true,
            oldProperties: {},
            newProperties: {},
            textChanged: false,
          },
        ]);

        expect(insideMarker.changes).toEqual([
          {
            oldHeadPosition: [0, 9],
            newHeadPosition: [0, 10],
            oldTailPosition: [0, 6],
            newTailPosition: [0, 6],
            wasValid: true,
            isValid: false,
            hadTail: true,
            hasTail: true,
            oldProperties: {},
            newProperties: {},
            textChanged: true,
          },
        ]);
      });
    });
  });

  describe("destruction", function () {
    it("removes the marker from the buffer, marks it destroyed and invalid, and notifies ::onDidDestroy observers", function () {
      let destroyedHandler;
      const marker = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      expect(buffer.getMarker(marker.id)).toBe(marker);
      marker.onDidDestroy((destroyedHandler = jasmine.createSpy("destroyedHandler")));

      marker.destroy();

      expect(destroyedHandler.calls.count()).toBe(1);
      expect(buffer.getMarker(marker.id)).toBeUndefined();
      expect(marker.isDestroyed()).toBe(true);
      expect(marker.isValid()).toBe(false);
      expect(marker.getRange()).toEqual([
        [0, 0],
        [0, 0],
      ]);
    });

    it("handles markers deleted in event handlers", function () {
      let marker1 = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      let marker2 = marker1.copy();
      let marker3 = marker1.copy();

      marker1.onDidChange(function () {
        marker1.destroy();
        marker2.destroy();
        marker3.destroy();
      });

      // doesn't blow up.
      buffer.insert([0, 0], "!");

      marker1 = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      marker2 = marker1.copy();
      marker3 = marker1.copy();

      marker1.onDidChange(function () {
        marker1.destroy();
        marker2.destroy();
        marker3.destroy();
      });

      // doesn't blow up.
      buffer.undo();
    });

    it("does not reinsert the marker if its range is later updated", function () {
      const marker = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      marker.destroy();
      expect(buffer.findMarkers({ intersectsRow: 0 })).toEqual([]);
      marker.setRange([
        [0, 0],
        [0, 9],
      ]);
      expect(buffer.findMarkers({ intersectsRow: 0 })).toEqual([]);
    });

    it("does not blow up when destroy is called twice", function () {
      const marker = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      marker.destroy();
      marker.destroy();
    });
  });

  describe("subscription disposal", function () {
    it("stops tracking the marker for change events once all ::onDidChange subscriptions are disposed", function () {
      const marker = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      const layer = marker.layer;

      const subscription1 = marker.onDidChange(() => {});
      const subscription2 = marker.onDidChange(() => {});
      expect(layer.markersWithChangeListeners.has(marker)).toBe(true);

      subscription1.dispose();
      expect(layer.markersWithChangeListeners.has(marker)).toBe(true);
      subscription2.dispose();
      expect(layer.markersWithChangeListeners.has(marker)).toBe(false);

      // Resubscribing tracks the marker again, with fresh event state.
      const changes = [];
      marker.onDidChange((change) => changes.push(change));
      expect(layer.markersWithChangeListeners.has(marker)).toBe(true);
      marker.setRange([
        [0, 1],
        [0, 2],
      ]);
      expect(changes.length).toBe(1);
      expect(changes[0].oldHeadPosition).toEqual([0, 6]);
    });

    it("stops tracking the marker for destroy events once all ::onDidDestroy subscriptions are disposed", function () {
      const marker = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      const layer = marker.layer;

      const subscription = marker.onDidDestroy(() => {});
      expect(layer.markersWithDestroyListeners.has(marker)).toBe(true);
      subscription.dispose();
      expect(layer.markersWithDestroyListeners.has(marker)).toBe(false);
    });

    it("does not blow up when subscriptions are disposed after the marker is destroyed", function () {
      const marker = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      const changeSubscription = marker.onDidChange(() => {});
      const destroySubscription = marker.onDidDestroy(() => {});
      marker.destroy();
      changeSubscription.dispose();
      destroySubscription.dispose();
    });
  });

  describe("TextBuffer::findMarkers(properties)", function () {
    let marker1, marker2, marker3, marker4;

    beforeEach(function () {
      marker1 = buffer.markRange(
        [
          [0, 0],
          [0, 3],
        ],
        { class: "a" },
      );
      marker2 = buffer.markRange(
        [
          [0, 0],
          [0, 5],
        ],
        { class: "a", invalidate: "surround" },
      );
      marker3 = buffer.markRange(
        [
          [0, 4],
          [0, 7],
        ],
        { class: "a" },
      );
      marker4 = buffer.markRange(
        [
          [0, 0],
          [0, 7],
        ],
        { class: "b", invalidate: "never" },
      );
    });

    it("can find markers based on custom properties", function () {
      expect(buffer.findMarkers({ class: "a" })).toEqual([marker2, marker1, marker3]);
      expect(buffer.findMarkers({ class: "b" })).toEqual([marker4]);
    });

    it("can find markers based on their invalidation strategy", function () {
      expect(buffer.findMarkers({ invalidate: "overlap" })).toEqual([marker1, marker3]);
      expect(buffer.findMarkers({ invalidate: "surround" })).toEqual([marker2]);
      expect(buffer.findMarkers({ invalidate: "never" })).toEqual([marker4]);
    });

    it("can find markers that start or end at a given position", function () {
      expect(buffer.findMarkers({ startPosition: [0, 0] })).toEqual([marker4, marker2, marker1]);
      expect(buffer.findMarkers({ startPosition: [0, 0], class: "a" })).toEqual([marker2, marker1]);
      expect(
        buffer.findMarkers({ startPosition: [0, 0], endPosition: [0, 3], class: "a" }),
      ).toEqual([marker1]);
      expect(buffer.findMarkers({ startPosition: [0, 4], endPosition: [0, 7] })).toEqual([marker3]);
      expect(buffer.findMarkers({ endPosition: [0, 7] })).toEqual([marker4, marker3]);
      expect(buffer.findMarkers({ endPosition: [0, 7], class: "b" })).toEqual([marker4]);
    });

    it("can find markers that start or end at a given range", function () {
      expect(
        buffer.findMarkers({
          startsInRange: [
            [0, 0],
            [0, 4],
          ],
        }),
      ).toEqual([marker4, marker2, marker1, marker3]);
      expect(
        buffer.findMarkers({
          startsInRange: [
            [0, 0],
            [0, 4],
          ],
          class: "a",
        }),
      ).toEqual([marker2, marker1, marker3]);
      expect(
        buffer.findMarkers({
          startsInRange: [
            [0, 0],
            [0, 4],
          ],
          endsInRange: [
            [0, 3],
            [0, 6],
          ],
        }),
      ).toEqual([marker2, marker1]);
      expect(
        buffer.findMarkers({
          endsInRange: [
            [0, 5],
            [0, 7],
          ],
        }),
      ).toEqual([marker4, marker2, marker3]);
    });

    it("can find markers that contain a given point", function () {
      expect(buffer.findMarkers({ containsPosition: [0, 0] })).toEqual([marker4, marker2, marker1]);
      expect(buffer.findMarkers({ containsPoint: [0, 0] })).toEqual([marker4, marker2, marker1]);
      expect(buffer.findMarkers({ containsPoint: [0, 1], class: "a" })).toEqual([marker2, marker1]);
      expect(buffer.findMarkers({ containsPoint: [0, 4] })).toEqual([marker4, marker2, marker3]);
    });

    it("can find markers that contain a given range", function () {
      expect(
        buffer.findMarkers({
          containsRange: [
            [0, 1],
            [0, 4],
          ],
        }),
      ).toEqual([marker4, marker2]);
      expect(
        buffer.findMarkers({
          containsRange: [
            [0, 4],
            [0, 1],
          ],
        }),
      ).toEqual([marker4, marker2]);
      expect(
        buffer.findMarkers({
          containsRange: [
            [0, 1],
            [0, 3],
          ],
        }),
      ).toEqual([marker4, marker2, marker1]);
      expect(
        buffer.findMarkers({
          containsRange: [
            [0, 6],
            [0, 7],
          ],
        }),
      ).toEqual([marker4, marker3]);
    });

    it("can find markers that intersect a given range", function () {
      expect(
        buffer.findMarkers({
          intersectsRange: [
            [0, 4],
            [0, 6],
          ],
        }),
      ).toEqual([marker4, marker2, marker3]);
      expect(
        buffer.findMarkers({
          intersectsRange: [
            [0, 0],
            [0, 2],
          ],
        }),
      ).toEqual([marker4, marker2, marker1]);
    });

    it("can find markers that start or end at a given row", function () {
      buffer.setTextInRange(
        [
          [0, 7],
          [0, 7],
        ],
        "\n",
      );
      buffer.setTextInRange(
        [
          [0, 3],
          [0, 4],
        ],
        " \n",
      );
      expect(buffer.findMarkers({ startRow: 0 })).toEqual([marker4, marker2, marker1]);
      expect(buffer.findMarkers({ startRow: 1 })).toEqual([marker3]);
      expect(buffer.findMarkers({ endRow: 2 })).toEqual([marker4, marker3]);
      expect(buffer.findMarkers({ startRow: 0, endRow: 2 })).toEqual([marker4]);
    });

    it("can find markers that intersect a given row", function () {
      buffer.setTextInRange(
        [
          [0, 7],
          [0, 7],
        ],
        "\n",
      );
      buffer.setTextInRange(
        [
          [0, 3],
          [0, 4],
        ],
        " \n",
      );
      expect(buffer.findMarkers({ intersectsRow: 0 })).toEqual([marker4, marker2, marker1]);
      expect(buffer.findMarkers({ intersectsRow: 1 })).toEqual([marker4, marker2, marker3]);
    });

    it("can find markers that intersect a given range", function () {
      buffer.setTextInRange(
        [
          [0, 7],
          [0, 7],
        ],
        "\n",
      );
      buffer.setTextInRange(
        [
          [0, 3],
          [0, 4],
        ],
        " \n",
      );
      expect(buffer.findMarkers({ intersectsRowRange: [1, 2] })).toEqual([
        marker4,
        marker2,
        marker3,
      ]);
    });

    it("can find markers that are contained within a certain range, inclusive", function () {
      expect(
        buffer.findMarkers({
          containedInRange: [
            [0, 0],
            [0, 6],
          ],
        }),
      ).toEqual([marker2, marker1]);
      expect(
        buffer.findMarkers({
          containedInRange: [
            [0, 4],
            [0, 7],
          ],
        }),
      ).toEqual([marker3]);
    });
  });
});
