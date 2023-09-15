/** @babel */
/** @jsx etch.dom */

import {CompositeDisposable, Disposable} from 'atom'
import {shell} from 'electron'
import etch from 'etch'
import BadgeView from './badge-view'
import path from 'path'

import {ownerFromRepository, repoUrlFromRepository} from './utils'

let marked = null

export default class PackageCard {
  constructor (pack, settingsView, packageManager, options = {}) {
    this.pack = pack
    this.settingsView = settingsView
    this.packageManager = packageManager
    this.disposables = new CompositeDisposable()

    // It might be useful to either wrap this.pack in a class that has a
    // ::validate method, or add a method here. At the moment I think all cases
    // of malformed package metadata are handled here and in ::content but belt
    // and suspenders, you know
    this.client = this.packageManager.getClient()
    this.type = this.pack.theme ? 'theme' : 'package'
    this.name = this.pack.name
    this.onSettingsView = options.onSettingsView

    if (this.pack.latestVersion !== this.pack.version) {
      this.newVersion = this.pack.latestVersion
    }

    if (this.pack.apmInstallSource && this.pack.apmInstallSource.type === 'git') {
      if (this.pack.apmInstallSource.sha !== this.pack.latestSha) {
        this.newSha = this.pack.latestSha
      }
    }

    // Default to displaying the download count
    if (!options.stats) {
      options.stats = {downloads: true}
    }

    etch.initialize(this)

    this.displayStats(options)
    this.handlePackageEvents()
    this.handleButtonEvents(options)
    this.loadCachedMetadata()
    this.addBadges()

    // themes have no status and cannot be dis/enabled
    if (this.type === 'theme') {
      this.refs.statusIndicator.remove()
      this.refs.enablementButton.remove()
    }

    if (atom.packages.isBundledPackage(this.pack.name)) {
      this.refs.installButtonGroup.remove()
      this.refs.uninstallButton.remove()
    }

    if (!this.newVersion && !this.newSha) {
      this.refs.updateButtonGroup.style.display = 'none'
    }

    this.hasCompatibleVersion = true
    this.updateInterfaceState()
  }

  render () {
    const displayName = (this.pack.gitUrlInfo ? this.pack.gitUrlInfo.project : this.pack.name) || ''
    const owner = ownerFromRepository(this.pack.repository)
    const description = this.pack.description || ''

    return (
      <div className='package-card col-lg-8'>
        <div ref='statsContainer' className='stats pull-right'>
          <span ref='packageStars' className='stats-item'>
            <span ref='stargazerIcon' className='icon icon-star' />
            <span ref='stargazerCount' className='value' />
          </span>

          <span ref='packageDownloads' className='stats-item'>
            <span ref='downloadIcon' className='icon icon-cloud-download' />
            <span ref='downloadCount' className='value' />
          </span>
        </div>

        <div className='body'>
          <h4 className='card-name'>
            <a className='package-name' ref='packageName'>{displayName}</a>
            <span className='package-version'>
              <span ref='versionValue' className='value'>{String(this.pack.version)}</span>
            </span>
            <span ref='badges'></span>
          </h4>
          <span ref='packageDescription' className='package-description'>{description}</span>
          <div ref='packageMessage' className='package-message' />
        </div>

        <div className='meta'>
          <div ref='metaUserContainer' className='meta-user'>
            <a ref='avatarLink'>
              {/* A transparent gif so there is no "broken border" */}
              <img ref='avatar' className='avatar' src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' />
            </a>
            <a ref='loginLink' className='author'>{owner}</a>
          </div>
          <div className='meta-controls'>
            <div className='btn-toolbar'>
              <div ref='updateButtonGroup' className='btn-group'>
                <button type='button' className='btn btn-info icon icon-cloud-download install-button' ref='updateButton'>Update</button>
              </div>
              <div ref='installButtonGroup' className='btn-group'>
                <button type='button' className='btn btn-info icon icon-cloud-download install-button' ref='installButton'>Install</button>
              </div>
              <div ref='packageActionButtonGroup' className='btn-group'>
                <button type='button' className='btn icon icon-gear settings' ref='settingsButton'>Settings</button>
                <button type='button' className='btn icon icon-trashcan uninstall-button' ref='uninstallButton'>Uninstall</button>
                <button type='button' className='btn icon icon-playback-pause enablement' ref='enablementButton'>
                  <span className='disable-text'>Disable</span>
                </button>
                <button type='button' className='btn status-indicator' tabIndex='-1' ref='statusIndicator' />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  locateCompatiblePackageVersion (callback) {
    this.packageManager.loadCompatiblePackageVersion(this.pack.name, (err, pack) => {
      if (err != null) {
        console.error(err)
      }

      const packageVersion = pack.version

      // A compatible version exist, we activate the install button and
      // set this.installablePack so that the install action installs the
      // compatible version of the package.
      if (packageVersion) {
        this.refs.versionValue.textContent = packageVersion
        if (packageVersion !== this.pack.version) {
          this.refs.versionValue.classList.add('text-warning')
          this.refs.packageMessage.classList.add('text-warning')
          this.refs.packageMessage.textContent = `Version ${packageVersion} is not the latest version available for this package, but it's the latest that is compatible with your version of Pulsar.`
        }

        this.installablePack = pack
        this.hasCompatibleVersion = true
      } else {
        this.hasCompatibleVersion = false
        this.refs.versionValue.classList.add('text-error')
        this.refs.packageMessage.classList.add('text-error')
        this.refs.packageMessage.insertAdjacentText(
          'beforeend',
          `There's no version of this package that is compatible with your Pulsar version. The version must satisfy ${this.pack.engines.atom}.`
        )
        console.error(`No available version compatible with the installed Pulsar version: ${atom.getVersion()}`)
      }

      callback()
    })
  }

  handleButtonEvents (options) {
    if (options && options.onSettingsView) {
      this.refs.settingsButton.style.display = 'none'
    } else {
      const clickHandler = (event) => {
        event.stopPropagation()
        this.settingsView.showPanel(this.pack.name, {back: options ? options.back : null, pack: this.pack})
      }

      this.element.addEventListener('click', clickHandler)
      this.disposables.add(new Disposable(() => { this.element.removeEventListener('click', clickHandler) }))

      this.refs.settingsButton.addEventListener('click', clickHandler)
      this.disposables.add(new Disposable(() => { this.refs.settingsButton.removeEventListener('click', clickHandler) }))
    }

    const installButtonClickHandler = (event) => {
      event.stopPropagation()
      this.install()
    }
    this.refs.installButton.addEventListener('click', installButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.installButton.removeEventListener('click', installButtonClickHandler) }))

    const uninstallButtonClickHandler = (event) => {
      event.stopPropagation()
      this.uninstall()
    }
    this.refs.uninstallButton.addEventListener('click', uninstallButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.uninstallButton.removeEventListener('click', uninstallButtonClickHandler) }))

    const updateButtonClickHandler = (event) => {
      event.stopPropagation()
      this.update().then(() => {
        let oldVersion = ''
        let newVersion = ''

        if (this.pack.apmInstallSource && this.pack.apmInstallSource.type === 'git') {
          oldVersion = this.pack.apmInstallSource.sha.substr(0, 8)
          newVersion = `${this.pack.latestSha.substr(0, 8)}`
        } else if (this.pack.version && this.pack.latestVersion) {
          oldVersion = this.pack.version
          newVersion = this.pack.latestVersion
        }

        let detail = ''
        if (oldVersion && newVersion) {
          detail = `${oldVersion} -> ${newVersion}`
        }

        const notification = atom.notifications.addSuccess(`Restart Pulsar to complete the update of \`${this.pack.name}\`.`, {
          dismissable: true,
          buttons: [{
            text: 'Restart now',
            onDidClick () { return atom.restartApplication() }
          },
          {
            text: 'I\'ll do it later',
            onDidClick () { notification.dismiss() }
          }],
          detail
        })
      })
    }
    this.refs.updateButton.addEventListener('click', updateButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.updateButton.removeEventListener('click', updateButtonClickHandler) }))

    const packageNameClickHandler = (event) => {
      event.stopPropagation()
      shell.openExternal(`https://web.pulsar-edit.dev/packages/${this.pack.name}`)
    }
    this.refs.packageName.addEventListener('click', packageNameClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.packageName.removeEventListener('click', packageNameClickHandler) }))

    const packageAuthorClickHandler = (event) => {
      event.stopPropagation()
      shell.openExternal(`https://web.pulsar-edit.dev/users/${ownerFromRepository(this.pack.repository)}`) //TODO: Fix - This does not current exist but this will at least be more accurate
    }
    this.refs.loginLink.addEventListener('click', packageAuthorClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.loginLink.removeEventListener('click', packageAuthorClickHandler) }))
    this.refs.avatarLink.addEventListener('click', packageAuthorClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.avatarLink.removeEventListener('click', packageAuthorClickHandler) }))

    const enablementButtonClickHandler = (event) => {
      event.stopPropagation()
      event.preventDefault()
      if (this.isDisabled()) {
        atom.packages.enablePackage(this.pack.name)
      } else {
        atom.packages.disablePackage(this.pack.name)
      }
    }
    this.refs.enablementButton.addEventListener('click', enablementButtonClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.enablementButton.removeEventListener('click', enablementButtonClickHandler) }))

    const packageMessageClickHandler = (event) => {
      const target = event.target.closest('a')
      if (target) {
        event.stopPropagation()
        event.preventDefault()
        if (target.href && target.href.startsWith('atom:')) {
          atom.workspace.open(target.href)
        }
      }
    }
    this.refs.packageMessage.addEventListener('click', packageMessageClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.packageMessage.removeEventListener('click', packageMessageClickHandler) }))
  }

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  loadCachedMetadata () {
    if (repoUrlFromRepository(this.pack.repository) === atom.branding.urlCoreRepo) {
      // Don't hit the web for our bundled packages. Just use the local image.
      this.refs.avatar.src = `file://${path.join(process.resourcesPath, "pulsar.png")}`;
    } else {
      this.client.avatar(ownerFromRepository(this.pack.repository), (err, avatarPath) => {
        if (!err && avatarPath) {
          this.refs.avatar.src = `file://${avatarPath}`
        }
      })
    }

    // We don't want to hit the API for this data, if it's a bundled package
    if (this.pack.repository !== atom.branding.urlCoreRepo) {
      this.client.package(this.pack.name, (err, data) => {
        // We don't need to actually handle the error here, we can just skip
        // showing the download count if there's a problem.
        if (!err) {
          if (data == null) {
            data = {}
          }

          if (this.pack.apmInstallSource && this.pack.apmInstallSource.type === 'git') {
            this.refs.downloadIcon.classList.remove('icon-cloud-download')
            this.refs.downloadIcon.classList.add('icon-git-branch')
            this.refs.downloadCount.textContent = this.pack.apmInstallSource.sha.substr(0, 8)
          } else {

            this.refs.stargazerCount.textContent = data.stargazers_count ? parseInt(data.stargazers_count).toLocaleString() : ''
            this.refs.downloadCount.textContent = data.downloads ? parseInt(data.downloads).toLocaleString() : ''
          }
        }
      })
    }
  }

  updateInterfaceState () {
    this.refs.versionValue.textContent = (this.installablePack ? this.installablePack.version : null) || this.pack.version
    if (this.pack.apmInstallSource && this.pack.apmInstallSource.type === 'git') {
      this.refs.downloadCount.textContent = this.pack.apmInstallSource.sha.substr(0, 8)
    }

    this.updateSettingsState()
    this.updateInstalledState()
    this.updateDisabledState()
  }

  updateSettingsState () {
    if (this.hasSettings() && !this.onSettingsView) {
      this.refs.settingsButton.style.display = ''
    } else {
      this.refs.settingsButton.style.display = 'none'
    }
  }

  addBadges() {
    if (Array.isArray(this.pack.badges)) {
      // This safety check is especially needed, as any cached package
      // data will not contain the badges field
      for (const badge of this.pack.badges) {
        let badgeView = new BadgeView(badge)
        this.refs.badges.appendChild(badgeView.element)
      }
    }
  }

  // Section: disabled state updates

  updateDisabledState () {
    if (this.isDisabled()) {
      this.displayDisabledState()
    } else if (this.element.classList.contains('disabled')) {
      this.displayEnabledState()
    }
  }

  displayEnabledState () {
    this.element.classList.remove('disabled')
    if (this.type === 'theme') {
      this.refs.enablementButton.style.display = 'none'
    }
    this.refs.enablementButton.querySelector('.disable-text').textContent = 'Disable'
    this.refs.enablementButton.classList.add('icon-playback-pause')
    this.refs.enablementButton.classList.remove('icon-playback-play')
    this.refs.statusIndicator.classList.remove('is-disabled')
  }

  displayDisabledState () {
    this.element.classList.add('disabled')
    this.refs.enablementButton.querySelector('.disable-text').textContent = 'Enable'
    this.refs.enablementButton.classList.add('icon-playback-play')
    this.refs.enablementButton.classList.remove('icon-playback-pause')
    this.refs.statusIndicator.classList.add('is-disabled')
    this.refs.enablementButton.disabled = false
  }

  // Section: installed state updates

  updateInstalledState () {
    if (this.isInstalled()) {
      this.displayInstalledState()
    } else {
      this.displayNotInstalledState()
    }
  }

  displayInstalledState () {
    if (this.newVersion || this.newSha) {
      this.refs.updateButtonGroup.style.display = ''
      if (this.newVersion) {
        this.refs.updateButton.textContent = `Update to ${this.newVersion}`
      } else if (this.newSha) {
        this.refs.updateButton.textContent = `Update to ${this.newSha.substr(0, 8)}`
      }
    } else {
      this.refs.updateButtonGroup.style.display = 'none'
    }

    this.refs.installButtonGroup.style.display = 'none'
    this.refs.packageActionButtonGroup.style.display = ''
    this.refs.uninstallButton.style.display = ''
  }

  displayNotInstalledState () {
    this.refs.uninstallButton.style.display = 'none'
    const atomVersion = this.packageManager.normalizeVersion(atom.getVersion())
    if (!this.packageManager.satisfiesVersion(atomVersion, this.pack)) {
      this.hasCompatibleVersion = false
      this.setNotInstalledStateButtons()
      this.locateCompatiblePackageVersion(() => { this.setNotInstalledStateButtons() })
    } else {
      this.setNotInstalledStateButtons()
    }
  }

  setNotInstalledStateButtons () {
    if (!this.hasCompatibleVersion) {
      this.refs.installButtonGroup.style.display = 'none'
      this.refs.updateButtonGroup.style.display = 'none'
    } else if (this.newVersion || this.newSha) {
      this.refs.updateButtonGroup.style.display = ''
      this.refs.installButtonGroup.style.display = 'none'
    } else {
      this.refs.updateButtonGroup.style.display = 'none'
      this.refs.installButtonGroup.style.display = ''
    }
    this.refs.packageActionButtonGroup.style.display = 'none'
  }

  displayStats (options) {
    if (options && options.stats && options.stats.downloads) {
      this.refs.packageDownloads.style.display = ''
    } else {
      this.refs.packageDownloads.style.display = 'none'
    }

    if (options && options.stats && options.stats.stars) {
      this.refs.packageStars.style.display = ''
    } else {
      this.refs.packageStars.style.display = 'none'
    }
  }

  displayGitPackageInstallInformation () {
    this.refs.metaUserContainer.remove()
    this.refs.statsContainer.remove()
    const {gitUrlInfo} = this.pack
    if (gitUrlInfo.default === 'shortcut') {
      this.refs.packageDescription.textContent = gitUrlInfo.https()
    } else {
      this.refs.packageDescription.textContent = gitUrlInfo.toString()
    }
    this.refs.installButton.classList.remove('icon-cloud-download')
    this.refs.installButton.classList.add('icon-git-commit')
    this.refs.updateButton.classList.remove('icon-cloud-download')
    this.refs.updateButton.classList.add('icon-git-commit')
  }

  displayAvailableUpdate (newVersion) {
    this.newVersion = newVersion
    this.updateInterfaceState()
  }

  handlePackageEvents () {
    this.disposables.add(atom.packages.onDidDeactivatePackage((pack) => {
      if (pack.name === this.pack.name) {
        this.updateDisabledState()
      }
    }))

    this.disposables.add(atom.packages.onDidActivatePackage((pack) => {
      if (pack.name === this.pack.name) {
        this.updateDisabledState()
      }
    }))

    this.disposables.add(atom.config.onDidChange('core.disabledPackages', () => {
      this.updateDisabledState()
    }))

    this.subscribeToPackageEvent('package-installing theme-installing', () => {
      this.updateInterfaceState()
      this.refs.installButton.disabled = true
      this.refs.installButton.classList.add('is-installing')
    })

    this.subscribeToPackageEvent('package-updating theme-updating', () => {
      this.updateInterfaceState()
      this.refs.updateButton.disabled = true
      this.refs.updateButton.classList.add('is-installing')
    })

    this.subscribeToPackageEvent('package-uninstalling theme-uninstalling', () => {
      this.updateInterfaceState()
      this.refs.enablementButton.disabled = true
      this.refs.uninstallButton.disabled = true
      this.refs.uninstallButton.classList.add('is-uninstalling')
    })

    this.subscribeToPackageEvent('package-installed package-install-failed theme-installed theme-install-failed', () => {
      const loadedPack = atom.packages.getLoadedPackage(this.pack.name)
      const version = loadedPack && loadedPack.metadata ? loadedPack.metadata.version : null
      if (version) {
        this.pack.version = version
      }
      this.refs.installButton.disabled = false
      this.refs.installButton.classList.remove('is-installing')
      this.updateInterfaceState()
    })

    this.subscribeToPackageEvent('package-updated theme-updated', () => {
      const loadedPack = atom.packages.getLoadedPackage(this.pack.name)
      const metadata = loadedPack ? loadedPack.metadata : null
      if (metadata && metadata.version) {
        this.pack.version = metadata.version
      }

      if (metadata && metadata.apmInstallSource) {
        this.pack.apmInstallSource = metadata.apmInstallSource
      }

      this.newVersion = null
      this.newSha = null
      this.refs.updateButton.disabled = false
      this.refs.updateButton.classList.remove('is-installing')
      this.updateInterfaceState()
    })

    this.subscribeToPackageEvent('package-update-failed theme-update-failed', () => {
      this.refs.updateButton.disabled = false
      this.refs.updateButton.classList.remove('is-installing')
      this.updateInterfaceState()
    })

    this.subscribeToPackageEvent('package-uninstalled package-uninstall-failed theme-uninstalled theme-uninstall-failed', () => {
      this.newVersion = null
      this.newSha = null
      this.refs.enablementButton.disabled = false
      this.refs.uninstallButton.disabled = false
      this.refs.uninstallButton.classList.remove('is-uninstalling')
      this.updateInterfaceState()
    })
  }

  isInstalled () {
    return this.packageManager.isPackageInstalled(this.pack.name)
  }

  isDisabled () {
    return atom.packages.isPackageDisabled(this.pack.name)
  }

  hasSettings () {
    return this.packageManager.packageHasSettings(this.pack.name)
  }

  subscribeToPackageEvent (event, callback) {
    this.disposables.add(this.packageManager.on(event, ({pack, error}) => {
      if (pack.pack != null) {
        pack = pack.pack
      }

      const packageName = pack.name
      if (packageName === this.pack.name) {
        callback(pack, error)
      }
    }))
  }

  /*
  Section: Methods that should be on a Package model
  */

  install () {
    this.packageManager.install(this.installablePack != null ? this.installablePack : this.pack, (error) => {
      if (error != null) {
        console.error(`Installing ${this.type} ${this.pack.name} failed`, error.stack != null ? error.stack : error, error.stderr)
      } else {
        // if a package was disabled before installing it, re-enable it
        if (this.isDisabled()) {
          atom.packages.enablePackage(this.pack.name)
        }
      }
    })
  }

  update () {
    if (!this.newVersion && !this.newSha) {
      return Promise.resolve()
    }

    const pack = this.installablePack != null ? this.installablePack : this.pack
    const version = this.newVersion ? `v${this.newVersion}` : `#${this.newSha.substr(0, 8)}`
    return new Promise((resolve, reject) => {
      this.packageManager.update(pack, this.newVersion, error => {
        if (error != null) {
          atom.assert(false, 'Package update failed', assertionError => {
            assertionError.metadata = {
              type: this.type,
              name: pack.name,
              version,
              errorMessage: error.message,
              errorStack: error.stack,
              errorStderr: error.stderr
            }
          })
          console.error(`Updating ${this.type} ${pack.name} to ${version} failed:\n`, error, error.stderr != null ? error.stderr : '')
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  uninstall () {
    this.packageManager.uninstall(this.pack, (error) => {
      if (error != null) {
        console.error(`Uninstalling ${this.type} ${this.pack.name} failed`, error.stack != null ? error.stack : error, error.stderr)
      }
    })
  }
}
