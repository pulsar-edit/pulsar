
; COMMENTS
; ========

(comment) @comment.line.number-sign.toml
((comment) @punctuation.definition.comment.toml
  (#set! adjust.endAfterFirstMatchOf "^#"))


; SECTIONS
; ========

((table "[" (_) "]") @entity.name.section.table.toml
  (#set! adjust.endAt firstNamedChild.nextSibling.endPosition))

((table_array_element "[[" (_) "]]") @entity.name.section.table-array-element.toml
  (#set! adjust.endAt firstNamedChild.nextSibling.endPosition))


; KEYS
; ====

(pair
  . [(bare_key) (quoted_key) (dotted_key)]) @meta.pair.key.toml

((bare_key) @variable.other.key.toml
  (#is? test.descendantOfType pair))
((quoted_key) @variable.other.key.quoted.toml
  (#is? test.descendantOfType pair))

(dotted_key "." @keyword.operator.accessor.toml)


; STRINGS
; =======

(string "\"") @string.quoted.double.toml
(string "'") @string.quoted.single.toml

(string "\"\"\"") @string.quoted.double.block.toml
(string "'''") @string.quoted.single.block.toml

(string
  ["\"" "'"] @punctuation.definition.string.begin.toml
  (#is? test.first true))

(string
  ["\"" "'"] @punctuation.definition.string.end.toml
  (#is? test.last true))

; WORKAROUND: There seems to be a bug with multi-line strings where only the
; opening delimiters are exposed. Let's use adjustments to mark these
; delimiters.

((string "\"\"\"") @punctuation.definition.string.begin.toml
  (#set! adjust.endAfterFirstMatchOf "^\"\"\""))

((string "\"\"\"") @punctuation.definition.string.end.toml
  (#set! adjust.startBeforeFirstMatchOf "\"\"\"$"))

((string "'''") @punctuation.definition.string.begin.toml
  (#set! adjust.endAfterFirstMatchOf "^'''"))

((string "'''") @punctuation.definition.string.end.toml
  (#set! adjust.startBeforeFirstMatchOf "'''$"))

(escape_sequence) @constant.character.escape.toml

; NUMBERS
; =======

((integer) @constant.numeric.hexadecimal.toml
  (#match? @constant.numeric.hexadecimal.toml "^0x"))

((integer) @constant.numeric.octal.toml
  (#match? @constant.numeric.octal.toml "^0o"))

((integer) @constant.numeric.binary.toml
  (#match? @constant.numeric.binary.toml "^0b"))

((integer) @constant.numeric.decimal.integer.toml
  (#set! capture.shy true))

; Not sure why `inf` and `nan` are parsed as `float`s, but there you have it.
((float) @constant.numeric.infinity.toml
  (#match? @constant.numeric.infinity.toml "^[+-]?inf$"))

((float) @constant.numeric.nan.toml
  (#match? @constant.numeric.nan.toml "^[+-]?nan$"))

((float) @constant.numeric.decimal.float.toml
  (#set! capture.shy true))


; DATES
; =====

; Without much guidance from other grammars, let's treat dates as numeric
; constants.

(local_date) @constant.numeric.date.toml
(local_time) @constant.numeric.time.toml
(local_date_time) @constant.numeric.date-time.toml
(offset_date_time) @constant.numeric.date-time.offset.toml


; BOOLEANS
; ========

(boolean) @constant.language.boolean._TEXT_.toml


; OPERATORS
; =========

(pair "=" @keyword.operator.assignment.toml)

; PUNCTUATION
; ===========

(array
  "[" @punctuation.definition.array.begin.bracket.square.toml
  "]" @punctuation.definition.array.end.bracket.square.toml)

(array "," @punctuation.separator.array.comma.toml)

(table
  "[" @punctuation.definition.table.begin.bracket.square.toml
  "]" @punctuation.definition.table.end.bracket.square.toml)

(inline_table
  "{" @punctuation.definition.inline-table.begin.bracket.curly.toml
  "}" @punctuation.definition.inline-table.end.bracket.curly.toml)

(inline_table
  "," @punctuation.separator.inline-table.comma.toml)


(table_array_element
  "[[" @punctuation.definition.table-array-element.begin.bracket.square.toml
  "]]" @punctuation.definition.table-array-element.end.bracket.square.toml)
