const {getWrapGuides, getLeftPosition} = require('./helpers')

const {it, fit, ffit, afterEach, beforeEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

describe('Wrap Guide', () => {
  let editor, editorElement, wrapGuide = []

  beforeEach(async () => {
    await atom.packages.activatePackage('wrap-guide')
    atom.config.set('wrap-guide.showWrapGuide', 'always')

    editor = await atom.workspace.open('sample.js')
    editorElement = editor.getElement()
    wrapGuide = editorElement.querySelector('.wrap-guide-container')

    jasmine.attachToDOM(atom.views.getView(atom.workspace))
  })

  describe('package activation', () => {
    it('appends a wrap guide to all existing and new editors', () => {
      expect(atom.workspace.getTextEditors().length).toBe(1)
      expect(getWrapGuides().length).toBe(1)
      expect(getLeftPosition(getWrapGuides()[0])).toBeGreaterThan(0)

      atom.workspace.getActivePane().splitRight({copyActiveItem: true})
      expect(atom.workspace.getTextEditors().length).toBe(2)
      expect(getWrapGuides().length).toBe(2)
      expect(getLeftPosition(getWrapGuides()[0])).toBeGreaterThan(0)
      expect(getLeftPosition(getWrapGuides()[1])).toBeGreaterThan(0)
    })

    it('positions the guide at the configured column', () => {
      width = editor.getDefaultCharWidth() * wrapGuide.getDefaultColumn()
      expect(width).toBeGreaterThan(0)
      expect(Math.abs(getLeftPosition(wrapGuide.firstChild) - width)).toBeLessThan(1)
      expect(wrapGuide.firstChild).toBeVisible()
    })
  })

  describe('package deactivation', () => {
    beforeEach(async () => {
      await atom.packages.deactivatePackage('wrap-guide')
    })

    it('disposes of all wrap guides', () => {
      expect(getWrapGuides().length).toBe(0)
    })
  })
})
