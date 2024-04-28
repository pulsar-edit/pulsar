const SnippetHistoryProvider = require('./snippet-history-provider')

class EditorStore {
  constructor (editor) {
    this.editor = editor
    this.buffer = this.editor.getBuffer()
    this.observer = null
    this.checkpoint = null
    this.expansions = []
    this.existingHistoryProvider = null
  }

  getExpansions () {
    return this.expansions
  }

  setExpansions (list) {
    this.expansions = list
  }

  clearExpansions () {
    this.expansions = []
  }

  addExpansion (snippetExpansion) {
    this.expansions.push(snippetExpansion)
  }

  observeHistory (delegates) {
    let isObservingHistory = this.existingHistoryProvider != null
    if (isObservingHistory) {
      return
    } else {
      this.existingHistoryProvider = this.buffer.historyProvider
    }

    const newProvider = SnippetHistoryProvider(this.existingHistoryProvider, delegates)
    this.buffer.setHistoryProvider(newProvider)
  }

  stopObservingHistory (editor) {
    if (this.existingHistoryProvider == null) { return }
    this.buffer.setHistoryProvider(this.existingHistoryProvider)
    this.existingHistoryProvider = null
  }

  observe (callback) {
    if (this.observer != null) { this.observer.dispose() }
    this.observer = this.buffer.onDidChangeText(callback)
  }

  stopObserving () {
    if (this.observer == null) { return false }
    this.observer.dispose()
    this.observer = null
    return true
  }

  makeCheckpoint () {
    const existing = this.checkpoint
    if (existing) {
      this.buffer.groupChangesSinceCheckpoint(existing)
    }
    this.checkpoint = this.buffer.createCheckpoint()
  }
}

EditorStore.store = new WeakMap()
EditorStore.findOrCreate = function (editor) {
  if (!this.store.has(editor)) {
    this.store.set(editor, new EditorStore(editor))
  }
  return this.store.get(editor)
}

module.exports = EditorStore
