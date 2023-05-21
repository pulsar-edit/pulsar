const {CompositeDisposable, Emitter} = require('atom')

module.exports =
class Bookmarks {
  static deserialize(editor, state) {
    return new Bookmarks(editor, editor.getMarkerLayer(state.markerLayerId))
  }

  constructor(editor, markerLayer) {
    this.emitter = new Emitter()
    this.editor = editor
    this.markerLayer = markerLayer || this.editor.addMarkerLayer({persistent: true})
    this.decorationLayer = this.editor.decorateMarkerLayer(this.markerLayer, {type: 'line-number', class: 'bookmarked'})
    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.commands.add(atom.views.getView(this.editor), {
      'bookmarks:toggle-bookmark': this.toggleBookmark.bind(this),
      'bookmarks:jump-to-next-bookmark': this.jumpToNextBookmark.bind(this),
      'bookmarks:jump-to-previous-bookmark': this.jumpToPreviousBookmark.bind(this),
      'bookmarks:select-to-next-bookmark': this.selectToNextBookmark.bind(this),
      'bookmarks:select-to-previous-bookmark': this.selectToPreviousBookmark.bind(this),
      'bookmarks:clear-bookmarks': this.clearBookmarks.bind(this)
    }))
    this.decorationLayerLine = this.editor.decorateMarkerLayer(this.markerLayer, {type: 'line', class: 'bookmarked'})
    this.decorationLayerHighlight = this.editor.decorateMarkerLayer(this.markerLayer, {type: 'highlight', class: 'bookmarked'})
    this.disposables.add(this.editor.onDidDestroy(this.destroy.bind(this)))
  }

  destroy() {
    this.deactivate()
    this.markerLayer.destroy()
  }

  deactivate() {
    this.decorationLayer.destroy()
    this.decorationLayerLine.destroy()
    this.decorationLayerHighlight.destroy()
    this.disposables.dispose()
  }

  serialize() {
    return {markerLayerId: this.markerLayer.id}
  }

  toggleBookmark() {
    for (const range of this.editor.getSelectedBufferRanges()) {
      const bookmarks = this.markerLayer.findMarkers({intersectsRowRange: [range.start.row, range.end.row]})
      if (bookmarks && bookmarks.length > 0) {
        for (const bookmark of bookmarks) {
          bookmark.destroy()
        }
      } else {
        const bookmark = this.markerLayer.markBufferRange(range, {invalidate: 'surround', exclusive: true})
        this.disposables.add(bookmark.onDidChange(({isValid}) => {
          if (!isValid) {
            bookmark.destroy()
            // TODO: If N bookmarks are affected by a buffer change,
            // `did-change-bookmarks` will be emitted N times. We could
            // debounce this if we were willing to go async.
            this.emitter.emit('did-change-bookmarks', this.getAllBookmarks())
          }
        }))
      }
      this.emitter.emit('did-change-bookmarks', this.getAllBookmarks())
    }
  }

  getAllBookmarks() {
    let markers = this.markerLayer.getMarkers()
    return markers
  }

  onDidChangeBookmarks(callback) {
    return this.emitter.on('did-change-bookmarks', callback)
  }

  clearBookmarks() {
    for (const bookmark of this.markerLayer.getMarkers()) {
      bookmark.destroy()
    }
    this.emitter.emit('did-change-bookmarks', [])
  }

  jumpToNextBookmark() {
    if (this.markerLayer.getMarkerCount() > 0) {
      const bufferRow = this.editor.getLastCursor().getMarker().getStartBufferPosition().row
      const markers = this.markerLayer.getMarkers().sort((a, b) => a.compare(b))
      const bookmarkMarker = markers.find((marker) => marker.getBufferRange().start.row > bufferRow) || markers[0]
      this.editor.setSelectedBufferRange(bookmarkMarker.getBufferRange(), {autoscroll: false})
      this.editor.scrollToCursorPosition()
    } else {
      atom.beep()
    }
  }

  jumpToPreviousBookmark() {
    if (this.markerLayer.getMarkerCount() > 0) {
      const bufferRow = this.editor.getLastCursor().getMarker().getStartBufferPosition().row
      const markers = this.markerLayer.getMarkers().sort((a, b) => b.compare(a))
      const bookmarkMarker = markers.find((marker) => marker.getBufferRange().start.row < bufferRow) || markers[0]
      this.editor.setSelectedBufferRange(bookmarkMarker.getBufferRange(), {autoscroll: false})
      this.editor.scrollToCursorPosition()
    } else {
      atom.beep()
    }
  }

  selectToNextBookmark() {
    if (this.markerLayer.getMarkerCount() > 0) {
      const bufferRow = this.editor.getLastCursor().getMarker().getStartBufferPosition().row
      const markers = this.markerLayer.getMarkers().sort((a, b) => a.compare(b))
      const bookmarkMarker = markers.find((marker) => marker.getBufferRange().start.row > bufferRow) || markers[0]
      if (!bookmarkMarker) {
        atom.beep()
      } else {
        this.editor.setSelectedBufferRange([bookmarkMarker.getHeadBufferPosition(), this.editor.getCursorBufferPosition()], {autoscroll: false})
      }
    } else {
      atom.beep()
    }
  }

  selectToPreviousBookmark() {
    if (this.markerLayer.getMarkerCount() > 0) {
      const bufferRow = this.editor.getLastCursor().getMarker().getStartBufferPosition().row
      const markers = this.markerLayer.getMarkers().sort((a, b) => b.compare(a))
      const bookmarkMarker = markers.find((marker) => marker.getBufferRange().start.row < bufferRow) || markers[0]
      if (!bookmarkMarker) {
        atom.beep()
      } else {
        this.editor.setSelectedBufferRange([this.editor.getCursorBufferPosition(), bookmarkMarker.getHeadBufferPosition()], {autoscroll: false})
      }
    } else {
      atom.beep()
    }
  }
}
