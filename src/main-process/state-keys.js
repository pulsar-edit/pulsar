// This file is responsible for managing and assigning "state keys" to windows.
//
// The state key is what we use to serialize this window's state in our state
// store (IndexedDB or SQLite). Ideally, it is produced by a hash of the sorted
// root paths for a given project; this allows us to determine the hypothetical
// state keys for other windows ("is there a state key for a window with paths
// X and Y?") so that we can adopt an orphaned state into an existing empty
// window when appropriate.
//
// But we also need a fallback case for when the ideal state key is already
// taken! There is no requirement for uniqueness of project root sets among
// open windows, so two windows could both be open at once and share the same
// root(s). (This is common, in fact, for users that are used to right-clicking
// in the tree view and selecting the "Open in New Window" option.)
//
// Hence, if the ideal key is taken, we fall back to a randomly generated state
// key. Randomly generated keys will never be used in state adoption, since
// they cannot be derived simply from a set of paths; but that's OK, since it
// implies that there's an existing window that can contibute its state for
// adoption.

const crypto = require('crypto');

const USED_KEYS = new Set();
let STATE_KEYS_BY_WINDOW = new WeakMap();

// Compute the state key used when
function getIdealStateKey (projectPaths) {
  if (!Array.isArray(projectPaths) || projectPaths.length === 0) {
    return null;
  }
  let normalizedPathString = projectPaths.slice().sort().join('\n');
  let hash = crypto.createHash('sha1').update(normalizedPathString).digest('hex');
  return `editor-${hash}`;
}

function getRandomStateKey () {
  return `editor-${crypto.randomUUID()}`;
}

// Given a window and its project paths, retrieves that window's unique key for
// state serialization purposes, creating one if it does not already exist.
function getStateKey (win, projectPaths, { pathsOnly = false } = {}) {
  if (pathsOnly) {
    // We don't want to know this window's state key; we want to know what the
    // state key of a project window _would_ be if it were computed from the
    // given project paths. (This is used when one window wants to adopt
    // another window's state.)
    return getIdealStateKey(projectPaths);
  }

  let existingKey = STATE_KEYS_BY_WINDOW.get(win);
  if (existingKey) {
    return existingKey;
  }

  let idealKey = getIdealStateKey(projectPaths);

  let actualKey = idealKey;
  if (actualKey === null) return null;

  if (USED_KEYS.has(idealKey)) {
    actualKey = getRandomStateKey();
  }
  USED_KEYS.add(actualKey);
  STATE_KEYS_BY_WINDOW.set(win, actualKey);
  return actualKey;
}

// Reserve a given state key if it's free to reserve. Otherwise will generate a
// new random state key and reserve that instead.
//
// This function is called during startup if there are existing serialized
// windows to restore, since they'll have remembered their state keys from the
// previous session. This lets us skip generating a new one or re-computing the
// old one.
function reserveStateKey (win, requestedStateKey) {
  let stateKey = requestedStateKey;
  if (USED_KEYS.has(stateKey)) {
    // If this window has already reserved this state key, we can bail early.
    if (STATE_KEYS_BY_WINDOW.get(win) === stateKey) return;
    stateKey = getRandomStateKey();
  }
  USED_KEYS.add(stateKey);
  STATE_KEYS_BY_WINDOW.set(win, stateKey);
}

// Unregister a state key for a window. Call this when the window is about to
// be destroyed so that its state key can be reused by a future window.
function releaseStateKey (win) {
  let stateKey = STATE_KEYS_BY_WINDOW.get(win);
  if (!stateKey) return;
  USED_KEYS.delete(stateKey);
}

function resetStateKeys () {
  USED_KEYS.clear();
  STATE_KEYS_BY_WINDOW = new WeakMap();
}

module.exports = { getStateKey, releaseStateKey, reserveStateKey, resetStateKeys };
