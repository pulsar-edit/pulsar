; Highlight this comment even if it's not “valid” JSDoc.
((ERROR) @comment.block.documentation.js.jsdoc
  (#is? test.root true))

((ERROR) @punctuation.definition.begin.comment.js.jsdoc
  (#is? test.root true)
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*\\*"))

((ERROR) @punctuation.definition.end.comment.js.jsdoc
  (#is? test.root true)
  (#set! adjust.startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))


(document) @comment.block.documentation.js.jsdoc

((document) @punctuation.definition.begin.comment.js.jsdoc
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*\\*"))

((document) @punctuation.definition.end.comment.js.jsdoc
  (#set! adjust.startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))

((inline_tag) @meta.inline-tag.js.jsdoc)

(tag_name) @storage.type.class.jsdoc

((tag (type)) @entity.other.type.instance.jsdoc
  ; Join the type with its surrounding braces.
  (#set! adjust.startAt firstChild.nextSibling.startPosition)
  (#set! adjust.endAt firstChild.nextSibling.nextSibling.nextSibling.endPosition))

(identifier) @variable.other.jsdoc

"{" @punctuation.definition.begin.bracket.curly.jsdoc
"}" @punctuation.definition.end.bracket.curly.jsdoc
