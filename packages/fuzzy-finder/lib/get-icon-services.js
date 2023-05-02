const DefaultFileIcons = require('./default-file-icons')
const {Emitter, CompositeDisposable} = require('atom')

let iconServices
module.exports = function () {
  if (!iconServices) iconServices = new IconServices()
  return iconServices
}

class IconServices {
  constructor () {
    this.emitter = new Emitter()
    this.elementIcons = null
    this.elementIconDisposables = new CompositeDisposable()
    this.fileIcons = DefaultFileIcons
  }

  onDidChange (callback) {
    return this.emitter.on('did-change', callback)
  }

  resetElementIcons () {
    this.setElementIcons(null)
  }

  resetFileIcons () {
    this.setFileIcons(DefaultFileIcons)
  }

  setElementIcons (service) {
    if (service !== this.elementIcons) {
      if (this.elementIconDisposables != null) {
        this.elementIconDisposables.dispose()
      }
      if (service) { this.elementIconDisposables = new CompositeDisposable() }
      this.elementIcons = service
      return this.emitter.emit('did-change')
    }
  }

  setFileIcons (service) {
    if (service !== this.fileIcons) {
      this.fileIcons = service
      return this.emitter.emit('did-change')
    }
  }

  updateIcon (view) {
    if (this.elementIcons) {
      const disposable = this.elementIcons(view.primaryLine, view.filePath)
      this.elementIconDisposables.add(disposable)
    } else {
      let classList = []
      const iconClasses = this.fileIcons.iconClassForPath(view.filePath, 'fuzzy-finder')
      if (Array.isArray(iconClasses)) {
        classList = iconClasses
      } else if (iconClasses) {
        classList = iconClasses.toString().split(/\s+/g)
      }
      view.primaryLine.classList.add(...classList)
    }
  }
}
