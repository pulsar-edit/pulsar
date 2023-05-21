const DefaultFileIcons = require('./default-file-icons')
const {Emitter, CompositeDisposable} = require('atom')
const {repoForPath} = require('./helpers')

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
      if (service) {
        this.elementIconDisposables = new CompositeDisposable()
      }
      this.elementIcons = service
      this.emitter.emit('did-change')
    }
  }

  setFileIcons (service) {
    if (service !== this.fileIcons) {
      this.fileIcons = service
      this.emitter.emit('did-change')
    }
  }

  updateDirectoryIcon (view) {
    view.directoryName.className = ''

    const classes = ['name', 'icon']
    if (this.elementIcons) {
      const disposable = this.elementIcons(view.directoryName, view.directory.path)
      this.elementIconDisposables.add(disposable)
    } else {
      let iconClass
      if (view.directory.symlink) {
        iconClass = 'icon-file-symlink-directory'
      } else {
        iconClass = 'icon-file-directory'
        if (view.directory.isRoot) {
          const repo = repoForPath(view.directory.path)
          if (repo && repo.isProjectAtRoot()) iconClass = 'icon-repo'
        } else {
          if (view.directory.submodule) iconClass = 'icon-file-submodule'
        }
      }
      classes.push(iconClass)
    }
    view.directoryName.classList.add(...classes)
  }

  updateFileIcon (view) {
    view.fileName.className = ''

    const classes = ['name', 'icon']
    let iconClass
    if (this.elementIcons) {
      const disposable = this.elementIcons(view.fileName, view.file.path)
      this.elementIconDisposables.add(disposable)
    } else {
      iconClass = this.fileIcons.iconClassForPath(view.file.path, 'tree-view')
    }
    if (iconClass) {
      if (!Array.isArray(iconClass)) {
        iconClass = iconClass.toString().split(/\s+/g)
      }
      classes.push(...iconClass)
    }
    view.fileName.classList.add(...classes)
  }
}
