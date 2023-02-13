module.exports =
class Tile
  constructor: (@item, @priority, @collection) ->

  getItem: ->
    @item

  getPriority: ->
    @priority

  destroy: ->
    @collection.splice(@collection.indexOf(this), 1)
    atom.views.getView(@item).remove()
