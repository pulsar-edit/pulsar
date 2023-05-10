
class BookmarksProvider {
  constructor(main) {
    this.main = main
  }

  // Returns all bookmarks present in the given editor.
  //
  // Each bookmark tracks a buffer range and is represented by an instance of
  // {DisplayMarker}.
  //
  // Will return an empty array if there are no bookmarks in the given editor.
  //
  // Keep in mind that a single bookmark can span multiple buffer rows and/or
  // screen rows. Thus there isn't necessarily a 1:1 correlation between the
  // number of bookmarks in the editor and the number of bookmark icons that
  // the user will see in the gutter.
  getBookmarksForEditor(editor) {
    let instance = this.getInstanceForEditor(editor)
    if (!instance) return null
    return instance.getAllBookmarks()
  }

  // Returns the instance of the `Bookmarks` class that is responsible for
  // managing bookmarks in the given editor.
  getInstanceForEditor(editor) {
    return this.main.editorsBookmarks.find(b => b.editor.id === editor.id)
  }
}

module.exports = BookmarksProvider
