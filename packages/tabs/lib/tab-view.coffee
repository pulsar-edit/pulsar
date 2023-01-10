path = require 'path'
{Disposable, CompositeDisposable} = require 'atom'
getIconServices = require './get-icon-services'

layout = require './layout'

module.exports =
class TabView
  constructor: ({@item, @pane, didClickCloseIcon, @tabs, location}) ->
    if typeof @item.getPath is 'function'
      @path = @item.getPath()

    @element = document.createElement('li')
    @element.setAttribute('is', 'tabs-tab')
    if ['TextEditor', 'TestView'].indexOf(@item.constructor.name) > -1
      @element.classList.add('texteditor')
    @element.classList.add('tab', 'sortable')

    @itemTitle = document.createElement('div')
    @itemTitle.classList.add('title')
    @element.appendChild(@itemTitle)

    if location is 'center' or not @item.isPermanentDockItem?()
      closeIcon = document.createElement('div')
      closeIcon.classList.add('close-icon')
      closeIcon.onclick = didClickCloseIcon
      @element.appendChild(closeIcon)

    @subscriptions = new CompositeDisposable()

    @handleEvents()
    @updateDataAttributes()
    @updateTitle()
    @updateIcon()
    @updateModifiedStatus()
    @setupTooltip()

    if @isItemPending()
      @itemTitle.classList.add('temp')
      @element.classList.add('pending-tab')

    @element.ondrag = (e) -> layout.drag e
    @element.ondragend = (e) -> layout.end e

    @element.pane = @pane
    @element.item = @item
    @element.itemTitle = @itemTitle
    @element.path = @path

  handleEvents: ->
    titleChangedHandler = =>
      @updateTitle()

    @subscriptions.add @pane.onDidDestroy => @destroy()
    @subscriptions.add @pane.onItemDidTerminatePendingState (item) =>
      @clearPending() if item is @item

    if typeof @item.onDidChangeTitle is 'function'
      onDidChangeTitleDisposable = @item.onDidChangeTitle(titleChangedHandler)
      if Disposable.isDisposable(onDidChangeTitleDisposable)
        @subscriptions.add(onDidChangeTitleDisposable)
      else
        console.warn "::onDidChangeTitle does not return a valid Disposable!", @item
    else if typeof @item.on is 'function'
      #TODO Remove once old events are no longer supported
      @item.on('title-changed', titleChangedHandler)
      @subscriptions.add dispose: =>
        @item.off?('title-changed', titleChangedHandler)

    pathChangedHandler = (@path) =>
      @updateDataAttributes()
      @updateTitle()
      @updateTooltip()
      @updateIcon()

    if typeof @item.onDidChangePath is 'function'
      onDidChangePathDisposable = @item.onDidChangePath(pathChangedHandler)
      if Disposable.isDisposable(onDidChangePathDisposable)
        @subscriptions.add(onDidChangePathDisposable)
      else
        console.warn "::onDidChangePath does not return a valid Disposable!", @item
    else if typeof @item.on is 'function'
      #TODO Remove once old events are no longer supported
      @item.on('path-changed', pathChangedHandler)
      @subscriptions.add dispose: =>
        @item.off?('path-changed', pathChangedHandler)

    iconChangedHandler = =>
      @updateIcon()

    @subscriptions.add getIconServices().onDidChange => @updateIcon()

    if typeof @item.onDidChangeIcon is 'function'
      onDidChangeIconDisposable = @item.onDidChangeIcon? =>
        @updateIcon()
      if Disposable.isDisposable(onDidChangeIconDisposable)
        @subscriptions.add(onDidChangeIconDisposable)
      else
        console.warn "::onDidChangeIcon does not return a valid Disposable!", @item
    else if typeof @item.on is 'function'
      #TODO Remove once old events are no longer supported
      @item.on('icon-changed', iconChangedHandler)
      @subscriptions.add dispose: =>
        @item.off?('icon-changed', iconChangedHandler)

    modifiedHandler = =>
      @updateModifiedStatus()

    if typeof @item.onDidChangeModified is 'function'
      onDidChangeModifiedDisposable = @item.onDidChangeModified(modifiedHandler)
      if Disposable.isDisposable(onDidChangeModifiedDisposable)
        @subscriptions.add(onDidChangeModifiedDisposable)
      else
        console.warn "::onDidChangeModified does not return a valid Disposable!", @item
    else if typeof @item.on is 'function'
      #TODO Remove once old events are no longer supported
      @item.on('modified-status-changed', modifiedHandler)
      @subscriptions.add dispose: =>
        @item.off?('modified-status-changed', modifiedHandler)

    if typeof @item.onDidSave is 'function'
      onDidSaveDisposable = @item.onDidSave (event) =>
        @terminatePendingState()
        if event.path isnt @path
          @path = event.path
          @setupVcsStatus() if atom.config.get 'tabs.enableVcsColoring'

      if Disposable.isDisposable(onDidSaveDisposable)
        @subscriptions.add(onDidSaveDisposable)
      else
        console.warn "::onDidSave does not return a valid Disposable!", @item
    @subscriptions.add atom.config.observe 'tabs.showIcons', =>
      @updateIconVisibility()

    @subscriptions.add atom.config.observe 'tabs.enableVcsColoring', (isEnabled) =>
      if isEnabled and @path? then @setupVcsStatus() else @unsetVcsStatus()

  setupTooltip: ->
    # Defer creating the tooltip until the tab is moused over
    onMouseEnter = =>
      @mouseEnterSubscription.dispose()
      @hasBeenMousedOver = true
      @updateTooltip()

      # Trigger again so the tooltip shows
      @element.dispatchEvent(new CustomEvent('mouseenter', bubbles: true))

    @mouseEnterSubscription = dispose: =>
      @element.removeEventListener('mouseenter', onMouseEnter)
      @mouseEnterSubscription = null

    @element.addEventListener('mouseenter', onMouseEnter)

  updateTooltip: ->
    return unless @hasBeenMousedOver

    @destroyTooltip()

    if @path
      @tooltip = atom.tooltips.add @element,
        title: @path
        html: false
        delay:
          show: 1000
          hide: 100
        placement: 'bottom'

  destroyTooltip: ->
    return unless @hasBeenMousedOver
    @tooltip?.dispose()

  destroy: ->
    @subscriptions?.dispose()
    @mouseEnterSubscription?.dispose()
    @repoSubscriptions?.dispose()
    @destroyTooltip()
    @element.remove()

  updateDataAttributes: ->
    if @path
      @itemTitle.dataset.name = path.basename(@path)
      @itemTitle.dataset.path = @path
    else
      delete @itemTitle.dataset.name
      delete @itemTitle.dataset.path

    if itemClass = @item.constructor?.name
      @element.dataset.type = itemClass
    else
      delete @element.dataset.type

  updateTitle: ({updateSiblings, useLongTitle}={}) ->
    return if @updatingTitle
    @updatingTitle = true

    if updateSiblings is false
      title = @item.getTitle()
      title = @item.getLongTitle?() ? title if useLongTitle
      @itemTitle.textContent = title
    else
      title = @item.getTitle()
      useLongTitle = false
      for tab in @tabs when tab isnt this
        if tab.item.getTitle() is title
          tab.updateTitle(updateSiblings: false, useLongTitle: true)
          useLongTitle = true
      title = @item.getLongTitle?() ? title if useLongTitle

      @itemTitle.textContent = title

    @updatingTitle = false

  updateIcon: ->
    getIconServices().updateTabIcon(this)

  isItemPending: ->
    if @pane.getPendingItem?
      @pane.getPendingItem() is @item
    else if @item.isPending?
      @item.isPending()

  terminatePendingState: ->
    if @pane.clearPendingItem?
      @pane.clearPendingItem() if @pane.getPendingItem() is @item
    else if @item.terminatePendingState?
      @item.terminatePendingState()

  clearPending: ->
    @itemTitle.classList.remove('temp')
    @element.classList.remove('pending-tab')

  updateIconVisibility: ->
    if atom.config.get 'tabs.showIcons'
      @itemTitle.classList.remove('hide-icon')
    else
      @itemTitle.classList.add('hide-icon')

  updateModifiedStatus: ->
    if @item.isModified?()
      @element.classList.add('modified') unless @isModified
      @isModified = true
    else
      @element.classList.remove('modified') if @isModified
      @isModified = false

  setupVcsStatus: ->
    return unless @path?
    @repoForPath(@path).then (repo) =>
      @subscribeToRepo(repo)
      @updateVcsStatus(repo)

  # Subscribe to the project's repo for changes to the VCS status of the file.
  subscribeToRepo: (repo) ->
    return unless repo?

    # Remove previous repo subscriptions.
    @repoSubscriptions?.dispose()
    @repoSubscriptions = new CompositeDisposable()

    @repoSubscriptions.add repo.onDidChangeStatus (event) =>
      @updateVcsStatus(repo, event.pathStatus) if event.path is @path
    @repoSubscriptions.add repo.onDidChangeStatuses =>
      @updateVcsStatus(repo)

  repoForPath: ->
    for dir in atom.project.getDirectories()
      return atom.project.repositoryForDirectory(dir) if dir.contains @path
    Promise.resolve(null)

  # Update the VCS status property of this tab using the repo.
  updateVcsStatus: (repo, status) ->
    return unless repo?

    newStatus = null
    if repo.isPathIgnored(@path)
      newStatus = 'ignored'
    else
      status = repo.getCachedPathStatus(@path) unless status?
      if repo.isStatusModified(status)
        newStatus = 'modified'
      else if repo.isStatusNew(status)
        newStatus = 'added'

    if newStatus isnt @status
      @status = newStatus
      @updateVcsColoring()

  updateVcsColoring: ->
    @itemTitle.classList.remove('status-ignored', 'status-modified',  'status-added')
    if @status and atom.config.get 'tabs.enableVcsColoring'
      @itemTitle.classList.add("status-#{@status}")

  unsetVcsStatus: ->
    @repoSubscriptions?.dispose()
    delete @status
    @updateVcsColoring()
