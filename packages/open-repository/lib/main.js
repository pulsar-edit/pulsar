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

// Resolving a RepositoryFile now loads its git data off the renderer thread, so
// the command handlers capture any selection range synchronously first, then act
// on the resolved file. A resolution failure surfaces as a warning instead of an
// unhandled rejection.
function runOnRepositoryFile(itemPath, action) {
  RepositoryFile.fromPath(itemPath).then(action, (error) => {
    atom.notifications.addWarning("Unable to resolve the repository for this file", {
      detail: error.message,
      dismissable: true,
    });
  });
}

module.exports = {
  activate() {
    this.commandsSubscription = new Disposable();
    this.commandsSubscription = atom.commands.add("atom-pane", {
      "open-repository:file": pathCommand((itemPath) => {
        const range = getSelectedRange();
        runOnRepositoryFile(itemPath, (file) => file.open(range));
      }),

      "open-repository:file-on-master": pathCommand((itemPath) => {
        const range = getSelectedRange();
        runOnRepositoryFile(itemPath, (file) => file.openOnMaster(range));
      }),

      "open-repository:blame": pathCommand((itemPath) => {
        const range = getSelectedRange();
        runOnRepositoryFile(itemPath, (file) => file.blame(range));
      }),

      "open-repository:history": pathCommand((itemPath) => {
        runOnRepositoryFile(itemPath, (file) => file.history());
      }),

      "open-repository:issues": pathCommand((itemPath) => {
        runOnRepositoryFile(itemPath, (file) => file.openIssues());
      }),

      "open-repository:pull-requests": pathCommand((itemPath) => {
        runOnRepositoryFile(itemPath, (file) => file.openPullRequests());
      }),

      "open-repository:copy-url": pathCommand((itemPath) => {
        const range = getSelectedRange();
        runOnRepositoryFile(itemPath, (file) => file.copyURL(range));
      }),

      "open-repository:branch-compare": pathCommand((itemPath) => {
        runOnRepositoryFile(itemPath, (file) => file.openBranchCompare());
      }),

      "open-repository:repository": pathCommand((itemPath) => {
        runOnRepositoryFile(itemPath, (file) => file.openRepository());
      }),
    });
  },

  deactivate() {
    this.commandsSubscription.dispose();
  },
};
