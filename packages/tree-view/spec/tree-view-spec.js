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
})
