{CompositeDisposable} = require 'atom'

module.exports =
class WrapGuideElement
  constructor: (@editor, @editorElement) ->
    @subscriptions = new CompositeDisposable()
    @configSubscriptions = new CompositeDisposable()
    @element = document.createElement('div')
    @element.setAttribute('is', 'wrap-guide')
    @element.classList.add('wrap-guide-container')
    @attachToLines()
    @handleEvents()
    @updateGuide()

    @element.updateGuide = @updateGuide.bind(this)
    @element.getDefaultColumn = @getDefaultColumn.bind(this)

  attachToLines: ->
    scrollView = @editorElement.querySelector('.scroll-view')
    scrollView?.appendChild(@element)

  handleEvents: ->
    updateGuideCallback = => @updateGuide()

    @handleConfigEvents()

    @subscriptions.add atom.config.onDidChange 'editor.fontSize', =>
      # Wait for editor to finish updating before updating wrap guide
      # TODO: Use async/await once this file is converted to JS
      @editorElement.getComponent().getNextUpdatePromise().then -> updateGuideCallback()

    @subscriptions.add @editorElement.onDidChangeScrollLeft(updateGuideCallback)
    @subscriptions.add @editor.onDidChangePath(updateGuideCallback)
    @subscriptions.add @editor.onDidChangeGrammar =>
      @configSubscriptions.dispose()
      @handleConfigEvents()
      updateGuideCallback()

    @subscriptions.add @editor.onDidDestroy =>
      @subscriptions.dispose()
      @configSubscriptions.dispose()

    @subscriptions.add @editorElement.onDidAttach =>
      @attachToLines()
      updateGuideCallback()

  handleConfigEvents: ->
    {uniqueAscending} = require './main'

    updatePreferredLineLengthCallback = (args) =>
      # ensure that the right-most wrap guide is the preferredLineLength
      columns = atom.config.get('wrap-guide.columns', scope: @editor.getRootScopeDescriptor())
      if columns.length > 0
        columns[columns.length - 1] = args.newValue
        columns = uniqueAscending(i for i in columns when i <= args.newValue)
        atom.config.set 'wrap-guide.columns', columns,
          scopeSelector: ".#{@editor.getGrammar().scopeName}"
      @updateGuide()
    @configSubscriptions.add atom.config.onDidChange(
      'editor.preferredLineLength',
      scope: @editor.getRootScopeDescriptor(),
      updatePreferredLineLengthCallback
    )

    updateGuideCallback = => @updateGuide()
    @configSubscriptions.add atom.config.onDidChange(
      'wrap-guide.enabled',
      scope: @editor.getRootScopeDescriptor(),
      updateGuideCallback
    )

    updateGuidesCallback = (args) =>
      # ensure that multiple guides stay sorted in ascending order
      columns = uniqueAscending(args.newValue)
      if columns?.length
        atom.config.set('wrap-guide.columns', columns)
        atom.config.set 'editor.preferredLineLength', columns[columns.length - 1],
          scopeSelector: ".#{@editor.getGrammar().scopeName}"
        @updateGuide()
    @configSubscriptions.add atom.config.onDidChange(
      'wrap-guide.columns',
      scope: @editor.getRootScopeDescriptor(),
      updateGuidesCallback
    )

  getDefaultColumn: ->
    atom.config.get('editor.preferredLineLength', scope: @editor.getRootScopeDescriptor())

  getGuidesColumns: (path, scopeName) ->
    columns = atom.config.get('wrap-guide.columns', scope: @editor.getRootScopeDescriptor()) ? []
    return columns if columns.length > 0
    return [@getDefaultColumn()]

  isEnabled: ->
    atom.config.get('wrap-guide.enabled', scope: @editor.getRootScopeDescriptor()) ? true

  hide: ->
    @element.style.display = 'none'

  show: ->
    @element.style.display = 'block'

  updateGuide: ->
    if @isEnabled()
      @updateGuides()
    else
      @hide()

  updateGuides: ->
    @removeGuides()
    @appendGuides()
    if @element.children.length
      @show()
    else
      @hide()

  destroy: ->
    @element.remove()
    @subscriptions.dispose()
    @configSubscriptions.dispose()

  removeGuides: ->
    while @element.firstChild
      @element.removeChild(@element.firstChild)

  appendGuides: ->
    columns = @getGuidesColumns(@editor.getPath(), @editor.getGrammar().scopeName)
    for column in columns
      @appendGuide(column) unless column < 0

  appendGuide: (column) ->
    columnWidth = @editorElement.getDefaultCharacterWidth() * column
    columnWidth -= @editorElement.getScrollLeft()
    guide = document.createElement('div')
    guide.classList.add('wrap-guide')
    guide.style.left = "#{Math.round(columnWidth)}px"
    @element.appendChild(guide)
