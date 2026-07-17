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
    this.switchListView = null;

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "git-switcher:switch": () => this.getSwitchListView().toggle(),
        "git-switcher:select-repository": () =>
          this.getRepositoryListView().toggle(this.repositoryStatusView?.getAnchorElement()),
        "git-switcher:select-branch": () =>
          this.getBranchListView().toggle(this.branchStatusView?.getAnchorElement()),
      }),
    );
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
    this.switchListView?.destroy();
    this.switchListView = null;
  },

  consumeStatusBar(statusBar) {
    const RepositoryStatusView = require("./repository-status-view");
    const BranchStatusView = require("./branch-status-view");

    this.repositoryStatusView = new RepositoryStatusView();
    this.branchStatusView = new BranchStatusView();
    this.repositoryStatusView.update();
    this.branchStatusView.update();

    // Higher priority sits further from the right edge: the repository tile
    // appears immediately left of the branch tile.
    this.repositoryTile = statusBar.addRightTile({
      item: this.repositoryStatusView.element,
      priority: 1,
    });
    this.branchTile = statusBar.addRightTile({
      item: this.branchStatusView.element,
      priority: 0,
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

  getSwitchListView() {
    if (!this.switchListView) {
      const SwitchListView = require("./switch-list-view");
      this.switchListView = new SwitchListView();
    }
    return this.switchListView;
  },
};
