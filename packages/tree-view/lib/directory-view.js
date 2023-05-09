const {CompositeDisposable} = require('atom')
const getIconServices = require('./get-icon-services')
const Directory = require('./directory')
const FileView = require('./file-view')

module.exports =
class DirectoryView {
  constructor (directory) {
    this.directory = directory
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(this.directory.onDidDestroy(() => this.subscriptions.dispose()))
    this.subscribeToDirectory()

    this.element = document.createElement('li')
    this.element.setAttribute('is', 'tree-view-directory')
    this.element.classList.add('directory', 'entry', 'list-nested-item', 'collapsed')

    this.header = document.createElement('div')
    this.header.classList.add('header', 'list-item')

    this.directoryName = document.createElement('span')
    this.directoryName.classList.add('name', 'icon')

    this.entries = document.createElement('ol')
    this.entries.classList.add('entries', 'list-tree')

    this.updateIcon()
    this.subscriptions.add(getIconServices().onDidChange(() => this.updateIcon()))
    this.directoryName.dataset.path = this.directory.path

    if (this.directory.squashedNames != null) {
      this.directoryName.dataset.name = this.directory.squashedNames.join('')
      this.directoryName.title = this.directory.squashedNames.join('')

      const squashedDirectoryNameNode = document.createElement('span')
      squashedDirectoryNameNode.classList.add('squashed-dir')
      squashedDirectoryNameNode.textContent = this.directory.squashedNames[0]
      this.directoryName.appendChild(squashedDirectoryNameNode)
      this.directoryName.appendChild(document.createTextNode(this.directory.squashedNames[1]))
    } else {
      this.directoryName.dataset.name = this.directory.name
      this.directoryName.title = this.directory.name
      this.directoryName.textContent = this.directory.name
    }

    this.element.appendChild(this.header)
    this.header.appendChild(this.directoryName)
    this.element.appendChild(this.entries)

    if (this.directory.isRoot) {
      this.element.classList.add('project-root')
      this.header.classList.add('project-root-header')
    } else {
      this.element.draggable = true
    }

    this.subscriptions.add(this.directory.onDidStatusChange(() => this.updateStatus()))
    this.updateStatus()

    if (this.directory.expansionState.isExpanded) {
      this.expand()
    }

    this.element.collapse = this.collapse.bind(this)
    this.element.expand = this.expand.bind(this)
    this.element.toggleExpansion = this.toggleExpansion.bind(this)
    this.element.reload = this.reload.bind(this)
    this.element.isExpanded = this.isExpanded
    this.element.updateStatus = this.updateStatus.bind(this)
    this.element.isPathEqual = this.isPathEqual.bind(this)
    this.element.getPath = this.getPath.bind(this)
    this.element.directory = this.directory
    this.element.header = this.header
    this.element.entries = this.entries
    this.element.directoryName = this.directoryName
  }

  updateIcon () {
    getIconServices().updateDirectoryIcon(this)
  }

  updateStatus () {
    this.element.classList.remove('status-ignored', 'status-ignored-name', 'status-modified', 'status-added')
    if (this.directory.status != null) {
      this.element.classList.add(`status-${this.directory.status}`)
    }
  }

  subscribeToDirectory () {
    this.subscriptions.add(this.directory.onDidAddEntries(addedEntries => {
      if (!this.isExpanded) return

      const numberOfEntries = this.entries.children.length

      for (let entry of addedEntries) {
        const view = this.createViewForEntry(entry)

        const insertionIndex = entry.indexInParentDirectory
        if (insertionIndex < numberOfEntries) {
          this.entries.insertBefore(view.element, this.entries.children[insertionIndex])
        } else {
          this.entries.appendChild(view.element)
        }
      }
    }))
  }

  getPath () {
    return this.directory.path
  }

  isPathEqual (pathToCompare) {
    return this.directory.isPathEqual(pathToCompare)
  }

  createViewForEntry (entry) {
    const view = entry instanceof Directory ? new DirectoryView(entry) : new FileView(entry)

    const subscription = this.directory.onDidRemoveEntries(removedEntries => {
      if (removedEntries.has(entry)) {
        view.element.remove()
        subscription.dispose()
      }
    })

    this.subscriptions.add(subscription)

    return view
  }

  reload () {
    if (this.isExpanded) {
      this.directory.reload()
    }
  }

  toggleExpansion (isRecursive) {
    if (isRecursive == null) {
      isRecursive = false
    }
    if (this.isExpanded) {
      this.collapse(isRecursive)
    } else {
      this.expand(isRecursive)
    }
  }

  expand (isRecursive) {
    if (isRecursive == null) {
      isRecursive = false
    }

    if (!this.isExpanded) {
      this.isExpanded = true
      this.element.isExpanded = this.isExpanded
      this.element.classList.add('expanded')
      this.element.classList.remove('collapsed')
      this.directory.expand()
    }

    if (isRecursive) {
      for (let entry of this.entries.children) {
        if (entry.classList.contains('directory')) {
          entry.expand(true)
        }
      }
    }
  }

  collapse (isRecursive) {
    if (isRecursive == null) isRecursive = false
    this.isExpanded = false
    this.element.isExpanded = false

    if (isRecursive) {
      for (let entry of this.entries.children) {
        if (entry.isExpanded) {
          entry.collapse(true)
        }
      }
    }

    this.element.classList.remove('expanded')
    this.element.classList.add('collapsed')
    this.directory.collapse()
    this.entries.innerHTML = ''
  }
}
