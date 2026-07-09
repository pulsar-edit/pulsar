const { Disposable, CompositeDisposable } = require("atom");

const getIconServices = require("./get-icon-services");
const TreeView = require("./tree-view");

module.exports = class TreeViewPackage {
  activate() {
    this.disposables = new CompositeDisposable();
    this.specialRootConfigs = [];
    this.disposables.add(
      atom.commands.add("atom-workspace", {
        "tree-view:show": () => this.getTreeViewInstance().show(),
        "tree-view:toggle": () => this.getTreeViewInstance().toggle(),
        "tree-view:toggle-focus": () => this.getTreeViewInstance().toggleFocus(),
        "tree-view:reveal-active-file": () =>
          this.getTreeViewInstance().revealActiveFile({ show: true }),
        "tree-view:add-file": () => this.getTreeViewInstance().add(true),
        "tree-view:add-folder": () => this.getTreeViewInstance().add(false),
        "tree-view:duplicate": () => this.getTreeViewInstance().copySelectedEntry(),
        "tree-view:remove": () => this.getTreeViewInstance().removeSelectedEntries(),
        "tree-view:rename": () => this.getTreeViewInstance().moveSelectedEntry(),
        "tree-view:show-current-file-in-file-manager": () =>
          this.getTreeViewInstance().showCurrentFileInFileManager(),
      }),
    );

    this.getTreeViewInstance();

    const openByDefault = async () => {
      const showOnAttach = !atom.workspace.getActivePaneItem();
      const item = await atom.workspace.openDefaultItem(this.treeView, {
        searchAllPanes: true,
        activatePane: showOnAttach,
        activateItem: showOnAttach,
      });
      if (item) {
        this.treeView.show(false);
      }
    };

    if (atom.packages.hasActivatedInitialPackages()) {
      this.treeViewOpenPromise = openByDefault();
    } else {
      this.treeViewOpenPromise = new Promise((resolve) => {
        this.disposables.add(
          atom.packages.onDidActivateInitialPackages(async () => {
            await openByDefault();
            resolve();
          }),
        );
      });
    }
  }

  async deactivate() {
    this.disposables.dispose();
    await this.treeViewOpenPromise; // Wait for Tree View to finish opening before destroying it
    if (this.treeView) this.treeView.destroy();
    this.treeView = null;
  }

  consumeElementIcons(service) {
    getIconServices().setElementIcons(service);
    return new Disposable(() => {
      getIconServices().resetElementIcons();
    });
  }

  consumeFileIcons(service) {
    getIconServices().setFileIcons(service);
    return new Disposable(() => {
      getIconServices().resetFileIcons();
    });
  }

  consumeOpenExternal(service) {
    this.openExternalService = service;
    if (this.treeView) this.treeView.openExternalService = service;
    return new Disposable(() => {
      this.openExternalService = null;
      if (this.treeView) this.treeView.openExternalService = null;
    });
  }

  consumeProjectList(projectList) {
    this.projectList = projectList;
    if (this.treeView) {
      this.treeView.projectList = projectList;
      if (this.treeView.addProjectsView) this.treeView.addProjectsView.setProjectList(projectList);
    }
    return new Disposable(() => {
      this.projectList = null;
      if (this.treeView) {
        this.treeView.projectList = null;
        if (this.treeView.addProjectsView) this.treeView.addProjectsView.setProjectList(null);
      }
    });
  }

  consumeRecentList(recentList) {
    this.recentList = recentList;
    if (this.treeView) {
      this.treeView.recentList = recentList;
      if (this.treeView.addProjectsView) this.treeView.addProjectsView.setRecentList(recentList);
    }
    return new Disposable(() => {
      this.recentList = null;
      if (this.treeView) {
        this.treeView.recentList = null;
        if (this.treeView.addProjectsView) this.treeView.addProjectsView.setRecentList(null);
      }
    });
  }

  provideTreeView() {
    return {
      selectedPaths: () => this.getTreeViewInstance().selectedPaths(),
      entryForPath: (entryPath) => this.getTreeViewInstance().entryForPath(entryPath),
    };
  }

  provideTreeViewPlus() {
    return {
      selectedPaths: () => this.getTreeViewInstance().selectedPaths(),
      entryForPath: (entryPath) => this.getTreeViewInstance().entryForPath(entryPath),
      revealPath: (filePath, options) => this.getTreeViewInstance().revealPath(filePath, options),
    };
  }

  provideRoots() {
    return {
      registerRoot: (config) => {
        const entry = { config, section: null };
        this.specialRootConfigs.push(entry);
        if (this.treeView) {
          entry.section = this.treeView.addSpecialRoot(config);
        }
        const handle = {
          get element() {
            return entry.section?.element ?? null;
          },
          update: () => entry.section?.refresh(),
          toggle: () => entry.section?.toggleVisible(),
          dispose: () => {
            const idx = this.specialRootConfigs.indexOf(entry);
            if (idx !== -1) this.specialRootConfigs.splice(idx, 1);
            if (entry.section && this.treeView) {
              this.treeView.removeSpecialRoot(entry.section);
            }
            entry.section = null;
          },
        };
        return handle;
      },
    };
  }

  reattachSpecialRoots() {
    if (!this.specialRootConfigs) return;
    for (const entry of this.specialRootConfigs) {
      entry.section = this.treeView.addSpecialRoot(entry.config);
    }
  }

  getTreeViewInstance(state = {}) {
    if (this.treeView == null) {
      this.treeView = new TreeView(state);
      this.treeView.onDidDestroy(() => {
        this.treeView = null;
      });
      if (this.openExternalService) this.treeView.openExternalService = this.openExternalService;
      if (this.projectList) {
        this.treeView.projectList = this.projectList;
        if (this.treeView.addProjectsView)
          this.treeView.addProjectsView.setProjectList(this.projectList);
      }
      if (this.recentList) {
        this.treeView.recentList = this.recentList;
        if (this.treeView.addProjectsView)
          this.treeView.addProjectsView.setRecentList(this.recentList);
      }
      this.reattachSpecialRoots();
    }
    return this.treeView;
  }
};
