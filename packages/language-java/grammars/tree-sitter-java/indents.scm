; The closing brace of a switch statement's body should match the indentation of the line where the switch statement starts.
(switch_statement
  body: (switch_block "}" @match
    (#is? test.last true))
  (#set! indent.matchIndentOf parent.parent.startPosition))

; 'case' and 'default' need to be indented one level more than their containing
; `switch`.
  (["case" "default"] @match
    (#set! indent.matchIndentOf parent.parent.startPosition)
    (#set! indent.offsetIndent 1))

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
