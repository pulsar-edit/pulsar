const { CompositeDisposable, TextBuffer } = require('atom')
const ProviderConfig = require('./provider-config')
const getAdditionalWordCharacters = require('./get-additional-word-characters')

module.exports =
class SubsequenceProvider {
  constructor (options = {}) {
    this.apiVersion = 4
    this.defaults()

    this.subscriptions = new CompositeDisposable()
    this.watchedBuffers = new Map()

    if (options.atomConfig) {
      this.atomConfig = options.atomConfig
    }

    if (options.atomWorkspace) {
      this.atomWorkspace = options.atomWorkspace
    }

    this.providerConfig = new ProviderConfig({
      atomConfig: this.atomConfig
    })

    // make this.X available where X is the autocomplete-plus.X setting
    const settings = [
      'autocomplete-plus.enableExtendedUnicodeSupport', // TODO
      'autocomplete-plus.minimumWordLength',
      'autocomplete-plus.includeCompletionsFromAllBuffers',
      'autocomplete-plus.useLocalityBonus',
      'autocomplete-plus.strictMatching'
    ]
    settings.forEach(property => {
      this.subscriptions.add(this.atomConfig.observe(property, val => {
        this[property.split('.')[1]] = val
      }))
    })

    this.subscriptions.add(this.atomWorkspace.observeTextEditors((e) => {
      this.watchBuffer(e)
    }))

    this.configSuggestionsBuffer = new TextBuffer()
  }

  inspect () {
    return `SubsequenceProvider {apiVersion: ${this.apiVersion}}`
  }

  defaults () {
    this.atomConfig = atom.config
    this.atomWorkspace = atom.workspace

    this.possibleWordCharacters = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?_-…'.split('')
    this.enableExtendedUnicodeSupport = false
    this.maxSuggestions = 20
    this.maxResultsPerBuffer = 20
    this.maxSearchRowDelta = 3000

    this.labels = ['workspace-center', 'default', 'subsequence-provider']
    this.scopeSelector = '*'
    this.inclusionPriority = 0
    this.suggestionPriority = 0

    this.watchedBuffers = null
  }

  dispose () {
    return this.subscriptions.dispose()
  }

  watchBuffer (editor) {
    const buffer = editor.getBuffer()

    if (!this.watchedBuffers.has(buffer)) {
      const bufferSubscriptions = new CompositeDisposable()
      bufferSubscriptions.add(buffer.onDidDestroy(() => {
        bufferSubscriptions.dispose()
        this.watchedBuffers.delete(buffer)
      }))
    }

    this.watchedBuffers.set(buffer, editor)
  }

  // This is kind of a hack. We throw the config suggestions in a buffer, so
  // we can use .findWordsWithSubsequence on them.
  configSuggestionsToSubsequenceMatches (suggestions, prefix) {
    if (!suggestions || suggestions.length === 0) {
      return Promise.resolve([])
    }

    const suggestionText = suggestions
      .map(sug => sug.displayText || sug.snippet || sug.text)
      .join('\n')

    this.configSuggestionsBuffer.buffer.setText(suggestionText)

    return this.configSuggestionsBuffer.findWordsWithSubsequence(
      prefix,
      '(){}[] :;,$@%',
      this.maxResultsPerBuffer
    ).then(matches => {
      for (let k = 0; k < matches.length; k++) {
        matches[k].configSuggestion = suggestions[matches[k].positions[0].row]
      }
      return matches
    })
  }

  clampedRange (maxDelta, cursorRow, maxRow) {
    const clampedMinRow = Math.max(0, cursorRow - maxDelta)
    const clampedMaxRow = Math.min(maxRow, cursorRow + maxDelta)
    const actualMinRowDelta = cursorRow - clampedMinRow
    const actualMaxRowDelta = clampedMaxRow - cursorRow

    return {
      start: {
        row: clampedMinRow - maxDelta + actualMaxRowDelta,
        column: 0
      },
      end: {
        row: clampedMaxRow + maxDelta - actualMinRowDelta,
        column: 0
      }
    }
  }

  bufferToSubsequenceMatches (prefix, additionalWordCharacters, buffer) {
    const position = this.watchedBuffers.get(buffer).getCursorBufferPosition()
    const searchRange = this.clampedRange(
      this.maxSearchRowDelta,
      position.row,
      buffer.getEndPosition().row
    )
    return buffer.findWordsWithSubsequenceInRange(
      prefix,
      additionalWordCharacters,
      this.maxResultsPerBuffer,
      searchRange
    )
  }

  /*
  Section: Suggesting Completions
  */

  getSuggestions ({editor, bufferPosition, prefix, scopeDescriptor}) {
    if (!prefix) {
      return
    }

    if (prefix.trim().length < this.minimumWordLength) {
      return
    }

    const buffers = this.includeCompletionsFromAllBuffers
      ? Array.from(this.watchedBuffers.keys())
      : [editor.getBuffer()]

    const currentEditorBuffer = editor.getBuffer()

    const lastCursorPosition = editor.getLastCursor().getBufferPosition()

    const additionalWordCharacters = getAdditionalWordCharacters(scopeDescriptor)

    const configSuggestions = this.providerConfig.getSuggestionsForScopeDescriptor(
      scopeDescriptor
    )

    const configMatches = this.configSuggestionsToSubsequenceMatches(
      configSuggestions,
      prefix
    )

    const subsequenceMatchToType = (match) => {
      const editor = this.watchedBuffers.get(match.buffer)
      const scopeDescriptor = editor.scopeDescriptorForBufferPosition(match.positions[0])
      return this.providerConfig.scopeDescriptorToType(scopeDescriptor)
    }

    const matchToSuggestion = match => {
      return match.configSuggestion || {
        text: match.word,
        type: subsequenceMatchToType(match),
        characterMatchIndices: match.matchIndices
      }
    }

    const bufferResultsToSuggestions = matchesByBuffer => {
      const relevantMatches = []
      let matchedWords = new Set()
      let match

      for (let k = 0; k < matchesByBuffer.length; k++) {
        // The findWordsWithSubsequence method will return `null`
        // if the async work was cancelled due to the buffer being
        // mutated since it was enqueued. We return `null` in this
        // case because `getSuggestions` will be called again anyway.
        if (!matchesByBuffer[k]) return null

        const buffer = buffers[k]
        for (let l = 0; l < matchesByBuffer[k].length; l++) {
          match = matchesByBuffer[k][l]

          if (match.word === prefix) continue
          if (matchedWords.has(match.word)) continue
          if (this.strictMatching && match.word.indexOf(prefix) !== 0) continue

          let matchIsUnderCursor = false
          if (buffer === currentEditorBuffer && match.score > 0) {
            let closestDistance
            for (const position of match.positions) {
              const distance = Math.abs(position.row - lastCursorPosition.row)
              if (closestDistance == null || distance < closestDistance) {
                closestDistance = distance
              }

              if (
                distance === 0 &&
                lastCursorPosition.column >= position.column &&
                lastCursorPosition.column <= position.column + match.word.length
              ) {
                matchIsUnderCursor = true
                break
              }
            }

            if (this.useLocalityBonus) {
              match.score += Math.floor(11 / (1 + 0.04 * closestDistance))
            }
          }

          if (matchIsUnderCursor) continue

          match.buffer = buffer

          relevantMatches.push(match)
          matchedWords.add(match.word)
        }
      }

      return relevantMatches
        .sort(compareMatches)
        .slice(0, this.maxSuggestions)
        .map(matchToSuggestion)
    }

    return Promise
      .all(
        buffers
          .map(this.bufferToSubsequenceMatches.bind(this, prefix, additionalWordCharacters))
          .concat(configMatches)
      )
      .then(bufferResultsToSuggestions)
  }
}

const compareMatches = (a, b) => {
  if (a.score - b.score === 0) {
    return a.word.length - b.word.length
  }
  return b.score - a.score
}
