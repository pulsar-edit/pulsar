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

  updateMRUIcon (view) {
    if (this.elementIcons) {
      view.firstLineDiv.classList.add('icon')
      this.elementIconDisposables.add(this.elementIcons(view.firstLineDiv, view.itemPath))
    } else {
      let typeClasses = this.fileIcons.iconClassForPath(view.itemPath, 'tabs-mru-switcher')
      if (typeClasses) {
        if (!Array.isArray(typeClasses)) typeClasses = typeClasses.split(/\s+/g)
        if (typeClasses) view.firstLineDiv.classList.add(...typeClasses)
      }
    }
  }

  updateTabIcon (view) {
    if (view.iconElement && !view.iconElement.disposed) return
    if (view.iconName) {
      const names = !Array.isArray(view.iconName)
        ? view.iconName.split(/\s+/g)
        : view.iconName
      view.itemTitle.classList.remove('icon', `icon-${names[0]}`, ...names)
    }
    if (typeof view.item.getIconName === 'function') {
      view.iconName = view.item.getIconName()
    } else {
      view.iconName = null
    } if (view.iconName) {
      return view.itemTitle.classList.add('icon', `icon-${view.iconName}`)
    } else if (view.path != null) {
      if (this.elementIcons) {
        view.itemTitle.classList.add('icon')
        view.iconElement = this.elementIcons(view.itemTitle, view.path, {isTabIcon: true})
        view.subscriptions.add(view.iconElement)
      } else {
        view.iconName = this.fileIcons.iconClassForPath(view.path, 'tabs')
        if (view.iconName) {
          let names = view.iconName
          if (!Array.isArray(names)) {
            names = names.toString().split(/\s+/g)
          }
          return view.itemTitle.classList.add('icon', ...names)
        }
      }
    }
  }
}
