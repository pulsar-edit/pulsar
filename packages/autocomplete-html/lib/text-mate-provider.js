const {
  getTagNameCompletions,
  getAttributeNameCompletions,
  getAttributeValueCompletions
} = require('./helpers')

const attributePattern = /\s+([a-zA-Z][-a-zA-Z]*)\s*=\s*$/
const tagPattern = /<([a-zA-Z][-a-zA-Z]*)(?:\s|$)/

module.exports = function (request) {
  let {editor, bufferPosition, prefix} = request
  prefix = prefix.trim()

  if (isAttributeValueStart(request)) {
    const tag = getPreviousTag(editor, bufferPosition)
    const attribute = getPreviousAttribute(editor, bufferPosition)
    return getAttributeValueCompletions(tag, attribute, prefix)
  }

  if (isAttributeStart(request)) {
    const tag = getPreviousTag(editor, bufferPosition)
    return getAttributeNameCompletions(tag, prefix)
  }

  if (isTagStart(request)) {
    const ignorePrefix = editor.getTextInRange([
      [bufferPosition.row, bufferPosition.column - 1],
      bufferPosition
    ]) === '<'
    return getTagNameCompletions(ignorePrefix ? '' : prefix)
  }

  return []
}

function isTagStart ({prefix, scopeDescriptor, bufferPosition, editor}) {
  if (prefix.trim() && (prefix.indexOf('<') === -1)) {
    return hasTagScope(scopeDescriptor.getScopesArray())
  }

  // autocomplete-plus's default prefix setting does not capture <. Manually check for it.
  prefix = editor.getTextInRange([[bufferPosition.row, bufferPosition.column - 1], bufferPosition])

  const scopes = scopeDescriptor.getScopesArray()

  // Don't autocomplete in embedded languages
  return (prefix === '<') && (scopes[0] === 'text.html.basic') && (scopes.length === 1)
}

function isAttributeStart ({prefix, scopeDescriptor, bufferPosition, editor}) {
  const scopes = scopeDescriptor.getScopesArray()
  if (!getPreviousAttribute(editor, bufferPosition) && prefix && !prefix.trim()) {
    return hasTagScope(scopes) || afterTagScope(editor, bufferPosition)
  }

  const previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)]
  const previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition)
  const previousScopesArray = previousScopes.getScopesArray()

  if (previousScopesArray.includes('entity.other.attribute-name.html')) return true
  if (!hasTagScope(scopes)) return false

  // autocomplete here: <tag |>
  // not here: <tag >|
  return (
    scopes.includes('punctuation.definition.tag.end.html') &&
    !previousScopesArray.includes('punctuation.definition.tag.end.html')
  )
}

// This fixes the
//
// <div |
//
// scenario in Tree-sitter grammars — no closing `>` on the tag, so we should
// move back to the nearest text and try to read the scopes from there.
// Designed to work no matter how many spaces there are between the end of the
// tag name and the cursor.
function afterTagScope (editor, bufferPosition) {
  let cursor = editor.getCursors().find(cursor => {
    return cursor.getBufferPosition().isEqual(bufferPosition)
  })
  if (!cursor) return false;
  let position = cursor.getPreviousWordBoundaryBufferPosition();
  position = position.translate([0, -1]);
  let scopes = editor.scopeDescriptorForBufferPosition(position);
  return scopes.getScopesArray().some(t => t.startsWith('entity.name.tag'));
}

function isAttributeValueStart ({scopeDescriptor, bufferPosition, editor}) {
  const scopes = scopeDescriptor.getScopesArray()

  const previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)]
  const previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition)
  const previousScopesArray = previousScopes.getScopesArray()

  // This is an unambiguous case — if the cursor is on the right side of the
  // opening quote, then we must be in the right place.
  if (previousScopesArray.includes('punctuation.definition.string.begin.html'))
    return true

  // autocomplete here: attribute="|"
  // not here: attribute=|""
  // or here: attribute=""|
  // or here: attribute="""|
  return (
    hasStringScope(scopes) &&
    hasStringScope(previousScopesArray) &&
    !previousScopesArray.includes('punctuation.definition.string.end.html') &&
    hasTagScope(scopes) &&
    getPreviousAttribute(editor, bufferPosition) != null
  )
}

function hasTagScope (scopes) {
  for (let scope of scopes) {
    if (scope.startsWith('meta.tag.') && scope.endsWith('.html')) return true
  }
  return false
}

function hasStringScope (scopes) {
  return (
    scopes.includes('string.quoted.double.html') ||
    scopes.includes('string.quoted.single.html')
  )
}

function getPreviousTag (editor, bufferPosition) {
  let {row} = bufferPosition
  while (row >= 0) {
    const match = tagPattern.exec(editor.lineTextForBufferRow(row))
    const tag = match && match[1]
    if (tag) return tag
    row--
  }
}

function getPreviousAttribute (editor, bufferPosition) {
  // Remove everything until the opening quote (if we're in a string)
  let quoteIndex = bufferPosition.column - 1 // Don't start at the end of the line
  while (quoteIndex) {
    const scopes = editor.scopeDescriptorForBufferPosition([bufferPosition.row, quoteIndex])
    const scopesArray = scopes.getScopesArray()
    if (!hasStringScope(scopesArray) || (scopesArray.indexOf('punctuation.definition.string.begin.html') !== -1)) break
    quoteIndex--
  }

  const match = attributePattern.exec(editor.getTextInRange([[bufferPosition.row, 0], [bufferPosition.row, quoteIndex]]))
  return match && match[1]
}
