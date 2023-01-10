const {it, fit, ffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

const fs = require('fs-plus')
const path = require('path')
const temp = require('temp').track()

describe('MRU List', () => {
  let workspaceElement = null
  const enableMruConfigKey = 'tabs.enableMruTabSwitching'
  const displayMruTabListConfigKey = 'tabs.displayMruTabList'

  beforeEach(async () => {
    workspaceElement = atom.workspace.getElement()

    await atom.workspace.open('sample.js')

    await atom.packages.activatePackage('tabs')
  })

  describe('.activate()', () => {
    const initialPaneCount = atom.workspace.getPanes().length

    it('has exactly one modal panel per pane', async () => {
      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher').length).toBe(initialPaneCount)

      let pane = atom.workspace.getActivePane()
      pane.splitRight()
      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher').length).toBe(initialPaneCount + 1)

      pane = atom.workspace.getActivePane()
      pane.splitDown()
      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher').length).toBe(initialPaneCount + 2)

      pane = atom.workspace.getActivePane()
      await Promise.resolve(pane.close())

      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher').length).toBe(initialPaneCount + 1)

      pane = atom.workspace.getActivePane()
      await Promise.resolve(pane.close())

      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher').length).toBe(initialPaneCount)
    })

    it("Doesn't build list until activated for the first time", () => {
      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher').length).toBe(initialPaneCount)
      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher li').length).toBe(0)
    })

    it("Doesn't activate when a single pane item is open", () => {
      const pane = atom.workspace.getActivePane()
      atom.commands.dispatch(pane, 'pane:show-next-recently-used-item')
      expect(workspaceElement.querySelectorAll('.tabs-mru-switcher li').length).toBe(0)
    })
  })

  describe('contents', () => {
    let pane = null
    const realSetTimeout = window.setTimeout

    beforeEach(async () => {
      // The MRU tab list is deliberately delayed before display.
      // Here we mock window.setTimeout rather than introducing a corresponding delay in tests
      // because faster tests are better.
      jasmine.getGlobal().setTimeout = (callback) => callback()
      await atom.workspace.open('sample.png')
      pane = atom.workspace.getActivePane()
    })

    afterEach(() => {
      jasmine.getGlobal().setTimeout = realSetTimeout
    })

    it('has one item per tab', () => {
      if (pane.onChooseNextMRUItem != null) {
        expect(pane.getItems().length).toBe(2)
        atom.commands.dispatch(workspaceElement, 'pane:show-next-recently-used-item')
        expect(workspaceElement.querySelectorAll('.tabs-mru-switcher li').length).toBe(2)
      }
    })

    it('switches between two items', () => {
      const firstActiveItem = pane.getActiveItem()
      atom.commands.dispatch(workspaceElement, 'pane:show-next-recently-used-item')
      const secondActiveItem = pane.getActiveItem()
      expect(secondActiveItem).toNotBe(firstActiveItem)
      atom.commands.dispatch(workspaceElement, 'pane:move-active-item-to-top-of-stack')
      const thirdActiveItem = pane.getActiveItem()
      expect(thirdActiveItem).toBe(secondActiveItem)
      atom.commands.dispatch(workspaceElement, 'pane:show-next-recently-used-item')
      atom.commands.dispatch(workspaceElement, 'pane:move-active-item-to-top-of-stack')
      const fourthActiveItem = pane.getActiveItem()
      expect(fourthActiveItem).toBe(firstActiveItem)
    })

    it('disables display when configured to', () => {
      atom.config.set(displayMruTabListConfigKey, false)
      expect(atom.config.get(displayMruTabListConfigKey)).toBe(false)
      if (pane.onChooseNextMRUItem != null) {
        expect(pane.getItems().length).toBe(2)
        atom.commands.dispatch(workspaceElement, 'pane:show-next-recently-used-item')
        expect(workspaceElement.querySelectorAll('.tabs-mru-switcher li').length).toBe(0)
      }
    })
  })

  describe('config', () => {
    let dotAtomPath = null

    beforeEach(() => {
      dotAtomPath = temp.path('tabs-spec-mru-config')
      atom.config.configDirPath = dotAtomPath
      atom.config.configFilePath = path.join(atom.config.configDirPath, 'atom.config.cson')
      atom.keymaps.configDirPath = dotAtomPath
    })

    afterEach(() => fs.removeSync(dotAtomPath))

    it('defaults on', () => {
      expect(atom.config.get(enableMruConfigKey)).toBe(true)
      expect(atom.config.get(displayMruTabListConfigKey)).toBe(true)

      let bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-tab'
      })
      expect(bindings.length).toBe(1)
      expect(bindings[0].command).toBe('pane:show-next-recently-used-item')

      bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-tab ^ctrl'
      })
      expect(bindings.length).toBe(1)
      expect(bindings[0].command).toBe('pane:move-active-item-to-top-of-stack')

      bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-shift-tab'
      })
      expect(bindings.length).toBe(1)
      expect(bindings[0].command).toBe('pane:show-previous-recently-used-item')

      bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-shift-tab ^ctrl'
      })
      expect(bindings.length).toBe(1)
      expect(bindings[0].command).toBe('pane:move-active-item-to-top-of-stack')
    })

    it('alters keybindings when disabled', () => {
      atom.config.set(enableMruConfigKey, false)
      let bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-tab'
      })
      expect(bindings.length).toBe(2)
      expect(bindings[0].command).toBe('pane:show-next-item')

      bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-tab ^ctrl'
      })
      expect(bindings.length).toBe(2)
      expect(bindings[0].command).toBe('unset!')

      bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-shift-tab'
      })
      expect(bindings.length).toBe(2)
      expect(bindings[0].command).toBe('pane:show-previous-item')

      bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-shift-tab ^ctrl'
      })
      expect(bindings.length).toBe(2)
      expect(bindings[0].command).toBe('unset!')
    })
  })
})
