/** @babel */

import _ from 'underscore-plus'
import {CompositeDisposable, Disposable} from 'atom'

export default class PackageUpdatesStatusView {
  initialize (statusBar, packageManager, updates) {
    this.statusBar = statusBar
    this.updates = updates
    this.destroyed = true
    this.updatingPackages = []
    this.failedUpdates = []
    this.disposables = new CompositeDisposable()

    this.element = document.createElement('div')
    this.element.classList.add('package-updates-status-view', 'inline-block', 'text', 'text-info')

    const iconPackage = document.createElement('span')
    iconPackage.classList.add('icon', 'icon-package')
    this.element.appendChild(iconPackage)

    this.countLabel = document.createElement('span')
    this.countLabel.classList.add('available-updates-status')
    this.element.appendChild(this.countLabel)

    this.disposables.add(packageManager.on('package-update-available theme-update-available', ({pack, error}) => { this.onPackageUpdateAvailable(pack) }))
    this.disposables.add(packageManager.on('package-updating theme-updating', ({pack, error}) => { this.onPackageUpdating(pack) }))
    this.disposables.add(packageManager.on('package-updated theme-updated package-uninstalled theme-uninstalled', ({pack, error}) => { this.onPackageUpdated(pack) }))
    this.disposables.add(packageManager.on('package-update-failed theme-update-failed', ({pack, error}) => { this.onPackageUpdateFailed(pack) }))

    const clickHandler = () => {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'settings-view:check-for-package-updates')
    }
    this.element.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => { this.element.removeEventListener('click', clickHandler) }))

    this.updateTile()
  }

  destroy () {
    this.disposables.dispose()
    this.element.remove()

    if (this.tile) {
      this.tile.destroy()
      this.tile = null
    }

    if (this.tooltip) {
      this.tooltip.dispose()
      this.tooltip = null
    }
  }

  onPackageUpdateAvailable (pack) {
    for (const update of this.updates) {
      if (update.name === pack.name) {
        return
      }
    }

    this.updates.push(pack)
    this.updateTile()
  }

  onPackageUpdating (pack) {
    // Wipe failed status when an update is retried
    for (let index = 0; index < this.failedUpdates.length; index++) {
      const update = this.failedUpdates[index]
      if (update.name === pack.name) {
        this.failedUpdates.splice(index, 1)
      }
    }

    this.updatingPackages.push(pack)
    this.updateTile()
  }

  onPackageUpdated (pack) {
    for (let index = 0; index < this.updates.length; index++) {
      const update = this.updates[index]
      if (update.name === pack.name) {
        this.updates.splice(index, 1)
      }
    }

    for (let index = 0; index < this.updatingPackages.length; index++) {
      const update = this.updatingPackages[index]
      if (update.name === pack.name) {
        this.updatingPackages.splice(index, 1)
      }
    }

    for (let index = 0; index < this.failedUpdates.length; index++) {
      const update = this.failedUpdates[index]
      if (update.name === pack.name) {
        this.failedUpdates.splice(index, 1)
      }
    }

    this.updateTile()
  }

  onPackageUpdateFailed (pack) {
    for (const update of this.failedUpdates) {
      if (update.name === pack.name) {
        return
      }
    }

    for (let index = 0; index < this.updatingPackages.length; index++) {
      const update = this.updatingPackages[index]
      if (update.name === pack.name) {
        this.updatingPackages.splice(index, 1)
      }
    }

    this.failedUpdates.push(pack)
    this.updateTile()
  }

  updateTile () {
    if (this.updates.length) {
      if (this.tooltip) {
        this.tooltip.dispose()
        this.tooltip = null
      }

      if (this.destroyed) {
        // Priority of -99 should put us just to the left of the Squirrel icon, which displays when Atom has updates available
        this.tile = this.statusBar.addRightTile({item: this, priority: -99})
        this.destroyed = false
      }

      let labelText = `${_.pluralize(this.updates.length, 'update')}` // 5 updates
      let tooltipText = `${_.pluralize(this.updates.length, 'package update')} available`

      if (this.updatingPackages.length) {
        labelText = `${this.updatingPackages.length}/${this.updates.length} updating` // 3/5 updating
        tooltipText += `, ${_.pluralize(this.updatingPackages.length, 'package')} currently updating`
      }

      if (this.failedUpdates.length) {
        labelText += ` (${this.failedUpdates.length} failed)` // 1 update (1 failed), or 3/5 updating (1 failed)
        tooltipText += `, ${_.pluralize(this.failedUpdates.length, 'failed update')}`
      }

      this.countLabel.textContent = labelText
      this.tooltip = atom.tooltips.add(this.element, {title: tooltipText})
    } else if (!this.destroyed) {
      this.tile.destroy()
      this.tile = null
      this.destroyed = true
    }
  }
}
