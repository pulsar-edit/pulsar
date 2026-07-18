// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
module.exports = function(character1, character2) {
  const charCodeA = character1.charCodeAt(0);
  const charCodeB = character2.charCodeAt(0);
  return isSurrogatePair(charCodeA, charCodeB) ||
    isVariationSequence(charCodeA, charCodeB) ||
    isCombinedCharacter(charCodeA, charCodeB);
};

function isCombinedCharacter (charCodeA, charCodeB) {
  return !isCombiningCharacter(charCodeA) && isCombiningCharacter(charCodeB);
}

function isSurrogatePair (charCodeA, charCodeB) {
  return isHighSurrogate(charCodeA) && isLowSurrogate(charCodeB);
}

function isVariationSequence (charCodeA, charCodeB) {
  return !isVariationSelector(charCodeA) && isVariationSelector(charCodeB);
}

function isHighSurrogate (charCode) {
  return 0xD800 <= charCode && charCode <= 0xDBFF;
}

function isLowSurrogate (charCode) {
  return 0xDC00 <= charCode && charCode <= 0xDFFF;
}

function isVariationSelector (charCode) {
  return 0xFE00 <= charCode && charCode <= 0xFE0F;
}

function isCombiningCharacter (charCode) {
  return (0x0300 <= charCode && charCode <= 0x036F) ||
  (0x1AB0 <= charCode && charCode <= 0x1AFF) ||
  (0x1DC0 <= charCode && charCode <= 0x1DFF) ||
  (0x20D0 <= charCode && charCode <= 0x20FF) ||
  (0xFE20 <= charCode && charCode <= 0xFE2F);
}
