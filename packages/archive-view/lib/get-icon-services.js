const DefaultFileIcons = require('./default-file-icons')
const {Emitter, CompositeDisposable} = require('atom')
const path = require('path')

let iconServices
module.exports = function getIconServices () {
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

  updateDirectoryIcon (view) {
    view.entrySpan.classList.add('directory', 'icon', 'icon-file-directory')
    if (this.elementIcons) {
      view.iconDisposable = this.elementIcons(view.entrySpan, view.entry.path, {isDirectory: true})
    }
  }

  updateFileIcon (view) {
    const nameClasses = ['file', 'icon']
    if (this.elementIcons) {
      const fullPath = path.join(view.archivePath, view.entry.path)
      const disposable = this.elementIcons(view.name, fullPath)
      view.disposables.add(disposable)
      this.elementIconDisposables.add(disposable)
    } else {
      let typeClass = this.fileIcons.iconClassForPath(view.entry.path, 'archive-view') || []
      if (!Array.isArray(typeClass) && typeClass) {
        typeClass = typeClass.toString().split(/\s+/g)
      }
      nameClasses.push(...typeClass)
    }
    view.name.classList.add(...nameClasses)
  }
}
