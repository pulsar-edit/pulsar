// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
module.exports = function (character1, character2) {
  const charCodeA = character1.charCodeAt(0);
  const charCodeB = character2.charCodeAt(0);
  return (
    isSurrogatePair(charCodeA, charCodeB) ||
    isVariationSequence(charCodeA, charCodeB) ||
    isCombinedCharacter(charCodeA, charCodeB)
  );
};

function isCombinedCharacter(charCodeA, charCodeB) {
  return !isCombiningCharacter(charCodeA) && isCombiningCharacter(charCodeB);
}

function isSurrogatePair(charCodeA, charCodeB) {
  return isHighSurrogate(charCodeA) && isLowSurrogate(charCodeB);
}

function isVariationSequence(charCodeA, charCodeB) {
  return !isVariationSelector(charCodeA) && isVariationSelector(charCodeB);
}

function isHighSurrogate(charCode) {
  return 0xd800 <= charCode && charCode <= 0xdbff;
}

function isLowSurrogate(charCode) {
  return 0xdc00 <= charCode && charCode <= 0xdfff;
}

function isVariationSelector(charCode) {
  return 0xfe00 <= charCode && charCode <= 0xfe0f;
}

function isCombiningCharacter(charCode) {
  return (
    (0x0300 <= charCode && charCode <= 0x036f) ||
    (0x1ab0 <= charCode && charCode <= 0x1aff) ||
    (0x1dc0 <= charCode && charCode <= 0x1dff) ||
    (0x20d0 <= charCode && charCode <= 0x20ff) ||
    (0xfe20 <= charCode && charCode <= 0xfe2f)
  );
}
