{Disposable} = require 'atom'
url = require 'url'
fs = require 'fs-plus'

module.exports =
class FileInfoView
  constructor: ->
    @element = document.createElement('status-bar-file')
    @element.classList.add('file-info', 'inline-block')

    @currentPath = document.createElement('a')
    @currentPath.classList.add('current-path')
    @element.appendChild(@currentPath)
    @element.currentPath = @currentPath

    @element.getActiveItem = @getActiveItem.bind(this)

    @activeItemSubscription = atom.workspace.getCenter().onDidChangeActivePaneItem =>
      @subscribeToActiveItem()
    @subscribeToActiveItem()

    @registerTooltip()
    clickHandler = (event) =>
      isShiftClick = event.shiftKey
      @showCopiedTooltip(isShiftClick)
      text = @getActiveItemCopyText(isShiftClick)
      atom.clipboard.write(text)
      setTimeout =>
        @clearCopiedTooltip()
      , 2000

    @element.addEventListener('click', clickHandler)
    @clickSubscription = new Disposable => @element.removeEventListener('click', clickHandler)

  registerTooltip: ->
    @tooltip = atom.tooltips.add(@element, title: ->
      "Click to copy absolute file path (Shift + Click to copy relative path)")

  clearCopiedTooltip: ->
    @copiedTooltip?.dispose()
    @registerTooltip()

  showCopiedTooltip: (copyRelativePath) ->
    @tooltip?.dispose()
    @copiedTooltip?.dispose()
    text = @getActiveItemCopyText(copyRelativePath)
    @copiedTooltip = atom.tooltips.add @element,
      title: "Copied: #{text}"
      trigger: 'manual'
      delay:
        show: 0

  getActiveItemCopyText: (copyRelativePath) ->
    activeItem = @getActiveItem()
    path = activeItem?.getPath?()
    return activeItem?.getTitle?() or '' if not path?

    # Make sure we try to relativize before parsing URLs.
    if copyRelativePath
      relativized = atom.project.relativize(path)
      if relativized isnt path
        return relativized

    # An item path could be a url, we only want to copy the `path` part
    if path?.indexOf('://') > 0
      path = url.parse(path).path
    path

  subscribeToActiveItem: ->
    @modifiedSubscription?.dispose()
    @titleSubscription?.dispose()

    if activeItem = @getActiveItem()
      @updateCallback ?= => @update()

      if typeof activeItem.onDidChangeTitle is 'function'
        @titleSubscription = activeItem.onDidChangeTitle(@updateCallback)
      else if typeof activeItem.on is 'function'
        #TODO Remove once title-changed event support is removed
        activeItem.on('title-changed', @updateCallback)
        @titleSubscription = dispose: =>
          activeItem.off?('title-changed', @updateCallback)

      @modifiedSubscription = activeItem.onDidChangeModified?(@updateCallback)

    @update()

  destroy: ->
    @activeItemSubscription.dispose()
    @titleSubscription?.dispose()
    @modifiedSubscription?.dispose()
    @clickSubscription?.dispose()
    @copiedTooltip?.dispose()
    @tooltip?.dispose()

  getActiveItem: ->
    atom.workspace.getCenter().getActivePaneItem()

  update: ->
    @updatePathText()
    @updateBufferHasModifiedText(@getActiveItem()?.isModified?())

  updateBufferHasModifiedText: (isModified) ->
    if isModified
      @element.classList.add('buffer-modified')
      @isModified = true
    else
      @element.classList.remove('buffer-modified')
      @isModified = false

  updatePathText: ->
    if path = @getActiveItem()?.getPath?()
      relativized = atom.project.relativize(path)
      @currentPath.textContent = if relativized? then fs.tildify(relativized) else path
    else if title = @getActiveItem()?.getTitle?()
      @currentPath.textContent = title
    else
      @currentPath.textContent = ''
