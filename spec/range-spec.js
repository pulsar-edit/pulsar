const Range = require("../src/range");

describe("Range", function () {
  beforeEach(() =>
    jasmine.addCustomEqualityTester(require("@lumine-code/underscore-plus").isEqual),
  );

  describe("::intersectsWith(other, [exclusive])", function () {
    const intersectsWith = function (range1, range2, exclusive) {
      range1 = Range.fromObject(range1);
      range2 = Range.fromObject(range2);
      return range1.intersectsWith(range2, exclusive);
    };

    describe("when the exclusive argument is false (the default)", () => {
      it("returns true if the ranges intersect, exclusive of their endpoints", function () {
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 0],
              [1, 1],
            ],
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 1],
              [1, 2],
            ],
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 1],
              [1, 3],
            ],
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 4],
              [4, 5],
            ],
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 3],
              [4, 5],
            ],
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 5],
              [2, 2],
            ],
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 5],
              [4, 4],
            ],
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 2],
              [1, 2],
            ],
            true,
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 4],
              [3, 4],
            ],
            true,
          ),
        ).toBe(false);
      });
    });

    describe("when the exclusive argument is true", () => {
      it("returns true if the ranges intersect, exclusive of their endpoints", function () {
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 0],
              [1, 1],
            ],
            true,
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 1],
              [1, 2],
            ],
            true,
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 1],
              [1, 3],
            ],
            true,
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 4],
              [4, 5],
            ],
            true,
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 3],
              [4, 5],
            ],
            true,
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 5],
              [2, 2],
            ],
            true,
          ),
        ).toBe(true);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 5],
              [4, 4],
            ],
            true,
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [1, 2],
              [1, 2],
            ],
            true,
          ),
        ).toBe(false);
        expect(
          intersectsWith(
            [
              [1, 2],
              [3, 4],
            ],
            [
              [3, 4],
              [3, 4],
            ],
            true,
          ),
        ).toBe(false);
      });
    });
  });

  describe("::negate()", () => {
    it("should negate the start and end points", function () {
      expect(new Range([0, 0], [0, 0]).negate().toString()).toBe("[(0, 0) - (0, 0)]");
      expect(new Range([1, 2], [3, 4]).negate().toString()).toBe("[(-3, -4) - (-1, -2)]");
      expect(new Range([-1, -2], [-3, -4]).negate().toString()).toBe("[(1, 2) - (3, 4)]");
      expect(new Range([-1, 2], [3, -4]).negate().toString()).toBe("[(-3, 4) - (1, -2)]");
    });
  });
});
