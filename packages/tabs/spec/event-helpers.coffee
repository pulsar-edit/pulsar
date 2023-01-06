buildMouseEvent = (type, target, {button, ctrlKey}={}) ->
  event = new MouseEvent(type, {bubbles: true, cancelable: true})
  Object.defineProperty(event, 'button', get: -> button) if button?
  Object.defineProperty(event, 'ctrlKey', get: -> ctrlKey) if ctrlKey?
  Object.defineProperty(event, 'target', get: -> target)
  Object.defineProperty(event, 'srcObject', get: -> target)
  spyOn(event, "preventDefault")
  event

module.exports.triggerMouseEvent = (type, target, {which, ctrlKey}={}) ->
  event = buildMouseEvent(arguments...)
  target.dispatchEvent(event)
  event

module.exports.triggerClickEvent = (target, options) ->
  events = {
    mousedown: buildMouseEvent('mousedown', target, options),
    mouseup: buildMouseEvent('mouseup', target, options),
    click: buildMouseEvent('click', target, options)
  }

  target.dispatchEvent(events.mousedown)
  target.dispatchEvent(events.mouseup)
  target.dispatchEvent(events.click)

  events

module.exports.buildDragEvents = (dragged, dropTarget) ->
  dataTransfer =
    data: {}
    setData: (key, value) -> @data[key] = "#{value}" # Drag events stringify data values
    getData: (key) -> @data[key]

  Object.defineProperty(
    dataTransfer,
    'items',
    get: ->
      Object.keys(dataTransfer.data).map((key) -> {type: key})
  )

  dragStartEvent = buildMouseEvent("dragstart", dragged)
  Object.defineProperty(dragStartEvent, 'dataTransfer', get: -> dataTransfer)

  dropEvent = buildMouseEvent("drop", dropTarget)
  Object.defineProperty(dropEvent, 'dataTransfer', get: -> dataTransfer)

  [dragStartEvent, dropEvent]

module.exports.buildWheelEvent = (delta) ->
  new WheelEvent("mousewheel", wheelDeltaY: delta)

module.exports.buildWheelPlusShiftEvent = (delta) ->
  new WheelEvent("mousewheel", wheelDeltaY: delta, shiftKey: true)
