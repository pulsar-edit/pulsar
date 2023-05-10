path = require 'path'
fs = require 'fs-plus'
Dialog = require './dialog'
{repoForPath} = require "./helpers"

module.exports =
class CopyDialog extends Dialog
  constructor: (@initialPath, {@onCopy}) ->
    super
      prompt: 'Enter the new path for the duplicate.'
      initialPath: atom.project.relativize(@initialPath)
      select: true
      iconClass: 'icon-arrow-right'

  onConfirm: (newPath) ->
    newPath = newPath.replace(/\s+$/, '') # Remove trailing whitespace
    unless path.isAbsolute(newPath)
      [rootPath] = atom.project.relativizePath(@initialPath)
      newPath = path.join(rootPath, newPath)
      return unless newPath

    if @initialPath is newPath
      @close()
      return

    if fs.existsSync(newPath)
      @showError("'#{newPath}' already exists.")
      return

    activeEditor = atom.workspace.getActiveTextEditor()
    activeEditor = null unless activeEditor?.getPath() is @initialPath
    try
      if fs.isDirectorySync(@initialPath)
        fs.copySync(@initialPath, newPath)
        @onCopy?({initialPath: @initialPath, newPath: newPath})
      else
        fs.copy @initialPath, newPath, =>
          @onCopy?({initialPath: @initialPath, newPath: newPath})
          atom.workspace.open newPath,
            activatePane: true
            initialLine: activeEditor?.getLastCursor().getBufferRow()
            initialColumn: activeEditor?.getLastCursor().getBufferColumn()
      if repo = repoForPath(newPath)
        repo.getPathStatus(@initialPath)
        repo.getPathStatus(newPath)
      @close()
    catch error
      @showError("#{error.message}.")
