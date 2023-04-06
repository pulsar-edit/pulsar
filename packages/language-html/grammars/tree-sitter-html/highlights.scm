(doctype) @meta.tag.doctype.html

(doctype
  "<!" @punctuation.definition.tag.begin.html
  "doctype" @entity.name.tag.doctype.html
  ">" @punctuation.definition.tag.end.html) @meta.tag.doctype.html

; ((doctype) @string.unquoted.html
;   (#set! startAndEndAroundFirstMatchOf "html"))

; COMMENTS
; ========

(comment) @comment.block.html

((comment) @punctuation.definition.comment.begin.html
  (#set! startAndEndAroundFirstMatchOf "^<!--"))

((comment) @punctuation.definition.comment.end.html
  (#set! startAndEndAroundFirstMatchOf "-->$"))


; ELEMENTS
; ========

; Tag names
; ---------

(start_tag
  "<" @punctuation.definition.tag.begin.html
  (tag_name) @entity.name.tag.html
  ">" @punctuation.definition.tag.end.html)

(end_tag
  "</" @punctuation.definition.tag.begin.html
  (tag_name) @entity.name.tag.html
  ">" @punctuation.definition.tag.end.html)

(self_closing_tag
  "<" @punctuation.definition.tag.begin.html
  (tag_name) @entity.name.tag.html
  "/>" @punctuation.definition.tag.end.html)


; Invalid tag names
; -----------------

(erroneous_end_tag) @entity.name.tag.html
(erroneous_end_tag_name) @invalid.illegal.erroneous-end-tag-name.html


; Attributes
; ----------

(attribute "=" @punctuation.separator.key-value.html)
(attribute_name) @entity.other.attribute-name

; Single- and double-quotes around attribute values.
((quoted_attribute_value ["\"" "'"] @punctuation.definition.string.begin.html)
  (#set! onlyIfFirst true))

((quoted_attribute_value ["\"" "'"] @punctuation.definition.string.end.html)
  (#set! onlyIfLast true))

; If this matches, the value is double-quoted.
(quoted_attribute_value "\"") @string.quoted.double.html

; If this matches, the value is single-quoted.
(quoted_attribute_value "'") @string.quoted.single.html

; Prevent quoted attribute values from having `string.unquoted` applied.
(quoted_attribute_value
  (attribute_value) @_IGNORE_
  (#set! final true))

; The "foo" in `<div class=foo>`.
; Because of the preceding rule, if this matches and passes all tests, the
; value must be unquoted.
(attribute_value) @string.unquoted.html
