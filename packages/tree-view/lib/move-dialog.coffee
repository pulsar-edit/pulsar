path = require 'path'
fs = require 'fs-plus'
Dialog = require './dialog'
{repoForPath} = require "./helpers"

module.exports =
class MoveDialog extends Dialog
  constructor: (@initialPath, {@willMove, @onMove, @onMoveFailed}) ->
    if fs.isDirectorySync(@initialPath)
      prompt = 'Enter the new path for the directory.'
    else
      prompt = 'Enter the new path for the file.'

    super
      prompt: prompt
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

    unless @isNewPathValid(newPath)
      @showError("'#{newPath}' already exists.")
      return

    directoryPath = path.dirname(newPath)
    try
      @willMove?(initialPath: @initialPath, newPath: newPath)
      fs.makeTreeSync(directoryPath) unless fs.existsSync(directoryPath)
      fs.moveSync(@initialPath, newPath)
      @onMove?(initialPath: @initialPath, newPath: newPath)
      if repo = repoForPath(newPath)
        repo.getPathStatus(@initialPath)
        repo.getPathStatus(newPath)
      @close()
    catch error
      @showError("#{error.message}.")
      @onMoveFailed?(initialPath: @initialPath, newPath: newPath)

  isNewPathValid: (newPath) ->
    try
      oldStat = fs.statSync(@initialPath)
      newStat = fs.statSync(newPath)

      # New path exists so check if it points to the same file as the initial
      # path to see if the case of the file name is being changed on a on a
      # case insensitive filesystem.
      @initialPath.toLowerCase() is newPath.toLowerCase() and
        oldStat.dev is newStat.dev and
        oldStat.ino is newStat.ino
    catch
      true # new path does not exist so it is valid
