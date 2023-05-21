{CompositeDisposable, Emitter} = require 'atom'
Grim = require 'grim'
StatusBarView = require './status-bar-view'
FileInfoView = require './file-info-view'
CursorPositionView = require './cursor-position-view'
SelectionCountView = require './selection-count-view'
GitView = require './git-view'
LaunchModeView = require './launch-mode-view'

module.exports =
  activate: ->
    @emitters = new Emitter()
    @subscriptions = new CompositeDisposable()

    @statusBar = new StatusBarView()
    @attachStatusBar()

    @subscriptions.add atom.config.onDidChange 'status-bar.fullWidth', =>
      @attachStatusBar()

    @updateStatusBarVisibility()

    @statusBarVisibilitySubscription =
      atom.config.observe 'status-bar.isVisible', =>
        @updateStatusBarVisibility()

    atom.commands.add 'atom-workspace', 'status-bar:toggle', =>
      if @statusBarPanel.isVisible()
        atom.config.set 'status-bar.isVisible', false
      else
        atom.config.set 'status-bar.isVisible', true

    {safeMode, devMode} = atom.getLoadSettings()
    if safeMode or devMode
      launchModeView = new LaunchModeView({safeMode, devMode})
      @statusBar.addLeftTile(item: launchModeView.element, priority: -1)

    @fileInfo = new FileInfoView()
    @statusBar.addLeftTile(item: @fileInfo.element, priority: 0)

    @cursorPosition = new CursorPositionView()
    @statusBar.addLeftTile(item: @cursorPosition.element, priority: 1)

    @selectionCount = new SelectionCountView()
    @statusBar.addLeftTile(item: @selectionCount.element, priority: 2)

    @gitInfo = new GitView()
    @gitInfoTile = @statusBar.addRightTile(item: @gitInfo.element, priority: 0)

  deactivate: ->
    @statusBarVisibilitySubscription?.dispose()
    @statusBarVisibilitySubscription = null

    @gitInfo?.destroy()
    @gitInfo = null

    @fileInfo?.destroy()
    @fileInfo = null

    @cursorPosition?.destroy()
    @cursorPosition = null

    @selectionCount?.destroy()
    @selectionCount = null

    @statusBarPanel?.destroy()
    @statusBarPanel = null

    @statusBar?.destroy()
    @statusBar = null

    @subscriptions?.dispose()
    @subscriptions = null

    @emitters?.dispose()
    @emitters = null

    delete atom.__workspaceView.statusBar if atom.__workspaceView?

  updateStatusBarVisibility: ->
    if atom.config.get 'status-bar.isVisible'
      @statusBarPanel.show()
    else
      @statusBarPanel.hide()

  provideStatusBar: ->
    addLeftTile: @statusBar.addLeftTile.bind(@statusBar)
    addRightTile: @statusBar.addRightTile.bind(@statusBar)
    getLeftTiles: @statusBar.getLeftTiles.bind(@statusBar)
    getRightTiles: @statusBar.getRightTiles.bind(@statusBar)
    disableGitInfoTile: @gitInfoTile.destroy.bind(@gitInfoTile)

  attachStatusBar: ->
    @statusBarPanel.destroy() if @statusBarPanel?

    panelArgs = {item: @statusBar, priority: 0}
    if atom.config.get('status-bar.fullWidth')
      @statusBarPanel = atom.workspace.addFooterPanel panelArgs
    else
      @statusBarPanel = atom.workspace.addBottomPanel panelArgs

  # Deprecated
  #
  # Wrap deprecation calls on the methods returned rather than
  # Services API method which would be registered and trigger
  # a deprecation call
  legacyProvideStatusBar: ->
    statusbar = @provideStatusBar()

    addLeftTile: (args...) ->
      Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.")
      statusbar.addLeftTile(args...)
    addRightTile: (args...) ->
      Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.")
      statusbar.addRightTile(args...)
    getLeftTiles: ->
      Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.")
      statusbar.getLeftTiles()
    getRightTiles: ->
      Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.")
      statusbar.getRightTiles()
