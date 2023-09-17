const {Disposable, CompositeDisposable} = require('atom')
const humanize = require('humanize-plus')

const FuzzyFinderView = require('./fuzzy-finder-view')
const PathLoader = require('./path-loader')

module.exports =
class ProjectView extends FuzzyFinderView {
  constructor (paths, metricsReporter) {
    super(metricsReporter)
    this.disposables = new CompositeDisposable()
    this.paths = paths
    this.reloadPaths = !this.paths || this.paths.length === 0
    this.reloadAfterFirstLoad = false

    const windowFocused = () => {
      if (this.paths) {
        this.reloadPaths = true
      } else {
        // The window gained focused while the first task was still running
        // so let it complete but reload the paths on the next populate call.
        this.reloadAfterFirstLoad = true
      }
    }
    window.addEventListener('focus', windowFocused)
    this.disposables.add(new Disposable(() => { window.removeEventListener('focus', windowFocused) }))

    this.disposables.add(atom.config.onDidChange('fuzzy-finder.ignoredNames', () => { this.reloadPaths = true }))
    this.disposables.add(atom.config.onDidChange('core.followSymlinks', () => { this.reloadPaths = true }))
    this.disposables.add(atom.config.onDidChange('core.ignoredNames', () => { this.reloadPaths = true }))
    this.disposables.add(atom.config.onDidChange('core.excludeVcsIgnoredPaths', () => { this.reloadPaths = true }))
    this.disposables.add(atom.project.onDidChangePaths(() => {
      this.reloadPaths = true
      this.paths = null
    }))

    if (!this.reloadPaths) {
      this.populate()
    }
  }

  destroy () {
    if (this.loadPathsTask) {
      this.loadPathsTask.terminate()
    }

    this.disposables.dispose()
    return super.destroy()
  }

  setTeletypeService (teletypeService) {
    this.teletypeService = teletypeService
  }

  async toggle () {
    if (this.panel && this.panel.isVisible()) {
      this.cancel()
    } else {
      this.show()
      await this.reloadPathsIfNeeded()
    }
  }

  async populate () {
    const remoteEditors = (this.teletypeService && await this.teletypeService.getRemoteEditors()) || []

    const remoteItems = remoteEditors.map((remoteEditor) => {
      return {
        uri: remoteEditor.uri,
        filePath: remoteEditor.path,
        label: `@${remoteEditor.hostGitHubUsername}: ${remoteEditor.path}`,
        ownerGitHubUsername: remoteEditor.hostGitHubUsername
      }
    })

    const localItems = this.projectRelativePathsForFilePaths(this.paths || [])
    await this.setItems(remoteItems.concat(localItems))
  }

  async reloadPathsIfNeeded () {
    if (this.reloadPaths) {
      this.reloadPaths = false
      let task = null

      if (atom.project.getPaths().length === 0) {
        return this.populate()
      }

      try {
        task = this.runLoadPathsTask(() => {
          if (this.reloadAfterFirstLoad) {
            this.reloadPaths = true
            this.reloadAfterFirstLoad = false
          }

          this.populate()
        })
      } catch (error) {
        // If, for example, a network drive is unmounted, @runLoadPathsTask will
        // throw ENOENT when it tries to get the realpath of all the project paths.
        // This catch block allows the file finder to still operate on the last
        // set of paths and still let the user know that something is wrong.
        if (error.code === 'ENOENT' || error.code === 'EPERM') {
          atom.notifications.addError('Project path not found!', {detail: error.message})
        } else {
          throw error
        }
      }

      if (this.paths) {
        await this.selectListView.update({loadingMessage: 'Reindexing project\u2026', infoMessage: null})
      } else {
        await this.selectListView.update({loadingMessage: 'Indexing project\u2026', infoMessage: null, loadingBadge: '0'})
        if (task) {
          let pathsFound = 0
          task.on('load-paths:paths-found', (paths) => {
            pathsFound += paths.length
            this.selectListView.update({loadingMessage: 'Indexing project\u2026', infoMessage: null, loadingBadge: humanize.intComma(pathsFound)})
          })
        }
      }
    }
  }

  getEmptyMessage () {
    return 'Project is empty'
  }

  projectRelativePathsForFilePaths (filePaths) {
    const projectRelativePaths = super.projectRelativePathsForFilePaths(filePaths)
    const lastOpenedPath = this.getLastOpenedPath()
    if (lastOpenedPath) {
      for (let i = 0; i < projectRelativePaths.length; i++) {
        const {filePath} = projectRelativePaths[i]
        if (filePath === lastOpenedPath) {
          const [entry] = projectRelativePaths.splice(i, 1)
          projectRelativePaths.unshift(entry)
          break
        }
      }
    }

    return projectRelativePaths
  }

  getLastOpenedPath () {
    let activePath = null
    const activePaneItem = atom.workspace.getActivePaneItem()
    if (activePaneItem && activePaneItem.getPath) {
      activePath = activePaneItem.getPath()
    }

    let lastOpenedEditor = null
    for (const editor of atom.workspace.getTextEditors()) {
      const filePath = editor.getPath()
      if (!filePath) {
        continue
      }

      if (activePath === filePath) {
        continue
      }

      if (!lastOpenedEditor) {
        lastOpenedEditor = editor
      }

      if (editor.lastOpened > lastOpenedEditor.lastOpened) {
        lastOpenedEditor = editor
      }
    }

    return lastOpenedEditor ? lastOpenedEditor.getPath() : null
  }

  runLoadPathsTask (fn) {
    if (this.loadPathsTask) {
      this.loadPathsTask.terminate()
    }

    this.loadPathsTask = PathLoader.startTask((paths) => {
      this.paths = paths
      this.reloadPaths = false
      if (fn) {
        fn()
      }
    }, this.metricsReporter)

    return this.loadPathsTask
  }
}
