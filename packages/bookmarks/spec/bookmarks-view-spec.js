describe('Bookmarks package', () => {
  let workspaceElement, editorElement, editor, bookmarks, provider

  const bookmarkedRangesForEditor = editor => {
    const decorationsById = editor.decorationsStateForScreenRowRange(0, editor.getLastScreenRow())
    const decorations = Object.keys(decorationsById).map(key => decorationsById[key])
    return decorations.filter(decoration => decoration.properties.class === 'bookmarked')
                      .filter(decoration => decoration.properties.type === 'line-number')
                      .map(decoration => decoration.screenRange)
  }

  const getBookmarkedLineNodes = editorElement => editorElement.querySelectorAll('.line-number.bookmarked')

  beforeEach(async () => {
    spyOn(window, 'setImmediate').andCallFake(fn => fn())
    workspaceElement = atom.views.getView(atom.workspace)

    await atom.workspace.open('sample.js')

    bookmarks = (await atom.packages.activatePackage('bookmarks')).mainModule
    provider = bookmarks.bookmarksProvider

    jasmine.attachToDOM(workspaceElement)
    editor = atom.workspace.getActiveTextEditor()
    editorElement = atom.views.getView(editor)
    spyOn(atom, 'beep')
  })

  describe('toggling bookmarks', () => {
    describe('point marker bookmark', () => {
      it('creates a marker when toggled', () => {
        editor.setCursorBufferPosition([3, 10])
        expect(bookmarkedRangesForEditor(editor)).toEqual([])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor)).toEqual([[[3, 10], [3, 10]]])

        let marks = provider.getBookmarksForEditor(editor)
        expect(marks.length).toBe(1)
        expect(marks.map(m => m.getScreenRange())).toEqual(bookmarkedRangesForEditor(editor))
      })

      it('removes marker when toggled', () => {
        let callback = jasmine.createSpy()

        let instance = provider.getInstanceForEditor(editor)
        instance.onDidChangeBookmarks(callback)

        editor.setCursorBufferPosition([3, 10])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(1)
        expect(callback.callCount).toBe(1)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
        expect(callback.callCount).toBe(2)
      })
    })

    describe('multiple point marker bookmark', () => {
      it('creates multiple markers when toggled', () => {
        editor.setCursorBufferPosition([3, 10])
        editor.addCursorAtBufferPosition([6, 11])
        expect(bookmarkedRangesForEditor(editor)).toEqual([])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor)).toEqual([[[3, 10], [3, 10]], [[6, 11], [6, 11]]])
        let instance = provider.getInstanceForEditor(editor)
        expect(instance.getAllBookmarks().length).toBe(2)
      })

      it('removes multiple markers when toggled', () => {
        editor.setCursorBufferPosition([3, 10])
        editor.addCursorAtBufferPosition([6, 11])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(2)
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      })

      it('adds and removes multiple markers at the same time', () => {
        editor.setCursorBufferPosition([3, 10])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor)).toEqual([[[3, 10], [3, 10]]])

        editor.addCursorAtBufferPosition([6, 11])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor)).toEqual([[[6, 11], [6, 11]]])

        editor.addCursorAtBufferPosition([8, 8])
        editor.addCursorAtBufferPosition([11, 8])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor)).toEqual([[[3, 10], [3, 10]], [[8, 8], [8, 8]], [[11, 8], [11, 8]]])

        // reset cursors, and try multiple cursors on same line but different ranges
        editor.setCursorBufferPosition([8, 40])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor)).toEqual([[[3, 10], [3, 10]], [[11, 8], [11, 8]]])

        editor.addCursorAtBufferPosition([3, 0])
        editor.addCursorAtBufferPosition([11, 0])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor)).toEqual([[[8, 40], [8, 40]]])

        editor.setCursorBufferPosition([8, 0])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      })
    })

    describe('single line range marker bookmark', () => {
      it('created a marker when toggled', () => {
        editor.setSelectedBufferRanges([[[3, 5], [3, 10]]])
        expect(bookmarkedRangesForEditor(editor)).toEqual([])

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')

        expect(bookmarkedRangesForEditor(editor)).toEqual([[[3, 5], [3, 10]]])
      })

      it('removes marker when toggled', () => {
        editor.setSelectedBufferRanges([[[3, 5], [3, 10]]])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(1)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      })
    })

    describe('multi line range marker bookmark', () => {
      it('created a marker when toggled', () => {
        editor.setSelectedBufferRanges([[[1, 5], [3, 10]]])
        expect(bookmarkedRangesForEditor(editor)).toEqual([])

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')

        expect(bookmarkedRangesForEditor(editor)).toEqual([[[1, 5], [3, 10]]])
      })

      it('removes marker when toggled', () => {
        editor.setSelectedBufferRanges([[[1, 5], [3, 10]]])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(1)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      })

      it('removes marker when toggled inside bookmark', () => {
        editor.setSelectedBufferRanges([[[1, 5], [3, 10]]])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(1)

        editor.setCursorBufferPosition([2, 2])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      })

      it('removes marker when toggled outside bookmark on start row', () => {
        editor.setSelectedBufferRanges([[[1, 5], [3, 10]]])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(1)

        editor.setCursorBufferPosition([1, 2])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      })

      it('removes marker when toggled outside bookmark on end row', () => {
        editor.setSelectedBufferRanges([[[1, 5], [3, 8]]])
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)

        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(1)

        editor.setCursorBufferPosition([3, 10])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      })
    })

    it('toggles proper classes on proper gutter, line row and highlight on point bookmark', () => {
      editor.setCursorBufferPosition([3, 10])
      expect(getBookmarkedLineNodes(editorElement).length).toBe(0)

      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      let lines = getBookmarkedLineNodes(editorElement)

      expect(editorElement.querySelectorAll('.highlight.bookmarked').length).toBe(0)
      expect(editorElement.querySelectorAll('.line.bookmarked').length).toBe(1)
      expect(editorElement.querySelectorAll('.line-number.bookmarked').length).toBe(1)
      expect(lines[0]).toHaveData('buffer-row', 3)

      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')

      expect(editorElement.querySelectorAll('.highlight.bookmarked').length).toBe(0)
      expect(editorElement.querySelectorAll('.line.bookmarked').length).toBe(0)
      expect(editorElement.querySelectorAll('.line-number.bookmarked').length).toBe(0)
    })

    it('toggles proper classes on proper gutter, line row and highlight on range bookmark', () => {
      editor.setSelectedBufferRanges([[[3, 5], [3, 10]]])
      expect(editorElement.querySelectorAll('.bookmarked').length).toBe(0)

      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      let lines = getBookmarkedLineNodes(editorElement)

      expect(editorElement.querySelectorAll('.highlight.bookmarked').length).toBe(1)
      expect(editorElement.querySelectorAll('.line.bookmarked').length).toBe(1)
      expect(editorElement.querySelectorAll('.line-number.bookmarked').length).toBe(1)
      expect(lines[0]).toHaveData('buffer-row', 3)

      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')

      expect(editorElement.querySelectorAll('.highlight.bookmarked').length).toBe(0)
      expect(editorElement.querySelectorAll('.line.bookmarked').length).toBe(0)
      expect(editorElement.querySelectorAll('.line-number.bookmarked').length).toBe(0)
    })

    it('clears all bookmarks', () => {
      let callback = jasmine.createSpy()
      let instance = provider.getInstanceForEditor(editor)
      instance.onDidChangeBookmarks(callback)

      editor.setCursorBufferPosition([3, 10])
      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      expect(callback.callCount).toBe(1)

      editor.setCursorBufferPosition([5, 0])
      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      expect(callback.callCount).toBe(2)

      atom.commands.dispatch(editorElement, 'bookmarks:clear-bookmarks')
      expect(getBookmarkedLineNodes(editorElement).length).toBe(0)
      expect(callback.callCount).toBe(3)
    })
  })

  describe('when a bookmark is invalidated', () => {
    it('creates a marker when toggled', () => {
      let callback = jasmine.createSpy()
      let instance = provider.getInstanceForEditor(editor)
      instance.onDidChangeBookmarks(callback)
      editor.setCursorBufferPosition([3, 10])
      expect(bookmarkedRangesForEditor(editor).length).toBe(0)

      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      expect(bookmarkedRangesForEditor(editor).length).toBe(1)
      expect(callback.callCount).toBe(1)

      editor.setText('')
      expect(bookmarkedRangesForEditor(editor).length).toBe(0)
      expect(callback.callCount).toBe(2)
    })
  })

  describe('jumping between bookmarks', () => {
    it("doesn't die when no bookmarks", () => {
      editor.setCursorBufferPosition([5, 10])

      atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
      expect(editor.getLastCursor().getBufferPosition()).toEqual([5, 10])
      expect(atom.beep.callCount).toBe(1)

      atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
      expect(editor.getLastCursor().getBufferPosition()).toEqual([5, 10])
      expect(atom.beep.callCount).toBe(2)
    })

    describe('with one bookmark', () => {
      beforeEach(() => {
        editor.setCursorBufferPosition([2, 0])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      })

      it('jump-to-next-bookmark jumps to the right place', () => {
        editor.setCursorBufferPosition([0, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])

        editor.setCursorBufferPosition([5, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])
      })

      it('jump-to-previous-bookmark jumps to the right place', () => {
        editor.setCursorBufferPosition([0, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])

        editor.setCursorBufferPosition([5, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])
      })
    })

    describe('with bookmarks', () => {
      beforeEach(() => {
        editor.setCursorBufferPosition([2, 0])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')

        editor.setSelectedBufferRanges([[[8, 4], [10, 0]]])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')

        editor.setCursorBufferPosition([5, 0])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      })

      it('jump-to-next-bookmark finds next bookmark', () => {
        editor.setCursorBufferPosition([0, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([5, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getMarker().getBufferRange()).toEqual([[8, 4], [10, 0]])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])

        editor.setCursorBufferPosition([11, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])
      })

      it('jump-to-previous-bookmark finds previous bookmark', () => {
        editor.setCursorBufferPosition([0, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getMarker().getBufferRange()).toEqual([[8, 4], [10, 0]])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([5, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getBufferPosition()).toEqual([2, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getMarker().getBufferRange()).toEqual([[8, 4], [10, 0]])

        editor.setCursorBufferPosition([11, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:jump-to-previous-bookmark')
        expect(editor.getLastCursor().getMarker().getBufferRange()).toEqual([[8, 4], [10, 0]])
      })
    })
  })

  describe('when inserting text next to the bookmark', () => {
    beforeEach(() => {
      editor.setSelectedBufferRanges([[[3, 10], [3, 25]]])
      expect(bookmarkedRangesForEditor(editor).length).toBe(0)

      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      expect(bookmarkedRangesForEditor(editor).length).toBe(1)
    })

    it('moves the bookmarked range forward when typing in the start', () => {
      editor.setCursorBufferPosition([3, 10])
      editor.insertText('Hello')
      editor.setCursorBufferPosition([0, 0])

      atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
      expect(editor.getLastCursor().getMarker().getBufferRange()).toEqual([[3, 15], [3, 30]])
    })

    it('doesnt extend the bookmarked range when typing in the end', () => {
      editor.setCursorBufferPosition([3, 25])
      editor.insertText('Hello')
      editor.setCursorBufferPosition([0, 0])

      atom.commands.dispatch(editorElement, 'bookmarks:jump-to-next-bookmark')
      expect(editor.getLastCursor().getMarker().getBufferRange()).toEqual([[3, 10], [3, 25]])
    })
  })

  describe('browsing bookmarks', () => {
    it('displays a select list of all bookmarks', async () => {
      editor.setCursorBufferPosition([0])
      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      editor.setCursorBufferPosition([2])
      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      editor.setCursorBufferPosition([4])
      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')

      await atom.commands.dispatch(workspaceElement, 'bookmarks:view-all')

      bookmarks = workspaceElement.querySelectorAll('.bookmark')
      expect(bookmarks.length).toBe(3)
      expect(bookmarks[0].querySelector('.primary-line').textContent).toBe('sample.js:1')
      expect(bookmarks[0].querySelector('.secondary-line').textContent).toBe('var quicksort = function () {')
      expect(bookmarks[1].querySelector('.primary-line').textContent).toBe('sample.js:3')
      expect(bookmarks[1].querySelector('.secondary-line').textContent).toBe('if (items.length <= 1) return items;')
      expect(bookmarks[2].querySelector('.primary-line').textContent).toBe('sample.js:5')
      expect(bookmarks[2].querySelector('.secondary-line').textContent).toBe('while(items.length > 0) {')
    })

    describe('when a bookmark is selected', () => {
      let editor2

      beforeEach(async () => {
        editor2 = await atom.workspace.open('sample.coffee')
      })

      it('sets the cursor to the location of the bookmark and activates the right editor', async () => {
        editor.setCursorBufferPosition([8])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        editor.setCursorBufferPosition([0])

        atom.workspace.paneForItem(editor2).activateItem(editor2)
        await atom.commands.dispatch(workspaceElement, 'bookmarks:view-all')

        const bookmarkElement = workspaceElement.querySelector('.bookmarks-view .bookmark')

        await atom.commands.dispatch(bookmarkElement, 'core:confirm')

        expect(atom.workspace.getActiveTextEditor()).toEqual(editor)
        expect(editor.getCursorBufferPosition()).toEqual([8, 0])
      })

      it('searches for the bookmark among all panes and editors', async () => {
        editor.setCursorBufferPosition([8])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
        editor.setCursorBufferPosition([0])

        atom.workspace.paneForItem(editor2).activateItem(editor2)
        const pane1 = atom.workspace.getActivePane()
        pane1.splitRight()
        expect(atom.workspace.getActivePane()).not.toEqual(pane1)

        await atom.commands.dispatch(workspaceElement, 'bookmarks:view-all')

        const bookmarkElement = workspaceElement.querySelector('.bookmarks-view .bookmark')

        await atom.commands.dispatch(bookmarkElement, 'core:confirm')

        expect(atom.workspace.getActiveTextEditor()).toEqual(editor)
        expect(editor.getCursorBufferPosition()).toEqual([8, 0])
      })
    })
  })

  describe('serializing/deserializing bookmarks', () => {
    let [editor2, editorElement2] = []

    beforeEach(async () => {
      editor2 = await atom.workspace.open('sample.coffee')
      editorElement2 = atom.views.getView(editor2)
    })

    it('restores bookmarks on all the previously open editors', () => {
      editor.setCursorScreenPosition([1, 2])
      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      editor2.setCursorScreenPosition([4, 5])
      atom.commands.dispatch(editorElement2, 'bookmarks:toggle-bookmark')

      expect(bookmarkedRangesForEditor(editor)).toEqual([[[1, 2], [1, 2]]])
      expect(bookmarkedRangesForEditor(editor2)).toEqual([[[4, 5], [4, 5]]])

      const state = bookmarks.serialize()
      bookmarks.deactivate()
      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      atom.commands.dispatch(editorElement2, 'bookmarks:toggle-bookmark')

      // toggling the bookmark has no effect when the package is deactivated.
      expect(bookmarkedRangesForEditor(editor)).toEqual([])
      expect(bookmarkedRangesForEditor(editor2)).toEqual([])

      bookmarks.activate(state)

      expect(bookmarkedRangesForEditor(editor)).toEqual([[[1, 2], [1, 2]]])
      expect(bookmarkedRangesForEditor(editor2)).toEqual([[[4, 5], [4, 5]]])

      atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      atom.commands.dispatch(editorElement2, 'bookmarks:toggle-bookmark')

      expect(bookmarkedRangesForEditor(editor)).toEqual([])
      expect(bookmarkedRangesForEditor(editor2)).toEqual([])
    })
  })

  describe('selecting bookmarks', () => {
    it('doesnt die when no bookmarks', () => {
      editor.setCursorBufferPosition([5, 10])

      atom.commands.dispatch(editorElement, 'bookmarks:select-to-next-bookmark')
      expect(editor.getLastCursor().getBufferPosition()).toEqual([5, 10])
      expect(atom.beep.callCount).toBe(1)

      atom.commands.dispatch(editorElement, 'bookmarks:select-to-previous-bookmark')
      expect(editor.getLastCursor().getBufferPosition()).toEqual([5, 10])
      expect(atom.beep.callCount).toBe(2)
    })

    describe('with one bookmark', () => {
      beforeEach(() => {
        editor.setCursorBufferPosition([2, 0])
        atom.commands.dispatch(editorElement, 'bookmarks:toggle-bookmark')
      })

      it('select-to-next-bookmark selects to the right place', () => {
        editor.setCursorBufferPosition([0, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:select-to-next-bookmark')
        expect(editor.getSelectedBufferRange()).toEqual([[0, 0], [2, 0]])
      })

      it('select-to-next-bookmark selects to the only bookmark', () => {
        editor.setCursorBufferPosition([4, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:select-to-next-bookmark')
        expect(editor.getSelectedBufferRange()).toEqual([[4, 0], [2, 0]])
      })

      it('select-to-previous-bookmark selects to the right place', () => {
        editor.setCursorBufferPosition([4, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:select-to-previous-bookmark')
        expect(editor.getSelectedBufferRange()).toEqual([[4, 0], [2, 0]])
      })

      it('select-to-previous-bookmark selects to the only bookmark', () => {
        editor.setCursorBufferPosition([0, 0])

        atom.commands.dispatch(editorElement, 'bookmarks:select-to-previous-bookmark')
        expect(editor.getSelectedBufferRange()).toEqual([[0, 0], [2, 0]])
      })
    })
  })
})
