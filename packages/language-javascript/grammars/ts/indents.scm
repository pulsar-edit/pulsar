
; ((template_string) @ignore
  ; (#is-not? test.OnStartingOrEndingRow true))

; STATEMENT BLOCKS
; ================

; More accurate indentation matching for all blocks delimited by braces.
(statement_block "}" @match
  (#set! indent.matchIndentOf parent.firstChild.startPosition))


; SWITCH STATEMENTS
; =================

; The closing brace of a switch statement's body should match the indentation
; of the line where the switch statement starts.
(switch_statement
  body: (switch_body "}" @match
    (#is? test.last true))
    (#set! indent.matchIndentOf parent.startPosition))

; 'case' and 'default' need to be indented one level more than their containing
; `switch`. TODO: Might need to make this configurable.
(["case" "default"] @match
  (#set! indent.matchIndentOf parent.parent.startPosition)
  (#set! indent.offsetIndent 1))


; ONE-LINE CONDITIONALS
; =====================

; An `if` statement without an opening brace should indent the next line…
(if_statement
  condition: (parenthesized_expression ")" @indent
  (#is? test.lastTextOnRow true)))
; (as should a braceless `else`…)
("else" @indent
  (#is? test.lastTextOnRow true))

; …and keep that indent level if the user types a comment before the
; consequence…
(if_statement
  consequence: (empty_statement) @match
  (#is-not? test.startsOnSameRowAs parent.startPosition)
  (#set! indent.matchIndentOf parent.startPosition)
  (#set! indent.offsetIndent 1))

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
  ; When an opening curly brace is unpaired, it might get interpreted as part
  ; of an `expression_statement`, for some reason.
  (#not-match? @match "^\\s*{")
  (#set! indent.matchIndentOf parent.startPosition)
  (#set! indent.offsetIndent 1))

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
  ] @dedent.next
  ; When an opening curly brace is unpaired, it might get interpreted as part
  ; of an `expression_statement`, for some reason.
  (#not-match? @dedent.next "^\\s*{"))

(else_clause
  [
    (expression_statement)
    (return_statement)
    (continue_statement)
    (break_statement)
    (throw_statement)
    (debugger_statement)
  ] @dedent.next
  (#is-not? test.startsOnSameRowAs parent.startPosition))


; HANGING INDENT ON SPLIT LINES
; =============================

; TODO: We might want to make this configurable behavior with the
; `config` scope test.

; Any of these at the end of a line indicate the next line should be indented…
(["||" "&&" "?"] @indent
  (#is? test.lastTextOnRow true))

; …and the line after that should be dedented…
(binary_expression
  ["||" "&&"]
    right: (_) @dedent.next
    (#is-not? test.startsOnSameRowAs parent.startPosition))

; …unless it's a ternary, in which case the dedent should wait until the
; alternative clause.
;
; let foo = this.longTernaryCondition() ?
;   consequenceWhichIsItselfRatherLong :
;   alternativeThatIsNotBrief;
;
(ternary_expression
  alternative: (_) @dedent.next
  (#is-not? test.startsOnSameRowAs parent.startPosition))


; DEDENT-NEXT IN LIMITED SCENARIOS
; ================================

; Catches unusual hanging-indent scenarios when calling a method, such as:
;
; return this.veryLongMethodNameWithSeveralArgumentsThat(are, too,
;   short, forEach, toHave, itsOwn, line);
;
; (arguments ")" @dedent.next
;   (#is-not? test.startsOnSameRowAs parent.firstChild.startPosition)
;   (#is-not? test.firstTextOnRow true))


; GENERAL
; =======

; Weed out `}`s that should not signal dedents.
(template_substitution "}" @_IGNORE_ (#set! capture.final true))

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


(jsx_opening_element ["<" ">"] @indent)
(jsx_opening_element [">"] @dedent)

(jsx_closing_element ">" @dedent)
