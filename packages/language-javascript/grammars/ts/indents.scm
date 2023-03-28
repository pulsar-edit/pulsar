; The closing brace of a switch statement's body should match the indentation of the line where the switch statement starts.
(switch_statement
  body: (switch_body "}" @match
    (#set! onlyIfLast true))
  (#set! matchIndentOf parent.startPosition))

; 'case' and 'default' need to be indented one level more than their containing
; `switch`.
(["case" "default"] @match
  (#set! matchIndentOf parent.parent.startPosition)
  (#set! offsetIndent 1))


; An `if` statement without an opening brace should indent the next line…
(if_statement
  consequence: (empty_statement) @indent
    (#set! allowEmpty true))

; …but dedent after exactly one line.
(if_statement
  condition: (_) @indent
  consequence: (expression_statement) @dedent.next)

(template_substitution "}" @_IGNORE_
  (#set! final true))

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

; JSX
; ===

(jsx_opening_element ">") @indent
(jsx_closing_element ">") @dedent
