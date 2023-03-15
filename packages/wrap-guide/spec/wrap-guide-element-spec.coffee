{getLeftPosition, getLeftPositions} = require './helpers'
{uniqueAscending} = require '../lib/main'

describe "WrapGuideElement", ->
  [editor, editorElement, wrapGuide, workspaceElement] = []

  beforeEach ->
    workspaceElement = atom.views.getView(atom.workspace)
    workspaceElement.style.height = "200px"
    workspaceElement.style.width = "1500px"

    jasmine.attachToDOM(workspaceElement)

    waitsForPromise ->
      atom.packages.activatePackage('wrap-guide')

    waitsForPromise ->
      atom.packages.activatePackage('language-javascript')

    waitsForPromise ->
      atom.packages.activatePackage('language-coffee-script')

    waitsForPromise ->
      atom.workspace.open('sample.js')

    runs ->
      editor = atom.workspace.getActiveTextEditor()
      editorElement = editor.getElement()
      wrapGuide = editorElement.querySelector(".wrap-guide-container")

  describe ".activate", ->
    getWrapGuides = ->
      wrapGuides = []
      atom.workspace.getTextEditors().forEach (editor) ->
        guides = editor.getElement().querySelectorAll(".wrap-guide")
        wrapGuides.push(guides) if guides
      wrapGuides

    it "appends a wrap guide to all existing and new editors", ->
      expect(atom.workspace.getTextEditors().length).toBe 1

      expect(getWrapGuides().length).toBe 1
      expect(getLeftPosition(getWrapGuides()[0][0])).toBeGreaterThan(0)

      atom.workspace.getActivePane().splitRight(copyActiveItem: true)
      expect(atom.workspace.getTextEditors().length).toBe 2
      expect(getWrapGuides().length).toBe 2
      expect(getLeftPosition(getWrapGuides()[0][0])).toBeGreaterThan(0)
      expect(getLeftPosition(getWrapGuides()[1][0])).toBeGreaterThan(0)

    it "positions the guide at the configured column", ->
      width = editor.getDefaultCharWidth() * wrapGuide.getDefaultColumn()
      expect(width).toBeGreaterThan(0)
      expect(Math.abs(getLeftPosition(wrapGuide.firstChild) - width)).toBeLessThan 1
      expect(wrapGuide).toBeVisible()

    it "appends multiple wrap guides to all existing and new editors", ->
      columns = [10, 20, 30]
      atom.config.set("wrap-guide.columns", columns)

      waitsForPromise ->
        editorElement.getComponent().getNextUpdatePromise()

      runs ->
        expect(atom.workspace.getTextEditors().length).toBe 1
        expect(getWrapGuides().length).toBe 1
        positions = getLeftPositions(getWrapGuides()[0])
        expect(positions.length).toBe(columns.length)
        expect(positions[0]).toBeGreaterThan(0)
        expect(positions[1]).toBeGreaterThan(positions[0])
        expect(positions[2]).toBeGreaterThan(positions[1])

        atom.workspace.getActivePane().splitRight(copyActiveItem: true)
        expect(atom.workspace.getTextEditors().length).toBe 2
        expect(getWrapGuides().length).toBe 2
        pane1_positions = getLeftPositions(getWrapGuides()[0])
        expect(pane1_positions.length).toBe(columns.length)
        expect(pane1_positions[0]).toBeGreaterThan(0)
        expect(pane1_positions[1]).toBeGreaterThan(pane1_positions[0])
        expect(pane1_positions[2]).toBeGreaterThan(pane1_positions[1])
        pane2_positions = getLeftPositions(getWrapGuides()[1])
        expect(pane2_positions.length).toBe(pane1_positions.length)
        expect(pane2_positions[0]).toBe(pane1_positions[0])
        expect(pane2_positions[1]).toBe(pane1_positions[1])
        expect(pane2_positions[2]).toBe(pane1_positions[2])

    it "positions multiple guides at the configured columns", ->
      columnCount = 5
      columns = (c * 10 for c in [1..columnCount])
      atom.config.set("wrap-guide.columns", columns)
      waitsForPromise ->
        editorElement.getComponent().getNextUpdatePromise()

      runs ->
        positions = getLeftPositions(getWrapGuides()[0])
        expect(positions.length).toBe(columnCount)
        expect(wrapGuide.children.length).toBe(columnCount)

        for i in columnCount - 1
          width = editor.getDefaultCharWidth() * columns[i]
          expect(width).toBeGreaterThan(0)
          expect(Math.abs(getLeftPosition(wrapGuide.children[i]) - width)).toBeLessThan 1
        expect(wrapGuide).toBeVisible()

  describe "when the font size changes", ->
    it "updates the wrap guide position", ->
      initial = getLeftPosition(wrapGuide.firstChild)
      expect(initial).toBeGreaterThan(0)
      fontSize = atom.config.get("editor.fontSize")
      atom.config.set("editor.fontSize", fontSize + 10)

      waitsForPromise ->
        editorElement.getComponent().getNextUpdatePromise()

      runs ->
        expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial)
        expect(wrapGuide.firstChild).toBeVisible()

    it "updates the wrap guide position for hidden editors when they become visible", ->
      initial = getLeftPosition(wrapGuide.firstChild)
      expect(initial).toBeGreaterThan(0)

      waitsForPromise ->
        atom.workspace.open()

      runs ->
        fontSize = atom.config.get("editor.fontSize")
        atom.config.set("editor.fontSize", fontSize + 10)
        atom.workspace.getActivePane().activatePreviousItem()

        waitsForPromise ->
          editorElement.getComponent().getNextUpdatePromise()

        runs ->
          expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial)
          expect(wrapGuide.firstChild).toBeVisible()

  describe "when the column config changes", ->
    it "updates the wrap guide position", ->
      initial = getLeftPosition(wrapGuide.firstChild)
      expect(initial).toBeGreaterThan(0)
      column = atom.config.get("editor.preferredLineLength")
      atom.config.set("editor.preferredLineLength", column + 10)
      expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial)
      expect(wrapGuide).toBeVisible()

  describe "when the preferredLineLength changes", ->
    it "updates the wrap guide positions", ->
      initial = [10, 15, 20, 30]
      atom.config.set 'wrap-guide.columns', initial,
        scopeSelector: ".#{editor.getGrammar().scopeName}"
      waitsForPromise ->
        editorElement.getComponent().getNextUpdatePromise()

      runs ->
        atom.config.set 'editor.preferredLineLength', 15,
          scopeSelector: ".#{editor.getGrammar().scopeName}"
        waitsForPromise ->
          editorElement.getComponent().getNextUpdatePromise()

        runs ->
          columns = atom.config.get('wrap-guide.columns', scope: editor.getRootScopeDescriptor())
          expect(columns.length).toBe(2)
          expect(columns[0]).toBe(10)
          expect(columns[1]).toBe(15)

  describe "when the columns config changes", ->
    it "updates the wrap guide positions", ->
      initial = getLeftPositions(wrapGuide.children)
      expect(initial.length).toBe(1)
      expect(initial[0]).toBeGreaterThan(0)

      columns = [10, 20, 30]
      atom.config.set("wrap-guide.columns", columns)
      waitsForPromise ->
        editorElement.getComponent().getNextUpdatePromise()

      runs ->
        positions = getLeftPositions(wrapGuide.children)
        expect(positions.length).toBe(columns.length)
        expect(positions[0]).toBeGreaterThan(0)
        expect(positions[1]).toBeGreaterThan(positions[0])
        expect(positions[2]).toBeGreaterThan(positions[1])
        expect(wrapGuide).toBeVisible()

    it "updates the preferredLineLength", ->
      initial = atom.config.get('editor.preferredLineLength', scope: editor.getRootScopeDescriptor())
      atom.config.set("wrap-guide.columns", [initial, initial + 10])
      waitsForPromise ->
        editorElement.getComponent().getNextUpdatePromise()

      runs ->
        length = atom.config.get('editor.preferredLineLength', scope: editor.getRootScopeDescriptor())
        expect(length).toBe(initial + 10)

    it "keeps guide positions unique and in ascending order", ->
      initial = getLeftPositions(wrapGuide.children)
      expect(initial.length).toBe(1)
      expect(initial[0]).toBeGreaterThan(0)

      reverseColumns = [30, 20, 10]
      columns = [reverseColumns[reverseColumns.length - 1], reverseColumns..., reverseColumns[0]]
      uniqueColumns = uniqueAscending(columns)
      expect(uniqueColumns.length).toBe(3)
      expect(uniqueColumns[0]).toBeGreaterThan(0)
      expect(uniqueColumns[1]).toBeGreaterThan(uniqueColumns[0])
      expect(uniqueColumns[2]).toBeGreaterThan(uniqueColumns[1])

      atom.config.set("wrap-guide.columns", columns)
      waitsForPromise ->
        editorElement.getComponent().getNextUpdatePromise()

      runs ->
        positions = getLeftPositions(wrapGuide.children)
        expect(positions.length).toBe(uniqueColumns.length)
        expect(positions[0]).toBeGreaterThan(0)
        expect(positions[1]).toBeGreaterThan(positions[0])
        expect(positions[2]).toBeGreaterThan(positions[1])
        expect(wrapGuide).toBeVisible()

  describe "when the editor's scroll left changes", ->
    it "updates the wrap guide position to a relative position on screen", ->
      editor.setText("a long line which causes the editor to scroll")
      editorElement.style.width = "100px"

      waitsFor -> editorElement.component.getMaxScrollLeft() > 10

      runs ->
        initial = getLeftPosition(wrapGuide.firstChild)
        expect(initial).toBeGreaterThan(0)
        editorElement.setScrollLeft(10)
        expect(getLeftPosition(wrapGuide.firstChild)).toBe(initial - 10)
        expect(wrapGuide.firstChild).toBeVisible()

  describe "when the editor's grammar changes", ->
    it "updates the wrap guide position", ->
      atom.config.set('editor.preferredLineLength', 20, scopeSelector: '.source.js')
      initial = getLeftPosition(wrapGuide.firstChild)
      expect(initial).toBeGreaterThan(0)
      expect(wrapGuide).toBeVisible()

      editor.setGrammar(atom.grammars.grammarForScopeName('text.plain.null-grammar'))
      expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial)
      expect(wrapGuide).toBeVisible()

    it 'listens for preferredLineLength updates for the new grammar', ->
      editor.setGrammar(atom.grammars.grammarForScopeName('source.coffee'))
      initial = getLeftPosition(wrapGuide.firstChild)
      atom.config.set('editor.preferredLineLength', 20, scopeSelector: '.source.coffee')
      expect(getLeftPosition(wrapGuide.firstChild)).toBeLessThan(initial)

    it 'listens for wrap-guide.enabled updates for the new grammar', ->
      editor.setGrammar(atom.grammars.grammarForScopeName('source.coffee'))
      expect(wrapGuide).toBeVisible()
      atom.config.set('wrap-guide.enabled', false, scopeSelector: '.source.coffee')
      expect(wrapGuide).not.toBeVisible()

  describe 'scoped config', ->
    it '::getDefaultColumn returns the scope-specific column value', ->
      atom.config.set('editor.preferredLineLength', 132, scopeSelector: '.source.js')

      expect(wrapGuide.getDefaultColumn()).toBe 132

    it 'updates the guide when the scope-specific column changes', ->
      initial = getLeftPosition(wrapGuide.firstChild)
      column = atom.config.get('editor.preferredLineLength', scope: editor.getRootScopeDescriptor())
      atom.config.set('editor.preferredLineLength', column + 10, scope: '.source.js')
      expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial)

    it 'updates the guide when wrap-guide.enabled is set to false', ->
      expect(wrapGuide).toBeVisible()

      atom.config.set('wrap-guide.enabled', false, scopeSelector: '.source.js')

      expect(wrapGuide).not.toBeVisible()
