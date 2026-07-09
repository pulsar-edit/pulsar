const Diacritics = require("diacritic");

/**
 * Removes diacritical marks from a string.
 *
 * @param {string} text
 * @returns {string}
 */
function removeDiacritics(text) {
  return Diacritics.clean(text);
}

module.exports = {
  removeDiacritics,
};
