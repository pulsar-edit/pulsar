const el = require('./element-builder');

const murmur = require('murmurhash-js');
const BADGE_TEXT_HASH_MAP = new Map();

/**
 * Ensures an object can be iterated over.
 *
 * The contract with the symbol providers is that they return an object that
 * gives us symbol objects when we iterate over it. It'll probably be an array,
 * but we're cool with anything iterable.
 *
 * @param   {?} obj Anything.
 * @returns {Boolean} Whether the item will respond correctly to a `for..of`
 *   loop.
 */
function isIterable(obj) {
  if (obj === null || obj === undefined) return false;
  return typeof obj[Symbol.iterator] === 'function';
}

/**
 * Returns a promise that resolves after a given number of milliseconds.
 * @param   {Number} ms Number of milliseconds after which to resolve.
 * @returns {Promise<true>} A promise that resolves with `true` as its argument.
 */
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms, true));
}

/**
 * Given a string of text, returns a hexadecimal character from `0` to `f` to
 * represent a classification “bucket.” This is used when assigning colors to
 * various symbol badges.
 *
 * @param   {String} text The text of the badge.
 * @returns {String} A single character that represents a hexadecimal digit.
 */
function getBadgeTextVariant(text) {
  // The goal here is to give each tag a color such that (a) two things with the
  // same tag will have badges of identical colors, and (b) two things with
  // different tags are very likely to have badges of different colors. We use a
  // fast (non-cryptographic) hashing algorithm, convert its return integer to
  // hex, then take the final character; this, in effect, gives a piece of text
  // an equal chance of being sorted into any of sixteen random buckets.
  //
  // In the CSS, we generate sixteen badge colors based on the user's UI theme;
  // they are identical in saturation and brightness and vary only in hue.
  if (BADGE_TEXT_HASH_MAP.has(text)) {
    return BADGE_TEXT_HASH_MAP.get(text);
  }
  let hash = murmur.murmur3(text, 'symbols-view').toString(16);
  let variantType = hash.charAt(hash.length - 1);
  BADGE_TEXT_HASH_MAP.set(text, variantType);
  return variantType;
}

/**
 * Return a DOM element for a badge for a given symbol tag name.
 *
 * @param   {String} text The text of the tag.
 * @param   {Object} options Options. Defaults to an empty object.
 * @param   {Boolean} options.variant Whether to add a class name for the badge's
 *   “variant.” If enabled, this will attempt to assign a different badge color
 *   for each kind of tag. Optional; defaults to `false`.
 * @returns {Element} An element for adding to an `atom-select-view` entry.
 */
function badge(text, options = {}) {
  let { variant = false } = options;
  let classNames = `.badge.badge-info.badge-flexible.badge-symbol-tag`;
  if (variant) {
    let variantType = getBadgeTextVariant(text);
    classNames += `.symbols-view-badge-variant-${variantType}`;
  }
  return el(`span${classNames}`, text);
}

const MIGRATED_SETTINGS_MESSAGE = `The \`symbols-view\` package has migrated the setting \`symbols-view.useEditorGrammarAsCtagsLanguage\` to its new location inside the core package \`symbol-provider-ctags\`. If you have defined any scope-specific overrides for this setting, you’ll need to change those overrides manually.`;

// TODO: This function performs a one-time config migration. We can remove this
// chore in the future when we feel like it's served its purpose.
function migrateOldConfigIfNeeded({ force = false } = {}) {
  if (!force) {
    // Look up the schema for `symbols-view` and make sure that the deprecated
    // setting isn't present.
    let schema = atom.config.getSchema('symbols-view');
    if (schema?.type === 'any') {
      // We might be in a testing environment.
      return;
    }

    if (!schema.properties || ('useEditorGrammarAsCtagsLanguage' in schema.properties)) {
      // This means the setting is still expected as part of `symbols-view` and
      // should not be migrated.
      return;
    }
  }

  // If we get this far, we know that any
  // `symbols-view.useEditorGrammarAsCtagsLanguage` setting we find should be
  // migrated to `symbol-provider-ctags.useEditorGrammarAsCtagsLanguage`.

  // We're only interested in the value we get directly from the config file.
  let settings = atom.config.get(
    'symbols-view',
    { sources: [atom.config.getUserConfigPath()] }
  ) || {};

  if ('useEditorGrammarAsCtagsLanguage' in settings) {
    atom.config.set(
      'symbol-provider-ctags.useEditorGrammarAsCtagsLanguage',
      settings.useEditorGrammarAsCtagsLanguage
    );
    atom.config.unset('symbols-view.useEditorGrammarAsCtagsLanguage');
  }

  // 99% of users won't care that we've migrated this setting, but the other 1%
  // would appreciate a heads-up. So let's try to detect any scope-specific
  // overrides that have touched this setting. We won't attempt to migrate
  // those automatically, but we'll at least let the user know that they might
  // have to be changed.
  //
  // This reaches into the private implementation of `atom.config`, so let's
  // exit gracefully if this fails.
  let propertySets = atom.config?.scopedSettingsStore.propertySets;
  if (!propertySets) return;

  let sources = [];
  for (let { properties, source } of propertySets) {
    if (
      properties['symbols-view'] &&
      ('useEditorGrammarAsCtagsLanguage' in properties['symbols-view'])
    ) {
      sources.push(source);
    }
  }

  if (sources.length > 0) {
    sources = Array.from(new Set(sources));
    let overrideSources = sources.map(s => `* \`${s}\``).join('\n');

    atom.notifications.addInfo(
      `Setting migrated`,
      {
        description: `${MIGRATED_SETTINGS_MESSAGE}

Detected overrides in the following locations:

${overrideSources}`,
        dismissable: true
      }
    );
  }
}

module.exports = {
  badge,
  isIterable,
  migrateOldConfigIfNeeded,
  timeout
};
