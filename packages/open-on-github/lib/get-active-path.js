function getActivePath (target) {
  if (!target) {
    return atom.project.getPaths()[0]
  }

  const treeView = target.closest('.tree-view')
  if (treeView) {
    // called from treeview
    const selected = treeView.querySelector('.selected > .list-item > .name, .selected > .name')
    if (selected) {
      return selected.dataset.path
    }
    return
  }

  const tab = target.closest('.tab-bar > .tab')
  if (tab) {
    // called from tab
    const title = tab.querySelector('.title')
    if (title && title.dataset.path) {
      return title.dataset.path
    }
    return
  }

  const paneItem = atom.workspace.getActivePaneItem()
  if (paneItem && typeof paneItem.getPath === 'function') {
    // called from active pane
    return paneItem.getPath()
  }

  const textEditor = atom.workspace.getActiveTextEditor()
  if (textEditor && typeof textEditor.getPath === 'function') {
    // fallback to activeTextEditor if activePaneItem is not a file
    return textEditor.getPath()
  }

  const projects = atom.project.getPaths()
  if (projects.length === 1) {
    // use project is nothing is open
    return projects[0]
  }
}

module.exports = getActivePath
