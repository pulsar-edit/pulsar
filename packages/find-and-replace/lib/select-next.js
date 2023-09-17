const _ = require('underscore-plus');
const {CompositeDisposable, Range} = require('atom');

// Find and select the next occurrence of the currently selected text.
//
// The word under the cursor will be selected if the selection is empty.
module.exports = class SelectNext {
  constructor(editor) {
    this.editor = editor;
    this.selectionRanges = [];
  }

  findAndSelectNext() {
    if (this.editor.getLastSelection().isEmpty()) {
      return this.selectWord();
    } else {
      return this.selectNextOccurrence();
    }
  }

  findAndSelectAll() {
    if (this.editor.getLastSelection().isEmpty()) { this.selectWord(); }
    return this.selectAllOccurrences();
  }

  undoLastSelection() {
    this.updateSavedSelections();

    if (this.selectionRanges.length < 1) { return; }

    if (this.selectionRanges.length > 1) {
      this.selectionRanges.pop();
      this.editor.setSelectedBufferRanges(this.selectionRanges);
    } else {
      this.editor.clearSelections();
    }

    return this.editor.scrollToCursorPosition();
  }

  skipCurrentSelection() {
    this.updateSavedSelections();

    if (this.selectionRanges.length < 1) { return; }

    if (this.selectionRanges.length > 1) {
      const lastSelection = this.selectionRanges.pop();
      this.editor.setSelectedBufferRanges(this.selectionRanges);
      return this.selectNextOccurrence({start: lastSelection.end});
    } else {
      this.selectNextOccurrence();
      this.selectionRanges.shift();
      if (this.selectionRanges.length < 1) { return; }
      return this.editor.setSelectedBufferRanges(this.selectionRanges);
    }
  }

  selectWord() {
    this.editor.selectWordsContainingCursors();
    const lastSelection = this.editor.getLastSelection();
    if (this.wordSelected = this.isWordSelected(lastSelection)) {
      const disposables = new CompositeDisposable;
      const clearWordSelected = () => {
        this.wordSelected = null;
        return disposables.dispose();
      };
      disposables.add(lastSelection.onDidChangeRange(clearWordSelected));
      return disposables.add(lastSelection.onDidDestroy(clearWordSelected));
    }
  }

  selectAllOccurrences() {
    const range = [[0, 0], this.editor.getEofBufferPosition()];
    return this.scanForNextOccurrence(range, ({range, stop}) => {
      return this.addSelection(range);
    });
  }

  selectNextOccurrence(options) {
    if (options == null) { options = {}; }
    const startingRange = options.start != null ? options.start : this.editor.getSelectedBufferRange().end;
    let range = this.findNextOccurrence([startingRange, this.editor.getEofBufferPosition()]);
    if (range == null) { range = this.findNextOccurrence([[0, 0], this.editor.getSelections()[0].getBufferRange().start]); }
    if (range != null) { return this.addSelection(range); }
  }

  findNextOccurrence(scanRange) {
    let foundRange = null;
    this.scanForNextOccurrence(scanRange, function({range, stop}) {
      foundRange = range;
      return stop();
    });
    return foundRange;
  }

  addSelection(range) {
    const reversed = this.editor.getLastSelection().isReversed();
    const selection = this.editor.addSelectionForBufferRange(range, {reversed});
    return this.updateSavedSelections(selection);
  }

  scanForNextOccurrence(range, callback) {
    const selection = this.editor.getLastSelection();
    let text = _.escapeRegExp(selection.getText());

    if (this.wordSelected) {
      const nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      text = `(^|[ \t${_.escapeRegExp(nonWordCharacters)}]+)${text}(?=$|[\\s${_.escapeRegExp(nonWordCharacters)}]+)`;
    }

    return this.editor.scanInBufferRange(new RegExp(text, 'g'), range, function(result) {
      let prefix;
      if (prefix = result.match[1]) {
        result.range = result.range.translate([0, prefix.length], [0, 0]);
      }
      return callback(result);
    });
  }

  updateSavedSelections(selection=null) {
    const selections = this.editor.getSelections();
    if (selections.length < 3) { this.selectionRanges = []; }
    if (this.selectionRanges.length === 0) {
      return Array.from(selections).map((s) => this.selectionRanges.push(s.getBufferRange()));
    } else if (selection) {
      const selectionRange = selection.getBufferRange();
      if (this.selectionRanges.some(existingRange => existingRange.isEqual(selectionRange))) { return; }
      return this.selectionRanges.push(selectionRange);
    }
  }

  isNonWordCharacter(character) {
    const nonWordCharacters = atom.config.get('editor.nonWordCharacters');
    return new RegExp(`[ \t${_.escapeRegExp(nonWordCharacters)}]`).test(character);
  }

  isNonWordCharacterToTheLeft(selection) {
    const selectionStart = selection.getBufferRange().start;
    const range = Range.fromPointWithDelta(selectionStart, 0, -1);
    return this.isNonWordCharacter(this.editor.getTextInBufferRange(range));
  }

  isNonWordCharacterToTheRight(selection) {
    const selectionEnd = selection.getBufferRange().end;
    const range = Range.fromPointWithDelta(selectionEnd, 0, 1);
    return this.isNonWordCharacter(this.editor.getTextInBufferRange(range));
  }

  isWordSelected(selection) {
    if (selection.getBufferRange().isSingleLine()) {
      const selectionRange = selection.getBufferRange();
      const lineRange = this.editor.bufferRangeForBufferRow(selectionRange.start.row);
      const nonWordCharacterToTheLeft = _.isEqual(selectionRange.start, lineRange.start) ||
        this.isNonWordCharacterToTheLeft(selection);
      const nonWordCharacterToTheRight = _.isEqual(selectionRange.end, lineRange.end) ||
        this.isNonWordCharacterToTheRight(selection);
      const containsOnlyWordCharacters = !this.isNonWordCharacter(selection.getText());

      return nonWordCharacterToTheLeft && nonWordCharacterToTheRight && containsOnlyWordCharacters;
    } else {
      return false;
    }
  }
}
