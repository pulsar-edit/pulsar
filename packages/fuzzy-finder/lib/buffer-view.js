const FuzzyFinderView = require('./fuzzy-finder-view')
const path = require('path')

module.exports =
class BufferView extends FuzzyFinderView {
  setTeletypeService (teletypeService) {
    this.teletypeService = teletypeService
  }

  getEmptyMessage () {
    return 'No open editors'
  }

  async toggle () {
    if (this.panel && this.panel.isVisible()) {
      this.cancel()
    } else {
      const items = this.sortItems(await this.buildItems())
      if (items.length > 0) {
        this.show()
        await this.setItems(items)
      }
    }
  }

  async buildItems () {
    const itemsByURI = new Map()

    const remoteEditorsByURI = await this.getRemoteEditorsByURI()
    const projectHasMultipleDirectories = atom.project.getDirectories().length > 1
    const localEditors = atom.workspace.getTextEditors()
    for (let i = 0; i < localEditors.length; i++) {
      const localEditor = localEditors[i]
      const localEditorURI = localEditor.getURI()
      const localEditorPath = localEditor.getPath()
      if (!localEditorURI) continue
      if (itemsByURI.has(localEditorURI)) continue

      const item = {uri: localEditorURI}

      const remoteEditor = remoteEditorsByURI.get(localEditorURI)
      if (remoteEditor) {
        item.filePath = remoteEditor.path
        item.label = `@${remoteEditor.hostGitHubUsername}: ${remoteEditor.path}`
        item.ownerGitHubUsername = remoteEditor.hostGitHubUsername
      } else {
        const [projectRootPath, projectRelativePath] = atom.project.relativizePath(localEditorPath)
        item.filePath = localEditorPath
        item.label =
          projectRootPath && projectHasMultipleDirectories
            ? path.join(path.basename(projectRootPath), projectRelativePath)
            : projectRelativePath
      }

      if (localEditor.lastOpened != null) {
        item.lastOpened = localEditor.lastOpened
      }

      itemsByURI.set(localEditorURI, item)
    }

    return Array.from(itemsByURI.values())
  }

  sortItems (items) {
    const activeEditor = atom.workspace.getActiveTextEditor()
    const activeEditorURI = activeEditor ? activeEditor.getURI() : null
    items.sort((a, b) => {
      if (a.uri === activeEditorURI) {
        return 1
      } else if (b.uri === activeEditorURI) {
        return -1
      } else {
        return (b.lastOpened || 1) - (a.lastOpened || 1)
      }
    })
    return items
  }

  async getRemoteEditorsByURI () {
    const remoteEditorsByURI = new Map()
    const remoteEditors = this.teletypeService ? await this.teletypeService.getRemoteEditors() : []
    for (var i = 0; i < remoteEditors.length; i++) {
      const remoteEditor = remoteEditors[i]
      remoteEditorsByURI.set(remoteEditor.uri, remoteEditor)
    }
    return remoteEditorsByURI
  }
}
