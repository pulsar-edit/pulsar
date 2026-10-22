const path = require('path')
const TreeView = require('../lib/tree-view')

describe('TreeView', () => {
  describe('serialization', () => {
    it('restores the expanded directories and selected files', () => {
      const treeView = new TreeView({})
      treeView.roots[0].expand()
      treeView.roots[0].entries.firstChild.expand()
      treeView.selectEntry(treeView.roots[0].entries.firstChild.entries.firstChild)
      treeView.selectMultipleEntries(treeView.roots[0].entries.lastChild)

      const treeView2 = new TreeView(treeView.serialize())

      expect(treeView2.roots[0].isExpanded).toBe(true)
      expect(treeView2.roots[0].entries.children[0].isExpanded).toBe(true)
      expect(treeView2.roots[0].entries.children[1].isExpanded).toBeUndefined()
      expect(Array.from(treeView2.getSelectedEntries())).toEqual([
        treeView2.roots[0].entries.firstChild.entries.firstChild,
        treeView2.roots[0].entries.lastChild
      ])
    })

    it('restores the scroll position', () => {
      const treeView = new TreeView({})
      treeView.roots[0].expand()
      treeView.roots[0].entries.firstChild.expand()
      treeView.element.style.overflow = 'auto'
      treeView.element.style.height = '80px'
      treeView.element.style.width = '80px'
      jasmine.attachToDOM(treeView.element)

      treeView.element.scrollTop = 42
      treeView.element.scrollLeft = 43

      expect(treeView.element.scrollTop).toBe(42)
      expect(treeView.element.scrollLeft).toBe(43)

      const treeView2 = new TreeView(treeView.serialize())
      treeView2.element.style.overflow = 'auto'
      treeView2.element.style.height = '80px'
      treeView2.element.style.width = '80px'
      jasmine.attachToDOM(treeView2.element)

      waitsFor(() =>
        treeView2.element.scrollTop === 42 &&
        treeView2.element.scrollLeft === 43
      )
    })
  })

  describe('clicking', () => {
    it('should leave multiple entries selected on right click', () => {
      const treeView = new TreeView({})
      const entries = treeView.roots[0].entries

      treeView.onMouseDown({
        stopPropagation () {},
        target: entries.children[0],
        button: 0
      })

      treeView.onMouseDown({
        stopPropagation () {},
        target: entries.children[1],
        button: 0,
        metaKey: true
      })

      let child = entries.children[0]
      while (child.children.length > 0) {
        child = child.firstChild
      }

      treeView.onMouseDown({
        stopPropagation () {},
        target: child,
        button: 2
      })

      expect(treeView.getSelectedEntries().length).toBe(2)
      expect(treeView.multiSelectEnabled()).toBe(true)
    })
  })

  describe('file selection', () => {
    it('keeps files selected after roots have been updated', () => {
      const treeView = new TreeView({})
      treeView.roots[0].expand()
      treeView.roots[0].entries.firstChild.expand()
      treeView.selectEntry(treeView.roots[0].entries.firstChild.entries.firstChild)
      treeView.selectMultipleEntries(treeView.roots[0].entries.lastChild)

      expect(Array.from(treeView.getSelectedEntries())).toEqual([
        treeView.roots[0].entries.firstChild.entries.firstChild,
        treeView.roots[0].entries.lastChild
      ])

      treeView.updateRoots()

      expect(Array.from(treeView.getSelectedEntries())).toEqual([
        treeView.roots[0].entries.firstChild.entries.firstChild,
        treeView.roots[0].entries.lastChild
      ])
    })
  })

  describe('opening an entry in a new window', () => {
    let treeView

    // Finds a direct child of `view` (a root or an expanded directory) by its
    // file name, asserting that it exists so that a fixture change fails here
    // rather than somewhere more confusing.
    function entryNamed (view, name) {
      const entry = Array.from(view.entries.children).find(
        child => path.basename(child.getPath()) === name
      )
      expect(entry).not.toBeUndefined()
      return entry
    }

    function optionsPassedToOpen () {
      expect(atom.open).toHaveBeenCalled()
      return atom.open.mostRecentCall.args[0]
    }

    beforeEach(() => {
      treeView = new TreeView({})
      treeView.roots[0].expand()
      spyOn(atom, 'open')
    })

    it('preserves the existing project roots when opening a file', () => {
      const directory = entryNamed(treeView.roots[0], 'root-dir1')
      directory.expand()
      const file = entryNamed(directory, 'tree-view.txt')

      treeView.selectEntry(file)
      treeView.openSelectedEntryInNewWindow()

      // The tab bar's “Open in New Window” behaves this way too; the two
      // should not disagree.
      expect(optionsPassedToOpen().pathsToOpen).toEqual(
        [...atom.project.getPaths(), file.getPath()]
      )
      expect(optionsPassedToOpen().newWindow).toBe(true)
    })

    it('opens a folder as a project of its own', () => {
      const directory = entryNamed(treeView.roots[0], 'root-dir1')

      treeView.selectEntry(directory)
      treeView.openSelectedEntryInNewWindow()

      expect(optionsPassedToOpen().pathsToOpen).toEqual([directory.getPath()])
    })

    it('opens a project root as a project of its own', () => {
      const root = treeView.roots[0]

      treeView.selectEntry(root)
      treeView.openSelectedEntryInNewWindow()

      expect(optionsPassedToOpen().pathsToOpen).toEqual([root.getPath()])
    })

    it('passes along dev mode and safe mode', () => {
      const directory = entryNamed(treeView.roots[0], 'root-dir1')
      directory.expand()

      treeView.selectEntry(entryNamed(directory, 'tree-view.txt'))
      treeView.openSelectedEntryInNewWindow()

      expect(optionsPassedToOpen().devMode).toBe(atom.devMode)
      expect(optionsPassedToOpen().safeMode).toBe(atom.safeMode)
    })

    it('does nothing when no entry is selected', () => {
      treeView.deselect()
      treeView.openSelectedEntryInNewWindow()

      expect(atom.open).not.toHaveBeenCalled()
    })
  })
})
