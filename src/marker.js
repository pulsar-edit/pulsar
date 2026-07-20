const { isEqual } = require("@lumine-code/underscore-plus");
const { Emitter, Disposable } = require("event-kit");
const Point = require("./point");
const Range = require("./range");

const OptionKeys = new Set(["reversed", "tailed", "invalidate", "exclusive"]);

// Screen-coordinate translation options accepted by the DisplayMarkerLayer
// marking methods; they affect coordinate translation only and are never
// marker state, so they must not be stored as custom properties.
const TranslationOptionKeys = new Set(["clipDirection", "skipSoftWrapIndentation"]);

// Private: Represents a buffer annotation that remains logically stationary
// even as the buffer changes. This is used to represent cursors, folds, snippet
// targets, misspelled words, and anything else that needs to track a logical
// location in the buffer over time.
//
// Head and Tail:
// Markers always have a *head* and sometimes have a *tail*. If you think of a
// marker as an editor selection, the tail is the part that's stationary and the
// head is the part that moves when the mouse is moved. A marker without a tail
// always reports an empty range at the head position. A marker with a head position
// greater than the tail is in a "normal" orientation. If the head precedes the
// tail the marker is in a "reversed" orientation.
//
// Validity:
// Markers are considered *valid* when they are first created. Depending on the
// invalidation strategy you choose, certain changes to the buffer can cause a
// marker to become invalid, for example if the text surrounding the marker is
// deleted. See {TextBuffer::markRange} for invalidation strategies.
class Marker {
  static extractParams(inputParams) {
    const outputParams = {};
    if (inputParams != null) {
      for (const key of Object.keys(inputParams)) {
        if (OptionKeys.has(key)) {
          outputParams[key] = inputParams[key];
        } else if (!TranslationOptionKeys.has(key)) {
          if (outputParams.properties == null) {
            outputParams.properties = {};
          }
          outputParams.properties[key] = inputParams[key];
        }
      }
    }
    return outputParams;
  }

  constructor(id, layer, _range, params, exclusivitySet = false) {
    // The `_range` parameter is kept in place just to keep the API stable,
    // but it's not used; the marker asks its layer for its range later on
    // via `::getRange`.
    this.id = id;
    this.layer = layer;
    ({
      tailed: this.tailed,
      reversed: this.reversed,
      valid: this.valid,
      invalidate: this.invalidate,
      exclusive: this.exclusive,
      properties: this.properties,
    } = params);
    this.emitter = new Emitter();
    if (this.tailed == null) {
      this.tailed = true;
    }
    if (this.reversed == null) {
      this.reversed = false;
    }
    if (this.valid == null) {
      this.valid = true;
    }
    if (this.invalidate == null) {
      this.invalidate = "overlap";
    }
    if (this.properties == null) {
      this.properties = {};
    }
    this.hasChangeObservers = false;
    Object.freeze(this.properties);
    if (!exclusivitySet) {
      this.layer.setMarkerIsExclusive(this.id, this.isExclusive());
    }
  }

  /*
  Section: Event Subscription
  */

  // Public: Invoke the given callback when the marker is destroyed.
  //
  // * `callback` {Function} to be called when the marker is destroyed.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidDestroy(callback) {
    this.layer.markersWithDestroyListeners.add(this);
    const subscription = this.emitter.on("did-destroy", callback);
    return new Disposable(() => {
      subscription.dispose();
      if (this.emitter.listenerCountForEventName("did-destroy") === 0) {
        this.layer.markersWithDestroyListeners.delete(this);
      }
    });
  }

  // Public: Invoke the given callback when the state of the marker changes.
  //
  // * `callback` {Function} to be called when the marker changes.
  //   * `event` {Object} with the following keys:
  //     * `oldHeadPosition` {Point} representing the former head position
  //     * `newHeadPosition` {Point} representing the new head position
  //     * `oldTailPosition` {Point} representing the former tail position
  //     * `newTailPosition` {Point} representing the new tail position
  //     * `wasValid` {Boolean} indicating whether the marker was valid before the change
  //     * `isValid` {Boolean} indicating whether the marker is now valid
  //     * `hadTail` {Boolean} indicating whether the marker had a tail before the change
  //     * `hasTail` {Boolean} indicating whether the marker now has a tail
  //     * `oldProperties` {Object} containing the marker's custom properties before the change.
  //     * `newProperties` {Object} containing the marker's custom properties after the change.
  //     * `textChanged` {Boolean} indicating whether this change was caused by a textual change
  //       to the buffer or whether the marker was manipulated directly via its public API.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChange(callback) {
    if (!this.hasChangeObservers) {
      this.previousEventState = this.getSnapshot(this.getRange());
      this.hasChangeObservers = true;
      this.layer.markersWithChangeListeners.add(this);
    }
    const subscription = this.emitter.on("did-change", callback);
    return new Disposable(() => {
      subscription.dispose();
      if (this.emitter.listenerCountForEventName("did-change") === 0) {
        this.previousEventState = null;
        this.hasChangeObservers = false;
        this.layer.markersWithChangeListeners.delete(this);
      }
    });
  }

  // Public: Returns the current {Range} of the marker. The range is immutable.
  getRange() {
    return this.layer.getMarkerRange(this.id);
  }

  // Public: Sets the range of the marker.
  //
  // * `range` A {Range} or range-compatible {Array}. The range will be clipped
  //   before it is assigned.
  // * `params` (optional) An {Object} with the following keys:
  //   * `reversed`  {Boolean} indicating the marker will to be in a reversed
  //      orientation.
  //   * `exclusive` {Boolean} indicating that changes occurring at either end of
  //     the marker will be considered *outside* the marker rather than inside.
  //     This defaults to `false` unless the marker's invalidation strategy is
  //     `inside` or the marker has no tail, in which case it defaults to `true`.
  setRange(range, params) {
    if (params == null) {
      params = {};
    }
    return this.update(this.getRange(), {
      reversed: params.reversed,
      tailed: true,
      range: Range.fromObject(range, true),
      exclusive: params.exclusive,
    });
  }

  // Public: Returns a {Point} representing the marker's current head position.
  getHeadPosition() {
    if (this.reversed) {
      return this.getStartPosition();
    } else {
      return this.getEndPosition();
    }
  }

  // Public: Sets the head position of the marker.
  //
  // * `position` A {Point} or point-compatible {Array}. The position will be
  //   clipped before it is assigned.
  setHeadPosition(position) {
    position = Point.fromObject(position);
    const oldRange = this.getRange();
    const params = {};

    if (this.hasTail()) {
      if (this.isReversed()) {
        if (position.isLessThan(oldRange.end)) {
          params.range = new Range(position, oldRange.end);
        } else {
          params.reversed = false;
          params.range = new Range(oldRange.end, position);
        }
      } else {
        if (position.isLessThan(oldRange.start)) {
          params.reversed = true;
          params.range = new Range(position, oldRange.start);
        } else {
          params.range = new Range(oldRange.start, position);
        }
      }
    } else {
      params.range = new Range(position, position);
    }
    return this.update(oldRange, params);
  }

  // Public: Returns a {Point} representing the marker's current tail position.
  // If the marker has no tail, the head position will be returned instead.
  getTailPosition() {
    if (this.reversed) {
      return this.getEndPosition();
    } else {
      return this.getStartPosition();
    }
  }

  // Public: Sets the tail position of the marker. If the marker doesn't have a
  // tail, it will after calling this method.
  //
  // * `position` A {Point} or point-compatible {Array}. The position will be
  //   clipped before it is assigned.
  setTailPosition(position) {
    position = Point.fromObject(position);
    const oldRange = this.getRange();
    const params = { tailed: true };

    if (this.reversed) {
      if (position.isLessThan(oldRange.start)) {
        params.reversed = false;
        params.range = new Range(position, oldRange.start);
      } else {
        params.range = new Range(oldRange.start, position);
      }
    } else {
      if (position.isLessThan(oldRange.end)) {
        params.range = new Range(position, oldRange.end);
      } else {
        params.reversed = true;
        params.range = new Range(oldRange.end, position);
      }
    }

    return this.update(oldRange, params);
  }

  // Public: Returns a {Point} representing the start position of the marker,
  // which could be the head or tail position, depending on its orientation.
  getStartPosition() {
    return this.layer.getMarkerStartPosition(this.id);
  }

  // Public: Returns a {Point} representing the end position of the marker,
  // which could be the head or tail position, depending on its orientation.
  getEndPosition() {
    return this.layer.getMarkerEndPosition(this.id);
  }

  // Public: Removes the marker's tail. After calling the marker's head position
  // will be reported as its current tail position until the tail is planted
  // again.
  clearTail() {
    const headPosition = this.getHeadPosition();
    return this.update(this.getRange(), {
      tailed: false,
      reversed: false,
      range: Range(headPosition, headPosition),
    });
  }

  // Public: Plants the marker's tail at the current head position. After calling
  // the marker's tail position will be its head position at the time of the
  // call, regardless of where the marker's head is moved.
  plantTail() {
    if (!this.hasTail()) {
      const headPosition = this.getHeadPosition();
      return this.update(this.getRange(), {
        tailed: true,
        range: new Range(headPosition, headPosition),
      });
    }
  }

  // Public: Returns a {Boolean} indicating whether the head precedes the tail.
  isReversed() {
    return this.tailed && this.reversed;
  }

  // Public: Returns a {Boolean} indicating whether the marker has a tail.
  hasTail() {
    return this.tailed;
  }

  // Public: Is the marker valid?
  //
  // Returns a {Boolean}.
  isValid() {
    return !this.isDestroyed() && this.valid;
  }

  // Public: Is the marker destroyed?
  //
  // Returns a {Boolean}.
  isDestroyed() {
    return !this.layer.hasMarker(this.id);
  }

  // Public: Returns a {Boolean} indicating whether changes that occur exactly at
  // the marker's head or tail cause it to move.
  isExclusive() {
    if (this.exclusive != null) {
      return this.exclusive;
    } else {
      return this.getInvalidationStrategy() === "inside" || !this.hasTail();
    }
  }

  // Public: Returns a {Boolean} indicating whether this marker is equivalent to
  // another marker, meaning they have the same range and options.
  //
  // * `other` {Marker} other marker
  isEqual(other) {
    return (
      this.invalidate === other.invalidate &&
      this.tailed === other.tailed &&
      this.reversed === other.reversed &&
      this.exclusive === other.exclusive &&
      isEqual(this.properties, other.properties) &&
      this.getRange().isEqual(other.getRange())
    );
  }

  // Public: Get the invalidation strategy for this marker.
  //
  // Valid values include: `never`, `surround`, `overlap`, `inside`, and `touch`.
  //
  // Returns a {String}.
  getInvalidationStrategy() {
    return this.invalidate;
  }

  // Public: Returns an {Object} containing any custom properties associated with
  // the marker.
  getProperties() {
    return this.properties;
  }

  // Public: Merges an {Object} containing new properties into the marker's
  // existing properties.
  //
  // * `properties` {Object}
  setProperties(properties) {
    return this.update(this.getRange(), {
      properties: { ...this.properties, ...properties },
    });
  }

  // Public: Creates and returns a new {Marker} with the same properties as this
  // marker.
  //
  // * `params` {Object}
  copy(options = {}) {
    const snapshot = this.getSnapshot(null, false);
    options = Marker.extractParams(options);
    return this.layer.createMarker(this.getRange(), {
      ...snapshot,
      ...options,
      properties: { ...snapshot.properties, ...options.properties },
    });
  }

  // Public: Destroys the marker, causing it to emit the 'destroyed' event.
  destroy(suppressMarkerLayerUpdateEvents) {
    if (this.isDestroyed()) {
      return;
    }

    if (this.trackDestruction) {
      this.destroyStackTrace = new Error().stack;
    }

    this.layer.destroyMarker(this, suppressMarkerLayerUpdateEvents);
    this.emitter.emit("did-destroy");
    return this.emitter.clear();
  }

  // Public: Compares this marker to another based on their ranges.
  //
  // * `other` {Marker}
  compare(other) {
    return this.layer.compareMarkers(this.id, other.id);
  }

  // Public: Returns a {Boolean} indicating whether the marker's range contains
  // the given point.
  //
  // * `point` A {Point} or point-compatible {Array}
  containsPoint(point) {
    return this.getRange().containsPoint(point);
  }

  // Public: Returns a {Boolean} indicating whether the marker's range contains
  // the given range.
  //
  // * `range` A {Range} or range-compatible {Array}
  containsRange(range) {
    return this.getRange().containsRange(range);
  }

  // Public: Returns a {Boolean} indicating whether the marker's range
  // intersects the given row.
  //
  // * `row` A row {Number}
  intersectsRow(row) {
    return this.getRange().intersectsRow(row);
  }

  // Returns whether this marker matches the given parameters. The parameters
  // are the same as {MarkerLayer::findMarkers}.
  matchesParams(params) {
    for (const key of Object.keys(params)) {
      if (!this.matchesParam(key, params[key])) {
        return false;
      }
    }
    return true;
  }

  // Returns whether this marker matches the given parameter name and value.
  // The parameters are the same as {MarkerLayer::findMarkers}.
  matchesParam(key, value) {
    switch (key) {
      case "startPosition":
        return this.getStartPosition().isEqual(value);
      case "endPosition":
        return this.getEndPosition().isEqual(value);
      case "containsPoint":
      case "containsPosition":
        return this.containsPoint(value);
      case "containsRange":
        return this.containsRange(value);
      case "startRow":
        return this.getStartPosition().row === value;
      case "endRow":
        return this.getEndPosition().row === value;
      case "intersectsRow":
        return this.intersectsRow(value);
      case "invalidate":
      case "reversed":
      case "tailed":
        return this[key] === value;
      case "valid":
        return this.isValid() === value;
      default:
        return isEqual(this.properties[key], value);
    }
  }

  update(
    oldRange,
    { range, reversed, tailed, valid, exclusive, properties },
    textChanged = false,
    suppressMarkerLayerUpdateEvents = false,
  ) {
    if (this.isDestroyed()) {
      return;
    }

    oldRange = Range.fromObject(oldRange);
    if (range != null) {
      range = Range.fromObject(range);
    }

    const wasExclusive = this.isExclusive();
    let updated = false;
    let propertiesChanged = false;

    if (range != null && !range.isEqual(oldRange)) {
      this.layer.setMarkerRange(this.id, range);
      // The layer clips the range to the buffer's bounds; re-read it so change
      // events report the marker's actual positions.
      range = this.getRange();
      updated = true;
    }

    if (reversed != null && reversed !== this.reversed) {
      this.reversed = reversed;
      updated = true;
    }

    if (tailed != null && tailed !== this.tailed) {
      this.tailed = tailed;
      updated = true;
    }

    if (valid != null && valid !== this.valid) {
      this.valid = valid;
      updated = true;
    }

    if (exclusive != null && exclusive !== this.exclusive) {
      this.exclusive = exclusive;
      updated = true;
    }

    if (wasExclusive !== this.isExclusive()) {
      this.layer.setMarkerIsExclusive(this.id, this.isExclusive());
      updated = true;
    }

    if (properties != null && !isEqual(properties, this.properties)) {
      this.properties = Object.freeze(properties);
      propertiesChanged = true;
      updated = true;
    }

    this.emitChangeEvent(range ?? oldRange, textChanged, propertiesChanged);
    if (updated && !suppressMarkerLayerUpdateEvents) {
      this.layer.markerUpdated();
    }
    return updated;
  }

  getSnapshot(range, includeMarker = true) {
    const snapshot = {
      range,
      properties: this.properties,
      reversed: this.reversed,
      tailed: this.tailed,
      valid: this.valid,
      invalidate: this.invalidate,
      exclusive: this.exclusive,
    };
    if (includeMarker) {
      snapshot.marker = this;
    }
    return Object.freeze(snapshot);
  }

  toString() {
    return `[Marker ${this.id}, ${this.getRange()}]`;
  }

  /*
  Section: Private
  */

  inspect() {
    return this.toString();
  }

  emitChangeEvent(currentRange, textChanged, propertiesChanged) {
    let newHeadPosition, newTailPosition, oldHeadPosition, oldTailPosition;
    if (!this.hasChangeObservers) {
      return;
    }
    const oldState = this.previousEventState;

    if (currentRange == null) {
      currentRange = this.getRange();
    }

    if (
      !propertiesChanged &&
      oldState.valid === this.valid &&
      oldState.tailed === this.tailed &&
      oldState.reversed === this.reversed &&
      oldState.range.compare(currentRange) === 0
    ) {
      return false;
    }

    const newState = (this.previousEventState = this.getSnapshot(currentRange));

    if (oldState.reversed) {
      oldHeadPosition = oldState.range.start;
      oldTailPosition = oldState.range.end;
    } else {
      oldHeadPosition = oldState.range.end;
      oldTailPosition = oldState.range.start;
    }

    if (newState.reversed) {
      newHeadPosition = newState.range.start;
      newTailPosition = newState.range.end;
    } else {
      newHeadPosition = newState.range.end;
      newTailPosition = newState.range.start;
    }

    this.emitter.emit("did-change", {
      wasValid: oldState.valid,
      isValid: newState.valid,
      hadTail: oldState.tailed,
      hasTail: newState.tailed,
      oldProperties: oldState.properties,
      newProperties: newState.properties,
      oldHeadPosition,
      newHeadPosition,
      oldTailPosition,
      newTailPosition,
      textChanged,
    });
    return true;
  }
}

module.exports = Marker;
