// Small chai.assert-compatible shim backed by node:assert, so the specs can
// keep their existing `assert.*` calls without depending on chai.
const nodeAssert = require("assert");

function assert(value, message) {
  nodeAssert.ok(value, message);
}

assert.equal = (actual, expected, message) => nodeAssert.equal(actual, expected, message);
assert.notEqual = (actual, expected, message) => nodeAssert.notEqual(actual, expected, message);
assert.deepEqual = (actual, expected, message) => nodeAssert.deepEqual(actual, expected, message);
assert.notDeepEqual = (actual, expected, message) =>
  nodeAssert.notDeepEqual(actual, expected, message);
assert.isTrue = (value, message) => nodeAssert.strictEqual(value, true, message);
assert.isFalse = (value, message) => nodeAssert.strictEqual(value, false, message);
assert.isNull = (value, message) => nodeAssert.strictEqual(value, null, message);
assert.ok = (value, message) => nodeAssert.ok(value, message);
assert.notOk = (value, message) => nodeAssert.ok(!value, message);
assert.lengthOf = (object, length, message) => nodeAssert.equal(object.length, length, message);
assert.match = (value, regexp, message) => nodeAssert.match(value, regexp, message);

assert.include = (haystack, needle, message) => {
  if (typeof haystack === "string" || Array.isArray(haystack)) {
    nodeAssert.ok(haystack.includes(needle), message);
  } else {
    for (const key of Object.keys(needle)) {
      nodeAssert.deepEqual(haystack[key], needle[key], message);
    }
  }
};

// chai.assert.throws(fn, matcher?, message?): when matcher is a string it is
// matched against the thrown error's message (node:assert would treat a string
// as the assertion message instead), so handle that case explicitly.
assert.throws = (fn, matcher, message) => {
  if (typeof matcher === "string") {
    nodeAssert.throws(fn, (error) => {
      nodeAssert.ok(error.message.includes(matcher), message);
      return true;
    });
  } else if (matcher != null) {
    nodeAssert.throws(fn, matcher, message);
  } else {
    nodeAssert.throws(fn);
  }
};

module.exports = assert;
