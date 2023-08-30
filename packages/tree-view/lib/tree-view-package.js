const {Disposable, CompositeDisposable} = require('atom')

const getIconServices = require('./get-icon-services')
const TreeView = require('./tree-view')

module.exports =
class TreeViewPackage {
  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.commands.add('atom-workspace', {
      'tree-view:show': () => this.getTreeViewInstance().show(),
      'tree-view:toggle': () => this.getTreeViewInstance().toggle(),
      'tree-view:toggle-focus': () => this.getTreeViewInstance().toggleFocus(),
      'tree-view:reveal-active-file': () => this.getTreeViewInstance().revealActiveFile({show: true}),
      'tree-view:add-file': () => this.getTreeViewInstance().add(true),
      'tree-view:add-folder': () => this.getTreeViewInstance().add(false),
      'tree-view:duplicate': () => this.getTreeViewInstance().copySelectedEntry(),
      'tree-view:remove': () => this.getTreeViewInstance().removeSelectedEntries(),
      'tree-view:rename': () => this.getTreeViewInstance().moveSelectedEntry(),
      'tree-view:show-current-file-in-file-manager': () => this.getTreeViewInstance().showCurrentFileInFileManager()
    }))

    const treeView = this.getTreeViewInstance()
    const showOnAttach = !atom.workspace.getActivePaneItem()
    this.treeViewOpenPromise = atom.workspace.open(treeView, {
      activatePane: showOnAttach,
      activateItem: showOnAttach
    })

    this.treeViewOpenPromise.then(() => {
      if (atom.config.get("tree-view.hiddenOnStartup")) {
        this.treeView.hide();
      } else {
        this.treeView.show();
      }
    })
  }

  async deactivate () {
    this.disposables.dispose()
    await this.treeViewOpenPromise // Wait for Tree View to finish opening before destroying it
    if (this.treeView) this.treeView.destroy()
    this.treeView = null
  }

  consumeElementIcons (service) {
    getIconServices().setElementIcons(service)
    return new Disposable(() => {
      getIconServices().resetElementIcons()
    })
  }

  consumeFileIcons (service) {
    getIconServices().setFileIcons(service)
    return new Disposable(() => {
      getIconServices().resetFileIcons()
    })
  }

  provideTreeView () {
    return {
      selectedPaths: () => this.getTreeViewInstance().selectedPaths(),
      entryForPath: (entryPath) => this.getTreeViewInstance().entryForPath(entryPath)
    }
  }

  getTreeViewInstance (state = {}) {
    if (this.treeView == null) {
      this.treeView = new TreeView(state)
      this.treeView.onDidDestroy(() => { this.treeView = null })
    }
    return this.treeView
  }
}
