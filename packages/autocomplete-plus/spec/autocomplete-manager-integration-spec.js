/* eslint-env jasmine */
/* eslint-disable no-template-curly-in-string */

const { TextEditor } = require('atom')
const {
  conditionPromise,
  timeoutPromise,
  triggerAutocompletion,
  waitForAutocomplete,
  waitForAutocompleteToDisappear,
  waitForDeferredSuggestions,
  buildIMECompositionEvent
} = require('./spec-helper')
let temp = require('temp').track()
const path = require('path')

let NodeTypeText = 3

describe('Autocomplete Manager', () => {
  let autocompleteManager, editor, editorView, gutterWidth, mainModule, workspaceElement

  let pixelLeftForBufferPosition = (bufferPosition) => {
    let gutter = editorView.querySelector('.gutter')
    if (!gutter) {
      gutter = editorView.shadowRoot.querySelector('.gutter')
    }

    gutterWidth = gutter.offsetWidth
    let left = editorView.pixelPositionForBufferPosition(bufferPosition).left
    left += editorView.offsetLeft
    left += gutterWidth
    left += Math.round(editorView.getBoundingClientRect().left)
    return `${Math.round(left)}px`
  }

  beforeEach(() => {
    atom.workspace.project.setPaths([path.join(__dirname, 'fixtures')]);
    jasmine.useRealClock()
    gutterWidth = null
    // Set to live completion
    atom.config.set('autocomplete-plus.enableAutoActivation', true)
    atom.config.set('editor.fontSize', '16')

    // Set the completion delay
    atom.config.set('autocomplete-plus.autoActivationDelay', 100)

    workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)

    atom.config.set('autocomplete-plus.maxVisibleSuggestions', 10)
    atom.config.set('autocomplete-plus.consumeSuffix', true)
  })

  describe('when an external provider is registered', () => {
    let provider

    beforeEach(async () => {
      editor = await atom.workspace.open('')
      editorView = atom.views.getView(editor)
      mainModule = (await atom.packages.activatePackage('autocomplete-plus')).mainModule
      await conditionPromise(() => mainModule.autocompleteManager)

      provider = {
        scopeSelector: '*',
        inclusionPriority: 2,
        excludeLowerPriority: true,
        getSuggestions ({prefix}) {
          let list = ['ab', 'abc', 'abcd', 'abcde']
          return (list.map((text) => ({text})))
        }
      }
      mainModule.consumeProvider(provider, 3)
    })

    it("calls the provider's onDidInsertSuggestion method when it exists", async () => {
      provider.onDidInsertSuggestion = jasmine.createSpy()

      triggerAutocompletion(editor, true, 'a')
      await waitForAutocomplete(editor)

      let suggestion, triggerPosition
      let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
      atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')

      expect(provider.onDidInsertSuggestion).toHaveBeenCalled();

      ({editor, triggerPosition, suggestion} = provider.onDidInsertSuggestion.mostRecentCall.args[0])
      expect(editor).toBe(editor)
      expect(triggerPosition).toEqual([0, 1])
      expect(suggestion.text).toBe('ab')
    })

    it('closes the suggestion list when saving', async () => {
      let directory = temp.mkdirSync()
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

      editor.insertText('a')
      await waitForAutocomplete(editor)

      await new Promise((resolve) => {
        editor.getBuffer().onDidSave(() => {
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
          resolve()
        })

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        editor.saveAs(path.join(directory, 'spec', 'tmp', 'issue-11.js'))
      })
    })

    it('does not show suggestions after a word has been confirmed', async () => {
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      for (let i = 0; i < 'red'.length; i++) { let c = 'red'[i]; editor.insertText(c) }
      await waitForAutocomplete(editor)

      expect(editorView.querySelector('.autocomplete-plus')).toExist()
      atom.commands.dispatch(editorView, 'autocomplete-plus:confirm')
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
    })

    it('works after closing one of the copied tabs', async () => {
      atom.workspace.paneForItem(editor).splitRight({copyActiveItem: true})
      atom.workspace.getActivePane().destroy()

      editor.insertNewline()
      editor.insertText('f')

      await waitForAutocomplete(editor)

      expect(editorView.querySelector('.autocomplete-plus')).toExist()
    })

    it('closes the suggestion list when entering an empty string (e.g. carriage return)', async () => {
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      editor.insertText('a')
      await waitForAutocomplete(editor)

      expect(editorView.querySelector('.autocomplete-plus')).toExist()
      editor.insertText('\r')
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
    })

    it('it refocuses the editor after pressing enter', async () => {
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      editor.insertText('a')
      await waitForAutocomplete(editor)

      expect(editorView.querySelector('.autocomplete-plus')).toExist()
      editor.insertText('\n')
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      expect(editorView).toHaveFocus()
    })

    it('it hides the suggestion list when the user keeps typing', async () => {
      spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => ['acd', 'ade'].filter((t) => t.startsWith(prefix)).map((t) => ({text: t})))

      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

      // Trigger an autocompletion
      editor.moveToBottom()
      editor.insertText('a')
      await waitForAutocomplete(editor)

      expect(editorView.querySelector('.autocomplete-plus')).toExist()

      editor.insertText('b')
      await waitForAutocompleteToDisappear(editor)
    })

    it('does not show the suggestion list when pasting', async () => {
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      editor.insertText('red')
      await waitForAutocompleteToDisappear(editor)
    })

    it('only shows for the editor that currently has focus', async () => {
      let editor2 = atom.workspace.paneForItem(editor).splitRight({copyActiveItem: true}).getActiveItem()
      let editorView2 = atom.views.getView(editor2)
      editorView.focus()

      expect(editorView).toHaveFocus()
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

      expect(editorView2).not.toHaveFocus()
      expect(editorView2.querySelector('.autocomplete-plus')).not.toExist()

      editor.insertText('r')

      expect(editorView).toHaveFocus()
      expect(editorView2).not.toHaveFocus()

      await waitForAutocomplete(editor)

      expect(editorView).toHaveFocus()
      expect(editorView2).not.toHaveFocus()

      expect(editorView.querySelector('.autocomplete-plus')).toExist()
      expect(editorView2.querySelector('.autocomplete-plus')).not.toExist()

      atom.commands.dispatch(editorView, 'autocomplete-plus:confirm')

      expect(editorView).toHaveFocus()
      expect(editorView2).not.toHaveFocus()

      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      expect(editorView2.querySelector('.autocomplete-plus')).not.toExist()
    })

    it('does not display empty suggestions', async () => {
      spyOn(provider, 'getSuggestions').andCallFake(() => {
        let list = ['ab', '', 'abcd', null]
        return (list.map((text) => ({text})))
      })

      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      editor.insertText('a')
      await waitForAutocomplete(editor)

      expect(editorView.querySelector('.autocomplete-plus')).toExist()
      expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(2)
    })

    describe('when the fileBlacklist option is set', () => {
      beforeEach(() => {
        atom.config.set('autocomplete-plus.fileBlacklist', ['.*', '*.md'])
        editor.getBuffer().setPath('blacklisted.md')
      })

      it('does not show suggestions when working with files that match the blacklist', async () => {
        editor.insertText('a')
        await waitForAutocompleteToDisappear(editor)
      })

      it('caches the blacklist result', async () => {
        spyOn(path, 'basename').andCallThrough()

        editor.insertText('a')
        editor.insertText('b')
        editor.insertText('c')

        await waitForAutocompleteToDisappear(editor)
        expect(path.basename.callCount).toBe(1)
      })

      it('shows suggestions when the path is changed to not match the blacklist', async () => {
        editor.insertText('a')

        await waitForAutocompleteToDisappear(editor)
        atom.commands.dispatch(editorView, 'autocomplete-plus:cancel')

        editor.getBuffer().setPath('not-blackslisted.txt')
        editor.insertText('a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:cancel')

        editor.getBuffer().setPath('blackslisted.md')
        editor.insertText('a')
        await waitForAutocompleteToDisappear(editor)
      })
    })

    describe('when filterSuggestions option is true', () => {
      beforeEach(() => {
        provider = {
          scopeSelector: '*',
          filterSuggestions: true,
          inclusionPriority: 3,
          excludeLowerPriority: true,

          getSuggestions ({prefix}) {
            let list = ['ab', 'abc', 'abcd', 'abcde']

            return (list.map((text) => ({text})))
          }
        }
        mainModule.consumeProvider(provider)
      })

      it('does not display empty suggestions', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => {
          let list = ['ab', '', 'abcd', null]
          return (list.map((text) => ({text})))
        })

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        editor.insertText('a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(2)
      })
    })

    describe('when the type option has a space in it', () =>
      it('does not display empty suggestions', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'ab', type: 'local function'}, {text: 'abc', type: ' another ~ function   '}])

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        editor.insertText('a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        let items = editorView.querySelectorAll('.autocomplete-plus li')
        expect(items).toHaveLength(2)
        expect(items[0].querySelector('.icon').className).toBe('icon local function')
        expect(items[1].querySelector('.icon').className).toBe('icon another ~ function')
      })
    )

    describe('when the className option has a space in it', () =>
      it('does not display empty suggestions', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'ab', className: 'local function'}, {text: 'abc', className: ' another  ~ function   '}])

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        editor.insertText('a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        let items = editorView.querySelectorAll('.autocomplete-plus li')
        expect(items[0].className).toBe('selected local function')
        expect(items[1].className).toBe('another ~ function')
      })
    )

    describe('when multiple cursors are defined', () => {
      it('autocompletes word when there is only a prefix', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'shift'}])

        editor.getBuffer().insert([0, 0], 's:extra:s')
        editor.setSelectedBufferRanges([[[0, 1], [0, 1]], [[0, 9], [0, 9]]])
        triggerAutocompletion(editor, false, 'h')

        await waitForAutocomplete(editor);

        ({ autocompleteManager } = mainModule)
        expect(editorView.querySelector('.autocomplete-plus')).toExist()

        atom.commands.dispatch(editorView, 'autocomplete-plus:confirm')

        expect(editor.lineTextForBufferRow(0)).toBe('shift:extra:shift')
        expect(editor.getCursorBufferPosition()).toEqual([0, 17])
        expect(editor.getLastSelection().getBufferRange()).toEqual({
          start: {
            row: 0,
            column: 17
          },
          end: {
            row: 0,
            column: 17
          }
        })

        expect(editor.getSelections().length).toEqual(2)
      })

      it('cancels the autocomplete when text differs between cursors', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [])

        editor.getBuffer().insert([0, 0], 's:extra:a')
        editor.setCursorBufferPosition([0, 1])
        editor.addCursorAtBufferPosition([0, 9])
        triggerAutocompletion(editor, false, 'h')

        ;({ autocompleteManager } = mainModule)
        editorView = atom.views.getView(editor)
        atom.commands.dispatch(editorView, 'autocomplete-plus:confirm')

        expect(editor.lineTextForBufferRow(0)).toBe('sh:extra:ah')
        expect(editor.getSelections().length).toEqual(2)
        expect(editor.getSelections()[0].getBufferRange()).toEqual([[0, 2], [0, 2]])
        expect(editor.getSelections()[1].getBufferRange()).toEqual([[0, 11], [0, 11]])

        await waitForAutocompleteToDisappear(editor)
      })
    })

    describe('suppression for editorView classes', () => {
      beforeEach(() => {
        atom.config.set(
          'autocomplete-plus.suppressActivationForEditorClasses',
          ['vim-mode.command-mode', 'vim-mode . visual-mode', ' vim-mode.operator-pending-mode ', ' ']
        )
      })

      it('should show the suggestion list when the suppression list does not match', async () => {
        editorView.classList.add('vim-mode')
        editorView.classList.add('insert-mode')

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
      })

      it('should not show the suggestion list when the suppression list does match', async () => {
        editorView.classList.add('vim-mode')
        editorView.classList.add('command-mode')

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await waitForAutocompleteToDisappear(editor)
      })

      it('should not show the suggestion list when the suppression list does match', async () => {
        editorView.classList.add('vim-mode')
        editorView.classList.add('operator-pending-mode')

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await waitForAutocompleteToDisappear(editor)
      })

      it('should not show the suggestion list when the suppression list does match', async () => {
        editorView.classList.add('vim-mode')
        editorView.classList.add('visual-mode')

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await waitForAutocompleteToDisappear(editor)
      })

      it('should show the suggestion list when the suppression list does not match', async () => {
        editorView.classList.add('vim-mode')
        editorView.classList.add('some-unforeseen-mode')

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
      })

      it('should show the suggestion list when the suppression list does not match', async () => {
        editorView.classList.add('command-mode')

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
      })
    })

    describe('prefix passed to getSuggestions', () => {
      let prefix = null
      let suggestionsPromise

      beforeEach(() => {
        let resolveSuggestionsPromise
        suggestionsPromise = new Promise(resolve => {
          resolveSuggestionsPromise = resolve
        })

        editor.setText('var something = abc')
        editor.setCursorBufferPosition([0, 10000])
        spyOn(provider, 'getSuggestions').andCallFake((options) => {
          prefix = options.prefix
          resolveSuggestionsPromise()
          return []
        })
      })

      it('calls with word prefix', async () => {
        editor.insertText('d')
        await suggestionsPromise

        expect(prefix).toBe('abcd')
      })

      it('calls with word prefix after punctuation', async () => {
        editor.insertText('d.okyea')
        editor.insertText('h')
        await suggestionsPromise

        expect(prefix).toBe('okyeah')
      })

      it('calls with word prefix containing a dash', async () => {
        editor.insertText('-okyea')
        editor.insertText('h')
        await suggestionsPromise

        expect(prefix).toBe('abc-okyeah')
      })

      it('calls with word prefix containing a number', async () => {
        editor.insertText('4ok')
        editor.insertText('5')
        await suggestionsPromise

        expect(prefix).toBe('abc4ok5')
      })

      it('calls with space character', async () => {
        editor.insertText(' ')
        await suggestionsPromise

        expect(prefix).toBe(' ')
      })

      it('calls with non-word prefix', async () => {
        editor.insertText(':')
        editor.insertText(':')
        await suggestionsPromise

        expect(prefix).toBe('::')
      })

      it('calls with non-word bracket', async () => {
        editor.insertText('[')
        await suggestionsPromise

        expect(prefix).toBe('[')
      })

      it('calls with dot prefix', async () => {
        editor.insertText('.')
        await suggestionsPromise

        expect(prefix).toBe('.')
      })

      it('calls with prefix after non \\b word break', async () => {
        editor.insertText('=""')
        editor.insertText(' ')
        await suggestionsPromise

        expect(prefix).toBe(' ')
      })

      it('calls with prefix after non \\b word break', async () => {
        editor.insertText('?')
        editor.insertText(' ')
        await suggestionsPromise

        expect(prefix).toBe(' ')
      })

      describe('providers using the 4.0 API', () => {
        it('accounts for word characters of the current language', async () => {
          let prefix = null
          const provider = {
            scopeSelector: '*',
            inclusionPriority: 2,
            excludeLowerPriority: true,
            getSuggestions ({prefix: p}) { prefix = p }
          }

          mainModule.consumeProvider(provider, 4)

          atom.config.set('editor.nonWordCharacters', '-')
          editor.insertText(' $foo-$ba')
          editor.insertText('r')
          await suggestionsPromise

          expect(prefix).toBe('$bar')
        })

        it('is an empty string when the cursor does not follow a word character', async () => {
          let prefix = null
          const provider = {
            scopeSelector: '*',
            inclusionPriority: 2,
            excludeLowerPriority: true,
            getSuggestions ({prefix: p}) { prefix = p }
          }

          mainModule.consumeProvider(provider, 4)
          editor.insertText(' foo')
          editor.insertText('.')
          await suggestionsPromise

          expect(prefix).toBe('')
        })
      })
    })

    describe('when the character entered is not at the cursor position', () => {
      it('does not show the suggestion list', async () => {
        editor.setText('some text ok')
        editor.setCursorBufferPosition([0, 7])

        let buffer = editor.getBuffer()
        buffer.setTextInRange([[0, 0], [0, 0]], 's')
        await waitForAutocompleteToDisappear(editor)
      })

      it('does not hide the suggestion list', async () => {
        editor.setText(
          '0\n' +
          '1\n'
        )
        editor.setCursorBufferPosition([2, 0])
        editor.insertText('2')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        editor.setTextInBufferRange([[0, 0], [0, 0]], '*')
        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        editor.setTextInBufferRange([[0, 0], [0, 0]], '\n')
        expect(editorView.querySelector('.autocomplete-plus')).toExist()
      })
    })

    describe('when number of suggestions > maxVisibleSuggestions', () => {
      beforeEach(() => {
        atom.config.set('autocomplete-plus.maxVisibleSuggestions', 2)
      })

      describe('when a suggestion description is not specified', () => {
        beforeEach(async () => {
          triggerAutocompletion(editor, true, 'a')
          await waitForAutocomplete(editor)
          await waitForDeferredSuggestions(editorView, 4)
        })

        it('scrolls the list always showing the selected item', async () => {
          expect(editorView.querySelector('.autocomplete-plus')).toExist()
          let itemHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus li')).height)

          let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          let scroller = suggestionList.querySelector('.suggestion-list-scroller')

          expect(scroller.scrollTop).toBe(0)
          atom.commands.dispatch(suggestionList, 'core:move-down')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[1]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(0)

          atom.commands.dispatch(suggestionList, 'core:move-down')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[2]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight)

          atom.commands.dispatch(suggestionList, 'core:move-down')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight * 2)

          atom.commands.dispatch(suggestionList, 'core:move-down')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(0)

          atom.commands.dispatch(suggestionList, 'core:move-up')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight * 2)

          atom.commands.dispatch(suggestionList, 'core:move-up')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[2]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight * 2)

          atom.commands.dispatch(suggestionList, 'core:move-up')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[1]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight)

          atom.commands.dispatch(suggestionList, 'core:move-up')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(0)
        })

        it('pages up and down when core:page-up and core:page-down are used', () => {
          let itemHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus li')).height)
          let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          let scroller = suggestionList.querySelector('.suggestion-list-scroller')
          expect(scroller.scrollTop).toBe(0)

          atom.commands.dispatch(suggestionList, 'core:page-down')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[2]).toHaveClass('selected')

          atom.commands.dispatch(suggestionList, 'core:page-down')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')

          atom.commands.dispatch(suggestionList, 'core:page-down')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight * 2)

          atom.commands.dispatch(suggestionList, 'core:page-up')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[1]).toHaveClass('selected')

          atom.commands.dispatch(suggestionList, 'core:page-up')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')

          atom.commands.dispatch(suggestionList, 'core:page-up')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(0)
        })

        it('moves to the top and bottom when core:move-to-top and core:move-to-bottom are used', () => {
          let itemHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus li')).height)
          let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          let scroller = suggestionList.querySelector('.suggestion-list-scroller')
          expect(scroller.scrollTop).toBe(0)

          atom.commands.dispatch(suggestionList, 'core:move-to-bottom')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight * 2)

          atom.commands.dispatch(suggestionList, 'core:move-to-bottom')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(itemHeight * 2)

          atom.commands.dispatch(suggestionList, 'core:move-to-top')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(0)

          atom.commands.dispatch(suggestionList, 'core:move-to-top')
          expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')
          expect(scroller.scrollTop).toBe(0)
        })

        it('only shows the maxVisibleSuggestions in the suggestion popup', () => {
          expect(editorView.querySelector('.autocomplete-plus')).toExist()
          let itemHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus li')).height)
          expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(4)

          let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          expect(suggestionList.offsetHeight).toBe(2 * itemHeight)
          expect(suggestionList.querySelector('.suggestion-list-scroller').style['max-height']).toBe(`${2 * itemHeight}px`)
        })
      })

      describe('when a suggestion description is specified', () => {
        it('shows the maxVisibleSuggestions in the suggestion popup, but with extra height for the description', async () => {
          spyOn(provider, 'getSuggestions').andCallFake(() => {
            let list = ['ab', 'abc', 'abcd', 'abcde']
            return (list.map((text) => ({text, description: `${text} yeah ok`})))
          })

          triggerAutocompletion(editor, true, 'a')
          await waitForAutocomplete(editor)
          await waitForDeferredSuggestions(editorView, 4)

          expect(editorView.querySelector('.autocomplete-plus')).toExist()
          let itemHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus li')).height)
          expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(4)

          let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          let descriptionHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus .suggestion-description')).height)
          expect(suggestionList.offsetHeight).toBe((2 * itemHeight) + descriptionHeight)
          expect(suggestionList.querySelector('.suggestion-list-scroller').style['max-height']).toBe(`${2 * itemHeight}px`)
        })

        it('parses markdown in the description', async () => {
          spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => {
            let list = [
              {text: 'ab', descriptionMarkdown: '**mmmmmmmmmmmmmmmmmmmmmmmmmm**'},
              {text: 'abc', descriptionMarkdown: '**mmmmmmmmmmmmmmmmmmmmmm**'},
              {text: 'abcd', descriptionMarkdown: '**mmmmmmmmmmmmmmmmmm**'},
              {text: 'abcde', descriptionMarkdown: '**mmmmmmmmmmmmmm**'}
            ]
            return (list.filter((item) => item.text.startsWith(prefix)).map((item) => item))
          })

          triggerAutocompletion(editor, true, 'a')
          await waitForAutocomplete(editor)
          await waitForDeferredSuggestions(editorView, 4)

          let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          expect(suggestionList).toExist()

          expect(editorView.querySelector('.autocomplete-plus .suggestion-description strong').textContent).toEqual('mmmmmmmmmmmmmmmmmmmmmmmmmm')

          editor.insertText('b')
          editor.insertText('c')
          await waitForAutocomplete(editor)

          suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          expect(suggestionList).toExist()

          expect(editorView.querySelector('.autocomplete-plus .suggestion-description strong').textContent).toEqual('mmmmmmmmmmmmmmmmmmmmmm')
        })

        it('adjusts the width when the description changes', async () => {
          let listWidth = null
          spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => {
            let list = [
              {text: 'ab', description: 'mmmmmmmmmmmmmmmmmmmmmmmmmm'},
              {text: 'abc', description: 'mmmmmmmmmmmmmmmmmmmmmm'},
              {text: 'abcd', description: 'mmmmmmmmmmmmmmmmmm'},
              {text: 'abcde', description: 'mmmmmmmmmmmmmm'}
            ]
            return (list.filter((item) => item.text.startsWith(prefix)).map((item) => item))
          })

          triggerAutocompletion(editor, true, 'a')
          await waitForAutocomplete(editor)
          await waitForDeferredSuggestions(editorView, 4)

          let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          expect(suggestionList).toExist()

          listWidth = parseInt(suggestionList.style.width)
          expect(listWidth).toBeGreaterThan(0)

          editor.insertText('b')
          editor.insertText('c')
          await waitForAutocomplete(editor)

          suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          expect(suggestionList).toExist()

          let newWidth = parseInt(suggestionList.style.width)
          expect(newWidth).toBeGreaterThan(0)
          expect(newWidth).toBeLessThan(listWidth)
        })
      })
    })

    describe('when useCoreMovementCommands is toggled', () => {
      let [suggestionList] = []

      beforeEach(async () => {
        triggerAutocompletion(editor, true, 'a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
      })

      it('binds to custom commands when unset, and binds back to core commands when set', () => {
        atom.commands.dispatch(suggestionList, 'core:move-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[1]).toHaveClass('selected')

        atom.config.set('autocomplete-plus.useCoreMovementCommands', false)

        atom.commands.dispatch(suggestionList, 'core:move-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[1]).toHaveClass('selected')
        atom.commands.dispatch(suggestionList, 'autocomplete-plus:move-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[2]).toHaveClass('selected')

        atom.config.set('autocomplete-plus.useCoreMovementCommands', true)

        atom.commands.dispatch(suggestionList, 'autocomplete-plus:move-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[2]).toHaveClass('selected')
        atom.commands.dispatch(suggestionList, 'core:move-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')
      })
    })

    describe('when useCoreMovementCommands is false', () => {
      let [suggestionList] = []

      beforeEach(async () => {
        atom.config.set('autocomplete-plus.useCoreMovementCommands', false)
        triggerAutocompletion(editor, true, 'a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
      })

      it('responds to all the custom movement commands and to no core commands', () => {
        atom.commands.dispatch(suggestionList, 'core:move-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')

        atom.commands.dispatch(suggestionList, 'autocomplete-plus:move-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[1]).toHaveClass('selected')

        atom.commands.dispatch(suggestionList, 'autocomplete-plus:move-up')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')

        atom.commands.dispatch(suggestionList, 'autocomplete-plus:page-down')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).not.toHaveClass('selected')

        atom.commands.dispatch(suggestionList, 'autocomplete-plus:page-up')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')

        atom.commands.dispatch(suggestionList, 'autocomplete-plus:move-to-bottom')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[3]).toHaveClass('selected')

        atom.commands.dispatch(suggestionList, 'autocomplete-plus:move-to-top')
        expect(editorView.querySelectorAll('.autocomplete-plus li')[0]).toHaveClass('selected')
      })
    })

    describe('when match.snippet is used', () => {
      beforeEach(() => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => {
          let list = ['method(${1:something})', 'method2(${1:something})', 'method3(${1:something})', 'namespace\\\\method4(${1:something})']
          return (list.map((snippet) => ({snippet, replacementPrefix: prefix})))
        })
      })

      describe('when the snippets package is enabled', () => {
        beforeEach(() => atom.packages.activatePackage('snippets'))

        it('displays the snippet without the `${1:}` in its own class', async () => {
          triggerAutocompletion(editor, true, 'm')
          await waitForAutocomplete(editor)

          let wordElement = editorView.querySelector('.autocomplete-plus span.word')
          expect(wordElement.textContent).toBe('method(something)')
          expect(wordElement.querySelector('.snippet-completion').textContent).toBe('something')

          let wordElements = editorView.querySelectorAll('.autocomplete-plus span.word')
          expect(wordElements).toHaveLength(4)
        })

        it('accepts the snippet when autocomplete-plus:confirm is triggered', async () => {
          triggerAutocompletion(editor, true, 'm')
          await waitForAutocomplete(editor)

          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
          expect(editor.getSelectedText()).toBe('something')
        })

        it('escapes \\ in list to match snippet behavior', async () => {
          triggerAutocompletion(editor, true, 'm')
          await waitForAutocomplete(editor)

          // Value in list
          let wordElements = editorView.querySelectorAll('.autocomplete-plus span.word')
          expect(wordElements).toHaveLength(4)
          expect(wordElements[3].textContent).toBe('namespace\\method4(something)')

          // Select last item
          atom.commands.dispatch(editorView, 'core:move-up')

          // Value in editor
          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
          expect(editor.getText()).toBe('namespace\\method4(something)')
        })
      })
    })

    describe('when the matched prefix is highlighted', () => {
      it('highlights the prefix of the word in the suggestion list', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => [{text: 'items', replacementPrefix: prefix}])

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('i')
        editor.insertText('e')
        editor.insertText('m')

        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()

        let word = editorView.querySelector('.autocomplete-plus li span.word')
        expect(word.childNodes).toHaveLength(5)
        expect(word.childNodes[0]).toHaveClass('character-match')
        expect(word.childNodes[1].nodeType).toBe(NodeTypeText)
        expect(word.childNodes[2]).toHaveClass('character-match')
        expect(word.childNodes[3]).toHaveClass('character-match')
        expect(word.childNodes[4].nodeType).toBe(NodeTypeText)
      })

      it('highlights repeated characters in the prefix', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => [{text: 'apply', replacementPrefix: prefix}])

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('a')
        editor.insertText('p')
        editor.insertText('p')

        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()

        let word = editorView.querySelector('.autocomplete-plus li span.word')
        expect(word.childNodes).toHaveLength(4)
        expect(word.childNodes[0]).toHaveClass('character-match')
        expect(word.childNodes[1]).toHaveClass('character-match')
        expect(word.childNodes[2]).toHaveClass('character-match')
        expect(word.childNodes[3].nodeType).toBe(3) // text
        expect(word.childNodes[3].textContent).toBe('ly')
      })

      describe('when the prefix does not match the word', () => {
        it('does not render any character-match spans', async () => {
          spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => [{text: 'omgnope', replacementPrefix: prefix}])

          editor.moveToBottom()
          editor.insertText('x')
          editor.insertText('y')
          editor.insertText('z')

          await waitForAutocomplete(editor)

          expect(editorView.querySelector('.autocomplete-plus')).toExist()

          let characterMatches = editorView.querySelectorAll('.autocomplete-plus li span.word .character-match')
          let text = editorView.querySelector('.autocomplete-plus li span.word').textContent
          expect(characterMatches).toHaveLength(0)
          expect(text).toBe('omgnope')
        })

        describe('when the snippets package is enabled', () => {
          beforeEach(() => atom.packages.activatePackage('snippets'))

          it('does not highlight the snippet html; ref issue 301', async () => {
            spyOn(provider, 'getSuggestions').andCallFake(() => [{snippet: 'ab(${1:c})c'}])

            editor.moveToBottom()
            editor.insertText('c')
            await waitForAutocomplete(editor)

            let word = editorView.querySelector('.autocomplete-plus li span.word')
            let charMatch = editorView.querySelector('.autocomplete-plus li span.word .character-match')
            expect(word.textContent).toBe('ab(c)c')
            expect(charMatch.textContent).toBe('c')
            expect(charMatch.parentNode).toHaveClass('snippet-completion')
          })

          it('does not highlight the snippet html when highlight beginning of the word', async () => {
            spyOn(provider, 'getSuggestions').andCallFake(() => [{snippet: 'abcde(${1:e}, ${1:f})f'}])

            editor.moveToBottom()
            editor.insertText('c')
            editor.insertText('e')
            editor.insertText('f')
            await waitForAutocomplete(editor)

            let word = editorView.querySelector('.autocomplete-plus li span.word')
            expect(word.textContent).toBe('abcde(e, f)f')

            let charMatches = editorView.querySelectorAll('.autocomplete-plus li span.word .character-match')
            expect(charMatches[0].textContent).toBe('c')
            expect(charMatches[0].parentNode).toHaveClass('word')
            expect(charMatches[1].textContent).toBe('e')
            expect(charMatches[1].parentNode).toHaveClass('word')
            expect(charMatches[2].textContent).toBe('f')
            expect(charMatches[2].parentNode).toHaveClass('snippet-completion')
          })
        })
      })
    })

    describe('when a replacementPrefix is not specified', () => {
      beforeEach(() => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'something'}])
      })

      it('replaces with the default input prefix', async () => {
        editor.insertText('abc')
        triggerAutocompletion(editor, false, 'm')
        await waitForAutocomplete(editor)

        expect(editor.getText()).toBe('abcm')

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
        expect(editor.getText()).toBe('something')
      })

      it('does not replace non-word prefixes with the chosen suggestion', async () => {
        editor.insertText('abc')
        editor.insertText('.')
        await waitForAutocomplete(editor)

        expect(editor.getText()).toBe('abc.')

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
        expect(editor.getText()).toBe('abc.something')
      })

      describe('providers using the 4.0 API', () => {
        it('replaces the entire prefix by default, regardless of the characters it contains', async () => {
          atom.config.set('editor.nonWordCharacters', '-')
          provider = {
            scopeSelector: '*',
            inclusionPriority: 100,
            excludeLowerPriority: true,
            getSuggestions ({prefix}) {
              return [{
                text: '$food'
              }]
            }
          }
          mainModule.consumeProvider(provider, 4)

          editor.setText('')
          editor.insertText('$food $fo')
          editor.insertText('o')
          await waitForAutocomplete(editor)

          expect(editorView.querySelector('.autocomplete-plus')).toExist()
          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
          expect(editor.getText()).toBe('$food $food')
        })
      })
    })

    describe('when a replacementPrefix is not specified, but updated multiple times', () => {
      // First test checks if suggestion did not have replacementPrefix, isPrefixModified is set.
      // Second test checks that reused suggestion will still be selected with different prefix.

      // Mutable suggestion
      let suggestion = {text: 'something'}

      beforeEach(() => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [suggestion])
      })

      it('adds isPrefixModified the first time suggestion is shown', async () => {
        editor.insertText('so')
        triggerAutocompletion(editor, false, 'm')
        await waitForAutocomplete(editor)

        let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
        expect(editor.getText()).toBe('something')
        expect(suggestion.replacementPrefix).toBe('som')
        expect(suggestion.isPrefixModified).toBe(true)
      })

      it('updates replacementPrefix when returning the same suggestion', async () => {
        editor.insertText('some')
        triggerAutocompletion(editor, false, 't')
        await waitForAutocomplete(editor)

        let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
        expect(editor.getText()).toBe('something')
        expect(suggestion.replacementPrefix).toBe('somet')
        expect(suggestion.isPrefixModified).toBe(true)
      })
    })

    describe("when autocomplete-plus.suggestionListFollows is 'Cursor'", () => {
      beforeEach(() => {
        atom.config.set('autocomplete-plus.suggestionListFollows', 'Cursor')
      })

      it('places the suggestion list at the cursor', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ab', leftLabel: 'void'}, {text: 'abc', leftLabel: 'void'}])

        editor.insertText('omghey ab')
        triggerAutocompletion(editor, false, 'c')
        await waitForAutocomplete(editor)

        let overlayElement = editorView.querySelector('.autocomplete-plus')
        expect(overlayElement).toExist()
        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 10]))

        let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        expect(suggestionList.style['margin-left']).toBeFalsy()
      })

      it('closes the suggestion list if the user keeps typing', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => ['acd', 'ade'].filter((t) => t.startsWith(prefix)).map((t) => ({text: t})))

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        // Trigger an autocompletion
        editor.moveToBottom()
        editor.insertText('a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()

        editor.insertText('b')
        await waitForAutocompleteToDisappear(editor)
      })

      it('keeps the suggestion list visible if the user keeps typing', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => ['acd', 'ade'].filter((t) => t.startsWith(prefix)).map((t) => ({text: t})))

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        // Trigger an autocompletion
        editor.moveToBottom()
        editor.insertText('a')
        await waitForAutocomplete(editor)

        editor.insertText('c')
        await waitForAutocomplete(editor)
      })
    })

    describe("when autocomplete-plus.suggestionListFollows is 'Word'", () => {
      beforeEach(() => {
        atom.config.set('autocomplete-plus.suggestionListFollows', 'Word')
      })

      it('opens to the correct position, and correctly closes on cancel', async () => {
        editor.insertText('xxxxxxxxxxx ab')
        triggerAutocompletion(editor, false, 'c')
        await waitForAutocomplete(editor)

        let overlayElement = editorView.querySelector('.autocomplete-plus')
        expect(overlayElement).toExist()
        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 12]))
      })

      it('displays the suggestion list taking into account the passed back replacementPrefix', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(options => [{text: '::before', replacementPrefix: '::', leftLabel: 'void'}])

        editor.insertText('xxxxxxxxxxx ab:')
        triggerAutocompletion(editor, false, ':')
        await waitForAutocomplete(editor)

        let overlayElement = editorView.querySelector('.autocomplete-plus')
        expect(overlayElement).toExist()
        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 14]))
      })

      it('displays the suggestion list with a negative margin to align the prefix with the word-container', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ab', leftLabel: 'void'}, {text: 'abc', leftLabel: 'void'}])

        editor.insertText('omghey ab')
        triggerAutocompletion(editor, false, 'c')
        await waitForAutocomplete(editor)

        let suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        let wordContainer = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list .word-container')
        let marginLeft = parseInt(suggestionList.style['margin-left'])
        expect(Math.abs(wordContainer.offsetLeft + marginLeft)).toBeLessThan(2)
      })

      it('keeps the suggestion list planted at the beginning of the prefix when typing', async () => {
        let overlayElement = null
        // Lots of x's to keep the margin offset away from the left of the window
        // See https://github.com/atom/autocomplete-plus/issues/399
        editor.insertText('xxxxxxxxxx xx')
        editor.insertText(' ')
        await waitForAutocomplete(editor)

        overlayElement = editorView.querySelector('.autocomplete-plus')
        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 14]))
        editor.insertText('a')
        await waitForAutocomplete(editor)

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 14]))

        editor.insertText('b')
        await waitForAutocomplete(editor)

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 14]))

        editor.backspace()
        editor.backspace()
        await waitForAutocomplete(editor)

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 14]))

        editor.backspace()
        await waitForAutocomplete(editor)

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 12]))

        editor.insertText(' ')
        editor.insertText('a')
        editor.insertText('b')
        editor.insertText('c')
        await waitForAutocomplete(editor)

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 14]))
      })

      it('when broken by a non-word character, the suggestion list is positioned at the beginning of the new word', async () => {
        let overlayElement = null
        editor.insertText('xxxxxxxxxxx')
        editor.insertText(' abc')
        editor.insertText('d')
        await waitForAutocomplete(editor)

        overlayElement = editorView.querySelector('.autocomplete-plus')

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 12]))

        editor.insertText(' ')
        editor.insertText('a')
        editor.insertText('b')
        await waitForAutocomplete(editor)

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 17]))

        editor.backspace()
        editor.backspace()
        editor.backspace()
        await waitForAutocomplete(editor)

        expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 12]))
      })
    })

    describe('accepting suggestions', () => {
      beforeEach(() => {
        editor.setText('ok then ')
        editor.setCursorBufferPosition([0, 20])
      })

      it('hides the suggestions list when a suggestion is confirmed', async () => {
        triggerAutocompletion(editor, false, 'a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()

        // Accept suggestion
        let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      })

      describe('when the replacementPrefix is empty', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'someMethod()', replacementPrefix: ''}])
        })

        it('will insert the text without replacing anything', async () => {
          editor.insertText('a')
          triggerAutocompletion(editor, false, '.')
          await waitForAutocomplete(editor)

          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')

          expect(editor.getText()).toBe('ok then a.someMethod()')
        })
      })

      describe('when the alternate keyboard integration is used', () => {
        beforeEach(() => atom.config.set('autocomplete-plus.confirmCompletion', 'tab always, enter when suggestion explicitly selected'))

        it('inserts the word on tab and moves the cursor to the end of the word', async () => {
          triggerAutocompletion(editor, false, 'a')
          await waitForAutocomplete(editor)

          let key = atom.keymaps.constructor.buildKeydownEvent('tab', {target: document.activeElement})
          atom.keymaps.handleKeyboardEvent(key)

          expect(editor.getText()).toBe('ok then ab')

          let bufferPosition = editor.getCursorBufferPosition()
          expect(bufferPosition.row).toEqual(0)
          expect(bufferPosition.column).toEqual(10)
        })

        it('does not insert the word on enter', async () => {
          triggerAutocompletion(editor, false, 'a')
          await waitForAutocomplete(editor)

          let key = atom.keymaps.constructor.buildKeydownEvent('enter', {keyCode: 13, target: document.activeElement})
          atom.keymaps.handleKeyboardEvent(key)
          expect(editor.getText()).toBe('ok then a\n')
        })

        it('inserts the word on enter after the selection has been changed and moves the cursor to the end of the word', async () => {
          triggerAutocompletion(editor, false, 'a')
          await waitForAutocomplete(editor)

          editorView = atom.views.getView(editor)
          atom.commands.dispatch(editorView, 'core:move-down')
          let key = atom.keymaps.constructor.buildKeydownEvent('enter', {keyCode: 13, target: document.activeElement})
          atom.keymaps.handleKeyboardEvent(key)

          expect(editor.getText()).toBe('ok then abc')

          let bufferPosition = editor.getCursorBufferPosition()
          expect(bufferPosition.row).toEqual(0)
          expect(bufferPosition.column).toEqual(11)
        })
      })

      describe('when tab is used to accept suggestions', () => {
        beforeEach(() => atom.config.set('autocomplete-plus.confirmCompletion', 'tab'))

        it('inserts the word and moves the cursor to the end of the word', async () => {
          triggerAutocompletion(editor, false, 'a')
          await waitForAutocomplete(editor)

          let key = atom.keymaps.constructor.buildKeydownEvent('tab', {target: document.activeElement})
          atom.keymaps.handleKeyboardEvent(key)

          expect(editor.getText()).toBe('ok then ab')

          let bufferPosition = editor.getCursorBufferPosition()
          expect(bufferPosition.row).toEqual(0)
          expect(bufferPosition.column).toEqual(10)
        })

        it('does not insert the word when enter completion not enabled', async () => {
          triggerAutocompletion(editor, false, 'a')
          await waitForAutocomplete(editor)

          let key = atom.keymaps.constructor.buildKeydownEvent('enter', {keyCode: 13, target: document.activeElement})
          atom.keymaps.handleKeyboardEvent(key)
          expect(editor.getText()).toBe('ok then a\n')
        })
      })

      describe('when enter is used to accept suggestions', () => {
        beforeEach(() => atom.config.set('autocomplete-plus.confirmCompletion', 'enter'))

        it('inserts the word and moves the cursor to the end of the word', async () => {
          triggerAutocompletion(editor, false, 'a')
          await waitForAutocomplete(editor)

          let key = atom.keymaps.constructor.buildKeydownEvent('enter', {target: document.activeElement})
          atom.keymaps.handleKeyboardEvent(key)

          expect(editor.getText()).toBe('ok then ab')

          let bufferPosition = editor.getCursorBufferPosition()
          expect(bufferPosition.row).toEqual(0)
          expect(bufferPosition.column).toEqual(10)
        })

        it('does not insert the word when tab completion not enabled', async () => {
          triggerAutocompletion(editor, false, 'a')
          await waitForAutocomplete(editor)

          let key = atom.keymaps.constructor.buildKeydownEvent('tab', {keyCode: 13, target: document.activeElement})
          atom.keymaps.handleKeyboardEvent(key)
          expect(editor.getText()).toBe('ok then a ')
        })
      })

      describe('when a suffix of the replacement matches the text after the cursor', () => {
        it('overwrites that existing text with the replacement', async () => {
          spyOn(provider, 'getSuggestions').andCallFake(() => [
            {text: 'oneomgtwo', replacementPrefix: 'one'}
          ])

          editor.setText('ontwothree')
          editor.setCursorBufferPosition([0, 2])
          triggerAutocompletion(editor, false, 'e')
          await waitForAutocomplete(editor)

          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')

          expect(editor.getText()).toBe('oneomgtwothree')
        })

        it('does not overwrite any text if the "consumeSuffix" setting is disabled', async () => {
          spyOn(provider, 'getSuggestions').andCallFake(() => [
            {text: 'oneomgtwo', replacementPrefix: 'one'}
          ])

          atom.config.set('autocomplete-plus.consumeSuffix', false)

          editor.setText('ontwothree')
          editor.setCursorBufferPosition([0, 2])
          triggerAutocompletion(editor, false, 'e')
          await waitForAutocomplete(editor)

          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')

          expect(editor.getText()).toBe('oneomgtwotwothree')
        })

        it('does not overwrite non-word characters', async () => {
          spyOn(provider, 'getSuggestions').andCallFake(() => [
            {text: 'oneomgtwo()', replacementPrefix: 'one'}
          ])

          editor.setText('(on)three')
          editor.setCursorBufferPosition([0, 3])
          triggerAutocompletion(editor, false, 'e')
          await waitForAutocomplete(editor)

          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')

          expect(editor.getText()).toBe('(oneomgtwo())three')
        })
      })

      describe('when the cursor suffix does not match the replacement', () => {
        beforeEach(() =>
          spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'oneomgTwo', replacementPrefix: 'one'}]))

        it('replaces the suffix with the replacement', async () => {
          editor.setText('ontwothree')
          editor.setCursorBufferPosition([0, 2])
          triggerAutocompletion(editor, false, 'e')
          await waitForAutocomplete(editor)

          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')

          expect(editor.getText()).toBe('oneomgTwotwothree')
        })
      })
    })

    describe('when auto-activation is disabled', () => {
      beforeEach(() => {
        atom.config.set('autocomplete-plus.enableAutoActivation', false)
      })

      it('does not show suggestions after a delay', async () => {
        triggerAutocompletion(editor)
        await timeoutPromise(100)
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      })

      it('shows suggestions when explicitly triggered', async () => {
        triggerAutocompletion(editor)
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:activate')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
      })

      it('stays open when typing', async () => {
        triggerAutocompletion(editor, false, 'a')
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:activate')
        await waitForAutocomplete(editor)

        editor.insertText('b')
        expect(editorView.querySelector('.autocomplete-plus')).toExist()
      })

      it('accepts the suggestion if there is one', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'omgok'}])

        triggerAutocompletion(editor)
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:activate')
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        expect(editor.getText()).toBe('omgok')
      })

      it('does not accept the suggestion if the event detail is activatedManually: false', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'omgok'}])

        triggerAutocompletion(editor)
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:activate', {activatedManually: false})
        await waitForAutocomplete(editor)
      })

      it('does not accept the suggestion if auto-confirm single suggestion is disabled', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'omgok'}])

        triggerAutocompletion(editor)
        await timeoutPromise(100)

        atom.config.set('autocomplete-plus.enableAutoConfirmSingleSuggestion', false)
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:activate')
        await waitForAutocomplete(editor)
      })

      it('includes the correct value for activatedManually when explicitly triggered', async () => {
        let receivedOptions
        spyOn(provider, 'getSuggestions').andCallFake((options) => {
          receivedOptions = options
          return [{text: 'omgok'}, {text: 'ahgok'}]
        })

        triggerAutocompletion(editor)
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:activate')
        await waitForAutocomplete(editor)

        expect(receivedOptions).toBeDefined()
        expect(receivedOptions.activatedManually).toBe(true)
      })

      it('does not auto-accept a single suggestion when filtering', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) => {
          let list = []
          if ('a'.indexOf(prefix) === 0) { list.push('a') }
          if ('abc'.indexOf(prefix) === 0) { list.push('abc') }
          return (list.map((t) => ({text: t})))
        })

        editor.insertText('a')
        atom.commands.dispatch(editorView, 'autocomplete-plus:activate')
        await waitForAutocomplete(editor)

        expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(2)

        editor.insertText('b')
        await waitForAutocomplete(editor)
      })
    })

    describe('when the replacementPrefix doesnt match the actual prefix', () => {
      describe('when snippets are not used', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'something', replacementPrefix: 'bcm'}])
        })

        it('only replaces the suggestion at cursors whos prefix matches the replacementPrefix', async () => {
          editor.setText(`abc abc
def`
          )
          editor.setCursorBufferPosition([0, 3])
          editor.addCursorAtBufferPosition([0, 7])
          editor.addCursorAtBufferPosition([1, 3])
          triggerAutocompletion(editor, false, 'm')
          await waitForAutocomplete(editor)

          expect(editorView.querySelector('.autocomplete-plus')).toExist()
          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
          expect(editor.getText()).toBe(`asomething asomething
defm`
          )
        })
      })

      describe('when snippets are used', () => {
        beforeEach(async () => {
          spyOn(provider, 'getSuggestions').andCallFake(() => [{snippet: 'ok(${1:omg})', replacementPrefix: 'bcm'}])
          await atom.packages.activatePackage('snippets')
        })

        it('only replaces the suggestion at cursors whos prefix matches the replacementPrefix', async () => {
          editor.setText(`abc abc
def`
          )
          editor.setCursorBufferPosition([0, 3])
          editor.addCursorAtBufferPosition([0, 7])
          editor.addCursorAtBufferPosition([1, 3])
          triggerAutocompletion(editor, false, 'm')
          await waitForAutocomplete(editor)

          expect(editorView.querySelector('.autocomplete-plus')).toExist()
          let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm')
          expect(editor.getText()).toBe(`aok(omg) aok(omg)
defm`
          )
        })
      })
    })

    describe('select-previous event', () => {
      it('selects the previous item in the list', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'ab'}, {text: 'abc'}, {text: 'abcd'}])

        triggerAutocompletion(editor, false, 'a')
        await waitForAutocomplete(editor)
        let items = editorView.querySelectorAll('.autocomplete-plus li')
        expect(items[0]).toHaveClass('selected')
        expect(items[1]).not.toHaveClass('selected')
        expect(items[2]).not.toHaveClass('selected')

        // Select previous item
        atom.commands.dispatch(editorView, 'core:move-up')

        items = editorView.querySelectorAll('.autocomplete-plus li')
        expect(items[0]).not.toHaveClass('selected')
        expect(items[1]).not.toHaveClass('selected')
        expect(items[2]).toHaveClass('selected')
      })

      it('closes the autocomplete when up arrow pressed when only one item displayed', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) =>
          [{text: 'quicksort'}, {text: 'quack'}].filter(val => val.text.startsWith(prefix))
        )

        editor.insertText('q')
        editor.insertText('u')
        await waitForAutocomplete(editor)

        // two items displayed, should not close
        atom.commands.dispatch(editorView, 'core:move-up')
        await timeoutPromise(1)

        let autocomplete = editorView.querySelector('.autocomplete-plus')
        expect(autocomplete).toExist()

        editor.insertText('a')
        await waitForAutocomplete(editor)

        autocomplete = editorView.querySelector('.autocomplete-plus')
        expect(autocomplete).toExist()

        // one item displayed, should close
        atom.commands.dispatch(editorView, 'core:move-up')
        await timeoutPromise(1)

        autocomplete = editorView.querySelector('.autocomplete-plus')
        expect(autocomplete).not.toExist()
      })

      it('does not close the autocomplete when up arrow pressed with multiple items displayed but triggered on one item', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(({prefix}) =>
          [{text: 'quicksort'}, {text: 'quack'}].filter(val => val.text.startsWith(prefix))
        )

        editor.insertText('q')
        editor.insertText('u')
        editor.insertText('a')
        await waitForAutocomplete(editor)

        editor.backspace()
        await waitForAutocomplete(editor)

        let autocomplete = editorView.querySelector('.autocomplete-plus')
        expect(autocomplete).toExist()

        atom.commands.dispatch(editorView, 'core:move-up')

        autocomplete = editorView.querySelector('.autocomplete-plus')
        expect(autocomplete).toExist()
      })
    })

    describe('select-next event', () => {
      beforeEach(() => {
      })

      it('selects the next item in the list', async () => {
        triggerAutocompletion(editor, false, 'a')
        await waitForAutocomplete(editor)

        let items = editorView.querySelectorAll('.autocomplete-plus li')
        expect(items[0]).toHaveClass('selected')
        expect(items[1]).not.toHaveClass('selected')
        expect(items[2]).not.toHaveClass('selected')

        // Select next item
        atom.commands.dispatch(editorView, 'core:move-down')

        items = editorView.querySelectorAll('.autocomplete-plus li')
        expect(items[0]).not.toHaveClass('selected')
        expect(items[1]).toHaveClass('selected')
        expect(items[2]).not.toHaveClass('selected')
      })

      it('wraps to the first item when triggered at the end of the list', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'ab'}, {text: 'abc'}, {text: 'abcd'}])

        triggerAutocompletion(editor, false, 'a')
        await waitForAutocomplete(editor)

        let items = editorView.querySelectorAll('.autocomplete-plus li')
        expect(items[0]).toHaveClass('selected')
        expect(items[1]).not.toHaveClass('selected')
        expect(items[2]).not.toHaveClass('selected')

        let suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list')
        items = editorView.querySelectorAll('.autocomplete-plus li')

        atom.commands.dispatch(suggestionListView, 'core:move-down')
        expect(items[1]).toHaveClass('selected')

        atom.commands.dispatch(suggestionListView, 'core:move-down')
        expect(items[2]).toHaveClass('selected')

        atom.commands.dispatch(suggestionListView, 'core:move-down')
        expect(items[0]).toHaveClass('selected')
      })
    })

    describe('label rendering', () => {
      describe('when no labels are specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok'}])
        })

        it('displays the text in the suggestion', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)
          let iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container')
          let leftLabel = editorView.querySelector('.autocomplete-plus li .right-label')
          let rightLabel = editorView.querySelector('.autocomplete-plus li .right-label')

          expect(iconContainer.childNodes).toHaveLength(0)
          expect(leftLabel.childNodes).toHaveLength(0)
          expect(rightLabel.childNodes).toHaveLength(0)
        })
      })

      describe('when `type` is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', type: 'omg'}])
        })

        it('displays an icon in the icon-container', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon')
          expect(icon.textContent).toBe('o')
        })
      })

      describe('when the `type` specified has a default icon', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', type: 'snippet'}])
        })

        it('displays the default icon in the icon-container', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon i')
          expect(icon).toHaveClass('icon-move-right')
        })
      })

      describe('when `type` is an empty string', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', type: ''}])
        })

        it('does not display an icon in the icon-container', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container')
          expect(iconContainer.childNodes).toHaveLength(0)
        })
      })

      describe('when `iconHTML` is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', iconHTML: '<i class="omg"></i>'}])
        })

        it('displays an icon in the icon-container', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon .omg')
          expect(icon).toExist()
        })
      })

      describe('when `iconHTML` is false', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', type: 'something', iconHTML: false}])
        })

        it('does not display an icon in the icon-container', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container')
          expect(iconContainer.childNodes).toHaveLength(0)
        })
      })

      describe('when `iconHTML` is not a string and a `type` is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', type: 'something', iconHTML: true}])
        })

        it('displays the default icon in the icon-container', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon')
          expect(icon.textContent).toBe('s')
        })
      })

      describe('when `iconHTML` is not a string and no type is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', iconHTML: true}])
        })

        it('it does not display an icon', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container')
          expect(iconContainer.childNodes).toHaveLength(0)
        })
      })

      describe('when `rightLabel` is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', rightLabel: '<i class="something">sometext</i>'}])
        })

        it('displays the text in the suggestion', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let label = editorView.querySelector('.autocomplete-plus li .right-label')
          expect(label).toHaveText('<i class="something">sometext</i>')
        })
      })

      describe('when `rightLabelHTML` is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', rightLabelHTML: '<i class="something">sometext</i>'}])
        })

        it('displays the text in the suggestion', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let label = editorView.querySelector('.autocomplete-plus li .right-label .something')
          expect(label).toHaveText('sometext')
        })
      })

      describe('when `leftLabel` is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', leftLabel: '<i class="something">sometext</i>'}])
        })

        it('displays the text in the suggestion', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let label = editorView.querySelector('.autocomplete-plus li .left-label')
          expect(label).toHaveText('<i class="something">sometext</i>')
        })
      })

      describe('when `leftLabelHTML` is specified', () => {
        beforeEach(() => {
          spyOn(provider, 'getSuggestions').andCallFake(options => [{text: 'ok', leftLabelHTML: '<i class="something">sometext</i>'}])
        })

        it('displays the text in the suggestion', async () => {
          triggerAutocompletion(editor)
          await waitForAutocomplete(editor)

          let label = editorView.querySelector('.autocomplete-plus li .left-label .something')
          expect(label).toHaveText('sometext')
        })
      })
    })

    describe('when clicking in the suggestion list', () => {
      beforeEach(() => {
        spyOn(provider, 'getSuggestions').andCallFake(() => {
          let list = ['ab', 'abc', 'abcd', 'abcde']
          return (list.map((text) => ({text, description: `${text} yeah ok`})))
        })
      })

      it('will select the item and confirm the selection', async () => {
        triggerAutocompletion(editor, true, 'a')
        await waitForAutocomplete(editor)

        // Get the second item
        let item = editorView.querySelectorAll('.autocomplete-plus li')[1]

        // Click the item, expect list to be hidden and text to be added
        let mouse = document.createEvent('MouseEvents')
        mouse.initMouseEvent('mousedown', true, true, window)
        item.dispatchEvent(mouse)
        mouse = document.createEvent('MouseEvents')
        mouse.initMouseEvent('mouseup', true, true, window)
        item.dispatchEvent(mouse)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        expect(editor.getBuffer().getLastLine()).toEqual(item.textContent.trim())
      })

      it('will not close the list when the description is clicked', async () => {
        triggerAutocompletion(editor, true, 'a')
        await waitForAutocomplete(editor)

        let description = editorView.querySelector('.autocomplete-plus .suggestion-description-content')

        // Click the description, expect list to still show
        let mouse = document.createEvent('MouseEvents')
        mouse.initMouseEvent('mousedown', true, true, window)
        description.dispatchEvent(mouse)
        mouse = document.createEvent('MouseEvents')
        mouse.initMouseEvent('mouseup', true, true, window)
        description.dispatchEvent(mouse)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
      })
    })

    describe('Keybind to navigate to descriptionMoreLink', () => {
      it('triggers openExternal on keybind if there is a description', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'ab', description: 'it is ab'}])
        let shell = require('electron').shell
        spyOn(shell, 'openExternal')

        triggerAutocompletion(editor, true, 'a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:navigate-to-description-more-link')
        expect(shell.openExternal).toHaveBeenCalled()
      })

      it('does not trigger openExternal on keybind if there is not a description', async () => {
        spyOn(provider, 'getSuggestions').andCallFake(() => [{text: 'ab'}])
        let shell = require('electron').shell
        spyOn(shell, 'openExternal')

        triggerAutocompletion(editor, true, 'a')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        atom.commands.dispatch(editorView, 'autocomplete-plus:navigate-to-description-more-link')
        expect(shell.openExternal).not.toHaveBeenCalled()
      })
    })
  })

  describe('when opening a file without a path', () => {
    beforeEach(async () => {
      editor = await atom.workspace.open('')
      editorView = atom.views.getView(editor)

      await atom.packages.activatePackage('language-text')

      // Activate the package
      mainModule = (await atom.packages.activatePackage('autocomplete-plus')).mainModule

      await conditionPromise(() => {
        return mainModule && mainModule.autocompleteManager && mainModule.autocompleteManager.ready
      })

      ;({ autocompleteManager } = mainModule)
      spyOn(autocompleteManager, 'findSuggestions').andCallThrough()
      spyOn(autocompleteManager, 'displaySuggestions').andCallThrough()
    })

    describe('when strict matching is used', () => {
      beforeEach(() => atom.config.set('autocomplete-plus.strictMatching', true))

      it('using strict matching does not cause issues when typing', async () => {
        editor.moveToBottom()
        editor.insertText('h')
        editor.insertText('e')
        editor.insertText('l')
        editor.insertText('l')
        editor.insertText('o')

        await conditionPromise(
          () => autocompleteManager.findSuggestions.callCount === 1
        )
      })
    })
  })

  describe('when opening a javascript file', () => {
    beforeEach(async () => {
      atom.config.set('autocomplete-plus.enableAutoActivation', true)

      editor = await atom.workspace.open('sample.js')
      editorView = atom.views.getView(editor)

      await atom.packages.activatePackage('language-javascript')

      mainModule = (await atom.packages.activatePackage('autocomplete-plus')).mainModule

      await conditionPromise(() => {
        autocompleteManager = mainModule.autocompleteManager
        return autocompleteManager
      })

      await timeoutPromise(autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval + 100)
    })

    describe('when the built-in provider is disabled', () =>
      it('should not show the suggestion list', async () => {
        atom.config.set('autocomplete-plus.enableBuiltinProvider', false)
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      })
    )

    describe('when the buffer changes', () => {
      it('should show the suggestion list when suggestions are found', async () => {
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        triggerAutocompletion(editor)
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()

        // Check suggestions
        let suggestions = ['function', 'if', 'left', 'shift']
        let s = editorView.querySelectorAll('.autocomplete-plus li span.word')
        for (let i = 0; i < s.length; i++) {
          let item = s[i]
          expect(item.innerText).toEqual(suggestions[i])
        }
      })

      it('should not show the suggestion list when no suggestions are found', async () => {
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('x')

        await waitForAutocompleteToDisappear(editor)
      })

      it('shows the suggestion list on backspace if allowed', async () => {
        atom.config.set('autocomplete-plus.backspaceTriggersAutocomplete', true)
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('f')
        editor.insertText('u')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        editor.insertText('\r')
        await waitForAutocompleteToDisappear(editor)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        let key = atom.keymaps.constructor.buildKeydownEvent('backspace', {target: document.activeElement})
        atom.keymaps.handleKeyboardEvent(key)
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        key = atom.keymaps.constructor.buildKeydownEvent('backspace', {target: document.activeElement})
        atom.keymaps.handleKeyboardEvent(key)
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        expect(editor.lineTextForBufferRow(13)).toBe('f')
      })

      it('does not shows the suggestion list on backspace if disallowed', async () => {
        atom.config.set('autocomplete-plus.backspaceTriggersAutocomplete', false)
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('f')
        editor.insertText('u')
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        editor.insertText('\r')

        await waitForAutocompleteToDisappear(editor)
        let key = atom.keymaps.constructor.buildKeydownEvent('backspace', {target: document.activeElement})
        atom.keymaps.handleKeyboardEvent(key)

        await waitForAutocompleteToDisappear(editor)
        key = atom.keymaps.constructor.buildKeydownEvent('backspace', {target: document.activeElement})
        atom.keymaps.handleKeyboardEvent(key)
        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
        expect(editor.lineTextForBufferRow(13)).toBe('f')
      })

      it("keeps the suggestion list open when it's already open on backspace", async () => {
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('f')
        editor.insertText('u')
        await waitForAutocomplete(editor)
        expect(editorView.querySelector('.autocomplete-plus')).toExist()

        let key = atom.keymaps.constructor.buildKeydownEvent('backspace', {target: document.activeElement})
        atom.keymaps.handleKeyboardEvent(key)
        await waitForAutocomplete(editor)

        expect(editorView.querySelector('.autocomplete-plus')).toExist()
        expect(editor.lineTextForBufferRow(13)).toBe('f')
      })

      it("does not open the suggestion on backspace when it's closed", async () => {
        atom.config.set('autocomplete-plus.backspaceTriggersAutocomplete', false)
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.setCursorBufferPosition([2, 39]) // at the end of `items`

        let key = atom.keymaps.constructor.buildKeydownEvent('backspace', {target: document.activeElement})
        atom.keymaps.handleKeyboardEvent(key)

        await timeoutPromise(100)
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      })

      it('does not update the suggestion list while composition is in progress', async () => {
        const activeElement = editorView.querySelector('input')
        spyOn(autocompleteManager.suggestionList, 'changeItems').andCallThrough()

        editor.moveToBottom()
        editor.insertText('q')
        editor.insertText('u')

        await waitForAutocomplete(editor)

        expect(autocompleteManager.suggestionList.changeItems).toHaveBeenCalled()
        expect(autocompleteManager.suggestionList.changeItems.mostRecentCall.args[0][0].text).toBe('quicksort')
        autocompleteManager.suggestionList.changeItems.callCount = 0

        activeElement.dispatchEvent(buildIMECompositionEvent('compositionstart', {data: 'i', target: activeElement}))
        triggerAutocompletion(editor, false, 'i')

        await conditionPromise(() =>
          autocompleteManager.suggestionList.changeItems.callCount > 0
        )

        expect(autocompleteManager.suggestionList.changeItems.mostRecentCall.args[0][0].text).toBe('quicksort')
        autocompleteManager.suggestionList.changeItems.callCount = 0

        activeElement.dispatchEvent(buildIMECompositionEvent('compositionupdate', {data: 'ï', target: activeElement}))
        editor.selectLeft()

        editor.insertText('ï')

        const initialCallCount = autocompleteManager.suggestionList.changeItems.callCount
        await conditionPromise(() => autocompleteManager.suggestionList.changeItems.callCount > initialCallCount)

        expect(autocompleteManager.suggestionList.changeItems).toHaveBeenCalledWith(null)
        activeElement.dispatchEvent(buildIMECompositionEvent('compositionend', {target: activeElement}))
      })

      it('does not show the suggestion list when it is triggered then no longer needed', async () => {
        editor.moveToBottom()
        editor.insertText('f')
        editor.insertText('u')
        editor.insertText('\r')

        await timeoutPromise(100)

        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
      })
    })

    describe('.cancel()', () => {
      it('unbinds autocomplete event handlers for move-up and move-down', () => {
        triggerAutocompletion(editor, false)

        autocompleteManager.hideSuggestionList()
        editorView = atom.views.getView(editor)
        atom.commands.dispatch(editorView, 'core:move-down')
        expect(editor.getCursorBufferPosition().row).toBe(1)

        atom.commands.dispatch(editorView, 'core:move-up')
        expect(editor.getCursorBufferPosition().row).toBe(0)
      })
    })
  })

  describe('when a long completion exists', () => {
    beforeEach(async () => {
      atom.config.set('autocomplete-plus.enableAutoActivation', true)

      editor = await atom.workspace.open('samplelong.js')

      // Activate the package
      mainModule = (await atom.packages.activatePackage('autocomplete-plus')).mainModule

      await conditionPromise(() => mainModule.autocompleteManager)
      autocompleteManager = mainModule.autocompleteManager
    })

    it('sets the width of the view to be wide enough to contain the longest completion without scrolling', async () => {
      editor.moveToBottom()
      editor.insertNewline()
      editor.insertText('t')

      await waitForAutocomplete(editor)

      let suggestionListView = autocompleteManager.suggestionList.suggestionListElement
      expect(suggestionListView.scrollWidth).toBe(suggestionListView.offsetWidth)
    })
  })

  describe('when watching an external text editor for a given set of provider labels', () => {
    let bottomEditor
    let bottomEditorView
    let autocompleteDisposable

    beforeEach(async () => {
      // Activate package.
      const pck = await atom.packages.activatePackage('autocomplete-plus')
      mainModule = pck.mainModule

      autocompleteManager = mainModule.autocompleteManager

      // Create external providers with labels.
      let bottomProvider = {
        labels: ['bottom-label'],
        scopeSelector: '*',
        getSuggestions (options) { return [{text: 'bottom'}] }
      }
      mainModule.consumeProvider(bottomProvider)

      let centerProvider = {
        labels: ['workspace-center'],
        scopeSelector: '*',
        getSuggestions (options) { return [{text: 'center'}] }
      }
      mainModule.consumeProvider(centerProvider)

      editor = await atom.workspace.open('')
      editorView = atom.views.getView(editor)

      // Create an editor in the bottom panel,
      // requesting autocompletions from a given label.
      bottomEditor = new TextEditor()
      bottomEditorView = atom.views.getView(bottomEditor)
      atom.workspace.addBottomPanel({item: bottomEditorView, visible: true})
      autocompleteDisposable = autocompleteManager.watchEditor(
        bottomEditor,
        ['bottom-label']
      )
    })

    it('provides appropriate autocompletions when each editor is focused.', async () => {
      bottomEditorView.focus()
      triggerAutocompletion(bottomEditor)
      await waitForAutocomplete(bottomEditor)

      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

      let items = bottomEditorView.querySelectorAll('.autocomplete-plus li')
      expect(items.length).toEqual(1)
      expect(items[0].innerText.trim()).toEqual('bottom')

      editorView.focus()
      triggerAutocompletion(editor)
      await waitForAutocomplete(editor)

      expect(bottomEditorView.querySelector('.autocomplete-plus')).not.toExist()

      items = editorView.querySelectorAll('.autocomplete-plus li')
      expect(items.length).toEqual(1)
      expect(items[0].innerText.trim()).toEqual('center')
    })

    it('stops providing autocompletions when disposed.', async () => {
      autocompleteDisposable.dispose()
      bottomEditorView.focus()
      triggerAutocompletion(bottomEditor)
      await timeoutPromise(100)
      expect(bottomEditorView.querySelector('.autocomplete-plus')).not.toExist()
    })
  })
})
