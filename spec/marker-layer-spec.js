const { uniq, times } = require("@lumine-code/underscore-plus");
const TextBuffer = require("../src/text-buffer");

describe("MarkerLayer", function () {
  let buffer, layer1, layer2;

  beforeEach(function () {
    jasmine.addCustomEqualityTester(require("@lumine-code/underscore-plus").isEqual);
    buffer = new TextBuffer({ text: "abcdefghijklmnopqrstuvwxyz" });
    layer1 = buffer.addMarkerLayer();
    layer2 = buffer.addMarkerLayer();
  });

  it("ensures that marker ids are unique across layers", function () {
    times(5, function () {
      buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      layer1.markRange([
        [0, 4],
        [0, 7],
      ]);
      layer2.markRange([
        [0, 5],
        [0, 8],
      ]);
    });

    const ids = buffer
      .getMarkers()
      .concat(layer1.getMarkers())
      .concat(layer2.getMarkers())
      .map((marker) => marker.id);

    expect(uniq(ids).length).toEqual(ids.length);
  });

  it("updates each layer's markers when the text changes", function () {
    const defaultMarker = buffer.markRange([
      [0, 3],
      [0, 6],
    ]);
    const layer1Marker = layer1.markRange([
      [0, 4],
      [0, 7],
    ]);
    const layer2Marker = layer2.markRange([
      [0, 5],
      [0, 8],
    ]);

    buffer.setTextInRange(
      [
        [0, 1],
        [0, 2],
      ],
      "BBB",
    );
    expect(defaultMarker.getRange()).toEqual([
      [0, 5],
      [0, 8],
    ]);
    expect(layer1Marker.getRange()).toEqual([
      [0, 6],
      [0, 9],
    ]);
    expect(layer2Marker.getRange()).toEqual([
      [0, 7],
      [0, 10],
    ]);

    layer2.destroy();
    expect(layer2.isAlive()).toBe(false);
    expect(layer2.isDestroyed()).toBe(true);

    expect(layer1.isAlive()).toBe(true);
    expect(layer1.isDestroyed()).toBe(false);

    buffer.undo();
    expect(defaultMarker.getRange()).toEqual([
      [0, 3],
      [0, 6],
    ]);
    expect(layer1Marker.getRange()).toEqual([
      [0, 4],
      [0, 7],
    ]);

    expect(layer2Marker.isDestroyed()).toBe(true);
    expect(layer2Marker.getRange()).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("emits onDidCreateMarker events synchronously when markers are created", function () {
    const createdMarkers = [];
    layer1.onDidCreateMarker((marker) => createdMarkers.push(marker));
    const marker = layer1.markRange([
      [0, 1],
      [2, 3],
    ]);
    expect(createdMarkers).toEqual([marker]);
  });

  it("does not emit marker events on the TextBuffer for non-default layers", function () {
    let updateEventCount;
    let createEventCount = (updateEventCount = 0);
    buffer.onDidCreateMarker(() => createEventCount++);
    buffer.onDidUpdateMarkers(() => updateEventCount++);

    const marker1 = buffer.markRange([
      [0, 1],
      [0, 2],
    ]);
    marker1.setRange([
      [0, 1],
      [0, 3],
    ]);

    expect(createEventCount).toBe(1);
    expect(updateEventCount).toBe(2);

    const marker2 = layer1.markRange([
      [0, 1],
      [0, 2],
    ]);
    marker2.setRange([
      [0, 1],
      [0, 3],
    ]);

    expect(createEventCount).toBe(1);
    expect(updateEventCount).toBe(2);
  });

  describe("when destroyInvalidatedMarkers is enabled for the layer", () => {
    it("destroys markers when they are invalidated via a splice", function () {
      const layer3 = buffer.addMarkerLayer({ destroyInvalidatedMarkers: true });

      const marker1 = layer3.markRange(
        [
          [0, 0],
          [0, 3],
        ],
        { invalidate: "inside" },
      );
      const marker2 = layer3.markRange(
        [
          [0, 2],
          [0, 6],
        ],
        { invalidate: "inside" },
      );

      const destroyedMarkers = [];
      marker1.onDidDestroy(() => destroyedMarkers.push(marker1));
      marker2.onDidDestroy(() => destroyedMarkers.push(marker2));

      buffer.insert([0, 5], "x");

      expect(destroyedMarkers).toEqual([marker2]);
      expect(marker2.isDestroyed()).toBe(true);
      expect(marker1.isDestroyed()).toBe(false);
    });
  });

  describe("when maintainHistory is enabled for the layer", function () {
    let layer3 = null;

    beforeEach(() => (layer3 = buffer.addMarkerLayer({ maintainHistory: true })));

    it("restores the state of all markers in the layer on undo and redo", function () {
      buffer.setText("");
      buffer.transact(() => buffer.append("foo"));
      layer3 = buffer.addMarkerLayer({ maintainHistory: true });

      const marker1 = layer3.markRange(
        [
          [0, 0],
          [0, 0],
        ],
        { invalidate: "never" },
      );
      const marker2 = layer3.markRange(
        [
          [0, 0],
          [0, 0],
        ],
        { invalidate: "never" },
      );

      let marker2ChangeCount = 0;
      marker2.onDidChange(() => marker2ChangeCount++);

      buffer.transact(function () {
        buffer.append("\n");
        buffer.append("bar");

        marker1.destroy();
        marker2.setRange([
          [0, 2],
          [0, 3],
        ]);
        const marker3 = layer3.markRange(
          [
            [0, 0],
            [0, 3],
          ],
          { invalidate: "never" },
        );
        const marker4 = layer3.markRange(
          [
            [1, 0],
            [1, 3],
          ],
          { invalidate: "never" },
        );
        expect(marker2ChangeCount).toBe(1);
      });

      let createdMarker = null;
      layer3.onDidCreateMarker((m) => (createdMarker = m));
      buffer.undo();

      expect(buffer.getText()).toBe("foo");
      expect(marker1.isDestroyed()).toBe(false);
      expect(createdMarker).toBe(marker1);
      let markers = layer3.findMarkers({});
      expect(markers.length).toBe(2);
      expect(markers[0]).toBe(marker1);
      expect(markers[0].getRange()).toEqual([
        [0, 0],
        [0, 0],
      ]);
      expect(markers[1].getRange()).toEqual([
        [0, 0],
        [0, 0],
      ]);
      expect(marker2ChangeCount).toBe(2);

      buffer.redo();

      expect(buffer.getText()).toBe("foo\nbar");
      markers = layer3.findMarkers({});
      expect(markers.length).toBe(3);
      expect(markers[0].getRange()).toEqual([
        [0, 0],
        [0, 3],
      ]);
      expect(markers[1].getRange()).toEqual([
        [0, 2],
        [0, 3],
      ]);
      expect(markers[2].getRange()).toEqual([
        [1, 0],
        [1, 3],
      ]);
    });

    it("does not undo marker manipulations that aren't associated with text changes", function () {
      const marker = layer3.markRange([
        [0, 6],
        [0, 9],
      ]);

      // Can't undo changes in a transaction without other buffer changes
      buffer.transact(() =>
        marker.setRange([
          [0, 4],
          [0, 20],
        ]),
      );
      buffer.undo();
      expect(marker.getRange()).toEqual([
        [0, 4],
        [0, 20],
      ]);

      // Can undo changes in a transaction with other buffer changes
      buffer.transact(function () {
        marker.setRange([
          [0, 5],
          [0, 9],
        ]);
        buffer.setTextInRange(
          [
            [0, 2],
            [0, 3],
          ],
          "XYZ",
        );
        marker.setRange([
          [0, 8],
          [0, 12],
        ]);
      });

      buffer.undo();
      expect(marker.getRange()).toEqual([
        [0, 4],
        [0, 20],
      ]);

      buffer.redo();
      expect(marker.getRange()).toEqual([
        [0, 8],
        [0, 12],
      ]);
    });

    it("ignores snapshot references to marker layers that no longer exist", function () {
      layer3.markRange([
        [0, 6],
        [0, 9],
      ]);
      buffer.append("stuff");
      layer3.destroy();

      // Should not throw an exception
      buffer.undo();
    });
  });

  describe("when a role is provided for the layer", () => {
    it("getRole() returns its role and keeps track of ids of 'selections' role", function () {
      expect(buffer.selectionsMarkerLayerIds.size).toBe(0);

      const selectionsMarkerLayer1 = buffer.addMarkerLayer({ role: "selections" });
      expect(selectionsMarkerLayer1.getRole()).toBe("selections");

      expect(buffer.addMarkerLayer({ role: "role-1" }).getRole()).toBe("role-1");
      expect(buffer.addMarkerLayer().getRole()).toBe(undefined);

      expect(buffer.selectionsMarkerLayerIds.size).toBe(1);
      expect(buffer.selectionsMarkerLayerIds.has(selectionsMarkerLayer1.id)).toBe(true);

      const selectionsMarkerLayer2 = buffer.addMarkerLayer({ role: "selections" });
      expect(selectionsMarkerLayer2.getRole()).toBe("selections");

      expect(buffer.selectionsMarkerLayerIds.size).toBe(2);
      expect(buffer.selectionsMarkerLayerIds.has(selectionsMarkerLayer2.id)).toBe(true);

      selectionsMarkerLayer1.destroy();
      selectionsMarkerLayer2.destroy();
      expect(buffer.selectionsMarkerLayerIds.size).toBe(2);
      expect(buffer.selectionsMarkerLayerIds.has(selectionsMarkerLayer1.id)).toBe(true);
      expect(buffer.selectionsMarkerLayerIds.has(selectionsMarkerLayer2.id)).toBe(true);
    });
  });

  describe("::findMarkers(params)", () => {
    it("does not find markers from other layers", () => {
      const defaultMarker = buffer.markRange([
        [0, 3],
        [0, 6],
      ]);
      const layer1Marker = layer1.markRange([
        [0, 3],
        [0, 6],
      ]);
      const layer2Marker = layer2.markRange([
        [0, 3],
        [0, 6],
      ]);

      expect(buffer.findMarkers({ containsPoint: [0, 4] })).toEqual([defaultMarker]);
      expect(layer1.findMarkers({ containsPoint: [0, 4] })).toEqual([layer1Marker]);
      expect(layer2.findMarkers({ containsPoint: [0, 4] })).toEqual([layer2Marker]);
    });

    it("does not mutate the params object, so it can be reused across calls", () => {
      const marker1 = layer1.markRange(
        [
          [0, 3],
          [0, 6],
        ],
        { class: "a" },
      );
      layer1.markRange(
        [
          [0, 10],
          [0, 12],
        ],
        { class: "b" },
      );

      const params = { containsPoint: [0, 4], class: "a" };
      expect(layer1.findMarkers(params)).toEqual([marker1]);
      expect(params).toEqual({ containsPoint: [0, 4], class: "a" });
      expect(layer1.findMarkers(params)).toEqual([marker1]);
    });
  });

  describe("::onDidUpdate", () => {
    it("notifies observers at the end of the outermost transaction when markers are created, updated, or destroyed", function () {
      let marker1, marker2;

      const displayLayer = buffer.addDisplayLayer();
      let displayLayerDidChange = false;

      let changeCount = 0;
      buffer.onDidChange(() => changeCount++);

      let updateCount = 0;
      layer1.onDidUpdate(function () {
        updateCount++;
        if (updateCount === 1) {
          expect(changeCount).toBe(0);
          buffer.transact(function () {
            marker1.setRange([
              [1, 2],
              [3, 4],
            ]);
            marker2.setRange([
              [4, 5],
              [6, 7],
            ]);
          });
        } else if (updateCount === 2) {
          expect(changeCount).toBe(0);
          buffer.transact(function () {
            buffer.insert([0, 1], "xxx");
            buffer.insert([0, 1], "yyy");
          });
        } else if (updateCount === 3) {
          expect(changeCount).toBe(1);
          marker1.destroy();
          marker2.destroy();
        } else if (updateCount === 7) {
          expect(changeCount).toBe(2);
          expect(displayLayerDidChange).toBe(true, "Display layer was updated after marker layer.");
        }
      });

      buffer.transact(() =>
        buffer.transact(function () {
          marker1 = layer1.markRange([
            [0, 2],
            [0, 4],
          ]);
          marker2 = layer1.markRange([
            [0, 6],
            [0, 8],
          ]);
        }),
      );

      expect(updateCount).toBe(5);

      // update events happen immediately when there is no parent transaction
      layer1.markRange([
        [0, 2],
        [0, 4],
      ]);
      expect(updateCount).toBe(6);

      // update events happen after updating display layers when there is no parent transaction.
      displayLayer.onDidChange(() => (displayLayerDidChange = true));
      buffer.undo();
      expect(updateCount).toBe(7);
    });
  });

  describe("::clear()", () => {
    it("destroys all of the layer's markers", function (done) {
      buffer = new TextBuffer({ text: "abc" });
      const displayLayer = buffer.addDisplayLayer();
      const markerLayer = buffer.addMarkerLayer();
      const displayMarkerLayer = displayLayer.getMarkerLayer(markerLayer.id);
      const marker1 = markerLayer.markRange([
        [0, 1],
        [0, 2],
      ]);
      const marker2 = markerLayer.markRange([
        [0, 1],
        [0, 2],
      ]);
      const marker3 = markerLayer.markRange([
        [0, 1],
        [0, 2],
      ]);
      const displayMarker1 = displayMarkerLayer.getMarker(marker1.id);
      // intentionally omit a display marker for marker2 just to cover that case
      const displayMarker3 = displayMarkerLayer.getMarker(marker3.id);

      let marker1DestroyCount = 0;
      let marker2DestroyCount = 0;
      let displayMarker1DestroyCount = 0;
      let displayMarker3DestroyCount = 0;
      let markerLayerUpdateCount = 0;
      let displayMarkerLayerUpdateCount = 0;
      marker1.onDidDestroy(() => marker1DestroyCount++);
      marker2.onDidDestroy(() => marker2DestroyCount++);
      displayMarker1.onDidDestroy(() => displayMarker1DestroyCount++);
      displayMarker3.onDidDestroy(() => displayMarker3DestroyCount++);
      markerLayer.onDidUpdate(function () {
        markerLayerUpdateCount++;
        if (markerLayerUpdateCount === 1 && displayMarkerLayerUpdateCount === 1) {
          done();
        }
      });
      displayMarkerLayer.onDidUpdate(function () {
        displayMarkerLayerUpdateCount++;
        if (markerLayerUpdateCount === 1 && displayMarkerLayerUpdateCount === 1) {
          done();
        }
      });

      markerLayer.clear();
      expect(marker1.isDestroyed()).toBe(true);
      expect(marker2.isDestroyed()).toBe(true);
      expect(marker3.isDestroyed()).toBe(true);
      expect(displayMarker1.isDestroyed()).toBe(true);
      expect(displayMarker3.isDestroyed()).toBe(true);
      expect(marker1DestroyCount).toBe(1);
      expect(marker2DestroyCount).toBe(1);
      expect(displayMarker1DestroyCount).toBe(1);
      expect(displayMarker3DestroyCount).toBe(1);
      expect(markerLayer.getMarkers()).toEqual([]);
      expect(displayMarkerLayer.getMarkers()).toEqual([]);
      expect(displayMarkerLayer.getMarker(displayMarker3.id)).toBeUndefined();
    });
  });

  describe("::copy", function () {
    it("creates a new marker layer with markers in the same states", function () {
      const originalLayer = buffer.addMarkerLayer({ maintainHistory: true });
      originalLayer.markRange([
        [0, 1],
        [0, 3],
      ]);
      originalLayer.markPosition([0, 2]);

      const copy = originalLayer.copy();
      expect(copy).not.toBe(originalLayer);

      const markers = copy.getMarkers();
      expect(markers.length).toBe(2);
      expect(markers[0].getRange()).toEqual([
        [0, 1],
        [0, 3],
      ]);
      expect(markers[1].getRange()).toEqual([
        [0, 2],
        [0, 2],
      ]);
      expect(markers[1].hasTail()).toBe(false);
    });

    it("copies the marker layer role", function () {
      const originalLayer = buffer.addMarkerLayer({ maintainHistory: true, role: "selections" });
      const copy = originalLayer.copy();
      expect(copy).not.toBe(originalLayer);
      expect(copy.getRole()).toBe("selections");
      expect(buffer.selectionsMarkerLayerIds.has(originalLayer.id)).toBe(true);
      expect(buffer.selectionsMarkerLayerIds.has(copy.id)).toBe(true);
      expect(buffer.selectionsMarkerLayerIds.size).toBe(2);
    });
  });

  describe("::destroy", () => {
    it("destroys the layer's markers", () => {
      buffer = new TextBuffer();
      const markerLayer = buffer.addMarkerLayer();

      const marker1 = markerLayer.markRange([
        [0, 0],
        [0, 0],
      ]);
      const marker2 = markerLayer.markRange([
        [0, 0],
        [0, 0],
      ]);

      const destroyListener = jasmine.createSpy("onDidDestroy listener");
      marker1.onDidDestroy(destroyListener);

      markerLayer.destroy();

      expect(destroyListener).toHaveBeenCalled();
      expect(marker1.isDestroyed()).toBe(true);

      // Markers states are updated regardless of whether they have an
      // `::onDidDestroy` listener.
      expect(marker2.isDestroyed()).toBe(true);
    });
  });

  describe("trackDestructionInOnDidCreateMarkerCallbacks", () => {
    it("stores a stack trace when destroy is called during onDidCreateMarker callbacks", function () {
      layer1.onDidCreateMarker(function (m) {
        if (destroyInCreateCallback) {
          return m.destroy();
        }
      });

      layer1.trackDestructionInOnDidCreateMarkerCallbacks = true;
      var destroyInCreateCallback = true;
      const marker1 = layer1.markPosition([0, 0]);
      expect(marker1.isDestroyed()).toBe(true);
      expect(marker1.destroyStackTrace).toBeDefined();

      destroyInCreateCallback = false;
      const marker2 = layer1.markPosition([0, 0]);
      expect(marker2.isDestroyed()).toBe(false);
      expect(marker2.destroyStackTrace).toBeUndefined();
      marker2.destroy();
      expect(marker2.isDestroyed()).toBe(true);
      expect(marker2.destroyStackTrace).toBeUndefined();

      destroyInCreateCallback = true;
      layer1.trackDestructionInOnDidCreateMarkerCallbacks = false;
      const marker3 = layer1.markPosition([0, 0]);
      expect(marker3.isDestroyed()).toBe(true);
      expect(marker3.destroyStackTrace).toBeUndefined();
    });
  });
});
