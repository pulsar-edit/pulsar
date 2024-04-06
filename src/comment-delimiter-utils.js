
// Accept a comment metadata block and make it more consistent and predictable.
//
// The `comments` key in a grammar definition file has historically contained
// some comment metadata under the `start` and `end` properties, but only as
// much as was needed for the “Toggle Line Comment” command. Newer convention
// is to define `line` (`string`) and `block` (`[string, string]`) properties
// to reflect all comment metadata for the language.
//
// Some grammars also specify block comments as `{ start: string, end: string
// }`, so we'll normalize that to the `[string, string]` variant.
function normalizeDelimiterMetadata(meta = {}) {
  let { line, block } = meta;
  if (block && (!Array.isArray(block))) {
    let { start, end } = block;
    block = [start, end];
  }

  // Our preferred properties are `line` and `block`, but if `start` and/or
  // `end` are present, we can extract some value out of them.

  // If `start` and `end` both exist, they must identify block delimiters.
  if (!block && meta.start && meta.end) {
    block = [meta.start.trim(), meta.end.trim()];
  }
  // If `start` exists but `end` does not, `start` must be a line delimiter.
  if (!line && meta.start && !meta.end) {
    line = meta.start.trim();
  }

  return { line, block };
}

// Converts comment delimiter metadata to the format expected by
// `LanguageMode::getCommentStringsForPosition`. We can act as a provider of
// this data if the traditional sources are empty.
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
      // The “Toggle Line Comment” command obviously prefers a line comment if
      // one is present.
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
