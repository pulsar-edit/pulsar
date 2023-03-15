const {CompositeDisposable, Disposable, Point, Range} = require('atom')
const path = require('path')
const fuzzaldrin = require('fuzzaldrin')
const fuzzaldrinPlus = require('fuzzaldrin-plus')

const ProviderManager = require('./provider-manager')
const SuggestionList = require('./suggestion-list')
const {UnicodeLetters} = require('./unicode-helpers')
const getAdditionalWordCharacters = require('./get-additional-word-characters')

const MAX_LEGACY_PREFIX_LENGTH = 80
const wordCharacterRegexCache = new Map()

// Deferred requires
let minimatch = null
let grim = null

module.exports =
class AutocompleteManager {
  constructor () {
    this.autosaveEnabled = false
    this.backspaceTriggersAutocomplete = true
    this.autoConfirmSingleSuggestionEnabled = true
    this.bracketMatcherPairs = ['()', '[]', '{}', '""', "''", '``', '“”', '‘’', '«»', '‹›']
    this.buffer = null
    this.compositionInProgress = false
    this.disposed = false
    this.editor = null
    this.editorLabels = null
    this.editorSubscriptions = null
    this.editorView = null
    this.providerManager = null
    this.ready = false
    this.subscriptions = null
    this.suggestionList = null
    this.suppressForClasses = []
    this.shouldDisplaySuggestions = false
    this.prefixRegex = null
    this.wordPrefixRegex = null
    this.updateCurrentEditor = this.updateCurrentEditor.bind(this)
    this.handleCommands = this.handleCommands.bind(this)
    this.findSuggestions = this.findSuggestions.bind(this)
    this.getSuggestionsFromProviders = this.getSuggestionsFromProviders.bind(this)
    this.displaySuggestions = this.displaySuggestions.bind(this)
    this.hideSuggestionList = this.hideSuggestionList.bind(this)

    this.showOrHideSuggestionListForBufferChanges = this.showOrHideSuggestionListForBufferChanges.bind(this)
    this.providerManager = new ProviderManager()
    this.suggestionList = new SuggestionList()
    this.watchedEditors = new WeakSet()
  }

  initialize () {
    this.subscriptions = new CompositeDisposable()

    this.providerManager.initialize()
    this.suggestionList.initialize()

    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', enableExtendedUnicodeSupport => {
      if (enableExtendedUnicodeSupport) {
        this.prefixRegex = new RegExp(`(['"~\`!@#\\$%^&*\\(\\)\\{\\}\\[\\]=+,/\\?>])?(([${UnicodeLetters}\\d_]+[${UnicodeLetters}\\d_-]*)|([.:;[{(< ]+))$`)
        this.wordPrefixRegex = new RegExp(`^[${UnicodeLetters}\\d_]+[${UnicodeLetters}\\d_-]*$`)
      } else {
        this.prefixRegex = /(\b|['"~`!@#$%^&*(){}[\]=+,/?>])((\w+[\w-]*)|([.:;[{(< ]+))$/
        this.wordPrefixRegex = /^\w+[\w-]*$/
      }
    }
    ))
    this.subscriptions.add(this.providerManager)
    this.handleEvents()
    this.handleCommands()
    this.subscriptions.add(this.suggestionList) // We're adding this last so it is disposed after events
    this.ready = true
  }

  setSnippetsManager (snippetsManager) {
    this.snippetsManager = snippetsManager
  }

  updateCurrentEditor (currentEditor, labels) {
    if (currentEditor === this.editor) { return }
    if (this.editorSubscriptions) {
      this.editorSubscriptions.dispose()
    }
    this.editorSubscriptions = null

    // Stop tracking editor + buffer
    this.editor = null
    this.editorView = null
    this.buffer = null
    this.isCurrentFileBlackListedCache = null

    if (!this.editorIsValid(currentEditor)) { return }

    // Track the new editor, editorView, and buffer and set
    // the labels for its providers.
    this.editor = currentEditor
    this.editorLabels = labels
    this.editorView = atom.views.getView(this.editor)
    this.buffer = this.editor.getBuffer()

    this.editorSubscriptions = new CompositeDisposable()

    // Subscribe to buffer events:
    this.editorSubscriptions.add(this.buffer.onDidSave((e) => { this.bufferSaved(e) }))
    this.editorSubscriptions.add(this.buffer.onDidChangeText(this.showOrHideSuggestionListForBufferChanges))

    // Watch IME Events To Allow IME To Function Without The Suggestion List Showing
    const compositionStart = () => {
      this.compositionInProgress = true
    }
    const compositionEnd = () => {
      this.compositionInProgress = false
    }

    this.editorView.addEventListener('compositionstart', compositionStart)
    this.editorView.addEventListener('compositionend', compositionEnd)
    this.editorSubscriptions.add(new Disposable(() => {
      if (this.editorView) {
        this.editorView.removeEventListener('compositionstart', compositionStart)
        this.editorView.removeEventListener('compositionend', compositionEnd)
      }
    }))

    // Subscribe to editor events:
    // Close the overlay when the cursor moved without changing any text
    this.editorSubscriptions.add(this.editor.onDidChangeCursorPosition((e) => { this.cursorMoved(e) }))
    return this.editorSubscriptions.add(this.editor.onDidChangePath(() => {
      this.isCurrentFileBlackListedCache = null
    }))
  }

  editorIsValid (editor) {
    // TODO: remove conditional when `isTextEditor` is shipped.
    if (typeof atom.workspace.isTextEditor === 'function') {
      return atom.workspace.isTextEditor(editor)
    } else {
      if (!editor) { return false }
      // Should we disqualify TextEditors with the Grammar text.plain.null-grammar?
      return (editor.getText != null)
    }
  }

  // Makes the autocomplete manager watch the `editor`.
  // When the watched `editor` is focused, it will provide autocompletions from
  // providers with the given `labels`.
  //
  // Returns a {Disposable} to stop watching the `editor`.
  watchEditor (editor, labels) {
    if (this.watchedEditors.has(editor)) return

    let view = atom.views.getView(editor)

    if (view.hasFocus()) {
      this.updateCurrentEditor(editor, labels)
    }

    let focusListener = (element) => this.updateCurrentEditor(editor, labels)
    view.addEventListener('focus', focusListener)
    let blurListener = (element) => this.hideSuggestionList()
    view.addEventListener('blur', blurListener)

    let disposable = new Disposable(() => {
      view.removeEventListener('focus', focusListener)
      view.removeEventListener('blur', blurListener)
      if (this.editor === editor) {
        this.updateCurrentEditor(null)
      }
    })
    this.watchedEditors.add(editor)
    this.subscriptions.add(disposable)
    return new Disposable(() => {
      disposable.dispose()
      if (this.subscriptions != null) {
        this.subscriptions.remove(disposable)
      }
      this.watchedEditors.delete(editor)
    })
  }

  handleEvents () {
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      const disposable = this.watchEditor(editor, ['workspace-center'])
      editor.onDidDestroy(() => disposable.dispose())
    }))

    // Watch config values
    this.subscriptions.add(atom.config.observe('autosave.enabled', (value) => { this.autosaveEnabled = value }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.backspaceTriggersAutocomplete', (value) => { this.backspaceTriggersAutocomplete = value }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableAutoActivation', (value) => { this.autoActivationEnabled = value }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableAutoConfirmSingleSuggestion', (value) => { this.autoConfirmSingleSuggestionEnabled = value }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.consumeSuffix', (value) => { this.consumeSuffix = value }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.useAlternateScoring', (value) => { this.useAlternateScoring = value }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.fileBlacklist', (value) => {
      if (value) {
        this.fileBlacklist = value.map((s) => { return s.trim() })
      }
      this.isCurrentFileBlackListedCache = null
    }))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.suppressActivationForEditorClasses', value => {
      this.suppressForClasses = []
      for (let i = 0; i < value.length; i++) {
        const selector = value[i]
        const classes = (selector.trim().split('.').filter((className) => className.trim()).map((className) => className.trim()))
        if (classes.length) { this.suppressForClasses.push(classes) }
      }
    }))

    // Handle events from suggestion list
    this.subscriptions.add(this.suggestionList.onDidConfirm((e) => { this.confirm(e) }))
    this.subscriptions.add(this.suggestionList.onDidCancel(this.hideSuggestionList))
    this.subscriptions.add(this.suggestionList.onDidSelect(suggestion => { this.getDetailsOnSelect(suggestion) }))
  }

  handleCommands () {
    return this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'autocomplete-plus:activate': (event) => {
        this.shouldDisplaySuggestions = true
        let activatedManually = true
        if (event.detail && event.detail.activatedManually !== null && typeof event.detail.activatedManually !== 'undefined') {
          activatedManually = event.detail.activatedManually
        }
        this.findSuggestions(activatedManually)
      },
      'autocomplete-plus:navigate-to-description-more-link': () => {
        let suggestionListView = atom.views.getView(this.editor)
        let descriptionContainer = suggestionListView.querySelector('.suggestion-description')
        if (descriptionContainer !== null && descriptionContainer.style.display === 'block') {
          let descriptionMoreLink = descriptionContainer.querySelector('.suggestion-description-more-link')
          require('electron').shell.openExternal(descriptionMoreLink.href)
        }
      }
    }))
  }

  // Private: Finds suggestions for the current prefix, sets the list items,
  // positions the overlay and shows it
  findSuggestions (activatedManually) {
    if (this.disposed) { return }
    if ((this.providerManager == null) || (this.editor == null) || (this.buffer == null)) { return }
    if (this.isCurrentFileBlackListed()) { return }
    const cursor = this.editor.getLastCursor()
    if (cursor == null) { return }

    const bufferPosition = cursor.getBufferPosition()
    const scopeDescriptor = cursor.getScopeDescriptor()
    const prefix = this.getPrefix(this.editor, bufferPosition, scopeDescriptor) // Passed to providers with API version >= 4.0.0
    const legacyPrefix = this.getLegacyPrefix(this.editor, bufferPosition) // Passed to providers with API version < 4.0.0

    return this.getSuggestionsFromProviders({editor: this.editor, bufferPosition, scopeDescriptor, prefix, legacyPrefix, activatedManually})
  }

  getSuggestionsFromProviders (options) {
    let suggestionsPromise
    const providers = this.providerManager.applicableProviders(this.editorLabels, options.scopeDescriptor)

    const providerPromises = []
    providers.forEach(provider => {
      const apiVersion = this.providerManager.apiVersionForProvider(provider)

      let getSuggestions
      let upgradedOptions

      if (apiVersion === 1) {
        getSuggestions = provider.requestHandler.bind(provider)
        upgradedOptions = {
          editor: options.editor,
          prefix: options.prefix,
          bufferPosition: options.bufferPosition,
          position: options.bufferPosition,
          scope: options.scopeDescriptor,
          scopeChain: options.scopeDescriptor.getScopeChain(),
          buffer: options.editor.getBuffer(),
          cursor: options.editor.getLastCursor()
        }
      } else {
        getSuggestions = provider.getSuggestions.bind(provider)
        if (apiVersion < 4) {
          upgradedOptions = Object.assign({}, options)
          upgradedOptions.prefix = options.legacyPrefix
        } else {
          upgradedOptions = Object.assign({}, options)
          delete upgradedOptions.legacyPrefix
        }
      }

      return providerPromises.push(Promise.resolve(getSuggestions(upgradedOptions)).then(providerSuggestions => {
        if (providerSuggestions == null) { return }

        // TODO API: remove upgrading when 1.0 support is removed
        let hasDeprecations = false
        if (apiVersion > 1 && providerSuggestions.length) {
          hasDeprecations = this.deprecateForSuggestion(provider, providerSuggestions[0])
        }

        if (hasDeprecations || apiVersion === 1) {
          providerSuggestions = providerSuggestions.map((suggestion) => {
            const newSuggestion = {
              text: suggestion.text != null ? suggestion.text : suggestion.word,
              snippet: suggestion.snippet,
              replacementPrefix: suggestion.replacementPrefix != null ? suggestion.replacementPrefix : suggestion.prefix,
              className: suggestion.className,
              type: suggestion.type
            }
            if ((newSuggestion.rightLabelHTML == null) && suggestion.renderLabelAsHtml) { newSuggestion.rightLabelHTML = suggestion.label }
            if ((newSuggestion.rightLabel == null) && !suggestion.renderLabelAsHtml) { newSuggestion.rightLabel = suggestion.label }
            return newSuggestion
          })
        }

        let hasEmpty = false // Optimization: only create another array when there are empty items
        for (let i = 0; i < providerSuggestions.length; i++) {
          const suggestion = providerSuggestions[i]
          if (!suggestion.snippet && !suggestion.text) { hasEmpty = true }
          // Suggestions are mutable and are updated with a new replacement prefix. In order to
          // distinguish between suggestion that had original prefix and assigned one, we use
          // `isPrefixModified` flag. If it is `true`, we reset replacement prefix.
          if (suggestion.replacementPrefix == null || !!suggestion.isPrefixModified) {
            if (apiVersion < 4) {
              suggestion.replacementPrefix = this.wordPrefixRegex.test(options.prefix) ? options.prefix : ''
            } else {
              suggestion.replacementPrefix = options.prefix
            }
            suggestion.isPrefixModified = true
          }
          suggestion.provider = provider
        }

        if (hasEmpty) {
          const res = []
          for (const s of providerSuggestions) {
            if (s.snippet || s.text) {
              res.push(s)
            }
          }
          providerSuggestions = res
        }

        if (provider.filterSuggestions) {
          providerSuggestions = this.filterSuggestions(providerSuggestions, options)
        }
        return providerSuggestions
      }))
    })

    if (!providerPromises || !providerPromises.length) {
      return
    }

    suggestionsPromise = Promise.all(providerPromises)
    this.currentSuggestionsPromise = suggestionsPromise
    return this.currentSuggestionsPromise
      .then(this.mergeSuggestionsFromProviders)
      .then(suggestions => {
        if (this.currentSuggestionsPromise !== suggestionsPromise) { return }
        if (options.activatedManually && this.shouldDisplaySuggestions && this.autoConfirmSingleSuggestionEnabled && suggestions.length === 1) {
          // When there is one suggestion in manual mode, just confirm it
          return this.confirm(suggestions[0])
        } else {
          return this.displaySuggestions(suggestions, options)
        }
      }
    )
  }

  filterSuggestions (suggestions, {prefix}) {
    const results = []
    const fuzzaldrinProvider = this.useAlternateScoring ? fuzzaldrinPlus : fuzzaldrin
    for (let i = 0; i < suggestions.length; i++) {
      // sortScore mostly preserves in the original sorting. The function is
      // chosen such that suggestions with a very high match score can break out.
      let score
      const suggestion = suggestions[i]
      suggestion.sortScore = Math.max((-i / 10) + 3, 0) + 1
      suggestion.score = null

      const text = (suggestion.snippet || suggestion.text)
      const suggestionPrefix = suggestion.replacementPrefix != null ? suggestion.replacementPrefix : prefix
      const prefixIsEmpty = !suggestionPrefix || suggestionPrefix === ' '
      const firstCharIsMatch = !prefixIsEmpty && suggestionPrefix[0].toLowerCase() === text[0].toLowerCase()

      if (prefixIsEmpty) {
        results.push(suggestion)
      }
      if (firstCharIsMatch && (score = fuzzaldrinProvider.score(text, suggestionPrefix)) > 0) {
        suggestion.score = score * suggestion.sortScore
        results.push(suggestion)
      }
    }

    results.sort(this.reverseSortOnScoreComparator)
    return results
  }

  reverseSortOnScoreComparator (a, b) {
    let bscore = b.score
    if (!bscore) {
      bscore = b.sortScore
    }
    let ascore = a.score
    if (!ascore) {
      ascore = b.sortScore
    }
    return bscore - ascore
  }

  // providerSuggestions - array of arrays of suggestions provided by all called providers
  mergeSuggestionsFromProviders (providerSuggestions) {
    return providerSuggestions.reduce((suggestions, providerSuggestions) => {
      if (providerSuggestions && providerSuggestions.length) {
        suggestions = suggestions.concat(providerSuggestions)
      }

      return suggestions
    }, [])
  }

  deprecateForSuggestion (provider, suggestion) {
    let hasDeprecations = false
    if (suggestion.word != null) {
      hasDeprecations = true
      if (typeof grim === 'undefined' || grim === null) { grim = require('grim') }
      grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
returns suggestions with a \`word\` attribute.
The \`word\` attribute is now \`text\`.
See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
      )
    }
    if (suggestion.prefix != null) {
      hasDeprecations = true
      if (typeof grim === 'undefined' || grim === null) { grim = require('grim') }
      grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
returns suggestions with a \`prefix\` attribute.
The \`prefix\` attribute is now \`replacementPrefix\` and is optional.
See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
      )
    }
    if (suggestion.label != null) {
      hasDeprecations = true
      if (typeof grim === 'undefined' || grim === null) { grim = require('grim') }
      grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
returns suggestions with a \`label\` attribute.
The \`label\` attribute is now \`rightLabel\` or \`rightLabelHTML\`.
See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
      )
    }
    if (suggestion.onWillConfirm != null) {
      hasDeprecations = true
      if (typeof grim === 'undefined' || grim === null) { grim = require('grim') }
      grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
returns suggestions with a \`onWillConfirm\` callback.
The \`onWillConfirm\` callback is no longer supported.
See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
      )
    }
    if (suggestion.onDidConfirm != null) {
      hasDeprecations = true
      if (typeof grim === 'undefined' || grim === null) { grim = require('grim') }
      grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
returns suggestions with a \`onDidConfirm\` callback.
The \`onDidConfirm\` callback is now a \`onDidInsertSuggestion\` callback on the provider itself.
See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
      )
    }
    return hasDeprecations
  }

  displaySuggestions (suggestions, options) {
    switch (atom.config.get('autocomplete-plus.similarSuggestionRemoval')) {
      case 'textOrSnippet': {
        suggestions = this.getUniqueSuggestions(suggestions, (suggestion) => suggestion.text + suggestion.snippet)
        break
      }
    }

    if (this.shouldDisplaySuggestions && suggestions.length) {
      return this.showSuggestionList(suggestions, options)
    } else {
      return this.hideSuggestionList()
    }
  }

  getUniqueSuggestions (suggestions, uniqueKeyFunction) {
    const seen = {}
    const result = []
    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i]
      const val = uniqueKeyFunction(suggestion)
      if (!seen[val]) {
        result.push(suggestion)
        seen[val] = true
      }
    }
    return result
  }

  getPrefix (editor, position, scopeDescriptor) {
    const wordCharacterRegex = this.getWordCharacterRegex(scopeDescriptor)
    const line = editor.getBuffer().getTextInRange([[position.row, 0], position])

    let startColumn = position.column
    while (startColumn > 0) {
      let prevChar = line[startColumn - 1]
      if (wordCharacterRegex.test(prevChar)) {
        startColumn--
      } else {
        break
      }
    }
    return line.slice(startColumn)
  }

  getWordCharacterRegex (scopeDescriptor) {
    const additionalWordChars = getAdditionalWordCharacters(scopeDescriptor)
    let regex = wordCharacterRegexCache.get(additionalWordChars)

    if (!regex) {
      regex = new RegExp(`[${UnicodeLetters}${additionalWordChars.replace(']', '\\]')}\\d]`)
      wordCharacterRegexCache.set(additionalWordChars, regex)
    }
    return regex
  }

  getLegacyPrefix (editor, bufferPosition) {
    const {row, column} = bufferPosition
    const line = editor.getTextInRange(new Range(
      new Point(row, Math.max(0, column - MAX_LEGACY_PREFIX_LENGTH)),
      bufferPosition
    ))
    const prefix = this.prefixRegex.exec(line)
    if (!prefix || !prefix[2] || prefix[2].length === MAX_LEGACY_PREFIX_LENGTH) return ''
    return prefix[2]
  }

  // Private: Gets called when the user successfully confirms a suggestion
  //
  // match - An {Object} representing the confirmed suggestion
  confirm (suggestion) {
    if ((this.editor == null) || (suggestion == null) || !!this.disposed) { return }

    const apiVersion = this.providerManager.apiVersionForProvider(suggestion.provider)
    const triggerPosition = this.editor.getLastCursor().getBufferPosition()

    // TODO API: Remove as this is no longer used
    if (suggestion.onWillConfirm) {
      suggestion.onWillConfirm()
    }

    const selections = this.editor.getSelections()
    if (selections && selections.length) {
      for (const s of selections) {
        if (s && s.clear) {
          s.clear()
        }
      }
    }

    this.hideSuggestionList()

    this.replaceTextWithMatch(suggestion)

    if (apiVersion > 1) {
      if (suggestion.provider && suggestion.provider.onDidInsertSuggestion) {
        suggestion.provider.onDidInsertSuggestion({editor: this.editor, suggestion, triggerPosition})
      }
    } else {
      if (suggestion.onDidConfirm) {
        suggestion.onDidConfirm()
      }
    }
  }

  getDetailsOnSelect (suggestion) {
    if (suggestion != null && suggestion.provider && suggestion.provider.getSuggestionDetailsOnSelect) {
      Promise.resolve(suggestion.provider.getSuggestionDetailsOnSelect(suggestion))
        .then(detailedSuggestion => {
          this.suggestionList.replaceItem(suggestion, detailedSuggestion)
        })
    }
  }

  showSuggestionList (suggestions, options) {
    if (this.disposed) { return }
    this.suggestionList.changeItems(suggestions)
    return this.suggestionList.show(this.editor, options)
  }

  hideSuggestionList () {
    if (this.disposed) { return }
    this.suggestionList.changeItems(null)
    this.suggestionList.hide()
    this.shouldDisplaySuggestions = false
  }

  requestHideSuggestionList (command) {
    if (this.hideTimeout == null) {
      this.hideTimeout = setTimeout(() => {
        this.hideSuggestionList()
        this.hideTimeout = null
      }, 0)
    }
    this.shouldDisplaySuggestions = false
  }

  cancelHideSuggestionListRequest () {
    clearTimeout(this.hideTimeout)
    this.hideTimeout = null
  }

  // Private: Replaces the current prefix with the given match.
  //
  // match - The match to replace the current prefix with
  replaceTextWithMatch (suggestion) {
    if (this.editor == null) { return }

    const cursors = this.editor.getCursors()
    if (cursors == null) { return }

    return this.editor.transact(() => {
      for (let i = 0; i < cursors.length; i++) {
        const cursor = cursors[i]
        const endPosition = cursor.getBufferPosition()
        const beginningPosition = [endPosition.row, endPosition.column - suggestion.replacementPrefix.length]

        if (this.editor.getTextInBufferRange([beginningPosition, endPosition]) === suggestion.replacementPrefix) {
          const suffix = this.consumeSuffix ? this.getSuffix(this.editor, endPosition, suggestion) : ''
          if (suffix.length) { cursor.moveRight(suffix.length) }
          cursor.selection.selectLeft(suggestion.replacementPrefix.length + suffix.length)

          if ((suggestion.snippet != null) && (this.snippetsManager != null)) {
            this.snippetsManager.insertSnippet(suggestion.snippet, this.editor, cursor)
          } else {
            cursor.selection.insertText(suggestion.text != null ? suggestion.text : suggestion.snippet, {
              autoIndentNewline: this.editor.shouldAutoIndent(),
              autoDecreaseIndent: this.editor.shouldAutoIndent()
            })
          }
        }
      }
    }
    )
  }

  getSuffix (editor, bufferPosition, suggestion) {
    // This just chews through the suggestion and tries to match the suggestion
    // substring with the lineText starting at the cursor. There is probably a
    // more efficient way to do this.
    let suffix = (suggestion.snippet != null ? suggestion.snippet : suggestion.text)
    const endPosition = [bufferPosition.row, bufferPosition.column + suffix.length]
    const endOfLineText = editor.getTextInBufferRange([bufferPosition, endPosition])
    const nonWordCharacters = new Set(atom.config.get('editor.nonWordCharacters').split(''))
    while (suffix) {
      if (endOfLineText.startsWith(suffix) && !nonWordCharacters.has(suffix[0])) { break }
      suffix = suffix.slice(1)
    }
    return suffix
  }

  // Private: Checks whether the current file is blacklisted.
  //
  // Returns {Boolean} that defines whether the current file is blacklisted
  isCurrentFileBlackListed () {
    // minimatch is slow. Not necessary to do this computation on every request for suggestions
    let left
    if (this.isCurrentFileBlackListedCache != null) { return this.isCurrentFileBlackListedCache }

    if ((this.fileBlacklist == null) || this.fileBlacklist.length === 0) {
      this.isCurrentFileBlackListedCache = false
      return this.isCurrentFileBlackListedCache
    }

    if (typeof minimatch === 'undefined' || minimatch === null) { minimatch = require('minimatch') }
    const fileName = path.basename((left = this.buffer.getPath()) != null ? left : '')
    for (let i = 0; i < this.fileBlacklist.length; i++) {
      const blacklistGlob = this.fileBlacklist[i]
      if (minimatch(fileName, blacklistGlob)) {
        this.isCurrentFileBlackListedCache = true
        return this.isCurrentFileBlackListedCache
      }
    }

    this.isCurrentFileBlackListedCache = false
    return this.isCurrentFileBlackListedCache
  }

  // Private: Gets called when the content has been modified
  requestNewSuggestions () {
    let delay = atom.config.get('autocomplete-plus.autoActivationDelay')

    if (this.delayTimeout != null) {
      clearTimeout(this.delayTimeout)
    }

    if (delay) {
      this.delayTimeout = setTimeout(this.findSuggestions, delay)
    } else {
      this.findSuggestions()
    }

    this.shouldDisplaySuggestions = true
  }

  cancelNewSuggestionsRequest () {
    if (this.delayTimeout != null) {
      clearTimeout(this.delayTimeout)
    }
    this.shouldDisplaySuggestions = false
  }

  // Private: Gets called when the cursor has moved. Cancels the autocompletion if
  // the text has not been changed.
  //
  // data - An {Object} containing information on why the cursor has been moved
  cursorMoved ({textChanged}) {
    // The delay is a workaround for the backspace case. The way atom implements
    // backspace is to select left 1 char, then delete. This results in a
    // cursorMoved event with textChanged == false. So we delay, and if the
    // bufferChanged handler decides to show suggestions, it will cancel the
    // hideSuggestionList request. If there is no bufferChanged event,
    // suggestionList will be hidden.
    if (!textChanged) this.requestHideSuggestionList()
  }

  // Private: Gets called when the user saves the document. Cancels the
  // autocompletion.
  bufferSaved () {
    if (!this.autosaveEnabled) { return this.hideSuggestionList() }
  }

  showOrHideSuggestionListForBufferChanges ({changes}) {
    if (this.disposed) return

    const lastCursorPosition = this.editor.getLastCursor().getBufferPosition()
    const changeOccurredNearLastCursor = changes.some(({newRange}) => {
      return newRange.containsPoint(lastCursorPosition)
    })
    if (!changeOccurredNearLastCursor) return

    let shouldActivate = false
    if (this.autoActivationEnabled || this.suggestionList.isActive() && !this.compositionInProgress) {
      shouldActivate = changes.some(({oldText, newText}) => {
        if (this.autoActivationEnabled || this.suggestionList.isActive()) {
          if (newText.length > 0) {
            // Activate on space, a non-whitespace character, or a bracket-matcher pair.
            if (newText === ' ' ||
                newText.trim().length === 1 ||
                (newText.length === 2 && this.bracketMatcherPairs.includes(newText))) return true
          } else if (oldText.length > 0 && (this.backspaceTriggersAutocomplete || this.suggestionList.isActive())) {
            // Suggestion list must be either active or backspaceTriggersAutocomplete must be true for activation to occur.
            // Activate on removal of a space, a non-whitespace character, or a bracket-matcher pair.
            if (oldText === ' ' ||
                oldText.trim().length === 1 ||
                (oldText.length === 2 && this.bracketMatcherPairs.includes(oldText))) return true
          }
        }
      })

      if (shouldActivate && this.shouldSuppressActivationForEditorClasses()) shouldActivate = false
    }

    if (shouldActivate) {
      this.cancelHideSuggestionListRequest()
      this.requestNewSuggestions()
    } else {
      this.cancelNewSuggestionsRequest()
      this.hideSuggestionList()
    }
  }

  shouldSuppressActivationForEditorClasses () {
    for (let i = 0; i < this.suppressForClasses.length; i++) {
      const classNames = this.suppressForClasses[i]
      let containsCount = 0
      for (let j = 0; j < classNames.length; j++) {
        const className = classNames[j]
        if (this.editorView.classList.contains(className)) { containsCount += 1 }
      }
      if (containsCount === classNames.length) { return true }
    }
    return false
  }

  // Public: Clean up, stop listening to events
  dispose () {
    this.hideSuggestionList()
    this.disposed = true
    this.ready = false
    if (this.editorSubscriptions) {
      this.editorSubscriptions.dispose()
    }
    this.editorSubscriptions = null
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.suggestionList = null
    this.providerManager = null
  }
}
