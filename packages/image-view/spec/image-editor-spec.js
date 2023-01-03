const {it, fit, ffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

const path = require('path')
const ImageEditor = require('../lib/image-editor')

describe('ImageEditor', () => {
  describe('.deserialize(state)', () => {
    it('returns undefined if no file exists at the given path', () => {
      spyOn(console, 'warn') // suppress logging in spec
      const editor = new ImageEditor(path.join(__dirname, 'fixtures', 'binary-file.png'))
      const state = editor.serialize()
      expect(ImageEditor.deserialize(state)).toBeDefined()
      state.filePath = 'bogus'
      expect(ImageEditor.deserialize(state)).toBeUndefined()
    })
  })

  describe('.copy()', () => {
    it('returns another ImageEditor for the same file', () => {
      const editor = new ImageEditor(path.join(__dirname, 'fixtures', 'binary-file.png'))
      const newEditor = editor.copy()
      expect(newEditor.getPath()).toBe(editor.getPath())
    })
  })

  describe('.activate()', () => {
    it('registers a project opener that handles image file extension', async () => {
      await atom.packages.activatePackage('image-view')

      let item = await atom.workspace.open(path.join(__dirname, 'fixtures', 'binary-file.png'))

      expect(item.getTitle()).toBe('binary-file.png')
      atom.workspace.destroyActivePaneItem()

      await atom.packages.deactivatePackage('image-view')

      item = await atom.workspace.open(path.join(__dirname, 'fixtures', 'binary-file.png'))

      expect(item instanceof ImageEditor).toBe(false)
    })
  })

  describe('::onDidTerminatePendingState', () => {
    let pendingSpy = null

    beforeEach(async () => {
      pendingSpy = jasmine.createSpy('onDidTerminatePendingState')

      await atom.packages.activatePackage('image-view')
    })

    it('is called when pending state gets terminated for the active ImageEditor', async () => {
      const item = await atom.workspace.open(path.join(__dirname, 'fixtures', 'binary-file.png'), {pending: true})

      expect(item.getTitle()).toBe('binary-file.png')
      item.onDidTerminatePendingState(pendingSpy)
      item.terminatePendingState()
      expect(pendingSpy).toHaveBeenCalled()
    })

    it('is not called when the ImageEditor is not pending', async () => {
      const item = await atom.workspace.open(path.join(__dirname, 'fixtures', 'binary-file.png'), {pending: false})

      expect(item.getTitle()).toBe('binary-file.png')
      item.onDidTerminatePendingState(pendingSpy)
      item.terminatePendingState()
      expect(pendingSpy).not.toHaveBeenCalled()
    })
  })

  describe('::getAllowedLocations', () => {
    it('ensures that ImageEditor opens in workspace center', async () => {
      await atom.packages.activatePackage('image-view')

      const item = await atom.workspace.open(path.join(__dirname, 'fixtures', 'binary-file.png'), {location: 'right'})

      expect(item.getTitle()).toBe('binary-file.png')
    })
  })

  describe('when the image gets reopened', () => {
    beforeEach(async () => {
      await atom.packages.activatePackage('image-view')
    })

    it('should not change the URI between each reopen', async () => {
      let item = await atom.workspace.open(path.join(__dirname, 'fixtures', 'binary-file.png'))

      const uri = item.getURI()
      atom.workspace.destroyActivePaneItem()
      item = await atom.workspace.reopenItem()

      expect(item.getURI()).toBe(uri)
    })
  })
})
