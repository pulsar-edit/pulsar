{Disposable} = require 'atom'
Tile = require './tile'

module.exports =
class StatusBarView
  constructor: ->
    @element = document.createElement('status-bar')
    @element.classList.add('status-bar')

    flexboxHackElement = document.createElement('div')
    flexboxHackElement.classList.add('flexbox-repaint-hack')
    @element.appendChild(flexboxHackElement)

    @leftPanel = document.createElement('div')
    @leftPanel.classList.add('status-bar-left')
    flexboxHackElement.appendChild(@leftPanel)
    @element.leftPanel = @leftPanel

    @rightPanel = document.createElement('div')
    @rightPanel.classList.add('status-bar-right')
    flexboxHackElement.appendChild(@rightPanel)
    @element.rightPanel = @rightPanel

    @leftTiles = []
    @rightTiles = []

    @element.getLeftTiles = @getLeftTiles.bind(this)
    @element.getRightTiles = @getRightTiles.bind(this)
    @element.addLeftTile = @addLeftTile.bind(this)
    @element.addRightTile = @addRightTile.bind(this)

    @bufferSubscriptions = []

    @activeItemSubscription = atom.workspace.getCenter().onDidChangeActivePaneItem =>
      @unsubscribeAllFromBuffer()
      @storeActiveBuffer()
      @subscribeAllToBuffer()

      @element.dispatchEvent(new CustomEvent('active-buffer-changed', bubbles: true))

    @storeActiveBuffer()

  destroy: ->
    @activeItemSubscription.dispose()
    @unsubscribeAllFromBuffer()
    @element.remove()

  addLeftTile: (options) ->
    newItem = options.item
    newPriority = options?.priority ? @leftTiles[@leftTiles.length - 1].priority + 1
    nextItem = null
    for {priority, item}, index in @leftTiles
      if priority > newPriority
        nextItem = item
        break

    newTile = new Tile(newItem, newPriority, @leftTiles)
    @leftTiles.splice(index, 0, newTile)
    newElement = atom.views.getView(newItem)
    nextElement = atom.views.getView(nextItem)
    @leftPanel.insertBefore(newElement, nextElement)
    newTile

  addRightTile: (options) ->
    newItem = options.item
    newPriority = options?.priority ? @rightTiles[0].priority + 1
    nextItem = null
    for {priority, item}, index in @rightTiles
      if priority < newPriority
        nextItem = item
        break

    newTile = new Tile(newItem, newPriority, @rightTiles)
    @rightTiles.splice(index, 0, newTile)
    newElement = atom.views.getView(newItem)
    nextElement = atom.views.getView(nextItem)
    @rightPanel.insertBefore(newElement, nextElement)
    newTile

  getLeftTiles: ->
    @leftTiles

  getRightTiles: ->
    @rightTiles

  getActiveBuffer: ->
    @buffer

  getActiveItem: ->
    atom.workspace.getCenter().getActivePaneItem()

  storeActiveBuffer: ->
    @buffer = @getActiveItem()?.getBuffer?()

  subscribeToBuffer: (event, callback) ->
    @bufferSubscriptions.push([event, callback])
    @buffer.on(event, callback) if @buffer

  subscribeAllToBuffer: ->
    return unless @buffer
    for [event, callback] in @bufferSubscriptions
      @buffer.on(event, callback)

  unsubscribeAllFromBuffer: ->
    return unless @buffer
    for [event, callback] in @bufferSubscriptions
      @buffer.off(event, callback)
