; The closing brace of a switch statement's body should match the indentation of the line where the switch statement starts.
(switch_statement
  body: (switch_body "}" @match
    (#set! onlyIfLast true))
  (#set! matchIndentOf parent.parent.startPosition))

; 'case' and 'default' need to be indented one level more than their containing
; `switch`.
  (["case" "default"] @match
    (#set! matchIndentOf parent.parent.startPosition)
    (#set! offsetIndent 1))

[
  "{"
  "("
  "["
] @indent

[
  "}"
  ")"
  "]"
] @dedent


["case" "default"] @indent
