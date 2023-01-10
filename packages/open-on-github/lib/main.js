const {Disposable} = require('atom')
const GitHubFile = require('./github-file')
const getActivePath = require('./get-active-path')

function pathCommand (func) {
  return function (e) {
    const itemPath = getActivePath(e.target)

    if (itemPath) {
      func(itemPath)
    }
  }
}

function getSelectedRange () {
  const activePaneItem = atom.workspace.getActivePaneItem()

  if (activePaneItem && typeof activePaneItem.getSelectedBufferRange === 'function') {
    return activePaneItem.getSelectedBufferRange()
  }
}

module.exports = {
  activate () {
    this.commandsSubscription = new Disposable()
    this.commandsSubscription = atom.commands.add('atom-pane', {
      'open-on-github:file': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).open(getSelectedRange())
      }),

      'open-on-github:file-on-master': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openOnMaster(getSelectedRange())
      }),

      'open-on-github:blame': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).blame(getSelectedRange())
      }),

      'open-on-github:history': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).history()
      }),

      'open-on-github:issues': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openIssues()
      }),

      'open-on-github:pull-requests': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openPullRequests()
      }),

      'open-on-github:copy-url': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).copyURL(getSelectedRange())
      }),

      'open-on-github:branch-compare': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openBranchCompare()
      }),

      'open-on-github:repository': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openRepository()
      })
    })
  },

  deactivate () {
    this.commandsSubscription.dispose()
  }
}
