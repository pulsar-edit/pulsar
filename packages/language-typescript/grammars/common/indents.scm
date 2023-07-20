; The closing brace of a switch statement's body should match the indentation of the line where the switch statement starts.
(switch_statement
  body: (switch_body "}" @match
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

(type_parameters "<" @indent)
(type_parameters ">" @dedent)
(type_arguments "<" @indent)
(type_arguments ">" @dedent)


["case" "default"] @indent
