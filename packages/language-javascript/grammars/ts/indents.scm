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
  condition: (parenthesized_expression ")" @indent
  (#set! onlyIfLastTextOnRow true)))

; …and keep that indent level if the user types a comment before the consequence…
(if_statement
  consequence: (empty_statement) @match
  (#set! onlyIfNotOnSameRowAs parent.startPosition)
  (#set! matchIndentOf parent.startPosition)
  (#set! offsetIndent 1))

; …and keep that indent level after the user starts typing…
(if_statement
  condition: (_) @indent
  consequence: [
    (expression_statement)
    (return_statement)
    (continue_statement)
    (break_statement)
    (throw_statement)
    (debugger_statement)
  ] @match
  (#set! matchIndentOf parent.startPosition)
  (#set! offsetIndent 1))

; …but dedent after exactly one statement.
(if_statement
  condition: (_) @indent
  consequence: [
    (expression_statement)
    (return_statement)
    (continue_statement)
    (break_statement)
    (throw_statement)
    (debugger_statement)
  ] @dedent.next)

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

(["||" "&&"] @indent
  (#set! onlyIfLastTextOnRow true))


["case" "default"] @indent

; JSX
; ===

(jsx_opening_element ">") @indent
(jsx_closing_element ">") @dedent
