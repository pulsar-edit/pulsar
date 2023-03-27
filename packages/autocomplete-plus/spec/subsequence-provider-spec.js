/* eslint-env jasmine */

const { conditionPromise } = require('./spec-helper')
const path = require('path')

let suggestionsForPrefix = async (provider, editor, prefix, options) => {
  let bufferPosition = editor.getCursorBufferPosition()
  let scopeDescriptor = editor.getLastCursor().getScopeDescriptor()
  let suggestions = provider.getSuggestions({editor, bufferPosition, prefix, scopeDescriptor})
  if (options && options.raw) {
    return suggestions
  } else {
    if (suggestions) {
      return (await suggestions).map(sug => sug.text)
    } else {
      return []
    }
  }
}

describe('SubsequenceProvider', () => {
  let [editor, mainModule, autocompleteManager, provider] = []

  beforeEach(async () => {
    atom.workspace.project.setPaths([path.join(__dirname, 'fixtures')]);
    jasmine.useRealClock()

    // Set to live completion
    atom.config.set('autocomplete-plus.enableAutoActivation', true)
    atom.config.set('autocomplete-plus.defaultProvider', 'Subsequence')

    // Set the completion delay
    atom.config.set('autocomplete-plus.autoActivationDelay', 100)

    let workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)

    editor = await atom.workspace.open('sample.js')
    await atom.packages.activatePackage('language-javascript')
    mainModule = (await atom.packages.activatePackage('autocomplete-plus')).mainModule

    await conditionPromise(() =>
      mainModule.autocompleteManager && mainModule.autocompleteManager.ready
    )
    autocompleteManager = mainModule.autocompleteManager
    provider = autocompleteManager.providerManager.defaultProvider
  })

  it('runs a completion ', async () => {
    const suggestions = await suggestionsForPrefix(provider, editor, 'quick')
    expect(suggestions).toContain('quicksort')
  })

  it('adds words to the symbol list after they have been written', async () => {
    let suggestions = await suggestionsForPrefix(provider, editor, 'anew')
    expect(suggestions).not.toContain('aNewFunction')

    editor.insertText('function aNewFunction(){};')
    editor.insertText(' ')
    suggestions = await suggestionsForPrefix(provider, editor, 'anew')

    expect(suggestions).toContain('aNewFunction')
  })

  it('adds words after they have been added to a scope that is not a direct match for the selector', async () => {
    let suggestions = await suggestionsForPrefix(provider, editor, 'some')
    expect(suggestions).not.toContain('somestring')

    editor.insertText('abc = "somestring"')
    editor.insertText(' ')
    suggestions = await suggestionsForPrefix(provider, editor, 'some')

    expect(suggestions).toContain('somestring')
  })

  it('removes words from the symbol list when they do not exist in the buffer', async () => {
    editor.moveToBottom()
    editor.moveToBeginningOfLine()

    let suggestions = await suggestionsForPrefix(provider, editor, 'anew')
    expect(suggestions).not.toContain('aNewFunction')

    editor.insertText('function aNewFunction(){};')
    editor.moveToEndOfLine()
    suggestions = await suggestionsForPrefix(provider, editor, 'anew')

    expect(suggestions).toContain('aNewFunction')

    editor.setCursorBufferPosition([13, 21])
    editor.backspace()
    editor.moveToTop()
    suggestions = await suggestionsForPrefix(provider, editor, 'anew')

    expect(suggestions).toContain('aNewFunctio')
    expect(suggestions).not.toContain('aNewFunction')
  })

  it('does not return the prefix as a suggestion', async () => {
    atom.config.set('editor.nonWordCharacters', '-')
    atom.config.set('autocomplete-plus.extraWordCharacters', '-')

    editor.moveToBottom()
    editor.insertText('--qu')

    let suggestions = await suggestionsForPrefix(provider, editor, '--qu')

    expect(suggestions).not.toContain('--qu')
  })

  it('does not return the word under the cursors when are multiple cursors', async () => {
    editor.moveToBottom()
    editor.setText('\n\n\n')
    editor.setCursorBufferPosition([0, 0])
    editor.addCursorAtBufferPosition([1, 0])
    editor.addCursorAtBufferPosition([2, 0])
    editor.insertText('omg')

    const suggestions = await suggestionsForPrefix(provider, editor, 'omg')
    expect(suggestions).not.toContain('omg')
  })

  it('does not output suggestions from the other buffer', async () => {
    await atom.packages.activatePackage('language-coffee-script')
    const coffeeEditor = await atom.workspace.open('sample.coffee')
    const suggestions = await suggestionsForPrefix(provider, coffeeEditor, 'item')

    expect(suggestions).toHaveLength(0)
  })

  describe('search range', () => {
    it('includes the full range when the buffer is smaller than the max range', () => {
      const range = provider.clampedRange(500, 25, 100)
      expect(range.start.row).toBeLessThan(0)
      expect(range.end.row).toBeGreaterThan(100)
    })

    it('returns the expected result when cursor is close to end of large buffer', () => {
      const range = provider.clampedRange(100, 450, 500)
      expect(range.start.row).toBeLessThan(350)
    })

    it('returns the expected result when cursor is close to beginning of large buffer', () => {
      const range = provider.clampedRange(100, 50, 500)
      expect(range.end.row).toBeGreaterThan(100)
    })
  })

  describe('when autocomplete-plus.minimumWordLength is > 1', () => {
    beforeEach(() => atom.config.set('autocomplete-plus.minimumWordLength', 3))

    it('only returns results when the prefix is at least the min word length', async () => {
      editor.insertText('function aNewFunction(){};')

      const results = await Promise.all([
        '',
        'a',
        'an',
        'ane',
        'anew'
      ].map(text => suggestionsForPrefix(provider, editor, text)))

      expect(results[0]).not.toContain('aNewFunction')
      expect(results[1]).not.toContain('aNewFunction')
      expect(results[2]).not.toContain('aNewFunction')
      expect(results[3]).toContain('aNewFunction')
      expect(results[4]).toContain('aNewFunction')
    })
  })

  describe('when autocomplete-plus.minimumWordLength is 0', () => {
    beforeEach(() => atom.config.set('autocomplete-plus.minimumWordLength', 0))

    it('only returns results when the prefix is at least the min word length', async () => {
      editor.insertText('function aNewFunction(){};')
      const testResultPairs = [
          ['', false],
          ['a', true],
          ['an', true],
          ['ane', true],
          ['anew', true]
      ]

      const results = await Promise.all(
        testResultPairs.map(t => suggestionsForPrefix(provider, editor, t[0]))
      )

      results.forEach((result, idx) => {
        if (testResultPairs[idx][1]) {
          expect(result).toContain('aNewFunction')
        } else {
          expect(result).not.toContain('aNewFunction')
        }
      })
    })
  })

  describe("when the editor's path changes", () => {
    it('continues to track changes on the new path', async () => {
      let buffer = editor.getBuffer()

      expect(provider.watchedBuffers.get(buffer)).toBe(editor)

      let suggestions = await suggestionsForPrefix(provider, editor, 'qu')
      expect(suggestions).toContain('quicksort')
      buffer.setPath('cats.js')
      expect(provider.watchedBuffers.get(buffer)).toBe(editor)
      editor.moveToBottom()
      editor.moveToBeginningOfLine()

      const results = await Promise.all([
        suggestionsForPrefix(provider, editor, 'qu'),
        suggestionsForPrefix(provider, editor, 'anew')
      ])

      expect(results[0]).toContain('quicksort')
      expect(results[1]).not.toContain('aNewFunction')
      editor.insertText('function aNewFunction(){};')
      suggestions = await suggestionsForPrefix(provider, editor, 'anew')

      expect(suggestions).toContain('aNewFunction')
    })
  })

  describe('when editor.nonWordCharacters changes', () => {
    it('includes characters that are included in the `autocomplete-plus.extraWordCharacters` setting or not excluded in the `editor.nonWordCharacters` setting', async () => {
      const scopeSelector = editor.getLastCursor().getScopeDescriptor().getScopeChain()
      editor.insertText('good$noodles good-beef ')

      atom.config.set('editor.nonWordCharacters', '$-', {scopeSelector})
      let sugs = await suggestionsForPrefix(provider, editor, 'good')
      expect(sugs).not.toContain('good$noodles')
      expect(sugs).not.toContain('good-beef')

      atom.config.set('autocomplete-plus.extraWordCharacters', '-', {scopeSelector})
      sugs = await suggestionsForPrefix(provider, editor, 'good')
      expect(sugs).toContain('good-beef')
      expect(sugs).not.toContain('good$noodles')

      atom.config.set('editor.nonWordCharacters', '-', {scopeSelector})
      sugs = await suggestionsForPrefix(provider, editor, 'good')
      expect(sugs).toContain('good-beef')
      expect(sugs).toContain('good$noodles')
    })
  })

  describe('when includeCompletionsFromAllBuffers is enabled', () => {
    beforeEach(async () => {
      atom.config.set('autocomplete-plus.includeCompletionsFromAllBuffers', true)

      await atom.packages.activatePackage('language-coffee-script')
      editor = await atom.workspace.open('sample.coffee')
    })

    afterEach(() => {
      atom.config.set('autocomplete-plus.includeCompletionsFromAllBuffers', false)
    })

    it('outputs unique suggestions', async () => {
      editor.setCursorBufferPosition([7, 0])

      const suggestions = await suggestionsForPrefix(provider, editor, 'qu')
      expect(suggestions).toHaveLength(2)
    })

    it('outputs suggestions from the other buffer', async () => {
      editor.setCursorBufferPosition([7, 0])

      const suggestions = await suggestionsForPrefix(provider, editor, 'item')
      expect(suggestions[0]).toBe('items')
    })
  })

  // TODO: commenting this out because I'm not sure what it's trying to test
  //       just remove it? (This was brought over from the symbol provider spec.)
  //   describe('when the autocomplete.symbols changes between scopes', () => {
  //     beforeEach(() => {
  //       editor.setText(`// in-a-comment
  // inVar = "in-a-string"`
  //       )
  //       waitForBufferToStopChanging()
  //
  //       let commentConfig = {
  //         incomment: {
  //           selector: '.comment'
  //         }
  //       }
  //
  //       let stringConfig = {
  //         instring: {
  //           selector: '.string'
  //         }
  //       }
  //
  //       atom.config.set('autocomplete.symbols', commentConfig, {scopeSelector: '.source.js .comment'})
  //       atom.config.set('autocomplete.symbols', stringConfig, {scopeSelector: '.source.js .string'})
  //     })
  //
  //     it('uses the config for the scope under the cursor', () => {
  //       // Using the comment config
  //       editor.setCursorBufferPosition([0, 2])
  //
  //       waitsForPromise(() =>
  //         suggestionsForPrefix(provider, editor, 'in', {raw: true}).then(sugs => {
  //           expect(sugs).toHaveLength(1)
  //           expect(sugs[0].text).toBe('in-a-comment')
  //           expect(sugs[0].type).toBe('incomment')
  //
  //           // Using the string config
  //           editor.setCursorBufferPosition([1, 20])
  //           editor.insertText(' ')
  //           waitForBufferToStopChanging()
  //
  //           return suggestionsForPrefix(provider, editor, 'in', {raw: true})
  //         }).then(sugs => {
  //           expect(sugs).toHaveLength(1)
  //           expect(sugs[0].text).toBe('in-a-string')
  //           expect(sugs[0].type).toBe('instring')
  //
  //           editor.setCursorBufferPosition([1, Infinity])
  //           editor.insertText(' ')
  //           waitForBufferToStopChanging()
  //
  //           return suggestionsForPrefix(provider, editor, 'in', {raw: true})
  //         }).then(sugs => {
  //           expect(sugs).toHaveLength(3)
  //           expect(sugs[0].text).toBe('inVar')
  //           expect(sugs[0].type).toBe('')
  //         })
  //       )
  //     })
  //   })
  //
  //   describe('when the config contains a list of suggestion strings', () => {
  //     beforeEach(() => {
  //       editor.setText('// abcomment')
  //       waitForBufferToStopChanging()
  //
  //       let commentConfig = {
  //         comment: { selector: '.comment' },
  //         builtin: {
  //           suggestions: ['abcd', 'abcde', 'abcdef']
  //         }
  //       }
  //
  //       atom.config.set('autocomplete.symbols', commentConfig, {scopeSelector: '.source.js .comment'})
  //     })
  //
  //     it('adds the suggestions to the results', () => {
  //       // Using the comment config
  //       editor.setCursorBufferPosition([0, 2])
  //
  //       waitsForPromise(() =>
  //         suggestionsForPrefix(provider, editor, 'ab', {raw: true}).then(suggestions => {
  //           expect(suggestions).toHaveLength(4)
  //           expect(suggestions[0].text).toBe('abcomment')
  //           expect(suggestions[0].type).toBe('comment')
  //           expect(suggestions[1].text).toBe('abcdef')
  //           expect(suggestions[1].type).toBe('builtin')
  //         })
  //       )
  //     })
  //   })

  describe('when the symbols config contains a list of suggestion objects', () => {
    beforeEach(() => {
      editor.setText('// abcomment')

      let commentConfig = {
        comment: { selector: '.comment' },
        builtin: {
          suggestions: [
              {nope: 'nope1', rightLabel: 'will not be added to the suggestions'},
              {text: 'abcd', rightLabel: 'one', type: 'function'},
              []
          ]
        }
      }
      atom.config.set('autocomplete.symbols', commentConfig, {scopeSelector: '.source.js .comment'})
    })

    it('adds the suggestion objects to the results', async () => {
        // Using the comment config
      editor.setCursorBufferPosition([0, 2])

      const suggestions = await suggestionsForPrefix(provider, editor, 'ab', {raw: true})

      expect(suggestions).toHaveLength(2)
      expect(suggestions[0].text).toBe('abcd')
      expect(suggestions[0].type).toBe('function')
      expect(suggestions[0].rightLabel).toBe('one')
      expect(suggestions[1].text).toBe('abcomment')
      expect(suggestions[1].type).toBe('comment')
    })
  })

  describe('when the legacy completions array is used', () => {
    beforeEach(() => {
      editor.setText('// abcomment')
      atom.config.set('editor.completions', ['abcd', 'abcde', 'abcdef'], {scopeSelector: '.source.js .comment'})
    })

    it('uses the config for the scope under the cursor', async () => {
        // Using the comment config
      editor.setCursorBufferPosition([0, 2])

      const suggestions = await suggestionsForPrefix(provider, editor, 'ab', {raw: true})

      expect(suggestions).toHaveLength(4)
      expect(suggestions[0].text).toBe('abcd')
      expect(suggestions[0].type).toBe('builtin')
      expect(suggestions[3].text).toBe('abcomment')
      expect(suggestions[3].type).toBe('')
    })
  })

  it('adds words to the wordlist with unicode characters', async () => {
    atom.config.set('autocomplete-plus.enableExtendedUnicodeSupport', true)

    let suggestions = await suggestionsForPrefix(provider, editor, 'somē', {raw: true})
    expect(suggestions).toHaveLength(0)

    editor.insertText('somēthingNew')
    editor.insertText(' ')
    suggestions = await suggestionsForPrefix(provider, editor, 'somē', {raw: true})

    expect(suggestions).toHaveLength(1)
  })

  it('does not throw errors when findWordsWithSubsequence jobs are cancelled due to rapid buffer changes', async () => {
    editor.setText('')

    const promises = []
    for (let i = 0; i < 50; i++) {
      editor.insertText('x')
      promises.push(suggestionsForPrefix(provider, editor, editor.getText(), {raw: true}))
    }

    await Promise.all(promises)
  })
})
