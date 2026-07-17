const { CompositeDisposable } = require("atom");

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable();
    this.repositoryStatusView = null;
    this.branchStatusView = null;
    this.repositoryTile = null;
    this.branchTile = null;
    this.repositoryListView = null;
    this.branchListView = null;

    // Commands and tile clicks open the same modal pickers. Toggling the lock
    // pins the active repository so it stops following the active pane item,
    // which is the switching workflow git-panel's removed header used to offer.
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "git-switcher:select-repository": () => this.getRepositoryListView().toggle(),
        "git-switcher:select-branch": () => this.getBranchListView().toggle(),
        "git-switcher:toggle-lock": () => this.toggleActiveRepositoryLock(),
      }),
    );
  },

  toggleActiveRepositoryLock() {
    const active = atom.repositories.getActiveRepository();
    if (!active) {
      return;
    }
    try {
      atom.repositories.setActiveRepository(active, {
        pin: !atom.repositories.isActiveRepositoryPinned(),
      });
    } catch {
      // The repository was destroyed while toggling.
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.repositoryTile?.destroy();
    this.repositoryTile = null;
    this.branchTile?.destroy();
    this.branchTile = null;
    this.repositoryStatusView?.destroy();
    this.repositoryStatusView = null;
    this.branchStatusView?.destroy();
    this.branchStatusView = null;
    this.repositoryListView?.destroy();
    this.repositoryListView = null;
    this.branchListView?.destroy();
    this.branchListView = null;
  },

  consumeStatusBar(statusBar) {
    const RepositoryStatusView = require("./repository-status-view");
    const BranchStatusView = require("./branch-status-view");

    this.repositoryStatusView = new RepositoryStatusView({
      onDidClick: () => this.getRepositoryListView().toggle(),
    });
    this.branchStatusView = new BranchStatusView({
      onDidClick: () => this.getBranchListView().toggle(),
    });
    this.repositoryStatusView.update();
    this.branchStatusView.update();

    // Lower priorities sit closer to the left edge. File info uses priority 0,
    // so place the repository immediately before it and the branch after it.
    this.repositoryTile = statusBar.addLeftTile({
      item: this.repositoryStatusView.element,
      priority: 10,
    });
    this.branchTile = statusBar.addLeftTile({
      item: this.branchStatusView.element,
      priority: 20,
    });
  },

  getRepositoryListView() {
    if (!this.repositoryListView) {
      const RepositoryListView = require("./repository-list-view");
      this.repositoryListView = new RepositoryListView();
    }
    return this.repositoryListView;
  },

  getBranchListView() {
    if (!this.branchListView) {
      const BranchListView = require("./branch-list-view");
      this.branchListView = new BranchListView();
    }
    return this.branchListView;
  },
};
