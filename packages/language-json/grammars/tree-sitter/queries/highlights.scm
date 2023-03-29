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

"{" @punctuation.definition.begin.brace.curly.json
"}" @punctuation.definition.end.brace.curly.json
"[" @punctuation.definition.begin.brace.square.json
"]" @punctuation.definition.end.brace.square.json

"," @punctuation.separator.comma.json
":" @punctuation.separator.colon.json

; ERROR HANDLING
; ==============

; If we mark all errors as invalid, it might be a distraction while typing. For
; now, let's just mark commas so that we alert the user more subtly.

(ERROR "," @invalid.illegal.comma.json)
