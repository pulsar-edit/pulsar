/* globals assert */

const { getStateKey, reserveStateKey, releaseStateKey, resetStateKeys } = require('../../src/main-process/state-keys');

// Create a minimal stand-in for an AtomWindow. State keys only care about
// object identity, so a plain object is sufficient.
function makeWindow() {
  return {};
}

describe('state-keys', function() {
  describe('getStateKey', function() {
    afterEach(() => resetStateKeys());

    it('returns a key with the editor- prefix', function() {
      const win = makeWindow();
      const key = getStateKey(win, ['/some/path']);
      assert.match(key, /^editor-/);
    });

    it('returns a hash-based key for a given set of paths', function() {
      const win = makeWindow();
      const key = getStateKey(win, ['/some/path']);
      assert.match(key, /^editor-[0-9a-f]{40}$/);
    });

    it('returns the same key on repeated calls for the same window', function() {
      const win = makeWindow();
      const key1 = getStateKey(win, ['/some/path']);
      const key2 = getStateKey(win, ['/some/path']);
      assert.strictEqual(key1, key2);
    });

    it('returns the same key regardless of path order (when pathsOnly is true)', function() {
      const win1 = makeWindow();
      const win2 = makeWindow();
      // Since we're passing `pathsOnly: true`, `getStateKey` becomes a pure
      // function that computes state key from paths and nothing else. When
      // `pathsOnly` is `false` (as it is by default), `getStateKey` would
      // notice the collision and assign `key2` a randomly generated key to
      // avoid it.
      const key1 = getStateKey(win1, ['/path/a', '/path/b'], { pathsOnly: true });
      const key2 = getStateKey(win2, ['/path/b', '/path/a'], { pathsOnly: true });
      assert.strictEqual(key1, key2);
    });

    it('returns different keys for windows with different paths', function() {
      const win1 = makeWindow();
      const win2 = makeWindow();
      const key1 = getStateKey(win1, ['/path/a']);
      const key2 = getStateKey(win2, ['/path/b']);
      assert.notStrictEqual(key1, key2);
    });

    it('assigns a random key when the ideal hash key is already taken', function() {
      const win1 = makeWindow();
      const win2 = makeWindow();
      const key1 = getStateKey(win1, ['/path/a']);
      const key2 = getStateKey(win2, ['/path/a']);
      assert.notStrictEqual(key1, key2);
      // The second key should be a UUID-based fallback, not a 40-char hash
      assert.match(key2, /^editor-[0-9a-f]{8}-[0-9a-f]{4}-/);
    });

    it('allows the ideal key to be reused after its window is released', function() {
      const win1 = makeWindow();
      const key1 = getStateKey(win1, ['/path/a']);
      releaseStateKey(win1);

      const win2 = makeWindow();
      const key2 = getStateKey(win2, ['/path/a']);
      assert.strictEqual(key1, key2);
    });

    describe('with pathsOnly: true', function() {
      it('always returns the hash-based key, ignoring what the window is registered as', function() {
        const win = makeWindow();
        // Register the window under the hash key for /path/a
        getStateKey(win, ['/path/a']);

        // Now a second window claims /path/a and takes the hash key...
        const win2 = makeWindow();
        getStateKey(win2, ['/path/a']);
        // ...so win gets a UUID. A pathsOnly call should still return the hash.

        const idealKey = getStateKey(win, ['/path/a'], { pathsOnly: true });
        assert.match(idealKey, /^editor-[0-9a-f]{40}$/);
      });

      it('does not register any key for the window', function() {
        const freshWin = makeWindow();
        getStateKey(freshWin, ['/path/z'], { pathsOnly: true });

        // The window should have no registered key; a subsequent normal call
        // should go through the full assignment path, not return a cached value.
        const win2 = makeWindow();
        const hashKey = getStateKey(win2, ['/path/z']);

        // If pathsOnly had registered a key for freshWin and claimed the hash,
        // win2 would get a UUID. It should get the hash.
        assert.match(hashKey, /^editor-[0-9a-f]{40}$/);
      });
    });
  });

  describe('reserveStateKey', function() {
    it('pre-registers a key so getStateKey returns it immediately', function() {
      const savedKey = 'editor-' + 'a'.repeat(40);
      const win = makeWindow();
      reserveStateKey(win, savedKey);

      const key = getStateKey(win, ['/any/path']);
      assert.strictEqual(key, savedKey);
    });

    it('blocks other windows from claiming the same key', function() {
      const savedKey = 'editor-' + 'a'.repeat(40);
      const win1 = makeWindow();
      const win2 = makeWindow();

      reserveStateKey(win1, savedKey);
      // win2's ideal key would also be savedKey if the paths matched, but
      // since we can't trivially craft that, we test via a second reserveStateKey.
      reserveStateKey(win2, savedKey);
      const key2actual = getStateKey(win2, []);
      // win2 should have a random key since savedKey was taken
      assert.notStrictEqual(key2actual, savedKey);
    });

    it('assigns a random key when the requested key is already taken by another window', function() {
      const savedKey = 'editor-' + 'b'.repeat(40);
      const win1 = makeWindow();
      const win2 = makeWindow();

      reserveStateKey(win1, savedKey);
      reserveStateKey(win2, savedKey);

      const key1 = getStateKey(win1, []);
      const key2 = getStateKey(win2, []);
      assert.strictEqual(key1, savedKey);
      assert.notStrictEqual(key2, savedKey);
      assert.match(key2, /^editor-[0-9a-f]{8}-[0-9a-f]{4}-/);
    });

    it('is idempotent when called twice with the same window and key', function() {
      const savedKey = 'editor-' + 'c'.repeat(40);
      const win = makeWindow();

      reserveStateKey(win, savedKey);
      // should not throw or reassign
      reserveStateKey(win, savedKey);

      assert.strictEqual(getStateKey(win, []), savedKey);
    });
  });

  describe('releaseStateKey', function() {
    it('allows the released key to be claimed by a new window', function() {
      const win1 = makeWindow();
      const key1 = getStateKey(win1, ['/path/a']);
      releaseStateKey(win1);

      const win2 = makeWindow();
      const key2 = getStateKey(win2, ['/path/a']);
      assert.strictEqual(key2, key1);
    });

    it('is a no-op for a window that was never assigned a key', function() {
      const win = makeWindow();
      assert.doesNotThrow(() => releaseStateKey(win));
    });
  });
});
