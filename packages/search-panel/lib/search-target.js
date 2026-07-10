// A SearchTarget is the thing FindView searches and navigates. It abstracts away
// "what is being searched" so the buffer find UI can drive either a real text
// editor (EditorSearchTarget, below) or a custom view supplied by another
// package through the search-adapter contract (AdapterSearchTarget).
//
// The interface FindView depends on:
//   isUsable(): boolean
//   getFindOptions(): FindOptions
//   onDidUpdate(cb) / onDidError(cb) / onDidChangeCurrentResult(cb): Disposable
//   search(pattern, options?): void
//   patternMatchesEmptyString(pattern): boolean
//   getResultCount(): number
//   getCurrentResultIndex(): number            // -1 when nothing is current
//   hasSelectionMatchingResult(): boolean
//   selectNext() / selectPrevious() / selectFirstFromCursor() / selectAll()
//                                              -> { found, wrapped }  (wrapped: "up"|"down"|null)
//   replaceCurrentMatch(replaceText, direction): void   // direction: "next"|"previous"
//   replaceAll(replaceText): void
//   getSelectedText(): string
//   getWordUnderCursor(): string
//   getWrapIconHost(): HTMLElement | null

const { Disposable } = require("atom");
const FindOptions = require("./find-options");

// Wraps a BufferSearch model (which tracks the active TextEditor) and implements
// the SearchTarget interface using buffer markers and editor selection/scroll.
// This is the behaviour the FindView used to implement inline; it is unchanged,
// only relocated behind the interface.
class EditorSearchTarget {
  constructor(model) {
    this.model = model; // BufferSearch
  }

  isUsable() {
    return this.model.getEditor() != null;
  }

  canReplace() {
    return true;
  }

  getFindOptions() {
    return this.model.getFindOptions();
  }

  onDidUpdate(callback) {
    return this.model.onDidUpdate(callback);
  }

  onDidError(callback) {
    return this.model.onDidError(callback);
  }

  onDidChangeCurrentResult(callback) {
    return this.model.onDidChangeCurrentResult(callback);
  }

  search(findPattern, options) {
    return this.model.search(findPattern, options);
  }

  patternMatchesEmptyString(findPattern) {
    return this.model.patternMatchesEmptyString(findPattern);
  }

  markers() {
    return this.model.markers || [];
  }

  getResultCount() {
    return this.markers().length;
  }

  getCurrentResultIndex() {
    return this.markers().indexOf(this.model.currentResultMarker);
  }

  hasSelectionMatchingResult() {
    const editor = this.model.getEditor();
    if (!editor) return false;
    return editor
      .getSelectedBufferRanges()
      .some((selectedRange) => this.model.findMarker(selectedRange));
  }

  // --- navigation -----------------------------------------------------------

  selectNext() {
    return this._selectAt(this._indexAfterCursor(false));
  }

  selectFirstFromCursor() {
    return this._selectAt(this._indexAfterCursor(true));
  }

  selectPrevious() {
    return this._selectAt(this._indexBeforeCursor());
  }

  selectAll() {
    const markers = this.markers();
    if (markers.length === 0) return { found: false, wrapped: null };
    const editor = this.model.getEditor();
    const ranges = Array.from(markers).map((marker) => marker.getBufferRange());
    const after = this._indexAfterCursor(false);
    const scrollMarker = markers[(after && after.index) || 0];
    for (const range of ranges) {
      editor.unfoldBufferRow(range.start.row);
    }
    editor.setSelectedBufferRanges(ranges, { flash: true });
    editor.scrollToBufferPosition(scrollMarker.getStartBufferPosition(), { center: true });
    return { found: true, wrapped: null };
  }

  _indexAfterCursor(indexIncluded = false) {
    const editor = this.model.getEditor();
    const markers = this.markers();
    if (!editor || markers.length === 0) return null;

    const selection = editor.getLastSelection();
    let { start, end } = selection.getBufferRange();
    if (selection.isReversed()) start = end;

    for (let index = 0, length = markers.length; index < length; index++) {
      const markerStartPosition = markers[index].bufferMarker.getStartPosition();
      switch (markerStartPosition.compare(start)) {
        case -1:
          continue;
        case 0:
          if (!indexIncluded) continue;
          break;
      }
      return { index, wrapped: null };
    }
    return { index: 0, wrapped: "up" };
  }

  _indexBeforeCursor() {
    const editor = this.model.getEditor();
    const markers = this.markers();
    if (!editor || markers.length === 0) return null;

    const selection = editor.getLastSelection();
    let { start, end } = selection.getBufferRange();
    if (selection.isReversed()) start = end;

    for (let index = markers.length - 1; index >= 0; index--) {
      if (markers[index].bufferMarker.getEndPosition().isLessThan(start)) {
        return { index, wrapped: null };
      }
    }
    return { index: markers.length - 1, wrapped: "down" };
  }

  _selectAt(found) {
    if (!found) return { found: false, wrapped: null };
    const markers = this.markers();
    const marker = markers[found.index];
    if (!marker) return { found: false, wrapped: null };

    const editor = this.model.getEditor();
    const bufferRange = marker.getBufferRange();
    const screenRange = marker.getScreenRange();
    const outOfView =
      screenRange.start.row < editor.getFirstVisibleScreenRow() ||
      screenRange.end.row > editor.getLastVisibleScreenRow();

    editor.unfoldBufferRow(bufferRange.start.row);
    editor.setSelectedBufferRange(bufferRange, { flash: true });
    editor.scrollToCursorPosition({ center: true });
    return { found: true, wrapped: outOfView ? found.wrapped : null };
  }

  // --- replace --------------------------------------------------------------

  replaceCurrentMatch(replaceText, direction = "next") {
    const markers = this.markers();
    if (markers.length === 0) return;
    let currentMarker = this.model.currentResultMarker;
    if (!currentMarker) {
      const position =
        direction === "previous" ? this._indexBeforeCursor() : this._indexAfterCursor(true);
      if (position) currentMarker = markers[position.index];
    }
    if (currentMarker) {
      this.model.replace([currentMarker], replaceText);
    }
  }

  replaceAll(replaceText) {
    // Pass a copy: BufferSearch.replace splices the live markers array as it
    // goes, which would corrupt iteration if we handed it the live array.
    this.model.replace(this.markers().slice(), replaceText);
  }

  // --- selection helpers ----------------------------------------------------

  isSelectionEmpty() {
    const editor = this.model.getEditor();
    if (!editor) return false;
    return editor.getSelectedBufferRanges().every((range) => range.isEmpty());
  }

  getSelectedText() {
    const editor = this.model.getEditor();
    return editor && editor.getSelectedText ? editor.getSelectedText() : "";
  }

  getWordUnderCursor() {
    const editor = this.model.getEditor();
    return editor && editor.getWordUnderCursor ? editor.getWordUnderCursor() : "";
  }

  getWrapIconHost() {
    const editor = this.model.getEditor();
    if (!editor) return null;
    const editorView = atom.views.getView(editor);
    return editorView && editorView.parentNode ? editorView.parentNode : null;
  }
}

// Wraps a search adapter supplied by another package through the search-adapter
// service. The adapter owns matching, navigation, highlight
// and replace inside its own view; this target adapts it to the SearchTarget
// interface and supplies the shared FindOptions + regex helpers so the adapter
// doesn't have to reimplement option handling.
//
// Adapter contract (methods marked (opt) are optional):
//   search(findOptions): void                 // scan; emit "did-update"
//   onDidUpdate(cb) / onDidChangeCurrentResult(cb): Disposable
//   onDidError(cb): Disposable                 // (opt)
//   getResultCount(): number
//   getCurrentResultIndex(): number            // -1 when none
//   selectNext() / selectPrevious(): { found, wrapped }
//   selectFirstFromCursor() (opt) / selectAll() (opt): { found, wrapped }
//   canReplace: boolean
//   replaceCurrentMatch(text, direction) (opt) / replaceAll(text) (opt)
//   hasSelectionMatchingResult() (opt) / isSelectionEmpty() (opt)
//   getSelectedText() (opt) / getWordUnderCursor() (opt)
//   getWrapIconHost() (opt): HTMLElement | null
class AdapterSearchTarget {
  constructor(adapter, findOptions) {
    this.adapter = adapter;
    this.findOptions = findOptions;
  }

  isUsable() {
    return true;
  }

  canReplace() {
    return Boolean(this.adapter.canReplace);
  }

  getFindOptions() {
    return this.findOptions;
  }

  onDidUpdate(callback) {
    // FindView only reads the result count from the payload, so normalise to an
    // array of that length regardless of what the adapter emits.
    return this.adapter.onDidUpdate(() => callback(new Array(this.getResultCount())));
  }

  onDidError(callback) {
    return this.adapter.onDidError ? this.adapter.onDidError(callback) : new Disposable();
  }

  onDidChangeCurrentResult(callback) {
    return this.adapter.onDidChangeCurrentResult(callback);
  }

  search(findPattern, otherOptions) {
    const options = { findPattern };
    Object.assign(options, otherOptions);
    const changed = this.findOptions.set(options);
    if (
      changed.findPattern != null ||
      changed.useRegex != null ||
      changed.wholeWord != null ||
      changed.caseSensitive != null ||
      changed.inCurrentSelection != null
    ) {
      this.adapter.search(this.findOptions);
    }
  }

  // Re-run the current query when this target becomes active, so the adapter can
  // re-highlight in its now-visible view (mirrors buffer search re-running when
  // the active editor changes).
  refresh() {
    if (this.findOptions.findPattern) {
      this.adapter.search(this.findOptions);
    }
  }

  // Called when this target stops being active (the active pane item changed),
  // so the adapter can clear its highlights, matching how a text editor's find
  // results disappear when you switch away.
  deactivate() {
    if (this.adapter.deactivate) {
      this.adapter.deactivate();
    }
  }

  patternMatchesEmptyString(findPattern) {
    const options = new FindOptions(this.findOptions.serialize());
    options.set({ findPattern });
    try {
      return options.getFindPatternRegex().test("");
    } catch {
      return false;
    }
  }

  getResultCount() {
    return this.adapter.getResultCount();
  }

  getCurrentResultIndex() {
    return this.adapter.getCurrentResultIndex();
  }

  hasSelectionMatchingResult() {
    return this.adapter.hasSelectionMatchingResult
      ? this.adapter.hasSelectionMatchingResult()
      : false;
  }

  isSelectionEmpty() {
    return this.adapter.isSelectionEmpty ? this.adapter.isSelectionEmpty() : true;
  }

  selectNext() {
    return this._normalize(this.adapter.selectNext());
  }

  selectPrevious() {
    return this._normalize(this.adapter.selectPrevious());
  }

  selectFirstFromCursor() {
    return this._normalize(
      this.adapter.selectFirstFromCursor
        ? this.adapter.selectFirstFromCursor()
        : this.adapter.selectNext(),
    );
  }

  selectAll() {
    return this._normalize(this.adapter.selectAll ? this.adapter.selectAll() : null);
  }

  _normalize(result) {
    return result || { found: false, wrapped: null };
  }

  replaceCurrentMatch(replaceText, direction) {
    if (this.adapter.canReplace && this.adapter.replaceCurrentMatch) {
      this.adapter.replaceCurrentMatch(replaceText, direction);
    }
  }

  replaceAll(replaceText) {
    if (this.adapter.canReplace && this.adapter.replaceAll) {
      this.adapter.replaceAll(replaceText);
    }
  }

  getSelectedText() {
    return this.adapter.getSelectedText ? this.adapter.getSelectedText() : "";
  }

  getWordUnderCursor() {
    return this.adapter.getWordUnderCursor ? this.adapter.getWordUnderCursor() : "";
  }

  getWrapIconHost() {
    return this.adapter.getWrapIconHost ? this.adapter.getWrapIconHost() : null;
  }
}

module.exports = { EditorSearchTarget, AdapterSearchTarget };
