const fs = require('fs-plus')
const {CompositeDisposable, Emitter} = require('atom')
const {repoForPath} = require('./helpers')

module.exports =
class File {
  constructor ({name, fullPath, symlink, ignoredNames, useSyncFS, stats}) {
    this.name = name
    this.symlink = symlink
    this.ignoredNames = ignoredNames
    this.stats = stats
    this.destroyed = false
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable()

    this.path = fullPath
    this.realPath = this.path

    this.subscribeToRepo()
    this.updateStatus()

    if (useSyncFS) {
      this.realPath = fs.realpathSync(this.path)
    } else {
      fs.realpath(this.path, (error, realPath) => {
        // FIXME: Add actual error handling
        if (error || this.destroyed) return
        if (realPath && realPath !== this.path) {
          this.realPath = realPath
          this.updateStatus()
        }
      })
    }
  }

  destroy () {
    this.destroyed = true
    this.subscriptions.dispose()
    this.emitter.emit('did-destroy')
  }

  onDidDestroy (callback) {
    return this.emitter.on('did-destroy', callback)
  }

  onDidStatusChange (callback) {
    return this.emitter.on('did-status-change', callback)
  }

  // Subscribe to the project's repo for changes to the Git status of this file.
  subscribeToRepo () {
    const repo = repoForPath(this.path)
    if (repo == null) return

    this.subscriptions.add(repo.onDidChangeStatus(event => {
      if (this.isPathEqual(event.path)) {
        this.updateStatus(repo)
      }
    }))
    this.subscriptions.add(repo.onDidChangeStatuses(() => {
      this.updateStatus(repo)
    }))
  }

  // Update the status property of this directory using the repo.
  updateStatus () {
    const repo = repoForPath(this.path)
    if (repo == null) return

    let newStatus = null
    if (repo.isPathIgnored(this.path)) {
      newStatus = 'ignored'
    } else if (this.ignoredNames.matches(this.path)) {
      newStatus = 'ignored-name'
    } else {
      const status = repo.getCachedPathStatus(this.path)
      if (repo.isStatusModified(status)) {
        newStatus = 'modified'
      } else if (repo.isStatusNew(status)) {
        newStatus = 'added'
      }
    }

    if (newStatus !== this.status) {
      this.status = newStatus
      this.emitter.emit('did-status-change', newStatus)
    }
  }

  isPathEqual (pathToCompare) {
    return this.path === pathToCompare || this.realPath === pathToCompare
  }
}
