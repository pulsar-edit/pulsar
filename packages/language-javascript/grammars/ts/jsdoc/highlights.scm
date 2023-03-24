
(document) @comment.block.documentation.js.jsx
(tag_name) @storage.type.class.jsdoc

((tag (type)) @entity.name.type.instance.jsdoc
  ; Join the type with its surrounding braces.
  (#set! startAt firstChild.nextSibling.startPosition)
  (#set! endAt firstChild.nextSibling.nextSibling.nextSibling.endPosition))

"{" @punctuation.definition.bracket.curly.begin.jsdoc
"}" @punctuation.definition.bracket.curly.end.jsdoc
