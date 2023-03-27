/* eslint-env jasmine */

const { waitForAutocomplete, timeoutPromise, conditionPromise } = require('./spec-helper')
const path = require('path')

describe('Async providers', () => {
  let editorView, editor, mainModule, autocompleteManager, registration

  beforeEach(async () => {
    atom.workspace.project.setPaths([path.join(__dirname, 'fixtures')]);
    jasmine.useRealClock()

    // Set to live completion
    atom.config.set('autocomplete-plus.enableAutoActivation', true)
    atom.config.set('editor.fontSize', '16')

    // Set the completion delay
    atom.config.set('autocomplete-plus.autoActivationDelay', 100)

    let workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)

    editor = await atom.workspace.open('sample.js')

    await atom.packages.activatePackage('language-javascript')

    // Activate the package
    mainModule = (await atom.packages.activatePackage('autocomplete-plus')).mainModule

    await conditionPromise(() => {
      autocompleteManager = mainModule.autocompleteManager
      return autocompleteManager
    })
  })

  afterEach(() => {
    if (registration) {
      registration.dispose()
    }
  })

  describe('when an async provider is registered', () => {
    beforeEach(() => {
      let testAsyncProvider = {
        getSuggestions (options) {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                [{
                  text: 'asyncProvided',
                  replacementPrefix: 'asyncProvided',
                  rightLabel: 'asyncProvided'
                }]
              )
            }, 10)
          })
        },
        scopeSelector: '.source.js'
      }
      registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testAsyncProvider)
    })

    it('should provide completions when a provider returns a promise that results in an array of suggestions', async () => {
      editor.moveToBottom()
      editor.insertText('o')

      await waitForAutocomplete(editor)

      let suggestionListView = autocompleteManager.suggestionList.suggestionListElement
      expect(suggestionListView.element.querySelector('li .right-label')).toHaveText('asyncProvided')
    })
  })

  describe('when a provider takes a long time to provide suggestions', () => {
    beforeEach(() => {
      let testAsyncProvider = {
        scopeSelector: '.source.js',
        getSuggestions (options) {
          return new Promise(resolve => {
            setTimeout(() =>
              resolve(
                [{
                  text: 'asyncProvided',
                  replacementPrefix: 'asyncProvided',
                  rightLabel: 'asyncProvided'
                }]
              )
            , 1000)
          })
        }
      }
      registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testAsyncProvider)
    })

    it('does not show the suggestion list when it is triggered then no longer needed', async () => {
      editorView = atom.views.getView(editor)

      editor.moveToBottom()
      editor.insertText('o')

      // Waiting will kick off the suggestion request
      editor.insertText('\r')
      await timeoutPromise(100)

      // Expect nothing because the provider has not come back yet
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()

      // Wait til the longass provider comes back
      await timeoutPromise(1000)

      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
    })
  })
})
