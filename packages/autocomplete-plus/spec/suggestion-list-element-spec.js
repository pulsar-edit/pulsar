/* eslint-env jasmine */
/* eslint-disable no-template-curly-in-string */
const SuggestionListElement = require('../lib/suggestion-list-element')

const fragmentToHtml = fragment => {
  const el = document.createElement('span')
  el.appendChild(fragment.cloneNode(true))
  return el.innerHTML
}

describe('Suggestion List Element', () => {
  let [suggestionListElement] = []

  beforeEach(() => { suggestionListElement = new SuggestionListElement() })

  afterEach(() => {
    if (suggestionListElement) {
      suggestionListElement.dispose()
    }
    suggestionListElement = null
  })

  describe('renderItem', () => {
    beforeEach(() => jasmine.attachToDOM(suggestionListElement.element))

    it('HTML escapes displayText', () => {
      let suggestion = {text: 'Animal<Cat>'}
      suggestionListElement.renderItem(suggestion)
      expect(suggestionListElement.selectedLi.innerHTML).toContain('Animal&lt;Cat&gt;')

      suggestion = {text: 'Animal<Cat>', displayText: 'Animal<Cat>'}
      suggestionListElement.renderItem(suggestion)
      expect(suggestionListElement.selectedLi.innerHTML).toContain('Animal&lt;Cat&gt;')

      suggestion = {snippet: 'Animal<Cat>', displayText: 'Animal<Cat>'}
      suggestionListElement.renderItem(suggestion)
      expect(suggestionListElement.selectedLi.innerHTML).toContain('Animal&lt;Cat&gt;')
    })

    it('HTML escapes snippets', () => {
      let suggestion = {snippet: 'Animal<Cat>(${1:omg<wow>}, ${2:ok<yeah>})'}
      suggestionListElement.renderItem(suggestion)
      expect(suggestionListElement.selectedLi.innerHTML).toContain('Animal&lt;Cat&gt;')
      expect(suggestionListElement.selectedLi.innerHTML).toContain('omg&lt;wow&gt;')
      expect(suggestionListElement.selectedLi.innerHTML).toContain('ok&lt;yeah&gt;')

      suggestion = {
        snippet: 'Animal<Cat>(${1:omg<wow>}, ${2:ok<yeah>})',
        displayText: 'Animal<Cat>(omg<wow>, ok<yeah>)'
      }
      suggestionListElement.renderItem(suggestion)
      expect(suggestionListElement.selectedLi.innerHTML).toContain('Animal&lt;Cat&gt;')
      expect(suggestionListElement.selectedLi.innerHTML).toContain('omg&lt;wow&gt;')
      expect(suggestionListElement.selectedLi.innerHTML).toContain('ok&lt;yeah&gt;')
    })

    it('HTML escapes labels', () => {
      let suggestion = {text: 'something', leftLabel: 'Animal<Cat>', rightLabel: 'Animal<Dog>'}
      suggestionListElement.renderItem(suggestion)
      expect(suggestionListElement.selectedLi.querySelector('.left-label').innerHTML).toContain('Animal&lt;Cat&gt;')
      return expect(suggestionListElement.selectedLi.querySelector('.right-label').innerHTML).toContain('Animal&lt;Dog&gt;')
    })
  })

  describe('itemChanged', () => {
    beforeEach(() => jasmine.attachToDOM(suggestionListElement.element))

    it('updates the list item', async () => {
      jasmine.useRealClock()

      const suggestion = {text: 'foo'}
      const newSuggestion = {text: 'foo', description: 'foobar', rightLabel: 'foo'}
      suggestionListElement.model = {items: [newSuggestion]}
      suggestionListElement.selectedIndex = 0
      suggestionListElement.renderItem(suggestion, 0)
      expect(suggestionListElement.element.querySelector('.right-label').innerText).toBe('')

      suggestionListElement.itemChanged({suggestion: newSuggestion, index: 0})

      expect(suggestionListElement.element.querySelector('.right-label').innerText)
        .toBe('foo')

      expect(suggestionListElement.element.querySelector('.suggestion-description-content').innerText)
        .toBe('foobar')
    })
  })

  describe('getDisplayHTML', () => {
    it('uses displayText over text or snippet', () => {
      let text = 'abcd()'
      let snippet
      let displayText = 'acd'
      let replacementPrefix = 'a'
      let html = suggestionListElement.getDisplayFragment(text, snippet, displayText, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('<span class="character-match">a</span>cd')
    })

    it('handles the empty string in the text field', () => {
      let text = ''
      let snippet
      let replacementPrefix = 'a'
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('')
    })

    it('handles the empty string in the snippet field', () => {
      let text
      let snippet = ''
      let replacementPrefix = 'a'
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('')
    })

    it('handles an empty prefix', () => {
      let text
      let snippet = 'abc'
      let replacementPrefix = ''
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('abc')
    })

    it('outputs correct html when there are no snippets in the snippet field', () => {
      let text = ''
      let snippet = 'abc(d, e)f'
      let replacementPrefix = 'a'
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('<span class="character-match">a</span>bc(d, e)f')
    })

    it('outputs correct html when there are not character matches', () => {
      let text = ''
      let snippet = 'abc(d, e)f'
      let replacementPrefix = 'omg'
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('abc(d, e)f')
    })

    it('outputs correct html when the text field is used', () => {
      let text = 'abc(d, e)f'
      let snippet
      let replacementPrefix = 'a'
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('<span class="character-match">a</span>bc(d, e)f')
    })

    it('replaces a snippet with no escaped right braces', () => {
      let text = ''
      let snippet = 'abc(${1:d}, ${2:e})f'
      let replacementPrefix = 'a'
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">e</span>)f')
    })

    it('replaces a snippet with no escaped right braces', () => {
      let text = ''
      let snippet = 'text(${1:ab}, ${2:cd})'
      let replacementPrefix = 'ta'
      let html = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(html)).toBe('<span class="character-match">t</span>ext(<span class="snippet-completion"><span class="character-match">a</span>b</span>, <span class="snippet-completion">cd</span>)')
    })

    it('replaces a snippet with escaped right braces', () => {
      let text = ''
      let snippet = 'abc(${1:d}, ${2:e})f ${3:interface{\\}}'
      let replacementPrefix = 'a'
      let display = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(display)).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">e</span>)f <span class="snippet-completion">interface{}</span>')
    })

    it('replaces a snippet with escaped multiple right braces', () => {
      let text = ''
      let snippet = 'abc(${1:d}, ${2:something{ok\\}}, ${3:e})f ${4:interface{\\}}'
      let replacementPrefix = 'a'
      let display = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(display)).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">something{ok}</span>, <span class="snippet-completion">e</span>)f <span class="snippet-completion">interface{}</span>')
    })

    it('replaces a snippet with elements that have no text', () => {
      let text = ''
      let snippet = 'abc(${1:d}, ${2:e})f${3}'
      let replacementPrefix = 'a'
      let display = suggestionListElement.getDisplayFragment(text, snippet, null, replacementPrefix)
      expect(fragmentToHtml(display)).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">e</span>)f')
    })
  })

  describe('findCharacterMatches', () => {
    let assertMatches = (text, replacementPrefix, truthyIndices) => {
      text = suggestionListElement.removeEmptySnippets(text)
      let snippets = suggestionListElement.snippetParser.findSnippets(text)
      text = suggestionListElement.removeSnippetsFromText(snippets, text)
      let matches = suggestionListElement.findCharacterMatchIndices(text, replacementPrefix)

      for (var i = 0; i <= text.length; i++) {
        if (truthyIndices.indexOf(i) !== -1) {
          expect(matches[i]).toBeTruthy()
        } else {
          let m = matches
          if (m) {
            m = m[i]
          }
          expect(m).toBeFalsy()
        }
      }
    }

    it('finds matches when no snippets exist', () => {
      assertMatches('hello', '', [])
      assertMatches('hello', 'h', [0])
      assertMatches('hello', 'hl', [0, 2])
      assertMatches('hello', 'hlo', [0, 2, 4])
    })

    it('finds matches when snippets exist', () => {
      assertMatches('${0:hello}', '', [])
      assertMatches('${0:hello}', 'h', [0])
      assertMatches('${0:hello}', 'hl', [0, 2])
      assertMatches('${0:hello}', 'hlo', [0, 2, 4])
      assertMatches('${0:hello}world', '', [])
      assertMatches('${0:hello}world', 'h', [0])
      assertMatches('${0:hello}world', 'hw', [0, 5])
      assertMatches('${0:hello}world', 'hlw', [0, 2, 5])
      assertMatches('hello${0:world}', '', [])
      assertMatches('hello${0:world}', 'h', [0])
      assertMatches('hello${0:world}', 'hw', [0, 5])
      assertMatches('hello${0:world}', 'hlw', [0, 2, 5])
    })
  })

  describe('removeEmptySnippets', () => {
    it('removes an empty snippet group', () => {
      expect(suggestionListElement.removeEmptySnippets('$0')).toBe('')
      expect(suggestionListElement.removeEmptySnippets('$1000')).toBe('')
    })

    it('removes an empty snippet group with surrounding text', () => {
      expect(suggestionListElement.removeEmptySnippets('hello$0')).toBe('hello')
      expect(suggestionListElement.removeEmptySnippets('$0hello')).toBe('hello')
      expect(suggestionListElement.removeEmptySnippets('hello$0hello')).toBe('hellohello')
      expect(suggestionListElement.removeEmptySnippets('hello$1000hello')).toBe('hellohello')
    })

    it('removes an empty snippet group with braces', () => {
      expect(suggestionListElement.removeEmptySnippets('${0}')).toBe('')
      expect(suggestionListElement.removeEmptySnippets('${1000}')).toBe('')
    })

    it('removes an empty snippet group with braces with surrounding text', () => {
      expect(suggestionListElement.removeEmptySnippets('hello${0}')).toBe('hello')
      expect(suggestionListElement.removeEmptySnippets('${0}hello')).toBe('hello')
      expect(suggestionListElement.removeEmptySnippets('hello${0}hello')).toBe('hellohello')
      expect(suggestionListElement.removeEmptySnippets('hello${1000}hello')).toBe('hellohello')
    })

    it('removes an empty snippet group with braces and a colon', () => {
      expect(suggestionListElement.removeEmptySnippets('${0:}')).toBe('')
      expect(suggestionListElement.removeEmptySnippets('${1000:}')).toBe('')
    })

    it('removes an empty snippet group with braces and a colon with surrounding text', () => {
      expect(suggestionListElement.removeEmptySnippets('hello${0:}')).toBe('hello')
      expect(suggestionListElement.removeEmptySnippets('${0:}hello')).toBe('hello')
      expect(suggestionListElement.removeEmptySnippets('hello${0:}hello')).toBe('hellohello')
      expect(suggestionListElement.removeEmptySnippets('hello${1000:}hello')).toBe('hellohello')
    })
  })

  describe('moveSelectionUp', () => {
    it('decreases the selected index when the current index is greater than zero', () => {
      spyOn(suggestionListElement, 'setSelectedIndex')
      suggestionListElement.selectedIndex = 1

      suggestionListElement.moveSelectionUp()

      expect(suggestionListElement.setSelectedIndex).toHaveBeenCalledWith(0)
    })

    it('dismisses the suggestion list if the current selection is at the start of the list and moveToCancel is true', () => {
      const model = {
        activeEditor: {
          moveUp () {}
        },
        cancel () {}
      }
      spyOn(model.activeEditor, 'moveUp')
      spyOn(model, 'cancel')

      suggestionListElement.model = model
      suggestionListElement.selectedIndex = 0
      suggestionListElement.moveToCancel = true

      suggestionListElement.moveSelectionUp()

      expect(model.activeEditor.moveUp).toHaveBeenCalledWith(1)
      expect(model.cancel).toHaveBeenCalled()
    })

    it('cycles to the last element in the suggestion list when the current selection is at the start of the list', () => {
      spyOn(suggestionListElement, 'visibleItems').and.returnValue(['a', 'b', 'c', 'd', 'e'])
      spyOn(suggestionListElement, 'setSelectedIndex')

      suggestionListElement.moveSelectionUp()

      expect(suggestionListElement.setSelectedIndex).toHaveBeenCalledWith(4)
    })
  })

  describe('moveSelectionDown', () => {
    it('increases the selected index if the current selection is not at the end of the list', () => {
      spyOn(suggestionListElement, 'visibleItems').and.returnValue(['a', 'b', 'c', 'd', 'e'])
      spyOn(suggestionListElement, 'setSelectedIndex')
      suggestionListElement.selectedIndex = 3

      suggestionListElement.moveSelectionDown()

      expect(suggestionListElement.setSelectedIndex).toHaveBeenCalledWith(4)
    })

    it('dismisses the suggestion list if the current selection is at the end of the list and moveToCancel is true', () => {
      const model = {
        activeEditor: {
          moveDown () {}
        },
        cancel () {}
      }
      spyOn(model.activeEditor, 'moveDown')
      spyOn(model, 'cancel')
      spyOn(suggestionListElement, 'visibleItems').and.returnValue(['a', 'b', 'c', 'd', 'e'])

      suggestionListElement.model = model
      suggestionListElement.selectedIndex = 4
      suggestionListElement.moveToCancel = true

      suggestionListElement.moveSelectionDown()

      expect(model.activeEditor.moveDown).toHaveBeenCalledWith(1)
      expect(model.cancel).toHaveBeenCalled()
    })

    it('cycles to the first element in the suggestion list when the current suggestion is at the end of the list', () => {
      spyOn(suggestionListElement, 'visibleItems').and.returnValue(['a', 'b', 'c', 'd', 'e'])
      spyOn(suggestionListElement, 'setSelectedIndex')
      suggestionListElement.selectedIndex = 4

      suggestionListElement.moveSelectionDown()

      expect(suggestionListElement.setSelectedIndex).toHaveBeenCalledWith(0)
    })
  })

  describe('moveSelectionPageUp', () => {
    it('dismisses the list if moveToCancel is true', () => {
      const model = {
        activeEditor: {
          getScreenLineCount: () => 42,
          moveUp () {}
        },
        cancel () {}
      }
      spyOn(model.activeEditor, 'moveUp')
      spyOn(model, 'cancel')

      suggestionListElement.model = model
      suggestionListElement.moveToCancel = true

      suggestionListElement.moveSelectionPageUp()

      expect(model.activeEditor.moveUp).toHaveBeenCalledWith(42)
      expect(model.cancel).toHaveBeenCalled()
    })
  })

  describe('moveSelectionPageDown', () => {
    it('dismisses the list if moveToCancel is true', () => {
      const model = {
        activeEditor: {
          getScreenLineCount: () => 42,
          moveDown () {}
        },
        cancel () {}
      }
      spyOn(model.activeEditor, 'moveDown')
      spyOn(model, 'cancel')
      spyOn(suggestionListElement, 'visibleItems').and.returnValue(['a'])

      suggestionListElement.model = model
      suggestionListElement.moveToCancel = true

      suggestionListElement.moveSelectionPageDown()

      expect(model.activeEditor.moveDown).toHaveBeenCalledWith(42)
      expect(model.cancel).toHaveBeenCalled()
    })
  })

  describe('moveSelectionToTop', () => {
    it('dismisses the list if moveToCancel is true', () => {
      const model = {
        activeEditor: {
          moveToTop () {}
        },
        cancel () {}
      }
      spyOn(model.activeEditor, 'moveToTop')
      spyOn(model, 'cancel')

      suggestionListElement.model = model
      suggestionListElement.moveToCancel = true

      suggestionListElement.moveSelectionToTop()

      expect(model.activeEditor.moveToTop).toHaveBeenCalled()
      expect(model.cancel).toHaveBeenCalled()
    })
  })

  describe('moveSelectionToBottom', () => {
    it('dismisses the list if moveToCancel is true', () => {
      const model = {
        activeEditor: {
          moveToBottom () {}
        },
        cancel () {}
      }
      spyOn(model.activeEditor, 'moveToBottom')
      spyOn(model, 'cancel')
      spyOn(suggestionListElement, 'visibleItems').and.returnValue(['a'])

      suggestionListElement.model = model
      suggestionListElement.moveToCancel = true

      suggestionListElement.moveSelectionToBottom()

      expect(model.activeEditor.moveToBottom).toHaveBeenCalled()
      expect(model.cancel).toHaveBeenCalled()
    })
  })
})
