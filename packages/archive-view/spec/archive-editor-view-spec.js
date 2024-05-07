const {Disposable, File} = require('atom')
const getIconServices = require('../lib/get-icon-services')
const {conditionPromise} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

async function condition (handler) {
  if (jasmine.isSpy(window.setTimeout)) {
    jasmine.useRealClock()
  }
  return conditionPromise(handler)
}

describe('ArchiveEditorView', () => {
  let archiveEditorView, onDidChangeCallback, onDidRenameCallback, onDidDeleteCallback

  beforeEach(async (done) => {
    spyOn(File.prototype, 'onDidChange').and.callFake(function (callback) {
      if (/\.tar$/.test(this.getPath())) {
        onDidChangeCallback = callback
      }
      return new Disposable()
    })

    spyOn(File.prototype, 'onDidRename').and.callFake(function (callback) {
      if (/\.tar$/.test(this.getPath())) {
        onDidRenameCallback = callback
      }
      return new Disposable()
    })

    spyOn(File.prototype, 'onDidDelete').and.callFake(function (callback) {
      if (/\.tar$/.test(this.getPath())) {
        onDidDeleteCallback = callback
      }
      return new Disposable()
    })

    await atom.packages.activatePackage('archive-view')
    archiveEditorView = await atom.workspace.open('nested.tar')

    done();
  })

  describe('.constructor()', () => {
    it('displays the files and folders in the archive file', async (done) => {
      expect(archiveEditorView.element).toExist()
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)

      const directoryElements = archiveEditorView.element.querySelectorAll('.directory')
      expect(directoryElements.length).toBe(6)
      expect(directoryElements[0].textContent).toBe('d1')
      expect(directoryElements[1].textContent).toBe('d2')
      expect(directoryElements[2].textContent).toBe('d3')
      expect(directoryElements[3].textContent).toBe('d4')
      expect(directoryElements[4].textContent).toBe('da')
      expect(directoryElements[5].textContent).toBe('db')

      const fileElements = archiveEditorView.element.querySelectorAll('.file')
      expect(fileElements.length).toBe(3)
      expect(fileElements[0].textContent).toBe('f1.txt')
      expect(fileElements[1].textContent).toBe('f2.txt')
      expect(fileElements[2].textContent).toBe('fa.txt')

      done();
    })

    it('selects the first file', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      expect(archiveEditorView.element.querySelector('.selected').textContent).toBe('f1.txt')

      done();
    })
  })

  describe('.copy()', () => {
    it('returns a new ArchiveEditorView for the same file', () => {
      const newArchiveView = archiveEditorView.copy()
      expect(newArchiveView.getPath()).toBe(archiveEditorView.getPath())
    })
  })

  describe('archive summary', () => {
    beforeEach(async (done) => {
      await atom.workspace.open('multiple-entries.zip')
      archiveEditorView = atom.workspace.getActivePaneItem()
      jasmine.attachToDOM(atom.views.getView(atom.workspace))

      done();
    })

    it('shows correct statistics', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      const heading = archiveEditorView.element.querySelector('.inset-panel .panel-heading')
      expect(heading).not.toBe(null)
      expect(heading.textContent).toBe('704 bytes with 4 files and 1 folder')

      done();
    })
  })

  describe('when core:move-up/core:move-down is triggered', () => {
    let selectedEntry
    const dispatch = (command) => {
      atom.commands.dispatch(archiveEditorView.element.querySelector('.selected'), command)
      selectedEntry = archiveEditorView.element.querySelector('.selected').textContent
      return true
    }

    it('selects the next/previous file', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      expect(archiveEditorView.element).toBeDefined()
      dispatch('core:move-up') && expect(selectedEntry).toBe('f1.txt')
      dispatch('core:move-down') && expect(selectedEntry).toBe('f2.txt')
      dispatch('core:move-down') && expect(selectedEntry).toBe('fa.txt')
      dispatch('core:move-down') && expect(selectedEntry).toBe('fa.txt')
      dispatch('core:move-up') && expect(selectedEntry).toBe('f2.txt')
      dispatch('core:move-up') && expect(selectedEntry).toBe('f1.txt')

      done();
    })
  })

  describe('when a file is clicked', () => {
    it('copies the contents to a temp file and opens it in a new editor', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      archiveEditorView.element.querySelectorAll('.file')[2].click()
      await condition(() => atom.workspace.getActivePane().getItems().length > 1)
      expect(atom.workspace.getActivePaneItem().getText()).toBe('hey there\n')
      expect(atom.workspace.getActivePaneItem().getTitle()).toBe('fa.txt')

      done();
    })
  })

  describe('when a directory is clicked', () => {
    it('collapses/expands itself', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      let directory = archiveEditorView.element.querySelectorAll('.list-nested-item.entry')[0]
      expect(directory.classList.contains('collapsed')).toBeFalsy()
      directory.querySelector('.list-item').click()
      expect(directory.classList.contains('collapsed')).toBeTruthy()
      directory.querySelector('.list-item').click()
      expect(directory.classList.contains('collapsed')).toBeFalsy()

      done();
    })
  })

  describe('when core:confirm is triggered', () => {
    it('copies the contents to a temp file and opens it in a new editor', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      atom.commands.dispatch(archiveEditorView.element.querySelector('.file'), 'core:confirm')
      await condition(() => atom.workspace.getActivePane().getItems().length > 1)
      expect(atom.workspace.getActivePaneItem().getText()).toBe('')
      expect(atom.workspace.getActivePaneItem().getTitle()).toBe('f1.txt')

      done();
    })
  })

  describe('when the file is modified', () => {
    it('refreshes the view', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      spyOn(archiveEditorView, 'refresh')
      onDidChangeCallback()
      expect(archiveEditorView.refresh).toHaveBeenCalled()

      done();
    })
  })

  describe('when the file is renamed', () => {
    it('refreshes the view and updates the title', async (done) => {
      spyOn(File.prototype, 'getPath').and.returnValue('nested-renamed.tar')
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      spyOn(archiveEditorView, 'refresh').and.callThrough()
      spyOn(archiveEditorView, 'getTitle')
      onDidRenameCallback()
      expect(archiveEditorView.refresh).toHaveBeenCalled()
      expect(archiveEditorView.getTitle).toHaveBeenCalled()

      done();
    })
  })

  describe('when the file is removed', () => {
    it('destroys the view', async (done) => {
      await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
      expect(atom.workspace.getActivePane().getItems().length).toBe(1)
      onDidDeleteCallback()
      expect(atom.workspace.getActivePaneItem()).toBeUndefined()

      done();
    })
  })

  describe('when the file is invalid', () => {
    beforeEach(async (done) => {
      await atom.workspace.open('invalid.zip')
      archiveEditorView = atom.workspace.getActivePaneItem()
      jasmine.attachToDOM(atom.views.getView(atom.workspace))

      done();
    })

    it('shows the error', async (done) => {
      await condition(() => archiveEditorView.refs.errorMessage.offsetHeight > 0)
      expect(archiveEditorView.refs.errorMessage.textContent.length).toBeGreaterThan(0)

      done();
    })
  })

  describe('FileIcons', () => {
    async function openFile () {
      await atom.workspace.open('file-icons.zip')
      archiveEditorView = atom.workspace.getActivePaneItem()
      jasmine.attachToDOM(atom.views.getView(atom.workspace))
    }

    describe('Icon service', () => {
      const service = { iconClassForPath () {} }
      beforeEach(() => openFile())

      it('provides a default service', () => {
        expect(getIconServices().fileIcons).toBeDefined()
        expect(getIconServices().fileIcons).not.toBeNull()
      })

      it('allows the default to be overridden', () => {
        getIconServices().setFileIcons(service)
        expect(getIconServices().fileIcons).toBe(service)
      })

      it('allows service to be reset without hassle', () => {
        getIconServices().setFileIcons(service)
        getIconServices().resetFileIcons()
        expect(getIconServices().fileIcons).not.toBe(service)
      })
    })

    describe('Class handling', () => {
      function findEntryContainingText (text) {
        for (const entry of archiveEditorView.element.querySelectorAll('.list-item.entry')) {
          if (entry.textContent.includes(text)) { return entry }
        }
        return null
      }

      function checkMultiClass () {
        expect(findEntryContainingText('adobe.pdf').querySelector('.file.icon').className).toBe('file icon text pdf-icon document')
        expect(findEntryContainingText('spacer.gif').querySelector('.file.icon').className).toBe('file icon binary gif-icon image')
        expect(findEntryContainingText('font.ttf').querySelector('.file.icon').className).toBe('file icon binary ttf-icon font')
      }

      it('displays default file-icons', async (done) => {
        await openFile()
        await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
        expect(findEntryContainingText('adobe.pdf').querySelector('.file.icon.icon-file-pdf').length).not.toBe(0)
        expect(findEntryContainingText('spacer.gif').querySelector('.file.icon.icon-file-media').length).not.toBe(0)
        expect(findEntryContainingText('sunn.o').querySelector('.file.icon.icon-file-binary').length).not.toBe(0)

        done();
      })

      it('allows multiple classes to be passed', async (done) => {
        getIconServices().setFileIcons({
          iconClassForPath: (path) => {
            switch (path.match(/\w*$/)[0]) {
              case 'pdf': return 'text pdf-icon document'
              case 'ttf': return 'binary ttf-icon font'
              case 'gif': return 'binary gif-icon image'
            }
          }
        })
        await openFile()
        await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
        checkMultiClass()

        done();
      })

      it('allows an array of classes to be passed', async (done) => {
        getIconServices().setFileIcons({
          iconClassForPath: (path) => {
            switch (path.match(/\w*$/)[0]) {
              case 'pdf': return ['text', 'pdf-icon', 'document']
              case 'ttf': return ['binary', 'ttf-icon', 'font']
              case 'gif': return ['binary', 'gif-icon', 'image']
            }
          }
        })
        await openFile()
        await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
        checkMultiClass()

        done();
      })

      it('identifies context to icon-service providers', async (done) => {
        getIconServices().setFileIcons({
          iconClassForPath: (path, context) => `icon-${context}`
        })
        await openFile()
        await condition(() => archiveEditorView.element.querySelectorAll('.entry').length > 0)
        const icons = findEntryContainingText('adobe.pdf').querySelectorAll('.file.icon-archive-view')
        expect(icons.length).not.toBe(0)

        done();
      })
    })
  })
})
