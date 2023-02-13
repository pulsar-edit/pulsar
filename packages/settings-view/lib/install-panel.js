/** @babel */
/** @jsx etch.dom */

import path from 'path'
import electron from 'electron'
import etch from 'etch'
import hostedGitInfo from 'hosted-git-info'

import {CompositeDisposable, TextEditor} from 'atom'

import PackageCard from './package-card'
import ErrorView from './error-view'

const PackageNameRegex = /config\/install\/(package|theme):([a-z0-9-_]+)/i

export default class InstallPanel {
  constructor (settingsView, packageManager) {
    this.settingsView = settingsView
    this.packageManager = packageManager
    this.disposables = new CompositeDisposable()
    this.client = this.packageManager.getClient()
    this.atomIoURL = 'https://web.pulsar-edit.dev/'

    etch.initialize(this)

    this.refs.searchMessage.style.display = 'none'

    this.refs.searchEditor.setPlaceholderText('Search packages')
    this.searchType = 'packages'
    this.disposables.add(
      this.packageManager.on('package-install-failed', ({pack, error}) => {
        this.refs.searchErrors.appendChild(new ErrorView(this.packageManager, error).element)
      })
    )
    this.disposables.add(
      this.packageManager.on('package-installed theme-installed', ({pack}) => {
        const gitUrlInfo =
          (this.currentGitPackageCard && this.currentGitPackageCard.pack && this.currentGitPackageCard.pack.gitUrlInfo)
          ? this.currentGitPackageCard.pack.gitUrlInfo
          : null

        if (gitUrlInfo && gitUrlInfo === pack.gitUrlInfo) {
          this.updateGitPackageCard(pack)
        }
      })
    )
    const searchBuffer = this.refs.searchEditor.getBuffer();
    searchBuffer.debouncedEmitDidStopChangingEvent = (timer => () => {
      clearTimeout(timer);
      timer = setTimeout(searchBuffer.emitDidStopChangingEvent.bind(searchBuffer), 700);
    })();
    // TODO remove hack to extend stop changing delay
    this.disposables.add(
      this.refs.searchEditor.onDidStopChanging(() => {
        this.performSearch()
      })
    )
    this.disposables.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))

    this.loadFeaturedPackages()
  }

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  update () {}

  focus () {
    this.refs.searchEditor.element.focus()
  }

  show () {
    this.element.style.display = ''
  }

  render () {
    return (
      <div className='panels-item' tabIndex='-1'>
        <div className='section packages'>
          <div className='section-container'>
            <h1 ref='installHeading' className='section-heading icon icon-plus'>Install Packages</h1>

            <div className='text native-key-bindings' tabIndex='-1'>
              <span className='icon icon-question' />
              <span ref='publishedToText'>Packages are published to </span>
              <a className='link' onclick={this.didClickOpenAtomIo.bind(this)}>web.pulsar-edit.dev</a>
              <span> and are installed to {path.join(process.env.ATOM_HOME, 'packages')}</span>
            </div>

            <div className='search-container clearfix'>
              <div className='editor-container'>
                <TextEditor mini ref='searchEditor' />
              </div>
              <div className='btn-group'>
                <button ref='searchPackagesButton' className='btn btn-default selected' onclick={this.didClickSearchPackagesButton.bind(this)}>Packages</button>
                <button ref='searchThemesButton' className='btn btn-default' onclick={this.didClickSearchThemesButton.bind(this)}>Themes</button>
              </div>
            </div>

            <div ref='searchErrors' />
            <div ref='searchMessage' className='alert alert-info search-message icon icon-search' />
            <div ref='resultsContainer' className='container package-container' />
          </div>
        </div>

        <div className='section packages'>
          <div className='section-container'>
            <div ref='featuredHeading' className='section-heading icon icon-star' />
            <div ref='featuredErrors' />
            <div ref='loadingMessage' className='alert alert-info icon icon-hourglass' />
            <div ref='featuredContainer' className='container package-container' />
          </div>
        </div>
      </div>
    )
  }

  setSearchType (searchType) {
    if (searchType === 'theme') {
      this.searchType = 'themes'
      this.refs.searchThemesButton.classList.add('selected')
      this.refs.searchPackagesButton.classList.remove('selected')
      this.refs.searchEditor.setPlaceholderText('Search themes')
      this.refs.publishedToText.textContent = 'Themes are published to '
      this.atomIoURL = 'https://pulsar-edit.dev/themes'
      this.loadFeaturedPackages(true)
    } else if (searchType === 'package') {
      this.searchType = 'packages'
      this.refs.searchPackagesButton.classList.add('selected')
      this.refs.searchThemesButton.classList.remove('selected')
      this.refs.searchEditor.setPlaceholderText('Search packages')
      this.refs.publishedToText.textContent = 'Packages are published to '
      this.atomIoURL = 'https://web.pulsar-edit.dev/packages'
      this.loadFeaturedPackages()
    }
  }

  beforeShow (options) {
    if (options && options.uri) {
      const query = this.extractQueryFromURI(options.uri)
      if (query != null) {
        const {searchType, packageName} = query
        this.setSearchType(searchType)
        this.refs.searchEditor.setText(packageName)
        this.performSearch()
      }
    }
  }

  extractQueryFromURI (uri) {
    const matches = PackageNameRegex.exec(uri)
    if (matches) {
      const [, searchType, packageName] = Array.from(matches)
      return {searchType, packageName}
    } else {
      return null
    }
  }

  performSearch () {
    const query = this.refs.searchEditor.getText().trim().toLowerCase()
    if (query) {
      this.performSearchForQuery(query)
    }
  }

  performSearchForQuery (query) {
    const gitUrlInfo = hostedGitInfo.fromUrl(query)
    if (gitUrlInfo) {
      const type = gitUrlInfo.default
      if (type === 'sshurl' || type === 'https' || type === 'shortcut') {
        this.showGitInstallPackageCard({name: query, gitUrlInfo})
      }
    } else {
      this.search(query)
    }
  }

  showGitInstallPackageCard (pack) {
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy()
    }

    this.currentGitPackageCard = this.getPackageCardView(pack)
    this.currentGitPackageCard.displayGitPackageInstallInformation()
    this.replaceCurrentGitPackageCardView()
  }

  updateGitPackageCard (pack) {
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy()
    }

    this.currentGitPackageCard = this.getPackageCardView(pack)
    this.replaceCurrentGitPackageCardView()
  }

  replaceCurrentGitPackageCardView () {
    this.refs.resultsContainer.innerHTML = ''
    this.addPackageCardView(this.refs.resultsContainer, this.currentGitPackageCard)
  }

  async search (query) {
    this.refs.resultsContainer.innerHTML = ''
    this.refs.searchMessage.textContent = `Searching ${this.searchType} for \u201C${query}\u201D\u2026`
    this.refs.searchMessage.style.display = ''

    const options = {}
    options[this.searchType] = true

    try {
      const packages = (await this.client.search(query, options)) || []
      this.refs.resultsContainer.innerHTML = ''
      this.refs.searchMessage.style.display = 'none'
      if (packages.length === 0) {
        this.refs.searchMessage.textContent = `No ${this.searchType.replace(/s$/, '')} results for \u201C${query}\u201D`
        this.refs.searchMessage.style.display = ''
      }

      this.addPackageViews(this.refs.resultsContainer, packages)
    } catch (error) {
      this.refs.searchMessage.style.display = 'none'
      this.refs.searchErrors.appendChild(new ErrorView(this.packageManager, error).element)
    }
  }

  addPackageViews (container, packages) {
    for (const pack of packages) {
      this.addPackageCardView(container, this.getPackageCardView(pack))
    }
  }

  addPackageCardView (container, packageCard) {
    const packageRow = document.createElement('div')
    packageRow.classList.add('row')
    packageRow.appendChild(packageCard.element)
    container.appendChild(packageRow)
  }

  getPackageCardView (pack) {
    return new PackageCard(pack, this.settingsView, this.packageManager, {back: 'Install'})
  }

  filterPackages (packages, themes) {
    return packages.filter(({theme}) => themes ? theme : !theme)
  }

  // Load and display the featured packages that are available to install.
  loadFeaturedPackages (loadThemes) {
    if (loadThemes == null) {
      loadThemes = false
    }
    this.refs.featuredContainer.innerHTML = ''

    if (loadThemes) {
      this.refs.installHeading.textContent = 'Install Themes'
      this.refs.featuredHeading.textContent = 'Featured Themes'
      this.refs.loadingMessage.textContent = 'Loading featured themes\u2026'
    } else {
      this.refs.installHeading.textContent = 'Install Packages'
      this.refs.featuredHeading.textContent = 'Featured Packages'
      this.refs.loadingMessage.textContent = 'Loading featured packages\u2026'
    }

    this.refs.loadingMessage.style.display = ''

    const handle = error => {
      this.refs.loadingMessage.style.display = 'none'
      this.refs.featuredErrors.appendChild(new ErrorView(this.packageManager, error).element)
    }

    if (loadThemes) {
      this.client.featuredThemes((error, themes) => {
        if (error) {
          handle(error)
        } else {
          this.refs.loadingMessage.style.display = 'none'
          this.refs.featuredHeading.textContent = 'Featured Themes'
          this.addPackageViews(this.refs.featuredContainer, themes)
        }
      })
    } else {
      this.client.featuredPackages((error, packages) => {
        if (error) {
          handle(error)
        } else {
          this.refs.loadingMessage.style.display = 'none'
          this.refs.featuredHeading.textContent = 'Featured Packages'
          this.addPackageViews(this.refs.featuredContainer, packages)
        }
      })
    }
  }

  didClickOpenAtomIo (event) {
    event.preventDefault()
    electron.shell.openExternal(this.atomIoURL)
  }

  didClickSearchPackagesButton () {
    if (!this.refs.searchPackagesButton.classList.contains('selected')) {
      this.setSearchType('package')
    }

    this.performSearch()
  }

  didClickSearchThemesButton () {
    if (!this.refs.searchThemesButton.classList.contains('selected')) {
      this.setSearchType('theme')
    }

    this.performSearch()
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
