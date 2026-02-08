const path = require('path')

const SelectListView = require('pulsar-select-list')

module.exports =
class BookmarksView {
  constructor(editorsBookmarks) {
    this.editorsBookmarks = editorsBookmarks
    this.selectList = new SelectListView({
      className: 'bookmarks-view',
      emptyMessage: 'No bookmarks found',
      items: [],
      filterKeyForItem: (bookmark) => bookmark.filterText,
      didConfirmSelection: ({editor, marker}) => {
        this.hide()
        editor.setSelectedBufferRange(marker.getBufferRange(), {autoscroll: true})
        atom.workspace.paneForItem(editor).activate()
        atom.workspace.paneForItem(editor).activateItem(editor)
      },
      didCancelSelection: () => {
        this.hide()
      },
      elementForItem: ({marker, editor}) => {
        const bookmarkStartRow = marker.getStartBufferPosition().row
        const bookmarkEndRow = marker.getEndBufferPosition().row
        const bookmarkPath = editor.getPath() ? path.basename(editor.getPath()) : 'untitled'
        let bookmarkLocation = `${bookmarkPath}:${bookmarkStartRow + 1}`
        if (bookmarkStartRow !== bookmarkEndRow) {
          bookmarkLocation += `-${bookmarkEndRow + 1}`
        }

        const lineText = editor.lineTextForBufferRow(bookmarkStartRow)
        const li = document.createElement('li')
        li.classList.add('bookmark')
        const primaryLine = document.createElement('div')
        primaryLine.classList.add('primary-line')
        primaryLine.textContent = bookmarkLocation
        li.appendChild(primaryLine)
        if (lineText) {
          const secondaryLine = document.createElement('div')
          secondaryLine.classList.add('secondary-line', 'line-text')
          secondaryLine.textContent = lineText.trim()
          li.appendChild(secondaryLine)
          li.classList.add('two-lines')
        }
        return li
      }
    })
  }

  destroy() {
    this.selectList.destroy()
  }

  async show() {
    const bookmarks = []
    for (const {editor, markerLayer} of this.editorsBookmarks) {
      for (const marker of markerLayer.getMarkers()) {
        let filterText = `${marker.getStartBufferPosition().row}`

        if (editor.getPath()) {
          filterText += ` ${editor.getPath()}`
        }

        const bookmarkedLineText = editor.lineTextForBufferRow(marker.getStartBufferPosition().row)
        if (bookmarkedLineText) {
          filterText += ` ${bookmarkedLineText.trim()}`
        }

        bookmarks.push({marker, editor, filterText})
      }
    }

    this.selectList.reset()
    await this.selectList.update({items: bookmarks})
    this.selectList.show()
  }

  hide() {
    this.selectList.hide()
  }
}
