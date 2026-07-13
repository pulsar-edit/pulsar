const { Disposable } = require("atom");
const RepositoryFile = require("./repository-file");
const getActivePath = require("./get-active-path");

function pathCommand(func) {
  return function (e) {
    const itemPath = getActivePath(e.target);

    if (itemPath) {
      func(itemPath);
    }
  };
}

function getSelectedRange() {
  const activePaneItem = atom.workspace.getActivePaneItem();

  if (activePaneItem && typeof activePaneItem.getSelectedBufferRange === "function") {
    return activePaneItem.getSelectedBufferRange();
  }
}

module.exports = {
  activate() {
    this.commandsSubscription = new Disposable();
    this.commandsSubscription = atom.commands.add("atom-pane", {
      "open-repository:file": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).open(getSelectedRange());
      }),

      "open-repository:file-on-master": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).openOnMaster(getSelectedRange());
      }),

      "open-repository:blame": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).blame(getSelectedRange());
      }),

      "open-repository:history": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).history();
      }),

      "open-repository:issues": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).openIssues();
      }),

      "open-repository:pull-requests": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).openPullRequests();
      }),

      "open-repository:copy-url": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).copyURL(getSelectedRange());
      }),

      "open-repository:branch-compare": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).openBranchCompare();
      }),

      "open-repository:repository": pathCommand((itemPath) => {
        RepositoryFile.fromPath(itemPath).openRepository();
      }),
    });
  },

  deactivate() {
    this.commandsSubscription.dispose();
  },
};
