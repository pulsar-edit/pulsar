const fs = require('fs')
const {it, fit, ffit, beforeEach} = require('./async-spec-helpers') // eslint-disable-line

describe('Autosave', () => {
  let workspaceElement, initialActiveItem, otherItem1, otherItem2

  beforeEach(async () => {
    workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)

    await atom.packages.activatePackage('autosave')

    await atom.workspace.open('sample.js')

    initialActiveItem = atom.workspace.getActiveTextEditor()

    if (atom.workspace.createItemForURI != null) {
      otherItem1 = await atom.workspace.createItemForURI('sample.coffee')
    } else {
      otherItem1 = await atom.workspace.open('sample.coffee', {activateItem: false})
    }

    otherItem2 = otherItem1.copy()

    spyOn(initialActiveItem, 'save').andCallFake(() => Promise.resolve())
    spyOn(otherItem1, 'save').andCallFake(() => Promise.resolve())
    spyOn(otherItem2, 'save').andCallFake(() => Promise.resolve())
  })

  describe('when the item is not modified', () => {
    it('does not autosave the item', () => {
      atom.config.set('autosave.enabled', true)
      atom.workspace.getActivePane().splitRight({items: [otherItem1]})
      expect(initialActiveItem.save).not.toHaveBeenCalled()
    })
  })

  describe('when the buffer is modified', () => {
    beforeEach(() => initialActiveItem.setText('i am modified'))

    it('autosaves newly added items', async () => {
      const newItem = await atom.workspace.createItemForURI('notyet.js')
      spyOn(newItem, 'isModified').andReturn(true)

      atom.config.set('autosave.enabled', true)
      spyOn(atom.workspace.getActivePane(), 'saveItem').andCallFake(() => Promise.resolve())
      atom.workspace.getActivePane().addItem(newItem)

      expect(atom.workspace.getActivePane().saveItem).toHaveBeenCalledWith(newItem)
    })

    describe('when a pane loses focus', () => {
      it('saves the item if autosave is enabled and the item has a uri', () => {
        document.body.focus()
        expect(initialActiveItem.save).not.toHaveBeenCalled()

        workspaceElement.focus()
        atom.config.set('autosave.enabled', true)
        document.body.focus()
        expect(initialActiveItem.save).toHaveBeenCalled()
      })

      it('suppresses autosave if the file does not exist', () => {
        document.body.focus()
        expect(initialActiveItem.save).not.toHaveBeenCalled()

        workspaceElement.focus()
        atom.config.set('autosave.enabled', true)

        const originalPath = atom.workspace.getActiveTextEditor().getPath()
        const tmpPath = `${originalPath}~`
        fs.renameSync(originalPath, tmpPath)

        document.body.focus()
        expect(initialActiveItem.save).not.toHaveBeenCalled()

        fs.renameSync(tmpPath, originalPath)
      })

      it('suppresses autosave if the focused element is contained by the editor, such as occurs when opening the autocomplete menu', () => {
        atom.config.set('autosave.enabled', true)
        const focusStealer = document.createElement('div')
        focusStealer.setAttribute('tabindex', -1)

        const textEditorElement = atom.views.getView(atom.workspace.getActiveTextEditor())
        textEditorElement.appendChild(focusStealer)
        focusStealer.focus()
        expect(initialActiveItem.save).not.toHaveBeenCalled()
      })
    })

    describe('when a new pane is created', () => {
      it('saves the item if autosave is enabled and the item has a uri', () => {
        const leftPane = atom.workspace.getActivePane()
        const rightPane = leftPane.splitRight()
        expect(initialActiveItem.save).not.toHaveBeenCalled()

        rightPane.destroy()
        leftPane.activate()

        atom.config.set('autosave.enabled', true)
        leftPane.splitRight()
        expect(initialActiveItem.save).toHaveBeenCalled()
      })
    })

    describe('when an item is destroyed', () => {
      describe('when the item is the active item', () => {
        it('does not save the item if autosave is enabled and the item has a uri', async () => {
          let leftPane = atom.workspace.getActivePane()
          const rightPane = leftPane.splitRight({items: [otherItem1]})
          leftPane.activate()
          expect(initialActiveItem).toBe(atom.workspace.getActivePaneItem())
          leftPane.destroyItem(initialActiveItem)
          expect(initialActiveItem.save).not.toHaveBeenCalled()

          otherItem2.setText('I am also modified')
          atom.config.set('autosave.enabled', true)
          leftPane = rightPane.splitLeft({items: [otherItem2]})
          expect(otherItem2).toBe(atom.workspace.getActivePaneItem())
          await leftPane.destroyItem(otherItem2)
          expect(otherItem2.save).toHaveBeenCalled()
        })
      })

      describe('when the item is NOT the active item', () => {
        it('does not save the item if autosave is enabled and the item has a uri', () => {
          let leftPane = atom.workspace.getActivePane()
          const rightPane = leftPane.splitRight({items: [otherItem1]})
          expect(initialActiveItem).not.toBe(atom.workspace.getActivePaneItem())
          leftPane.destroyItem(initialActiveItem)
          expect(initialActiveItem.save).not.toHaveBeenCalled()

          otherItem2.setText('I am also modified')
          atom.config.set('autosave.enabled', true)
          leftPane = rightPane.splitLeft({items: [otherItem2]})
          rightPane.focus()
          expect(otherItem2).not.toBe(atom.workspace.getActivePaneItem())
          leftPane.destroyItem(otherItem2)
          expect(otherItem2.save).toHaveBeenCalled()
        })
      })
    })

    describe('when the item does not have a URI', () => {
      it('does not save the item', async () => {
        await atom.workspace.open()

        const pathLessItem = atom.workspace.getActiveTextEditor()
        spyOn(pathLessItem, 'save').andCallThrough()
        pathLessItem.setText('text!')
        expect(pathLessItem.getURI()).toBeFalsy()

        atom.config.set('autosave.enabled', true)
        atom.workspace.getActivePane().destroyItem(pathLessItem)
        expect(pathLessItem.save).not.toHaveBeenCalled()
      })
    })
  })

  describe('when the window is blurred', () => {
    it('saves all items', () => {
      atom.config.set('autosave.enabled', true)

      const leftPane = atom.workspace.getActivePane()
      leftPane.splitRight({items: [otherItem1]})

      initialActiveItem.insertText('a')
      otherItem1.insertText('b')

      window.dispatchEvent(new FocusEvent('blur'))

      expect(initialActiveItem.save).toHaveBeenCalled()
      expect(otherItem1.save).toHaveBeenCalled()
    })
  })

  describe('when the package is deactivated', () => {
    it('saves all items and waits for saves to complete', () => {
      atom.config.set('autosave.enabled', true)

      const leftPane = atom.workspace.getActivePane()
      leftPane.splitRight({items: [otherItem1]})

      initialActiveItem.insertText('a')
      otherItem1.insertText('b')

      let deactivated = false
      let asyncDeactivateSupported = true
      let resolveInitial = () => {}
      let resolveOther = () => {}
      initialActiveItem.save.andCallFake(() => {
        return new Promise(resolve => {
          resolveInitial = resolve
        })
      })
      otherItem1.save.andCallFake(() => {
        return new Promise(resolve => {
          resolveOther = resolve
        })
      })

      let deactivatePromise = atom.packages.deactivatePackage('autosave')
      if (!deactivatePromise || !deactivatePromise.then || typeof deactivatePromise.then !== 'function') {
        // Atom does not support asynchronous package deactivation.
        // This keeps us from failing on 1.20
        asyncDeactivateSupported = false
        deactivatePromise = Promise.resolve()
      }
      deactivatePromise.then((result) => {
        if (result === undefined) {
          // This keeps us from failing on 1.21-beta1
          asyncDeactivateSupported = false
        }
        deactivated = true
      })

      waitsForPromise(() => Promise.resolve())

      runs(() => {
        if (asyncDeactivateSupported) {
          expect(deactivated).toBe(false)
        }

        resolveInitial()
        resolveOther()
      })

      waitsFor(() => !asyncDeactivateSupported || deactivated)
    })
  })

  it("saves via the item's Pane so that write errors are handled via notifications", async () => {
    const saveError = new Error('Save failed')
    saveError.code = 'EACCES'
    saveError.path = initialActiveItem.getPath()
    initialActiveItem.save.andThrow(saveError)

    const errorCallback = jasmine.createSpy('errorCallback').andCallFake(({preventDefault}) => preventDefault())
    atom.onWillThrowError(errorCallback)
    spyOn(atom.notifications, 'addWarning')

    initialActiveItem.insertText('a')
    atom.config.set('autosave.enabled', true)

    await atom.workspace.destroyActivePaneItem()
    expect(initialActiveItem.save).toHaveBeenCalled()
    expect(atom.notifications.addWarning.callCount > 0 || errorCallback.callCount > 0).toBe(true)
  })

  describe('dontSaveIf service', () => {
    it("doesn't save a paneItem if a predicate function registered via the dontSaveIf service returns true", async () => {
      atom.workspace.getActivePane().addItem(otherItem1)
      atom.config.set('autosave.enabled', true)
      const service = atom.packages.getActivePackage('autosave').mainModule.provideService()
      service.dontSaveIf(paneItem => paneItem === initialActiveItem)

      initialActiveItem.setText('foo')
      otherItem1.setText('bar')

      window.dispatchEvent(new FocusEvent('blur'))

      expect(initialActiveItem.save).not.toHaveBeenCalled()
      expect(otherItem1.save).toHaveBeenCalled()
    })
  })
})
