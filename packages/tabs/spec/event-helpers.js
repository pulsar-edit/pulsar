const buildMouseEvent = (type, target, {which, ctrlKey, relatedTarget} = {}) => {
  const event = new MouseEvent(type, {bubbles: true, cancelable: true})
  if (which != null) {
    Object.defineProperty(event, 'which', {
      get () {
        return which
      }
    })
  }

  if (ctrlKey != null) {
    Object.defineProperty(event, 'ctrlKey', {
      get () {
        return ctrlKey
      }
    })
  }

  if (relatedTarget != null) {
    Object.defineProperty(event, 'relatedTarget', {
      get () {
        return relatedTarget
      }
    })
  }

  Object.defineProperty(event, 'target', {
    get () {
      return target
    }
  })

  Object.defineProperty(event, 'srcObject', {
    get () {
      return target
    }
  })

  spyOn(event, 'preventDefault')
  return event
}

module.exports.triggerMouseEvent = (type, target, {which, ctrlKey} = {}) => {
  const event = buildMouseEvent(type, target, {which, ctrlKey})
  target.dispatchEvent(event)
  return event
}

module.exports.triggerClickEvent = (target, options) => {
  const events = {
    mousedown: buildMouseEvent('mousedown', target, options),
    mouseup: buildMouseEvent('mouseup', target, options),
    click: buildMouseEvent('click', target, options)
  }

  target.dispatchEvent(events.mousedown)
  target.dispatchEvent(events.mouseup)
  target.dispatchEvent(events.click)

  return events
}

module.exports.buildDragEvents = (dragged, dropTarget) => {
  const dataTransfer = {
    data: {},
    setData (key, value) {
      this.data[key] = `${value}` // Drag events stringify data values
    },
    getData (key) {
      return this.data[key]
    },
    clearData (key) {
      if (key) {
        delete this.data[key]
      } else {
        this.data = {}
      }
    }
  }

  Object.defineProperty(
    dataTransfer,
    'items', {
      get () {
        return Object.keys(dataTransfer.data).map(key => ({type: key}))
      }
    }
  )

  const dragStartEvent = buildMouseEvent('dragstart', dragged)
  Object.defineProperty(dragStartEvent, 'dataTransfer', {
    get () {
      return dataTransfer
    }
  })

  const dropEvent = buildMouseEvent('drop', dropTarget)
  Object.defineProperty(dropEvent, 'dataTransfer', {
    get () {
      return dataTransfer
    }
  })

  return [dragStartEvent, dropEvent]
}

module.exports.buildDragEnterLeaveEvents = (enterRelatedTarget, leaveRelatedTarget) => {
  const dataTransfer = {
    data: {},
    setData (key, value) {
      this.data[key] = `${value}` // Drag events stringify data values
    },
    getData (key) {
      return this.data[key]
    },
    clearData (key) {
      if (key) {
        delete this.data[key]
      } else {
        this.data = {}
      }
    }
  }

  Object.defineProperty(
    dataTransfer,
    'items', {
      get () {
        return Object.keys(dataTransfer.data).map(key => ({type: key}))
      }
    }
  )

  const dragEnterEvent = buildMouseEvent('dragenter', null, {relatedTarget: enterRelatedTarget})
  Object.defineProperty(dragEnterEvent, 'dataTransfer', {
    get () {
      return dataTransfer
    }
  })
  dragEnterEvent.dataTransfer.setData('atom-tab-event', 'true')

  const dragLeaveEvent = buildMouseEvent('dragleave', null, {relatedTarget: leaveRelatedTarget})
  Object.defineProperty(dragLeaveEvent, 'dataTransfer', {
    get () {
      return dataTransfer
    }
  })
  dragLeaveEvent.dataTransfer.setData('atom-tab-event', 'true')

  return [dragEnterEvent, dragLeaveEvent]
}

module.exports.buildWheelEvent = delta => new WheelEvent('mousewheel', {wheelDeltaY: delta})

module.exports.buildWheelPlusShiftEvent = delta => new WheelEvent('mousewheel', {wheelDeltaY: delta, shiftKey: true})
