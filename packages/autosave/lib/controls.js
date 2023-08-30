const tests = []

module.exports = {
  // Public: Add a predicate to set of tests
  //
  // * `predicate` A {Function} determining if a {PaneItem} should autosave.
  //
  // Returns `undefined`.
  dontSaveIf (predicate) {
    tests.push(predicate)
  },

  // Public: Test whether a paneItem should be autosaved.
  //
  // * `paneItem` A pane item {Object}.
  //
  // Returns `Boolean`.
  shouldSave (paneItem) {
    return !tests.some(test => test(paneItem))
  }
}
