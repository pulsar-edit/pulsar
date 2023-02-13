_ = require 'underscore-plus'

module.exports =
class SelectionCountView
  constructor: ->
    @element = document.createElement('status-bar-selection')
    @element.classList.add('selection-count', 'inline-block')

    @tooltipElement = document.createElement('div')
    @tooltipDisposable = atom.tooltips.add @element, item: @tooltipElement

    @formatString = atom.config.get('status-bar.selectionCountFormat') ? '(%L, %C)'

    @activeItemSubscription = atom.workspace.onDidChangeActiveTextEditor => @subscribeToActiveTextEditor()

    @subscribeToConfig()
    @subscribeToActiveTextEditor()

  destroy: ->
    @activeItemSubscription.dispose()
    @selectionSubscription?.dispose()
    @configSubscription?.dispose()
    @tooltipDisposable.dispose()

  subscribeToConfig: ->
    @configSubscription?.dispose()
    @configSubscription = atom.config.observe 'status-bar.selectionCountFormat', (value) =>
      @formatString = value ? '(%L, %C)'
      @scheduleUpdateCount()

  subscribeToActiveTextEditor: ->
    @selectionSubscription?.dispose()
    activeEditor = @getActiveTextEditor()
    selectionsMarkerLayer = activeEditor?.selectionsMarkerLayer
    @selectionSubscription = selectionsMarkerLayer?.onDidUpdate(@scheduleUpdateCount.bind(this))
    @scheduleUpdateCount()

  getActiveTextEditor: ->
    atom.workspace.getActiveTextEditor()

  scheduleUpdateCount: ->
    unless @scheduledUpdate
      @scheduledUpdate = true
      atom.views.updateDocument =>
        @updateCount()
        @scheduledUpdate = false

  updateCount: ->
    count = @getActiveTextEditor()?.getSelectedText().length
    range = @getActiveTextEditor()?.getSelectedBufferRange()
    lineCount = range?.getRowCount()
    lineCount -= 1 if range?.end.column is 0
    if count > 0
      @element.textContent = @formatString.replace('%L', lineCount).replace('%C', count)
      @tooltipElement.textContent = "#{_.pluralize(lineCount, 'line')}, #{_.pluralize(count, 'character')} selected"
    else
      @element.textContent = ''
      @tooltipElement.textContent = ''
