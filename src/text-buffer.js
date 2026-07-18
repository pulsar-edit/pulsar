const {Emitter, CompositeDisposable, Disposable} = require('event-kit')
const File = require('./text-buffer-file')
const {watchPath} = require('./path-watcher')
const diff = require('diff')
const _ = require('@lumine-code/underscore-plus')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const {TextBuffer: NativeTextBuffer} = require('@lumine-code/superstring')
const Point = require('./point')
const Range = require('./range')
const DefaultHistoryProvider = require('./default-history-provider')
const NullLanguageMode = require('./null-language-mode')
const Marker = require('./marker')
const MarkerLayer = require('./marker-layer')
const DisplayLayer = require('./display-layer')
const {spliceArray, newlineRegex, patchFromChanges, normalizePatchChanges, extentForText, debounce} = require('./helpers')
const {traverse, traversal} = require('./point-helpers')
const Grim = require('grim')

// Extended: A mutable text container with undo/redo support and the ability to
// annotate logical regions in the text.
//
// ## Observing Changes
//
// You can observe changes in a {TextBuffer} using methods like {::onDidChange},
// {::onDidStopChanging}, and {::getChangesSinceCheckpoint}. These methods report
// aggregated buffer updates as arrays of change objects containing the following
// fields: `oldRange`, `newRange`, `oldText`, and `newText`. The `oldText`,
// `newText`, and `newRange` fields are self-explanatory, but the interpretation
// of `oldRange` is more nuanced:
//
// The reported `oldRange` is the range of the replaced text in the original
// contents of the buffer *irrespective of the spatial impact of any other
// reported change*. So, for example, if you wanted to apply all the changes made
// in a transaction to a clone of the observed buffer, the easiest approach would
// be to apply the changes in reverse:
//
// ```js
// buffer1.onDidChange(({changes}) => {
//   for (const {oldRange, newText} of changes.reverse()) {
//     buffer2.setTextInRange(oldRange, newText)
//   }
// })
// ```
//
// If you needed to apply the changes in the forwards order, you would need to
// incorporate the impact of preceding changes into the range passed to
// {::setTextInRange}, as follows:
//
// ```js
// buffer1.onDidChange(({changes}) => {
//   for (const {oldRange, newRange, newText} of changes) {
//     const rangeToReplace = Range(
//       newRange.start,
//       newRange.start.traverse(oldRange.getExtent())
//     )
//     buffer2.setTextInRange(rangeToReplace, newText)
//   }
// })
// ```
class TextBuffer {
  /*
  Section: Construction
  */

  // Public: Create a new buffer with the given params.
  //
  // * `params` {Object} or {String} of text
  //   * `text` The initial {String} text of the buffer.
  //   * `shouldDestroyOnFileDelete` A {Function} that returns a {Boolean}
  //     indicating whether the buffer should be destroyed if its file is
  //     deleted.
  constructor (params) {
    if (params == null) params = {}

    this.refcount = 0
    this.conflict = false
    this.file = null
    this.fileSubscriptions = null
    this.oldFileSubscriptions = null
    this.stoppedChangingTimeout = null
    this.emitter = new Emitter()
    this.changesSinceLastStoppedChangingEvent = []
    this.changesSinceLastDidChangeTextEvent = []
    this.id = crypto.randomBytes(16).toString('hex')
    this.buffer = new NativeTextBuffer(typeof params === 'string' ? params : params.text || "")
    this.debouncedEmitDidStopChangingEvent = debounce(this.emitDidStopChangingEvent.bind(this), this.stoppedChangingDelay)
    this.maxUndoEntries = params.maxUndoEntries ?? this.defaultMaxUndoEntries
    this.setHistoryProvider(new DefaultHistoryProvider(this))
    this.languageMode = new NullLanguageMode()
    this.nextMarkerLayerId = 0
    this.nextDisplayLayerId = 0
    this.defaultMarkerLayer = new MarkerLayer(this, String(this.nextMarkerLayerId++))
    this.displayLayers = {}
    this.markerLayers = {}
    this.markerLayers[this.defaultMarkerLayer.id] = this.defaultMarkerLayer
    this.markerLayersWithPendingUpdateEvents = new Set()
    this.selectionsMarkerLayerIds = new Set()
    this.nextMarkerId = 1
    this.outstandingSaveCount = 0
    this.loadCount = 0
    this.cachedHasAstral = null
    this._emittedWillChangeEvent = false

    // Whether a buffer has ever had a backing file, whether or not it exists
    // now.
    this.didHaveFileOnDisk = false

    // When a buffer's backing file is deleted while the file is unmodified,
    // this trait flips to `true`… and then flips back to `false` if any
    // further edits are made.
    this.retainsUnmodifiedTraitAfterDeletion = false

    this.setEncoding(params.encoding)
    this.setPreferredLineEnding(params.preferredLineEnding)

    this.loaded = false
    this.destroyed = false
    this.transactCallDepth = 0
    this.digestWhenLastPersisted = false

    this.shouldDestroyOnFileDelete = params.shouldDestroyOnFileDelete || (() => false)

    if (params.filePath) {
      this.setPath(params.filePath)
      if (params.load) {
        Grim.deprecate(
          'The `load` option to the TextBuffer constructor is deprecated. ' +
          'Get a loaded buffer using TextBuffer.load(filePath) instead.'
        )
        this.load({internal: true})
      }
    }
  }

  toString () {
    return `<TextBuffer ${this.id}>`
  }

  // Public: Create a new buffer backed by the given file path.
  //
  // * `source` Either a {String} path to a local file or (experimentally) a file
  //   {Object} as described by the {::setFile} method.
  // * `params` An {Object} with the following properties:
  //   * `encoding` (optional) {String} The file's encoding.
  //   * `shouldDestroyOnFileDelete` (optional) A {Function} that returns a
  //     {Boolean} indicating whether the buffer should be destroyed if its file
  //     is deleted.
  //
  // Returns a {Promise} that resolves with a {TextBuffer} instance.
  static load (source, params) {
    const buffer = new TextBuffer(params)
    if (typeof source === 'string') {
      buffer.setPath(source)
    } else {
      buffer.setFile(source)
    }
    return buffer
      .load({clearHistory: true, internal: true, mustExist: params && params.mustExist})
      .then(() => buffer)
      .catch(err => {
        buffer.destroy()
        throw err
      })
  }

  // Public: Create a new buffer backed by the given file path. For better
  // performance, use {TextBuffer.load} instead.
  //
  // * `filePath` The {String} file path.
  // * `params` An {Object} with the following properties:
  //   * `encoding` (optional) {String} The file's encoding.
  //   * `shouldDestroyOnFileDelete` (optional) A {Function} that returns a
  //     {Boolean} indicating whether the buffer should be destroyed if its file
  //     is deleted.
  //
  // Returns a {TextBuffer} instance.
  static loadSync (filePath, params) {
    const buffer = new TextBuffer(params)
    buffer.setPath(filePath)
    try {
      buffer.loadSync({internal: true, mustExist: params && params.mustExist})
    } catch (e) {
      buffer.destroy()
      throw e
    }
    return buffer
  }

  // Public: Restore a {TextBuffer} based on an earlier state created using
  // the {TextBuffer::serialize} method.
  //
  // * `params` An {Object} returned from {TextBuffer::serialize}
  //
  // Returns a {Promise} that resolves with a {TextBuffer} instance.
  static async deserialize (params) {
    if (params.version && params.version !== TextBuffer.version) return

    delete params.load

    let buffer
    if (params.filePath) {
      buffer = await TextBuffer.load(params.filePath, params)
      if (buffer.digestWhenLastPersisted === params.digestWhenLastPersisted) {
        buffer.buffer.deserializeChanges(params.outstandingChanges)
      } else {
        params.history = {}
      }
    } else {
      buffer = new TextBuffer(params)
    }

    buffer.id = params.id
    buffer.preferredLineEnding = params.preferredLineEnding
    buffer.nextMarkerId = params.nextMarkerId
    buffer.nextMarkerLayerId = params.nextMarkerLayerId
    buffer.nextDisplayLayerId = params.nextDisplayLayerId
    buffer.historyProvider.deserialize(params.history, buffer)

    for (const layerId in params.markerLayers) {
      const layerState = params.markerLayers[layerId]
      let layer
      if (layerId === params.defaultMarkerLayerId) {
        buffer.defaultMarkerLayer.id = layerId
        buffer.defaultMarkerLayer.deserialize(layerState)
        layer = buffer.defaultMarkerLayer
      } else {
        layer = MarkerLayer.deserialize(buffer, layerState)
      }
      buffer.markerLayers[layerId] = layer
    }

    for (const layerId in params.displayLayers) {
      const layerState = params.displayLayers[layerId]
      buffer.displayLayers[layerId] = DisplayLayer.deserialize(buffer, layerState)
    }

    return buffer
  }

  // Returns a {String} representing a unique identifier for this {TextBuffer}.
  getId () {
    return this.id
  }

  serialize (options) {
    if (options == null) options = {}
    if (options.markerLayers == null) options.markerLayers = true
    if (options.history == null) options.history = true

    const markerLayers = {}
    if (options.markerLayers) {
      for (const id in this.markerLayers) {
        const layer = this.markerLayers[id]
        if (layer.persistent) {
          markerLayers[id] = layer.serialize()
        }
      }
    }

    const displayLayers = {}
    for (const id in this.displayLayers) {
      const layer = this.displayLayers[id]
      displayLayers[id] = layer.serialize()
    }

    let history = {}
    if (options.history) {
      history = this.historyProvider.serialize(options)
    }

    const result = {
      id: this.getId(),
      version: TextBuffer.version,
      defaultMarkerLayerId: this.defaultMarkerLayer.id,
      markerLayers,
      displayLayers,
      nextMarkerLayerId: this.nextMarkerLayerId,
      nextDisplayLayerId: this.nextDisplayLayerId,
      history,
      encoding: this.getEncoding(),
      preferredLineEnding: this.preferredLineEnding,
      nextMarkerId: this.nextMarkerId
    }

    const filePath = this.getPath()
    if (filePath) {
      if (this.baseTextDigestCache == null) this.baseTextDigestCache = this.buffer.baseTextDigest()
      result.filePath = filePath
      result.digestWhenLastPersisted = this.digestWhenLastPersisted
      result.outstandingChanges = this.buffer.serializeChanges()
    } else {
      result.text = this.getText()
    }

    return result
  }

  /*
  Section: Event Subscription
  */

  // Public: Invoke the given callback synchronously _before_ the content of the
  // buffer changes.
  //
  // Because observers are invoked synchronously, it's important not to perform
  // any expensive operations via this method.
  //
  // * `callback` {Function} to be called when the buffer changes.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onWillChange (callback) {
    return this.emitter.on('will-change', callback)
  }

  // Public: Invoke the given callback synchronously when a transaction
  // finishes with a list of all the changes in the transaction.
  //
  // * `callback` {Function} to be called when a transaction in which textual
  //   changes occurred is completed.
  //   * `event` {Object} with the following keys:
  //     * `oldRange` The smallest combined {Range} containing all of the old
  //       text.
  //     * `newRange` The smallest combined {Range} containing all of the new
  //       text.
  //     * `changes` {Array} of {Object}s summarizing the aggregated changes
  //       that occurred during the transaction. See *Working With Aggregated
  //       Changes* in the description of the {TextBuffer} class for details.
  //       * `oldRange` The {Range} of the deleted text in the contents of the
  //         buffer as it existed *before* the batch of changes reported by
  //         this event.
  //       * `newRange`: The {Range} of the inserted text in the current
  //         contents of the buffer.
  //       * `oldText`: A {String} representing the deleted text.
  //       * `newText`: A {String} representing the inserted text.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChange (callback) {
    return this.emitter.on('did-change-text', callback)
  }

  // Public: This is now identical to {::onDidChange}.
  onDidChangeText (callback) {
    return this.onDidChange(callback)
  }

  // Public: Invoke the given callback asynchronously following one or more
  // changes after {::getStoppedChangingDelay} milliseconds elapse without an
  // additional change.
  //
  // This method can be used to perform potentially expensive operations that
  // don't need to be performed synchronously. If you need to run your callback
  // synchronously, use {::onDidChange} instead.
  //
  // * `callback` {Function} to be called when the buffer stops changing.
  //   * `event` {Object} with the following keys:
  //     * `changes` An {Array} containing {Object}s summarizing the aggregated
  //       changes. See *Working With Aggregated Changes* in the description of
  //       the {TextBuffer} class for details.
  //       * `oldRange` The {Range} of the deleted text in the contents of the
  //         buffer as it existed *before* the batch of changes reported by
  //         this event.
  //       * `newRange`: The {Range} of the inserted text in the current
  //         contents of the buffer.
  //       * `oldText`: A {String} representing the deleted text.
  //       * `newText`: A {String} representing the inserted text.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidStopChanging (callback) {
    return this.emitter.on('did-stop-changing', callback)
  }

  // Public: Invoke the given callback when the in-memory contents of the
  // buffer become in conflict with the contents of the file on disk.
  //
  // * `callback` {Function} to be called when the buffer enters conflict.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidConflict (callback) {
    return this.emitter.on('did-conflict', callback)
  }

  // Public: Invoke the given callback if the value of {::isModified} changes.
  //
  // * `callback` {Function} to be called when {::isModified} changes.
  //   * `modified` {Boolean} indicating whether the buffer is modified.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeModified (callback) {
    return this.emitter.on('did-change-modified', callback)
  }

  // Public: Invoke the given callback when all marker `::onDidChange`
  // observers have been notified following a change to the buffer.
  //
  // The order of events following a buffer change is as follows:
  //
  // * The text of the buffer is changed
  // * All markers are updated accordingly, but their `::onDidChange` observers
  //   are not notified.
  // * `TextBuffer::onDidChange` observers are notified.
  // * `Marker::onDidChange` observers are notified.
  // * `TextBuffer::onDidUpdateMarkers` observers are notified.
  //
  // Basically, this method gives you a way to take action after both a buffer
  // change and all associated marker changes.
  //
  // * `callback` {Function} to be called after markers are updated.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidUpdateMarkers (callback) {
    return this.emitter.on('did-update-markers', callback)
  }

  // Public: Invoke the given callback when a marker is created.
  //
  // * `callback` {Function} to be called when a marker is created.
  //   * `marker` {Marker} that was created.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidCreateMarker (callback) {
    return this.emitter.on('did-create-marker', callback)
  }

  // Public: Invoke the given callback when the value of {::getPath} changes.
  //
  // * `callback` {Function} to be called when the path changes.
  //   * `path` {String} representing the buffer's current path on disk.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangePath (callback) {
    return this.emitter.on('did-change-path', callback)
  }

  // Public: Invoke the given callback when the value of {::getEncoding} changes.
  //
  // * `callback` {Function} to be called when the encoding changes.
  //   * `encoding` {String} character set encoding of the buffer.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeEncoding (callback) {
    return this.emitter.on('did-change-encoding', callback)
  }

  // Public: Invoke the given callback before the buffer is saved to disk.
  //
  // * `callback` {Function} to be called before the buffer is saved. If this function returns
  //   a {Promise}, then the buffer will not be saved until the promise resolves.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onWillSave (callback) {
    return this.emitter.on('will-save', callback)
  }

  // Public: Invoke the given callback after the buffer is saved to disk.
  //
  // * `callback` {Function} to be called after the buffer is saved.
  //   * `event` {Object} with the following keys:
  //     * `path` The path to which the buffer was saved.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidSave (callback) {
    return this.emitter.on('did-save', callback)
  }

  // Public: Invoke the given callback after the file backing the buffer is
  // deleted.
  //
  // * `callback` {Function} to be called after the buffer is deleted.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidDelete (callback) {
    return this.emitter.on('did-delete', callback)
  }

  // Public: Invoke the given callback before the buffer is reloaded from the
  // contents of its file on disk.
  //
  // * `callback` {Function} to be called before the buffer is reloaded.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onWillReload (callback) {
    return this.emitter.on('will-reload', callback)
  }

  // Public: Invoke the given callback after the buffer is reloaded from the
  // contents of its file on disk.
  //
  // * `callback` {Function} to be called after the buffer is reloaded.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidReload (callback) {
    return this.emitter.on('did-reload', callback)
  }

  // Public: Invoke the given callback when the buffer is destroyed.
  //
  // * `callback` {Function} to be called when the buffer is destroyed.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidDestroy (callback) {
    return this.emitter.on('did-destroy', callback)
  }

  // Public: Invoke the given callback when there is an error in watching the
  // file.
  //
  // * `callback` {Function} callback
  //   * `errorObject` {Object}
  //     * `error` {Object} the error object
  //     * `handle` {Function} call this to indicate you have handled the error.
  //       The error will not be thrown if this function is called.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onWillThrowWatchError (callback) {
    return this.emitter.on('will-throw-watch-error', callback)
  }

  // Public: Get the number of milliseconds that will elapse without a change
  // before {::onDidStopChanging} observers are invoked following a change.
  //
  // Returns a {Number}.
  getStoppedChangingDelay () {
    return this.stoppedChangingDelay
  }

  /*
  Section: File Details
  */

  // Public: Determine if the in-memory contents of the buffer differ from its
  // contents on disk.
  //
  // If the buffer is unsaved, always returns `true` unless the buffer is empty.
  //
  // Returns a {Boolean}.
  isModified () {
    if (this.isDeleted()) {
      // We typically consider a deleted file to be modified… unless it was
      // unmodified at the time of deletion and has not been modified since.
      return !this.retainsUnmodifiedTraitAfterDeletion
    }
    if (this.file) {
      // Now that all deletion cases are weeded out, the main determination is
      // whether the native buffer reports itself as modified — but we keep the
      // `existsSync` check just to be thorough.
      return !this.file.existsSync() || this.buffer.isModified()
    } else {
      // A buffer that never had any backing file on disk is always considered
      // to be modified _unless_ it is completely empty. We should not be
      // prompting users to save untitled buffers with empty contents.
      return this.buffer.getLength() > 0
    }
  }

  // Public: Determine if the buffer is in a deleted state — meaning that it
  // was previously backed by a file on disk, but is no longer.
  isDeleted () {
    let hasNoFile = !this.file || !this.file.existsSync()
    return hasNoFile && this.didHaveFileOnDisk
  }

  // Public: Determine if the in-memory contents of the buffer conflict with
  // the on-disk contents of its associated file.
  //
  // This happens if the contents of a buffer’s backing file change while the
  // editor has uncommitted changes. Those uncommitted changes build upon a
  // state that is now stale; if those changes were committed to disk, it could
  // clobber the changes made by the external program.
  //
  // Returns a {Boolean}.
  isInConflict () {
    // Deleted files are automatically in conflict if they consider themselves
    // modified.
    return this.isModified() && (this.fileHasChangedSinceLastLoad || this.isDeleted())
  }

  // Public: Get the path of the associated file.
  //
  // Returns a {String}.
  getPath () {
    return this.file ? this.file.getPath() : undefined
  }

  // Public: Set the path for the buffer's associated file.
  //
  // * `filePath` A {String} representing the new file path
  setPath (filePath) {
    if (filePath === this.getPath()) return
    return this.setFile(filePath && new File(filePath))
  }

  // Experimental: Set a custom {File} object as the buffer's backing store.
  //
  // * `file` An {Object} with the following properties:
  //   * `getPath` A {Function} that returns the {String} path to the file.
  //   * `createReadStream` A {Function} that returns a `Readable` stream
  //     that can be used to load the file's content.
  //   * `createWriteStream` A {Function} that returns a `Writable` stream
  //     that can be used to save content to the file.
  //   * `existsSync` A {Function} that returns a {Boolean}, true if the file exists, false otherwise.
  //   * `onDidChange` (optional) A {Function} that invokes its callback argument
  //     when the file changes. The method should return a {Disposable} that
  //     can be used to prevent further calls to the callback.
  //   * `onDidDelete` (optional) A {Function} that invokes its callback argument
  //     when the file is deleted. The method should return a {Disposable} that
  //     can be used to prevent further calls to the callback.
  //   * `onDidRename` (optional) A {Function} that invokes its callback argument
  //     when the file is renamed. The method should return a {Disposable} that
  //     can be used to prevent further calls to the callback.
  setFile (file) {
    if (!this.file && !file) return
    if (file === this.file) return

    this.file = file
    if (this.file) {
      if (typeof this.file.setEncoding === 'function') {
        this.file.setEncoding(this.getEncoding())
      }
      this.subscribeToFile()
    }

    this.emitter.emit('did-change-path', this.getPath())
  }

  // Public: Sets the character set encoding for this buffer.
  //
  // * `encoding` The {String} encoding to use (default: 'utf8').
  setEncoding (encoding = 'utf8') {
    if (encoding === this.getEncoding()) return

    this.encoding = encoding
    if (this.file) {
      if (typeof this.file.setEncoding === 'function') {
        this.file.setEncoding(encoding)
      }
      this.emitter.emit('did-change-encoding', encoding)
      if (!this.isModified()) {
        this.load({clearHistory: true, internal: true})
      }
    } else {
      this.emitter.emit('did-change-encoding', encoding)
    }
  }

  // Public: Returns the {String} encoding of this buffer.
  getEncoding () {
    return this.encoding || (this.file && this.file.getEncoding())
  }

  setPreferredLineEnding (preferredLineEnding = null) {
    this.preferredLineEnding = preferredLineEnding
  }

  getPreferredLineEnding () {
    return this.preferredLineEnding
  }

  // Public: Get the path of the associated file.
  //
  // Returns a {String}.
  getUri () {
    return this.getPath()
  }

  // Get the basename of the associated file.
  //
  // The basename is the name portion of the file's path, without the containing
  // directories.
  //
  // Returns a {String}.
  getBaseName () {
    return this.file && this.file.getBaseName()
  }

  /*
  Section: Reading Text
  */

  // Public: Determine whether the buffer is empty.
  //
  // Returns a {Boolean}.
  isEmpty () {
    return this.buffer.getLength() === 0
  }

  // Public: Get the entire text of the buffer. Avoid using this unless you know that the
  // buffer's text is reasonably short.
  //
  // Returns a {String}.
  getText () {
    if (this.cachedText == null) this.cachedText = this.buffer.getText()
    return this.cachedText
  }

  getCharacterAtPosition (position) {
    return this.buffer.getCharacterAtPosition(Point.fromObject(position))
  }

  // Public: Get the text in a range.
  //
  // * `range` A {Range}
  //
  // Returns a {String}
  getTextInRange (range) {
    return this.buffer.getTextInRange(Range.fromObject(range))
  }

  // Public: Get the text of all lines in the buffer, without their line endings.
  //
  // Returns an {Array} of {String}s.
  getLines () {
    return this.buffer.getLines()
  }

  // Public: Get the text of the last line of the buffer, without its line
  // ending.
  //
  // Returns a {String}.
  getLastLine () {
    return this.lineForRow(this.getLastRow())
  }

  // Public: Get the text of the line at the given 0-indexed row, without its
  // line ending.
  //
  // * `row` A {Number} representing the row.
  //
  // Returns a {String}.
  lineForRow (row) {
    return this.buffer.lineForRow(row)
  }

  // Public: Get the line ending for the given 0-indexed row.
  //
  // * `row` A {Number} indicating the row.
  //
  // Returns a {String}. The returned newline is represented as a literal string:
  // `'\n'`, `'\r\n'`, or `''` for the last line of the buffer, which
  // doesn't end in a newline.
  lineEndingForRow (row) {
    return this.buffer.lineEndingForRow(row)
  }

  // Public: Get the length of the line for the given 0-indexed row, without its
  // line ending.
  //
  // * `row` A {Number} indicating the row.
  //
  // Returns a {Number}.
  lineLengthForRow (row) {
    return this.buffer.lineLengthForRow(row)
  }

  // Public: Determine if the given row contains only whitespace.
  //
  // * `row` A {Number} representing a 0-indexed row.
  //
  // Returns a {Boolean}.
  isRowBlank (row) {
    return !/\S/.test(this.lineForRow(row))
  }

  // Public: Given a row, find the first preceding row that's not blank.
  //
  // * `startRow` A {Number} identifying the row to start checking at.
  //
  // Returns a {Number} or `null` if there's no preceding non-blank row.
  previousNonBlankRow (startRow) {
    if (startRow === 0) return null
    startRow = Math.min(startRow, this.getLastRow())
    for (let row = startRow - 1; row >= 0; row--) {
      if (!this.isRowBlank(row)) return row
    }
    return null
  }

  // Public: Given a row, find the next row that's not blank.
  //
  // * `startRow` A {Number} identifying the row to start checking at.
  //
  // Returns a {Number} or `null` if there's no next non-blank row.
  nextNonBlankRow (startRow) {
    const lastRow = this.getLastRow()
    if (startRow < lastRow) {
      for (let row = startRow + 1; row <= lastRow; row++) {
        if (!this.isRowBlank(row)) return row
      }
    }
    return null
  }

  // Extended: Return true if the buffer contains any astral-plane Unicode characters that
  // are encoded as surrogate pairs.
  //
  // Returns a {Boolean}.
  hasAstral () {
    if (this.cachedHasAstral !== null) {
      return this.cachedHasAstral
    } else {
      this.cachedHasAstral = this.buffer.hasAstral()
      return this.cachedHasAstral
    }
  }

  /*
  Section: Mutating Text
  */

  // Public: Replace the entire contents of the buffer with the given text.
  //
  // * `text` A {String}
  //
  // Returns a {Range} spanning the new buffer contents.
  setText (text) {
    return this.setTextInRange(this.getRange(), text, {normalizeLineEndings: false})
  }

  // Public: Replace the current buffer contents by applying a diff based on the
  // given text.
  //
  // * `text` A {String} containing the new buffer contents.
  setTextViaDiff (text) {
    const changes = this.buffer.diff(text).getChanges()
    if (changes.length === 0) return

    // The native differ bounds its edit distance and degrades to a single
    // change replacing the whole buffer when the texts differ too much. Use
    // the line-wise JavaScript diff in that case so markers outside the
    // changed lines are still preserved.
    const {row: lastRow, column: lastColumn} = this.buffer.getExtent()
    if (changes.length === 1 &&
        changes[0].oldStart.row === 0 && changes[0].oldStart.column === 0 &&
        changes[0].oldEnd.row === lastRow && changes[0].oldEnd.column === lastColumn) {
      return this.setTextViaLineDiff(text)
    }

    const changeOptions = {normalizeLineEndings: false}
    this.transact(() => {
      for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i]
        this.setTextInRange([change.oldStart, change.oldEnd], change.newText, changeOptions)
      }
    })
  }

  setTextViaLineDiff (text) {
    const currentText = this.getText()
    if (currentText === text) return

    const computeBufferColumn = function (str) {
      const newlineIndex = str.lastIndexOf('\n')
      if (newlineIndex === -1) {
        return str.length
      } else {
        return str.length - newlineIndex - 1
      }
    }

    this.transact(() => {
      let row = 0
      let column = 0
      const currentPosition = [0, 0]

      const lineDiff = diff.diffLines(currentText, text)
      const changeOptions = {normalizeLineEndings: false}

      for (let change of lineDiff) {
        const lineCount = change.count
        currentPosition[0] = row
        currentPosition[1] = column

        if (change.added) {
          row += lineCount
          column = computeBufferColumn(change.value)
          this.setTextInRange([currentPosition, currentPosition], change.value, changeOptions)
        } else if (change.removed) {
          const endRow = row + lineCount
          const endColumn = column + computeBufferColumn(change.value)
          this.setTextInRange([currentPosition, [endRow, endColumn]], '', changeOptions)
        } else {
          row += lineCount
          column = computeBufferColumn(change.value)
        }
      }
    })
  }

  // Public: Set the text in the given range.
  //
  // * `range` A {Range}
  // * `newText` A {String}
  // * `options` (optional) {Object}
  //   * `normalizeLineEndings` (optional) {Boolean} (default: true)
  //   * `undo` (optional) *Deprecated* {String} 'skip' will cause this change
  //     to be grouped with the preceding change for the purposes of undo and
  //     redo. This property is deprecated. Call groupLastChanges() on the
  //     buffer after instead.
  //
  // Returns the {Range} of the inserted text.
  setTextInRange (range, newText, options) {
    let normalizeLineEndings, undo
    if (options) ({normalizeLineEndings, undo} = options)
    if (normalizeLineEndings == null) normalizeLineEndings = true
    if (undo != null) {
      Grim.deprecate('The `undo` option is deprecated. Call groupLastChanges() on the TextBuffer afterward instead.')
    }

    if (this.transactCallDepth === 0) {
      const newRange = this.transact(() => this.setTextInRange(range, newText, {normalizeLineEndings}))
      if (undo === 'skip') this.groupLastChanges()
      return newRange
    }

    const oldRange = this.clipRange(range)
    const oldText = this.getTextInRange(oldRange)

    if (normalizeLineEndings) {
      const normalizedEnding = this.preferredLineEnding ||
        this.lineEndingForRow(oldRange.start.row) ||
        this.lineEndingForRow(oldRange.start.row - 1)
      if (normalizedEnding) {
        newText = newText.replace(newlineRegex, normalizedEnding)
      }
    }

    const change = {
      oldStart: oldRange.start,
      oldEnd: oldRange.end,
      newStart: oldRange.start,
      newEnd: traverse(oldRange.start, extentForText(newText)),
      oldText,
      newText
    }
    const newRange = this.applyChange(change, true)
    if (undo === 'skip') this.groupLastChanges()
    return newRange
  }

  // Public: Insert text at the given position.
  //
  // * `position` A {Point} representing the insertion location. The position is
  //   clipped before insertion.
  // * `text` A {String} representing the text to insert.
  // * `options` (optional) {Object}
  //   * `normalizeLineEndings` (optional) {Boolean} (default: true)
  //   * `undo` (optional) *Deprecated* {String} 'skip' will skip the undo
  //     system. This property is deprecated. Call groupLastChanges() on the
  //     {TextBuffer} afterward instead.
  //
  // Returns the {Range} of the inserted text.
  insert (position, text, options) {
    return this.setTextInRange(new Range(position, position), text, options)
  }

  // Public: Append text to the end of the buffer.
  //
  // * `text` A {String} representing the text to append.
  // * `options` (optional) {Object}
  //   * `normalizeLineEndings` (optional) {Boolean} (default: true)
  //   * `undo` (optional) *Deprecated* {String} 'skip' will skip the undo
  //     system. This property is deprecated. Call groupLastChanges() on the
  //     {TextBuffer} afterward instead.
  //
  // Returns the {Range} of the inserted text
  append (text, options) {
    return this.insert(this.getEndPosition(), text, options)
  }

  // Applies a change to the buffer based on its old range and new text.
  applyChange (change, pushToHistory = false) {
    const {newStart, newEnd, oldStart, oldEnd, oldText, newText} = change

    const oldExtent = traversal(oldEnd, oldStart)
    const oldRange = Range(newStart, traverse(newStart, oldExtent))
    oldRange.freeze()

    const newExtent = traversal(newEnd, newStart)
    const newRange = Range(newStart, traverse(newStart, newExtent))
    newRange.freeze()

    if (pushToHistory) {
      if (!change.oldExtent) change.oldExtent = oldExtent
      if (!change.newExtent) change.newExtent = newExtent
      if (this.historyProvider) {
        this.historyProvider.pushChange(change)
      }
    }

    const changeEvent = {oldRange, newRange, oldText, newText}
    for (const id in this.displayLayers) {
      const displayLayer = this.displayLayers[id]
      displayLayer.bufferWillChange(changeEvent)
    }

    this.emitWillChangeEvent()
    this.buffer.setTextInRange(oldRange, newText)

    if (this.retainsUnmodifiedTraitAfterDeletion) {
      // This buffer is in the "deleted" state but _not_ the "modified" state.
      // This happens when the buffer's backing file is deleted _and_ the
      // buffer is not already considered to be modified at the time of
      // deletion.
      //
      // But this method introduces a change to the buffer, so we'll clear the
      // flag that is preventing `isModified` from returning `true`.
      this.retainsUnmodifiedTraitAfterDeletion = false
      this.emitModifiedStatusChanged(this.isModified())
    }

    if (this.markerLayers) {
      for (const id in this.markerLayers) {
        const markerLayer = this.markerLayers[id]
        markerLayer.splice(oldRange.start, oldExtent, newExtent)
        this.markerLayersWithPendingUpdateEvents.add(markerLayer)
      }
    }

    this.cachedText = null
    this.changesSinceLastDidChangeTextEvent.push(change)
    this.changesSinceLastStoppedChangingEvent.push(change)
    this.emitDidChangeEvent(changeEvent)
    return newRange
  }

  emitDidChangeEvent (changeEvent) {
    if (!changeEvent.oldRange.isEmpty() || !changeEvent.newRange.isEmpty()) {
      this.languageMode.bufferDidChange(changeEvent)
      for (const id in this.displayLayers) {
        this.displayLayers[id].bufferDidChange(changeEvent)
      }
    }
  }

  // Public: Delete the text in the given range.
  //
  // * `range` A {Range} in which to delete. The range is clipped before deleting.
  //
  // Returns an empty {Range} starting at the start of deleted range.
  delete (range) {
    return this.setTextInRange(range, '')
  }

  // Public: Delete the line associated with a specified 0-indexed row.
  //
  // * `row` A {Number} representing the row to delete.
  //
  // Returns the {Range} of the deleted text.
  deleteRow (row) {
    return this.deleteRows(row, row)
  }

  // Public: Delete the lines associated with the specified 0-indexed row range.
  //
  // If the row range is out of bounds, it will be clipped. If the `startRow` is
  // greater than the `endRow`, they will be reordered.
  //
  // * `startRow` A {Number} representing the first row to delete.
  // * `endRow` A {Number} representing the last row to delete, inclusive.
  //
  // Returns the {Range} of the deleted text.
  deleteRows (startRow, endRow) {
    let endPoint, startPoint
    const lastRow = this.getLastRow()

    if (startRow > endRow) { [startRow, endRow] = [endRow, startRow] }

    if (endRow < 0) {
      return new Range(this.getFirstPosition(), this.getFirstPosition())
    }

    if (startRow > lastRow) {
      return new Range(this.getEndPosition(), this.getEndPosition())
    }

    startRow = Math.max(0, startRow)
    endRow = Math.min(lastRow, endRow)

    if (endRow < lastRow) {
      startPoint = new Point(startRow, 0)
      endPoint = new Point(endRow + 1, 0)
    } else {
      if (startRow === 0) {
        startPoint = new Point(startRow, 0)
      } else {
        startPoint = new Point(startRow - 1, this.lineLengthForRow(startRow - 1))
      }
      endPoint = new Point(endRow, this.lineLengthForRow(endRow))
    }

    return this.delete(new Range(startPoint, endPoint))
  }

  /*
  Section: Markers
  */

  // Public: Create a layer to contain a set of related markers.
  //
  // * `options` (optional) An {Object} containing the following keys:
  //   * `maintainHistory` (optional) A {Boolean} indicating whether or not the
  //     state of this layer should be restored on undo/redo operations. Defaults
  //     to `false`.
  //   * `persistent` (optional) A {Boolean} indicating whether or not this
  //     marker layer should be serialized and deserialized along with the rest
  //     of the buffer. Defaults to `false`. If `true`, the marker layer's id
  //     will be maintained across the serialization boundary, allowing you to
  //     retrieve it via {::getMarkerLayer}.
  //   * `role` (optional) A {String} indicating role of this marker layer
  //
  // Returns a {MarkerLayer}.
  addMarkerLayer (options) {
    const layer = new MarkerLayer(this, String(this.nextMarkerLayerId++), options)
    this.markerLayers[layer.id] = layer
    return layer
  }

  // Public: Get a {MarkerLayer} by id.
  //
  // * `id` The id of the marker layer to retrieve.
  //
  // Returns a {MarkerLayer} or `undefined` if no layer exists with the given
  // id.
  getMarkerLayer (id) {
    return this.markerLayers[id]
  }

  // Public: Get the default {MarkerLayer}.
  //
  // All {Marker} APIs not tied to an explicit layer interact with this default
  // layer.
  //
  // Returns a {MarkerLayer}.
  getDefaultMarkerLayer () {
    return this.defaultMarkerLayer
  }

  // Public: Create a {Marker} with the given range in the default {MarkerLayer}.
  // This marker will maintain its logical location as the buffer is changed,
  // so if you mark a particular word, the marker will remain over that word
  // even if the word's location in the buffer changes.
  //
  // * `range` A {Range} or range-compatible {Array}
  // * `properties` (optional) A hash of key-value pairs to associate with the
  //   marker. There are also reserved property names that have marker-specific
  //   meaning.
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
  //   * `exclusive` (optional) {Boolean} indicating whether insertions at the
  //     start or end of the marked range should be interpreted as happening
  //     *outside* the marker. Defaults to `false`, except when using the
  //     `inside` invalidation strategy or when the marker has no tail, in
  //     which case it defaults to true. Explicitly assigning this option
  //     overrides behavior in all circumstances.
  //
  // Returns a {Marker}.
  markRange (range, properties) {
    return this.defaultMarkerLayer.markRange(range, properties)
  }

  // Public: Create a {Marker} at the given position with no tail in the default
  // marker layer.
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
  //   * `exclusive` (optional) {Boolean} indicating whether insertions at the
  //     start or end of the marked range should be interpreted as happening
  //     *outside* the marker. Defaults to `false`, except when using the
  //     `inside` invalidation strategy or when the marker has no tail, in
  //     which case it defaults to true. Explicitly assigning this option
  //     overrides behavior in all circumstances.
  //
  // Returns a {Marker}.
  markPosition (position, options) {
    return this.defaultMarkerLayer.markPosition(position, options)
  }

  // Public: Get all existing markers on the default marker layer.
  //
  // Returns an {Array} of {Marker}s.
  getMarkers () {
    return this.defaultMarkerLayer.getMarkers()
  }

  // Public: Get an existing marker by its id from the default marker layer.
  //
  // * `id` {Number} id of the marker to retrieve
  //
  // Returns a {Marker}.
  getMarker (id) {
    return this.defaultMarkerLayer.getMarker(id)
  }

  // Public: Find markers conforming to the given parameters in the default
  // marker layer.
  //
  // Markers are sorted based on their position in the buffer. If two markers
  // start at the same position, the larger marker comes first.
  //
  // * `params` A hash of key-value pairs constraining the set of returned markers. You
  //   can query against custom marker properties by listing the desired
  //   key-value pairs here. In addition, the following keys are reserved and
  //   have special semantics:
  //   * `startPosition` Only include markers that start at the given {Point}.
  //   * `endPosition` Only include markers that end at the given {Point}.
  //   * `startsInRange` Only include markers that start inside the given {Range}.
  //   * `endsInRange` Only include markers that end inside the given {Range}.
  //   * `containsPoint` Only include markers that contain the given {Point}, inclusive.
  //   * `containsRange` Only include markers that contain the given {Range}, inclusive.
  //   * `startRow` Only include markers that start at the given row {Number}.
  //   * `endRow` Only include markers that end at the given row {Number}.
  //   * `intersectsRow` Only include markers that intersect the given row {Number}.
  //
  // Returns an {Array} of {Marker}s.
  findMarkers (params) {
    return this.defaultMarkerLayer.findMarkers(params)
  }

  // Public: Get the number of markers in the default marker layer.
  //
  // Returns a {Number}.
  getMarkerCount () {
    return this.defaultMarkerLayer.getMarkerCount()
  }

  destroyMarker (id) {
    const marker = this.getMarker(id)
    if (marker) marker.destroy()
  }

  /*
  Section: History
  */

  setHistoryProvider (historyProvider) {
    this.historyProvider = historyProvider
  }

  restoreDefaultHistoryProvider (history) {
    const provider = new DefaultHistoryProvider(this)
    provider.restoreFromSnapshot(history)
    return this.setHistoryProvider(provider)
  }

  getHistory (maxEntries) {
    if (this.transactCallDepth > 0) {
      throw new Error('Cannot build history snapshots within transactions')
    }

    const snapshot = this.historyProvider.getSnapshot(maxEntries)

    const baseTextBuffer = new NativeTextBuffer(this.getText())
    for (let i = snapshot.undoStackChanges.length - 1; i >= 0; i--) {
      const change = snapshot.undoStackChanges[i]
      const newRange = Range(change.newStart, change.newEnd)
      baseTextBuffer.setTextInRange(newRange, change.oldText)
    }

    return {
      baseText: baseTextBuffer.getText(),
      undoStack: snapshot.undoStack,
      redoStack: snapshot.redoStack,
      nextCheckpointId: snapshot.nextCheckpointId
    }
  }

  // Provide fallback in case people are using this renamed private field in packages.
  get history () {
    return this.historyProvider
  }

  // Public: Undo the last operation. If a transaction is in progress, aborts it.
  //
  // * `options` (optional) {Object}
  //   * `selectionsMarkerLayer` (optional)
  //     Restore snapshot of selections marker layer to given selectionsMarkerLayer.
  //
  // Returns a {Boolean} of whether or not a change was made.
  undo (options) {
    const pop = this.historyProvider.undo()
    if (!pop) return false

    this.emitWillChangeEvent()
    this.transactCallDepth++
    try {
      for (const change of pop.textUpdates) {
        this.applyChange(change)
      }
    } finally {
      this.transactCallDepth--
    }
    this.restoreFromMarkerSnapshot(pop.markers, options && options.selectionsMarkerLayer)
    this.emitDidChangeTextEvent()
    this.emitMarkerChangeEvents(pop.markers)
    return true
  }

  // Public: Redo the last operation
  //
  // * `options` (optional) {Object}
  //   * `selectionsMarkerLayer` (optional)
  //     Restore snapshot of selections marker layer to given selectionsMarkerLayer.
  //
  // Returns a {Boolean} of whether or not a change was made.
  redo (options) {
    const pop = this.historyProvider.redo()
    if (!pop) return false

    this.emitWillChangeEvent()
    this.transactCallDepth++
    try {
      for (const change of pop.textUpdates) {
        this.applyChange(change)
      }
    } finally {
      this.transactCallDepth--
    }
    this.restoreFromMarkerSnapshot(pop.markers, options && options.selectionsMarkerLayer)
    this.emitDidChangeTextEvent()
    this.emitMarkerChangeEvents(pop.markers)
    return true
  }

  // Public: Batch multiple operations as a single undo/redo step.
  //
  // Any group of operations that are logically grouped from the perspective of
  // undoing and redoing should be performed in a transaction. If you want to
  // abort the transaction, call {::abortTransaction} to terminate the function's
  // execution and revert any changes performed up to the abortion.
  //
  // * `options` (optional) {Object}
  //   * `groupingInterval` (optional) The {Number} of milliseconds for which this
  //     transaction should be considered 'open for grouping' after it begins. If
  //     a transaction with a positive `groupingInterval` is committed while the
  //     previous transaction is still open for grouping, the two transactions
  //     are merged with respect to undo and redo.
  //   * `selectionsMarkerLayer` (optional)
  //     When provided, skip taking snapshot for other selections markerLayers except given one.
  // * `groupingInterval` (optional) The {Number} of milliseconds for which this
  //   transaction should be considered 'open for grouping' after it begins. If a
  //   transaction with a positive `groupingInterval` is committed while the previous
  //   transaction is still open for grouping, the two transactions are merged with
  //   respect to undo and redo.
  // * `fn` A {Function} to call inside the transaction.
  transact (options, fn) {
    let groupingInterval, result, selectionsMarkerLayer
    if (typeof options === 'function') {
      fn = options
      groupingInterval = 0
    } else if (typeof options === 'object') {
      ({groupingInterval, selectionsMarkerLayer} = options)
      if (groupingInterval == null) { groupingInterval = 0 }
    } else {
      groupingInterval = options
    }

    const checkpointBefore = this.historyProvider.createCheckpoint({
      markers: this.createMarkerSnapshot(selectionsMarkerLayer),
      isBarrier: true
    })

    try {
      this.transactCallDepth++
      result = fn()
    } catch (exception) {
      this.revertToCheckpoint(checkpointBefore, {deleteCheckpoint: true})
      if (!(exception instanceof TransactionAbortedError)) throw exception
      return
    } finally {
      this.transactCallDepth--
    }

    if (this.isDestroyed()) return result
    const endMarkerSnapshot = this.createMarkerSnapshot(selectionsMarkerLayer)
    this.historyProvider.groupChangesSinceCheckpoint(checkpointBefore, {
      markers: endMarkerSnapshot,
      deleteCheckpoint: true
    })
    this.historyProvider.applyGroupingInterval(groupingInterval)
    this.historyProvider.enforceUndoStackSizeLimit()
    this.emitDidChangeTextEvent()
    this.emitMarkerChangeEvents(endMarkerSnapshot)
    return result
  }

  // Public: Abort the currently running transaction
  //
  // Only intended to be called within the `fn` option to {::transact}
  abortTransaction () {
    throw new TransactionAbortedError('Transaction aborted.')
  }

  // Public: Clear the undo stack.
  clearUndoStack () {
    return this.historyProvider.clearUndoStack()
  }

  // Public: Create a pointer to the current state of the buffer for use
  // with {::revertToCheckpoint} and {::groupChangesSinceCheckpoint}.
  //
  // * `options` (optional) {Object}
  //   * `selectionsMarkerLayer` (optional)
  //     When provided, skip taking snapshot for other selections markerLayers except given one.
  //
  // Returns a checkpoint id value.
  createCheckpoint (options) {
    return this.historyProvider.createCheckpoint({
      markers: this.createMarkerSnapshot(options?.selectionsMarkerLayer ?? undefined),
      isBarrier: false
    })
  }

  // Public: Revert the buffer to the state it was in when the given
  // checkpoint was created.
  //
  // The redo stack will be empty following this operation, so changes since the
  // checkpoint will be lost. If the given checkpoint is no longer present in the
  // undo history, no changes will be made to the buffer and this method will
  // return `false`.
  //
  // * `checkpoint` {Number} id of the checkpoint to revert to.
  // * `options` (optional) {Object}
  //   * `selectionsMarkerLayer` (optional)
  //     Restore snapshot of selections marker layer to given selectionsMarkerLayer.
  //
  // Returns a {Boolean} indicating whether the operation succeeded.
  revertToCheckpoint (checkpoint, options) {
    const truncated = this.historyProvider.revertToCheckpoint(checkpoint)
    if (!truncated) return false
    this.emitWillChangeEvent()
    this.transactCallDepth++
    try {
      for (const change of truncated.textUpdates) {
        this.applyChange(change)
      }
    } finally {
      this.transactCallDepth--
    }
    this.restoreFromMarkerSnapshot(truncated.markers, options && options.selectionsMarkerLayer)
    this.emitDidChangeTextEvent()
    this.emitter.emit('did-update-markers')
    this.emitMarkerChangeEvents(truncated.markers)
    return true
  }

  // Public: Group all changes since the given checkpoint into a single
  // transaction for purposes of undo/redo.
  //
  // If the given checkpoint is no longer present in the undo history, no
  // grouping will be performed and this method will return `false`.
  //
  // * `checkpoint` {Number} id of the checkpoint to group changes since.
  // * `options` (optional) {Object}
  //   * `selectionsMarkerLayer` (optional)
  //     When provided, skip taking snapshot for other selections markerLayers except given one.
  //
  // Returns a {Boolean} indicating whether the operation succeeded.
  groupChangesSinceCheckpoint (checkpoint, options) {
    return this.historyProvider.groupChangesSinceCheckpoint(checkpoint, {
      markers: this.createMarkerSnapshot(options && options.selectionsMarkerLayer),
      deleteCheckpoint: false
    })
  }

  // Public: Group the last two text changes for purposes of undo/redo.
  //
  // This operation will only succeed if there are two changes on the undo
  // stack. It will not group past the beginning of an open transaction.
  //
  // Returns a {Boolean} indicating whether the operation succeeded.
  groupLastChanges () {
    return this.historyProvider.groupLastChanges()
  }

  // Public: Returns a list of changes since the given checkpoint.
  //
  // If the given checkpoint is no longer present in the undo history, this
  // method will return an empty {Array}.
  //
  // * `checkpoint` {Number} id of the checkpoint to get changes since.
  //
  // Returns an {Array} of {Object}s with the following fields that summarize
  //  the aggregated changes since the checkpoint. See *Working With Aggregated
  // Changes* in the description of the {TextBuffer} class for details.
  // * `oldRange` The {Range} of the deleted text in the text as it existed when
  //   the checkpoint was created.
  // * `newRange`: The {Range} of the inserted text in the current text.
  // * `oldText`: A {String} representing the deleted text.
  // * `newText`: A {String} representing the inserted text.
  getChangesSinceCheckpoint (checkpoint) {
    const changes = this.historyProvider.getChangesSinceCheckpoint(checkpoint)
    if (changes) {
      return normalizePatchChanges(changes)
    } else {
      return []
    }
  }

  /*
  Section: Search And Replace
  */

  // Public: Scan regular expression matches in the entire buffer, calling the
  // given iterator function on each match.
  //
  // If you're programmatically modifying the results, you may want to try
  // {::backwardsScan} to avoid tripping over your own changes.
  //
  // * `regex` A {RegExp} to search for.
  // * `options` (optional) {Object}
  //   * `leadingContextLineCount` {Number} default `0`; The number of lines before the
  //      matched line to include in the results object.
  //   * `trailingContextLineCount` {Number} default `0`; The number of lines after the
  //      matched line to include in the results object.
  // * `iterator` A {Function} that's called on each match with an {Object}
  //   containing the following keys:
  //   * `match` The current regular expression match.
  //   * `matchText` A {String} with the text of the match.
  //   * `range` The {Range} of the match.
  //   * `stop` Call this {Function} to terminate the scan.
  //   * `replace` Call this {Function} with a {String} to replace the match.
  //   * `leadingContextLines` An {Array} with `leadingContextLineCount` lines before the match.
  //   * `trailingContextLines` An {Array} with `trailingContextLineCount` lines after the match.
  scan (regex, options = {}, iterator) {
    if (_.isFunction(options)) {
      iterator = options
      options = {}
    }

    return this.scanInRange(regex, this.getRange(), options, iterator)
  }

  // Public: Scan regular expression matches in the entire buffer in reverse
  // order, calling the given iterator function on each match.
  //
  // * `regex` A {RegExp} to search for.
  // * `options` (optional) {Object}
  //   * `leadingContextLineCount` {Number} default `0`; The number of lines before the
  //      matched line to include in the results object.
  //   * `trailingContextLineCount` {Number} default `0`; The number of lines after the
  //      matched line to include in the results object.
  // * `iterator` A {Function} that's called on each match with an {Object}
  //   containing the following keys:
  //   * `match` The current regular expression match.
  //   * `matchText` A {String} with the text of the match.
  //   * `range` The {Range} of the match.
  //   * `stop` Call this {Function} to terminate the scan.
  //   * `replace` Call this {Function} with a {String} to replace the match.
  //   * `leadingContextLines` An {Array} with `leadingContextLineCount` lines before the match.
  //   * `trailingContextLines` An {Array} with `trailingContextLineCount` lines after the match.
  backwardsScan (regex, options = {}, iterator) {
    if (_.isFunction(options)) {
      iterator = options
      options = {}
    }

    return this.backwardsScanInRange(regex, this.getRange(), options, iterator)
  }

  // Public: Scan regular expression matches in a given range , calling the given
  // iterator function on each match.
  //
  // * `regex` A {RegExp} to search for.
  // * `range` A {Range} in which to search.
  // * `options` (optional) {Object}
  //   * `leadingContextLineCount` {Number} default `0`; The number of lines before the
  //      matched line to include in the results object.
  //   * `trailingContextLineCount` {Number} default `0`; The number of lines after the
  //      matched line to include in the results object.
  // * `callback` A {Function} that's called on each match with an {Object}
  //   containing the following keys:
  //   * `match` The current regular expression match.
  //   * `matchText` A {String} with the text of the match.
  //   * `range` The {Range} of the match.
  //   * `stop` Call this {Function} to terminate the scan.
  //   * `replace` Call this {Function} with a {String} to replace the match.
  //   * `leadingContextLines` An {Array} with `leadingContextLineCount` lines before the match.
  //   * `trailingContextLines` An {Array} with `trailingContextLineCount` lines after the match.
  scanInRange (regex, range, options = {}, callback, reverse = false) {
    if (_.isFunction(options)) {
      reverse = callback
      callback = options
      options = {}
    }

    range = this.clipRange(range)
    const matchRanges = this.findAllInRangeSync(regex, range)
    let startIndex = 0
    let endIndex = matchRanges.length
    let increment = 1
    let previousRow = -1
    let replacementColumnDelta = 0
    if (reverse) {
      startIndex = matchRanges.length - 1
      endIndex = -1
      increment = -1
    }

    for (let i = startIndex; i !== endIndex; i += increment) {
      const matchRange = matchRanges[i]
      if (range.end.isEqual(matchRange.start) && (range.end.column > 0)) continue
      if (matchRange.start.row !== previousRow) {
        replacementColumnDelta = 0
      }
      previousRow = matchRange.start.row
      matchRange.start.column += replacementColumnDelta
      matchRange.end.column += replacementColumnDelta

      const argument = new SearchCallbackArgument(this, Range.fromObject(matchRange), regex, options)
      callback(argument)
      if (argument.stopped || !regex.global) break

      if (!reverse && argument.replacementText != null) {
        replacementColumnDelta +=
          (matchRange.start.column + argument.replacementText.length) -
          matchRange.end.column
      }
    }
  }

  // Public: Scan regular expression matches in a given range in reverse order,
  // calling the given iterator function on each match.
  //
  // * `regex` A {RegExp} to search for.
  // * `range` A {Range} in which to search.
  // * `options` (optional) {Object}
  //   * `leadingContextLineCount` {Number} default `0`; The number of lines before the
  //      matched line to include in the results object.
  //   * `trailingContextLineCount` {Number} default `0`; The number of lines after the
  //      matched line to include in the results object.
  // * `iterator` A {Function} that's called on each match with an {Object}
  //   containing the following keys:
  //   * `match` The current regular expression match.
  //   * `matchText` A {String} with the text of the match.
  //   * `range` The {Range} of the match.
  //   * `stop` Call this {Function} to terminate the scan.
  //   * `replace` Call this {Function} with a {String} to replace the match.
  backwardsScanInRange (regex, range, options = {}, iterator) {
    if (_.isFunction(options)) {
      iterator = options
      options = {}
    }

    return this.scanInRange(regex, range, options, iterator, true)
  }

  // Public: Replace all regular expression matches in the entire buffer.
  //
  // * `regex` A {RegExp} representing the matches to be replaced.
  // * `replacementText` A {String} representing the text to replace each match.
  //
  // Returns a {Number} representing the number of replacements made.
  replace (regex, replacementText) {
    const doSave = !this.isModified()
    let replacements = 0

    this.transact(() => {
      return this.scan(regex, function ({matchText, replace}) {
        const text = matchText.replace(regex, replacementText)
        replacementText = text === matchText ? replacementText : text
        replace(replacementText)
        return replacements++
      })
    })

    if (doSave) this.save()

    return replacements
  }

  // Experimental: Asynchronously search the buffer for a given regex.
  //
  // * `regex` A {RegExp} to search for.
  //
  // Returns a {Promise} that resolves with the first {Range} of text that
  // matches the given regex.
  find (regex) { return this.buffer.find(regex) }

  // Experimental: Asynchronously search a given range of the buffer for a given regex.
  //
  // * `regex` A {RegExp} to search for.
  // * `range` A {Range} to search within.
  //
  // Returns a {Promise} that resolves with the first {Range} of text that
  // matches the given regex.
  findInRange (regex, range) { return this.buffer.findInRange(regex, range) }

  // Experimental: Search the buffer for a given regex.
  //
  // * `regex` A {RegExp} to search for.
  //
  // Returns the first {Range} of text that matches the given regex.
  findSync (regex) { return this.buffer.findSync(regex) }

  // Experimental: Search a given range of the buffer for a given regex.
  //
  // * `regex` A {RegExp} to search for.
  // * `range` A {Range} to search within.
  //
  // Returns the first {Range} of text that matches the given regex.
  findInRangeSync (regex, range) { return this.buffer.findInRangeSync(regex, range) }

  // Experimental: Asynchronously search the buffer for a given regex.
  //
  // * `regex` A {RegExp} to search for.
  //
  // Returns a {Promise} that resolves with an {Array} containing every
  // {Range} of text that matches the given regex.
  findAll (regex) { return this.buffer.findAll(regex) }

  // Experimental: Asynchronously search a given range of the buffer for a given regex.
  //
  // * `regex` A {RegExp} to search for.
  // * `range` A {Range} to search within.
  //
  // Returns a {Promise} that resolves with an {Array} containing every
  // {Range} of text that matches the given regex.
  findAllInRange (regex, range) { return this.buffer.findAllInRange(regex, range) }

  // Experimental: Run an regexp search on the buffer
  //
  // * `regex` A {RegExp} to search for.
  //
  // Returns an {Array} containing every {Range} of text that matches the given
  // regex.
  findAllSync (regex) { return this.buffer.findAllSync(regex) }

  // Experimental: Search a given range of the buffer for a given regex.
  //
  // * `regex` A {RegExp} to search for.
  // * `range` A {Range} to search within.
  //
  // Returns an {Array} containing every {Range} of text that matches the given
  // regex.
  findAllInRangeSync (regex, range) { return this.buffer.findAllInRangeSync(regex, range) }

  // Experimental: Search a given range of the buffer for a given regex. Store
  // the matching ranges in the given marker layer.
  //
  // * `markerLayer` A {MarkerLayer} to populate.
  // * `regex` A {RegExp} to search for.
  // * `range` A {Range} to search within.
  //
  // Returns an {Array} of {Marker}s representing the matches.
  findAndMarkAllInRangeSync (markerLayer, regex, range, options = {}) {
    const startId = this.nextMarkerId
    const exclusive = options.invalidate === 'inside' || !options.tailed
    this.nextMarkerId += this.buffer.findAndMarkAllSync(
      markerLayer.index,
      startId,
      exclusive,
      regex,
      Range.fromObject(range)
    )
    const markers = []
    for (let id = startId; id < this.nextMarkerId; id++) {
      const marker = new Marker(id, markerLayer, null, options, true)
      markerLayer.markersById.set(id, marker)
      markers.push(marker)
    }
    return markers
  }

  // Experimental: Find fuzzy match suggestions in the buffer
  //
  // * `query` A {String} to search for.
  // * `extraWordCharacters` A {String} of additional word characters to use when
  //    deciphering word boundaries
  // * `maxCount` A {Number} that limits the number of matches returned
  //
  // Returns an {Array} containing every {SubsequenceMatch} of text that matches the given
  // query.
  findWordsWithSubsequence (query, extraWordCharacters, maxCount) {
    return this.buffer.findWordsWithSubsequence(query, extraWordCharacters, maxCount)
  }

  // Experimental: Find fuzzy match suggestions in the buffer in a given range
  //
  // * `query` A {String} to search for.
  // * `extraWordCharacters` A {String} of additional word characters to use when
  //    deciphering word boundaries
  // * `maxCount` A {Number} that limits the number of matches returned
  // * `range` A {Range} that specifies the portion of the buffer to search
  //
  // Returns an {Array} containing every {SubsequenceMatch} of text that matches the given
  // query in the given range.
  findWordsWithSubsequenceInRange (query, extraWordCharacters, maxCount, range) {
    return this.buffer.findWordsWithSubsequenceInRange(query, extraWordCharacters, maxCount, range)
  }

  /*
  Section: Buffer Range Details
  */

  // Public: Get the range spanning from `[0, 0]` to {::getEndPosition}.
  //
  // Returns a {Range}.
  getRange () {
    return new Range(this.getFirstPosition(), this.getEndPosition())
  }

  // Public: Get the number of lines in the buffer.
  //
  // Returns a {Number}.
  getLineCount () { return this.buffer.getLineCount() }

  // Public: Get the last 0-indexed row in the buffer.
  //
  // Returns a {Number}.
  getLastRow () {
    return this.getLineCount() - 1
  }

  // Public: Get the first position in the buffer, which is always `[0, 0]`.
  //
  // Returns a {Point}.
  getFirstPosition () {
    return new Point(0, 0)
  }

  // Public: Get the maximal position in the buffer, where new text would be
  // appended.
  //
  // Returns a {Point}.
  getEndPosition () { return Point.fromObject(this.buffer.getExtent()) }

  // Public: Get the length of the buffer's text.
  getLength () { return this.buffer.getLength() }

  // Public: Get the length of the buffer in characters.
  //
  // Returns a {Number}.
  getMaxCharacterIndex () {
    return this.characterIndexForPosition(Point.INFINITY)
  }

  // Public: Get the range for the given row
  //
  // * `row` A {Number} representing a 0-indexed row.
  // * `includeNewline` A {Boolean} indicating whether or not to include the
  //   newline, which results in a range that extends to the start
  //   of the next line. (default: `false`)
  //
  // Returns a {Range}.
  rangeForRow (row, includeNewline) {
    row = Math.max(row, 0)
    row = Math.min(row, this.getLastRow())
    if (includeNewline && row < this.getLastRow()) {
      return new Range(new Point(row, 0), new Point(row + 1, 0))
    } else {
      return new Range(new Point(row, 0), new Point(row, this.lineLengthForRow(row)))
    }
  }

  // Public: Convert a position in the buffer in row/column coordinates to an
  // absolute character offset, inclusive of line ending characters.
  //
  // The position is clipped prior to translating.
  //
  // * `position` A {Point} or point-compatible {Array}.
  //
  // Returns a {Number}.
  characterIndexForPosition (position) {
    return this.buffer.characterIndexForPosition(Point.fromObject(position))
  }

  // Public: Convert an absolute character offset, inclusive of newlines, to a
  // position in the buffer in row/column coordinates.
  //
  // The offset is clipped prior to translating.
  //
  // * `offset` A {Number}.
  //
  // Returns a {Point}.
  positionForCharacterIndex (offset) {
    return Point.fromObject(this.buffer.positionForCharacterIndex(offset))
  }

  // Public: Clip the given range so it starts and ends at valid positions.
  //
  // For example, the position `[1, 100]` is out of bounds if the line at row 1 is
  // only 10 characters long, and it would be clipped to `(1, 10)`.
  //
  // * `range` A {Range} or range-compatible {Array} to clip.
  //
  // Returns the given {Range} if it is already in bounds, or a new clipped
  // {Range} if the given range is out-of-bounds.
  clipRange (range) {
    range = Range.fromObject(range)
    const start = this.clipPosition(range.start)
    const end = this.clipPosition(range.end)
    if (range.start.isEqual(start) && range.end.isEqual(end)) {
      return range
    } else {
      return new Range(start, end)
    }
  }

  // Public: Clip the given point so it is at a valid position in the buffer.
  //
  // For example, the position (1, 100) is out of bounds if the line at row 1 is
  // only 10 characters long, and it would be clipped to (1, 10)
  //
  // * `position` A {Point} or point-compatible {Array}.
  //
  // Returns a new {Point} if the given position is invalid, otherwise returns
  // the given position.
  clipPosition (position, options) {
    position = Point.fromObject(position)
    Point.assertValid(position)
    const {row, column} = position
    if (row < 0) {
      return this.getFirstPosition()
    } else if (row > this.getLastRow()) {
      return this.getEndPosition()
    } else if (column < 0) {
      return Point(row, 0)
    } else {
      const lineLength = this.lineLengthForRow(row)
      if (column >= lineLength && row < this.getLastRow() && options && options.clipDirection === 'forward') {
        return new Point(row + 1, 0)
      } else if (column > lineLength) {
        return new Point(row, lineLength)
      } else {
        return position
      }
    }
  }

  /*
  Section: Buffer Operations
  */

  // Public: Save the buffer.
  //
  // Returns a {Promise} that resolves when the save has completed.
  save () {
    return this.saveTo(this.file)
  }

  // Public: Save the buffer at a specific path.
  //
  // * `filePath` The path to save at.
  //
  // Returns a {Promise} that resolves when the save has completed.
  saveAs (filePath) {
    if (!filePath) {
      throw new Error("Can't save buffer with no file path")
    }
    let file
    if (this.file?.getPath() === filePath) {
      file = this.file
    } else {
      file = new File(filePath)
    }
    return this.saveTo(file)
  }

  async saveTo (file) {
    if (this.destroyed) throw new Error("Can't save destroyed buffer")
    if (!file) throw new Error("Can't save a buffer with no file")

    const filePath = file.getPath()

    this.outstandingSaveCount++

    try {
      let destination
      if (file instanceof File) {
        await fs.promises.mkdir(path.dirname(filePath), {recursive: true})
        destination = filePath
      } else {
        destination = file.createWriteStream()
      }

      await this.emitter.emitAsync('will-save', {path: filePath})

      try {
        await this.buffer.save(destination, this.getEncoding())
        this.didHaveFileOnDisk = true
      } catch (error) {
        if (error.code !== 'EACCES' || destination !== filePath) throw error

        const isWindows = process.platform === 'win32'
        if (isWindows) {
          const winattr = getPromisifiedWinattr()
          const attrs = await winattr.get(filePath)
          if (!attrs.hidden) throw error

          try {
            await winattr.set(filePath, { hidden: false })
            await this.buffer.save(filePath, this.getEncoding())
            await winattr.set(filePath, { hidden: true })
          } catch (_) {
            throw error
          }
        } else {
          const fsAdmin = require('fs-admin')
          try {
            await this.buffer.save(fsAdmin.createWriteStream(filePath), this.getEncoding())
          } catch (_) {
            throw error
          }
        }
      }
    } finally {
      this.outstandingSaveCount--
    }

    this.setFile(file)
    this.fileHasChangedSinceLastLoad = false
    this.digestWhenLastPersisted = this.buffer.baseTextDigest()
    this.loaded = true
    this.emitModifiedStatusChanged(false)
    this.emitter.emit('did-save', {path: filePath})
    return this
  }

  // Public: Reload the file's content from disk.
  //
  // Returns a {Promise} that resolves when the load is complete.
  reload () {
    return this.load({discardChanges: true, internal: true})
  }

  /*
  Section: Display Layers
  */

  addDisplayLayer (params) {
    const id = this.nextDisplayLayerId++
    const displayLayer = new DisplayLayer(id, this, params)
    this.displayLayers[id] = displayLayer
    return displayLayer
  }

  getDisplayLayer (id) {
    return this.displayLayers[id]
  }

  setDisplayLayers (displayLayers) {
    this.displayLayers = displayLayers
     // Used for deserialization
  }

  /*
  Language Modes
  */

  // Experimental: Get the language mode associated with this buffer.
  //
  // Returns a language mode {Object} (See {TextBuffer::setLanguageMode} for its interface).
  getLanguageMode () { return this.languageMode }

  // Experimental: Set the language mode for this buffer.
  //
  // * `languageMode` - an {Object} with the following methods:
  //   * `getLanguageId` - A {Function} that returns a {String} identifying the language.
  //   * `bufferDidChange` - A {Function} that is called whenever the buffer changes.
  //     * `change` An {Object} with the following fields:
  //       * `oldText` {String} The deleted text
  //       * `oldRange` The {Range} of the deleted text before the change took place.
  //       * `newText` {String} The inserted text
  //       * `newRange` The {Range} of the inserted text after the change took place.
  //   * `onDidChangeHighlighting` - A {Function} that takes a callback {Function} and calls it with
  //     a {Range} argument whenever the syntax of a given part of the buffer is updated.
  //   * `buildHighlightIterator` - A function that returns an iterator object with the following
  //     methods:
  //     * `seek` A {Function} that takes a {Point} and resets the iterator to that position.
  //     * `moveToSuccessor` A {Function} that advances the iterator to the next token
  //     * `getPosition` A {Function} that returns a {Point} representing the iterator's current
  //       position in the buffer.
  //     * `getCloseTags` A {Function} that returns an {Array} of {Number}s representing tokens
  //        that end at the current position.
  //     * `getOpenTags` A {Function} that returns an {Array} of {Number}s representing tokens
  //        that begin at the current position.
  setLanguageMode (languageMode) {
    if (languageMode !== this.languageMode) {
      const oldLanguageMode = this.languageMode
      if (typeof this.languageMode.destroy === 'function') {
        this.languageMode.destroy()
      }
      this.languageMode = languageMode || new NullLanguageMode()
      for (const id in this.displayLayers) {
        const displayLayer = this.displayLayers[id]
        displayLayer.bufferDidChangeLanguageMode(languageMode)
      }
      this.emitter.emit('did-change-language-mode', {newMode: this.languageMode, oldMode: oldLanguageMode})
    }
  }

  // Experimental: Call the given callback whenever the buffer's language mode changes.
  //
  // * `callback` - A {Function} to call when the language mode changes.
  //   * `languageMode` - The buffer's new language mode {Object}. See {TextBuffer::setLanguageMode}
  //     for its interface.
  //   * `oldLanguageMode` - The buffer's old language mode {Object}. See {TextBuffer::setLanguageMode}
  //     for its interface.
  //
  // Returns a {Disposable} that can be used to stop the callback from being called.
  onDidChangeLanguageMode (callback) {
    return this.emitter.on('did-change-language-mode', ({newMode, oldMode}) => callback(newMode, oldMode))
  }

  /*
  Section: Private Utility Methods
  */
  registerSelectionsMarkerLayer (markerLayer) {
    return this.selectionsMarkerLayerIds.add(markerLayer.id)
  }

  loadSync (options) {
    if (!options || !options.internal) {
      Grim.deprecate('The .loadSync instance method is deprecated. Create a loaded buffer using TextBuffer.loadSync(filePath) instead.')
    }

    let patch = null
    let checkpoint = null
    try {
      patch = this.buffer.loadSync(
        this.getPath(),
        this.getEncoding(),
        (percentDone, patch) => {
          if (patch && patch.getChangeCount() > 0) {
            checkpoint = this.historyProvider.createCheckpoint({
              markers: this.createMarkerSnapshot(),
              isBarrier: true
            })
            this.emitter.emit('will-reload')
            this.emitWillChangeEvent()
          }
        }
      )
      this.finishLoading(checkpoint, patch, options)
    } catch (error) {
      if ((!options || !options.mustExist) && error.code === 'ENOENT') {
        this.emitter.emit('will-reload')
        if (options && options.discardChanges) this.setText('')
        this.emitter.emit('did-reload')
      } else {
        throw error
      }
    }

    return this
  }

  async load (options) {
    if (!options || !options.internal) {
      Grim.deprecate('The .load instance method is deprecated. Create a loaded buffer using TextBuffer.load(filePath) instead.')
    }

    if (this.file instanceof File) {
      // The consumer is allowed to set a `File` instance with a path that does
      // not currently exist on disk.
      this.didHaveFileOnDisk = this.file.existsSync()
    }

    const source = this.file instanceof File
      ? this.file.getPath()
      : this.file.createReadStream()

    const loadCount = ++this.loadCount

    let checkpoint = null
    let patch
    try {
      patch = await this.buffer.load(
        source,
        {
          encoding: this.getEncoding(),
          force: options && options.discardChanges,
          patch: this.loaded
        }
      )

      // If this is not the most recent load of this file, then we should bow
      // out and let the newer call to `load` handle the tasks below.
      if (this.loadCount > loadCount) return

      if (patch) {
        if (patch.getChangeCount() > 0) {
          checkpoint = this.historyProvider.createCheckpoint({markers: this.createMarkerSnapshot(), isBarrier: true})
          this.emitter.emit('will-reload')
          this.emitWillChangeEvent()
        } else if (options && options.discardChanges) {
          this.emitter.emit('will-reload')
        }
      }
      this.finishLoading(checkpoint, patch, options)
    } catch (error) {
      if ((!options || !options.mustExist) && error.code === 'ENOENT') {
        this.emitter.emit('will-reload')
        if (options && options.discardChanges) this.setText('')
        this.emitter.emit('did-reload')
      } else {
        throw error
      }
    }

    return this
  }

  finishLoading (checkpoint, patch, options) {
    if (this.isDestroyed() || (this.loaded && checkpoint == null && patch != null)) {
      if (options && options.discardChanges) {
        this.emitter.emit('did-reload')
      }
      return
    }

    this.fileHasChangedSinceLastLoad = false
    this.digestWhenLastPersisted = this.buffer.baseTextDigest()
    this.cachedText = null

    if (this.loaded && patch && patch.getChangeCount() > 0) {
      const changes = patch.getChanges()

      if (options && options.clearHistory) {
        this.historyProvider.clearUndoStack()
      } else {
        if (this.historyProvider.pushPatch) {
          this.historyProvider.pushPatch(patch)
        } else {
          this.historyProvider.pushChanges(changes)
        }
      }

      if (changes) {
        this.changesSinceLastDidChangeTextEvent.push(...changes)
        this.changesSinceLastStoppedChangingEvent.push(...changes)
      }

      if (this.markerLayers != null) {
        for (const change of changes) {
          for (const id in this.markerLayers) {
            const markerLayer = this.markerLayers[id]
            markerLayer.splice(
              change.newStart,
              traversal(change.oldEnd, change.oldStart),
              traversal(change.newEnd, change.newStart)
            )
          }
        }
      }

      const markersSnapshot = this.createMarkerSnapshot()
      this.historyProvider.groupChangesSinceCheckpoint(checkpoint, {
        markers: markersSnapshot,
        deleteCheckpoint: true
      })

      this.emitDidChangeEvent(new ChangeEvent(this, changes))
      this.emitDidChangeTextEvent()
      this.emitMarkerChangeEvents(markersSnapshot)
      this.emitModifiedStatusChanged(this.isModified())
    }

    this.loaded = true
    this.emitter.emit('did-reload')
    return this
  }

  destroy () {
    if (this.destroyed) return
    this.destroyed = true
    this.emitter.emit('did-destroy')
    this.emitter.clear()

    this.fileSubscriptions?.dispose()

    for (const id in this.markerLayers) {
      const markerLayer = this.markerLayers[id]
      markerLayer.destroy()
    }
    if (this.outstandingSaveCount === 0) {
      this.buffer.reset('')
    } else {
      var subscription = this.onDidSave(() => {
        if (this.outstandingSaveCount === 0) {
          this.buffer.reset('')
          subscription.dispose()
        }
      })
    }

    this.cachedText = null
    if (typeof this.historyProvider.clear === 'function') this.historyProvider.clear()
    if (typeof this.languageMode.destroy === 'function') this.languageMode.destroy()
  }

  isAlive () { return !this.destroyed }

  isDestroyed () { return this.destroyed }

  isRetained () { return this.refcount > 0 }

  retain () {
    this.refcount++
    return this
  }

  release () {
    this.refcount--
    if (this.refcount <= 0) this.destroy()
    return this
  }

  subscribeToFile () {
    if (this.fileSubscriptions) {
      // If we were to unsubscribe and immediately resubscribe, we might
      // trigger destruction and recreation of a native file watcher — which is
      // costly and unnecessary. We can avoid that cost by overlapping the
      // switch and only disposing of the old `CompositeDisposable` after the
      // new one has attached its subscriptions.
      this.oldFileSubscriptions = this.fileSubscriptions
    }
    this.fileSubscriptions = new CompositeDisposable()

    // Reset each time we resubscribe; the default-data-source branch below
    // replaces this with the new watcher's arm promise.
    this.fileWatchStartPromise = Promise.resolve()

    const onDidChange = debounce(async () => {
      // On Linux we get change events when the file is deleted. This yields
      // consistent behavior with Mac/Windows.
      if (!this.file || !this.file.existsSync()) return
      if (this.outstandingSaveCount > 0) return
      this.fileHasChangedSinceLastLoad = true

      if (this.isModified()) {
        const source = this.file.getPath()
        if (!(await this.buffer.baseTextMatchesFile(source, this.getEncoding()))) {
          // Emit `did-conflict` and take no other action. We will keep the
          // current buffer contents so that the user's changes are not lost.
          this.emitter.emit('did-conflict')
        } else {
          // Despite being modified, we're once again in alignment with what
          // is on disk. This file is not in conflict.
          this.fileHasChangedSinceLastLoad = false
        }
      } else {
        // This buffer was previously in sync with what was on disk, so we
        // can update its contents to match the new contents on disk. By
        // definition, this means there is no conflict, so we'll reset the
        // appropriate flag.
        this.fileHasChangedSinceLastLoad = false
        return this.load({internal: true})
      }
    }, this.fileChangeDelay)

    const onDidDelete = () => {
      // At this point, asking `isModified` of the native buffer will deliver
      // an accurate result that does not care about whether the file still
      // exists on disk.
      const modified = this.buffer.isModified()
      this.retainsUnmodifiedTraitAfterDeletion = !modified
      this.emitter.emit('did-delete')
      if (!modified && this.shouldDestroyOnFileDelete()) {
        return this.destroy()
      } else {
        return this.emitModifiedStatusChanged(this.isModified())
      }
      // We don't set `this.file` to `null` because we still have a
      // _theoretical_ file, even if it's no longer present on disk. In this
      // scenario, we can re-commit the file to disk at its previous path
      // with a simple "Save" command. If we nulled out `file`, the editor
      // would prompt the user again about a save destination.
    }

    const onDidRename = () => {
      this.emitter.emit('did-change-path', this.getPath())
    }

    if (this.file.onDidChange || this.file.onDidDelete || this.file.onDidRename) {
      // A custom data source (see `setFile`) supplies its own change
      // notifications; wire them straight through to the on-disk handlers.
      if (this.file.onDidChange) this.fileSubscriptions.add(this.file.onDidChange(onDidChange))
      if (this.file.onDidDelete) this.fileSubscriptions.add(this.file.onDidDelete(onDidDelete))
      if (this.file.onDidRename) this.fileSubscriptions.add(this.file.onDidRename(onDidRename))
      if (this.file.onWillThrowWatchError) {
        this.fileSubscriptions.add(this.file.onWillThrowWatchError(error => {
          this.emitter.emit('will-throw-watch-error', error)
        }))
      }
    } else if (typeof this.file.getPath === 'function') {
      // The default data source does no watching of its own, so lumine core
      // watches the path through `watchPath` (served by the file-watcher
      // worker) and drives the same handlers. A single-file watch is reliable
      // across atomic saves — see `nodejs-watcher.js`.
      const filePath = this.file.getPath()
      let disposed = false
      const watcherPromise = watchPath(filePath, {}, events => {
        for (const event of events) {
          if (event.action === 'deleted') {
            onDidDelete()
          } else if (event.action === 'renamed' && event.oldPath === filePath) {
            if (event.path) {
              // The file was moved to a known new path; follow it (as the
              // original `File` watcher did) by re-pointing the buffer at the
              // new path, which re-subscribes the watch and emits
              // `did-change-path`.
              this.setPath(event.path)
            } else {
              // Moved somewhere we can't identify; treat it as a deletion so the
              // buffer keeps its (now theoretical) file and can be re-saved.
              onDidDelete()
            }
          } else {
            onDidChange()
          }
        }
      })
      // Expose when the watcher is armed so callers (and tests) can wait for it
      // before relying on external-change detection.
      this.fileWatchStartPromise = watcherPromise.then(() => {}, () => {})

      // The worker arms the watcher asynchronously. Once it is live, reconcile
      // the one unambiguous change that could have landed during the arm gap: a
      // deletion. We deliberately do *not* reconcile content here — comparing
      // the base text to disk races buffer load/deserialization (which may not
      // have applied its unsaved state yet), and any real modification is caught
      // by the live watcher once armed.
      watcherPromise.then(() => {
        if (disposed || this.destroyed) return
        if (this.outstandingSaveCount > 0) return
        // Only report a vanished file if it was previously present, so a buffer
        // for a not-yet-created path doesn't spuriously report a deletion.
        if (this.file && !this.file.existsSync() && this.didHaveFileOnDisk) {
          onDidDelete()
        }
      }, () => {})
      this.fileSubscriptions.add(new Disposable(() => {
        disposed = true
        watcherPromise.then(watcher => watcher.dispose(), () => {})
      }))
    }

    if (this.oldFileSubscriptions) {
      this.oldFileSubscriptions.dispose()
      this.oldFileSubscriptions = null
    }
  }

  // Experimental: Return a {Promise} that resolves once this buffer's file
  // watcher has been armed and is delivering external-change events. Watching is
  // served asynchronously by the file-watcher worker; this lets callers wait for
  // it before relying on external-change detection. Resolves immediately when the
  // buffer has no path or a custom data source that watches synchronously.
  getFileWatchStartPromise () {
    return this.fileWatchStartPromise || Promise.resolve()
  }

  createMarkerSnapshot (selectionsMarkerLayer) {
    const snapshot = {}
    for (const markerLayerId in this.markerLayers) {
      const markerLayer = this.markerLayers[markerLayerId]
      if (!markerLayer.maintainHistory) continue
      if (
        selectionsMarkerLayer &&
        markerLayer.getRole() === 'selections' &&
        markerLayerId !== selectionsMarkerLayer.id
      ) continue
      snapshot[markerLayerId] = markerLayer.createSnapshot()
    }
    return snapshot
  }

  restoreFromMarkerSnapshot (snapshot, selectionsMarkerLayer) {
    let selectionsSnapshotId
    if (selectionsMarkerLayer != null) {
      // Do selective selections marker restoration only when snapshot includes single selections snapshot.
      const selectionsSnapshotIds = Object.keys(snapshot).filter(id => this.selectionsMarkerLayerIds.has(id))
      if (selectionsSnapshotIds.length === 1) {
        selectionsSnapshotId = selectionsSnapshotIds[0]
      }
    }

    for (const markerLayerId in snapshot) {
      const layerSnapshot = snapshot[markerLayerId]
      if (markerLayerId === selectionsSnapshotId) {
        this.markerLayers[selectionsMarkerLayer.id].restoreFromSnapshot(
          layerSnapshot,
          markerLayerId !== selectionsMarkerLayer.id
        )
      } else if (this.markerLayers[markerLayerId]) {
        this.markerLayers[markerLayerId].restoreFromSnapshot(layerSnapshot)
      }
    }
  }

  emitMarkerChangeEvents (snapshot) {
    if (this.transactCallDepth === 0) {
      while (this.markerLayersWithPendingUpdateEvents.size > 0) {
        const updatedMarkerLayers = Array.from(this.markerLayersWithPendingUpdateEvents)
        this.markerLayersWithPendingUpdateEvents.clear()
        for (const markerLayer of updatedMarkerLayers) {
          markerLayer.emitUpdateEvent()
          if (markerLayer === this.defaultMarkerLayer) {
            this.emitter.emit('did-update-markers')
          }
        }
      }
    }

    for (const markerLayerId in this.markerLayers) {
      const markerLayer = this.markerLayers[markerLayerId]
      markerLayer.emitChangeEvents(snapshot && snapshot[markerLayerId])
    }
  }

  emitWillChangeEvent () {
    if (!this._emittedWillChangeEvent) {
      this.emitter.emit('will-change')
      this._emittedWillChangeEvent = true
    }
  }

  emitDidChangeTextEvent () {
    this.cachedHasAstral = null
    if (this.transactCallDepth === 0) {
      if (this.changesSinceLastDidChangeTextEvent.length > 0) {
        const compactedChanges = patchFromChanges(this.changesSinceLastDidChangeTextEvent).getChanges()
        this.changesSinceLastDidChangeTextEvent.length = 0
        if (compactedChanges.length > 0) {
          const changeEvent = new ChangeEvent(this, compactedChanges)
          this.languageMode.bufferDidFinishTransaction(changeEvent)
          this.emitter.emit('did-change-text', changeEvent)
        }
        this.debouncedEmitDidStopChangingEvent()
        this._emittedWillChangeEvent = false
      }
      for (const id in this.displayLayers) {
        const displayLayer = this.displayLayers[id]
        displayLayer.emitDeferredChangeEvents()
      }
    }
  }

  // Identifies if the buffer belongs to multiple editors.
  //
  // For example, if the {EditorView} was split.
  //
  // Returns a {Boolean}.
  hasMultipleEditors () { return this.refcount > 1 }

  emitDidStopChangingEvent () {
    if (this.destroyed) return
    const modifiedStatus = this.isModified()
    const compactedChanges = Object.freeze(normalizePatchChanges(
      patchFromChanges(this.changesSinceLastStoppedChangingEvent).getChanges()
    ))
    this.changesSinceLastStoppedChangingEvent.length = 0
    this.emitter.emit('did-stop-changing', {changes: compactedChanges})
    this.emitModifiedStatusChanged(modifiedStatus)
  }

  emitModifiedStatusChanged (modifiedStatus) {
    if (modifiedStatus === this.previousModifiedStatus) return
    this.previousModifiedStatus = modifiedStatus
    return this.emitter.emit('did-change-modified', modifiedStatus)
  }

  logLines (start = 0, end = this.getLastRow()) {
    for (let row = start; row <= end; row++) {
      const line = this.lineForRow(row)
      console.log(row, line, line.length)
    }
  }

  /*
  Section: Private History Delegate Methods
  */

  invertChange (change) {
    return Object.freeze({
      oldRange: change.newRange,
      newRange: change.oldRange,
      oldText: change.newText,
      newText: change.oldText
    })
  }

  serializeChange (change) {
    return {
      oldRange: change.oldRange.serialize(),
      newRange: change.newRange.serialize(),
      oldText: change.oldText,
      newText: change.newText
    }
  }

  deserializeChange (change) {
    return {
      oldRange: Range.deserialize(change.oldRange),
      newRange: Range.deserialize(change.newRange),
      oldText: change.oldText,
      newText: change.newText
    }
  }

  serializeSnapshot (snapshot, options) {
    if (!options.markerLayers) return

    return MarkerLayer.serializeSnapshot(snapshot)
  }

  deserializeSnapshot (snapshot) {
    return MarkerLayer.deserializeSnapshot(snapshot)
  }

  /*
  Section: Private MarkerLayer Delegate Methods
  */

  markerLayerDestroyed (markerLayer) {
    return delete this.markerLayers[markerLayer.id]
  }

  markerCreated (layer, marker) {
    if (layer === this.defaultMarkerLayer) {
      return this.emitter.emit('did-create-marker', marker)
    }
  }

  markersUpdated (layer) {
    if (this.transactCallDepth === 0) {
      layer.emitUpdateEvent()
      if (layer === this.defaultMarkerLayer) {
        return this.emitter.emit('did-update-markers')
      }
    } else {
      return this.markerLayersWithPendingUpdateEvents.add(layer)
    }
  }

  getNextMarkerId () { return this.nextMarkerId++ }
}

Object.assign(TextBuffer, {
  version: 5,
  Point: Point,
  Range: Range,
  newlineRegex: newlineRegex,
  spliceArray: spliceArray
})

Object.assign(TextBuffer.prototype, {
  stoppedChangingDelay: 300,
  fileChangeDelay: 200,
  backwardsScanChunkSize: 8000,
  defaultMaxUndoEntries: 10000
})

class TransactionAbortedError extends Error {}

class ChangeEvent {
  constructor (buffer, changes) {
    this.changes = Object.freeze(normalizePatchChanges(changes))

    const start = changes[0].oldStart
    const {oldEnd, newEnd} = changes[changes.length - 1]
    this.oldRange = new Range(start, oldEnd).freeze()
    this.newRange = new Range(start, newEnd).freeze()

    let oldText = null
    let newText = null

    Object.defineProperty(this, 'oldText', {
      enumerable: false,
      get () {
        if (oldText == null) {
          const oldBuffer = new NativeTextBuffer(this.newText || "")
          for (let i = changes.length - 1; i >= 0; i--) {
            const change = changes[i]
            oldBuffer.setTextInRange(
              new Range(
                traversal(change.newStart, start),
                traversal(change.newEnd, start)
              ),
              change.oldText
            )
          }
          oldText = oldBuffer.getText()
        }
        return oldText
      }
    })

    Object.defineProperty(this, 'newText', {
      enumerable: false,
      get () {
        if (newText == null) {
          newText = buffer.getTextInRange(this.newRange)
        }
        return newText
      }
    })
  }

  isEqual (other) {
    return (
      (this.changes.length === other.changes.length) &&
      this.changes.every((change, i) => change.isEqual(other.changes[i])) &&
      this.oldRange.isEqual(other.oldRange) &&
      this.newRange.isEqual(other.newRange)
    )
  }
}

class SearchCallbackArgument {
  get row () {
    return this.range.start.row
  }

  get lineText () {
    return this.buffer.lineForRow(this.range.start.row)
  }

  get lineTextOffset () { return 0 }

  get matchText () {
    return this.buffer.getTextInRange(this.range)
  }

  get match () {
    this.regex.lastIndex = 0
    return this.regex.exec(this.matchText)
  }

  static addContextLines (argument, options) {
    argument.leadingContextLines = []
    let row = Math.max(0, argument.range.start.row - (options.leadingContextLineCount || 0))
    while (row < argument.range.start.row) {
      argument.leadingContextLines.push(argument.buffer.lineForRow(row))
      row += 1
    }

    argument.trailingContextLines = []
    for (let i = 0, end = options.trailingContextLineCount || 0; i < end; i++) {
      row = argument.range.start.row + i + 1
      if (row >= argument.buffer.getLineCount()) break
      argument.trailingContextLines.push(argument.buffer.lineForRow(row))
    }
  }

  constructor (buffer, range, regex, options) {
    this.replace = this.replace.bind(this)
    this.stop = this.stop.bind(this)
    this.buffer = buffer
    this.range = range
    this.regex = regex
    this.stopped = false
    this.replacementText = null
    SearchCallbackArgument.addContextLines(this, options)
  }

  replace (text) {
    this.replacementText = text
    return this.buffer.setTextInRange(this.range, text)
  }

  stop () {
    this.stopped = true
  }
}

let _winattr = null
const getPromisifiedWinattr = function () {
  if (_winattr === null) {
    const { promisify } = require('util')
    const winattr = require('winattr')
    _winattr = {
      set: promisify(winattr.set),
      get: promisify(winattr.get)
    }
  }

  return _winattr
}

module.exports = TextBuffer
