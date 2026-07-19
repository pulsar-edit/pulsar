/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Point = require("../src/point");

describe("Point", function () {
  beforeEach(() =>
    jasmine.addCustomEqualityTester(require("@lumine-code/underscore-plus").isEqual),
  );

  describe("::negate()", () =>
    it("should negate the row and column", function () {
      expect(new Point(0, 0).negate().toString()).toBe("(0, 0)");
      expect(new Point(1, 2).negate().toString()).toBe("(-1, -2)");
      expect(new Point(-1, -2).negate().toString()).toBe("(1, 2)");
      expect(new Point(-1, 2).negate().toString()).toBe("(1, -2)");
    }));

  describe("::fromObject(object, copy)", function () {
    it("returns a new Point if object is point-compatible array ", function () {
      expect(Point.fromObject([1, 3])).toEqual(Point(1, 3));
      expect(Point.fromObject([Infinity, Infinity])).toEqual(Point.INFINITY);
    });

    it("returns the copy of object if it is an instanceof Point", function () {
      const origin = Point(0, 0);
      expect(Point.fromObject(origin, false) === origin).toBe(true);
      expect(Point.fromObject(origin, true) === origin).toBe(false);
    });
  });

  describe("::copy()", () =>
    it("returns a copy of the object", function () {
      expect(Point(3, 4).copy()).toEqual(Point(3, 4));
      expect(Point.ZERO.copy()).toEqual([0, 0]);
    }));

  describe("::negate()", () =>
    it("returns a new point with row and column negated", function () {
      expect(Point(3, 4).negate()).toEqual(Point(-3, -4));
      expect(Point.ZERO.negate()).toEqual([0, 0]);
    }));

  describe("::freeze()", () =>
    it("makes the Point object immutable", function () {
      expect(Object.isFrozen(Point(3, 4).freeze())).toBe(true);
      expect(Object.isFrozen(Point.ZERO.freeze())).toBe(true);
    }));

  describe("::compare(other)", () =>
    it("returns -1 for <, 0 for =, 1 for > comparisions", function () {
      expect(Point(2, 3).compare(Point(2, 6))).toBe(-1);
      expect(Point(2, 3).compare(Point(3, 4))).toBe(-1);
      expect(Point(1, 1).compare(Point(1, 1))).toBe(0);
      expect(Point(2, 3).compare(Point(2, 0))).toBe(1);
      expect(Point(2, 3).compare(Point(1, 3))).toBe(1);

      expect(Point(2, 3).compare([2, 6])).toBe(-1);
      expect(Point(2, 3).compare([3, 4])).toBe(-1);
      expect(Point(1, 1).compare([1, 1])).toBe(0);
      expect(Point(2, 3).compare([2, 0])).toBe(1);
      expect(Point(2, 3).compare([1, 3])).toBe(1);
    }));

  describe("::isLessThan(other)", () =>
    it("returns a boolean indicating whether a point precedes the given Point ", function () {
      expect(Point(2, 3).isLessThan(Point(2, 5))).toBe(true);
      expect(Point(2, 3).isLessThan(Point(3, 4))).toBe(true);
      expect(Point(2, 3).isLessThan(Point(2, 3))).toBe(false);
      expect(Point(2, 3).isLessThan(Point(2, 1))).toBe(false);
      expect(Point(2, 3).isLessThan(Point(1, 2))).toBe(false);

      expect(Point(2, 3).isLessThan([2, 5])).toBe(true);
      expect(Point(2, 3).isLessThan([3, 4])).toBe(true);
      expect(Point(2, 3).isLessThan([2, 3])).toBe(false);
      expect(Point(2, 3).isLessThan([2, 1])).toBe(false);
      expect(Point(2, 3).isLessThan([1, 2])).toBe(false);
    }));

  describe("::isLessThanOrEqual(other)", () =>
    it("returns a boolean indicating whether a point precedes or equal the given Point ", function () {
      expect(Point(2, 3).isLessThanOrEqual(Point(2, 5))).toBe(true);
      expect(Point(2, 3).isLessThanOrEqual(Point(3, 4))).toBe(true);
      expect(Point(2, 3).isLessThanOrEqual(Point(2, 3))).toBe(true);
      expect(Point(2, 3).isLessThanOrEqual(Point(2, 1))).toBe(false);
      expect(Point(2, 3).isLessThanOrEqual(Point(1, 2))).toBe(false);

      expect(Point(2, 3).isLessThanOrEqual([2, 5])).toBe(true);
      expect(Point(2, 3).isLessThanOrEqual([3, 4])).toBe(true);
      expect(Point(2, 3).isLessThanOrEqual([2, 3])).toBe(true);
      expect(Point(2, 3).isLessThanOrEqual([2, 1])).toBe(false);
      expect(Point(2, 3).isLessThanOrEqual([1, 2])).toBe(false);
    }));

  describe("::isGreaterThan(other)", () =>
    it("returns a boolean indicating whether a point follows the given Point ", function () {
      expect(Point(2, 3).isGreaterThan(Point(2, 5))).toBe(false);
      expect(Point(2, 3).isGreaterThan(Point(3, 4))).toBe(false);
      expect(Point(2, 3).isGreaterThan(Point(2, 3))).toBe(false);
      expect(Point(2, 3).isGreaterThan(Point(2, 1))).toBe(true);
      expect(Point(2, 3).isGreaterThan(Point(1, 2))).toBe(true);

      expect(Point(2, 3).isGreaterThan([2, 5])).toBe(false);
      expect(Point(2, 3).isGreaterThan([3, 4])).toBe(false);
      expect(Point(2, 3).isGreaterThan([2, 3])).toBe(false);
      expect(Point(2, 3).isGreaterThan([2, 1])).toBe(true);
      expect(Point(2, 3).isGreaterThan([1, 2])).toBe(true);
    }));

  describe("::isGreaterThanOrEqual(other)", () =>
    it("returns a boolean indicating whether a point follows or equal the given Point ", function () {
      expect(Point(2, 3).isGreaterThanOrEqual(Point(2, 5))).toBe(false);
      expect(Point(2, 3).isGreaterThanOrEqual(Point(3, 4))).toBe(false);
      expect(Point(2, 3).isGreaterThanOrEqual(Point(2, 3))).toBe(true);
      expect(Point(2, 3).isGreaterThanOrEqual(Point(2, 1))).toBe(true);
      expect(Point(2, 3).isGreaterThanOrEqual(Point(1, 2))).toBe(true);

      expect(Point(2, 3).isGreaterThanOrEqual([2, 5])).toBe(false);
      expect(Point(2, 3).isGreaterThanOrEqual([3, 4])).toBe(false);
      expect(Point(2, 3).isGreaterThanOrEqual([2, 3])).toBe(true);
      expect(Point(2, 3).isGreaterThanOrEqual([2, 1])).toBe(true);
      expect(Point(2, 3).isGreaterThanOrEqual([1, 2])).toBe(true);
    }));

  describe("::isEqual()", () =>
    it("returns if whether two points are equal", function () {
      expect(Point(1, 1).isEqual(Point(1, 1))).toBe(true);
      expect(Point(1, 1).isEqual([1, 1])).toBe(true);
      expect(Point(1, 2).isEqual(Point(3, 3))).toBe(false);
      expect(Point(1, 2).isEqual([3, 3])).toBe(false);
    }));

  describe("::isPositive()", () =>
    it("returns true if the point represents a forward traversal", function () {
      expect(Point(-1, -1).isPositive()).toBe(false);
      expect(Point(-1, 0).isPositive()).toBe(false);
      expect(Point(-1, Infinity).isPositive()).toBe(false);
      expect(Point(0, 0).isPositive()).toBe(false);

      expect(Point(0, 1).isPositive()).toBe(true);
      expect(Point(5, 0).isPositive()).toBe(true);
      expect(Point(5, -1).isPositive()).toBe(true);
    }));

  describe("::isZero()", () =>
    it("returns true if the point is zero", function () {
      expect(Point(1, 1).isZero()).toBe(false);
      expect(Point(0, 1).isZero()).toBe(false);
      expect(Point(1, 0).isZero()).toBe(false);
      expect(Point(0, 0).isZero()).toBe(true);
    }));

  describe("::min(a, b)", () =>
    it("returns the minimum of two points", function () {
      expect(Point.min(Point(3, 4), Point(1, 1))).toEqual(Point(1, 1));
      expect(Point.min(Point(1, 2), Point(5, 6))).toEqual(Point(1, 2));
      expect(Point.min([3, 4], [1, 1])).toEqual([1, 1]);
      expect(Point.min([1, 2], [5, 6])).toEqual([1, 2]);
    }));

  describe("::max(a, b)", () =>
    it("returns the minimum of two points", function () {
      expect(Point.max(Point(3, 4), Point(1, 1))).toEqual(Point(3, 4));
      expect(Point.max(Point(1, 2), Point(5, 6))).toEqual(Point(5, 6));
      expect(Point.max([3, 4], [1, 1])).toEqual([3, 4]);
      expect(Point.max([1, 2], [5, 6])).toEqual([5, 6]);
    }));

  describe("::translate(delta)", () =>
    it("returns a new point by adding corresponding coordinates", function () {
      expect(Point(1, 1).translate(Point(2, 3))).toEqual(Point(3, 4));
      expect(Point.INFINITY.translate(Point(2, 3))).toEqual(Point.INFINITY);

      expect(Point.ZERO.translate([5, 6])).toEqual([5, 6]);
      expect(Point(1, 1).translate([3, 4])).toEqual([4, 5]);
    }));

  describe("::traverse(delta)", () =>
    it("returns a new point by traversing given rows and columns", function () {
      expect(Point(2, 3).traverse(Point(0, 3))).toEqual(Point(2, 6));
      expect(Point(2, 3).traverse([0, 3])).toEqual([2, 6]);

      expect(Point(1, 3).traverse(Point(4, 2))).toEqual([5, 2]);
      expect(Point(1, 3).traverse([5, 4])).toEqual([6, 4]);
    }));

  describe("::traversalFrom(other)", () =>
    it("returns a point that other has to traverse to get to given point", function () {
      expect(Point(2, 5).traversalFrom(Point(2, 3))).toEqual(Point(0, 2));
      expect(Point(2, 3).traversalFrom(Point(2, 5))).toEqual(Point(0, -2));
      expect(Point(2, 3).traversalFrom(Point(2, 3))).toEqual(Point(0, 0));

      expect(Point(3, 4).traversalFrom(Point(2, 3))).toEqual(Point(1, 4));
      expect(Point(2, 3).traversalFrom(Point(3, 5))).toEqual(Point(-1, 3));

      expect(Point(2, 5).traversalFrom([2, 3])).toEqual([0, 2]);
      expect(Point(2, 3).traversalFrom([2, 5])).toEqual([0, -2]);
      expect(Point(2, 3).traversalFrom([2, 3])).toEqual([0, 0]);

      expect(Point(3, 4).traversalFrom([2, 3])).toEqual([1, 4]);
      expect(Point(2, 3).traversalFrom([3, 5])).toEqual([-1, 3]);
    }));

  describe("::toArray()", () =>
    it("returns an array of row and column", function () {
      expect(Point(1, 3).toArray()).toEqual([1, 3]);
      expect(Point.ZERO.toArray()).toEqual([0, 0]);
      expect(Point.INFINITY.toArray()).toEqual([Infinity, Infinity]);
    }));

  describe("::serialize()", () =>
    it("returns an array of row and column", function () {
      expect(Point(1, 3).serialize()).toEqual([1, 3]);
      expect(Point.ZERO.serialize()).toEqual([0, 0]);
      expect(Point.INFINITY.serialize()).toEqual([Infinity, Infinity]);
    }));

  describe("::toString()", () =>
    it("returns string representation of Point", function () {
      expect(Point(4, 5).toString()).toBe("(4, 5)");
      expect(Point.ZERO.toString()).toBe("(0, 0)");
      expect(Point.INFINITY.toString()).toBe("(Infinity, Infinity)");
    }));
});
