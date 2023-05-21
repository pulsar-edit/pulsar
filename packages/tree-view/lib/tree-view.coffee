path = require 'path'
{shell} = require 'electron'

_ = require 'underscore-plus'
{BufferedProcess, CompositeDisposable, Emitter} = require 'atom'
{repoForPath, getStyleObject, getFullExtension} = require "./helpers"
fs = require 'fs-plus'

AddDialog = require './add-dialog'
MoveDialog = require './move-dialog'
CopyDialog = require './copy-dialog'
IgnoredNames = null # Defer requiring until actually needed

AddProjectsView = require './add-projects-view'

Directory = require './directory'
DirectoryView = require './directory-view'
RootDragAndDrop = require './root-drag-and-drop'

TREE_VIEW_URI = 'atom://tree-view'

toggleConfig = (keyPath) ->
  atom.config.set(keyPath, not atom.config.get(keyPath))

nextId = 1

module.exports =
class TreeView
  constructor: (state) ->
    @id = nextId++
    @element = document.createElement('div')
    @element.classList.add('tool-panel', 'tree-view')
    @element.tabIndex = -1

    @list = document.createElement('ol')
    @list.classList.add('tree-view-root', 'full-menu', 'list-tree', 'has-collapsable-children', 'focusable-panel')

    @disposables = new CompositeDisposable
    @emitter = new Emitter
    @roots = []
    @selectedPath = null
    @selectOnMouseUp = null
    @lastFocusedEntry = null
    @ignoredPatterns = []
    @useSyncFS = false
    @currentlyOpening = new Map
    @editorsToMove = []
    @editorsToDestroy = []

    @dragEventCounts = new WeakMap
    @rootDragAndDrop = new RootDragAndDrop(this)

    @handleEvents()

    process.nextTick =>
      @onStylesheetsChanged()
      onStylesheetsChanged = _.debounce(@onStylesheetsChanged, 100)
      @disposables.add atom.styles.onDidAddStyleElement(onStylesheetsChanged)
      @disposables.add atom.styles.onDidRemoveStyleElement(onStylesheetsChanged)
      @disposables.add atom.styles.onDidUpdateStyleElement(onStylesheetsChanged)

    @updateRoots(state.directoryExpansionStates)

    if state.selectedPaths?.length > 0
      @selectMultipleEntries(@entryForPath(selectedPath)) for selectedPath in state.selectedPaths
    else
      @selectEntry(@roots[0])

    if state.scrollTop? or state.scrollLeft?
      observer = new IntersectionObserver(=>
        if @isVisible()
          @element.scrollTop = state.scrollTop
          @element.scrollLeft = state.scrollLeft
          observer.disconnect()
      )
      observer.observe(@element)

    @element.style.width = "#{state.width}px" if state.width > 0

    @disposables.add @onWillMoveEntry ({initialPath, newPath}) =>
      editors = atom.workspace.getTextEditors()
      if fs.isDirectorySync(initialPath)
        initialPath += path.sep # Avoid moving lib2's editors when lib was moved
        for editor in editors
          filePath = editor.getPath()
          if filePath?.startsWith(initialPath)
            @editorsToMove.push(filePath)
      else
        for editor in editors
          filePath = editor.getPath()
          if filePath is initialPath
            @editorsToMove.push(filePath)

    @disposables.add @onEntryMoved ({initialPath, newPath}) =>
      for editor in atom.workspace.getTextEditors()
        filePath = editor.getPath()
        index = @editorsToMove.indexOf(filePath)
        if index isnt -1
          editor.getBuffer().setPath(filePath.replace(initialPath, newPath))
          @editorsToMove.splice(index, 1)

    @disposables.add @onMoveEntryFailed ({initialPath, newPath}) =>
      index = @editorsToMove.indexOf(initialPath)
      @editorsToMove.splice(index, 1) if index isnt -1

    @disposables.add @onWillDeleteEntry ({pathToDelete}) =>
      editors = atom.workspace.getTextEditors()
      if fs.isDirectorySync(pathToDelete)
        pathToDelete += path.sep # Avoid destroying lib2's editors when lib was deleted
        for editor in editors
          filePath = editor.getPath()
          if filePath?.startsWith(pathToDelete) and not editor.isModified()
            @editorsToDestroy.push(filePath)
      else
        for editor in editors
          filePath = editor.getPath()
          if filePath is pathToDelete and not editor.isModified()
            @editorsToDestroy.push(filePath)

    @disposables.add @onEntryDeleted ({pathToDelete}) =>
      for editor in atom.workspace.getTextEditors()
        index = @editorsToDestroy.indexOf(editor.getPath())
        if index isnt -1
          editor.destroy()
          @editorsToDestroy.splice(index, 1)

    @disposables.add @onDeleteEntryFailed ({pathToDelete}) =>
      index = @editorsToDestroy.indexOf(pathToDelete)
      @editorsToDestroy.splice(index, 1) if index isnt -1

  serialize: ->
    directoryExpansionStates: new ((roots) ->
      @[root.directory.path] = root.directory.serializeExpansionState() for root in roots
      this)(@roots)
    deserializer: 'TreeView'
    selectedPaths: Array.from(@getSelectedEntries(), (entry) -> entry.getPath())
    scrollLeft: @element.scrollLeft
    scrollTop: @element.scrollTop
    width: parseInt(@element.style.width or 0)

  destroy: ->
    root.directory.destroy() for root in @roots
    @disposables.dispose()
    @rootDragAndDrop.dispose()
    @emitter.emit('did-destroy')

  onDidDestroy: (callback) ->
    @emitter.on('did-destroy', callback)

  getTitle: -> "Project"

  getURI: -> TREE_VIEW_URI

  getPreferredLocation: ->
    if atom.config.get('tree-view.showOnRightSide')
      'right'
    else
      'left'

  getAllowedLocations: -> ["left", "right"]

  isPermanentDockItem: -> true

  getPreferredWidth: ->
    @list.style.width = 'min-content'
    result = @list.offsetWidth
    @list.style.width = ''
    result

  onDirectoryCreated: (callback) ->
    @emitter.on('directory-created', callback)

  onEntryCopied: (callback) ->
    @emitter.on('entry-copied', callback)

  onWillDeleteEntry: (callback) ->
    @emitter.on('will-delete-entry', callback)

  onEntryDeleted: (callback) ->
    @emitter.on('entry-deleted', callback)

  onDeleteEntryFailed: (callback) ->
    @emitter.on('delete-entry-failed', callback)

  onWillMoveEntry: (callback) ->
    @emitter.on('will-move-entry', callback)

  onEntryMoved: (callback) ->
    @emitter.on('entry-moved', callback)

  onMoveEntryFailed: (callback) ->
    @emitter.on('move-entry-failed', callback)

  onFileCreated: (callback) ->
    @emitter.on('file-created', callback)

  handleEvents: ->
    @element.addEventListener 'click', (e) =>
      # This prevents accidental collapsing when a .entries element is the event target
      return if e.target.classList.contains('entries')

      @entryClicked(e) unless e.shiftKey or e.metaKey or e.ctrlKey
    @element.addEventListener 'mousedown', (e) => @onMouseDown(e)
    @element.addEventListener 'mouseup', (e) => @onMouseUp(e)
    @element.addEventListener 'dragstart', (e) => @onDragStart(e)
    @element.addEventListener 'dragenter', (e) => @onDragEnter(e)
    @element.addEventListener 'dragleave', (e) => @onDragLeave(e)
    @element.addEventListener 'dragover', (e) => @onDragOver(e)
    @element.addEventListener 'drop', (e) => @onDrop(e)

    atom.commands.add @element,
     'core:move-up': (e) => @moveUp(e)
     'core:move-down': (e) => @moveDown(e)
     'core:page-up': => @pageUp()
     'core:page-down': => @pageDown()
     'core:move-to-top': => @scrollToTop()
     'core:move-to-bottom': => @scrollToBottom()
     'tree-view:expand-item': => @openSelectedEntry(pending: true, true)
     'tree-view:recursive-expand-directory': => @expandDirectory(true)
     'tree-view:collapse-directory': => @collapseDirectory()
     'tree-view:recursive-collapse-directory': => @collapseDirectory(true)
     'tree-view:collapse-all': => @collapseDirectory(true, true)
     'tree-view:open-selected-entry': => @openSelectedEntry()
     'tree-view:open-selected-entry-right': => @openSelectedEntryRight()
     'tree-view:open-selected-entry-left': => @openSelectedEntryLeft()
     'tree-view:open-selected-entry-up': => @openSelectedEntryUp()
     'tree-view:open-selected-entry-down': => @openSelectedEntryDown()
     'tree-view:move': => @moveSelectedEntry()
     'tree-view:copy': => @copySelectedEntries()
     'tree-view:cut': => @cutSelectedEntries()
     'tree-view:paste': => @pasteEntries()
     'tree-view:copy-full-path': => @copySelectedEntryPath(false)
     'tree-view:show-in-file-manager': => @showSelectedEntryInFileManager()
     'tree-view:open-in-new-window': => @openSelectedEntryInNewWindow()
     'tree-view:copy-project-path': => @copySelectedEntryPath(true)
     'tree-view:unfocus': => @unfocus()
     'tree-view:toggle-vcs-ignored-files': -> toggleConfig 'tree-view.hideVcsIgnoredFiles'
     'tree-view:toggle-ignored-names': -> toggleConfig 'tree-view.hideIgnoredNames'
     'tree-view:remove-project-folder': (e) => @removeProjectFolder(e)

    [0..8].forEach (index) =>
      atom.commands.add @element, "tree-view:open-selected-entry-in-pane-#{index + 1}", =>
        @openSelectedEntryInPane index

    @disposables.add atom.workspace.getCenter().onDidChangeActivePaneItem =>
      @selectActiveFile()
      @revealActiveFile({show: false, focus: false}) if atom.config.get('tree-view.autoReveal')
    @disposables.add atom.project.onDidChangePaths =>
      @updateRoots()
    @disposables.add atom.config.onDidChange 'tree-view.hideVcsIgnoredFiles', =>
      @updateRoots()
    @disposables.add atom.config.onDidChange 'tree-view.hideIgnoredNames', =>
      @updateRoots()
    @disposables.add atom.config.onDidChange 'core.ignoredNames', =>
      @updateRoots() if atom.config.get('tree-view.hideIgnoredNames')
    @disposables.add atom.config.onDidChange 'tree-view.sortFoldersBeforeFiles', =>
      @updateRoots()
    @disposables.add atom.config.onDidChange 'tree-view.squashDirectoryNames', =>
      @updateRoots()

  toggle: ->
    atom.workspace.toggle(this)

  show: (focus) ->
    atom.workspace.open(this, {
      searchAllPanes: true,
      activatePane: false,
      activateItem: false,
    }).then =>
      atom.workspace.paneContainerForURI(@getURI()).show()
      @focus() if focus

  hide: ->
    atom.workspace.hide(this)

  focus: ->
    @element.focus()

  unfocus: ->
    atom.workspace.getCenter().activate()

  hasFocus: ->
    document.activeElement is @element

  toggleFocus: ->
    if @hasFocus()
      @unfocus()
    else
      @show(true)

  entryClicked: (e) ->
    if entry = e.target.closest('.entry')
      isRecursive = e.altKey or false
      @selectEntry(entry)
      if entry.classList.contains('directory')
        entry.toggleExpansion(isRecursive)
      else if entry.classList.contains('file')
        @fileViewEntryClicked(e)

  fileViewEntryClicked: (e) ->
    filePath = e.target.closest('.entry').getPath()
    detail = e.detail ? 1
    alwaysOpenExisting = atom.config.get('tree-view.alwaysOpenExisting')
    if detail is 1
      if atom.config.get('core.allowPendingPaneItems')
        openPromise = atom.workspace.open(filePath, pending: true, activatePane: false, searchAllPanes: alwaysOpenExisting)
        @currentlyOpening.set(filePath, openPromise)
        openPromise.then => @currentlyOpening.delete(filePath)
    else if detail is 2
      @openAfterPromise(filePath, searchAllPanes: alwaysOpenExisting)

  openAfterPromise: (uri, options) ->
    if promise = @currentlyOpening.get(uri)
      promise.then -> atom.workspace.open(uri, options)
    else
      atom.workspace.open(uri, options)

  updateRoots: (expansionStates={}) ->
    selectedPaths = @selectedPaths()

    oldExpansionStates = {}
    for root in @roots
      oldExpansionStates[root.directory.path] = root.directory.serializeExpansionState()
      root.directory.destroy()
      root.remove()

    @roots = []

    projectPaths = atom.project.getPaths()
    if projectPaths.length > 0
      @element.appendChild(@list) unless @element.querySelector('tree-view-root')

      addProjectsViewElement = @element.querySelector('#add-projects-view')
      @element.removeChild(addProjectsViewElement) if addProjectsViewElement

      IgnoredNames ?= require('./ignored-names')

      @roots = for projectPath in projectPaths
        stats = fs.lstatSyncNoException(projectPath)
        continue unless stats
        stats = _.pick stats, _.keys(stats)...
        for key in ["atime", "birthtime", "ctime", "mtime"]
          stats[key] = stats[key].getTime()

        directory = new Directory({
          name: path.basename(projectPath)
          fullPath: projectPath
          symlink: false
          isRoot: true
          expansionState: expansionStates[projectPath] ?
                          oldExpansionStates[projectPath] ?
                          {isExpanded: true}
          ignoredNames: new IgnoredNames()
          @useSyncFS
          stats
        })
        root = new DirectoryView(directory).element
        @list.appendChild(root)
        root

      # The DOM has been recreated; reselect everything
      @selectMultipleEntries(@entryForPath(selectedPath)) for selectedPath in selectedPaths
    else
      @element.removeChild(@list) if @element.querySelector('.tree-view-root')
      @element.appendChild(new AddProjectsView().element) unless @element.querySelector('#add-projects-view')

  getActivePath: -> atom.workspace.getCenter().getActivePaneItem()?.getPath?()

  selectActiveFile: ->
    activeFilePath = @getActivePath()
    if @entryForPath(activeFilePath)
      @selectEntryForPath(activeFilePath)
    else
      # If the active file is not part of the project, deselect all entries
      @deselect()

  revealActiveFile: (options = {}) ->
    return Promise.resolve() unless atom.project.getPaths().length

    {show, focus} = options

    focus ?= atom.config.get('tree-view.focusOnReveal')
    promise = if show or focus then @show(focus) else Promise.resolve()
    promise.then =>
      return unless activeFilePath = @getActivePath()

      [rootPath, relativePath] = atom.project.relativizePath(activeFilePath)
      return unless rootPath?

      activePathComponents = relativePath.split(path.sep)
      # Add the root folder to the path components
      activePathComponents.unshift(rootPath.substr(rootPath.lastIndexOf(path.sep) + 1))
      # And remove it from the current path
      currentPath = rootPath.substr(0, rootPath.lastIndexOf(path.sep))
      for pathComponent in activePathComponents
        currentPath += path.sep + pathComponent
        entry = @entryForPath(currentPath)
        if entry.classList.contains('directory')
          entry.expand()
        else
          @selectEntry(entry)
          @scrollToEntry(entry)

  copySelectedEntryPath: (relativePath = false) ->
    if pathToCopy = @selectedPath
      pathToCopy = atom.project.relativize(pathToCopy) if relativePath
      atom.clipboard.write(pathToCopy)

  entryForPath: (entryPath) ->
    bestMatchEntry = null
    bestMatchLength = 0

    for entry in @list.querySelectorAll('.entry')
      if entry.isPathEqual(entryPath)
        return entry

      entryLength = entry.getPath().length
      if entry.directory?.contains(entryPath) and entryLength > bestMatchLength
        bestMatchEntry = entry
        bestMatchLength = entryLength

    bestMatchEntry

  selectEntryForPath: (entryPath) ->
    @selectEntry(@entryForPath(entryPath))

  moveDown: (event) ->
    event?.stopImmediatePropagation()
    selectedEntry = @selectedEntry()
    if selectedEntry?
      if selectedEntry.classList.contains('directory')
        if @selectEntry(selectedEntry.entries.children[0])
          @scrollToEntry(@selectedEntry(), false)
          return

      if nextEntry = @nextEntry(selectedEntry)
        @selectEntry(nextEntry)
    else
      @selectEntry(@roots[0])

    @scrollToEntry(@selectedEntry(), false)

  moveUp: (event) ->
    event.stopImmediatePropagation()
    selectedEntry = @selectedEntry()
    if selectedEntry?
      if previousEntry = @previousEntry(selectedEntry)
        @selectEntry(previousEntry)
      else
        @selectEntry(selectedEntry.parentElement.closest('.directory'))
    else
      entries = @list.querySelectorAll('.entry')
      @selectEntry(entries[entries.length - 1])

    @scrollToEntry(@selectedEntry(), false)

  nextEntry: (entry) ->
    currentEntry = entry
    while currentEntry?
      if currentEntry.nextSibling?
        currentEntry = currentEntry.nextSibling
        if currentEntry.matches('.entry')
          return currentEntry
      else
        currentEntry = currentEntry.parentElement.closest('.directory')

    return null

  previousEntry: (entry) ->
    previousEntry = entry.previousSibling
    while previousEntry? and not previousEntry.matches('.entry')
      previousEntry = previousEntry.previousSibling

    return null unless previousEntry?

    # If the previous entry is an expanded directory,
    # we need to select the last entry in that directory,
    # not the directory itself
    if previousEntry.matches('.directory.expanded')
      entries = previousEntry.querySelectorAll('.entry')
      return entries[entries.length - 1] if entries.length > 0

    return previousEntry

  expandDirectory: (isRecursive=false) ->
    selectedEntry = @selectedEntry()
    return unless selectedEntry?

    directory = selectedEntry.closest('.directory')
    if isRecursive is false and directory.isExpanded
      # Select the first entry in the expanded folder if it exists
      @moveDown() if directory.directory.getEntries().length > 0
    else
      directory.expand(isRecursive)

  collapseDirectory: (isRecursive=false, allDirectories=false) ->
    if allDirectories
      root.collapse(true) for root in @roots
      return

    selectedEntry = @selectedEntry()
    return unless selectedEntry?

    if directory = selectedEntry.closest('.expanded.directory')
      directory.collapse(isRecursive)
      @selectEntry(directory)

  openSelectedEntry: (options={}, expandDirectory=false) ->
    selectedEntry = @selectedEntry()
    return unless selectedEntry?

    if selectedEntry.classList.contains('directory')
      if expandDirectory
        @expandDirectory(false)
      else
        selectedEntry.toggleExpansion()
    else if selectedEntry.classList.contains('file')
      if atom.config.get('tree-view.alwaysOpenExisting')
        options = Object.assign searchAllPanes: true, options
      @openAfterPromise(selectedEntry.getPath(), options)

  openSelectedEntrySplit: (orientation, side) ->
    selectedEntry = @selectedEntry()
    return unless selectedEntry?

    pane = atom.workspace.getCenter().getActivePane()
    if pane and selectedEntry.classList.contains('file')
      if atom.workspace.getCenter().getActivePaneItem()
        split = pane.split orientation, side
        atom.workspace.openURIInPane selectedEntry.getPath(), split
      else
        @openSelectedEntry yes

  openSelectedEntryRight: ->
    @openSelectedEntrySplit 'horizontal', 'after'

  openSelectedEntryLeft: ->
    @openSelectedEntrySplit 'horizontal', 'before'

  openSelectedEntryUp: ->
    @openSelectedEntrySplit 'vertical', 'before'

  openSelectedEntryDown: ->
    @openSelectedEntrySplit 'vertical', 'after'

  openSelectedEntryInPane: (index) ->
    selectedEntry = @selectedEntry()
    return unless selectedEntry?

    pane = atom.workspace.getCenter().getPanes()[index]
    if pane and selectedEntry.classList.contains('file')
      atom.workspace.openURIInPane selectedEntry.getPath(), pane

  moveSelectedEntry: ->
    if @hasFocus()
      entry = @selectedEntry()
      return if not entry? or entry in @roots
      oldPath = entry.getPath()
    else
      oldPath = @getActivePath()

    if oldPath
      dialog = new MoveDialog oldPath,
        willMove: ({initialPath, newPath}) =>
          @emitter.emit 'will-move-entry', {initialPath, newPath}
        onMove: ({initialPath, newPath}) =>
          @emitter.emit 'entry-moved', {initialPath, newPath}
        onMoveFailed: ({initialPath, newPath}) =>
          @emitter.emit 'move-entry-failed', {initialPath, newPath}
      dialog.attach()

  showSelectedEntryInFileManager: ->
    return unless filePath = @selectedEntry()?.getPath()

    return unless fs.existsSync(filePath)
      atom.notifications.addWarning("Unable to show #{filePath} in #{@getFileManagerName()}")

    shell.showItemInFolder(filePath)

  showCurrentFileInFileManager: ->
    return unless filePath = atom.workspace.getCenter().getActiveTextEditor()?.getPath()

    return unless fs.existsSync(filePath)
      atom.notifications.addWarning("Unable to show #{filePath} in #{@getFileManagerName()}")

    shell.showItemInFolder(filePath)

  getFileManagerName: ->
    switch process.platform
      when 'darwin'
        return 'Finder'
      when 'win32'
        return 'Explorer'
      else
        return 'File Manager'

  openSelectedEntryInNewWindow: ->
    if pathToOpen = @selectedEntry()?.getPath()
      atom.open({pathsToOpen: [pathToOpen], newWindow: true})

  copySelectedEntry: ->
    if @hasFocus()
      entry = @selectedEntry()
      return if entry in @roots
      oldPath = entry?.getPath()
    else
      oldPath = @getActivePath()
    return unless oldPath

    dialog = new CopyDialog oldPath,
      onCopy: ({initialPath, newPath}) =>
        @emitter.emit 'entry-copied', {initialPath, newPath}
    dialog.attach()

  removeSelectedEntries: ->
    if @hasFocus()
      selectedPaths = @selectedPaths()
      selectedEntries = @getSelectedEntries()
    else if activePath = @getActivePath()
      selectedPaths = [activePath]
      selectedEntries = [@entryForPath(activePath)]

    return unless selectedPaths?.length > 0

    for root in @roots
      if root.getPath() in selectedPaths
        atom.confirm({
          message: "The root directory '#{root.directory.name}' can't be removed.",
          buttons: ['OK']
        }, -> # noop
        )
        return

    atom.confirm({
      message: "Are you sure you want to delete the selected #{if selectedPaths.length > 1 then 'items' else 'item'}?",
      detailedMessage: "You are deleting:\n#{selectedPaths.join('\n')}",
      buttons: ['Move to Trash', 'Cancel']
    }, (response) =>
      if response is 0 # Move to Trash
        failedDeletions = []
        for selectedPath in selectedPaths
          # Don't delete entries which no longer exist. This can happen, for example, when:
          # * The entry is deleted outside of Atom before "Move to Trash" is selected
          # * A folder and one of its children are both selected for deletion,
          #   but the parent folder is deleted first
          continue unless fs.existsSync(selectedPath)

          @emitter.emit 'will-delete-entry', {pathToDelete: selectedPath}
          if shell.moveItemToTrash(selectedPath)
            @emitter.emit 'entry-deleted', {pathToDelete: selectedPath}
          else
            @emitter.emit 'delete-entry-failed', {pathToDelete: selectedPath}
            failedDeletions.push selectedPath

          if repo = repoForPath(selectedPath)
            repo.getPathStatus(selectedPath)

        if failedDeletions.length > 0
          atom.notifications.addError @formatTrashFailureMessage(failedDeletions),
            description: @formatTrashEnabledMessage()
            detail: "#{failedDeletions.join('\n')}"
            dismissable: true

        # Focus the first parent folder
        if firstSelectedEntry = selectedEntries[0]
          @selectEntry(firstSelectedEntry.closest('.directory:not(.selected)'))
        @updateRoots() if atom.config.get('tree-view.squashDirectoryNames')
    )

  formatTrashFailureMessage: (failedDeletions) ->
    fileText = if failedDeletions.length > 1 then 'files' else 'file'

    "The following #{fileText} couldn't be moved to the trash."

  formatTrashEnabledMessage: ->
    switch process.platform
      when 'linux' then 'Is `gvfs-trash` installed?'
      when 'darwin' then 'Is Trash enabled on the volume where the files are stored?'
      when 'win32' then 'Is there a Recycle Bin on the drive where the files are stored?'

  # Public: Copy the path of the selected entry element.
  #         Save the path in localStorage, so that copying from 2 different
  #         instances of atom works as intended
  #
  #
  # Returns `copyPath`.
  copySelectedEntries: ->
    selectedPaths = @selectedPaths()
    return unless selectedPaths and selectedPaths.length > 0
    # save to localStorage so we can paste across multiple open apps
    window.localStorage.removeItem('tree-view:cutPath')
    window.localStorage['tree-view:copyPath'] = JSON.stringify(selectedPaths)

  # Public: Cut the path of the selected entry element.
  #         Save the path in localStorage, so that cutting from 2 different
  #         instances of atom works as intended
  #
  #
  # Returns `cutPath`
  cutSelectedEntries: ->
    selectedPaths = @selectedPaths()
    return unless selectedPaths and selectedPaths.length > 0
    # save to localStorage so we can paste across multiple open apps
    window.localStorage.removeItem('tree-view:copyPath')
    window.localStorage['tree-view:cutPath'] = JSON.stringify(selectedPaths)

  # Public: Paste a copied or cut item.
  #         If a file is selected, the file's parent directory is used as the
  #         paste destination.
  pasteEntries: ->
    selectedEntry = @selectedEntry()
    return unless selectedEntry

    cutPaths = if window.localStorage['tree-view:cutPath'] then JSON.parse(window.localStorage['tree-view:cutPath']) else null
    copiedPaths = if window.localStorage['tree-view:copyPath'] then JSON.parse(window.localStorage['tree-view:copyPath']) else null
    initialPaths = copiedPaths or cutPaths
    return unless initialPaths?.length

    newDirectoryPath = selectedEntry.getPath()
    newDirectoryPath = path.dirname(newDirectoryPath) if selectedEntry.classList.contains('file')

    for initialPath in initialPaths
      if fs.existsSync(initialPath)
        if copiedPaths
          @copyEntry(initialPath, newDirectoryPath)
        else if cutPaths
          break unless @moveEntry(initialPath, newDirectoryPath)

  add: (isCreatingFile) ->
    selectedEntry = @selectedEntry() ? @roots[0]
    selectedPath = selectedEntry?.getPath() ? ''

    dialog = new AddDialog(selectedPath, isCreatingFile)
    dialog.onDidCreateDirectory (createdPath) =>
      @entryForPath(createdPath)?.reload()
      @selectEntryForPath(createdPath)
      @updateRoots() if atom.config.get('tree-view.squashDirectoryNames')
      @emitter.emit 'directory-created', {path: createdPath}
    dialog.onDidCreateFile (createdPath) =>
      @entryForPath(createdPath)?.reload()
      atom.workspace.open(createdPath)
      @updateRoots() if atom.config.get('tree-view.squashDirectoryNames')
      @emitter.emit 'file-created', {path: createdPath}
    dialog.attach()

  removeProjectFolder: (e) ->
    # Remove the targeted project folder (generally this only happens through the context menu)
    pathToRemove = e.target.closest(".project-root > .header")?.querySelector(".name")?.dataset.path
    # If an entry is selected, remove that entry's project folder
    pathToRemove ?= @selectedEntry()?.closest(".project-root")?.querySelector(".header")?.querySelector(".name")?.dataset.path
    # Finally, if only one project folder exists and nothing is selected, remove that folder
    pathToRemove ?= @roots[0].querySelector(".header")?.querySelector(".name")?.dataset.path if @roots.length is 1
    atom.project.removePath(pathToRemove) if pathToRemove?

  selectedEntry: ->
    @list.querySelector('.selected')

  selectEntry: (entry) ->
    return unless entry?

    @selectedPath = entry.getPath()
    @lastFocusedEntry = entry

    selectedEntries = @getSelectedEntries()
    if selectedEntries.length > 1 or selectedEntries[0] isnt entry
      @deselect(selectedEntries)
      entry.classList.add('selected')
    entry

  getSelectedEntries: ->
    @list.querySelectorAll('.selected')

  deselect: (elementsToDeselect=@getSelectedEntries()) ->
    selected.classList.remove('selected') for selected in elementsToDeselect
    undefined

  scrollTop: (top) ->
    if top?
      @element.scrollTop = top
    else
      @element.scrollTop

  scrollBottom: (bottom) ->
    if bottom?
      @element.scrollTop = bottom - @element.offsetHeight
    else
      @element.scrollTop + @element.offsetHeight

  scrollToEntry: (entry, center=true) ->
    element = if entry?.classList.contains('directory') then entry.header else entry
    element?.scrollIntoViewIfNeeded(center)

  scrollToBottom: ->
    if lastEntry = _.last(@list.querySelectorAll('.entry'))
      @selectEntry(lastEntry)
      @scrollToEntry(lastEntry)

  scrollToTop: ->
    @selectEntry(@roots[0]) if @roots[0]?
    @element.scrollTop = 0

  pageUp: ->
    @element.scrollTop -= @element.offsetHeight

  pageDown: ->
    @element.scrollTop += @element.offsetHeight

  # Copies an entry from `initialPath` to `newDirectoryPath`
  # If the entry already exists in `newDirectoryPath`, a number is appended to the basename
  copyEntry: (initialPath, newDirectoryPath) ->
    initialPathIsDirectory = fs.isDirectorySync(initialPath)

    # Do not allow copying test/a/ into test/a/b/
    # Note: A trailing path.sep is added to prevent false positives, such as test/a -> test/ab
    realNewDirectoryPath = fs.realpathSync(newDirectoryPath) + path.sep
    realInitialPath = fs.realpathSync(initialPath) + path.sep
    if initialPathIsDirectory and realNewDirectoryPath.startsWith(realInitialPath)
      unless fs.isSymbolicLinkSync(initialPath)
        atom.notifications.addWarning('Cannot copy a folder into itself')
        return

    newPath = path.join(newDirectoryPath, path.basename(initialPath))

    # append a number to the file if an item with the same name exists
    fileCounter = 0
    originalNewPath = newPath
    while fs.existsSync(newPath)
      if initialPathIsDirectory
        newPath = "#{originalNewPath}#{fileCounter}"
      else
        extension = getFullExtension(originalNewPath)
        filePath = path.join(path.dirname(originalNewPath), path.basename(originalNewPath, extension))
        newPath = "#{filePath}#{fileCounter}#{extension}"
      fileCounter += 1

    try
      @emitter.emit 'will-copy-entry', {initialPath, newPath}
      if initialPathIsDirectory
        # use fs.copy to copy directories since read/write will fail for directories
        fs.copySync(initialPath, newPath)
      else
        # read the old file and write a new one at target location
        # TODO: Replace with fs.copyFileSync
        fs.writeFileSync(newPath, fs.readFileSync(initialPath))
      @emitter.emit 'entry-copied', {initialPath, newPath}

      if repo = repoForPath(newPath)
        repo.getPathStatus(initialPath)
        repo.getPathStatus(newPath)

    catch error
      @emitter.emit 'copy-entry-failed', {initialPath, newPath}
      atom.notifications.addWarning("Failed to copy entry #{initialPath} to #{newDirectoryPath}", detail: error.message)

  # Moves an entry from `initialPath` to `newDirectoryPath`
  moveEntry: (initialPath, newDirectoryPath) ->
    # Do not allow moving test/a/ into test/a/b/
    # Note: A trailing path.sep is added to prevent false positives, such as test/a -> test/ab
    try
      realNewDirectoryPath = fs.realpathSync(newDirectoryPath) + path.sep
      realInitialPath = fs.realpathSync(initialPath) + path.sep
      if fs.isDirectorySync(initialPath) and realNewDirectoryPath.startsWith(realInitialPath)
        unless fs.isSymbolicLinkSync(initialPath)
          atom.notifications.addWarning('Cannot move a folder into itself')
          return
    catch error
      atom.notifications.addWarning("Failed to move entry #{initialPath} to #{newDirectoryPath}", detail: error.message)

    newPath = path.join(newDirectoryPath, path.basename(initialPath))

    try
      @emitter.emit 'will-move-entry', {initialPath, newPath}
      fs.moveSync(initialPath, newPath)
      @emitter.emit 'entry-moved', {initialPath, newPath}

      if repo = repoForPath(newPath)
        repo.getPathStatus(initialPath)
        repo.getPathStatus(newPath)

    catch error
      if error.code is 'EEXIST'
        return @moveConflictingEntry(initialPath, newPath, newDirectoryPath)
      else
        @emitter.emit 'move-entry-failed', {initialPath, newPath}
        atom.notifications.addWarning("Failed to move entry #{initialPath} to #{newDirectoryPath}", detail: error.message)

    return true

  moveConflictingEntry: (initialPath, newPath, newDirectoryPath) =>
    try
      unless fs.isDirectorySync(initialPath)
        # Files, symlinks, anything but a directory
        chosen = atom.confirm
          message: "'#{path.relative(newDirectoryPath, newPath)}' already exists"
          detailedMessage: 'Do you want to replace it?'
          buttons: ['Replace file', 'Skip', 'Cancel']

        switch chosen
          when 0 # Replace
            fs.renameSync(initialPath, newPath)
            @emitter.emit 'entry-moved', {initialPath, newPath}

            if repo = repoForPath(newPath)
              repo.getPathStatus(initialPath)
              repo.getPathStatus(newPath)
            break
          when 2 # Cancel
            return false
      else
        entries = fs.readdirSync(initialPath)
        for entry in entries
          if fs.existsSync(path.join(newPath, entry))
            return false unless @moveConflictingEntry(path.join(initialPath, entry), path.join(newPath, entry), newDirectoryPath)
          else
            @moveEntry(path.join(initialPath, entry), newPath)

        # "Move" the containing folder by deleting it, since we've already moved everything in it
        fs.rmdirSync(initialPath) unless fs.readdirSync(initialPath).length
    catch error
      @emitter.emit 'move-entry-failed', {initialPath, newPath}
      atom.notifications.addWarning("Failed to move entry #{initialPath} to #{newPath}", detail: error.message)

    return true

  onStylesheetsChanged: =>
    # If visible, force a redraw so the scrollbars are styled correctly based on
    # the theme
    return unless @isVisible()
    @element.style.display = 'none'
    @element.offsetWidth
    @element.style.display = ''

  onMouseDown: (e) ->
    return unless entryToSelect = e.target.closest('.entry')

    e.stopPropagation()

    # TODO: meta+click and ctrl+click should not do the same thing on Windows.
    #       Right now removing metaKey if platform is not darwin breaks tests
    #       that set the metaKey to true when simulating a cmd+click on macos
    #       and ctrl+click on windows and linux.
    cmdKey = e.metaKey or (e.ctrlKey and process.platform isnt 'darwin')

    # return early if clicking on a selected entry
    if entryToSelect.classList.contains('selected')
      # mouse right click or ctrl click as right click on darwin platforms
      if e.button is 2 or (e.ctrlKey and process.platform is 'darwin')
        return
      else
        # allow click on mouseup if not dragging
        {shiftKey} = e
        @selectOnMouseUp = {shiftKey, cmdKey}
        return

    if e.shiftKey and cmdKey
      # select continuous from @lastFocusedEntry but leave others
      @selectContinuousEntries(entryToSelect, false)
      @showMultiSelectMenuIfNecessary()
    else if e.shiftKey
      # select continuous from @lastFocusedEntry and deselect rest
      @selectContinuousEntries(entryToSelect)
      @showMultiSelectMenuIfNecessary()
    # only allow ctrl click for multi selection on non darwin systems
    else if cmdKey
      @selectMultipleEntries(entryToSelect)
      @lastFocusedEntry = entryToSelect
      @showMultiSelectMenuIfNecessary()
    else
      @selectEntry(entryToSelect)
      @showFullMenu()

  onMouseUp: (e) ->
    return unless @selectOnMouseUp?

    {shiftKey, cmdKey} = @selectOnMouseUp
    @selectOnMouseUp = null

    return unless entryToSelect = e.target.closest('.entry')

    e.stopPropagation()

    if shiftKey and cmdKey
      # select continuous from @lastFocusedEntry but leave others
      @selectContinuousEntries(entryToSelect, false)
      @showMultiSelectMenuIfNecessary()
    else if shiftKey
      # select continuous from @lastFocusedEntry and deselect rest
      @selectContinuousEntries(entryToSelect)
      @showMultiSelectMenuIfNecessary()
    # only allow ctrl click for multi selection on non darwin systems
    else if cmdKey
      @deselect([entryToSelect])
      @lastFocusedEntry = entryToSelect
      @showMultiSelectMenuIfNecessary()
    else
      @selectEntry(entryToSelect)
      @showFullMenu()

  # Public: Return an array of paths from all selected items
  #
  # Example: @selectedPaths()
  # => ['selected/path/one', 'selected/path/two', 'selected/path/three']
  # Returns Array of selected item paths
  selectedPaths: ->
    entry.getPath() for entry in @getSelectedEntries()

  # Public: Selects items within a range defined by a currently selected entry and
  #         a new given entry. This is shift+click functionality
  #
  # Returns array of selected elements
  selectContinuousEntries: (entry, deselectOthers = true) ->
    currentSelectedEntry = @lastFocusedEntry ? @selectedEntry()
    parentContainer = entry.parentElement
    elements = []
    if parentContainer is currentSelectedEntry.parentElement
      entries = Array.from(parentContainer.querySelectorAll('.entry'))
      entryIndex = entries.indexOf(entry)
      selectedIndex = entries.indexOf(currentSelectedEntry)
      elements = (entries[i] for i in [entryIndex..selectedIndex])

      @deselect() if deselectOthers
      element.classList.add('selected') for element in elements

    elements

  # Public: Selects consecutive given entries without clearing previously selected
  #         items. This is cmd+click functionality
  #
  # Returns given entry
  selectMultipleEntries: (entry) ->
    entry?.classList.toggle('selected')
    entry

  # Public: Toggle full-menu class on the main list element to display the full context
  #         menu.
  showFullMenu: ->
    @list.classList.remove('multi-select')
    @list.classList.add('full-menu')

  # Public: Toggle multi-select class on the main list element to display the
  #         menu with only items that make sense for multi select functionality
  showMultiSelectMenu: ->
    @list.classList.remove('full-menu')
    @list.classList.add('multi-select')

  showMultiSelectMenuIfNecessary: ->
    if @getSelectedEntries().length > 1
      @showMultiSelectMenu()
    else
      @showFullMenu()

  # Public: Check for multi-select class on the main list
  #
  # Returns boolean
  multiSelectEnabled: ->
    @list.classList.contains('multi-select')

  onDragEnter: (e) =>
    if entry = e.target.closest('.entry.directory')
      return if @rootDragAndDrop.isDragging(e)
      return unless @isAtomTreeViewEvent(e)

      e.stopPropagation()

      @dragEventCounts.set(entry, 0) unless @dragEventCounts.get(entry)
      unless @dragEventCounts.get(entry) isnt 0 or entry.classList.contains('selected')
        entry.classList.add('drag-over', 'selected')

      @dragEventCounts.set(entry, @dragEventCounts.get(entry) + 1)

  onDragLeave: (e) =>
    if entry = e.target.closest('.entry.directory')
      return if @rootDragAndDrop.isDragging(e)
      return unless @isAtomTreeViewEvent(e)

      e.stopPropagation()

      @dragEventCounts.set(entry, @dragEventCounts.get(entry) - 1)
      if @dragEventCounts.get(entry) is 0 and entry.classList.contains('drag-over')
        entry.classList.remove('drag-over', 'selected')

  # Handle entry name object dragstart event
  onDragStart: (e) ->
    @dragEventCounts = new WeakMap
    @selectOnMouseUp = null
    if entry = e.target.closest('.entry')
      e.stopPropagation()

      if @rootDragAndDrop.canDragStart(e)
        return @rootDragAndDrop.onDragStart(e)

      dragImage = document.createElement("ol")
      dragImage.classList.add("entries", "list-tree")
      dragImage.style.position = "absolute"
      dragImage.style.top = 0
      dragImage.style.left = 0
      # Ensure the cloned file name element is rendered on a separate GPU layer
      # to prevent overlapping elements located at (0px, 0px) from being used as
      # the drag image.
      dragImage.style.willChange = "transform"

      initialPaths = []
      for target in @getSelectedEntries()
        entryPath = target.querySelector(".name").dataset.path
        parentSelected = target.parentNode.closest(".entry.selected")
        unless parentSelected
          initialPaths.push(entryPath)
          newElement = target.cloneNode(true)
          if newElement.classList.contains("directory")
            newElement.querySelector(".entries").remove()
          for key, value of getStyleObject(target)
            newElement.style[key] = value
          newElement.style.paddingLeft = "1em"
          newElement.style.paddingRight = "1em"
          dragImage.append(newElement)

      document.body.appendChild(dragImage)

      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setDragImage(dragImage, 0, 0)
      e.dataTransfer.setData("initialPaths", JSON.stringify(initialPaths))
      e.dataTransfer.setData("atom-tree-view-event", "true")

      window.requestAnimationFrame ->
        dragImage.remove()

  # Handle entry dragover event; reset default dragover actions
  onDragOver: (e) ->
    if entry = e.target.closest('.entry.directory')
      return if @rootDragAndDrop.isDragging(e)
      return unless @isAtomTreeViewEvent(e)

      e.preventDefault()
      e.stopPropagation()

      if @dragEventCounts.get(entry) > 0 and not entry.classList.contains('selected')
        entry.classList.add('drag-over', 'selected')

  # Handle entry drop event
  onDrop: (e) ->
    @dragEventCounts = new WeakMap
    if entry = e.target.closest('.entry.directory')
      return if @rootDragAndDrop.isDragging(e)
      return unless @isAtomTreeViewEvent(e)

      e.preventDefault()
      e.stopPropagation()

      newDirectoryPath = entry.querySelector('.name')?.dataset.path
      return false unless newDirectoryPath

      initialPaths = e.dataTransfer.getData('initialPaths')

      if initialPaths
        # Drop event from Atom
        initialPaths = JSON.parse(initialPaths)
        return if initialPaths.includes(newDirectoryPath)

        entry.classList.remove('drag-over', 'selected')

        # iterate backwards so files in a dir are moved before the dir itself
        for initialPath in initialPaths by -1
          # Note: this is necessary on Windows to circumvent node-pathwatcher
          # holding a lock on expanded folders and preventing them from
          # being moved or deleted
          # TODO: This can be removed when tree-view is switched to @atom/watcher
          @entryForPath(initialPath)?.collapse?()
          if (process.platform is 'darwin' and e.metaKey) or e.ctrlKey
            @copyEntry(initialPath, newDirectoryPath)
          else
            break unless @moveEntry(initialPath, newDirectoryPath)
      else
        # Drop event from OS
        entry.classList.remove('selected')
        for file in e.dataTransfer.files
          if (process.platform is 'darwin' and e.metaKey) or e.ctrlKey
            @copyEntry(file.path, newDirectoryPath)
          else
            break unless @moveEntry(file.path, newDirectoryPath)
    else if e.dataTransfer.files.length
      # Drop event from OS that isn't targeting a folder: add a new project folder
      atom.project.addPath(entry.path) for entry in e.dataTransfer.files

  isAtomTreeViewEvent: (e) ->
    for item in e.dataTransfer.items
      if item.type is 'atom-tree-view-event' or item.kind is 'file'
        return true

    return false

  isVisible: ->
    @element.offsetWidth isnt 0 or @element.offsetHeight isnt 0
