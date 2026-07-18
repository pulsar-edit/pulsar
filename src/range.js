const Point = require('./point');
let newlineRegex = null;

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}

// Public: Represents a region in a buffer in row/column coordinates.
//
// Every public method that takes a range also accepts a *range-compatible*
// {Array}. This means a 2-element array containing {Point}s or point-compatible
// arrays. So the following are equivalent:
//
// ## Examples
//
// ```js
// new Range(new Point(0, 1), new Point(2, 3))
// new Range([0, 1], [2, 3])
// [[0, 1], [2, 3]] // Range-compatible array
// ```
class Range {
  /*
  Section: Construction
  */

  // Public: Convert any range-compatible object to a {Range}.
  //
  // * `object` This can be an object that's already a {Range}, in which case it's
  //   simply returned, or an array containing two {Point}s or point-compatible
  //   arrays.
  // * `copy` An optional boolean indicating whether to force the copying of objects
  //   that are already ranges.
  //
  // Returns: A {Range} based on the given object.
  static fromObject(object, copy) {
    if (Array.isArray(object)) {
      return new (this)(object[0], object[1]);
    } else if (object instanceof this) {
      if (copy) { return object.copy(); } else { return object; }
    } else {
      return new (this)(object.start, object.end);
    }
  }

  // Returns a range based on an optional starting point and the given text. If
  // no starting point is given it will be assumed to be [0, 0].
  //
  // * `startPoint` (optional) {Point} where the range should start.
  // * `text` A {String} after which the range should end. The range will have as many
  //   rows as the text has lines have an end column based on the length of the
  //   last line.
  //
  // Returns: A {Range}
  static fromText(...args) {
    let startPoint;
    if (newlineRegex == null) { ({
      newlineRegex
    } = require('./helpers')); }

    if (args.length > 1) {
      startPoint = Point.fromObject(args.shift());
    } else {
      startPoint = new Point(0, 0);
    }
    const text = args.shift();
    const endPoint = startPoint.copy();
    const lines = text.split(newlineRegex);
    if (lines.length > 1) {
      const lastIndex = lines.length - 1;
      endPoint.row += lastIndex;
      endPoint.column = lines[lastIndex].length;
    } else {
      endPoint.column += lines[0].length;
    }
    return new (this)(startPoint, endPoint);
  }

  // Returns a {Range} that starts at the given point and ends at the
  // start point plus the given row and column deltas.
  //
  // * `startPoint` A {Point} or point-compatible {Array}
  // * `rowDelta` A {Number} indicating how many rows to add to the start point
  //   to get the end point.
  // * `columnDelta` A {Number} indicating how many rows to columns to the start
  //   point to get the end point.
  static fromPointWithDelta(startPoint, rowDelta, columnDelta) {
    startPoint = Point.fromObject(startPoint);
    const endPoint = new Point(startPoint.row + rowDelta, startPoint.column + columnDelta);
    return new (this)(startPoint, endPoint);
  }

  static fromPointWithTraversalExtent(startPoint, extent) {
    startPoint = Point.fromObject(startPoint);
    return new (this)(startPoint, startPoint.traverse(extent));
  }


  /*
  Section: Serialization and Deserialization
  */

  // Public: Call this with the result of {Range::serialize} to construct a new Range.
  //
  // * `array` {Array} of params to pass to the {::constructor}
  static deserialize(array) {
    if (Array.isArray(array)) {
      return new (this)(array[0], array[1]);
    } else {
      return new (this)();
    }
  }

  /*
  Section: Construction
  */

  // Public: Construct a {Range} object
  //
  // * `pointA` {Point} or Point compatible {Array} (default: [0,0])
  // * `pointB` {Point} or Point compatible {Array} (default: [0,0])
  constructor(pointA, pointB) {
    if (pointA == null) { pointA = new Point(0, 0); }
    if (pointB == null) { pointB = new Point(0, 0); }
    if (!(this instanceof Range)) {
      return new Range(pointA, pointB);
    }

    pointA = Point.fromObject(pointA);
    pointB = Point.fromObject(pointB);

    if (pointA.isLessThanOrEqual(pointB)) {
      this.start = pointA;
      this.end = pointB;
    } else {
      this.start = pointB;
      this.end = pointA;
    }
  }

  // Public: Returns a new range with the same start and end positions.
  copy() {
    return new this.constructor(this.start.copy(), this.end.copy());
  }

  // Public: Returns a new range with the start and end positions negated.
  negate() {
    return new this.constructor(this.start.negate(), this.end.negate());
  }

  /*
  Section: Serialization and Deserialization
  */

  // Public: Returns a plain JavaScript object representation of the range.
  serialize() {
    return [this.start.serialize(), this.end.serialize()];
  }

  /*
  Section: Range Details
  */

  // Public: Is the start position of this range equal to the end position?
  //
  // Returns a {Boolean}.
  isEmpty() {
    return this.start.isEqual(this.end);
  }

  // Public: Returns a {Boolean} indicating whether this range starts and ends on
  // the same row.
  isSingleLine() {
    return this.start.row === this.end.row;
  }

  // Public: Get the number of rows in this range.
  //
  // Returns a {Number}.
  getRowCount() {
    return (this.end.row - this.start.row) + 1;
  }

  // Public: Returns an array of all rows in the range.
  getRows() {
    return __range__(this.start.row, this.end.row, true);
  }

  /*
  Section: Operations
  */

  // Public: Freezes the range and its start and end point so it becomes
  // immutable and returns itself.
  //
  // Returns an immutable version of this {Range}
  freeze() {
    this.start.freeze();
    this.end.freeze();
    return Object.freeze(this);
  }

  // Public: Returns a new range that contains this range and the given range.
  //
  // * `otherRange` A {Range} or range-compatible {Array}
  union(otherRange) {
    const start = this.start.isLessThan(otherRange.start) ? this.start : otherRange.start;
    const end = this.end.isGreaterThan(otherRange.end) ? this.end : otherRange.end;
    return new this.constructor(start, end);
  }

  // Public: Build and return a new range by translating this range's start and
  // end points by the given delta(s).
  //
  // * `startDelta` A {Point} by which to translate the start of this range.
  // * `endDelta` (optional) A {Point} to by which to translate the end of this
  //   range. If omitted, the `startDelta` will be used instead.
  //
  // Returns a {Range}.
  translate(startDelta, endDelta) {
    if (endDelta == null) { endDelta = startDelta; }
    return new this.constructor(this.start.translate(startDelta), this.end.translate(endDelta));
  }

  // Public: Build and return a new range by traversing this range's start and
  // end points by the given delta.
  //
  // See {Point::traverse} for details of how traversal differs from translation.
  //
  // * `delta` A {Point} containing the rows and columns to traverse to derive
  //   the new range.
  //
  // Returns a {Range}.
  traverse(delta) {
    return new this.constructor(this.start.traverse(delta), this.end.traverse(delta));
  }

  /*
  Section: Comparison
  */

  // Public: Compare two Ranges
  //
  // * `other` A {Range} or range-compatible {Array}.
  //
  // Returns `-1` if this range starts before the argument or contains it.
  // Returns `0` if this range is equivalent to the argument.
  // Returns `1` if this range starts after the argument or is contained by it.
  compare(other) {
    let value;
    other = this.constructor.fromObject(other);
    if ((value = this.start.compare(other.start))) {
      return value;
    } else {
      return other.end.compare(this.end);
    }
  }

  // Public: Returns a {Boolean} indicating whether this range has the same start
  // and end points as the given {Range} or range-compatible {Array}.
  //
  // * `other` A {Range} or range-compatible {Array}.
  isEqual(other) {
    if (other == null) { return false; }
    other = this.constructor.fromObject(other);
    return other.start.isEqual(this.start) && other.end.isEqual(this.end);
  }

  // Public: Returns a {Boolean} indicating whether this range starts and ends on
  // the same row as the argument.
  //
  // * `other` A {Range} or range-compatible {Array}.
  coversSameRows(other) {
    return (this.start.row === other.start.row) && (this.end.row === other.end.row);
  }

  // Public: Determines whether this range intersects with the argument.
  //
  // * `otherRange` A {Range} or range-compatible {Array}
  // * `exclusive` (optional) {Boolean} indicating whether to exclude endpoints
  //     when testing for intersection. Defaults to `false`.
  //
  // Returns a {Boolean}.
  intersectsWith(otherRange, exclusive) {
    if (exclusive) {
      return !(this.end.isLessThanOrEqual(otherRange.start) || this.start.isGreaterThanOrEqual(otherRange.end));
    } else {
      return !(this.end.isLessThan(otherRange.start) || this.start.isGreaterThan(otherRange.end));
    }
  }

  // Public: Returns a {Boolean} indicating whether this range contains the given
  // range.
  //
  // * `otherRange` A {Range} or range-compatible {Array}
  // * `exclusive` (optional) {Boolean} including that the containment should be exclusive of
  //   endpoints. Defaults to false.
  containsRange(otherRange, exclusive) {
    const {start, end} = this.constructor.fromObject(otherRange);
    return this.containsPoint(start, exclusive) && this.containsPoint(end, exclusive);
  }

  // Public: Returns a {Boolean} indicating whether this range contains the given
  // point.
  //
  // * `point` A {Point} or point-compatible {Array}
  // * `exclusive` (optional) {Boolean} including that the containment should be exclusive of
  //   endpoints. Defaults to false.
  containsPoint(point, exclusive) {
    point = Point.fromObject(point);
    if (exclusive) {
      return point.isGreaterThan(this.start) && point.isLessThan(this.end);
    } else {
      return point.isGreaterThanOrEqual(this.start) && point.isLessThanOrEqual(this.end);
    }
  }

  // Public: Returns a {Boolean} indicating whether this range intersects the
  // given row {Number}.
  //
  // * `row` Row {Number}
  intersectsRow(row) {
    return this.start.row <= row && row <= this.end.row;
  }

  // Public: Returns a {Boolean} indicating whether this range intersects the
  // row range indicated by the given startRow and endRow {Number}s.
  //
  // * `startRow` {Number} start row
  // * `endRow` {Number} end row
  intersectsRowRange(startRow, endRow) {
    if (startRow > endRow) { [startRow, endRow] = [endRow, startRow]; }
    return (this.end.row >= startRow) && (endRow >= this.start.row);
  }

  getExtent() {
    return this.end.traversalFrom(this.start);
  }

  /*
  Section: Conversion
  */

  toDelta() {
    let columns;
    const rows = this.end.row - this.start.row;
    if (rows === 0) {
      columns = this.end.column - this.start.column;
    } else {
      columns = this.end.column;
    }
    return new Point(rows, columns);
  }

  // Public: Returns a string representation of the range.
  toString() {
    return `[${this.start} - ${this.end}]`;
  }
}

// ES5 classes differ from their predecessors in that you are not allowed to
// call them like ordinary functions. Hence we must write this wrapper function
// which delegates to `new Range` whether it was called with `new` or not.
function _Range (...args) {
  return new Range(...args);
};
_Range.displayName = 'Range';
_Range.prototype = Range.prototype;
Object.assign(_Range.prototype, {
  start: null,
  end: null
});
// Make the wrapper inherit the parent's static methods.
Object.setPrototypeOf(_Range, Range);

module.exports = _Range;
