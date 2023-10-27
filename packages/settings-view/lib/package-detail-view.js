/** @babel */
/** @jsx etch.dom */

import path from 'path'
import url from 'url'

import _ from 'underscore-plus'
import fs from 'fs-plus'
import {shell} from 'electron'
import {CompositeDisposable, Disposable} from 'atom'
import etch from 'etch'

import PackageCard from './package-card'
import PackageGrammarsView from './package-grammars-view'
import PackageKeymapView from './package-keymap-view'
import PackageReadmeView from './package-readme-view'
import PackageSnippetsView from './package-snippets-view'
import SettingsPanel from './settings-panel'

const NORMALIZE_PACKAGE_DATA_README_ERROR = 'ERROR: No README data found!'

export default class PackageDetailView {
  constructor (pack, settingsView, packageManager, snippetsProvider) {
    this.pack = pack
    if (Array.isArray(pack.badges)) {
      // Badges are only available on the object when loading their data from the
      // API server. Once local the badge data is lost.
      // Plus we want to modify the original item to ensure further changes can take effect properly
      pack.metadata.badges = pack.badges;
    }
    this.settingsView = settingsView
    this.packageManager = packageManager
    this.snippetsProvider = snippetsProvider
    this.disposables = new CompositeDisposable()
    etch.initialize(this)
    this.loadPackage()

    this.disposables.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))

    const packageRepoClickHandler = (event) => {
      event.preventDefault()
      const repoUrl = this.packageManager.getRepositoryUrl(this.pack)
      if (typeof repoUrl === 'string') {
        if (url.parse(repoUrl).pathname === '/pulsar-edit/pulsar') {
          shell.openExternal(`${repoUrl}/tree/master/packages/${this.pack.name}`)
        } else {
          shell.openExternal(repoUrl)
        }
      }
    }
    this.refs.packageRepo.addEventListener('click', packageRepoClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.packageRepo.removeEventListener('click', packageRepoClickHandler) }))

    const issueButtonClickHandler = (event) => {
      event.preventDefault()
      let bugUri = this.packageManager.getRepositoryBugUri(this.pack)
      if (bugUri) {
        shell.openExternal(bugUri)
      }
    }
    this.refs.issueButton.addEventListener('click', issueButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.issueButton.removeEventListener('click', issueButtonClickHandler) }))

    const changelogButtonClickHandler = (event) => {
      event.preventDefault()
      if (this.changelogPath) {
        this.openMarkdownFile(this.changelogPath)
      }
    }
    this.refs.changelogButton.addEventListener('click', changelogButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.changelogButton.removeEventListener('click', changelogButtonClickHandler) }))

    const licenseButtonClickHandler = (event) => {
      event.preventDefault()
      if (this.licensePath) {
        this.openMarkdownFile(this.licensePath)
      }
    }
    this.refs.licenseButton.addEventListener('click', licenseButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.licenseButton.removeEventListener('click', licenseButtonClickHandler) }))

    const openButtonClickHandler = (event) => {
      event.preventDefault()
      if (fs.existsSync(this.pack.path)) {
        atom.open({pathsToOpen: [this.pack.path]})
      }
    }
    this.refs.openButton.addEventListener('click', openButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.openButton.removeEventListener('click', openButtonClickHandler) }))

    const learnMoreButtonClickHandler = (event) => {
      event.preventDefault()
      shell.openExternal(`https://web.pulsar-edit.dev/packages/${this.pack.name}`)
    }
    this.refs.learnMoreButton.addEventListener('click', learnMoreButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.learnMoreButton.removeEventListener('click', learnMoreButtonClickHandler) }))

    const breadcrumbClickHandler = (event) => {
      event.preventDefault()
      this.settingsView.showPanel(this.breadcrumbBackPanel)
    }
    this.refs.breadcrumb.addEventListener('click', breadcrumbClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.breadcrumb.removeEventListener('click', breadcrumbClickHandler) }))
  }

  completeInitialization () {
    if (this.refs.packageCard) {
      this.packageCard = this.refs.packageCard.packageCard
    } else if (!this.packageCard) { // Had to load this from the network
      this.packageCard = new PackageCard(this.pack.metadata, this.settingsView, this.packageManager, {onSettingsView: true})
      this.refs.packageCardParent.replaceChild(this.packageCard.element, this.refs.loadingMessage)
    }

    this.refs.packageRepo.classList.remove('hidden')
    this.refs.startupTime.classList.remove('hidden')
    this.refs.buttons.classList.remove('hidden')
    this.activateConfig()
    this.populate()
    this.updateFileButtons()
    this.subscribeToPackageManager()
    this.renderReadme()
  }

  loadPackage () {
    const loadedPackage = atom.packages.getLoadedPackage(this.pack.name)
    if (loadedPackage) {
      this.pack = loadedPackage
      this.completeInitialization()
    } else {
      // If the package metadata in `@pack` isn't complete, hit the network.
      if (!this.pack.metadata || !this.pack.metadata.owner) {
        this.fetchPackage()
      } else {
        this.completeInitialization()
      }
    }
  }

  fetchPackage () {
    this.showLoadingMessage()
    this.packageManager.getClient().package(this.pack.name, (err, packageData) => {
      if (err || !packageData || !packageData.name) {
        this.hideLoadingMessage()
        this.showErrorMessage()
      } else {
        this.pack = packageData
        // TODO: this should match Package.loadMetadata from core, but this is
        // an acceptable hacky workaround
        this.pack.metadata = _.extend(this.pack.metadata != null ? this.pack.metadata : {}, this.pack)
        this.completeInitialization()
      }
    })
  }

  showLoadingMessage () {
    this.refs.loadingMessage.classList.remove('hidden')
  }

  hideLoadingMessage () {
    this.refs.loadingMessage.classList.add('hidden')
  }

  showErrorMessage () {
    this.refs.errorMessage.classList.remove('hidden')
  }

  hideErrorMessage () {
    this.refs.errorMessage.classList.add('hidden')
  }

  activateConfig () {
    // Package.activateConfig() is part of the Private package API and should not be used outside of core.
    if (atom.packages.isPackageLoaded(this.pack.name) && !atom.packages.isPackageActive(this.pack.name)) {
      this.pack.activateConfig()
    }
  }

  destroy () {
    if (this.settingsPanel) {
      this.settingsPanel.destroy()
      this.settingsPanel = null
    }

    if (this.keymapView) {
      this.keymapView.destroy()
      this.keymapView = null
    }

    if (this.grammarsView) {
      this.grammarsView.destroy()
      this.grammarsView = null
    }

    if (this.snippetsView) {
      this.snippetsView.destroy()
      this.snippetsView = null
    }

    if (this.readmeView) {
      this.readmeView.destroy()
      this.readmeView = null
    }

    if (this.packageCard) {
      this.packageCard.destroy()
      this.packageCard = null
    }

    this.disposables.dispose()
    return etch.destroy(this)
  }

  update () {}

  beforeShow (opts) {
    if (opts.back == null) {
      opts.back = 'Install'
    }

    this.breadcrumbBackPanel = opts.back
    this.refs.breadcrumb.textContent = this.breadcrumbBackPanel
  }

  show () {
    this.element.style.display = ''
  }

  focus () {
    this.element.focus()
  }

  render () {
    let packageCardView
    if (this.pack && this.pack.metadata && this.pack.metadata.owner) {
      packageCardView = (
        <div ref='packageCardParent' className='row'>
          <PackageCardComponent
            ref='packageCard'
            settingsView={this.settingsView}
            packageManager={this.packageManager}
            metadata={this.pack.metadata}
            options={{onSettingsView: true}} />
        </div>
      )
    } else {
      packageCardView = (
        <div ref='packageCardParent' className='row'>
          <div ref='loadingMessage' className='alert alert-info icon icon-hourglass'>{`Loading ${this.pack.name}\u2026`}</div>
          <div ref='errorMessage' className='alert alert-danger icon icon-hourglass hidden'>Failed to load {this.pack.name} - try again later.</div>
        </div>
      )
    }
    return (
      <div tabIndex='0' className='package-detail'>
        <ol ref='breadcrumbContainer' className='native-key-bindings breadcrumb' tabIndex='-1'>
          <li>
            <a ref='breadcrumb' />
          </li>
          <li className='active'>
            <a ref='title' />
          </li>
        </ol>

        <div className='panels-item'>
          <section className='section'>
            <form className='section-container package-detail-view'>
              <div className='container package-container'>
                {packageCardView}
              </div>

              <p ref='packageRepo' className='link icon icon-repo repo-link hidden' />
              <p ref='startupTime' className='text icon icon-dashboard hidden' tabIndex='-1' />

              <div ref='buttons' className='btn-wrap-group hidden'>
                <button ref='learnMoreButton' className='btn btn-default icon icon-link'>View on pulsar-edit.dev</button>
                <button ref='issueButton' className='btn btn-default icon icon-bug'>Report Issue</button>
                <button ref='changelogButton' className='btn btn-default icon icon-squirrel'>CHANGELOG</button>
                <button ref='licenseButton' className='btn btn-default icon icon-law'>LICENSE</button>
                <button ref='openButton' className='btn btn-default icon icon-link-external'>View Code</button>
              </div>

              <div ref='errors' />
            </form>
          </section>

          <div ref='sections' />

        </div>
      </div>
    )
  }

  populate () {
    this.refs.title.textContent = `${_.undasherize(_.uncamelcase(this.pack.name))}`
    this.type = this.pack.metadata.theme ? 'theme' : 'package'

    const repoUrl = this.packageManager.getRepositoryUrl(this.pack)
    if (repoUrl) {
      const repoName = url.parse(repoUrl).pathname
      this.refs.packageRepo.textContent = repoName.substring(1)
      this.refs.packageRepo.style.display = ''
    } else {
      this.refs.packageRepo.style.display = 'none'
    }

    this.updateInstalledState()
  }

  updateInstalledState () {
    if (this.settingsPanel) {
      this.settingsPanel.destroy()
      this.settingsPanel = null
    }

    if (this.keymapView) {
      this.keymapView.destroy()
      this.keymapView = null
    }

    if (this.grammarsView) {
      this.grammarsView.destroy()
      this.grammarsView = null
    }

    if (this.snippetsView) {
      this.snippetsView.destroy()
      this.snippetsView = null
    }

    if (this.readmeView) {
      this.readmeView.destroy()
      this.readmeView = null
    }

    this.updateFileButtons()
    this.activateConfig()
    this.refs.startupTime.style.display = 'none'

    if (atom.packages.isPackageLoaded(this.pack.name)) {
      if (!atom.packages.isPackageDisabled(this.pack.name)) {
        this.settingsPanel = new SettingsPanel({namespace: this.pack.name, includeTitle: false})
        this.keymapView = new PackageKeymapView(this.pack)
        this.refs.sections.appendChild(this.settingsPanel.element)
        this.refs.sections.appendChild(this.keymapView.element)

        if (this.pack.path) {
          this.grammarsView = new PackageGrammarsView(this.pack.path)
          this.snippetsView = new PackageSnippetsView(this.pack, this.snippetsProvider)
          this.refs.sections.appendChild(this.grammarsView.element)
          this.refs.sections.appendChild(this.snippetsView.element)
        }

        this.refs.startupTime.innerHTML =
          `This ${this.type} added <span class='highlight'>${this.getStartupTime()}ms</span> to startup time.`
        this.refs.startupTime.style.display = ''
      }
    }

    const sourceIsAvailable = this.packageManager.isPackageInstalled(this.pack.name) && !atom.packages.isBundledPackage(this.pack.name)
    if (sourceIsAvailable) {
      this.refs.openButton.style.display = ''
    } else {
      this.refs.openButton.style.display = 'none'
    }

    this.renderReadme()
  }

  renderReadme () {
    let readme
    if (this.pack.metadata.readme && this.pack.metadata.readme.trim() !== NORMALIZE_PACKAGE_DATA_README_ERROR) {
      readme = this.pack.metadata.readme
    } else {
      readme = null
    }

    if (this.readmePath && fs.existsSync(this.readmePath) && fs.statSync(this.readmePath).isFile() && !readme) {
      readme = fs.readFileSync(this.readmePath, {encoding: 'utf8'})
    }

    let readmeSrc, readmeIsLocal;

    if (this.pack.path) {
      // If package is installed, use installed path
      readmeSrc = this.pack.path
      readmeIsLocal = true;
    } else {
      // If package isn't installed, use url path
      let repoUrl = this.packageManager.getRepositoryUrl(this.pack)
      readmeIsLocal = false;

      // Check if URL is undefined (i.e. package is unpublished)
      if (repoUrl) {
        readmeSrc = repoUrl;
      }
    }

    const readmeView = new PackageReadmeView(readme, readmeSrc, readmeIsLocal)
    if (this.readmeView) {
      this.readmeView.element.parentElement.replaceChild(readmeView.element, this.readmeView.element)
      this.readmeView.destroy()
    } else {
      this.refs.sections.appendChild(readmeView.element)
    }
    this.readmeView = readmeView
  }

  subscribeToPackageManager () {
    this.disposables.add(this.packageManager.on('theme-installed package-installed', ({pack}) => {
      if (this.pack.name === pack.name) {
        this.loadPackage()
        this.updateInstalledState()
      }
    }))

    this.disposables.add(this.packageManager.on('theme-uninstalled package-uninstalled', ({pack}) => {
      if (this.pack.name === pack.name) {
        return this.updateInstalledState()
      }
    }))

    this.disposables.add(this.packageManager.on('theme-updated package-updated', ({pack}) => {
      if (this.pack.name === pack.name) {
        this.loadPackage()
        this.updateFileButtons()
        this.populate()
      }
    }))
  }

  openMarkdownFile (path) {
    if (atom.packages.isPackageActive('markdown-preview')) {
      atom.workspace.open(encodeURI(`markdown-preview://${path}`))
    } else {
      atom.workspace.open(path)
    }
  }

  updateFileButtons () {
    this.changelogPath = null
    this.licensePath = null
    this.readmePath = null

    const packagePath = this.pack.path != null ? this.pack.path : atom.packages.resolvePackagePath(this.pack.name)
    for (const child of fs.listSync(packagePath)) {
      switch (path.basename(child, path.extname(child)).toLowerCase()) {
        case 'changelog':
        case 'history':
          this.changelogPath = child
          break
        case 'license':
        case 'licence':
          this.licensePath = child
          break
        case 'readme':
          this.readmePath = child
          break
      }

      if (this.readmePath && this.changelogPath && this.licensePath) {
        break
      }
    }

    if (this.changelogPath) {
      this.refs.changelogButton.style.display = ''
    } else {
      this.refs.changelogButton.style.display = 'none'
    }

    if (this.licensePath) {
      this.refs.licenseButton.style.display = ''
    } else {
      this.refs.licenseButton.style.display = 'none'
    }
  }

  getStartupTime () {
    const loadTime = this.pack.loadTime != null ? this.pack.loadTime : 0
    const activateTime = this.pack.activateTime != null ? this.pack.activateTime : 0
    return loadTime + activateTime
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

class PackageCardComponent {
  constructor (props) {
    this.packageCard = new PackageCard(props.metadata, props.settingsView, props.packageManager, props.options)
    this.element = this.packageCard.element
  }

  update () {}

  destroy () {}
}
