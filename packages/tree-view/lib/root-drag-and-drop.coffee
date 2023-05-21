url = require 'url'

{ipcRenderer, remote} = require 'electron'

# TODO: Support dragging external folders and using the drag-and-drop indicators for them
# Currently they're handled in TreeView's drag listeners

module.exports =
class RootDragAndDropHandler
  constructor: (@treeView) ->
    ipcRenderer.on('tree-view:project-folder-dropped', @onDropOnOtherWindow)
    @handleEvents()

  dispose: ->
    ipcRenderer.removeListener('tree-view:project-folder-dropped', @onDropOnOtherWindow)

  handleEvents: ->
    # onDragStart is called directly by TreeView's onDragStart
    # will be cleaned up by tree view, since they are tree-view's handlers
    @treeView.element.addEventListener 'dragenter', @onDragEnter.bind(this)
    @treeView.element.addEventListener 'dragend', @onDragEnd.bind(this)
    @treeView.element.addEventListener 'dragleave', @onDragLeave.bind(this)
    @treeView.element.addEventListener 'dragover', @onDragOver.bind(this)
    @treeView.element.addEventListener 'drop', @onDrop.bind(this)

  onDragStart: (e) =>
    return unless @treeView.list.contains(e.target)

    @prevDropTargetIndex = null
    e.dataTransfer.setData 'atom-tree-view-root-event', 'true'
    projectRoot = e.target.closest('.project-root')
    directory = projectRoot.directory

    e.dataTransfer.setData 'project-root-index', Array.from(projectRoot.parentElement.children).indexOf(projectRoot)

    rootIndex = -1
    (rootIndex = index; break) for root, index in @treeView.roots when root.directory is directory

    e.dataTransfer.setData 'from-root-index', rootIndex
    e.dataTransfer.setData 'from-root-path', directory.path
    e.dataTransfer.setData 'from-window-id', @getWindowId()

    e.dataTransfer.setData 'text/plain', directory.path

    if process.platform in ['darwin', 'linux']
      pathUri = "file://#{directory.path}" unless @uriHasProtocol(directory.path)
      e.dataTransfer.setData 'text/uri-list', pathUri

  uriHasProtocol: (uri) ->
    try
      url.parse(uri).protocol?
    catch error
      false

  onDragEnter: (e) ->
    return unless @treeView.list.contains(e.target)
    return unless @isAtomTreeViewEvent(e)

    e.stopPropagation()

  onDragLeave: (e) =>
    return unless @treeView.list.contains(e.target)
    return unless @isAtomTreeViewEvent(e)

    e.stopPropagation()
    @removePlaceholder() if e.target is e.currentTarget

  onDragEnd: (e) =>
    return unless e.target.matches('.project-root-header')
    return unless @isAtomTreeViewEvent(e)

    e.stopPropagation()
    @clearDropTarget()

  onDragOver: (e) =>
    return unless @treeView.list.contains(e.target)
    return unless @isAtomTreeViewEvent(e)

    e.preventDefault()
    e.stopPropagation()

    entry = e.currentTarget

    if @treeView.roots.length is 0
      @treeView.list.appendChild(@getPlaceholder())
      return

    newDropTargetIndex = @getDropTargetIndex(e)
    return unless newDropTargetIndex?
    return if @prevDropTargetIndex is newDropTargetIndex
    @prevDropTargetIndex = newDropTargetIndex

    projectRoots = @treeView.roots

    if newDropTargetIndex < projectRoots.length
      element = projectRoots[newDropTargetIndex]
      element.classList.add('is-drop-target')
      element.parentElement.insertBefore(@getPlaceholder(), element)
    else
      element = projectRoots[newDropTargetIndex - 1]
      element.classList.add('drop-target-is-after')
      element.parentElement.insertBefore(@getPlaceholder(), element.nextSibling)

  onDropOnOtherWindow: (e, fromItemIndex) =>
    paths = atom.project.getPaths()
    paths.splice(fromItemIndex, 1)
    atom.project.setPaths(paths)

    @clearDropTarget()

  clearDropTarget: ->
    element = @treeView.element.querySelector(".is-dragging")
    element?.classList.remove('is-dragging')
    element?.updateTooltip()
    @removePlaceholder()

  onDrop: (e) =>
    return unless @treeView.list.contains(e.target)
    return unless @isAtomTreeViewEvent(e)

    e.preventDefault()
    e.stopPropagation()

    {dataTransfer} = e

    fromWindowId = parseInt(dataTransfer.getData('from-window-id'))
    fromRootPath  = dataTransfer.getData('from-root-path')
    fromIndex     = parseInt(dataTransfer.getData('project-root-index'))
    fromRootIndex = parseInt(dataTransfer.getData('from-root-index'))

    toIndex = @getDropTargetIndex(e)

    @clearDropTarget()

    if fromWindowId is @getWindowId()
      unless fromIndex is toIndex
        projectPaths = atom.project.getPaths()
        projectPaths.splice(fromIndex, 1)
        if toIndex > fromIndex then toIndex -= 1
        projectPaths.splice(toIndex, 0, fromRootPath)
        atom.project.setPaths(projectPaths)
    else
      projectPaths = atom.project.getPaths()
      projectPaths.splice(toIndex, 0, fromRootPath)
      atom.project.setPaths(projectPaths)

      if not isNaN(fromWindowId)
        # Let the window where the drag started know that the tab was dropped
        browserWindow = remote.BrowserWindow.fromId(fromWindowId)
        browserWindow?.webContents.send('tree-view:project-folder-dropped', fromIndex)

  getDropTargetIndex: (e) ->
    return if @isPlaceholder(e.target)

    projectRoots = @treeView.roots
    projectRoot = e.target.closest('.project-root')
    projectRoot = projectRoots[projectRoots.length - 1] unless projectRoot

    return 0 unless projectRoot

    projectRootIndex = @treeView.roots.indexOf(projectRoot)

    center = projectRoot.getBoundingClientRect().top + projectRoot.offsetHeight / 2

    if e.pageY < center
      projectRootIndex
    else
      projectRootIndex + 1

  canDragStart: (e) ->
    e.target.closest('.project-root-header')

  isDragging: (e) ->
    for item in e.dataTransfer.items
      if item.type is 'from-root-path'
        return true

    return false

  isAtomTreeViewEvent: (e) ->
    for item in e.dataTransfer.items
      if item.type is 'atom-tree-view-root-event'
        return true

    return false

  getPlaceholder: ->
    unless @placeholderEl
      @placeholderEl = document.createElement('li')
      @placeholderEl.classList.add('placeholder')
    @placeholderEl

  removePlaceholder: ->
    @placeholderEl?.remove()
    @placeholderEl = null

  isPlaceholder: (element) ->
    element.classList.contains('.placeholder')

  getWindowId: ->
    @processId ?= atom.getCurrentWindow().id
