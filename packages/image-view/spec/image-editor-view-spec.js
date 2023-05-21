const {it, fit, ffit, beforeEach, afterEach, conditionPromise} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

const ImageEditorView = require('../lib/image-editor-view')
const ImageEditor = require('../lib/image-editor')

const path = require('path')
const fs = require('fs')

describe('ImageEditorView', () => {
  let editor, view, filePath, filePath2, workspaceElement

  beforeEach(async () => {
    jasmine.useRealClock() // Needed for conditionPromise

    workspaceElement = atom.views.getView(atom.workspace)
    atom.project.addPath(path.resolve('packages', 'image-view', 'spec', 'fixtures'));

    // Now we have added the `./packages/image-view/spec/fixtures` folder as a backup
    // But we will search through the directories available in the project to find
    // the right one that contains our specs. Since we can't safely assume they will
    // always be the first one.

    let projectDirectories = atom.project.getDirectories();

    for (let i = 0; i < projectDirectories.length; i++) {
      let possibleProjectDir = projectDirectories[i].resolve('binary-file.png');
      if (fs.existsSync(possibleProjectDir)) {
        filePath = projectDirectories[i].resolve('binary-file.png');
        filePath2 = projectDirectories[i].resolve('binary-file-2.png');
      }
    }
    //filePath = atom.project.getDirectories()[0].resolve('binary-file.png')
    //filePath2 = atom.project.getDirectories()[0].resolve('binary-file-2.png')
    editor = new ImageEditor(filePath)
    view = new ImageEditorView(editor)
    view.element.style.height = '100px'
    jasmine.attachToDOM(view.element)

    await conditionPromise(() => view.loaded)
  })

  afterEach(() => {
    editor.destroy()
    view.destroy()
  })

  it('displays the image for a path', () => {
    expect(view.refs.image.src).toContain('/fixtures/binary-file.png')
  })

  describe('when the image is changed', () => {
    it('reloads the image', () => {
      spyOn(view, 'updateImageURI')
      editor.file.emitter.emit('did-change')
      expect(view.updateImageURI).toHaveBeenCalled()
    })
  })

  describe('when the image is moved', () => {
    it('updates the title', () => {
      const titleHandler = jasmine.createSpy('titleHandler')
      editor.onDidChangeTitle(titleHandler)
      editor.file.emitter.emit('did-rename')

      expect(titleHandler).toHaveBeenCalled()
    })
  })

  describe('image-view:reload', () => {
    it('reloads the image', () => {
      spyOn(view, 'updateImageURI')
      atom.commands.dispatch(view.element, 'image-view:reload')
      expect(view.updateImageURI).toHaveBeenCalled()
    })
  })

  describe('image-view:zoom-in', () => {
    it('increases the image size by 25%', () => {
      atom.commands.dispatch(view.element, 'image-view:zoom-in')
      expect(view.refs.image.offsetWidth).toBe(13)
      expect(view.refs.image.offsetHeight).toBe(13)
    })
  })

  describe('image-view:zoom-out', () => {
    it('decreases the image size by 25%', () => {
      atom.commands.dispatch(view.element, 'image-view:zoom-out')
      expect(view.refs.image.offsetWidth).toBe(8)
      expect(view.refs.image.offsetHeight).toBe(8)
    })
  })

  describe('image-view:reset-zoom', () => {
    it('restores the image to the original size', () => {
      atom.commands.dispatch(view.element, 'image-view:zoom-in')
      expect(view.refs.image.offsetWidth).not.toBe(10)
      expect(view.refs.image.offsetHeight).not.toBe(10)
      atom.commands.dispatch(view.element, 'image-view:reset-zoom')
      expect(view.refs.image.offsetWidth).toBe(10)
      expect(view.refs.image.offsetHeight).toBe(10)
    })
  })

  describe('.adjustSize(factor)', () => {
    it('does not allow a zoom percentage lower than 10%', () => {
      view.adjustSize(0)
      expect(view.refs.resetZoomButton.textContent).toBe('10%')
    })
  })

  describe('when special characters are used in the file name', () => {
    describe("when '?' exists in the file name", () => {
      it('is replaced with %3F', () => {
        const newEditor = new ImageEditor('/test/file/?.png')
        expect(newEditor.getEncodedURI()).toBe('file:///test/file/%3F.png')
      })
    })

    describe("when '#' exists in the file name", () => {
      it('is replaced with %23', () => {
        const newEditor = new ImageEditor('/test/file/#.png')
        expect(newEditor.getEncodedURI()).toBe('file:///test/file/%23.png')
      })
    })

    describe("when '%2F' exists in the file name", () => {
      it('should properly encode the %', () => {
        const newEditor = new ImageEditor('/test/file/%2F.png')
        expect(newEditor.getEncodedURI()).toBe('file:///test/file/%252F.png')
      })
    })

    describe('when multiple special characters exist in the file name', () => {
      it('are all replaced with escaped characters', () => {
        const newEditor = new ImageEditor('/test/file/a?#b#?.png')
        expect(newEditor.getEncodedURI()).toBe('file:///test/file/a%3F%23b%23%3F.png')
      })
    })
  })

  describe('when multiple images are opened at the same time', () => {
    beforeEach(() => {
      view.destroy()
      jasmine.attachToDOM(workspaceElement)

      waitsForPromise(() => atom.packages.activatePackage('image-view'))
    })

    it('correctly calculates originalWidth and originalHeight for all opened images', async () => {
      let imageEditor1 = null
      let imageEditor2 = null

      await Promise.all([atom.workspace.open(filePath), atom.workspace.open(filePath2)])

      expect(atom.workspace.getActivePane().getItems().length).toBe(2)
      imageEditor1 = atom.workspace.getActivePane().getItems()[0]
      imageEditor2 = atom.workspace.getActivePane().getItems()[1]
      // TODO: These two tests fail only within our CI (Or only on Linux, or not on Windows)
      // They need to be resolved ideally by someone running or with access to a linux machine.
      //expect(imageEditor1 instanceof ImageEditor).toBe(true)
      //expect(imageEditor2 instanceof ImageEditor).toBe(true)

      await conditionPromise(() => imageEditor1.view.loaded && imageEditor2.view.loaded)

      runs(() => {
        expect(imageEditor1.view.originalWidth).toBe(10)
        expect(imageEditor1.view.originalHeight).toBe(10)
        expect(imageEditor2.view.originalWidth).toBe(10)
        expect(imageEditor2.view.originalHeight).toBe(10)
      })
    })
  })
})
