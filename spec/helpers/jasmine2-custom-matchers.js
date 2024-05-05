const _ = require("underscore-plus");
const fs = require("fs-plus");
const path = require("path");

beforeEach(function () {
  jasmine.getEnv().addCustomEqualityTester(function(a, b) {
    // Match jasmine.any's equality matching logic
    if ((a != null ? a.jasmineMatches : undefined) != null) { return a.jasmineMatches(b); }
    if ((b != null ? b.jasmineMatches : undefined) != null) { return b.jasmineMatches(a); }

    // Use underscore's definition of equality for toEqual assertions
    return _.isEqual(a, b);
  });

  jasmine.getEnv().addMatchers({
    toHaveLength: function(util, customEqualityTesters) {
      return {
        compare: function (actual, expected) {
          if (actual == null) {
            return {
              pass: false,
              message: `Expected object ${actual} has no length method`,
            };
          } else {
            return {
              pass: actual.length === expected,
              message: `Expected object with length ${actual.length} to have length ${expected}`,
            };
          }
        },
      }
    },

    toExistOnDisk: function(util, customEqualityTesters) {
      return {
        compare: function (actual) {
          return {
            pass: fs.existsSync(actual),
            message: `Expected path '${actual}' to exist.`,
          };
        },
      }
    },

    toHaveFocus: function(util, customEqualityTesters) {
      return {
        compare: function (actual) {
          if (!document.hasFocus()) {
            console.error("Specs will fail because the Dev Tools have focus. To fix this close the Dev Tools or click the spec runner.");
          }

          let element = actual;
          if (element.jquery) {
            element = element.get(0);
          }

          return {
            pass: (element === document.activeElement) || element.contains(document.activeElement),
            message: `Expected element '${actual}' or its descendants to have focus.`,
          };
        },
      }
    },

    toShow: function(util, customEqualityTesters) {
      return {
        compare: function (actual) {
          let element = actual;
          if (element.jquery) {
            element = element.get(0);
          }
          const computedStyle = getComputedStyle(element);

          return {
            pass: (computedStyle.display !== 'none') && (computedStyle.visibility === 'visible') && !element.hidden,
            message: `Expected element '${element}' or its descendants to show.`,
          };
        },
      }
    },

    toEqualPath: function(util, customEqualityTesters) {
      return {
        compare: function (actual, expected) {
          const actualPath = path.normalize(actual);
          const expectedPath = path.normalize(expected);

          return {
            pass: actualPath === expectedPath,
            message: `Expected path '${actualPath}' to be equal to '${expectedPath}'.`,
          };
        },
      }
    },

    toBeNear: function(util, customEqualityTesters) {
      return {
        compare: function (actual, expected) {
          let acceptedError = 1;

          return {
            pass: ((expected - acceptedError) <= actual) && (actual <= (expected + acceptedError)),
            message: `Expected '${actual}' to be near to '${expected}'.`,
          };
        },
      }
    },

    toHaveNearPixels: function(util, customEqualityTesters) {
      return {
        compare: function (actual, expected) {
          let acceptedError = 1;

          const expectedNumber = parseFloat(expected);
          const actualNumber = parseFloat(actual);

          return {
            pass: (expected.indexOf('px') >= 1) && (actual.indexOf('px') >= 1) && ((expectedNumber - acceptedError) <= actualNumber) && (actualNumber <= (expectedNumber + acceptedError)),
            message: `Expected '${actual}' to have near pixels to '${expected}'.`,
          }
        }
      }
    },

    toHaveClass: function(util, customEqualityTesters) {
      return {
        compare: function (actual, expected) {
          return {
            pass: actual instanceof HTMLElement && actual.classList.contains(expected),
            message: `Expected '${actual}' to have '${expected}' class`
          }
        }
      }
    },

    toHaveText: function(util, customEqualityTesters) {
      return {
        compare: function (actual, expected) {
          return {
            pass: actual instanceof HTMLElement && actual.textContent == expected,
            message: `Expected '${actual}' to have text: '${expected}'`
          }
        }
      }
    },

    toExist: function(util, customEqualityTesters) {
      return {
        compare: function (actual) {
          if (actual instanceof HTMLElement) {
            return { pass: true }
          } else if (actual) {
            return { pass: actual.size() > 0 }
          } else {
            return { pass: false }
          }
        }
      }
    }
  });
});
