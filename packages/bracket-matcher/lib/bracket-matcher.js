const _ = require('underscore-plus')
const {CompositeDisposable} = require('atom')
const SelectorCache = require('./selector-cache')

module.exports =
class BracketMatcher {
  constructor (editor, editorElement, matchManager) {
    this.insertText = this.insertText.bind(this)
    this.insertNewline = this.insertNewline.bind(this)
    this.backspace = this.backspace.bind(this)
    this.editor = editor
    this.matchManager = matchManager
    this.subscriptions = new CompositeDisposable()
    this.bracketMarkers = []

    this.origEditorInsertText = this.editor.insertText.bind(this.editor)
    _.adviseBefore(this.editor, 'insertText', this.insertText)
    _.adviseBefore(this.editor, 'insertNewline', this.insertNewline)
    _.adviseBefore(this.editor, 'backspace', this.backspace)

    this.subscriptions.add(
      atom.commands.add(editorElement, 'bracket-matcher:remove-brackets-from-selection', event => {
        if (!this.removeBrackets()) event.abortKeyBinding()
      }),

      this.editor.onDidDestroy(() => this.unsubscribe())
    )
  }

  insertText (text, options) {
    if (!text) return true
    if ((options && options.select) || (options && options.undo === 'skip')) return true

    let autoCompleteOpeningBracket, bracketMarker, pair
    if (this.matchManager.changeBracketsMode) {
      this.matchManager.changeBracketsMode = false
      if (this.isClosingBracket(text)) {
        text = this.matchManager.pairedCharactersInverse[text]
      }
      if (this.isOpeningBracket(text)) {
        this.editor.mutateSelectedText(selection => {
          const selectionText = selection.getText()
          if (this.isOpeningBracket(selectionText)) {
            selection.insertText(text)
          }
          if (this.isClosingBracket(selectionText)) {
            selection.insertText(this.matchManager.pairedCharacters[text])
          }
        })
        return false
      }
    }

    if (this.wrapSelectionInBrackets(text)) return false
    if (this.editor.hasMultipleCursors()) return true

    const cursorBufferPosition = this.editor.getCursorBufferPosition()
    const previousCharacters = this.editor.getTextInBufferRange([[cursorBufferPosition.row, 0], cursorBufferPosition])
    const nextCharacter = this.editor.getTextInBufferRange([cursorBufferPosition, cursorBufferPosition.traverse([0, 1])])
    const previousCharacter = previousCharacters.slice(-1)

    const hasWordAfterCursor = /\w/.test(nextCharacter)
    const hasWordBeforeCursor = /\w/.test(previousCharacter)
    const hasQuoteBeforeCursor = this.isQuote(previousCharacter) && (previousCharacter === text[0])
    const hasEscapeCharacterBeforeCursor = endsWithEscapeCharacter(previousCharacters)
    const hasEscapeSequenceBeforeCursor = endsWithEscapeSequence(previousCharacters)

    if (text === '#' && this.isCursorOnInterpolatedString()) {
      autoCompleteOpeningBracket = this.getScopedSetting('bracket-matcher.autocompleteBrackets') && !hasEscapeCharacterBeforeCursor
      text += '{'
      pair = '}'
    } else {
      autoCompleteOpeningBracket = (
        this.isOpeningBracket(text) &&
        !hasWordAfterCursor &&
        this.getScopedSetting('bracket-matcher.autocompleteBrackets') &&
        !(this.isQuote(text) && (hasWordBeforeCursor || hasQuoteBeforeCursor || hasEscapeSequenceBeforeCursor)) &&
        !hasEscapeCharacterBeforeCursor
      )
      pair = this.matchManager.pairedCharacters[text]
    }

    let skipOverExistingClosingBracket = false
    if (this.isClosingBracket(text) && (nextCharacter === text) && !hasEscapeCharacterBeforeCursor) {
      bracketMarker = this.bracketMarkers.find(marker => marker.isValid() && marker.getBufferRange().end.isEqual(cursorBufferPosition))
      if (bracketMarker || this.getScopedSetting('bracket-matcher.alwaysSkipClosingPairs')) {
        skipOverExistingClosingBracket = true
      }
    }

    if (skipOverExistingClosingBracket) {
      if (bracketMarker) bracketMarker.destroy()
      _.remove(this.bracketMarkers, bracketMarker)
      this.editor.moveRight()
      return false
    } else if (autoCompleteOpeningBracket) {
      this.editor.transact(() => {
        this.origEditorInsertText(text + pair)
        this.editor.moveLeft()
      })
      const range = [cursorBufferPosition, cursorBufferPosition.traverse([0, text.length])]
      this.bracketMarkers.push(this.editor.markBufferRange(range))
      return false
    }
  }

  insertNewline () {
    if (this.editor.hasMultipleCursors()) return
    if (!this.editor.getLastSelection().isEmpty()) return

    const cursorBufferPosition = this.editor.getCursorBufferPosition()
    const previousCharacters = this.editor.getTextInBufferRange([[cursorBufferPosition.row, 0], cursorBufferPosition])
    const nextCharacter = this.editor.getTextInBufferRange([cursorBufferPosition, cursorBufferPosition.traverse([0, 1])])
    const previousCharacter = previousCharacters.slice(-1)
    const hasEscapeCharacterBeforeCursor = endsWithEscapeCharacter(previousCharacters)

    if (
      this.matchManager.pairsWithExtraNewline[previousCharacter] === nextCharacter &&
      !hasEscapeCharacterBeforeCursor
    ) {
      this.editor.transact(() => {
        this.origEditorInsertText('\n\n')
        this.editor.moveUp()
        if (this.getScopedSetting('editor.autoIndent')) {
          const cursorRow = this.editor.getCursorBufferPosition().row
          this.editor.autoIndentBufferRows(cursorRow, cursorRow + 1)
        }
      })
      return false
    }
  }

  backspace () {
    if (this.editor.hasMultipleCursors()) return
    if (!this.editor.getLastSelection().isEmpty()) return

    const cursorBufferPosition = this.editor.getCursorBufferPosition()
    const previousCharacters = this.editor.getTextInBufferRange([[cursorBufferPosition.row, 0], cursorBufferPosition])
    const nextCharacter = this.editor.getTextInBufferRange([cursorBufferPosition, cursorBufferPosition.traverse([0, 1])])
    const previousCharacter = previousCharacters.slice(-1)
    const hasEscapeCharacterBeforeCursor = endsWithEscapeCharacter(previousCharacters)

    if (
      this.matchManager.pairedCharacters[previousCharacter] === nextCharacter &&
      !hasEscapeCharacterBeforeCursor &&
      this.getScopedSetting('bracket-matcher.autocompleteBrackets')
    ) {
      this.editor.transact(() => {
        this.editor.moveLeft()
        this.editor.delete()
        this.editor.delete()
      })
      return false
    }
  }

  removeBrackets () {
    let bracketsRemoved = false
    this.editor.mutateSelectedText(selection => {
      let selectionEnd
      if (!this.selectionIsWrappedByMatchingBrackets(selection)) return

      const range = selection.getBufferRange()
      const options = {reversed: selection.isReversed()}
      const selectionStart = range.start
      if (range.start.row === range.end.row) {
        selectionEnd = range.end.traverse([0, -2])
      } else {
        selectionEnd = range.end.traverse([0, -1])
      }

      const text = selection.getText()
      selection.insertText(text.substring(1, text.length - 1))
      selection.setBufferRange([selectionStart, selectionEnd], options)
      bracketsRemoved = true
    })
    return bracketsRemoved
  }

  wrapSelectionInBrackets (bracket) {
    let pair
    if (bracket === '#') {
      if (!this.isCursorOnInterpolatedString()) return false
      bracket = '#{'
      pair = '}'
    } else {
      if (!this.isOpeningBracket(bracket)) return false
      pair = this.matchManager.pairedCharacters[bracket]
    }

    if (!this.editor.selections.some(s => !s.isEmpty())) return false
    if (!this.getScopedSetting('bracket-matcher.wrapSelectionsInBrackets')) return false

    let selectionWrapped = false
    this.editor.mutateSelectedText(selection => {
      let selectionEnd
      if (selection.isEmpty()) return

      // Don't wrap in #{} if the selection spans more than one line
      if ((bracket === '#{') && !selection.getBufferRange().isSingleLine()) return

      selectionWrapped = true
      const range = selection.getBufferRange()
      const options = {reversed: selection.isReversed()}
      selection.insertText(`${bracket}${selection.getText()}${pair}`)
      const selectionStart = range.start.traverse([0, bracket.length])
      if (range.start.row === range.end.row) {
        selectionEnd = range.end.traverse([0, bracket.length])
      } else {
        selectionEnd = range.end
      }
      selection.setBufferRange([selectionStart, selectionEnd], options)
    })

    return selectionWrapped
  }

  isQuote (string) {
    return /['"`]/.test(string)
  }

  isCursorOnInterpolatedString () {
    const cursor = this.editor.getLastCursor()
    const languageMode = this.editor.getBuffer().getLanguageMode()
    if (languageMode.getSyntaxNodeAtPosition) {
      const node = languageMode.getSyntaxNodeAtPosition(
        cursor.getBufferPosition(),
        (node, grammar) => grammar.scopeName === 'source.ruby' && /string|symbol/.test(node.type)
      )
      if (node) {
        const {firstChild} = node
        if (firstChild) {
          return ['"', ':"', '%('].includes(firstChild.text)
        }
      }
      return false
    } else {
      if (this.interpolatedStringSelector == null) {
        const segments = [
          '*.*.*.interpolated.ruby',
          'string.interpolated.ruby',
          'string.regexp.interpolated.ruby',
          'string.quoted.double.coffee',
          'string.unquoted.heredoc.ruby',
          'string.quoted.double.livescript',
          'string.quoted.double.heredoc.livescript',
          'string.quoted.double.elixir',
          'string.quoted.double.heredoc.elixir',
          'comment.documentation.heredoc.elixir'
        ]
        this.interpolatedStringSelector = SelectorCache.get(segments.join(' | '))
      }
      return this.interpolatedStringSelector.matches(this.editor.getLastCursor().getScopeDescriptor().getScopesArray())
    }
  }

  isOpeningBracket (string) {
    return this.matchManager.pairedCharacters.hasOwnProperty(string)
  }

  isClosingBracket (string) {
    return this.matchManager.pairedCharactersInverse.hasOwnProperty(string)
  }

  selectionIsWrappedByMatchingBrackets (selection) {
    if (selection.isEmpty()) return false
    const selectedText = selection.getText()
    const firstCharacter = selectedText[0]
    const lastCharacter = selectedText[selectedText.length - 1]
    return this.matchManager.pairedCharacters[firstCharacter] === lastCharacter
  }

  unsubscribe () {
    this.subscriptions.dispose()
  }

  getScopedSetting (key) {
    return atom.config.get(key, {scope: this.editor.getRootScopeDescriptor()})
  }
}

const BACKSLASHES_REGEX = /(\\+)$/
const ESCAPE_SEQUENCE_REGEX = /(\\+)[^\\]$/

// odd number of backslashes
function endsWithEscapeCharacter (string) {
  const backslashesMatch = string.match(BACKSLASHES_REGEX)
  return backslashesMatch && backslashesMatch[1].length % 2 === 1
}

// even number of backslashes or odd number of backslashes followed by another character
function endsWithEscapeSequence (string) {
  const backslashesMatch = string.match(BACKSLASHES_REGEX)
  const escapeSequenceMatch = string.match(ESCAPE_SEQUENCE_REGEX)
  return (
    (escapeSequenceMatch && escapeSequenceMatch[1].length % 2 === 1) ||
    (backslashesMatch && backslashesMatch[1].length % 2 === 0)
  )
}
