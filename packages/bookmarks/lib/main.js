const {CompositeDisposable} = require('atom')

const Bookmarks = require('./bookmarks')
const BookmarksView = require('./bookmarks-view')
const BookmarksProvider = require('./bookmarks-provider')

module.exports = {
  activate(bookmarksByEditorId) {
    this.bookmarksView = null
    this.editorsBookmarks = []
    this.disposables = new CompositeDisposable()
    const watchedEditors = new WeakSet()

    atom.commands.add('atom-workspace', 'bookmarks:view-all', async () => {
      if (this.bookmarksView == null) {
        this.bookmarksView = new BookmarksView(this.editorsBookmarks)
      }
      await this.bookmarksView.show()
    })

    atom.workspace.observeTextEditors(textEditor => {
      if (watchedEditors.has(textEditor)) {
        return
      }

      let bookmarks
      let state = bookmarksByEditorId[textEditor.id]
      if (state) {
        bookmarks = Bookmarks.deserialize(textEditor, state)
      } else {
        bookmarks = new Bookmarks(textEditor)
      }

      this.editorsBookmarks.push(bookmarks)
      watchedEditors.add(textEditor)
      this.disposables.add(textEditor.onDidDestroy(() => {
        const index = this.editorsBookmarks.indexOf(bookmarks)
        if (index !== -1) {
          this.editorsBookmarks.splice(index, 1)
        }

        bookmarks.destroy()
        watchedEditors.delete(textEditor)
      }))
    })
  },

  deactivate() {
    if (this.bookmarksView != null) {
      this.bookmarksView.destroy()
      this.bookmarksView = null
    }

    for (let bookmarks of this.editorsBookmarks) {
      bookmarks.deactivate()
    }
    this.disposables.dispose()
  },

  serialize() {
    const bookmarksByEditorId = {}
    for (let bookmarks of this.editorsBookmarks) {
      bookmarksByEditorId[bookmarks.editor.id] = bookmarks.serialize()
    }
    return bookmarksByEditorId
  },

  provideBookmarks() {
    this.bookmarksProvider ??= new BookmarksProvider(this)
    return this.bookmarksProvider
  }
}
