const {Emitter, CompositeDisposable, Disposable} = require('event-kit');
const DisplayMarker = require('./display-marker');
const Range = require('./range');
const Point = require('./point');

// Public: *Experimental:* A container for a related set of markers at the
// {DisplayLayer} level. Wraps an underlying {MarkerLayer} on the {TextBuffer}.
//
// This API is experimental and subject to change on any release.
class DisplayMarkerLayer {
  constructor(displayLayer, bufferMarkerLayer, ownsBufferMarkerLayer) {
    this.displayLayer = displayLayer;
    this.bufferMarkerLayer = bufferMarkerLayer;
    this.ownsBufferMarkerLayer = ownsBufferMarkerLayer;
    this.id = this.bufferMarkerLayer.id;
    this.bufferMarkerLayer.displayMarkerLayers.add(this);
    this.markersById = new Map();
    this.destroyed = false;
    this.emitter = new Emitter;
    this.subscriptions = new CompositeDisposable;
    this.markersWithDestroyListeners = new Set;
    this.subscriptions.add(
      this.bufferMarkerLayer.onDidUpdate(this.emitDidUpdate.bind(this))
    );
  }

  /*
  Section: Lifecycle
  */

  // Essential: Destroy this layer.
  destroy() {
    if (this.destroyed) { return; }
    this.destroyed = true;

    if (this.ownsBufferMarkerLayer) { this.clear(); }
    this.subscriptions.dispose();
    this.bufferMarkerLayer.displayMarkerLayers.delete(this);
    if (this.ownsBufferMarkerLayer) { this.bufferMarkerLayer.destroy(); }
    this.displayLayer.didDestroyMarkerLayer(this.id);

    this.emitter.emit('did-destroy');
    this.emitter.clear();
  }

  // Public: Destroy all markers in this layer.
  clear() {
    this.bufferMarkerLayer.clear();
  }

  didClearBufferMarkerLayer() {
    for (let marker of this.markersWithDestroyListeners) {
      marker.didDestroyBufferMarker();
    }
    this.markersById = new Map();
  }

  // Essential: Determine whether this layer has been destroyed.
  //
  // Returns a {Boolean}.
  isDestroyed() {
    return this.destroyed;
  }

  /*
  Section: Event Subscription
  */

  // Public: Subscribe to be notified synchronously when this layer is destroyed.
  //
  // Returns a {Disposable}.
  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback);
  }

  // Public: Subscribe to be notified asynchronously whenever markers are
  // created, updated, or destroyed on this layer. *Prefer this method for
  // optimal performance when interacting with layers that could contain large
  // numbers of markers.*
  //
  // * `callback` A {Function} that will be called with no arguments when changes
  //   occur on this layer.
  //
  // Subscribers are notified once, asynchronously when any number of changes
  // occur in a given tick of the event loop. You should re-query the layer
  // to determine the state of markers in which you're interested in. It may
  // be counter-intuitive, but this is much more efficient than subscribing to
  // events on individual markers, which are expensive to deliver.
  //
  // Returns a {Disposable}.
  onDidUpdate(callback) {
    return this.emitter.on('did-update', callback);
  }

  // Public: Subscribe to be notified synchronously whenever markers are created
  // on this layer. *Avoid this method for optimal performance when interacting
  // with layers that could contain large numbers of markers.*
  //
  // * `callback` A {Function} that will be called with a {TextEditorMarker}
  //   whenever a new marker is created.
  //
  // You should prefer {::onDidUpdate} when synchronous notifications aren't
  // absolutely necessary.
  //
  // Returns a {Disposable}.
  onDidCreateMarker(callback) {
    const subscription = this.bufferMarkerLayer.onDidCreateMarker(bufferMarker => {
      return callback(this.getMarker(bufferMarker.id));
    });
    // Track the subscription so it doesn't outlive this layer when the
    // underlying buffer marker layer isn't owned by it.
    this.subscriptions.add(subscription);
    return new Disposable(() => {
      this.subscriptions.remove(subscription);
      subscription.dispose();
    });
  }

  /*
  Section: Marker creation
  */

  // Public: Create a marker with the given screen range.
  //
  // * `screenRange` A {Range} or range-compatible {Array}
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
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`. Applies to the start and end of the given range.
  //
  // Returns a {DisplayMarker}.
  markScreenRange(screenRange, options) {
    screenRange = Range.fromObject(screenRange);
    const bufferRange = this.displayLayer.translateScreenRange(screenRange, options);
    return this.getMarker(this.bufferMarkerLayer.markRange(bufferRange, options).id);
  }

  // Public: Create a marker on this layer with its head at the given screen
  // position and no tail.
  //
  // * `screenPosition` A {Point} or point-compatible {Array}
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
  //   * `clipDirection` {String} If `'backward'`, returns the first valid
  //     position preceding an invalid position. If `'forward'`, returns the
  //     first valid position following an invalid position. If `'closest'`,
  //     returns the first valid position closest to an invalid position.
  //     Defaults to `'closest'`.
  //
  // Returns a {DisplayMarker}.
  markScreenPosition(screenPosition, options) {
    screenPosition = Point.fromObject(screenPosition);
    const bufferPosition = this.displayLayer.translateScreenPosition(screenPosition, options);
    return this.getMarker(
      this.bufferMarkerLayer.markPosition(bufferPosition, options).id
    );
  }

  // Public: Create a marker with the given buffer range.
  //
  // * `bufferRange` A {Range} or range-compatible {Array}
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
  //
  // Returns a {DisplayMarker}.
  markBufferRange(bufferRange, options) {
    bufferRange = Range.fromObject(bufferRange);
    return this.getMarker(
      this.bufferMarkerLayer.markRange(bufferRange, options).id
    );
  }

  // Public: Create a marker on this layer with its head at the given buffer
  // position and no tail.
  //
  // * `bufferPosition` A {Point} or point-compatible {Array}
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
  //
  // Returns a {DisplayMarker}.
  markBufferPosition(bufferPosition, options) {
    return this.getMarker(
      this.bufferMarkerLayer.markPosition(
        Point.fromObject(bufferPosition),
        options
      ).id
    );
  }

  /*
  Section: Querying
  */

  // Essential: Get an existing marker by its id.
  //
  // Returns a {DisplayMarker}.
  getMarker(id) {
    id = parseInt(id);
    const displayMarker = this.markersById.get(id);
    if (displayMarker) { return displayMarker; }
    const bufferMarker = this.bufferMarkerLayer.getMarker(id);
    if (bufferMarker) {
      const marker = new DisplayMarker(this, bufferMarker);
      this.markersById.set(id, marker);
      return marker;
    }
  }

  // Essential: Get all markers in the layer.
  //
  // Returns an {Array} of {DisplayMarker}s.
  getMarkers() {
    return this.bufferMarkerLayer.getMarkers().map(
      ({ id }) => this.getMarker(id)
    );
  }

  // Public: Get the number of markers in the marker layer.
  //
  // Returns a {Number}.
  getMarkerCount() {
    return this.bufferMarkerLayer.getMarkerCount();
  }

  // Public: Find markers in the layer conforming to the given parameters.
  //
  // This method finds markers based on the given properties. Markers can be
  // associated with custom properties that will be compared with basic equality.
  // In addition, there are several special properties that will be compared
  // with the range of the markers rather than their properties.
  //
  // * `params` An {Object} containing properties that each returned marker
  //   must satisfy. Markers can be associated with custom properties, which are
  //   compared with basic equality. In addition, several reserved properties
  //   can be used to filter markers based on their current range:
  //   * `startBufferPosition` Only include markers starting at this {Point} in buffer coordinates.
  //   * `endBufferPosition` Only include markers ending at this {Point} in buffer coordinates.
  //   * `startScreenPosition` Only include markers starting at this {Point} in screen coordinates.
  //   * `endScreenPosition` Only include markers ending at this {Point} in screen coordinates.
  //   * `startsInBufferRange` Only include markers starting inside this {Range} in buffer coordinates.
  //   * `endsInBufferRange` Only include markers ending inside this {Range} in buffer coordinates.
  //   * `startsInScreenRange` Only include markers starting inside this {Range} in screen coordinates.
  //   * `endsInScreenRange` Only include markers ending inside this {Range} in screen coordinates.
  //   * `startBufferRow` Only include markers starting at this row in buffer coordinates.
  //   * `endBufferRow` Only include markers ending at this row in buffer coordinates.
  //   * `startScreenRow` Only include markers starting at this row in screen coordinates.
  //   * `endScreenRow` Only include markers ending at this row in screen coordinates.
  //   * `intersectsBufferRowRange` Only include markers intersecting this {Array}
  //      of `[startRow, endRow]` in buffer coordinates.
  //   * `intersectsScreenRowRange` Only include markers intersecting this {Array}
  //      of `[startRow, endRow]` in screen coordinates.
  //   * `containsBufferRange` Only include markers containing this {Range} in buffer coordinates.
  //   * `containsBufferPosition` Only include markers containing this {Point} in buffer coordinates.
  //   * `containedInBufferRange` Only include markers contained in this {Range} in buffer coordinates.
  //   * `containedInScreenRange` Only include markers contained in this {Range} in screen coordinates.
  //   * `intersectsBufferRange` Only include markers intersecting this {Range} in buffer coordinates.
  //   * `intersectsScreenRange` Only include markers intersecting this {Range} in screen coordinates.
  //
  // Returns an {Array} of {DisplayMarker}s
  findMarkers(params) {
    params = this.translateToBufferMarkerLayerFindParams(params);
    return this.bufferMarkerLayer.findMarkers(params).map(
      stringMarker => this.getMarker(stringMarker.id)
    );
  }

  /*
  Section: Private
  */

  translateBufferPosition(bufferPosition, options) {
    return this.displayLayer.translateBufferPosition(bufferPosition, options);
  }

  translateBufferRange(bufferRange, options) {
    return this.displayLayer.translateBufferRange(bufferRange, options);
  }

  translateScreenPosition(screenPosition, options) {
    return this.displayLayer.translateScreenPosition(screenPosition, options);
  }

  translateScreenRange(screenRange, options) {
    return this.displayLayer.translateScreenRange(screenRange, options);
  }

  emitDidUpdate() {
    return this.emitter.emit('did-update');
  }

  notifyObserversIfMarkerScreenPositionsChanged() {
    for (let marker of this.getMarkers()) {
      marker.notifyObservers(false);
    }
  }

  destroyMarker(id) {
    const marker = this.markersById.get(id);
    if (marker) {
      return marker.didDestroyBufferMarker();
    }
  }

  didDestroyMarker(marker) {
    this.markersWithDestroyListeners.delete(marker);
    return this.markersById.delete(marker.id);
  }

  translateToBufferMarkerLayerFindParams(params) {
    const bufferMarkerLayerFindParams = {};
    for (let key in params) {
      let value = params[key];
      switch (key) {
        case 'startBufferPosition':
          key = 'startPosition';
          break;
        case 'endBufferPosition':
          key = 'endPosition';
          break;
        case 'startScreenPosition':
          key = 'startPosition';
          value = this.displayLayer.translateScreenPosition(value);
          break;
        case 'endScreenPosition':
          key = 'endPosition';
          value = this.displayLayer.translateScreenPosition(value);
          break;
        case 'startsInBufferRange':
          key = 'startsInRange';
          break;
        case 'endsInBufferRange':
          key = 'endsInRange';
          break;
        case 'startsInScreenRange':
          key = 'startsInRange';
          value = this.displayLayer.translateScreenRange(value);
          break;
        case 'endsInScreenRange':
          key = 'endsInRange';
          value = this.displayLayer.translateScreenRange(value);
          break;
        case 'startBufferRow':
          key = 'startRow';
          break;
        case 'endBufferRow':
          key = 'endRow';
          break;
        case 'startScreenRow':
          key = 'startsInRange';
          var startBufferPosition = this.displayLayer.translateScreenPosition(Point(value, 0));
          var endBufferPosition = this.displayLayer.translateScreenPosition(Point(value, Infinity));
          value = Range(startBufferPosition, endBufferPosition);
          break;
        case 'endScreenRow':
          key = 'endsInRange';
          startBufferPosition = this.displayLayer.translateScreenPosition(Point(value, 0));
          endBufferPosition = this.displayLayer.translateScreenPosition(Point(value, Infinity));
          value = Range(startBufferPosition, endBufferPosition);
          break;
        case 'intersectsBufferRowRange':
          key = 'intersectsRowRange';
          break;
        case 'intersectsScreenRowRange':
          key = 'intersectsRange';
          var [startScreenRow, endScreenRow] = Array.from(value);
          startBufferPosition = this.displayLayer.translateScreenPosition(Point(startScreenRow, 0));
          endBufferPosition = this.displayLayer.translateScreenPosition(Point(endScreenRow, Infinity));
          value = Range(startBufferPosition, endBufferPosition);
          break;
        case 'containsBufferRange':
          key = 'containsRange';
          break;
        case 'containsScreenRange':
          key = 'containsRange';
          value = this.displayLayer.translateScreenRange(value);
          break;
        case 'containsBufferPosition':
          key = 'containsPosition';
          break;
        case 'containsScreenPosition':
          key = 'containsPosition';
          value = this.displayLayer.translateScreenPosition(value);
          break;
        case 'containedInBufferRange':
          key = 'containedInRange';
          break;
        case 'containedInScreenRange':
          key = 'containedInRange';
          value = this.displayLayer.translateScreenRange(value);
          break;
        case 'intersectsBufferRange':
          key = 'intersectsRange';
          break;
        case 'intersectsScreenRange':
          key = 'intersectsRange';
          value = this.displayLayer.translateScreenRange(value);
          break;
      }
      bufferMarkerLayerFindParams[key] = value;
    }

    return bufferMarkerLayerFindParams;
  }
}

module.exports = DisplayMarkerLayer;
