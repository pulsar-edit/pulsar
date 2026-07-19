const { Emitter, Disposable } = require("event-kit");

// Essential: Represents a buffer annotation that remains logically stationary
// even as the buffer changes. This is used to represent cursors, folds, snippet
// targets, misspelled words, and anything else that needs to track a logical
// location in the buffer over time.
//
// ### DisplayMarker Creation
//
// Use {DisplayMarkerLayer::markBufferRange} or {DisplayMarkerLayer::markScreenRange}
// rather than creating Markers directly.
//
// ### Head and Tail
//
// Markers always have a *head* and sometimes have a *tail*. If you think of a
// marker as an editor selection, the tail is the part that's stationary and the
// head is the part that moves when the mouse is moved. A marker without a tail
// always reports an empty range at the head position. A marker with a head position
// greater than the tail is in a "normal" orientation. If the head precedes the
// tail the marker is in a "reversed" orientation.
//
// ### Validity
//
// Markers are considered *valid* when they are first created. Depending on the
// invalidation strategy you choose, certain changes to the buffer can cause a
// marker to become invalid, for example if the text surrounding the marker is
// deleted. The strategies, in order of descending fragility:
//
// * __never__: The marker is never marked as invalid. This is a good choice for
//   markers representing selections in an editor.
// * __surround__: The marker is invalidated by changes that completely surround it.
// * __overlap__: The marker is invalidated by changes that surround the
//   start or end of the marker. This is the default.
// * __inside__: The marker is invalidated by changes that extend into the
//   inside of the marker. Changes that end at the marker's start or
//   start at the marker's end do not invalidate the marker.
// * __touch__: The marker is invalidated by a change that touches the marked
//   region in any way, including changes that end at the marker's
//   start or start at the marker's end. This is the most fragile strategy.
//
// See {TextBuffer::markRange} for usage.
class DisplayMarker {
  /*
  Section: Construction and Destruction
  */

  constructor(layer, bufferMarker) {
    this.layer = layer;
    this.bufferMarker = bufferMarker;
    ({ id: this.id } = this.bufferMarker);
    this.hasChangeObservers = false;
    this.emitter = new Emitter();
    this.bufferMarkerSubscription = null;
  }

  // Essential: Destroys the marker, causing it to emit the 'destroyed' event. Once
  // destroyed, a marker cannot be restored by undo/redo operations.
  destroy() {
    if (!this.isDestroyed()) {
      this.bufferMarker.destroy();
    }
  }

  didDestroyBufferMarker() {
    this.emitter.emit("did-destroy");
    this.layer.didDestroyMarker(this);
    this.emitter.dispose();
    this.bufferMarkerSubscription?.dispose();
  }

  // Essential: Creates and returns a new {DisplayMarker} with the same properties as
  // this marker.
  //
  // {Selection} markers (markers with a custom property `type: "selection"`)
  // should be copied with a different `type` value, for example with
  // `marker.copy({type: null})`. Otherwise, the new marker's selection will
  // be merged with this marker's selection, and a `null` value will be
  // returned.
  //
  // * `params` (optional) {Object} properties to associate with the new
  // marker. The new marker's properties are computed by extending this marker's
  // properties with `params`.
  //
  // Returns a {DisplayMarker}.
  copy(params) {
    return this.layer.getMarker(this.bufferMarker.copy(params).id);
  }

  /*
  Section: Event Subscription
  */

  // Essential: Invoke the given callback when the state of the marker changes.
  //
  // * `callback` {Function} to be called when the marker changes.
  //   * `event` {Object} with the following keys:
  //     * `oldHeadBufferPosition` {Point} representing the former head buffer position
  //     * `newHeadBufferPosition` {Point} representing the new head buffer position
  //     * `oldTailBufferPosition` {Point} representing the former tail buffer position
  //     * `newTailBufferPosition` {Point} representing the new tail buffer position
  //     * `oldHeadScreenPosition` {Point} representing the former head screen position
  //     * `newHeadScreenPosition` {Point} representing the new head screen position
  //     * `oldTailScreenPosition` {Point} representing the former tail screen position
  //     * `newTailScreenPosition` {Point} representing the new tail screen position
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
      this.oldHeadBufferPosition = this.getHeadBufferPosition();
      this.oldHeadScreenPosition = this.getHeadScreenPosition();
      this.oldTailBufferPosition = this.getTailBufferPosition();
      this.oldTailScreenPosition = this.getTailScreenPosition();
      this.wasValid = this.isValid();
      this.bufferMarkerSubscription = this.bufferMarker.onDidChange((event) =>
        this.notifyObservers(event.textChanged),
      );
      this.hasChangeObservers = true;
    }
    const subscription = this.emitter.on("did-change", callback);
    return new Disposable(() => {
      subscription.dispose();
      if (!this.emitter.disposed && this.emitter.listenerCountForEventName("did-change") === 0) {
        this.bufferMarkerSubscription?.dispose();
        this.bufferMarkerSubscription = null;
        this.hasChangeObservers = false;
      }
    });
  }

  // Essential: Invoke the given callback when the marker is destroyed.
  //
  // * `callback` {Function} to be called when the marker is destroyed.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidDestroy(callback) {
    this.layer.markersWithDestroyListeners.add(this);
    const subscription = this.emitter.on("did-destroy", callback);
    return new Disposable(() => {
      subscription.dispose();
      if (!this.emitter.disposed && this.emitter.listenerCountForEventName("did-destroy") === 0) {
        this.layer.markersWithDestroyListeners.delete(this);
      }
    });
  }

  /*
  Section: TextEditorMarker Details
  */

  // Essential: Returns a {Boolean} indicating whether the marker is valid.
  // Markers can be invalidated when a region surrounding them in the buffer is
  // changed.
  isValid() {
    return this.bufferMarker.isValid();
  }

  // Essential: Returns a {Boolean} indicating whether the marker has been
  // destroyed. A marker can be invalid without being destroyed, in which case
  // undoing the invalidating operation would restore the marker. Once a marker
  // is destroyed by calling {DisplayMarker::destroy}, no undo/redo operation
  // can ever bring it back.
  isDestroyed() {
    return this.layer.isDestroyed() || this.bufferMarker.isDestroyed();
  }

  // Essential: Returns a {Boolean} indicating whether the head precedes the tail.
  isReversed() {
    return this.bufferMarker.isReversed();
  }

  // Essential: Returns a {Boolean} indicating whether changes that occur exactly
  // at the marker's head or tail cause it to move.
  isExclusive() {
    return this.bufferMarker.isExclusive();
  }

  // Essential: Get the invalidation strategy for this marker.
  //
  // Valid values include: `never`, `surround`, `overlap`, `inside`, and `touch`.
  //
  // Returns a {String}.
  getInvalidationStrategy() {
    return this.bufferMarker.getInvalidationStrategy();
  }

  // Essential: Returns an {Object} containing any custom properties associated with
  // the marker.
  getProperties() {
    return this.bufferMarker.getProperties();
  }

  // Essential: Merges an {Object} containing new properties into the marker's
  // existing properties.
  //
  // * `properties` {Object}
  setProperties(properties) {
    return this.bufferMarker.setProperties(properties);
  }

  // Essential: Returns whether this marker matches the given parameters. The
  // parameters are the same as {DisplayMarkerLayer::findMarkers}.
  matchesProperties(attributes) {
    attributes = this.layer.translateToBufferMarkerParams(attributes);
    return this.bufferMarker.matchesParams(attributes);
  }

  /*
  Section: Comparing to other markers
  */

  // Essential: Compares this marker to another based on their ranges.
  //
  // * `other` {DisplayMarker}
  //
  // Returns a {Number}
  compare(otherMarker) {
    return this.bufferMarker.compare(otherMarker.bufferMarker);
  }

  // Essential: Returns a {Boolean} indicating whether this marker is equivalent to
  // another marker, meaning they have the same range and options.
  //
  // * `other` {DisplayMarker} other marker
  isEqual(other) {
    if (!(other instanceof this.constructor)) {
      return false;
    }
    return this.bufferMarker.isEqual(other.bufferMarker);
  }

  /*
  Section: Managing the marker's range
  */

  // Essential: Gets the buffer range of this marker.
  //
  // Returns a {Range}.
  getBufferRange() {
    return this.bufferMarker.getRange();
  }

  // Essential: Gets the screen range of this marker.
  //
  // Returns a {Range}.
  getScreenRange() {
    return this.layer.translateBufferRange(this.getBufferRange());
  }

  // Essential: Modifies the buffer range of this marker.
  //
  // * `bufferRange` The new {Range} to use
  // * `properties` (optional) {Object} properties to associate with the marker.
  //   * `reversed` {Boolean} If true, the marker will to be in a reversed orientation.
  setBufferRange(bufferRange, properties) {
    return this.bufferMarker.setRange(bufferRange, properties);
  }

  // Essential: Modifies the screen range of this marker.
  //
  // * `screenRange` The new {Range} to use
  // * `options` (optional) An {Object} with the following keys:
  //   * `reversed` {Boolean} If true, the marker will to be in a reversed orientation.
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  setScreenRange(screenRange, options) {
    return this.setBufferRange(this.layer.translateScreenRange(screenRange, options), options);
  }

  // Extended: Retrieves the buffer position of the marker's head.
  //
  // Returns a {Point}.
  getHeadBufferPosition() {
    return this.bufferMarker.getHeadPosition();
  }

  // Extended: Sets the buffer position of the marker's head.
  //
  // * `bufferPosition` The new {Point} to use
  setHeadBufferPosition(bufferPosition) {
    return this.bufferMarker.setHeadPosition(bufferPosition);
  }

  // Extended: Retrieves the screen position of the marker's head.
  //
  // * `options` (optional) An {Object} with the following keys:
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  //
  // Returns a {Point}.
  getHeadScreenPosition(options) {
    return this.layer.translateBufferPosition(this.bufferMarker.getHeadPosition(), options);
  }

  // Extended: Sets the screen position of the marker's head.
  //
  // * `screenPosition` The new {Point} to use
  // * `options` (optional) An {Object} with the following keys:
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  setHeadScreenPosition(screenPosition, options) {
    return this.setHeadBufferPosition(this.layer.translateScreenPosition(screenPosition, options));
  }

  // Extended: Retrieves the buffer position of the marker's tail.
  //
  // Returns a {Point}.
  getTailBufferPosition() {
    return this.bufferMarker.getTailPosition();
  }

  // Extended: Sets the buffer position of the marker's tail.
  //
  // * `bufferPosition` The new {Point} to use
  setTailBufferPosition(bufferPosition) {
    return this.bufferMarker.setTailPosition(bufferPosition);
  }

  // Extended: Retrieves the screen position of the marker's tail.
  //
  // * `options` (optional) An {Object} with the following keys:
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  //
  // Returns a {Point}.
  getTailScreenPosition(options) {
    return this.layer.translateBufferPosition(this.bufferMarker.getTailPosition(), options);
  }

  // Extended: Sets the screen position of the marker's tail.
  //
  // * `screenPosition` The new {Point} to use
  // * `options` (optional) An {Object} with the following keys:
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  setTailScreenPosition(screenPosition, options) {
    return this.bufferMarker.setTailPosition(
      this.layer.translateScreenPosition(screenPosition, options),
    );
  }

  // Extended: Retrieves the buffer position of the marker's start. This will always be
  // less than or equal to the result of {DisplayMarker::getEndBufferPosition}.
  //
  // Returns a {Point}.
  getStartBufferPosition() {
    return this.bufferMarker.getStartPosition();
  }

  // Essential: Retrieves the screen position of the marker's start. This will always be
  // less than or equal to the result of {DisplayMarker::getEndScreenPosition}.
  //
  // * `options` (optional) An {Object} with the following keys:
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  //
  // Returns a {Point}.
  getStartScreenPosition(options) {
    return this.layer.translateBufferPosition(this.getStartBufferPosition(), options);
  }

  // Extended: Retrieves the buffer position of the marker's end. This will always be
  // greater than or equal to the result of {DisplayMarker::getStartBufferPosition}.
  //
  // Returns a {Point}.
  getEndBufferPosition() {
    return this.bufferMarker.getEndPosition();
  }

  // Essential: Retrieves the screen position of the marker's end. This will always be
  // greater than or equal to the result of {DisplayMarker::getStartScreenPosition}.
  //
  // * `options` (optional) An {Object} with the following keys:
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  //
  // Returns a {Point}.
  getEndScreenPosition(options) {
    return this.layer.translateBufferPosition(this.getEndBufferPosition(), options);
  }

  // Extended: Returns a {Boolean} indicating whether the marker has a tail.
  hasTail() {
    return this.bufferMarker.hasTail();
  }

  // Extended: Plants the marker's tail at the current head position. After calling
  // the marker's tail position will be its head position at the time of the
  // call, regardless of where the marker's head is moved.
  plantTail() {
    return this.bufferMarker.plantTail();
  }

  // Extended: Removes the marker's tail. After calling the marker's head position
  // will be reported as its current tail position until the tail is planted
  // again.
  clearTail() {
    return this.bufferMarker.clearTail();
  }

  toString() {
    return `[Marker ${this.id}, bufferRange: ${this.getBufferRange()}, screenRange: ${this.getScreenRange()}}]`;
  }

  /*
  Section: Private
  */

  inspect() {
    return this.toString();
  }

  notifyObservers(textChanged) {
    if (!this.hasChangeObservers) {
      return;
    }
    if (textChanged == null) {
      textChanged = false;
    }

    const newHeadBufferPosition = this.getHeadBufferPosition();
    const newHeadScreenPosition = this.getHeadScreenPosition();
    const newTailBufferPosition = this.getTailBufferPosition();
    const newTailScreenPosition = this.getTailScreenPosition();
    const isValid = this.isValid();

    if (
      isValid === this.wasValid &&
      newHeadBufferPosition.isEqual(this.oldHeadBufferPosition) &&
      newHeadScreenPosition.isEqual(this.oldHeadScreenPosition) &&
      newTailBufferPosition.isEqual(this.oldTailBufferPosition) &&
      newTailScreenPosition.isEqual(this.oldTailScreenPosition)
    ) {
      return;
    }

    const changeEvent = {
      oldHeadScreenPosition: this.oldHeadScreenPosition,
      newHeadScreenPosition,
      oldTailScreenPosition: this.oldTailScreenPosition,
      newTailScreenPosition,
      oldHeadBufferPosition: this.oldHeadBufferPosition,
      newHeadBufferPosition,
      oldTailBufferPosition: this.oldTailBufferPosition,
      newTailBufferPosition,
      textChanged,
      wasValid: this.wasValid,
      isValid,
    };

    this.oldHeadBufferPosition = newHeadBufferPosition;
    this.oldHeadScreenPosition = newHeadScreenPosition;
    this.oldTailBufferPosition = newTailBufferPosition;
    this.oldTailScreenPosition = newTailScreenPosition;
    this.wasValid = isValid;

    return this.emitter.emit("did-change", changeEvent);
  }
}

module.exports = DisplayMarker;
