module.exports = {
  activate () {
    this.view = document.createElement('div')
    atom.workspace.getElement().appendChild(this.view)
    this.view.classList.add('tabs-layout-overlay')
  },

  deactivate () {
    if (this.view.parentElement) {
      this.view.parentElement.removeChild(this.view)
    }
  },

  test: {},

  drag (e) {
    this.lastCoords = e
    const pane = this.getPaneAt(e)
    const itemView = this.getItemViewAt(e)
    const {item} = e.target
    if (pane && itemView && item && this.itemIsAllowedInPane(item, pane)) {
      let coords
      if (!this.isOnlyTabInPane(pane, e.target) && pane.getItems().length !== 0) {
        coords = [e.clientX, e.clientY]
      }
      this.lastSplit = this.updateView(itemView, coords)
    } else {
      this.disableView()
    }
  },

  end (e) {
    this.disableView()
    if (this.lastCoords == null || !this.getItemViewAt(this.lastCoords)) {
      return
    }

    const target = this.getPaneAt(this.lastCoords)
    if (target == null) {
      return
    }

    const tab = e.target
    const fromPane = tab.pane
    const {item} = tab

    if (!this.itemIsAllowedInPane(item, target)) {
      return
    }

    let toPane
    switch (this.lastSplit) {
      case 'left':
        toPane = target.splitLeft()
        break
      case 'right':
        toPane = target.splitRight()
        break
      case 'up':
        toPane = target.splitUp()
        break
      case 'down':
        toPane = target.splitDown()
        break
      default:
        toPane = target
    }

    if (toPane === fromPane) {
      return
    }

    fromPane.moveItemToPane(item, toPane)
    toPane.activateItem(item)
    toPane.activate()
  },

  getElement ({clientX, clientY}, selector) {
    if (selector == null) {
      selector = '*'
    }
    return document.elementFromPoint(clientX, clientY)?.closest(selector)
  },

  getItemViewAt (coords) {
    return this.test.itemView || this.getElement(coords, '.item-views')
  },

  getPaneAt () {
    if (this.test.pane) {
      return this.test.pane
    } else {
      const element = this.getElement(this.lastCoords, 'atom-pane')
      if (element) {
        return element.getModel()
      }
    }
  },

  isOnlyTabInPane (pane, tab) {
    return pane.getItems().length === 1 && pane === tab.pane
  },

  normalizeCoords ({left, top, width, height}, [x, y]) {
    return [(x - left) / width, (y - top) / height]
  },

  splitType ([x, y]) {
    if (x < (1 / 3)) {
      return 'left'
    } else if (x > (2 / 3)) {
      return 'right'
    } else if (y < (1 / 3)) {
      return 'up'
    } else if (y > (2 / 3)) {
      return 'down'
    }
  },

  boundsForSplit (split) {
    switch (split) {
      case 'left': return [0, 0, 0.5, 1]
      case 'right': return [0.5, 0, 0.5, 1]
      case 'up': return [0, 0, 1, 0.5]
      case 'down': return [0, 0.5, 1, 0.5]
      default: return [0, 0, 1, 1]
    }
  },

  innerBounds ({left, top, width, height}, [x, y, w, h]) {
    left += x * width
    top += y * height
    width *= w
    height *= h
    return {left, top, width, height}
  },

  updateViewBounds ({left, top, width, height}) {
    this.view.style.left = `${left}px`
    this.view.style.top = `${top}px`
    this.view.style.width = `${width}px`
    this.view.style.height = `${height}px`
  },

  updateView (pane, coords) {
    this.view.classList.add('visible')
    const rect = this.test.rect || pane.getBoundingClientRect()
    const split = coords ? this.splitType(this.normalizeCoords(rect, coords)) : undefined
    this.updateViewBounds(this.innerBounds(rect, this.boundsForSplit(split)))
    return split
  },

  disableView () {
    this.view.classList.remove('visible')
  },

  itemIsAllowedInPane (item, pane) {
    if (typeof item.getAllowedLocations === 'function') {
      const allowedLocations = item.getAllowedLocations()
      if (allowedLocations == null) {
        return true
      }

      const container = pane.getContainer()
      let location = 'center'
      if (typeof container.getLocation === 'function') {
        location = container.getLocation() || 'center'
      }

      return allowedLocations.includes(location)
    }
    return true
  }
}
