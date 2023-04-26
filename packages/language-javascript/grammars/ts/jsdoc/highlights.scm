; Highlight this comment even if it's not “valid” JSDoc.
((ERROR) @comment.block.documentation.js.jsdoc
  (#set! onlyIfRoot true))

((ERROR) @punctuation.definition.begin.comment.js.jsdoc
  (#set! onlyIfRoot true)
  (#set! startAndEndAroundFirstMatchOf "^/\\*\\*"))

((ERROR) @punctuation.definition.end.comment.js.jsdoc
  (#set! onlyIfRoot true)
  (#set! startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))


(document) @comment.block.documentation.js.jsdoc

((document) @punctuation.definition.begin.comment.js.jsdoc
  (#set! startAndEndAroundFirstMatchOf "^/\\*\\*"))

((document) @punctuation.definition.end.comment.js.jsdoc
  (#set! startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))


(tag_name) @storage.type.class.jsdoc

((tag (type)) @entity.other.type.instance.jsdoc
  ; Join the type with its surrounding braces.
  (#set! startAt firstChild.nextSibling.startPosition)
  (#set! endAt firstChild.nextSibling.nextSibling.nextSibling.endPosition))

"{" @punctuation.definition.begin.bracket.curly.jsdoc
"}" @punctuation.definition.end.bracket.curly.jsdoc
