const SelectList = require('atom-select-list')
const {it, fit, ffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line

describe('EncodingSelector', () => {
  let editor

  beforeEach(async () => {
    jasmine.attachToDOM(atom.views.getView(atom.workspace))

    await atom.packages.activatePackage('status-bar')
    await atom.packages.activatePackage('encoding-selector')
    editor = await atom.workspace.open('sample.js')
  })

  afterEach(async () => {
    await atom.packages.deactivatePackage('encoding-selector')
  })

  describe('when encoding-selector:show is triggered', () => {
    it('displays a list of all the available encodings', async () => {
      atom.commands.dispatch(editor.getElement(), 'encoding-selector:show')
      await SelectList.getScheduler().getNextUpdatePromise()

      expect(document.body.querySelectorAll('.encoding-selector li').length).toBeGreaterThan(1)
    })
  })

  describe('when an encoding is selected', () => {
    it('sets the new encoding on the editor', async () => {
      atom.commands.dispatch(editor.getElement(), 'encoding-selector:show')
      await SelectList.getScheduler().getNextUpdatePromise()

      const encodingListView = atom.workspace.getModalPanels()[0].getItem()
      encodingListView.props.didConfirmSelection({id: 'utf16le'})
      expect(editor.getEncoding()).toBe('utf16le')
    })
  })

  describe('when Auto Detect is selected', () => {
    it('detects the character set and applies that encoding', async () => {
      const encodingChangeHandler = jasmine.createSpy('encodingChangeHandler')
      editor.onDidChangeEncoding(encodingChangeHandler)

      editor.setEncoding('utf16le')
      expect(encodingChangeHandler.callCount).toBe(1)

      atom.commands.dispatch(editor.getElement(), 'encoding-selector:show')
      await SelectList.getScheduler().getNextUpdatePromise()

      const encodingListView = atom.workspace.getModalPanels()[0].getItem()
      encodingListView.props.didConfirmSelection({id: 'detect'})
      await new Promise(resolve => {
        encodingChangeHandler.andCallFake(() => {
          expect(editor.getEncoding()).toBe('utf8')
          resolve()
        })
      })
    })
  })

  describe('encoding label', () => {
    let encodingStatus

    beforeEach(async () => {
      encodingStatus = document.querySelector('.encoding-status')

      // Wait for status bar service hook to fire
      while (!encodingStatus || !encodingStatus.textContent) {
        await atom.views.getNextUpdatePromise()
        encodingStatus = document.querySelector('.encoding-status')
      }
    })

    it('displays the name of the current encoding', () => {
      expect(encodingStatus.querySelector('a').textContent).toBe('UTF-8')
    })

    it('hides the label when the current encoding is null', async () => {
      spyOn(editor, 'getEncoding').andReturn(null)
      editor.setEncoding('utf16le')
      await atom.views.getNextUpdatePromise()
      expect(encodingStatus.offsetHeight).toBe(0)
    })

    describe("when the editor's encoding changes", () => {
      it('displays the new encoding of the editor', async () => {
        expect(encodingStatus.querySelector('a').textContent).toBe('UTF-8')
        editor.setEncoding('utf16le')
        await atom.views.getNextUpdatePromise()
        expect(encodingStatus.querySelector('a').textContent).toBe('UTF-16 LE')
      })
    })

    describe('when clicked', () => {
      it('toggles the encoding-selector:show event', () => {
        const eventHandler = jasmine.createSpy('eventHandler')
        atom.commands.add('atom-text-editor', 'encoding-selector:show', eventHandler)
        encodingStatus.click()
        expect(eventHandler).toHaveBeenCalled()
      })
    })

    describe('when the package is deactivated', () => {
      it('removes the view', async () => {
        await atom.packages.deactivatePackage('encoding-selector')
        expect(encodingStatus.parentElement).toBeNull()
      })
    })
  })
})
