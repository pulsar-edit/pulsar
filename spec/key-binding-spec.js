const assert = require('./keymap-spec-helpers/assert')
var KeyBinding, MATCH_TYPES, keyBindingArgHelper;

({KeyBinding, MATCH_TYPES} = require('../src/key-binding'));

describe("KeyBinding", function() {
  return describe(".matchesKeystrokes(userKeystrokes)", function() {
    it("returns 'exact' for exact matches", function() {
      assert.equal(keyBindingArgHelper('ctrl-tab ^tab ^ctrl').matchesKeystrokes(['ctrl-tab', '^tab', '^ctrl']), 'exact');
      assert.equal(keyBindingArgHelper('ctrl-tab ^ctrl').matchesKeystrokes(['ctrl-tab', '^tab', '^ctrl']), 'exact');
      assert.equal(keyBindingArgHelper('a b c').matchesKeystrokes(['a', '^a', 'b', '^b', 'c']), 'exact');
      assert.equal(keyBindingArgHelper('a b ^b c').matchesKeystrokes(['a', '^a', 'b', '^b', 'c']), 'exact');
      return assert.equal(keyBindingArgHelper('a ^').matchesKeystrokes(['a', '^a', '^']), 'exact');
    });
    it("returns false for non-matches", function() {
      assert.equal(keyBindingArgHelper('ctrl-tab ^tab').matchesKeystrokes(['ctrl-tab', '^tab', '^ctrl']), false);
      assert.equal(keyBindingArgHelper('a b c').matchesKeystrokes(['a', '^a', 'b', '^b', 'c', '^c']), false);
      assert.equal(keyBindingArgHelper('a b ^b c').matchesKeystrokes(['a', '^a', 'b', '^b', 'c', '^c']), false);
      assert.equal(keyBindingArgHelper('a').matchesKeystrokes(['a', '^a', 'b', '^b', 'c', '^c']), false);
      assert.equal(keyBindingArgHelper('a').matchesKeystrokes(['a', '^a']), false);
      assert.equal(keyBindingArgHelper('a c').matchesKeystrokes(['a', '^a', 'b', '^b', 'c', '^c']), false);
      assert.equal(keyBindingArgHelper('a b ^d').matchesKeystrokes(['a', '^a', 'b', '^b', 'c', '^c']), false);
      assert.equal(keyBindingArgHelper('a d ^d').matchesKeystrokes(['a', '^a', 'b', '^b', 'c', '^c']), false);
      return assert.equal(keyBindingArgHelper('a d ^d').matchesKeystrokes(['^c']), false);
    });
    it("returns 'partial' for partial matches", function() {
      assert.equal(keyBindingArgHelper('a b ^b').matchesKeystrokes(['a']), 'partial');
      assert.equal(keyBindingArgHelper('a b c').matchesKeystrokes(['a']), 'partial');
      assert.equal(keyBindingArgHelper('a b c').matchesKeystrokes(['a', '^a']), 'partial');
      assert.equal(keyBindingArgHelper('a b c').matchesKeystrokes(['a', '^a', 'b']), 'partial');
      assert.equal(keyBindingArgHelper('a b c').matchesKeystrokes(['a', '^a', 'b', '^b']), 'partial');
      return assert.equal(keyBindingArgHelper('a b c').matchesKeystrokes(['a', '^a', 'd', '^d']), false);
    });
    it("returns 'partial' correctly for bindings that end in ^", function() {
      return assert.equal(keyBindingArgHelper('g a ^').matchesKeystrokes(['g', '^g', 'a', '^a']), 'partial');
    });
    return it("returns MATCH_TYPES.PENDING_KEYUP for bindings that match and contain a remainder of only keyup events", function() {
      return assert.equal(keyBindingArgHelper('a b ^b').matchesKeystrokes(['a', 'b']), MATCH_TYPES.PENDING_KEYUP);
    });
  });
});

keyBindingArgHelper = function(binding) {
  return new KeyBinding('test', 'test', binding, 'body', 0);
};
