/** @babel */
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import asyncQueue from 'async/queue'
import etch from 'etch'

import ErrorView from './error-view'
import PackageCard from './package-card'

export default class UpdatesPanel {
  constructor (settingsView, packageManager) {
    this.settingsView = settingsView
    this.packageManager = packageManager
    this.disposables = new CompositeDisposable()
    this.updatingPackages = []
    this.packageCards = []

    etch.initialize(this)

    this.refs.updateAllButton.style.display = 'none'
    this.checkForUpdates()

    this.disposables.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))

    this.disposables.add(this.packageManager.on('package-updating theme-updating', ({pack, error}) => {
      this.refs.checkButton.disabled = true
      this.updatingPackages.push(pack)
    }))

    this.disposables.add(
      this.packageManager.on('package-updated theme-updated package-update-failed theme-update-failed', ({pack, error}) => {
        if (error != null) {
          this.refs.updateErrors.appendChild(new ErrorView(this.packageManager, error).element)
        }

        for (let i = 0; i < this.updatingPackages.length; i++) {
          const update = this.updatingPackages[i]
          if (update.name === pack.name) {
            this.updatingPackages.splice(i, 1)
          }
        }

        if (!this.updatingPackages.length) {
          this.refs.checkButton.disabled = false
        }
      })
    )
  }

  destroy () {
    this.clearPackageCards()
    this.disposables.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <div tabIndex='0' className='panels-item'>
        <section className='section packages'>
          <div className='section-container updates-container'>
            <div className='updates-heading-container'>
              <h1 className='section-heading icon icon-cloud-download'>Available Updates</h1>
              <div className='section-heading updates-btn-group'>
                <button
                  ref='checkButton'
                  className='update-all-button btn'
                  onclick={() => { this.checkForUpdates(true) }}>Check for Updates</button>
                <button
                  ref='updateAllButton'
                  className='update-all-button btn btn-primary'
                  onclick={() => { this.updateAll() }}>Update All</button>
              </div>
            </div>

            <div ref='versionPinnedPackagesMessage' className='alert alert-warning icon icon-alert'>The following packages are pinned to their current version and are not being checked for updates: <strong>{ this.packageManager.getVersionPinnedPackages().join(', ') }</strong></div>
            <div ref='updateErrors' />
            <div ref='checkingMessage' className='alert alert-info icon icon-hourglass'>{`Checking for updates\u2026`}</div>
            <div ref='noUpdatesMessage' className='alert alert-info icon icon-heart'>All of your installed packages are up to date!</div>
            <div ref='updatesContainer' className='container package-container' />
          </div>
        </section>
      </div>
    )
  }

  focus () {
    this.element.focus()
  }

  show () {
    this.element.style.display = ''
  }

  beforeShow (opts) {
    if (opts && opts.back) {
      this.refs.breadcrumb.textContent = opts.back
      this.refs.breadcrumb.onclick = () => { this.settingsView.showPanel(opts.back) }
    }

    if (opts && opts.updates) {
      this.availableUpdates = opts.updates
      this.addUpdateViews()
    } else {
      this.availableUpdates = []
      this.clearPackageCards()
      this.checkForUpdates()
    }

    if (this.packageManager.getVersionPinnedPackages().length === 0) {
      this.refs.versionPinnedPackagesMessage.style.display = 'none'
    }
  }

  // Check for updates and display them
  async checkForUpdates (clearCache) {
    this.refs.noUpdatesMessage.style.display = 'none'
    this.refs.updateAllButton.disabled = true
    this.refs.checkButton.disabled = true
    this.refs.checkingMessage.style.display = ''

    try {
      this.availableUpdates = await this.packageManager.getOutdated(clearCache)
      this.refs.checkButton.disabled = false
      this.addUpdateViews()
    } catch (error) {
      this.refs.checkButton.disabled = false
      this.refs.checkingMessage.style.display = 'none'
      this.refs.updateErrors.appendChild(new ErrorView(this.packageManager, error).element)
    }
  }

  addUpdateViews () {
    if (this.availableUpdates.length > 0) {
      this.refs.updateAllButton.style.display = ''
      this.refs.updateAllButton.disabled = false
    }
    this.refs.checkingMessage.style.display = 'none'
    this.clearPackageCards()
    if (this.availableUpdates.length === 0) {
      this.refs.noUpdatesMessage.style.display = ''
    }

    for (const pack of this.availableUpdates) {
      const packageCard = new PackageCard(pack, this.settingsView, this.packageManager, {back: 'Updates'})
      this.refs.updatesContainer.appendChild(packageCard.element)
      this.packageCards.push(packageCard)
    }
  }

  async updateAll () {
    this.refs.checkButton.disabled = true
    this.refs.updateAllButton.disabled = true

    let updatingPackages = this.updatingPackages
    let successfulUpdatesCount = 0
    let failedUpdatesCount = 0

    const concurrency = atom.config.get('settings-view.packageUpdateConcurrency') > 0
      ? atom.config.get('settings-view.packageUpdateConcurrency')
      : Number.POSITIVE_INFINITY

    const queue = asyncQueue(function (packageCard, callback) {
      const onUpdateCompleted = function (err) {
        err == null ? successfulUpdatesCount++ : failedUpdatesCount++
      }

      if (updatingPackages.includes(packageCard.pack)) {
        callback()
      } else {
        packageCard.update().then(onUpdateCompleted, onUpdateCompleted).then(callback)
      }
    }, concurrency)

    queue.push(this.packageCards)

    await queue.drain()

    if (successfulUpdatesCount > 0) {
      const message = `Restart Atom to complete the update of ${successfulUpdatesCount} ${pluralize('package', successfulUpdatesCount)}:`
      let detail = ''
      this.packageCards.forEach((card) => {
        let oldVersion = ''
        let newVersion = ''

        if (card.pack.apmInstallSource && card.pack.apmInstallSource.type === 'git') {
          oldVersion = card.pack.apmInstallSource.sha.substr(0, 8)
          newVersion = `${card.pack.latestSha.substr(0, 8)}`
        } else if (card.pack.version && card.pack.latestVersion) {
          oldVersion = card.pack.version
          newVersion = card.pack.latestVersion
        }

        if (oldVersion && newVersion) {
          detail += `${card.pack.name}@${oldVersion} -> ${newVersion}\n`
        }
      })
      detail = detail.trim()

      const notification = atom.notifications.addSuccess(message, {
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
    }

    if (failedUpdatesCount === 0) {
      this.refs.checkButton.disabled = false
      this.refs.updateAllButton.style.display = 'none'
    } else {
      this.refs.checkButton.disabled = false
      this.refs.updateAllButton.disabled = false
    }
  }

  clearPackageCards () {
    while (this.packageCards.length) {
      this.packageCards.pop().destroy()
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

function pluralize (word, count) {
  return (count > 1) ? `${word}s` : word
}
