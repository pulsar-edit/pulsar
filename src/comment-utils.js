
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
function normalizeDelimiters(meta = {}) {
  // Adapt the style used in `TreeSitterGrammar`.
  if (
    ('commentStartString' in meta && 'commentEndString' in meta) && !('line' in meta || 'block' in meta)
  ) {
    let { commentStartString: start, commentEndString: end } = meta;
    meta = { start, end };
  }
  let { line, block } = meta;
  // Normalize the `{ start: string, end: string }` version to `[string,
  // string].`
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

// Convert comment delimiter metadata to the format expected by
// `LanguageMode::getCommentStringsForPosition`. We can act as a provider of
// this data if the traditional sources are empty.
function commentStringsFromDelimiters(meta) {
  let { line, block } = normalizeDelimiters(meta);
  let commentStartString;
  let commentEndString;
  let commentDelimiters = { line, block };
  let blockIsValid = block != null && Array.isArray(block);
  let lineIsValid = typeof line === 'string';
  if (lineIsValid || blockIsValid) {
    commentDelimiters = { line, block };
    if (lineIsValid) {
      // The “Toggle Line Comment” command obviously prefers a line comment if
      // one is present.
      commentStartString = line;
    } else if (blockIsValid) {
      [commentStartString, commentEndString] = block;
    }
  }
  let result = { commentStartString, commentEndString, commentDelimiters };
  return result;
}



// Given a scope, return a single object of `editor.commentDelimiters` data.
// Needed because an ordinary config lookup will “blend” objects from cascading
// scopes — which is usually the behavior we want! Just not this time.
function getDelimitersForScope(scope) {
  let reversed = [...scope.scopes].reverse();
  let mapped = reversed.map(scope => {
    return atom.config.get('editor.commentDelimiters', { scope: [scope] })
  })
  let result = mapped.find(setting => !!setting)
  return result ? normalizeDelimiters(result) : result
}

module.exports = {
  normalizeDelimiters,
  commentStringsFromDelimiters,
  getDelimitersForScope
};
