const {Emitter, CompositeDisposable} = require('atom')
const { UnicodeLetters } = require('./unicode-helpers')
const SuggestionListElement = require('./suggestion-list-element')

module.exports =
class SuggestionList {
  constructor () {
    this.wordPrefixRegex = null
    this.cancel = this.cancel.bind(this)
    this.confirm = this.confirm.bind(this)
    this.confirmSelection = this.confirmSelection.bind(this)
    this.confirmSelectionIfNonDefault = this.confirmSelectionIfNonDefault.bind(this)
    this.show = this.show.bind(this)
    this.showAtBeginningOfPrefix = this.showAtBeginningOfPrefix.bind(this)
    this.showAtCursorPosition = this.showAtCursorPosition.bind(this)
    this.hide = this.hide.bind(this)
    this.destroyOverlay = this.destroyOverlay.bind(this)
    this.activeEditor = null
  }

  initialize () {
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.commands.add('atom-text-editor.autocomplete-active', {
      'autocomplete-plus:confirm': this.confirmSelection,
      'autocomplete-plus:confirmIfNonDefault': this.confirmSelectionIfNonDefault,
      'autocomplete-plus:cancel': this.cancel
    }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', (enableExtendedUnicodeSupport) => {
      if (enableExtendedUnicodeSupport) {
        this.wordPrefixRegex = new RegExp(`^[${UnicodeLetters}\\d_-]`)
      } else {
        this.wordPrefixRegex = /^[\w-]/
      }
      return this.wordPrefixRegex
    }))
  }

  get suggestionListElement () {
    if (!this._suggestionListElement) {
      this._suggestionListElement = new SuggestionListElement(this)
    }

    return this._suggestionListElement
  }

  addBindings (editor) {
    if (this.bindings && this.bindings.dispose) {
      this.bindings.dispose()
    }
    this.bindings = new CompositeDisposable()

    const completionKey = atom.config.get('autocomplete-plus.confirmCompletion') || ''

    const keys = {}
    if (completionKey.indexOf('tab') > -1) { keys['tab'] = 'autocomplete-plus:confirm' }
    if (completionKey.indexOf('enter') > -1) {
      if (completionKey.indexOf('always') > -1) {
        keys['enter'] = 'autocomplete-plus:confirmIfNonDefault'
      } else {
        keys['enter'] = 'autocomplete-plus:confirm'
      }
    }

    this.bindings.add(atom.keymaps.add(
      'atom-text-editor.autocomplete-active',
      {'atom-text-editor.autocomplete-active': keys})
    )

    const useCoreMovementCommands = atom.config.get('autocomplete-plus.useCoreMovementCommands')
    const commandNamespace = useCoreMovementCommands ? 'core' : 'autocomplete-plus'

    const commands = {}
    commands[`${commandNamespace}:move-up`] = (event) => {
      if (this.isActive() && this.items && this.items.length > 1) {
        this.selectPrevious()
        return event.stopImmediatePropagation()
      }
    }
    commands[`${commandNamespace}:move-down`] = (event) => {
      if (this.isActive() && this.items && this.items.length > 1) {
        this.selectNext()
        return event.stopImmediatePropagation()
      }
    }
    commands[`${commandNamespace}:page-up`] = (event) => {
      if (this.isActive() && this.items && this.items.length > 1) {
        this.selectPageUp()
        return event.stopImmediatePropagation()
      }
    }
    commands[`${commandNamespace}:page-down`] = (event) => {
      if (this.isActive() && this.items && this.items.length > 1) {
        this.selectPageDown()
        return event.stopImmediatePropagation()
      }
    }
    commands[`${commandNamespace}:move-to-top`] = (event) => {
      if (this.isActive() && this.items && this.items.length > 1) {
        this.selectTop()
        return event.stopImmediatePropagation()
      }
    }
    commands[`${commandNamespace}:move-to-bottom`] = (event) => {
      if (this.isActive() && this.items && this.items.length > 1) {
        this.selectBottom()
        return event.stopImmediatePropagation()
      }
    }

    this.bindings.add(atom.commands.add(
      atom.views.getView(editor), commands)
    )

    return this.bindings.add(
      atom.config.onDidChange('autocomplete-plus.useCoreMovementCommands', () => {
        return this.addBindings(editor)
      }
      ))
  }

  /*
  Section: Event Triggers
  */

  cancel () {
    return this.emitter.emit('did-cancel')
  }

  confirm (match) {
    return this.emitter.emit('did-confirm', match)
  }

  confirmSelection () {
    return this.emitter.emit('did-confirm-selection')
  }

  confirmSelectionIfNonDefault (event) {
    return this.emitter.emit('did-confirm-selection-if-non-default', event)
  }

  select (suggestion) {
    return this.emitter.emit('did-select', suggestion)
  }

  selectNext () {
    return this.emitter.emit('did-select-next')
  }

  selectPrevious () {
    return this.emitter.emit('did-select-previous')
  }

  selectPageUp () {
    return this.emitter.emit('did-select-page-up')
  }

  selectPageDown () {
    return this.emitter.emit('did-select-page-down')
  }

  selectTop () {
    return this.emitter.emit('did-select-top')
  }

  selectBottom () {
    return this.emitter.emit('did-select-bottom')
  }

  /*
  Section: Events
  */

  onDidConfirmSelection (fn) {
    return this.emitter.on('did-confirm-selection', fn)
  }

  onDidconfirmSelectionIfNonDefault (fn) {
    return this.emitter.on('did-confirm-selection-if-non-default', fn)
  }

  onDidConfirm (fn) {
    return this.emitter.on('did-confirm', fn)
  }

  onDidSelect (fn) {
    return this.emitter.on('did-select', fn)
  }

  onDidSelectNext (fn) {
    return this.emitter.on('did-select-next', fn)
  }

  onDidSelectPrevious (fn) {
    return this.emitter.on('did-select-previous', fn)
  }

  onDidSelectPageUp (fn) {
    return this.emitter.on('did-select-page-up', fn)
  }

  onDidSelectPageDown (fn) {
    return this.emitter.on('did-select-page-down', fn)
  }

  onDidSelectTop (fn) {
    return this.emitter.on('did-select-top', fn)
  }

  onDidSelectBottom (fn) {
    return this.emitter.on('did-select-bottom', fn)
  }

  onDidCancel (fn) {
    return this.emitter.on('did-cancel', fn)
  }

  onDidDispose (fn) {
    return this.emitter.on('did-dispose', fn)
  }

  onDidChangeItems (fn) {
    return this.emitter.on('did-change-items', fn)
  }

  onDidChangeItem (fn) {
    return this.emitter.on('did-change-item', fn)
  }

  isActive () {
    return (this.activeEditor != null)
  }

  show (editor, options) {
    if (atom.config.get('autocomplete-plus.suggestionListFollows') === 'Cursor') {
      return this.showAtCursorPosition(editor, options)
    } else {
      let { prefix } = options
      let followRawPrefix = false
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i]
        if (item.replacementPrefix != null) {
          prefix = item.replacementPrefix.trim()
          followRawPrefix = true
          break
        }
      }
      return this.showAtBeginningOfPrefix(editor, prefix, followRawPrefix)
    }
  }

  showAtBeginningOfPrefix (editor, prefix, followRawPrefix = false) {
    let bufferPosition
    if (editor) {
      bufferPosition = editor.getCursorBufferPosition()
      if (followRawPrefix || this.wordPrefixRegex.test(prefix)) {
        bufferPosition = bufferPosition.translate([0, -prefix.length])
      }
    }

    if (this.activeEditor === editor) {
      if (!bufferPosition.isEqual(this.displayBufferPosition)) {
        this.displayBufferPosition = bufferPosition
        if (this.suggestionMarker) {
          this.suggestionMarker.setBufferRange([bufferPosition, bufferPosition])
        }
      }
    } else {
      this.destroyOverlay()
      if (editor) {
        this.activeEditor = editor
        this.displayBufferPosition = bufferPosition
        const marker = this.suggestionMarker = editor.markBufferRange([bufferPosition, bufferPosition])
        this.overlayDecoration = editor.decorateMarker(marker, {type: 'overlay', item: this.suggestionListElement, position: 'tail', class: 'autocomplete-plus'})
        const editorElement = atom.views.getView(this.activeEditor)
        if (editorElement && editorElement.classList) {
          editorElement.classList.add('autocomplete-active')
        }

        this.addBindings(editor)
      }
    }
  }

  showAtCursorPosition (editor) {
    if (this.activeEditor === editor || (editor == null)) { return }
    this.destroyOverlay()

    let marker
    if (editor.getLastCursor()) {
      marker = editor.getLastCursor().getMarker()
    }
    if (marker) {
      this.activeEditor = editor
      const editorElement = atom.views.getView(this.activeEditor)
      if (editorElement && editorElement.classList) {
        editorElement.classList.add('autocomplete-active')
      }

      this.overlayDecoration = editor.decorateMarker(marker, {type: 'overlay', item: this.suggestionListElement, class: 'autocomplete-plus'})
      return this.addBindings(editor)
    }
  }

  hide () {
    this.destroyOverlay()
    if (this.activeEditor === null) {
      return
    }

    if (this.bindings && this.bindings.dispose) {
      this.bindings.dispose()
    }

    this.activeEditor = null
    return this.activeEditor
  }

  destroyOverlay () {
    if (this.suggestionMarker && this.suggestionMarker.destroy) {
      this.suggestionMarker.destroy()
    } else if (this.overlayDecoration && this.overlayDecoration.destroy) {
      this.overlayDecoration.destroy()
    }
    const editorElement = atom.views.getView(this.activeEditor)
    if (editorElement && editorElement.classList) {
      atom.views.updateDocument(() => {
        editorElement.classList.remove('autocomplete-active')
      })
    }
    this.suggestionMarker = undefined
    this.overlayDecoration = undefined
    return this.overlayDecoration
  }

  changeItems (items) {
    this.items = items
    return this.emitter.emit('did-change-items', this.items)
  }

  replaceItem (oldSuggestion, newSuggestion) {
    if (newSuggestion == null) {
      return
    }

    if (this.items == null) {
      return
    }

    let itemChanged = false
    let itemIndex

    this.items.forEach((suggestion, idx) => {
      if (suggestion === oldSuggestion) {
        this.items[idx] = newSuggestion
        itemChanged = true
        itemIndex = idx
      }
    })

    if (itemChanged) {
      this.emitter.emit('did-change-item', {
        suggestion: newSuggestion,
        index: itemIndex
      })
    }
  }

  // Public: Clean up, stop listening to events
  dispose () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }

    if (this.bindings && this.bindings.dispose) {
      this.bindings.dispose()
    }
    this.emitter.emit('did-dispose')
    return this.emitter.dispose()
  }
}
