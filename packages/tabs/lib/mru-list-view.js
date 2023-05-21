'use babel'

import MRUItemView from './mru-item-view'
import {CompositeDisposable} from 'atom'

const displayListConfigKey = 'tabs.displayMruTabList'

export default class MRUListView {
  initialize (pane) {
    this.ownerDiv = document.createElement('div')
    this.element = document.createElement('ol')
    this.ownerDiv.appendChild(this.element)
    this.ownerDiv.classList.add('select-list', 'tabs-mru-switcher')

    this.pane = pane
    this.pendingShow = false
    this.subscribe()
    this.panel = atom.workspace.addModalPanel({
      item: this.ownerDiv,
      visible: false
    })
    this.element.classList.add('list-group')

    this.displayMruList = atom.config.get(displayListConfigKey)
    this.hideClickHandler = this.hide.bind(this)
    this.preventPropagationClickHandler = this.preventPropagation.bind(this)
  }

  subscribe () {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.config.observe(
      displayListConfigKey,
      (newValue) => (this.displayMruList = newValue)))

    /* Check for existence of events. Allows package tests to pass until this
    change hits stable. */
    if (typeof this.pane.onChooseNextMRUItem === 'function') {
      /* Because the chosen item is passed in the callback, both the
      ChooseNext and ChooseLast events can call our our single choose
      method. */
      this.subscriptions.add(
        this.pane.onChooseNextMRUItem((item) => this.choose(item)))
      this.subscriptions.add(
        this.pane.onChooseLastMRUItem((item) => this.choose(item)))

      this.subscriptions.add(
        this.pane.onDoneChoosingMRUItem(() => this.stopChoosing()))
    }

    this.subscriptions.add(
      this.pane.onDidDestroy(() => this.destroy()))

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'core:cancel': (event) => {
          if (this.hide()) event.stopPropagation()
        }
      })
    )
  }

  destroy () {
    this.subscriptions.dispose()
    this.panel.destroy()
  }

  choose (selectedItem) {
    if (this.displayMruList) {
      this.pendingShow = true
      this.show(selectedItem)
    }
  }

  stopChoosing () {
    if (this.displayMruList) {
      this.pendingShow = false
      this.hide()
    }
  }

  show (selectedItem) {
    let selectedViewElement
    if (!this.panel.visible) {
      window.setTimeout(() => {
        if (!this.pendingShow) return
        selectedViewElement = this.buildListView(selectedItem)
        this.panel.show()
        this.addClickHandlers()
        this.scrollToItemView(selectedViewElement)
      }, 150)
    } else {
      selectedViewElement = this.updateSelectedItem(selectedItem)
      this.scrollToItemView(selectedViewElement)
    }
  }

  preventPropagation () {
    event.stopPropagation()
  }

  addClickHandlers () {
    document.body.addEventListener('click', this.hideClickHandler)
    this.ownerDiv.addEventListener('click', this.preventPropagationClickHandler)
  }

  removeClickHandler () {
    document.body.removeEventListener('click', this.hideClickHandler)
    this.ownerDiv.removeEventListener('click', this.preventPropagationClickHandler)
  }

  hide () {
    const willClose = this.panel.visible
    if (willClose) {
      this.removeClickHandler()
      this.panel.hide()
    }
    return willClose
  }

  updateSelectedItem (selectedItem) {
    let selectedView
    for (let viewElement of this.element.children) {
      if (viewElement.itemViewData.item === selectedItem) {
        viewElement.itemViewData.select()
        selectedView = viewElement
      } else viewElement.itemViewData.unselect()
    }
    return selectedView
  }

  scrollToItemView (view) {
    const desiredTop = view.offsetTop
    const desiredBottom = desiredTop + view.offsetHeight

    if (desiredTop < this.element.scrollTop) {
      this.element.scrollTop = desiredTop
    } else if (desiredBottom > this.element.scrollTop + this.element.clientHeight) {
      this.element.scrollTop = desiredBottom - this.element.clientHeight
    }
  }

  buildListView (selectedItem) {
    /* Making this more efficient, and not simply building the view for the
    entire stack every time it's shown, has significant complexity cost.
    The pane system completely owns the MRU stack. Adding events and
    handlers to incrementally update the UI here would mean two copies of
    the stack to maintain and keep in sync. Let's take on that complexity
    only if this exhibits real-world performance issues. */
    while (this.element.firstChild) this.element.removeChild(this.element.firstChild)

    let selectedViewElement
    /* We're inserting each item at the top so we traverse the stack from
    the bottom, resulting in the most recently used item at the top of the
    UI. */
    for (let i = this.pane.itemStack.length - 1; i >= 0; i--) {
      let item = this.pane.itemStack[i]
      let itemView = new MRUItemView()
      itemView.initialize(this, item)
      if (itemView.disposables) {
        this.subscriptions.add(itemView.disposables)
      }
      this.element.appendChild(itemView.element)
      if (item === selectedItem) {
        itemView.select()
        selectedViewElement = itemView
      }
    }
    return selectedViewElement.element
  }
}
