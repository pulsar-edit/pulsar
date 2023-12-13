/** @babel */
/** @jsx etch.dom */

import {CompositeDisposable, TextEditor} from 'atom'
import etch from 'etch'

import CollapsibleSectionPanel from './collapsible-section-panel'
import PackageCard from './package-card'
import ErrorView from './error-view'

import List from './list'
import ListView from './list-view'
import {ownerFromRepository, packageComparatorAscending} from './utils'

export default class InstalledPackagesPanel extends CollapsibleSectionPanel {
  static loadPackagesDelay () {
    return 300
  }

  constructor (settingsView, packageManager) {
    super()
    etch.initialize(this)
    this.settingsView = settingsView
    this.packageManager = packageManager
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

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(
      this.refs.filterEditor.onDidStopChanging(() => { this.matchPackages() })
    )
    this.subscriptions.add(
      this.packageManager.on('package-install-failed theme-install-failed package-uninstall-failed theme-uninstall-failed package-update-failed theme-update-failed', ({pack, error}) => {
        this.refs.updateErrors.appendChild(new ErrorView(this.packageManager, error).element)
      })
    )

    let loadPackagesTimeout
    this.subscriptions.add(
      this.packageManager.on('package-updated package-installed package-uninstalled', () => {
        clearTimeout(loadPackagesTimeout)
        loadPackagesTimeout = setTimeout(this.loadPackages.bind(this), InstalledPackagesPanel.loadPackagesDelay())
      })
    )

    this.subscriptions.add(this.handleEvents())
    this.subscriptions.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))

    this.loadPackages()
  }

  focus () {
    this.refs.filterEditor.element.focus()
  }

  show () {
    this.element.style.display = ''
  }

  destroy () {
    this.subscriptions.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <div className='panels-item' tabIndex='-1'>
        <section className='section'>
          <div className='section-container'>
            <div className='section-heading icon icon-package'>
              Installed Packages
              <span ref='totalPackages' className='section-heading-count badge badge-flexible'>…</span>
            </div>
            <div className='editor-container'>
              <TextEditor ref='filterEditor' mini placeholderText='Filter packages by name' />
            </div>

            <div ref='updateErrors' />

            <section className='sub-section installed-packages'>
              <h3 ref='communityPackagesHeader' className='sub-section-heading icon icon-package'>
                Community Packages
                <span ref='communityCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='communityPackages' className='container package-container'>
                <div ref='communityLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading packages…</div>
              </div>
            </section>

            <section className='sub-section core-packages'>
              <h3 ref='corePackagesHeader' className='sub-section-heading icon icon-package'>
                Core Packages
                <span ref='coreCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='corePackages' className='container package-container'>
                <div ref='coreLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading packages…</div>
              </div>
            </section>

            <section className='sub-section dev-packages'>
              <h3 ref='devPackagesHeader' className='sub-section-heading icon icon-package'>
                Development Packages
                <span ref='devCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='devPackages' className='container package-container'>
                <div ref='devLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading packages…</div>
              </div>
            </section>

            <section className='sub-section git-packages'>
              <h3 ref='gitPackagesHeader' className='sub-section-heading icon icon-package'>
                Git Packages
                <span ref='gitCount' className='section-heading-count badge badge-flexible'>…</span>
              </h3>
              <div ref='gitPackages' className='container package-container'>
                <div ref='gitLoadingArea' className='alert alert-info loading-area icon icon-hourglass'>Loading packages…</div>
              </div>
            </section>
          </div>
        </section>
      </div>
    )
  }

  filterPackages (packages) {
    packages.dev = packages.dev.filter(({theme}) => !theme)
    packages.user = packages.user.filter(({theme}) => !theme)
    packages.core = packages.core.filter(({theme}) => !theme)
    packages.git = (packages.git || []).filter(({theme}) => !theme)

    for (let packageType of ['dev', 'core', 'user', 'git']) {
      for (let pack of packages[packageType]) {
        pack.owner = ownerFromRepository(pack.repository)
      }
    }

    return packages
  }

  sortPackages (packages) {
    packages.dev.sort(packageComparatorAscending)
    packages.core.sort(packageComparatorAscending)
    packages.user.sort(packageComparatorAscending)
    packages.git.sort(packageComparatorAscending)
    return packages
  }

  loadPackages () {
    const packagesWithUpdates = {}
    this.packageManager.getOutdated().then((packages) => {
      for (let {name, latestVersion} of packages) {
        packagesWithUpdates[name] = latestVersion
      }
      this.displayPackageUpdates(packagesWithUpdates)
    })

    this.packageManager.getInstalled().then((packages) => {
      this.packages = this.sortPackages(this.filterPackages(packages))
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
      this.displayPackageUpdates(packagesWithUpdates)

      this.matchPackages()
    }).catch((error) => {
      console.error(error.message, error.stack)
    })
  }

  displayPackageUpdates (packagesWithUpdates) {
    for (const packageType of ['dev', 'core', 'user', 'git']) {
      for (const packageCard of this.itemViews[packageType].getViews()) {
        const newVersion = packagesWithUpdates[packageCard.pack.name]
        if (newVersion) {
          packageCard.displayAvailableUpdate(newVersion)
        }
      }
    }
  }

  createPackageCard (pack) {
    return new PackageCard(pack, this.settingsView, this.packageManager, {back: 'Packages'})
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
    this.updateSectionCount(this.refs.communityPackagesHeader, this.refs.communityCount, this.packages.user.length)
    this.updateSectionCount(this.refs.corePackagesHeader, this.refs.coreCount, this.packages.core.length)
    this.updateSectionCount(this.refs.devPackagesHeader, this.refs.devCount, this.packages.dev.length)
    this.updateSectionCount(this.refs.gitPackagesHeader, this.refs.gitCount, this.packages.git.length)

    const totalPackages =
      this.packages.user.length +
      this.packages.core.length +
      this.packages.dev.length +
      this.packages.git.length
    this.refs.totalPackages.textContent = totalPackages.toString()
  }

  updateFilteredSectionCounts () {
    const community = this.notHiddenCardsLength(this.refs.communityPackages)
    this.updateSectionCount(this.refs.communityPackagesHeader, this.refs.communityCount, community, this.packages.user.length)

    const core = this.notHiddenCardsLength(this.refs.corePackages)
    this.updateSectionCount(this.refs.corePackagesHeader, this.refs.coreCount, core, this.packages.core.length)

    const dev = this.notHiddenCardsLength(this.refs.devPackages)
    this.updateSectionCount(this.refs.devPackagesHeader, this.refs.devCount, dev, this.packages.dev.length)

    const git = this.notHiddenCardsLength(this.refs.gitPackages)
    this.updateSectionCount(this.refs.gitPackagesHeader, this.refs.gitCount, git, this.packages.git.length)

    const shownPackages = dev + core + community + git
    const totalPackages = this.packages.user.length + this.packages.core.length + this.packages.dev.length + this.packages.git.length
    this.refs.totalPackages.textContent = `${shownPackages}/${totalPackages}`
  }

  resetSectionHasItems () {
    this.resetCollapsibleSections([this.refs.communityPackagesHeader, this.refs.corePackagesHeader, this.refs.devPackagesHeader, this.refs.gitPackagesHeader])
  }

  matchPackages () {
    this.filterPackageListByText(this.refs.filterEditor.getText())
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
