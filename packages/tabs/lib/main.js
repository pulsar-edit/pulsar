const {CompositeDisposable, Disposable} = require('atom')
const getIconServices = require('./get-icon-services')
const layout = require('./layout')
const TabBarView = require('./tab-bar-view.js')
const MRUListView = require('./mru-list-view')
const _ = require('underscore-plus')

module.exports = {
  activate () {
    this.subscriptions = new CompositeDisposable()
    layout.activate()
    this.tabBarViews = []
    this.mruListViews = []

    const keyBindSource = 'tabs package'
    const enableMruConfigKey = 'tabs.enableMruTabSwitching'

    this.updateTraversalKeybinds = () => {
      // We don't modify keybindings based on our setting if the user has already tweaked them.
      let bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-tab'
      })

      if (bindings.length > 1 && bindings[0].source !== keyBindSource) {
        return
      }

      bindings = atom.keymaps.findKeyBindings({
        target: document.body,
        keystrokes: 'ctrl-shift-tab'
      })

      if (bindings.length > 1 && bindings[0].source !== keyBindSource) {
        return
      }

      if (atom.config.get(enableMruConfigKey)) {
        atom.keymaps.removeBindingsFromSource(keyBindSource)
      } else {
        const disabledBindings = {
          'body': {
            'ctrl-tab': 'pane:show-next-item',
            'ctrl-tab ^ctrl': 'unset!',
            'ctrl-shift-tab': 'pane:show-previous-item',
            'ctrl-shift-tab ^ctrl': 'unset!'
          }
        }
        atom.keymaps.add(keyBindSource, disabledBindings, 0)
      }
    }

    this.subscriptions.add(atom.config.observe(enableMruConfigKey, () => this.updateTraversalKeybinds()))
    this.subscriptions.add(atom.keymaps.onDidLoadUserKeymap(() => this.updateTraversalKeybinds()))

    // If the command bubbles up without being handled by a particular pane,
    // close all tabs in all panes
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'tabs:close-all-tabs': () => {
        // We loop backwards because the panes are
        // removed from the array as we go
        for (let i = this.tabBarViews.length - 1; i >= 0; i--) {
          this.tabBarViews[i].closeAllTabs()
        }
      }
    }))

    const paneContainers = {
      center: atom.workspace.getCenter(),
      left: atom.workspace.getLeftDock(),
      right: atom.workspace.getRightDock(),
      bottom: atom.workspace.getBottomDock()
    }

    Object.keys(paneContainers).forEach(location => {
      const container = paneContainers[location]
      if (!container) {
        return
      }

      this.subscriptions.add(container.observePanes(pane => {
        const tabBarView = new TabBarView(pane, location)
        const mruListView = new MRUListView()
        mruListView.initialize(pane)

        const paneElement = pane.getElement()
        paneElement.insertBefore(tabBarView.element, paneElement.firstChild)

        this.tabBarViews.push(tabBarView)
        pane.onDidDestroy(() => _.remove(this.tabBarViews, tabBarView))
        this.mruListViews.push(mruListView)
        pane.onDidDestroy(() => _.remove(this.mruListViews, mruListView))
      }))
    })
  },

  deactivate () {
    layout.deactivate()
    this.subscriptions.dispose()
    if (this.fileIconsDisposable != null) {
      this.fileIconsDisposable.dispose()
    }

    for (let tabBarView of this.tabBarViews) {
      tabBarView.destroy()
    }
    for (let mruListView of this.mruListViews) {
      mruListView.destroy()
    }
  },

  consumeElementIcons (service) {
    getIconServices().setElementIcons(service)
    this.updateFileIcons()
    return new Disposable(() => {
      getIconServices().resetElementIcons()
      this.updateFileIcons()
    })
  },

  consumeFileIcons (service) {
    getIconServices().setFileIcons(service)
    this.updateFileIcons()
    return new Disposable(() => {
      getIconServices().resetFileIcons()
      this.updateFileIcons()
    })
  },

  updateFileIcons () {
    for (let tabBarView of this.tabBarViews) {
      for (let tabView of tabBarView.getTabs()) {
        tabView.updateIcon()
      }
    }
  }
}
