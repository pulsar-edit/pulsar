path = require 'path'
fs = require 'fs-plus'
Dialog = require './dialog'
{repoForPath} = require './helpers'

module.exports =
class AddDialog extends Dialog
  constructor: (initialPath, isCreatingFile) ->
    @isCreatingFile = isCreatingFile

    if fs.isFileSync(initialPath)
      directoryPath = path.dirname(initialPath)
    else
      directoryPath = initialPath

    relativeDirectoryPath = directoryPath
    [@rootProjectPath, relativeDirectoryPath] = atom.project.relativizePath(directoryPath)
    relativeDirectoryPath += path.sep if relativeDirectoryPath.length > 0

    super
      prompt: "Enter the path for the new " + if isCreatingFile then "file." else "folder."
      initialPath: relativeDirectoryPath
      select: false
      iconClass: if isCreatingFile then 'icon-file-add' else 'icon-file-directory-create'

  onDidCreateFile: (callback) ->
    @emitter.on('did-create-file', callback)

  onDidCreateDirectory: (callback) ->
    @emitter.on('did-create-directory', callback)

  onConfirm: (newPath) ->
    newPath = newPath.replace(/\s+$/, '') # Remove trailing whitespace
    endsWithDirectorySeparator = newPath[newPath.length - 1] is path.sep
    unless path.isAbsolute(newPath)
      unless @rootProjectPath?
        @showError("You must open a directory to create a file with a relative path")
        return

      newPath = path.join(@rootProjectPath, newPath)

    return unless newPath

    try
      if fs.existsSync(newPath)
        @showError("'#{newPath}' already exists.")
      else if @isCreatingFile
        if endsWithDirectorySeparator
          @showError("File names must not end with a '#{path.sep}' character.")
        else
          fs.writeFileSync(newPath, '')
          repoForPath(newPath)?.getPathStatus(newPath)
          @emitter.emit('did-create-file', newPath)
          @close()
      else
        fs.makeTreeSync(newPath)
        @emitter.emit('did-create-directory', newPath)
        @cancel()
    catch error
      @showError("#{error.message}.")
