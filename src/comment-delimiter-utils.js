
function normalizeDelimiterMetadata(meta = {}) {
  let { block } = meta;
  if (block && (!Array.isArray(block))) {
    let { start, end } = block;
    block = [start, end];
  }
  return { ...meta, block };
}

function interpretDelimiterMetadata(meta) {
  let { line, block } = normalizeDelimiterMetadata(meta);
  let commentStartString;
  let commentEndString;
  let commentDelimiters;
  let blockIsValid = block != null && Array.isArray(block);
  let lineIsValid = typeof line === 'string';
  if (lineIsValid || blockIsValid) {
    commentDelimiters = block;
    if (lineIsValid) {
      commentStartString = line;
    } else if (blockIsValid) {
      [commentStartString, commentEndString] = block;
    }
  }
  return { commentStartString, commentEndString, commentDelimiters };
}

module.exports = {
  normalizeDelimiterMetadata,
  interpretDelimiterMetadata
};
