; STRINGS
; =======

(string
  "\"" @punctuation.definition.string.begin.json
    (#set! onlyIfFirst true))

(string
  "\"" @punctuation.definition.string.end.json
    (#set! onlyIfLast true))

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
  (#set! final true))

(array
  "," @punctuation.separator.array.comma.json
  (#set! final true))

"," @punctuation.separator.comma.json
":" @punctuation.separator.key-value.colon.json

; ERROR HANDLING
; ==============

; If we mark all errors as invalid, it might be a distraction while typing. For
; now, let's just mark commas so that we alert the user more subtly.

(ERROR "," @invalid.illegal.comma.json)
