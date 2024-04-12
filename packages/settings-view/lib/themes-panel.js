/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import _ from 'underscore-plus'
import {CompositeDisposable, TextEditor} from 'atom'

import CollapsibleSectionPanel from './collapsible-section-panel'
import PackageCard from './package-card'
import ErrorView from './error-view'

import List from './list'
import ListView from './list-view'
import {ownerFromRepository, packageComparatorAscending} from './utils'

export default class ThemesPanel extends CollapsibleSectionPanel {
  static loadPackagesDelay () {
    return 300
  }

  constructor (settingsView, packageManager) {
    super()

    this.settingsView = settingsView
    this.packageManager = packageManager
    etch.initialize(this)
    this.items = {
      dev: new List('name'),
      core: new List('name'),
      user: new List('name'),
      git: new List('name')
    }
    this.itemViews = {
      dev: new ListView(this.items.dev, this.refs.devPackages, this.createPackageCard.bind(this)),
      core: new ListView(this.items.core, this.refs.corePackages, this.createPackageCard.bind(this)),
      user: new ListView(this.items.user, this.refs.communityPackages, this.createPackageCard.bind(this)),
      git: new ListView(this.items.git, this.refs.gitPackages, this.createPackageCard.bind(this))
    }

    this.disposables = new CompositeDisposable()
    this.disposables.add(
      this.packageManager.on('theme-install-failed theme-uninstall-failed', ({pack, error}) => {
        this.refs.themeErrors.appendChild(new ErrorView(this.packageManager, error).element)
      })
    )
    this.disposables.add(this.handleEvents())
    this.disposables.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))
    this.loadPackages()

    this.disposables.add(
      this.packageManager.on('theme-installed theme-uninstalled', () => {
        let loadPackagesTimeout
        clearTimeout(loadPackagesTimeout)
        loadPackagesTimeout = setTimeout(() => {
          this.populateThemeMenus()
          this.loadPackages()
        }, ThemesPanel.loadPackagesDelay())
      })
    )

    this.disposables.add(atom.themes.onDidChangeActiveThemes(() => this.updateActiveThemes()))
    this.disposables.add(atom.tooltips.add(this.refs.activeUiThemeSettings, {title: 'Settings'}))
    this.disposables.add(atom.tooltips.add(this.refs.activeSyntaxThemeSettings, {title: 'Settings'}))
    this.updateActiveThemes()

    this.disposables.add(this.refs.filterEditor.onDidStopChanging(() => { this.matchPackages() }))
  }

  update () {}

  focus () {
    this.refs.filterEditor.element.focus()
  }

  show () {
    this.element.style.display = ''
  }

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  render () {
    return (
      <div className='panels-item' tabIndex='-1'>
        <div className='section packages themes-panel'>
          <div className='section-container'>
            <div className='section-heading icon icon-paintcan'>Choose a Theme</div>

            <div className='text native-key-bindings' tabIndex='-1'>
              <span className='icon icon-question'>You can also style Pulsar by editing </span>
              <a className='link' onclick={this.didClickOpenUserStyleSheet}>your stylesheet</a>
            </div>

            <div className='themes-picker'>
              <div className='themes-picker-item control-group'>
                <div className='controls'>
                  <label className='control-label'>
                    <div className='setting-title themes-label text'>UI Theme</div>
                    <div className='setting-description text theme-description'>This styles the tabs, status bar, tree view, and dropdowns</div>
                  </label>
                  <div className='select-container'>
                    <select ref='uiMenu' className='form-control' onchange={this.didChangeUiMenu.bind(this)} />
                    <button
                      ref='activeUiThemeSettings'
                      className='btn icon icon-gear active-theme-settings'
                      onclick={this.didClickActiveUiThemeSettings.bind(this)} />
                  </div>
                </div>
              </div>

              <div className='themes-picker-item control-group'>
                <div className='controls'>
                  <label className='control-label'>
                    <div className='setting-title themes-label text'>Syntax Theme</div>
                    <div className='setting-description text theme-description'>This styles the text inside the editor</div>
                  </label>
                  <div className='select-container'>
                    <select ref='syntaxMenu' className='form-control' onchange={this.didChangeSyntaxMenu.bind(this)} />
                    <button
                      ref='activeSyntaxThemeSettings'
                      className='btn icon icon-gear active-syntax-settings'
                      onclick={this.didClickActiveSyntaxThemeSettings.bind(this)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className='section'>
          <div className='section-container'>
            <div className='section-heading icon icon-paintcan'>
              Installed Themes
              <span ref='totalPackages' className='section-heading-count badge badge-flexible'>…</span>
            </div>
            <div className='editor-container'>
              <TextEditor ref='filterEditor' mini placeholderText='Filter themes by name' />
            </div>

            <div ref='themeErrors' />

            <section className='sub-section installed-packages'>
              <h3 ref='communityThemesHeader' className='sub-section-heading icon icon-paintcan'>
                Community Themes
                <span ref='communityCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='communityPackages' className='container package-container'>
                <div ref='communityLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading themes…</div>
              </div>
            </section>

            <section className='sub-section core-packages'>
              <h3 ref='coreThemesHeader' className='sub-section-heading icon icon-paintcan'>
                Core Themes
                <span ref='coreCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='corePackages' className='container package-container'>
                <div ref='coreLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading themes…</div>
              </div>
            </section>

            <section className='sub-section dev-packages'>
              <h3 ref='developmentThemesHeader' className='sub-section-heading icon icon-paintcan'>
                Development Themes
                <span ref='devCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='devPackages' className='container package-container'>
                <div ref='devLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading themes…</div>
              </div>
            </section>

            <section className='sub-section git-packages'>
              <h3 ref='gitThemesHeader' className='sub-section-heading icon icon-paintcan'>
                Git Themes
                <span ref='gitCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='gitPackages' className='container package-container'>
                <div ref='gitLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading themes…</div>
              </div>
            </section>
          </div>
        </section>
      </div>
    )
  }

  filterThemes (packages) {
    packages.dev = packages.dev.filter(({theme}) => theme)
    packages.user = packages.user.filter(({theme}) => theme)
    packages.core = packages.core.filter(({theme}) => theme)
    packages.git = (packages.git || []).filter(({theme}) => theme)

    for (let packageType of ['dev', 'core', 'user', 'git']) {
      for (let pack of packages[packageType]) {
        pack.owner = ownerFromRepository(pack.repository)
      }
    }
    return packages
  }

  sortThemes (packages) {
    packages.dev.sort(packageComparatorAscending)
    packages.core.sort(packageComparatorAscending)
    packages.user.sort(packageComparatorAscending)
    packages.git.sort(packageComparatorAscending)
    return packages
  }

  loadPackages () {
    this.packageViews = []
    this.packageManager.getInstalled().then(packages => {
      this.packages = this.sortThemes(this.filterThemes(packages))

      this.refs.devLoadingArea.remove()
      this.items.dev.setItems(this.packages.dev)

      this.refs.coreLoadingArea.remove()
      this.items.core.setItems(this.packages.core)

      this.refs.communityLoadingArea.remove()
      this.items.user.setItems(this.packages.user)

      this.refs.gitLoadingArea.remove()
      this.items.git.setItems(this.packages.git)

      // TODO show empty mesage per section

      this.updateSectionCounts()
    }).catch((error) => {
      this.refs.themeErrors.appendChild(new ErrorView(this.packageManager, error).element)
    })
  }

  // Update the active UI and syntax themes and populate the menu
  updateActiveThemes () {
    this.activeUiTheme = this.getActiveUiTheme()
    this.activeSyntaxTheme = this.getActiveSyntaxTheme()
    this.populateThemeMenus()
    this.toggleActiveThemeButtons()
  }

  toggleActiveThemeButtons () {
    if (this.hasSettings(this.activeUiTheme)) {
      this.refs.activeUiThemeSettings.style.display = ''
    } else {
      this.refs.activeUiThemeSettings.style.display = 'none'
    }

    if (this.hasSettings(this.activeSyntaxTheme)) {
      this.refs.activeSyntaxThemeSettings.display = ''
    } else {
      this.refs.activeSyntaxThemeSettings.display = 'none'
    }
  }

  hasSettings (packageName) {
    return this.packageManager.packageHasSettings(packageName)
  }

  // Populate the theme menus from the theme manager's active themes
  populateThemeMenus () {
    this.refs.uiMenu.innerHTML = ''
    this.refs.syntaxMenu.innerHTML = ''
    const availableThemes = _.sortBy(atom.themes.getLoadedThemes(), 'name')
    for (let {name, metadata} of availableThemes) {
      switch (metadata.theme) {
        case 'ui': {
          const themeItem = this.createThemeMenuItem(name)
          if (name === this.activeUiTheme) {
            themeItem.selected = true
          }
          this.refs.uiMenu.appendChild(themeItem)
          break
        }
        case 'syntax': {
          const themeItem = this.createThemeMenuItem(name)
          if (name === this.activeSyntaxTheme) {
            themeItem.selected = true
          }
          this.refs.syntaxMenu.appendChild(themeItem)
          break
        }
      }
    }
  }

  // Get the name of the active ui theme.
  getActiveUiTheme () {
    for (let {name, metadata} of atom.themes.getActiveThemes()) {
      if (metadata.theme === 'ui') {
        return name
      }
    }
    return null
  }

  // Get the name of the active syntax theme.
  getActiveSyntaxTheme () {
    for (let {name, metadata} of atom.themes.getActiveThemes()) {
      if (metadata.theme === 'syntax') { return name }
    }
    return null
  }

  // Update the config with the selected themes
  updateThemeConfig () {
    const themes = []
    if (this.activeUiTheme) {
      themes.push(this.activeUiTheme)
    }
    if (this.activeSyntaxTheme) {
      themes.push(this.activeSyntaxTheme)
    }
    if (themes.length > 0) {
      atom.config.set('core.themes', themes)
    }
  }

  scheduleUpdateThemeConfig () {
    setTimeout(() => { this.updateThemeConfig() }, 100)
  }

  // Create a menu item for the given theme name.
  createThemeMenuItem (themeName) {
    const title = _.undasherize(_.uncamelcase(themeName.replace(/-(ui|syntax)/g, '').replace(/-theme$/g, '')))
    const option = document.createElement('option')
    option.value = themeName
    option.textContent = title
    return option
  }

  createPackageCard (pack) {
    return new PackageCard(pack, this.settingsView, this.packageManager, {back: 'Themes'})
  }

  filterPackageListByText (text) {
    if (!this.packages) {
      return
    }

    for (let packageType of ['dev', 'core', 'user', 'git']) {
      const allViews = this.itemViews[packageType].getViews()
      const activeViews = this.itemViews[packageType].filterViews((pack) => {
        if (text === '') {
          return true
        } else {
          const owner = pack.owner != null ? pack.owner : ownerFromRepository(pack.repository)
          const filterText = `${pack.name} ${owner}`
          return atom.ui.fuzzyMatcher.score(filterText, text) > 0
        }
      })

      for (const view of allViews) {
        if (view) {
          view.element.style.display = 'none'
          view.element.classList.add('hidden')
        }
      }

      for (const view of activeViews) {
        if (view) {
          view.element.style.display = ''
          view.element.classList.remove('hidden')
        }
      }
    }

    this.updateSectionCounts()
  }

  updateUnfilteredSectionCounts () {
    this.updateSectionCount(this.refs.communityThemesHeader, this.refs.communityCount, this.packages.user.length)
    this.updateSectionCount(this.refs.coreThemesHeader, this.refs.coreCount, this.packages.core.length)
    this.updateSectionCount(this.refs.developmentThemesHeader, this.refs.devCount, this.packages.dev.length)
    this.updateSectionCount(this.refs.gitThemesHeader, this.refs.gitCount, this.packages.git.length)

    this.refs.totalPackages.textContent = `${this.packages.user.length + this.packages.core.length + this.packages.dev.length + this.packages.git.length}`
  }

  updateFilteredSectionCounts () {
    const community = this.notHiddenCardsLength(this.refs.communityPackages)
    this.updateSectionCount(this.refs.communityThemesHeader, this.refs.communityCount, community, this.packages.user.length)

    const dev = this.notHiddenCardsLength(this.refs.devPackages)
    this.updateSectionCount(this.refs.developmentThemesHeader, this.refs.devCount, dev, this.packages.dev.length)

    const core = this.notHiddenCardsLength(this.refs.corePackages)
    this.updateSectionCount(this.refs.coreThemesHeader, this.refs.coreCount, core, this.packages.core.length)

    const git = this.notHiddenCardsLength(this.refs.gitPackages)
    this.updateSectionCount(this.refs.gitThemesHeader, this.refs.gitCount, git, this.packages.git.length)

    const shownThemes = dev + core + community + git
    const totalThemes = this.packages.user.length + this.packages.core.length + this.packages.dev.length + this.packages.git.length
    this.refs.totalPackages.textContent = `${shownThemes}/${totalThemes}`
  }

  resetSectionHasItems () {
    this.resetCollapsibleSections([this.refs.communityThemesHeader, this.refs.coreThemesHeader, this.refs.developmentThemesHeader, this.refs.gitThemesHeader])
  }

  matchPackages () {
    this.filterPackageListByText(this.refs.filterEditor.getText())
  }

  didClickOpenUserStyleSheet (e) {
    e.preventDefault()
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'application:open-your-stylesheet')
  }

  didChangeUiMenu () {
    this.activeUiTheme = this.refs.uiMenu.value
    this.scheduleUpdateThemeConfig()
  }

  didChangeSyntaxMenu () {
    this.activeSyntaxTheme = this.refs.syntaxMenu.value
    this.scheduleUpdateThemeConfig()
  }

  didClickActiveUiThemeSettings (event) {
    event.stopPropagation()
    const theme = atom.themes.getActiveThemes().find((theme) => theme.metadata.theme === 'ui')
    const activeUiTheme = theme != null ? theme.metadata : null
    if (activeUiTheme != null) {
      this.settingsView.showPanel(this.activeUiTheme, {
        back: 'Themes',
        pack: activeUiTheme
      })
    }
  }

  didClickActiveSyntaxThemeSettings (event) {
    event.stopPropagation()
    const theme = atom.themes.getActiveThemes().find((theme) => theme.metadata.theme === 'syntax')
    const activeSyntaxTheme = theme != null ? theme.metadata : null
    if (activeSyntaxTheme != null) {
      this.settingsView.showPanel(this.activeSyntaxTheme, {
        back: 'Themes',
        pack: activeSyntaxTheme
      })
    }
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
