const {
  getTagNameCompletions,
  getAttributeNameCompletions,
  getAttributeValueCompletions
} = require('./helpers')

module.exports = function ({editor, bufferPosition}) {
  let node = tokenBeforePosition(editor, bufferPosition)
  if (!node) return []

  switch (node.type) {
    case '<': {
      if (!bufferPosition.isEqual(node.endPosition)) break
      return getTagNameCompletions('')
    }

    case 'tag_name': {
      if (bufferPosition.isEqual(node.endPosition)) {
        const {previousSibling} = node
        if (previousSibling && previousSibling.endIndex === node.startIndex) {
          return getTagNameCompletions(node.text)
        }
      } else {
        return getAttributeNameCompletions(node.text, '')
      }
      break
    }

    case 'attribute_name': {
      if (!bufferPosition.isEqual(node.endPosition)) break
      const tagNode = node.parent.parent
      const tagNameNode = tagNode.child(1)
      if (tagNameNode) {
        return getAttributeNameCompletions(tagNameNode.text, node.text)
      }
      break
    }

    case 'attribute_value':
    case '"':
    case '\'': {
      let prefix = ''
      if (node.type === 'attribute_value') {
        prefix = node.text
        node = node.previousSibling
      }

      const predecessor = tokenBefore(node)
      if (!predecessor || predecessor.type !== '=') return []
      const containerNode = node.closest(['start_tag', 'self_closing_tag', 'ERROR'])
      const tagNameNode = containerNode.descendantsOfType(
        'tag_name'
      )[0]

      // Get the last attribute name before the quote
      const attributeNameNode = containerNode.descendantsOfType(
        'attribute_name',
        null,
        node.startPosition
      ).pop()
      if (tagNameNode && attributeNameNode) {
        return getAttributeValueCompletions(tagNameNode.text, attributeNameNode.text, prefix)
      }
      break
    }
  }

  return []
}

function tokenBeforePosition (editor, position) {
  const languageMode = editor.getBuffer().getLanguageMode()
  let node = languageMode.getSyntaxNodeAtPosition(
    position,
    (node, grammar) => grammar.scopeName === 'text.html.basic'
  )
  if (!node) return null
  node = lastDescendant(node)

  while (
    position.isLessThan(node.endPosition) ||
    node.isMissing() ||
    node.type === 'text'
  ) {
    node = tokenBefore(node)
    if (!node) return null
  }

  return node
}

const nodesToSearch = new Set([
  '<',
  'tag_name',
  'attribute_name',
  'attribute_value',
  '"',
  '\''
])

function tokenBefore (node) {
  for (;;) {
    const {previousSibling} = node
    if (previousSibling) {
      return lastDescendant(previousSibling)
    }

    const {parent} = node
    if (parent) {
      node = parent
      if(nodesToSearch.has(node.type)) return node
      continue
    }

    return null
  }
}

function lastDescendant (node) {
  let {lastChild} = node
  while (lastChild) {
    node = lastChild
    lastChild = node.lastChild
  }
  return node
}
