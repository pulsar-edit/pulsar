describe('AutocompleteSnippets', () => {
  let [completionDelay, editor, editorView] = []

  beforeEach(() => {
    atom.config.set('autocomplete-plus.enableAutoActivation', true)
    completionDelay = 100
    atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay)
    completionDelay += 100 // Rendering delay

    const workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)

    let autocompleteSnippetsMainModule = null
    let snippetsMainModule = null
    const autocompleteManager = null

    waitsForPromise(() =>
      Promise.all([
        atom.workspace.open('sample.js').then((e) => {
          editor = e
          editorView = atom.views.getView(editor)
        }),

        atom.packages.activatePackage('language-javascript'),
        atom.packages.activatePackage('autocomplete-snippets').then(({mainModule}) => autocompleteSnippetsMainModule = mainModule),

        atom.packages.activatePackage('autocomplete-plus'),
        atom.packages.activatePackage('snippets').then(({mainModule}) => {
          snippetsMainModule = mainModule
          snippetsMainModule.loaded = false
        })
      ])
    )

    waitsFor('snippets provider to be registered', 1000, () => autocompleteSnippetsMainModule.provider != null)

    waitsFor('all snippets to load', 3000, () => snippetsMainModule.loaded)
  })

  describe('when autocomplete-plus is enabled', () => {
    it('shows autocompletions when there are snippets available', () => {
      runs(() => {
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('D')
        editor.insertText('o')

        advanceClock(completionDelay)
      })

      waitsFor('autocomplete view to appear', 1000, () => editorView.querySelector('.autocomplete-plus span.word'))

      runs(() => {
        expect(editorView.querySelector('.autocomplete-plus span.word')).toHaveText('do')
        expect(editorView.querySelector('.autocomplete-plus span.right-label')).toHaveText('do')
      })
    })

    it("expands the snippet on confirm", () => {
      runs(() => {
        expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

        editor.moveToBottom()
        editor.insertText('D')
        editor.insertText('o')

        advanceClock(completionDelay)
      })

      waitsFor('autocomplete view to appear', 1000, () => editorView.querySelector('.autocomplete-plus span.word'))

      runs(() => {
        atom.commands.dispatch(editorView, 'autocomplete-plus:confirm')
        expect(editor.getText()).toContain('} while (true)')
      })
    })
  })

  describe('when showing suggestions', () =>
    it('sorts them in alphabetical order', () => {
      const unorderedPrefixes = [
        "",
        "dop",
        "do",
        "dad",
        "d"
      ]

      const snippets = {}
      for (let x of Array.from(unorderedPrefixes)) {
        snippets[x] = {prefix: x, name: "", description: "", descriptionMoreURL: ""}
      }

      const SnippetsProvider = require('../lib/snippets-provider')
      const sp = new SnippetsProvider()
      sp.setSnippetsSource({snippetsForScopes(scope) {
        return snippets
      }})
      const suggestions = sp.getSuggestions({scopeDescriptor: "", prefix: "d"})

      const suggestionsText = suggestions.map(x => x.text)
      expect(suggestionsText).toEqual(["d", "dad", "do", "dop"])
    })
  )
})
