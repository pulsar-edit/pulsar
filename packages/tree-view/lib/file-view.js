const {CompositeDisposable} = require('atom')
const getIconServices = require('./get-icon-services')

module.exports =
class FileView {
  constructor (file) {
    this.file = file
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(this.file.onDidDestroy(() => this.subscriptions.dispose()))

    this.element = document.createElement('li')
    this.element.setAttribute('is', 'tree-view-file')
    this.element.draggable = true
    this.element.classList.add('file', 'entry', 'list-item')

    this.fileName = document.createElement('span')
    this.fileName.classList.add('name', 'icon')
    this.element.appendChild(this.fileName)
    this.fileName.textContent = this.file.name
    this.fileName.title = this.file.name
    this.fileName.dataset.name = this.file.name
    this.fileName.dataset.path = this.file.path

    this.updateIcon()
    this.subscriptions.add(this.file.onDidStatusChange(() => this.updateStatus()))
    this.subscriptions.add(getIconServices().onDidChange(() => this.updateIcon()))
    this.updateStatus()
  }

  updateIcon () {
    getIconServices().updateFileIcon(this)
    this.element.getPath = this.getPath.bind(this)
    this.element.isPathEqual = this.isPathEqual.bind(this)
    this.element.file = this.file
    this.element.fileName = this.fileName
    this.element.updateStatus = this.updateStatus.bind(this)
  }

  updateStatus () {
    this.element.classList.remove('status-ignored', 'status-ignored-name', 'status-modified', 'status-added')
    if (this.file.status != null) {
      this.element.classList.add(`status-${this.file.status}`)
    }
  }

  getPath () {
    return this.fileName.dataset.path
  }

  isPathEqual (pathToCompare) {
    return this.file.isPathEqual(pathToCompare)
  }
}
