const path = require('path')
const ArchiveEditor = require('../lib/archive-editor')
const ArchiveEditorView = require('../lib/archive-editor-view')

describe('ArchiveEditor', () => {
  const tarPath = path.join(__dirname, 'fixtures', 'nested.tar')

  // Don't log during specs
  beforeEach(() => spyOn(console, 'warn'))

  describe('.deserialize', () => {
    it('returns undefined if no file exists at the given path', () => {
      const editor1 = new ArchiveEditorView(tarPath)
      const state = editor1.serialize()
      editor1.destroy()

      const editor2 = ArchiveEditor.deserialize(state)
      expect(editor2).toBeDefined()
      editor2.destroy()

      state.path = 'bogus'
      expect(ArchiveEditor.deserialize(state)).toBeUndefined()
    })
  })

  describe('.deactivate()', () => {
    it('removes all ArchiveEditorViews from the workspace and does not open any new ones', async () => {
      const getArchiveEditorViews = () => {
        return atom.workspace.getPaneItems().filter(item => item instanceof ArchiveEditorView)
      }
      await atom.packages.activatePackage('archive-view')
      await atom.workspace.open(path.join(__dirname, 'fixtures', 'nested.tar'))
      await atom.workspace.open(path.join(__dirname, 'fixtures', 'invalid.zip'))
      await atom.workspace.open()
      expect(getArchiveEditorViews().length).toBe(2)

      await atom.packages.deactivatePackage('archive-view')
      expect(getArchiveEditorViews().length).toBe(0)

      await atom.workspace.open(path.join(__dirname, 'fixtures', 'nested.tar'))
      expect(getArchiveEditorViews().length).toBe(0)
    })
  })
})
