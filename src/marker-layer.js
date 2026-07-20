const { Emitter } = require("event-kit");
const Point = require("./point");
const Range = require("./range");
const Marker = require("./marker");
const { MarkerIndex } = require("@lumine-code/superstring");
const { intersectSet } = require("./set-helpers");
const SerializationVersion = 2;

// Public: *Experimental:* A container for a related set of markers.

// This API is experimental and subject to change on any release.
class MarkerLayer {
  static deserialize(delegate, state) {
    var store;
    store = new MarkerLayer(delegate, 0);
    store.deserialize(state);
    return store;
  }

  static deserializeSnapshot(snapshot) {
    var layerId, markerId, markerSnapshot, markerSnapshots, result;
    result = {};
    for (layerId in snapshot) {
      markerSnapshots = snapshot[layerId];
      result[layerId] = {};
      for (markerId in markerSnapshots) {
        markerSnapshot = markerSnapshots[markerId];
        result[layerId][markerId] = {
          ...markerSnapshot,
          range: Range.fromObject(markerSnapshot.range),
        };
      }
    }
    return result;
  }

  /*
  Section: Lifecycle
  */
  constructor(
    delegate,
    id,
    { destroyInvalidatedMarkers = false, maintainHistory = false, persistent = false, role } = {},
  ) {
    this.delegate = delegate;
    this.id = id;
    this.maintainHistory = maintainHistory;
    this.destroyInvalidatedMarkers = destroyInvalidatedMarkers;
    this.role = role;
    if (this.role === "selections") {
      this.delegate.registerSelectionsMarkerLayer(this);
    }
    this.persistent = persistent;

    this.emitter = new Emitter();
    this.index = new MarkerIndex();
    this.markersById = new Map();
    this.markersWithChangeListeners = new Set();
    this.markersWithDestroyListeners = new Set();
    this.displayMarkerLayers = new Set();
    this.destroyed = false;
    this.emitCreateMarkerEvents = false;
  }

  // Public: Create a copy of this layer with markers in the same state and
  // locations.
  copy() {
    let copy = this.delegate.addMarkerLayer({
      destroyInvalidatedMarkers: this.destroyInvalidatedMarkers,
      maintainHistory: this.maintainHistory,
      persistent: this.persistent,
      role: this.role,
    });
    for (let marker of this.markersById.values()) {
      let snapshot = marker.getSnapshot(null);
      copy.createMarker(marker.getRange(), snapshot);
    }
    return copy;
  }

  // Public: Destroy this layer.
  destroy() {
    if (this.destroyed) {
      return;
    }
    this.clear();
    // Mark the layer destroyed before notifying the display marker layers; a
    // display layer that owns this layer calls back into this method.
    this.destroyed = true;
    this.delegate.markerLayerDestroyed(this);
    this.displayMarkerLayers.forEach(function (displayMarkerLayer) {
      return displayMarkerLayer.destroy();
    });
    this.displayMarkerLayers.clear();
    this.emitter.emit("did-destroy");
    return this.emitter.clear();
  }

  // Public: Remove all markers from this layer.
  clear() {
    this.markersWithDestroyListeners.forEach(function (marker) {
      // Suppress the per-marker update events; a single one is emitted below.
      return marker.destroy(true);
    });
    this.markersWithDestroyListeners.clear();
    this.markersById = new Map();
    this.index = new MarkerIndex();
    this.displayMarkerLayers.forEach(function (layer) {
      return layer.didClearBufferMarkerLayer();
    });
    return this.delegate.markersUpdated(this);
  }

  // Public: Determine whether this layer has been destroyed.
  isDestroyed() {
    return this.destroyed;
  }

  isAlive() {
    return !this.destroyed;
  }

  /*
  Section: Querying
  */
  // Public: Get an existing marker by its id.

  // Returns a {Marker}.
  getMarker(id) {
    return this.markersById.get(parseInt(id));
  }

  // Public: Get all existing markers on the marker layer.

  // Returns an {Array} of {Marker}s.
  getMarkers() {
    return [...this.markersById.values()];
  }

  // Public: Get the number of markers in the marker layer.

  // Returns a {Number}.
  getMarkerCount() {
    return this.markersById.size;
  }

  // Public: Find markers in the layer conforming to the given parameters.

  // See the documentation for {TextBuffer::findMarkers}.
  findMarkers(params) {
    let markerIds = null;
    // Range-based params are consumed by the index queries below; the rest are
    // matched against each candidate marker. The caller's object is not mutated.
    const markerParams = {};
    for (let [key, value] of Object.entries(params)) {
      let start, end, position;
      switch (key) {
        case "startPosition":
          markerIds = filterSet(markerIds, this.index.findStartingAt(Point.fromObject(value)));
          break;
        case "endPosition":
          markerIds = filterSet(markerIds, this.index.findEndingAt(Point.fromObject(value)));
          break;
        case "startsInRange":
          ({ start, end } = Range.fromObject(value));
          markerIds = filterSet(markerIds, this.index.findStartingIn(start, end));
          break;
        case "endsInRange":
          ({ start, end } = Range.fromObject(value));
          markerIds = filterSet(markerIds, this.index.findEndingIn(start, end));
          break;
        case "containsPoint":
        case "containsPosition":
          position = Point.fromObject(value);
          markerIds = filterSet(markerIds, this.index.findContaining(position, position));
          break;
        case "containsRange":
          ({ start, end } = Range.fromObject(value));
          markerIds = filterSet(markerIds, this.index.findContaining(start, end));
          break;
        case "intersectsRange":
          ({ start, end } = Range.fromObject(value));
          markerIds = filterSet(markerIds, this.index.findIntersecting(start, end));
          break;
        case "startRow":
          markerIds = filterSet(
            markerIds,
            this.index.findStartingIn(Point(value, 0), Point(value, Infinity)),
          );
          break;
        case "endRow":
          markerIds = filterSet(
            markerIds,
            this.index.findEndingIn(Point(value, 0), Point(value, Infinity)),
          );
          break;
        case "intersectsRow":
          markerIds = filterSet(
            markerIds,
            this.index.findIntersecting(Point(value, 0), Point(value, Infinity)),
          );
          break;
        case "intersectsRowRange":
          markerIds = filterSet(
            markerIds,
            this.index.findIntersecting(Point(value[0], 0), Point(value[1], Infinity)),
          );
          break;
        case "containedInRange":
          ({ start, end } = Range.fromObject(value));
          markerIds = filterSet(markerIds, this.index.findContainedIn(start, end));
          break;
        default:
          markerParams[key] = value;
      }
    }
    if (markerIds == null) {
      markerIds = new Set(this.markersById.keys());
    }
    let result = [];
    for (let markerId of markerIds) {
      let marker = this.markersById.get(markerId);
      if (!marker.matchesParams(markerParams)) continue;
      result.push(marker);
    }
    // Tiebreak equal ranges by id so the order doesn't depend on the
    // insertion order of `markersById`.
    result.sort((a, b) => a.compare(b) || a.id - b.id);
    return result;
  }

  // Public: Get the role of the marker layer e.g. `atom.selection`.

  // Returns a {String}.
  getRole() {
    return this.role;
  }

  /*
  Section: Marker creation
  */
  // Public: Create a marker with the given range.
  //
  // * `range` A {Range} or range-compatible {Array}
  // * `options` A hash of key-value pairs to associate with the marker. There
  //   are also reserved property names that have marker-specific meaning.
  //   * `reversed` (optional) {Boolean} Creates the marker in a reversed
  //     orientation. (default: false)
  //   * `invalidate` (optional) {String} Determines the rules by which changes
  //     to the buffer *invalidate* the marker. (default: 'overlap') It can be
  //     any of the following strategies, in order of fragility:
  //     * __never__: The marker is never marked as invalid. This is a good choice for
  //       markers representing selections in an editor.
  //     * __surround__: The marker is invalidated by changes that completely surround it.
  //     * __overlap__: The marker is invalidated by changes that surround the
  //       start or end of the marker. This is the default.
  //     * __inside__: The marker is invalidated by changes that extend into the
  //       inside of the marker. Changes that end at the marker's start or
  //       start at the marker's end do not invalidate the marker.
  //     * __touch__: The marker is invalidated by a change that touches the marked
  //       region in any way, including changes that end at the marker's
  //       start or start at the marker's end. This is the most fragile strategy.
  //   * `exclusive` {Boolean} indicating whether insertions at the start or end
  //     of the marked range should be interpreted as happening *outside* the
  //     marker. Defaults to `false`, except when using the `inside`
  //     invalidation strategy or when the marker has no tail, in which
  //     case it defaults to true. Explicitly assigning this option overrides
  //     behavior in all circumstances.

  // Returns a {Marker}.
  markRange(range, options = {}) {
    return this.createMarker(this.delegate.clipRange(range), Marker.extractParams(options));
  }

  // Public: Create a marker at with its head at the given position with no tail.
  //
  // * `position` {Point} or point-compatible {Array}
  // * `options` (optional) An {Object} with the following keys:
  //   * `invalidate` (optional) {String} Determines the rules by which changes
  //     to the buffer *invalidate* the marker. (default: 'overlap') It can be
  //     any of the following strategies, in order of fragility:
  //     * __never__: The marker is never marked as invalid. This is a good choice for
  //       markers representing selections in an editor.
  //     * __surround__: The marker is invalidated by changes that completely surround it.
  //     * __overlap__: The marker is invalidated by changes that surround the
  //       start or end of the marker. This is the default.
  //     * __inside__: The marker is invalidated by changes that extend into the
  //       inside of the marker. Changes that end at the marker's start or
  //       start at the marker's end do not invalidate the marker.
  //     * __touch__: The marker is invalidated by a change that touches the marked
  //       region in any way, including changes that end at the marker's
  //       start or start at the marker's end. This is the most fragile strategy.
  //   * `exclusive` {Boolean} indicating whether insertions at the start or end
  //     of the marked range should be interpreted as happening *outside* the
  //     marker. Defaults to `false`, except when using the `inside`
  //     invalidation strategy or when the marker has no tail, in which
  //     case it defaults to true. Explicitly assigning this option overrides
  //     behavior in all circumstances.

  // Returns a {Marker}.
  markPosition(position, options = {}) {
    position = this.delegate.clipPosition(position);
    options = Marker.extractParams(options);
    options.tailed = false;
    return this.createMarker(this.delegate.clipRange(new Range(position, position)), options);
  }

  /*
  Section: Event subscription
  */
  // Public: Subscribe to be notified whenever markers are created, updated,
  // or destroyed on this layer. *Prefer this method for optimal performance
  // when interacting with layers that could contain large numbers of markers.*
  //
  // * `callback` A {Function} that will be called with no arguments when changes
  //   occur on this layer.
  //
  // Changes made within a {TextBuffer::transact} block are batched: subscribers
  // are notified once, at the end of the transaction. Changes made outside a
  // transaction notify subscribers synchronously per change. Either way, you
  // should re-query the layer to determine the state of markers in which you're
  // interested in. It may be counter-intuitive, but this is much more efficient
  // than subscribing to events on individual markers, which are expensive to
  // deliver.

  // Returns a {Disposable}.
  onDidUpdate(callback) {
    return this.emitter.on("did-update", callback);
  }

  // Public: Subscribe to be notified synchronously whenever markers are created
  // on this layer. *Avoid this method for optimal performance when interacting
  // with layers that could contain large numbers of markers.*
  //
  // * `callback` A {Function} that will be called with a {Marker} whenever a
  //   new marker is created.
  //
  // You should prefer {::onDidUpdate} when synchronous notifications aren't
  // absolutely necessary.

  // Returns a {Disposable}.
  onDidCreateMarker(callback) {
    this.emitCreateMarkerEvents = true;
    return this.emitter.on("did-create-marker", callback);
  }

  // Public: Subscribe to be notified synchronously when this layer is destroyed.

  // Returns a {Disposable}.
  onDidDestroy(callback) {
    return this.emitter.on("did-destroy", callback);
  }

  /*
  Section: Private - TextBuffer interface
  */
  splice(start, oldExtent, newExtent) {
    let invalidated = this.index.splice(start, oldExtent, newExtent);
    for (let id of invalidated.touch) {
      let marker = this.markersById.get(id);
      if (invalidated[marker.getInvalidationStrategy()]?.has(id)) {
        if (this.destroyInvalidatedMarkers) {
          marker.destroy();
        } else {
          marker.valid = false;
        }
      }
    }
  }

  restoreFromSnapshot(snapshots, alwaysCreate) {
    if (snapshots == null) return;

    let snapshotIds = Object.keys(snapshots);
    let existingMarkerIds = [...this.markersById.keys()];

    for (let id of snapshotIds) {
      let snapshot = snapshots[id];
      if (alwaysCreate) {
        this.createMarker(snapshot.range, snapshot, true);
        continue;
      }
      let marker = this.markersById.get(parseInt(id));
      if (marker) {
        marker.update(marker.getRange(), snapshot, true, true);
      } else {
        marker = snapshot.marker;
        if (marker) {
          this.markersById.set(marker.id, marker);
          let { range } = snapshot;
          this.index.insert(marker.id, range.start, range.end);
          marker.update(marker.getRange(), snapshot, true, true);
          if (this.emitCreateMarkerEvents) {
            this.emitter.emit("did-create-marker", marker);
          }
        } else {
          this.createMarker(snapshot.range, snapshot, true);
        }
      }
    }

    for (let id of existingMarkerIds) {
      let marker = this.markersById.get(id);
      if (marker && !snapshots[id]) {
        marker.destroy(true);
      }
    }
  }

  createSnapshot() {
    let result = {};
    let ranges = this.index.dump();
    for (let [id, marker] of this.markersById) {
      result[id] = marker.getSnapshot(Range.fromObject(ranges[id]));
    }
    return result;
  }

  emitChangeEvents(snapshot) {
    this.markersWithChangeListeners.forEach(function (marker) {
      if (!marker.isDestroyed()) {
        // event handlers could destroy markers
        return marker.emitChangeEvent(snapshot?.[marker.id]?.range, true, false);
      }
    });
  }

  serialize() {
    let ranges = this.index.dump();
    let markersById = {};
    for (let [id, marker] of this.markersById) {
      markersById[id] = marker.getSnapshot(Range.fromObject(ranges[id]), false);
    }
    return {
      id: this.id,
      maintainHistory: this.maintainHistory,
      role: this.role,
      persistent: this.persistent,
      markersById,
      version: SerializationVersion,
    };
  }

  deserialize(state) {
    // var id, markerState, range, ref;
    if (state.version !== SerializationVersion) {
      return;
    }
    this.id = state.id;
    this.maintainHistory = state.maintainHistory;
    this.role = state.role;
    if (this.role === "selections") {
      this.delegate.registerSelectionsMarkerLayer(this);
    }
    this.persistent = state.persistent;
    for (let [id, markerState] of Object.entries(state.markersById)) {
      let range = Range.fromObject(markerState.range);
      // `markerState` is frozen, so instead of deleting its `range` we'll
      // create a new object and copy all properties _except_ `range`.
      let { range: oldRange, ...params } = markerState;
      this.addMarker(id, range, { ...params });
    }
  }

  /*
  Section: Private - Marker interface
  */
  markerUpdated() {
    return this.delegate.markersUpdated(this);
  }

  destroyMarker(marker, suppressMarkerLayerUpdateEvents = false) {
    if (this.markersById.has(marker.id)) {
      this.markersById.delete(marker.id);
      this.index.remove(marker.id);
      this.markersWithChangeListeners.delete(marker);
      this.markersWithDestroyListeners.delete(marker);
      this.displayMarkerLayers.forEach(function (displayMarkerLayer) {
        displayMarkerLayer.destroyMarker(marker.id);
      });
      if (!suppressMarkerLayerUpdateEvents) {
        this.delegate.markersUpdated(this);
      }
    }
  }

  hasMarker(id) {
    return !this.destroyed && this.index.has(id);
  }

  getMarkerRange(id) {
    return Range.fromObject(this.index.getRange(id));
  }

  getMarkerStartPosition(id) {
    return Point.fromObject(this.index.getStart(id));
  }

  getMarkerEndPosition(id) {
    return Point.fromObject(this.index.getEnd(id));
  }

  compareMarkers(id1, id2) {
    return this.index.compare(id1, id2);
  }

  setMarkerRange(id, range) {
    id = parseInt(id);
    let { start, end } = Range.fromObject(range);
    start = this.delegate.clipPosition(start);
    end = this.delegate.clipPosition(end);
    this.index.remove(id);
    return this.index.insert(id, start, end);
  }

  setMarkerIsExclusive(id, exclusive) {
    return this.index.setExclusive(id, exclusive);
  }

  createMarker(range, params, suppressMarkerLayerUpdateEvents = false) {
    let id = this.delegate.getNextMarkerId();
    let marker = this.addMarker(id, range, params);
    this.delegate.markerCreated(this, marker);
    if (!suppressMarkerLayerUpdateEvents) {
      this.delegate.markersUpdated(this);
    }
    marker.trackDestruction = this.trackDestructionInOnDidCreateMarkerCallbacks ?? false;
    if (this.emitCreateMarkerEvents) {
      this.emitter.emit("did-create-marker", marker);
    }
    marker.trackDestruction = false;
    return marker;
  }

  /*
  Section: Internal
  */
  addMarker(id, range, params) {
    id = parseInt(id);
    range = Range.fromObject(range);
    Point.assertValid(range.start);
    Point.assertValid(range.end);
    this.index.insert(id, range.start, range.end);
    const marker = new Marker(id, this, range, params);
    this.markersById.set(id, marker);
    return marker;
  }

  emitUpdateEvent() {
    return this.emitter.emit("did-update");
  }
}

function filterSet(set1, set2) {
  if (set1) {
    intersectSet(set1, set2);
    return set1;
  } else {
    return set2;
  }
}

module.exports = MarkerLayer;
