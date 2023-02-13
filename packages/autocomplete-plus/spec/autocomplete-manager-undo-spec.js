'use babel'
/* eslint-env jasmine */

import { conditionPromise, waitForAutocomplete } from './spec-helper'
import path from 'path'

describe('Autocomplete Manager', () => {
  let editorView
  let editor
  let mainModule

  beforeEach(() => {
    atom.workspace.project.setPaths([path.join(__dirname, 'fixtures')]);
    // Set to live completion
    atom.config.set('autocomplete-plus.enableAutoActivation', true)
    atom.config.set('editor.fontSize', '16')

    let workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)
  })

  describe('Undo a completion', () => {
    beforeEach(async () => {
      jasmine.useRealClock()
      atom.config.set('autocomplete-plus.enableAutoActivation', true)

      editor = await atom.workspace.open('sample.js')

      await atom.packages.activatePackage('language-javascript')

      // Activate the package
      mainModule = (await atom.packages.activatePackage('autocomplete-plus')).mainModule

      await conditionPromise(() =>
        mainModule.autocompleteManager && mainModule.autocompleteManager.ready
      )
    })

    it('restores the previous state', async () => {
      // Trigger an autocompletion
      editor.moveToBottom()
      editor.moveToBeginningOfLine()
      editor.insertText('f')

      await waitForAutocomplete(editor)

      // Accept suggestion
      editorView = atom.views.getView(editor)
      atom.commands.dispatch(editorView, 'autocomplete-plus:confirm')

      expect(editor.getBuffer().getLastLine()).toEqual('function')

      editor.undo()

      expect(editor.getBuffer().getLastLine()).toEqual('f')
    })
  })
})
