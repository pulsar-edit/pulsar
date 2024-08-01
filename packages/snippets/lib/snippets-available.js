/** @babel */

import _ from 'underscore-plus'
import SelectListView from 'atom-select-list'

export default class SnippetsAvailable {
  constructor (snippets) {
    this.panel = null
    this.snippets = snippets
    this.selectListView = new SelectListView({
      items: [],
      filterKeyForItem: (snippet) => snippet.searchText,
      elementForItem: (snippet) => {
        const li = document.createElement('li')
        li.classList.add('two-lines')

        const primaryLine = document.createElement('div')
        primaryLine.classList.add('primary-line')
        primaryLine.textContent = snippet.prefix
        li.appendChild(primaryLine)

        const secondaryLine = document.createElement('div')
        secondaryLine.classList.add('secondary-line')
        secondaryLine.textContent = snippet.name
        li.appendChild(secondaryLine)

        return li
      },
      didConfirmSelection: (snippet) => {
        for (const cursor of this.editor.getCursors()) {
          this.snippets.insert(snippet.bodyText, this.editor, cursor)
        }
        this.cancel()
      },
      didConfirmEmptySelection: () => {
        this.cancel()
      },
      didCancelSelection: () => {
        this.cancel()
      }
    })
    this.selectListView.element.classList.add('available-snippets')
    this.element = this.selectListView.element
  }

  async toggle (editor) {
    this.editor = editor
    if (this.panel != null) {
      this.cancel()
    } else {
      this.selectListView.reset()
      await this.populate()
      this.attach()
    }
  }

  cancel () {
    this.editor = null

    if (this.panel != null) {
      this.panel.destroy()
      this.panel = null
    }

    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }

  populate () {
    const snippets = Object.values(this.snippets.getSnippets(this.editor))
    for (let snippet of snippets) {
      snippet.searchText = _.compact([snippet.prefix, snippet.name]).join(' ')
    }
    return this.selectListView.update({items: snippets})
  }

  attach () {
    this.previouslyFocusedElement = document.activeElement
    this.panel = atom.workspace.addModalPanel({item: this})
    this.selectListView.focus()
  }
}
