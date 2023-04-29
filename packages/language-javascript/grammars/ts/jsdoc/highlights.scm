; Highlight this comment even if it's not “valid” JSDoc.
((ERROR) @comment.block.documentation.js.jsdoc
  (#set! test.onlyIfRoot true))

((ERROR) @punctuation.definition.begin.comment.js.jsdoc
  (#set! test.onlyIfRoot true)
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*\\*"))

((ERROR) @punctuation.definition.end.comment.js.jsdoc
  (#set! test.onlyIfRoot true)
  (#set! adjust.startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))


(document) @comment.block.documentation.js.jsdoc

((document) @punctuation.definition.begin.comment.js.jsdoc
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*\\*"))

((document) @punctuation.definition.end.comment.js.jsdoc
  (#set! adjust.startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))


(tag_name) @storage.type.class.jsdoc

((tag (type)) @entity.other.type.instance.jsdoc
  ; Join the type with its surrounding braces.
  (#set! adjust.startAt firstChild.nextSibling.startPosition)
  (#set! adjust.endAt firstChild.nextSibling.nextSibling.nextSibling.endPosition))

"{" @punctuation.definition.begin.bracket.curly.jsdoc
"}" @punctuation.definition.end.bracket.curly.jsdoc
