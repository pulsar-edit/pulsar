/** @babel */
/** @jsx etch.dom */

import path from 'path'
import etch from 'etch'
import _ from 'underscore-plus'
import {CompositeDisposable, Disposable} from 'atom'

import GeneralPanel from './general-panel'
import EditorPanel from './editor-panel'
import PackageDetailView from './package-detail-view'
import KeybindingsPanel from './keybindings-panel'
import InstallPanel from './install-panel'
import ThemesPanel from './themes-panel'
import InstalledPackagesPanel from './installed-packages-panel'
import UpdatesPanel from './updates-panel'
import UriHandlerPanel from './uri-handler-panel'
import SearchSettingsPanel from './search-settings-panel'

export default class SettingsView {
  constructor ({uri, packageManager, snippetsProvider, activePanel} = {}) {
    this.uri = uri
    this.packageManager = packageManager
    this.snippetsProvider = snippetsProvider
    this.deferredPanel = activePanel
    this.destroyed = false
    this.panelsByName = {}
    this.panelCreateCallbacks = {}

    etch.initialize(this)
    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))

    this.disposables.add(atom.packages.onDidActivateInitialPackages(() => {
      this.disposables.add(
        atom.packages.onDidActivatePackage(pack => this.removePanelCache(pack.name)),
        atom.packages.onDidDeactivatePackage(pack => this.removePanelCache(pack.name))
      )
    }))

    process.nextTick(() => this.initializePanels())
  }

  removePanelCache (name) {
    delete this.panelsByName[name]
  }

  update () {}

  destroy () {
    this.destroyed = true
    this.disposables.dispose()
    for (let name in this.panelsByName) {
      const panel = this.panelsByName[name]
      panel.destroy()
    }

    return etch.destroy(this)
  }

  render () {
    return (
      <div className='settings-view pane-item' tabIndex='-1'>
        <div className='config-menu' ref='sidebar'>
          <ul className='panels-menu nav nav-pills nav-stacked' ref='panelMenu'>
            <div className='panel-menu-separator' ref='menuSeparator' />
          </ul>
          <div className='button-area'>
            <button className='btn btn-default icon icon-link-external' ref='openDotAtom'>Open Config Folder</button>
          </div>
        </div>
        {/* The tabindex attr below ensures that clicks in a panel item won't
        cause this view to gain focus. This is important because when this view
        gains focus (e.g. immediately after atom displays it), it focuses the
        currently active panel item. If that focusing causes the active panel to
        scroll (e.g. because the active panel itself passes focus on to a search
        box at the top of a scrolled panel), then the browser will not fire the
        click event on the element within the panel on which the user originally
        clicked (e.g. a package card). This would prevent us from showing a
        package detail view when clicking on a package card. Phew! */}
        <div className='panels' tabIndex='-1' ref='panels' />
      </div>
    )
  }

  // This prevents the view being actually disposed when closed
  // If you remove it you will need to ensure the cached settingsView
  // in main.coffee is correctly released on close as well...
  onDidChangeTitle () { return new Disposable() }

  initializePanels () {
    if (this.refs.panels.children.length > 1) {
      return
    }

    const clickHandler = (event) => {
      const target = event.target.closest('.panels-menu li a, .panels-packages li a')
      if (target) {
        this.showPanel(target.closest('li').name)
      }
    }
    this.element.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => this.element.removeEventListener('click', clickHandler)))

    const focusHandler = () => {
      this.focusActivePanel()
    }
    this.element.addEventListener('focus', focusHandler)
    this.disposables.add(new Disposable(() => this.element.removeEventListener('focus', focusHandler)))

    const openDotAtomClickHandler = () => {
      atom.open({pathsToOpen: [atom.getConfigDirPath()]})
    }
    this.refs.openDotAtom.addEventListener('click', openDotAtomClickHandler)
    this.disposables.add(new Disposable(() => this.refs.openDotAtom.removeEventListener('click', openDotAtomClickHandler)))

    if (atom.config.get("settings-view.enableSettingsSearch")) {
      this.addCorePanel('Search', 'search', () => new SearchSettingsPanel(this))
    }
    
    this.addCorePanel('Core', 'settings', () => new GeneralPanel())
    this.addCorePanel('Editor', 'code', () => new EditorPanel())
    if (atom.config.getSchema('core.uriHandlerRegistration').type !== 'any') {
      // "feature flag" based on core support for URI handling
      this.addCorePanel('URI Handling', 'link', () => new UriHandlerPanel())
    }
    if ((process.platform === 'win32') && (require('atom').WinShell != null)) {
      const SystemPanel = require('./system-windows-panel')
      this.addCorePanel('System', 'device-desktop', () => new SystemPanel())
    }
    this.addCorePanel('Keybindings', 'keyboard', () => new KeybindingsPanel())
    this.addCorePanel('Packages', 'package', () => new InstalledPackagesPanel(this, this.packageManager))
    this.addCorePanel('Themes', 'paintcan', () => new ThemesPanel(this, this.packageManager))
    this.addCorePanel('Updates', 'cloud-download', () => new UpdatesPanel(this, this.packageManager))
    this.addCorePanel('Install', 'plus', () => new InstallPanel(this, this.packageManager))

    this.showDeferredPanel()

    if (!this.activePanel) {
      this.showPanel('Core')
    }

    if (document.body.contains(this.element)) {
      this.refs.sidebar.style.width = this.refs.sidebar.offsetWidth
    }
  }

  serialize () {
    return {
      deserializer: 'SettingsView',
      version: 2,
      activePanel: this.activePanel != null ? this.activePanel : this.deferredPanel,
      uri: this.uri
    }
  }

  getPackages () {
    let bundledPackageMetadataCache
    if (this.packages != null) { return this.packages }

    this.packages = atom.packages.getLoadedPackages()

    try {
      const packageMetadata = require(path.join(atom.getLoadSettings().resourcePath, 'package.json'))
      bundledPackageMetadataCache = packageMetadata ? packageMetadata._atomPackages : null
    } catch (error) {}

    // Include disabled packages so they can be re-enabled from the UI
    const disabledPackages = atom.config.get('core.disabledPackages') || []
    for (const packageName of disabledPackages) {
      var metadata
      const packagePath = atom.packages.resolvePackagePath(packageName)
      if (!packagePath) {
        continue
      }

      try {
        metadata = require(path.join(packagePath, 'package.json'))
      } catch (error) {
        if (bundledPackageMetadataCache && bundledPackageMetadataCache[packageName]) {
          metadata = bundledPackageMetadataCache[packageName].metadata
        }
      }
      if (metadata == null) {
        continue
      }

      const name = metadata.name != null ? metadata.name : packageName
      if (!_.findWhere(this.packages, {name})) {
        this.packages.push({name, metadata, path: packagePath})
      }
    }

    this.packages.sort((pack1, pack2) => {
      const title1 = this.packageManager.getPackageTitle(pack1)
      const title2 = this.packageManager.getPackageTitle(pack2)
      return title1.localeCompare(title2)
    })

    return this.packages
  }

  addCorePanel (name, iconName, panelCreateCallback) {
    const panelMenuItem = document.createElement('li')
    panelMenuItem.name = name
    panelMenuItem.setAttribute('name', name)

    const a = document.createElement('a')
    a.classList.add('icon', `icon-${iconName}`)
    a.textContent = name
    panelMenuItem.appendChild(a)

    this.refs.menuSeparator.parentElement.insertBefore(panelMenuItem, this.refs.menuSeparator)
    this.addPanel(name, panelCreateCallback)
  }

  addPanel (name, panelCreateCallback) {
    this.panelCreateCallbacks[name] = panelCreateCallback
    if (this.deferredPanel && this.deferredPanel.name === name) {
      this.showDeferredPanel()
    }
  }

  getOrCreatePanel (name, options) {
    let panel = this.panelsByName[name]
    if (panel) return panel

    if (name in this.panelCreateCallbacks) {
      panel = this.panelCreateCallbacks[name]()
      delete this.panelCreateCallbacks[name]
    } else if (options && options.pack) {
      if (!options.pack.metadata) {
        options.pack.metadata = _.clone(options.pack)
      }
      panel = new PackageDetailView(options.pack, this, this.packageManager, this.snippetsProvider)
    }
    if (panel) {
      this.panelsByName[name] = panel
    }

    return panel
  }

  makePanelMenuActive (name) {
    const previouslyActivePanel = this.refs.sidebar.querySelector('.active')
    if (previouslyActivePanel) {
      previouslyActivePanel.classList.remove('active')
    }

    const newActivePanel = this.refs.sidebar.querySelector(`[name='${name}']`)
    if (newActivePanel) {
      newActivePanel.classList.add('active')
    }
  }

  focusActivePanel () {
    // Pass focus to panel that is currently visible
    for (let i = 0; i < this.refs.panels.children.length; i++) {
      const child = this.refs.panels.children[i]
      if (child.offsetWidth > 0) {
        child.focus()
      }
    }
  }

  showDeferredPanel () {
    if (this.deferredPanel) {
      const {name, options} = this.deferredPanel
      this.showPanel(name, options)
    }
  }

  // Public: show a panel.
  //
  // * `name` {String} the name of the panel to show
  // * `options` {Object} an options hash. Will be passed to `beforeShow()` on
  //   the panel. Options may include (but are not limited to):
  //   * `uri` the URI the panel was launched from
  showPanel (name, options) {
    if (this.activePanel) {
      const prev = this.panelsByName[this.activePanel.name]
      if (prev) {
        prev.scrollPosition = prev.element.scrollTop
      }
    }

    const panel = this.getOrCreatePanel(name, options)
    if (panel) {
      this.appendPanel(panel, options)
      this.makePanelMenuActive(name)
      this.setActivePanel(name, options)
      this.deferredPanel = null
    } else {
      this.deferredPanel = {name, options}
    }
  }

  showPanelForURI (uri) {
    const regex = /config\/([a-z]+)\/?([a-zA-Z0-9_-]+)?/i
    const match = regex.exec(uri)

    if (match) {
      const path1 = match[1]
      const path2 = match[2]

      if (path1 === 'packages' && path2 != null) {
        this.showPanel(path2, {
          uri: uri,
          pack: {name: path2},
          back: atom.packages.getLoadedPackage(path2) ? 'Packages' : null
        })
      } else {
        const panelName = path1[0].toUpperCase() + path1.slice(1)
        this.showPanel(panelName, {uri})
      }
    }
  }

  appendPanel (panel, options) {
    for (let i = 0; i < this.refs.panels.children.length; i++) {
      this.refs.panels.children[i].style.display = 'none'
    }

    if (!this.refs.panels.contains(panel.element)) {
      this.refs.panels.appendChild(panel.element)
    }

    if (panel.beforeShow) {
      panel.beforeShow(options)
    }
    panel.show()
    panel.focus()
  }

  setActivePanel (name, options = {}) {
    this.activePanel = {name, options}

    const panel = this.panelsByName[name]
    if (panel && panel.scrollPosition) {
      panel.element.scrollTop = panel.scrollPosition
      delete panel.scrollPosition
    }
  }

  removePanel (name) {
    const panel = this.panelsByName[name]
    if (panel) {
      panel.destroy()
      delete this.panelsByName[name]
    }
  }

  getTitle () {
    return 'Settings'
  }

  getIconName () {
    return 'tools'
  }

  getURI () {
    return this.uri
  }

  isEqual (other) {
    return other instanceof SettingsView
  }

  scrollUp () {
    this.element.scrollTop -= document.body.offsetHeight / 20
  }

  scrollDown () {
    this.element.scrollTop += document.body.offsetHeight / 20
  }

  pageUp () {
    this.element.scrollTop -= this.element.offsetHeight
  }

  pageDown () {
    this.element.scrollTop += this.element.offsetHeight
  }

  scrollToTop () {
    this.element.scrollTop = 0
  }

  scrollToBottom () {
    this.element.scrollTop = this.element.scrollHeight
  }
}
