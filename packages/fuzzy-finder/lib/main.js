const {CompositeDisposable, Disposable} = require('atom')
const getIconServices = require('./get-icon-services')
const ReporterProxy = require('./reporter-proxy')

const metricsReporter = new ReporterProxy()

module.exports = {
  activate (state) {
    this.active = true

    this.disposables = new CompositeDisposable()

    this.disposables.add(atom.commands.add('atom-workspace', {
      'fuzzy-finder:toggle-file-finder': () => {
        this.createProjectView().toggle()
      },
      'fuzzy-finder:toggle-buffer-finder': () => {
        this.createBufferView().toggle()
      },
      'fuzzy-finder:toggle-git-status-finder': () => {
        this.createGitStatusView().toggle()
      }
    }))

    process.nextTick(() => this.startLoadPathsTask())

    for (let editor of atom.workspace.getTextEditors()) {
      editor.lastOpened = state[editor.getPath()]
    }

    this.disposables.add(atom.workspace.observePanes(pane => {
      this.disposables.add(pane.observeActiveItem(item => {
        if (item != null) item.lastOpened = Date.now()
      }))
    }))
  },

  deactivate () {
    this.disposables.dispose()

    if (this.projectView != null) {
      this.projectView.destroy()
      this.projectView = null
    }
    if (this.bufferView != null) {
      this.bufferView.destroy()
      this.bufferView = null
    }
    if (this.gitStatusView != null) {
      this.gitStatusView.destroy()
      this.gitStatusView = null
    }
    this.projectPaths = null
    this.stopLoadPathsTask()
    this.active = false
  },

  consumeElementIcons (service) {
    getIconServices().setElementIcons(service)
    return new Disposable(() => getIconServices().resetElementIcons())
  },

  consumeFileIcons (service) {
    getIconServices().setFileIcons(service)
    return new Disposable(() => getIconServices().resetFileIcons())
  },

  consumeTeletype (teletypeService) {
    this.teletypeService = teletypeService
    if (this.bufferView) this.bufferView.setTeletypeService(teletypeService)
    if (this.projectView) this.projectView.setTeletypeService(teletypeService)
  },

  consumeMetricsReporter (metricsReporterService) {
    metricsReporter.setReporter(metricsReporterService)

    return new Disposable(() => metricsReporter.unsetReporter())
  },

  serialize () {
    const paths = {}
    for (let editor of atom.workspace.getTextEditors()) {
      const path = editor.getPath()
      if (path != null) { paths[path] = editor.lastOpened }
    }
    return paths
  },

  createProjectView () {
    this.stopLoadPathsTask()

    if (this.projectView == null) {
      const ProjectView = require('./project-view')
      this.projectView = new ProjectView(this.projectPaths, metricsReporter)
      this.projectPaths = null
      if (this.teletypeService) {
        this.projectView.setTeletypeService(this.teletypeService)
      }
    }
    return this.projectView
  },

  createGitStatusView () {
    if (this.gitStatusView == null) {
      const GitStatusView = require('./git-status-view')
      this.gitStatusView = new GitStatusView(metricsReporter)
    }
    return this.gitStatusView
  },

  createBufferView () {
    if (this.bufferView == null) {
      const BufferView = require('./buffer-view')
      this.bufferView = new BufferView(metricsReporter)
      if (this.teletypeService) {
        this.bufferView.setTeletypeService(this.teletypeService)
      }
    }
    return this.bufferView
  },

  startLoadPathsTask () {
    this.stopLoadPathsTask()

    if (!this.active) return
    if (atom.project.getPaths().length === 0) return

    const PathLoader = require('./path-loader')
    this.loadPathsTask = PathLoader.startTask((projectPaths) => {
      this.projectPaths = projectPaths
    }, metricsReporter)
    this.projectPathsSubscription = atom.project.onDidChangePaths(() => {
      this.projectPaths = null
      this.stopLoadPathsTask()
    })
  },

  stopLoadPathsTask () {
    if (this.projectPathsSubscription != null) {
      this.projectPathsSubscription.dispose()
    }
    this.projectPathsSubscription = null

    if (this.loadPathsTask != null) {
      this.loadPathsTask.terminate()
    }
    this.loadPathsTask = null
  }
}
