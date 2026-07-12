const assert = require("node:assert/strict");

assert.isAbove = (actual, expected) => assert.ok(actual > expected);
assert.isDefined = (actual) => assert.notStrictEqual(actual, undefined);
assert.isFalse = (actual) => assert.strictEqual(actual, false);
assert.isNotNull = (actual) => assert.notStrictEqual(actual, null);
assert.isNull = (actual) => assert.strictEqual(actual, null);
assert.isTrue = (actual) => assert.strictEqual(actual, true);
assert.isUndefined = (actual) => assert.strictEqual(actual, undefined);
assert.lengthOf = (actual, expected) => assert.strictEqual(actual.length, expected);

module.exports = assert;
