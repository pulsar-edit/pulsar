module.exports.buildInternalDragEvents = (dragged, enterTarget, dropTarget, treeView, copy = false) ->
  dataTransfer =
    data: {}
    setData: (key, value) -> @data[key] = "#{value}" # Drag events stringify data values
    getData: (key) -> @data[key]
    clearData: (key) ->
      if key
        delete @data[key]
      else
        @data = {}
    setDragImage: (@image) -> return

  Object.defineProperty(
    dataTransfer,
    'items',
    get: ->
      Object.keys(dataTransfer.data).map((key) -> {type: key})
  )

  treeView.deselect()
  for entry in dragged
    treeView.selectMultipleEntries(entry)

  dragStartEvent = new DragEvent('dragstart')
  Object.defineProperty(dragStartEvent, 'target', value: dragged[0])
  Object.defineProperty(dragStartEvent, 'currentTarget', value: dragged[0])
  Object.defineProperty(dragStartEvent, 'dataTransfer', value: dataTransfer)

  dropEvent = new DragEvent('drop')
  Object.defineProperty(dropEvent, 'target', value: dropTarget)
  Object.defineProperty(dropEvent, 'currentTarget', value: dropTarget)
  Object.defineProperty(dropEvent, 'dataTransfer', value: dataTransfer)
  if copy
    key = if process.platform is 'darwin' then 'metaKey' else 'ctrlKey'
    Object.defineProperty(dropEvent, key, value: true)

  dragEnterEvent = new DragEvent('dragenter')
  Object.defineProperty(dragEnterEvent, 'target', value: enterTarget)
  Object.defineProperty(dragEnterEvent, 'currentTarget', value: enterTarget)
  Object.defineProperty(dragEnterEvent, 'dataTransfer', value: dataTransfer)

  [dragStartEvent, dragEnterEvent, dropEvent]

module.exports.buildExternalDropEvent = (filePaths, dropTarget, copy = false) ->
  dataTransfer =
    data: {}
    setData: (key, value) -> @data[key] = "#{value}" # Drag events stringify data values
    getData: (key) -> @data[key]
    clearData: (key) ->
      if key
        delete @data[key]
      else
        @data = {}
    files: []

  Object.defineProperty(
    dataTransfer,
    'items',
    get: ->
      Object.keys(dataTransfer.data).map((key) -> {type: key, kind: 'file'})
  )

  dropEvent = new DragEvent('drop')
  Object.defineProperty(dropEvent, 'target', value: dropTarget)
  Object.defineProperty(dropEvent, 'currentTarget', value: dropTarget)
  Object.defineProperty(dropEvent, 'dataTransfer', value: dataTransfer)
  if copy
    key = if process.platform is 'darwin' then 'metaKey' else 'ctrlKey'
    Object.defineProperty(dropEvent, key, value: true)

  for filePath in filePaths
    dropEvent.dataTransfer.files.push({path: filePath})
    dropEvent.dataTransfer.setData(filePath, 'bla') # Not technically correct, but gets the job done

  dropEvent

buildElementPositionalDragEvents = (el, dataTransfer, currentTargetSelector) ->
  if not el?
    return {}

  currentTarget = if currentTargetSelector then el.closest(currentTargetSelector) else el

  topEvent = new DragEvent('dragover')
  Object.defineProperty(topEvent, 'target', value: el)
  Object.defineProperty(topEvent, 'currentTarget', value: currentTarget)
  Object.defineProperty(topEvent, 'dataTransfer', value: dataTransfer)
  Object.defineProperty(topEvent, 'pageY', value: el.getBoundingClientRect().top)

  middleEvent = new DragEvent('dragover')
  Object.defineProperty(middleEvent, 'target', value: el)
  Object.defineProperty(middleEvent, 'currentTarget', value: currentTarget)
  Object.defineProperty(middleEvent, 'dataTransfer', value: dataTransfer)
  Object.defineProperty(middleEvent, 'pageY', value: el.getBoundingClientRect().top + el.offsetHeight * 0.5)

  bottomEvent = new DragEvent('dragover')
  Object.defineProperty(bottomEvent, 'target', value: el)
  Object.defineProperty(bottomEvent, 'currentTarget', value: currentTarget)
  Object.defineProperty(bottomEvent, 'dataTransfer', value: dataTransfer)
  Object.defineProperty(bottomEvent, 'pageY', value: el.getBoundingClientRect().bottom)

  {top: topEvent, middle: middleEvent, bottom: bottomEvent}


module.exports.buildPositionalDragEvents = (dragged, target, currentTargetSelector) ->
  dataTransfer =
    data: {}
    setData: (key, value) -> @data[key] = "#{value}" # Drag events stringify data values
    getData: (key) -> @data[key]
    clearData: (key) ->
      if key
        delete @data[key]
      else
        @data = {}
    setDragImage: (@image) -> return

  Object.defineProperty(
    dataTransfer,
    'items',
    get: ->
      Object.keys(dataTransfer.data).map((key) -> {type: key})
  )

  dragStartEvent = new DragEvent('dragstart')
  Object.defineProperty(dragStartEvent, 'target', value: dragged)
  Object.defineProperty(dragStartEvent, 'currentTarget', value: dragged)
  Object.defineProperty(dragStartEvent, 'dataTransfer', value: dataTransfer)

  dragEndEvent = new DragEvent('dragend')
  Object.defineProperty(dragEndEvent, 'target', value: dragged)
  Object.defineProperty(dragEndEvent, 'currentTarget', value: dragged)
  Object.defineProperty(dragEndEvent, 'dataTransfer', value: dataTransfer)

  [dragStartEvent, buildElementPositionalDragEvents(target, dataTransfer, currentTargetSelector), dragEndEvent]
