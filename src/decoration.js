const { Emitter } = require('event-kit');

let idCounter = 0;
const nextId = () => idCounter++;

const normalizeDecorationProperties = function(decoration, decorationParams) {
  decorationParams.id = decoration.id;

  if (
    decorationParams.type === 'line-number' &&
    decorationParams.gutterName == null
  ) {
    decorationParams.gutterName = 'line-number';
  }

  if (decorationParams.order == null) {
    decorationParams.order = Infinity;
  }

  return decorationParams;
};

// Essential: Represents a decoration that follows a {DisplayMarker}. A decoration is
// basically a visual representation of a marker. It allows you to add CSS
// classes to line numbers in the gutter, lines, and add selection-line regions
// around marked ranges of text.
//
// {Decoration} objects are not meant to be created directly, but created with
// {TextEditor::decorateMarker}. eg.
//
// ```coffee
// range = editor.getSelectedBufferRange() # any range you like
// marker = editor.markBufferRange(range)
// decoration = editor.decorateMarker(marker, {type: 'line', class: 'my-line-class'})
// ```
//
// Best practice for destroying the decoration is by destroying the {DisplayMarker}.
//
// ```coffee
// marker.destroy()
// ```
//
// You should only use {Decoration::destroy} when you still need or do not own
// the marker.
/**
 * @class Decoration
 * @classdesc
 * Essential: Represents a decoration that follows a {DisplayMarker}. A decoration
 * is basically a visual representation of a marker. It allows you to add CSS
 * classes to line numbers in the gutter, lines, and add selection-line regions
 * around marked ranges of text.
 */
module.exports = class Decoration {
  /**
   * @private
   * @name isType
   * @memberof Decoration
   * @desc Private: Check if the `decorationProperties.type` matches `type`
   * Note: 'line-number' is a special subtype of the 'gutter' type.
   * I.e., a 'line-number' is a 'gutter' is not a 'line-number'.
   * @param {object} decorationProperties - eg. `{type: 'line-number', class: 'my-new-class'}`
   * @param {string|string[]} decorationProperties.type - Like `'line-number'`, `'line'`,
   * etc. `type` can alos be an array of strings, where it will return true if
   * the decoration's type matches any in the array.
   * @returns boolean
   */
  static isType(decorationProperties, type) {
    // 'line-number' is a special case of 'gutter'.
    if (Array.isArray(decorationProperties.type)) {
      if (decorationProperties.type.includes(type)) {
        return true;
      }

      if (
        type === 'gutter' &&
        decorationProperties.type.includes('line-number')
      ) {
        return true;
      }

      return false;
    } else {
      if (type === 'gutter') {
        return ['gutter', 'line-number'].includes(decorationProperties.type);
      } else {
        return type === decorationProperties.type;
      }
    }
  }

  /*
  Section: Construction and Destruction
  */

  constructor(marker, decorationManager, properties) {
    this.marker = marker;
    this.decorationManager = decorationManager;
    this.emitter = new Emitter();
    this.id = nextId();
    this.setProperties(properties);
    this.destroyed = false;
    this.markerDestroyDisposable = this.marker.onDidDestroy(() =>
      this.destroy()
    );
  }

  /**
   * @name destroy
   * @memberof Decoration
   * @desc Essential: Destroy this marker decoration.
   * You can also destroy the marker if you own it, which will destroy this
   * decoration.
   */
  destroy() {
    if (this.destroyed) {
      return;
    }
    this.markerDestroyDisposable.dispose();
    this.markerDestroyDisposable = null;
    this.destroyed = true;
    this.decorationManager.didDestroyMarkerDecoration(this);
    this.emitter.emit('did-destroy');
    return this.emitter.dispose();
  }

  isDestroyed() {
    return this.destroyed;
  }

  /*
  Section: Event Subscription
  */

  /**
   * @name onDidChangeProperties
   * @memberof Decoration
   * @desc Essential: When the {Decoration} is updated via {Decoration::update}.
   * @param {function} callback
   * @returns {Disposable} On which `.dispose()` can be called to unsubscribe.
   */
  onDidChangeProperties(callback) {
    /**
     * @callback
     * @param {object} event
     * @param {object} event.oldProperties - THe old parameters the decoration
     * used to have.
     * @param {object} event.newProperties - The new parameters the decoration
     * now has.
     */
    return this.emitter.on('did-change-properties', callback);
  }

  /**
   * @name onDidDestroy
   * @memberof Decoration
   * @desc Essential: Invoke the given callback when the {Decoration} is destroyed
   * @param {function} callback
   * @returns {Disposable} On which `.dipose()` can be called to unsubscribe.
   */
  onDidDestroy(callback) {
    return this.emitter.once('did-destroy', callback);
  }

  /*
  Section: Decoration Details
  */

  /**
   * @name getId
   * @memberof Decoration
   * @desc Essential: An id unique across all {Decoration} objects
   */
  getId() {
    return this.id;
  }

  /**
   * @name getMarker
   * @memberof Decoration
   * @desc Essential: Returns the marker associated with this {Decoration}
   */
  getMarker() {
    return this.marker;
  }

  /**
   * @name isType
   * @memberof Decoration
   * @desc Public: Check if this decoration is of type `type`
   * @param {string|string[]} type - Like `'line-number'`, `'line'`, etc. `type` can also
   * be an array of strings, where it will return true if the decoration's
   * type matches any in the array.
   * @returns {boolean}
   */
  isType(type) {
    return Decoration.isType(this.properties, type);
  }

  /*
  Section: Properties
  */

  /**
   * @name getProperties
   * @memberof Decoration
   * @desc Essential: Returns the {Decoration}'s properties.
   */
  getProperties() {
    return this.properties;
  }

  /**
   * @name setProperties
   * @memberof Decoration
   * @desc Essential: Update the marker with new Properties. Allows you to
   * change the decoration's class.
   * @param {object} newProperties - eg. `{type: 'line-number', class: 'my-new-class'}`
   * @example
   * decoration.setProperties({type: 'line-number', class: 'my-new-class'})
   */
  setProperties(newProperties) {
    if (this.destroyed) {
      return;
    }
    const oldProperties = this.properties;
    this.properties = normalizeDecorationProperties(this, newProperties);
    if (newProperties.type != null) {
      this.decorationManager.decorationDidChangeType(this);
    }
    this.decorationManager.emitDidUpdateDecorations();
    return this.emitter.emit('did-change-properties', {
      oldProperties,
      newProperties
    });
  }

  /*
  Section: Utility
  */

  inspect() {
    return `<Decoration ${this.id}>`;
  }

  /*
  Section: Private methods
  */

  matchesPattern(decorationPattern) {
    if (decorationPattern == null) {
      return false;
    }
    for (let key in decorationPattern) {
      const value = decorationPattern[key];
      if (this.properties[key] !== value) {
        return false;
      }
    }
    return true;
  }

  flash(klass, duration) {
    if (duration == null) {
      duration = 500;
    }
    this.properties.flashRequested = true;
    this.properties.flashClass = klass;
    this.properties.flashDuration = duration;
    this.decorationManager.emitDidUpdateDecorations();
    return this.emitter.emit('did-flash');
  }
};
