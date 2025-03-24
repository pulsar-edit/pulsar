; STRINGS
; =======

(pair
  key: (string) @meta.structure.key.json)

(string
  "\"" @punctuation.definition.string.begin.json
    (#is? test.first true))

(string
  "\"" @punctuation.definition.string.end.json
    (#is? test.last true))

(string) @string.quoted.double.json

(string_content (escape_sequence) @constant.character.escape.json)


; VALUES
; =======

(number) @constant.numeric.json

[(true) (false)] @constant.language.boolean._TYPE_.json
(null) @constant.language.null.json


; PUNCTUATION
; ===========

"{" @punctuation.definition.object.begin.bracket.curly.json
"}" @punctuation.definition.object.end.bracket.curly.json
"[" @punctuation.definition.array.begin.bracket.square.json
"]" @punctuation.definition.array.end.bracket.square.json

(object
  "," @punctuation.separator.object.comma.json
  (#set! capture.final true))

(array
  "," @punctuation.separator.array.comma.json
  (#set! capture.final true))

"," @punctuation.separator.comma.json
":" @punctuation.separator.key-value.colon.json

; COMMENTS
; ========

; Comments are envisioned and tolerated by `tree-sitter-json`. They are always
; allowed in the “JSON with Comments” grammar, but allowed in the ordinary
; “JSON” grammar only if the user opts into it via settings.
;
; If they haven’t been opted into, an earlier query will have pre-empted this
; one to mark them as illegal.

; Line comments. `//`
((comment) @comment.line.double-slash.json
  (#match? @comment.line.double-slash.json "^\/\/"))

((comment) @punctuation.definition.comment.json
  (#match? @punctuation.definition.comment.json "^\/\/")
  (#set! adjust.startAndEndAroundFirstMatchOf "^\/\/"))

; Block comments. `/* */`
((comment) @comment.block.json
  (#match? @comment.block.json "^/\\*")
  (#match? @comment.block.json "\\*/$"))


; ERROR HANDLING
; ==============

; If we mark all errors as invalid, it might be a distraction while typing. For
; now, let's just mark commas so that we alert the user more subtly.

(ERROR "," @invalid.illegal.comma.json)
