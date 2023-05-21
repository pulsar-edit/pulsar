/** @babel */

import {Disposable, CompositeDisposable} from 'atom'

export default class SettingsIconStatusView {
  constructor(statusBar) {
    this.statusBar = statusBar
    this.disposables = new CompositeDisposable()

    this.element = document.createElement('div')
    this.element.classList.add('settings-icon', 'inline-block')

    const iconPackage = document.createElement('span')
    iconPackage.classList.add('icon', 'icon-gear', 'is-icon-only')
    this.element.appendChild(iconPackage)

    const clickHandler = () => {
      atom.workspace.open("atom://config")
    }
    this.element.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => { this.element.removeEventListener('click', clickHandler) }))

  }

  attach () {
    this.tile = this.statusBar.addRightTile({
      item: this,
      priority: -99
    })
  }

  destroy () {
    this.disposables.dispose()
    this.element.remove()
    if (this.tile) {
      this.tile.destroy()
      this.tile = null
    }
  }
}
