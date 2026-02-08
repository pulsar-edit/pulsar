module.exports =
class ListView {
  // * `list` a {List} object
  // * `container` a jQuery element
  // * `createView` a Function that returns a jQuery element / HTMLElement
  //   * `item` the item to create the view for
  constructor(list, container, createView) {
    this.list = list
    this.container = container
    this.createView = createView
    this.views = []
    this.viewMap = {}
    this.list.onDidAddItem(item => this.addView(item))
    this.list.onDidRemoveItem(item => this.removeView(item))
    this.addViews()
  }

  getViews() {
    return this.views
  }

  filterViews(filterFn) {
    return this.list.filterItems(filterFn).map((item) => this.viewMap[this.list.keyForItem(item)])
  }

  addViews() {
    for (const item of this.list.getItems()) {
      this.addView(item)
    }
  }

  addView(item) {
    const view = this.createView(item)
    this.views.push(view)
    this.viewMap[this.list.keyForItem(item)] = view

    const row = document.createElement('div')
    row.classList.add('row')
    row.appendChild(view.element)
    this.container.insertBefore(row, this.container.children[0])
  }

  removeView(item) {
    const key = this.list.keyForItem(item)
    const view = this.viewMap[key]
    if (view) {
      const index = this.views.indexOf(view)
      if (index > -1) this.views.splice(index, 1)
      delete this.viewMap[key]
      view.element.parentElement.remove()
      view.destroy()
    }
  }
}
