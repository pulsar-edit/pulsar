const _ = require('underscore-plus')
const SelectListView = require('pulsar-select-list')

module.exports =
class SnippetsAvailable {
  constructor (snippets) {
    this.snippets = snippets
    this.selectList = new SelectListView({
      className: 'available-snippets',
      items: [],
      filterKeyForItem: (snippet) => snippet.searchText,
      elementForItem: (snippet) => {
        return SelectListView.createTwoLineItem({
          primary: snippet.prefix,
          secondary: snippet.name
        })
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
  }

  get element () { return this.selectList.element }

  async toggle (editor) {
    this.editor = editor
    if (this.selectList.isVisible()) {
      this.cancel()
    } else {
      this.selectList.reset()
      await this.populate()
      if (!this.selectList.panel) {
        this.selectList.panel = atom.workspace.addModalPanel({ item: this, visible: false })
      }
      this.selectList.show()
    }
  }

  cancel () {
    this.editor = null
    this.selectList.hide()
  }

  populate () {
    const snippets = Object.values(this.snippets.getSnippets(this.editor))
    for (let snippet of snippets) {
      snippet.searchText = _.compact([snippet.prefix, snippet.name]).join(' ')
    }
    return this.selectList.update({items: snippets})
  }
}
