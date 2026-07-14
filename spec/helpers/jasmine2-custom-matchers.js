const _ = require("@lumine-code/underscore-plus");
const fs = require("@lumine-code/fs-plus");
const path = require("path");

const getElement = (actual) => {
  if (actual instanceof HTMLElement) {
    return actual;
  } else if (actual && actual.jquery) {
    return actual.get(0);
  } else {
    return actual;
  }
};

const getElementString = (actual) => {
  if (actual instanceof HTMLElement) {
    return actual.outerHTML;
  } else if (actual && actual.jquery) {
    return actual.html();
  } else {
    return String(actual);
  }
};

const hasProperty = (actualValue, expectedValue) => {
  if (expectedValue === undefined) {
    return actualValue !== undefined;
  } else {
    return actualValue == expectedValue;
  }
};

exports.register = (jasmineEnv) => {
  jasmineEnv.beforeEach(function () {
    jasmineEnv.addCustomEqualityTester(function (a, b) {
      // Match jasmine.any's equality matching logic
      if ((a != null ? a.jasmineMatches : undefined) != null) {
        return a.jasmineMatches(b);
      }
      if ((b != null ? b.jasmineMatches : undefined) != null) {
        return b.jasmineMatches(a);
      }

      // Use underscore's definition of equality for toEqual assertions
      return _.isEqual(a, b);
    });

    jasmineEnv.addMatchers({
      toHaveLength: function (util, customEqualityTesters) {
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
        };
      },

      toExistOnDisk: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            return {
              pass: fs.existsSync(actual),
              message: `Expected path '${actual}' to exist.`,
            };
          },
        };
      },

      toHaveFocus: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            if (!document.hasFocus()) {
              console.error(
                "Specs will fail because the Dev Tools have focus. To fix this close the Dev Tools or click the spec runner.",
              );
            }

            const element = getElement(actual);

            return {
              pass: element === document.activeElement || element.contains(document.activeElement),
              message: `Expected element '${actual}' or its descendants to have focus.`,
            };
          },
        };
      },

      toShow: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            const element = getElement(actual);
            const computedStyle = getComputedStyle(element);

            return {
              pass:
                computedStyle.display !== "none" &&
                computedStyle.visibility === "visible" &&
                !element.hidden,
              message: `Expected element '${element}' or its descendants to show.`,
            };
          },
        };
      },

      toBeVisible: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            let pass;
            if (actual == null) {
              pass = false;
            } else if (actual instanceof HTMLElement) {
              pass = actual.offsetWidth !== 0 || actual.offsetHeight !== 0;
            } else {
              pass = actual.is(":visible");
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to be visible`,
            };
          },
        };
      },

      toBeHidden: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            let pass;
            if (actual == null) {
              pass = false;
            } else if (actual instanceof HTMLElement) {
              pass = actual.offsetWidth === 0 && actual.offsetHeight === 0;
            } else {
              pass = actual.is(":hidden");
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to be hidden`,
            };
          },
        };
      },

      toEqualPath: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            const actualPath = path.normalize(actual);
            const expectedPath = path.normalize(expected);

            return {
              pass: actualPath === expectedPath,
              message: `Expected path '${actualPath}' to be equal to '${expectedPath}'.`,
            };
          },
        };
      },

      toBeNear: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            let acceptedError = 1;

            return {
              pass: expected - acceptedError <= actual && actual <= expected + acceptedError,
              message: `Expected '${actual}' to be near to '${expected}'.`,
            };
          },
        };
      },

      toHaveNearPixels: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            let acceptedError = 1;

            const expectedNumber = parseFloat(expected);
            const actualNumber = parseFloat(actual);

            return {
              pass:
                expected.indexOf("px") >= 1 &&
                actual.indexOf("px") >= 1 &&
                expectedNumber - acceptedError <= actualNumber &&
                actualNumber <= expectedNumber + acceptedError,
              message: `Expected '${actual}' to have near pixels to '${expected}'.`,
            };
          },
        };
      },

      toHaveHtml: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            let actualHTML;
            if (actual instanceof HTMLElement) {
              actualHTML = actual.innerHTML;
            } else {
              actualHTML = actual.html();
            }

            const container = document.createElement("div");
            container.innerHTML = expected;
            const expectedHTML = container.innerHTML;

            return {
              pass: actualHTML === expectedHTML,
              message: `Expected '${actualHTML}' to equal HTML '${expectedHTML}'`,
            };
          },
        };
      },

      toHaveAttr: function (util, customEqualityTesters) {
        return {
          compare: function (actual, attributeName, expectedAttributeValue) {
            let actualAttributeValue;
            if (actual instanceof HTMLElement) {
              actualAttributeValue = actual.getAttribute(attributeName);
            } else {
              actualAttributeValue = actual.attr(attributeName);
            }

            return {
              pass: hasProperty(actualAttributeValue, expectedAttributeValue),
              message: `Expected '${getElementString(actual)}' to have attribute '${attributeName}'`,
            };
          },
        };
      },

      toHaveId: function (util, customEqualityTesters) {
        return {
          compare: function (actual, id) {
            let actualId;
            if (actual instanceof HTMLElement) {
              actualId = actual.getAttribute("id");
            } else {
              actualId = actual.attr("id");
            }

            return {
              pass: actualId == id,
              message: `Expected '${getElementString(actual)}' to have id '${id}'`,
            };
          },
        };
      },

      toHaveData: function (util, customEqualityTesters) {
        return {
          compare: function (actual, key, expectedValue) {
            let actualValue;
            if (actual instanceof HTMLElement) {
              const camelCaseKey = key.replace(/-([a-z])/g, (_match, letter) =>
                letter.toUpperCase(),
              );
              actualValue = actual.dataset[camelCaseKey];
            } else {
              actualValue = actual.data(key);
            }

            return {
              pass: hasProperty(actualValue, expectedValue),
              message: `Expected '${actualValue}' to equal data '${expectedValue}'`,
            };
          },
        };
      },

      toHaveValue: function (util, customEqualityTesters) {
        return {
          compare: function (actual, value) {
            let actualValue;
            if (actual instanceof HTMLElement) {
              actualValue = actual.value;
            } else {
              actualValue = actual.val();
            }

            return {
              pass: actualValue == value,
              message: `Expected '${getElementString(actual)}' to have value '${value}'`,
            };
          },
        };
      },

      toMatchSelector: function (util, customEqualityTesters) {
        return {
          compare: function (actual, selector) {
            let pass;
            if (actual instanceof HTMLElement) {
              pass = actual.matches(selector);
            } else {
              pass = actual.is(selector);
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to match selector '${selector}'`,
            };
          },
        };
      },

      toContain: function (util, customEqualityTesters) {
        return {
          compare: function (actual, contained) {
            let pass;
            if (actual instanceof HTMLElement) {
              if (typeof contained === "string") {
                pass = actual.querySelector(contained) != null;
              } else {
                pass = actual.contains(contained);
              }
            } else if (actual && actual.jquery) {
              pass = actual.find(contained).size() > 0;
            } else {
              pass = util.contains(actual, contained, customEqualityTesters);
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to contain '${contained}'`,
            };
          },
        };
      },

      toBeSelected: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            let pass;
            if (actual instanceof HTMLElement) {
              pass = actual.selected;
            } else {
              pass = actual.is(":selected");
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to be selected`,
            };
          },
        };
      },

      toBeChecked: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            let pass;
            if (actual instanceof HTMLElement) {
              pass = actual.checked;
            } else {
              pass = actual.is(":checked");
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to be checked`,
            };
          },
        };
      },

      toBeEmpty: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            let pass;
            if (actual instanceof HTMLElement) {
              pass = actual.innerHTML === "";
            } else {
              pass = actual.is(":empty");
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to be empty`,
            };
          },
        };
      },

      toBeDisabled: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            let pass;
            if (actual instanceof HTMLElement) {
              pass = actual.disabled;
            } else {
              pass = actual.is(":disabled");
            }

            return {
              pass,
              message: `Expected '${getElementString(actual)}' to be disabled`,
            };
          },
        };
      },

      toNotMatch: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            return {
              pass: !new RegExp(expected).test(actual),
              message: `Expected '${actual}' not to match '${expected}'`,
            };
          },
        };
      },

      toHaveClass: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            return {
              pass: actual instanceof HTMLElement && actual.classList.contains(expected),
              message: `Expected '${actual}' to have '${expected}' class`,
            };
          },
        };
      },

      toHaveText: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            return {
              pass: actual instanceof HTMLElement && actual.textContent == expected,
              message: `Expected '${actual}' to have text: '${expected}'`,
            };
          },
        };
      },

      toExist: function (util, customEqualityTesters) {
        return {
          compare: function (actual) {
            if (actual instanceof HTMLElement) {
              return { pass: true };
            } else if (actual) {
              return { pass: actual.size() > 0 };
            } else {
              return { pass: false };
            }
          },
        };
      },

      // Legacy jasmine 1.x matcher: the inverse of `toEqual`.
      toNotEqual: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            return {
              pass: !util.equals(actual, expected, customEqualityTesters),
              message: `Expected ${actual} not to equal ${expected}`,
            };
          },
        };
      },

      // Legacy jasmine 1.x matcher: the inverse of `toBe`.
      toNotBe: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            return {
              pass: actual !== expected,
              message: `Expected ${actual} not to be ${expected}`,
            };
          },
        };
      },

      // Passes when `actual` is an array containing every element of `expected`.
      toContainAll: function (util, customEqualityTesters) {
        return {
          compare: function (actual, expected) {
            const pass =
              Array.isArray(actual) &&
              expected.every((el) => util.contains(actual, el, customEqualityTesters));
            return {
              pass,
              message: `Expected ${JSON.stringify(actual)} to contain all of ${JSON.stringify(expected)}`,
            };
          },
        };
      },

      // `toSatisfy(predicate)` calls `predicate(actual, reason)`; the predicate
      // returns whether the assertion passes and may call `reason(message)` to
      // supply the failure message.
      toSatisfy: function (util, customEqualityTesters) {
        return {
          compare: function (actual, predicate) {
            let message = `Expected ${actual} to satisfy predicate`;
            const reason = (m) => {
              message = m;
            };
            const pass = predicate(actual, reason);
            return { pass, message };
          },
        };
      },
    });
  });
};
