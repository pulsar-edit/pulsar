{CompositeDisposable} = require 'atom'
WrapGuideElement = require './wrap-guide-element'

module.exports =
  activate: ->
    @subscriptions = new CompositeDisposable()
    @wrapGuides = new Map()

    @subscriptions.add atom.workspace.observeTextEditors (editor) =>
      return if @wrapGuides.has(editor)

      editorElement = atom.views.getView(editor)
      wrapGuideElement = new WrapGuideElement(editor, editorElement)

      @wrapGuides.set(editor, wrapGuideElement)
      @subscriptions.add editor.onDidDestroy =>
        @wrapGuides.get(editor).destroy()
        @wrapGuides.delete(editor)

  deactivate: ->
    @subscriptions.dispose()
    @wrapGuides.forEach (wrapGuide, editor) -> wrapGuide.destroy()
    @wrapGuides.clear()

  uniqueAscending: (list) ->
    (list.filter((item, index) -> list.indexOf(item) is index)).sort((a, b) -> a - b)
