const { Point, Range } = require('text-buffer');
const { Emitter } = require('event-kit');
const _ = require('underscore-plus');
const Model = require('./model');

const EmptyLineRegExp = /(\r\n[\t ]*\r\n)|(\n[\t ]*\n)/g;

/**
 * @class Cursor
 * @extends Model
 * @classdesc Extended: THe `Cursor` class represents the little blinking line
 * identifying where text can be inserted.
 *
 * Cursors belong to {TextEditor}s and have some metadata attached in the form
 * of a {DisplayMarker}.
 */
module.exports = class Cursor extends Model {
  // Instantiated by a {TextEditor}
  constructor(params) {
    super(params);
    this.editor = params.editor;
    this.marker = params.marker;
    this.emitter = new Emitter();
  }

  destroy() {
    this.marker.destroy();
  }

  /*
  Section: Event Subscription
  */

  /**
   * @name onDidChangePosition
   * @memberof Cursor
   * @desc Public: Calls your `callback` when the curosr has been moved.
   * @param {Cursor-onDidChangePositionCallback} callback
   * @returns {Disposable} on which `.dipose()` can be called to unsubscribe.
   */
  onDidChangePosition(callback) {
    /**
     * @callback Cursor-onDidChangePositionCallback
     * @param {object} event
     * @param {Point} event.oldBufferPosition
     * @param {Point} event.oldScreenPosition
     * @param {Point} event.newBufferPosition
     * @param {Point} event.newScreenPosition
     * @param {boolean} event.textChanges
     * @param {Cursor} event.cursor - That triggered the event.
     */
    return this.emitter.on('did-change-position', callback);
  }

  /**
   * @name onDidDestroy
   * @memberof Cursor
   * @desc Public: Calls your `callback` when the cursor is destroyed
   * @param {function} callback
   * @returns {Disposable} on which `.dipose()` can be called to unsubscribe.
   */
  onDidDestroy(callback) {
    return this.emitter.once('did-destroy', callback);
  }

  /*
  Section: Managing Cursor Position
  */

  /**
   * @name setScreenPosition
   * @memberof Cursor
   * @desc Public: Moves a cursor to a given screen position.
   * @param {integer[]} screenPosition - Array of two numbers: the screen row,
   * and the screen column.
   * @param {object} [options]
   * @param {boolean} options.autoscroll - A boolean which, if `true`, scrolls
   * the {TextEditor} to wherever the cursor moves to.
   */
  setScreenPosition(screenPosition, options = {}) {
    this.changePosition(options, () => {
      this.marker.setHeadScreenPosition(screenPosition, options);
    });
  }

  /**
   * @name getScreenPosition
   * @memberof Cursor
   * @desc Public: Returns the screen position of the cursor as a {Point}.
   */
  getScreenPosition() {
    return this.marker.getHeadScreenPosition();
  }

  /**
   * @name setBufferPosition
   * @memberof Cursor
   * @desc Public: Moves a cursor to a given buffer position.
   * @param {integer[]} bufferPosition - Array of two numbers: the buffer row,
   * and the buffer column.
   * @param {object} [options] - Optional Options Object.
   * @param {boolean} options.autoscroll - Boolean indicating whether to
   * autoscroll to the new position. Defaults to `true` if this is the most
   * recently added curosr, `false` otherwise.
   */
  setBufferPosition(bufferPosition, options = {}) {
    this.changePosition(options, () => {
      this.marker.setHeadBufferPosition(bufferPosition, options);
    });
  }

  /**
   * @name getBufferPosition
   * @memberof Cursor
   * @desc Public: Returns the current buffer position as an Array.
   */
  getBufferPosition() {
    return this.marker.getHeadBufferPosition();
  }

  /**
   * @name getScreenRow
   * @memberof Cursor
   * @desc Public: Returns the cursor's current screen row.
   */
  getScreenRow() {
    return this.getScreenPosition().row;
  }

  /**
   * @name getScreenColumn
   * @memberof Cursor
   * @desc Public: Returns the cursor's current screen column.
   */
  getScreenColumn() {
    return this.getScreenPosition().column;
  }

  /**
   * @name getBufferRow
   * @memberof Cursor
   * @desc Public: Retrieves the cursor's current buffer row.
   */
  getBufferRow() {
    return this.getBufferPosition().row;
  }

  /**
   * @name getBufferColumn
   * @memberof Cursor
   * @desc Public: Returns the cursor's current buffer column.
   */
  getBufferColumn() {
    return this.getBufferPosition().column;
  }

  /**
   * @name getCurrentBufferLine
   * @memberof Cursor
   * @desc Public: Returns the cursor's current buffer row of text excluding
   * its line ending.
   */
  getCurrentBufferLine() {
    return this.editor.lineTextForBufferRow(this.getBufferRow());
  }

  /**
   * @name isAtBeginningOfLine
   * @memberof Cursor
   * @desc Public: Returns whether the cursor is at the start of a line.
   */
  isAtBeginningOfLine() {
    return this.getBufferPosition().column === 0;
  }

  /**
   * @name isAtEndOfLine
   * @memberof Cursor
   * @desc Public: Returns whether the cursor is on the line return character.
   */
  isAtEndOfLine() {
    return this.getBufferPosition().isEqual(
      this.getCurrentLineBufferRange().end
    );
  }

  /*
  Section: Cursor Position Details
  */

  /**
   * @name getMarker
   * @memberof Cursor
   * @desc Public: Returns the underlying {DisplayMarker} for the cursor.
   * Useful with overlay {Decoration}s.
   */
  getMarker() {
    return this.marker;
  }

  /**
   * @name isSurroundedByWhitespace
   * @memberof Cursor
   * @desc Public: Identifies if the cursor is surrounded by whitespace.
   * "Surrounded" here means that the character directly before and after the
   * cursor are both whitespace.
   * @returns {boolean}
   */
  isSurroundedByWhitespace() {
    const { row, column } = this.getBufferPosition();
    const range = [[row, column - 1], [row, column + 1]];
    return /^\s+$/.test(this.editor.getTextInBufferRange(range));
  }

  /**
   * @name isBetweenWordAndNonWord
   * @memberof Cursor
   * @desc Public: Returns whether the cursor is currently between a word and
   * a non-word character. The non-word characters are defined by the
   * `editor.nonWordCharacters` config value.
   *
   * This method returns false if the character before or after the cursor is
   * whitespace.
   * @returns {boolean}
   */
  isBetweenWordAndNonWord() {
    if (this.isAtBeginningOfLine() || this.isAtEndOfLine()) return false;

    const { row, column } = this.getBufferPosition();
    const range = [[row, column - 1], [row, column + 1]];
    const text = this.editor.getTextInBufferRange(range);
    if (/\s/.test(text[0]) || /\s/.test(text[1])) return false;

    const nonWordCharacters = this.getNonWordCharacters();
    return (
      nonWordCharacters.includes(text[0]) !==
      nonWordCharacters.includes(text[1])
    );
  }

  /**
   * @name isInsideWord
   * @memberof Cursor
   * @desc Public: Returns whether this cursor is between a word's start and end.
   * @param {object} [options]
   * @param {RegExp} options.wordRegex - A RegExp indicating what constitutes a
   * "word" (default: {::wordRegExp}).
   * @returns {boolean}
   */
  isInsideWord(options) {
    const { row, column } = this.getBufferPosition();
    const range = [[row, column], [row, Infinity]];
    const text = this.editor.getTextInBufferRange(range);
    return (
      text.search((options && options.wordRegex) || this.wordRegExp()) === 0
    );
  }

  /**
   * @name getIndentLevel
   * @memberof Cursor
   * @desc Public: Returns the indentation level of the current line.
   */
  getIndentLevel() {
    if (this.editor.getSoftTabs()) {
      return this.getBufferColumn() / this.editor.getTabLength();
    } else {
      return this.getBufferColumn();
    }
  }

  /**
   * @name getScopeDescriptor
   * @memberof Cursor
   * @desc Public: Retrieves the scope descriptor for the cursor's current position.
   * @returns {ScopeDescriptor}
   */
  getScopeDescriptor() {
    return this.editor.scopeDescriptorForBufferPosition(
      this.getBufferPosition()
    );
  }

  /**
   * @name getSyntaxTreeScopeDescriptor
   * @memberof Cursor
   * @desc Public: Retrieves the syntax tree scope descriptor for the cursor's
   * current position.
   * @returns {ScopeDescriptor}
   */
  getSyntaxTreeScopeDescriptor() {
    return this.editor.syntaxTreeScopeDescriptorForBufferPosition(
      this.getBufferPosition()
    );
  }

  /**
   * @name hasPrecedingCharactersOnLine
   * @memberof Cursor
   * @desc Public: Returns true if this cursor has no non-whitespace characters
   * before its current position.
   * @returns {boolean}
   */
  hasPrecedingCharactersOnLine() {
    const bufferPosition = this.getBufferPosition();
    const line = this.editor.lineTextForBufferRow(bufferPosition.row);
    const firstCharacterColumn = line.search(/\S/);

    if (firstCharacterColumn === -1) {
      return false;
    } else {
      return bufferPosition.column > firstCharacterColumn;
    }
  }

  /**
   * @name isLastCursor
   * @memberof Cursor
   * @desc Public: Identifies if this cursor is the last in the {TextEditor}.
   * "Last" is defined as the most recently added cursor.
   * @returns {boolean}
   */
  isLastCursor() {
    return this === this.editor.getLastCursor();
  }

  /*
  Section: Moving the Cursor
  */

  /**
   * @name moveUp
   * @memberof Cursor
   * @desc Public: Moves the cursor up one screen row.
   * @param {integer} [rowCount=1] - Number of rows to move.
   * @param {object} [options]
   * @param {boolean} options.moveToEndOfSelection - If true, move to the left of
   * the selection if a selection exists.
   */
  moveUp(rowCount = 1, { moveToEndOfSelection } = {}) {
    let row, column;
    const range = this.marker.getScreenRange();
    if (moveToEndOfSelection && !range.isEmpty()) {
      ({ row, column } = range.start);
    } else {
      ({ row, column } = this.getScreenPosition());
    }

    if (this.goalColumn != null) column = this.goalColumn;
    this.setScreenPosition(
      { row: row - rowCount, column },
      { skipSoftWrapIndentation: true }
    );
    this.goalColumn = column;
  }

  /**
   * @name moveDown
   * @memberof Cursor
   * @desc Public: Moves the cursor down one screen row.
   * @param {integer} [rowCount=1] - Number of rows to move.
   * @param {object} [options]
   * @param {boolean} options.moveToEndOfSelection - If true, move to the left of
   * the selection if a selection exists.
   */
  moveDown(rowCount = 1, { moveToEndOfSelection } = {}) {
    let row, column;
    const range = this.marker.getScreenRange();
    if (moveToEndOfSelection && !range.isEmpty()) {
      ({ row, column } = range.end);
    } else {
      ({ row, column } = this.getScreenPosition());
    }

    if (this.goalColumn != null) column = this.goalColumn;
    this.setScreenPosition(
      { row: row + rowCount, column },
      { skipSoftWrapIndentation: true }
    );
    this.goalColumn = column;
  }

  /**
   * @name moveLeft
   * @memberof Cursor
   * @desc Public: Moves the cursor left one screen column.
   * @param {integer} [columnCount=1] - Number of columns to move.
   * @param {object} [options]
   * @param {boolean} options.moveToEndOfSelection - If true, move to the left of
   * the selection if a selection exists.
   */
  moveLeft(columnCount = 1, { moveToEndOfSelection } = {}) {
    const range = this.marker.getScreenRange();
    if (moveToEndOfSelection && !range.isEmpty()) {
      this.setScreenPosition(range.start);
    } else {
      let { row, column } = this.getScreenPosition();

      while (columnCount > column && row > 0) {
        columnCount -= column;
        column = this.editor.lineLengthForScreenRow(--row);
        columnCount--; // subtract 1 for the row move
      }

      column = column - columnCount;
      this.setScreenPosition({ row, column }, { clipDirection: 'backward' });
    }
  }

  /**
   * @name moveRight
   * @memberof Cursor
   * @desc Public: Moves the cursor right one screen column.
   * @param {integer} [columnCount=1] - Number of columns to move.
   * @param {object} [options]
   * @param {boolean} options.moveToEndOfSelection - If true, move to the right
   *  of the selection if a selection exists.
   */
  moveRight(columnCount = 1, { moveToEndOfSelection } = {}) {
    const range = this.marker.getScreenRange();
    if (moveToEndOfSelection && !range.isEmpty()) {
      this.setScreenPosition(range.end);
    } else {
      let { row, column } = this.getScreenPosition();
      const maxLines = this.editor.getScreenLineCount();
      let rowLength = this.editor.lineLengthForScreenRow(row);
      let columnsRemainingInLine = rowLength - column;

      while (columnCount > columnsRemainingInLine && row < maxLines - 1) {
        columnCount -= columnsRemainingInLine;
        columnCount--; // subtract 1 for the row move

        column = 0;
        rowLength = this.editor.lineLengthForScreenRow(++row);
        columnsRemainingInLine = rowLength;
      }

      column = column + columnCount;
      this.setScreenPosition({ row, column }, { clipDirection: 'forward' });
    }
  }

  /**
   * @name moveToTop
   * @memberof Cursor
   * @desc Public: Moves the cursor to the top of the buffer.
   */
  moveToTop() {
    this.setBufferPosition([0, 0]);
  }

  /**
   * @name moveToBottom
   * @memberof Cursor
   * @desc Public: Moves the cursor to the bottom of the buffer.
   */
  moveToBottom() {
    const column = this.goalColumn;
    this.setBufferPosition(this.editor.getEofBufferPosition());
    this.goalColumn = column;
  }

  /**
   * @name moveToBeginningOfScreenLine
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the line.
   */
  moveToBeginningOfScreenLine() {
    this.setScreenPosition([this.getScreenRow(), 0]);
  }

  /**
   * @name moveToBeginningOfLine
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the buffer line.
   */
  moveToBeginningOfLine() {
    this.setBufferPosition([this.getBufferRow(), 0]);
  }

  /**
   * @name moveToFirstCharacterOfLine
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the first character in
   * the line.
   */
  moveToFirstCharacterOfLine() {
    let targetBufferColumn;
    const screenRow = this.getScreenRow();
    const screenLineStart = this.editor.clipScreenPosition([screenRow, 0], {
      skipSoftWrapIndentation: true
    });
    const screenLineEnd = [screenRow, Infinity];
    const screenLineBufferRange = this.editor.bufferRangeForScreenRange([
      screenLineStart,
      screenLineEnd
    ]);

    let firstCharacterColumn = null;
    this.editor.scanInBufferRange(
      /\S/,
      screenLineBufferRange,
      ({ range, stop }) => {
        firstCharacterColumn = range.start.column;
        stop();
      }
    );

    if (
      firstCharacterColumn != null &&
      firstCharacterColumn !== this.getBufferColumn()
    ) {
      targetBufferColumn = firstCharacterColumn;
    } else {
      targetBufferColumn = screenLineBufferRange.start.column;
    }

    this.setBufferPosition([
      screenLineBufferRange.start.row,
      targetBufferColumn
    ]);
  }

  /**
   * @name moveToEndOfScreenLine
   * @memberof Cursor
   * @desc Public: Moves the cursor to the end of the line.
   */
  moveToEndOfScreenLine() {
    this.setScreenPosition([this.getScreenRow(), Infinity]);
  }

  /**
   * @name moveToEndOfLine
   * @memberof Cursor
   * @desc Public: Moves the cursor to the end of the buffer line.
   */
  moveToEndOfLine() {
    this.setBufferPosition([this.getBufferRow(), Infinity]);
  }

  /**
   * @name moveToBeginningOfWord
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the word.
   */
  moveToBeginningOfWord() {
    this.setBufferPosition(this.getBeginningOfCurrentWordBufferPosition());
  }

  /**
   * @name moveToEndOfWord
   * @memberof Cursor
   * @desc Public: Moves the cursor to the end of the word.
   */
  moveToEndOfWord() {
    const position = this.getEndOfCurrentWordBufferPosition();
    if (position) this.setBufferPosition(position);
  }

  /**
   * @name moveToBeginningOfNextWord
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the next word.
   */
  moveToBeginningOfNextWord() {
    const position = this.getBeginningOfNextWordBufferPosition();
    if (position) this.setBufferPosition(position);
  }

  /**
   * @name moveToPreviousWordBoundary
   * @memberof Cursor
   * @desc Public: Moves the cursor to the previous word boundary.
   */
  moveToPreviousWordBoundary() {
    const position = this.getPreviousWordBoundaryBufferPosition();
    if (position) this.setBufferPosition(position);
  }

  /**
   * @name moveToNextWordBoundary
   * @memberof Cursor
   * @desc Public: Moves the cursor to the next word boundary.
   */
  moveToNextWordBoundary() {
    const position = this.getNextWordBoundaryBufferPosition();
    if (position) this.setBufferPosition(position);
  }

  /**
   * @name moveToPreviousSubwordBoundary
   * @memberof Cursor
   * @desc Public: Moves the cursor to the previous subword boundary.
   */
  moveToPreviousSubwordBoundary() {
    const options = { wordRegex: this.subwordRegExp({ backwards: true }) };
    const position = this.getPreviousWordBoundaryBufferPosition(options);
    if (position) this.setBufferPosition(position);
  }

  /**
   * @name moveToNextSubwordBoundary
   * @memberof Cursor
   * @desc Public: Moves the cursor to the next subword boundary.
   */
  moveToNextSubwordBoundary() {
    const options = { wordRegex: this.subwordRegExp() };
    const position = this.getNextWordBoundaryBufferPosition(options);
    if (position) this.setBufferPosition(position);
  }

  /**
   * @name skipLeadingWhitespace
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the buffer line, skipping
   * all whitespace.
   */
  skipLeadingWhitespace() {
    const position = this.getBufferPosition();
    const scanRange = this.getCurrentLineBufferRange();
    let endOfLeadingWhitespace = null;
    this.editor.scanInBufferRange(/^[ \t]*/, scanRange, ({ range }) => {
      endOfLeadingWhitespace = range.end;
    });

    if (endOfLeadingWhitespace.isGreaterThan(position))
      this.setBufferPosition(endOfLeadingWhitespace);
  }

  /**
   * @name moveToBeginningOfNextParagraph
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the next paragraph
   */
  moveToBeginningOfNextParagraph() {
    const position = this.getBeginningOfNextParagraphBufferPosition();
    if (position) this.setBufferPosition(position);
  }

  /**
   * @name moveToBeginningOfPreviousParagraph
   * @memberof Cursor
   * @desc Public: Moves the cursor to the beginning of the previous paragraph
   */
  moveToBeginningOfPreviousParagraph() {
    const position = this.getBeginningOfPreviousParagraphBufferPosition();
    if (position) this.setBufferPosition(position);
  }

  /*
  Section: Local Positions and Ranges
  */

  /**
   * @name getPreviousWordBoundaryBufferPosition
   * @memberof Cursor
   * @desc Public: Returns buffer position of previous word boundary. It might
   * be on the current word, or the previous word.
   * @param {object} [options]
   * @param {RegExp} options.wordRegex - Indicating what constitues a "word"
   * (default: {::wordRegExp}).
   */
  getPreviousWordBoundaryBufferPosition(options = {}) {
    const currentBufferPosition = this.getBufferPosition();
    const previousNonBlankRow = this.editor.buffer.previousNonBlankRow(
      currentBufferPosition.row
    );
    const scanRange = Range(
      Point(previousNonBlankRow || 0, 0),
      currentBufferPosition
    );

    const ranges = this.editor.buffer.findAllInRangeSync(
      options.wordRegex || this.wordRegExp(),
      scanRange
    );

    const range = ranges[ranges.length - 1];
    if (range) {
      if (
        range.start.row < currentBufferPosition.row &&
        currentBufferPosition.column > 0
      ) {
        return Point(currentBufferPosition.row, 0);
      } else if (currentBufferPosition.isGreaterThan(range.end)) {
        return Point.fromObject(range.end);
      } else {
        return Point.fromObject(range.start);
      }
    } else {
      return currentBufferPosition;
    }
  }

  /**
   * @name getNextWordBoundaryBufferPosition
   * @memberof Cursor
   * @desc Public: Returns buffer position of the next word boundary. It might
   * be on the current word, or the previous word.
   * @param {object} [options]
   * @param {RegExp} options.wordRegex - Indicating what constitues a "word"
   * (default: {::wordRegExp})
   */
  getNextWordBoundaryBufferPosition(options = {}) {
    const currentBufferPosition = this.getBufferPosition();
    const scanRange = Range(
      currentBufferPosition,
      this.editor.getEofBufferPosition()
    );

    const range = this.editor.buffer.findInRangeSync(
      options.wordRegex || this.wordRegExp(),
      scanRange
    );

    if (range) {
      if (range.start.row > currentBufferPosition.row) {
        return Point(range.start.row, 0);
      } else if (currentBufferPosition.isLessThan(range.start)) {
        return Point.fromObject(range.start);
      } else {
        return Point.fromObject(range.end);
      }
    } else {
      return currentBufferPosition;
    }
  }

  /**
   * @name getBeginningOfCurrentWordBufferPosition
   * @memberof Cursor
   * @desc Public: Retrieves the buffer position of where the current word starts.
   * @param {object} [options]
   * @param {RegExp} options.wordRegex - Indicating what constitutes a "word"
   * (default: {::wordRegExp}).
   * @param {boolean} options.includeNonWordCharacters - A boolean indicating
   * whether to include non-word characters in the default word regex.
   * Has no effect if wordRegex is set.
   * @param {boolean} options.allowPrevious - Indicating whether the beginning of
   * the previous word can be returned.
   * @returns {Range}
   */
  getBeginningOfCurrentWordBufferPosition(options = {}) {
    const allowPrevious = options.allowPrevious !== false;
    const position = this.getBufferPosition();

    const scanRange = allowPrevious
      ? new Range(new Point(position.row - 1, 0), position)
      : new Range(new Point(position.row, 0), position);

    const ranges = this.editor.buffer.findAllInRangeSync(
      options.wordRegex || this.wordRegExp(options),
      scanRange
    );

    let result;
    for (let range of ranges) {
      if (position.isLessThanOrEqual(range.start)) break;
      if (allowPrevious || position.isLessThanOrEqual(range.end))
        result = Point.fromObject(range.start);
    }

    return result || (allowPrevious ? new Point(0, 0) : position);
  }

  /**
   * @name getEndOfCurrentWordBufferPosition
   * @memberof Cursor
   * @desc Public: Retrieves the buffer position of where the current word ends.
   * @param {object} [options]
   * @param {RegExp} options.wordRegex - Indicating what constitutes a "word"
   * (default: {::wordRegExp})
   * @param {boolean} options.includeNonWordCharacters - A boolean indicating
   * whether to include non-word characters in the default word regex. Has no
   * effect if wordRegex is set.
   * @returns {Range}
   */
  getEndOfCurrentWordBufferPosition(options = {}) {
    const allowNext = options.allowNext !== false;
    const position = this.getBufferPosition();

    const scanRange = allowNext
      ? new Range(position, new Point(position.row + 2, 0))
      : new Range(position, new Point(position.row, Infinity));

    const ranges = this.editor.buffer.findAllInRangeSync(
      options.wordRegex || this.wordRegExp(options),
      scanRange
    );

    for (let range of ranges) {
      if (position.isLessThan(range.start) && !allowNext) break;
      if (position.isLessThan(range.end)) return Point.fromObject(range.end);
    }

    return allowNext ? this.editor.getEofBufferPosition() : position;
  }

  /**
   * @name getBeginningOfNextWordBufferPosition
   * @memberof Cursor
   * @desc Public: Retrieves the buffer position of where the next word starts.
   * @param {object} [options]
   * @param {RegExp} options.wordRegex - Indicating what constitutes a "word"
   * (default: {::wordRegExp}).
   * @returns {Range}
   */
  getBeginningOfNextWordBufferPosition(options = {}) {
    const currentBufferPosition = this.getBufferPosition();
    const start = this.isInsideWord(options)
      ? this.getEndOfCurrentWordBufferPosition(options)
      : currentBufferPosition;
    const scanRange = [start, this.editor.getEofBufferPosition()];

    let beginningOfNextWordPosition;
    this.editor.scanInBufferRange(
      options.wordRegex || this.wordRegExp(),
      scanRange,
      ({ range, stop }) => {
        beginningOfNextWordPosition = range.start;
        stop();
      }
    );

    return beginningOfNextWordPosition || currentBufferPosition;
  }

  /**
   * @name getCurrentWordBufferRange
   * @memberof Cursor
   * @desc Public: Returns the buffer Range occupied by the word located under
   * the cursor.
   * @param {object} [options]
   * @param {RegExp} options.wordRegex - Indicating what constitutes a "word"
   * (default: {::wordRegExp}).
   */
  getCurrentWordBufferRange(options = {}) {
    const position = this.getBufferPosition();
    const ranges = this.editor.buffer.findAllInRangeSync(
      options.wordRegex || this.wordRegExp(options),
      new Range(new Point(position.row, 0), new Point(position.row, Infinity))
    );
    const range = ranges.find(
      range =>
        range.end.column >= position.column &&
        range.start.column <= position.column
    );
    return range ? Range.fromObject(range) : new Range(position, position);
  }

  /**
   * @name getCurrentLineBufferRange
   * @memberof Cursor
   * @desc Public: Returns the buffer Range for the current line.
   * @param {object} [options]
   * @param {boolean} options.includeNewline - A boolean which controls whether
   * the Range should include the newline.
   */
  getCurrentLineBufferRange(options) {
    return this.editor.bufferRangeForBufferRow(this.getBufferRow(), options);
  }

  /**
   * @name getCurrentParagraphBufferRange
   * @memberof Cursor
   * @desc Public: Retrieves the range for the current paragraph.
   * A paragraph is defined as a block of text surrounded by empty lines or comments.
   * @returns {Range}
   */
  getCurrentParagraphBufferRange() {
    return this.editor.rowRangeForParagraphAtBufferRow(this.getBufferRow());
  }

  // Public: Returns the characters preceding the cursor in the current word.
  getCurrentWordPrefix() {
    return this.editor.getTextInBufferRange([
      this.getBeginningOfCurrentWordBufferPosition(),
      this.getBufferPosition()
    ]);
  }

  /*
  Section: Visibility
  */

  /*
  Section: Comparing to another cursor
  */

  /**
   * @name compare
   * @memberof Cursor
   * @desc Public: Compare this cursor's buffer position to another cursor's
   * buffer position.
   * See {Point::compare} for more details.
   * @param {Cursor} otherCursor - To compare against.
   */
  compare(otherCursor) {
    return this.getBufferPosition().compare(otherCursor.getBufferPosition());
  }

  /*
  Section: Utilities
  */

  /**
   * @name clearSelection
   * @memberof Cursor
   * @desc Public: Deselects the current selection.
   */
  clearSelection(options) {
    if (this.selection) this.selection.clear(options);
  }

  /**
   * @name wordRegExp
   * @memberof Cursor
   * @desc Public: Get the RegExp used by the cursor to determine what a "word" is.
   * @param {object} [options]
   * @param {boolean} options.includeNonWordCharacters=true - A boolean indicating
   * whether to include non-word characters in the regex.
   * @returns {RegExp}
   */
  wordRegExp(options) {
    const nonWordCharacters = _.escapeRegExp(this.getNonWordCharacters());
    let source = `^[\t ]*$|[^\\s${nonWordCharacters}]+`;
    if (!options || options.includeNonWordCharacters !== false) {
      source += `|${`[${nonWordCharacters}]+`}`;
    }
    return new RegExp(source, 'g');
  }

  /**
   * @name subwordRegExp
   * @memberof Cursor
   * @desc Public: Get the RegExp used by the cursor to determine what a
   * "subword" is.
   * @param {object} [options]
   * @param {boolean} options.backwards=false - A boolean indicating whether to
   * look forwards or backwards for the next subword.
   * @returns {RegExp}
   */
  subwordRegExp(options = {}) {
    const nonWordCharacters = this.getNonWordCharacters();
    const lowercaseLetters = 'a-z\\u00DF-\\u00F6\\u00F8-\\u00FF';
    const uppercaseLetters = 'A-Z\\u00C0-\\u00D6\\u00D8-\\u00DE';
    const snakeCamelSegment = `[${uppercaseLetters}]?[${lowercaseLetters}]+`;
    const segments = [
      '^[\t ]+',
      '[\t ]+$',
      `[${uppercaseLetters}]+(?![${lowercaseLetters}])`,
      '\\d+'
    ];
    if (options.backwards) {
      segments.push(`${snakeCamelSegment}_*`);
      segments.push(`[${_.escapeRegExp(nonWordCharacters)}]+\\s*`);
    } else {
      segments.push(`_*${snakeCamelSegment}`);
      segments.push(`\\s*[${_.escapeRegExp(nonWordCharacters)}]+`);
    }
    segments.push('_+');
    return new RegExp(segments.join('|'), 'g');
  }

  /*
  Section: Private
  */

  getNonWordCharacters() {
    return this.editor.getNonWordCharacters(this.getBufferPosition());
  }

  changePosition(options, fn) {
    this.clearSelection({ autoscroll: false });
    fn();
    this.goalColumn = null;
    const autoscroll =
      options && options.autoscroll != null
        ? options.autoscroll
        : this.isLastCursor();
    if (autoscroll) this.autoscroll();
  }

  getScreenRange() {
    const { row, column } = this.getScreenPosition();
    return new Range(new Point(row, column), new Point(row, column + 1));
  }

  autoscroll(options = {}) {
    options.clip = false;
    this.editor.scrollToScreenRange(this.getScreenRange(), options);
  }

  getBeginningOfNextParagraphBufferPosition() {
    const start = this.getBufferPosition();
    const eof = this.editor.getEofBufferPosition();
    const scanRange = [start, eof];

    const { row, column } = eof;
    let position = new Point(row, column - 1);

    this.editor.scanInBufferRange(
      EmptyLineRegExp,
      scanRange,
      ({ range, stop }) => {
        position = range.start.traverse(Point(1, 0));
        if (!position.isEqual(start)) stop();
      }
    );
    return position;
  }

  getBeginningOfPreviousParagraphBufferPosition() {
    const start = this.getBufferPosition();

    const { row, column } = start;
    const scanRange = [[row - 1, column], [0, 0]];
    let position = new Point(0, 0);
    this.editor.backwardsScanInBufferRange(
      EmptyLineRegExp,
      scanRange,
      ({ range, stop }) => {
        position = range.start.traverse(Point(1, 0));
        if (!position.isEqual(start)) stop();
      }
    );
    return position;
  }
};
