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

; By default, `case` and `default` need to be indented one level more than
; their containing `switch`.
([
  (switch_case "case" @match)
  (switch_default "default" @match)
  ; We include this one (and check for a switch_statment ancestor) to handle
  ; a commonly encountered error state when the user is in the middle of typing
  ; a switch statement.
  (ERROR "case" @match)
]
  (#is? test.descendantOfType switch_statement)
  (#set! indent.matchIndentOf parent.parent.startPosition)
  (#set! indent.offsetIndent 1)
  (#is-not? test.config "language-javascript.indentation.alignCaseWithSwitch"))

; When this config setting is enabled, `case` and `default` need to be indented
; to match their containing `switch`.
([
  (switch_case "case" @match)
  (switch_default "default" @match)
  ; We include this one (and check for a switch_statment ancestor) to handle
  ; a commonly encountered error state when the user is in the middle of typing
  ; a switch statement.
  (ERROR "case" @match)
]
  (#is? test.descendantOfType switch_statement)
  (#set! indent.matchIndentOf parent.parent.startPosition)
  (#set! indent.offsetIndent 0)
  (#is? test.config "language-javascript.indentation.alignCaseWithSwitch"))


; ONE-LINE CONDITIONALS
; =====================

; An `if` statement without an opening brace should indent the next line…
(if_statement
  condition: (parenthesized_expression ")" @indent
  (#is? test.lastTextOnRow true)
  (#is? test.config "language-javascript.indentation.indentAfterBracelessIf")))
; (as should a braceless `else`…)
("else" @indent
  (#is? test.lastTextOnRow true)
  (#is? test.config "language-javascript.indentation.indentAfterBracelessIf"))

; …and keep that indent level if the user types a comment before the
; consequence…
(if_statement
  consequence: (empty_statement) @match
  (#is-not? test.startsOnSameRowAs parent.startPosition)
  (#set! indent.matchIndentOf parent.startPosition)
  (#set! indent.offsetIndent 1)
  (#is? test.config "language-javascript.indentation.indentAfterBracelessIf"))

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
  (#set! indent.offsetIndent 1)
  (#is? test.config "language-javascript.indentation.indentAfterBracelessIf"))

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
  (#not-match? @dedent.next "^\\s*{")
  (#is? test.config "language-javascript.indentation.indentAfterBracelessIf"))

(else_clause
  [
    (expression_statement)
    (return_statement)
    (continue_statement)
    (break_statement)
    (throw_statement)
    (debugger_statement)
  ] @dedent.next
  (#is-not? test.startsOnSameRowAs parent.startPosition)
  (#is? test.config "language-javascript.indentation.indentAfterBracelessIf"))


; HANGING INDENT ON SPLIT LINES
; =============================

; Any of these at the end of a line indicate the next line should be indented…
(["||" "&&"] @indent
  (#is? test.config "language-javascript.indentation.addHangingIndentAfterLogicalOperators")
  (#is? test.lastTextOnRow true))

("?" @indent
  (#is? test.config "language-javascript.indentation.addHangingIndentAfterTernaryOperators")
  (#is? test.lastTextOnRow true))

; …and the line after that should be dedented…
(binary_expression
  ["||" "&&"]
    right: (_) @dedent.next
    (#is? test.config "language-javascript.indentation.addHangingIndentAfterLogicalOperators")
    (#is-not? test.startsOnSameRowAs parent.startPosition)
    ; …unless the right side of the expression spans multiple lines.
    (#is? test.endsOnSameRowAs startPosition))

; …unless it's a ternary, in which case the dedent should wait until the
; alternative clause.
;
; let foo = this.longTernaryCondition() ?
;   consequenceWhichIsItselfRatherLong :
;   alternativeThatIsNotBrief;
;
(ternary_expression
  alternative: (_) @dedent.next
  (#is? test.config "language-javascript.indentation.addHangingIndentAfterTernaryOperators")
  (#is-not? test.startsOnSameRowAs parent.startPosition)
  ; Only dedent the next line if the alternative doesn't itself span multiple
  ; lines.
  (#is? test.endsOnSameRowAs startPosition))


; GENERAL
; =======

; Weed out `}`s that should not signal dedents.
(template_substitution "}" @_IGNORE_ (#set! capture.final true))

; As strange as it may seem to make all of these basic indentation hints
; configurable, some brace styles are incompatible with some of these choices;
; see https://github.com/orgs/pulsar-edit/discussions/249.
("{" @indent
  (#is? test.config "language-javascript.indentation.indentBraces"))
("}" @dedent
  (#is? test.config "language-javascript.indentation.indentBraces"))

("[" @indent
  (#is? test.config "language-javascript.indentation.indentBrackets"))
("]" @dedent
  (#is? test.config "language-javascript.indentation.indentBrackets"))

("(" @indent
  (#is? test.config "language-javascript.indentation.indentParentheses"))
(")" @dedent
  (#is? test.config "language-javascript.indentation.indentParentheses"))


(switch_case "case" @indent)
(switch_default "default" @indent)

; JSX
; ===

(jsx_opening_element [">"] @indent)
; Support things like…
; <div
;   className={'foo'}
;   onClick={onClick}
; >
(jsx_opening_element ["<"] @indent
  (#is-not? test.startsOnSameRowAs parent.lastChild.startPosition))
((jsx_opening_element [">"] @dedent)
  (#is-not? test.startsOnSameRowAs parent.firstChild.startPosition))

; We match on the whole node here because
; (a) we need to please the dedent-while-typing heuristic, so the line text
;     must match the capture node's text; and
; (b) we don't want the dedent to trigger until the very last `>` has been
;     typed.
(jsx_closing_element ">") @dedent

; Support things like…
; <img
;   height={40}
;   width={40}
;   alt={'foo'}
; />
(jsx_self_closing_element "<" @indent
  (#is-not? test.startsOnSameRowAs parent.lastChild.startPosition))

; There isn't a single node whose exact text will match the line content at any
; point, so the usual heuristic won't work. Instead we set `indent.force` and
; use `test.lastTextOnRow` to ensure that the dedent fires exactly once while
; typing.
((jsx_self_closing_element "/>" @dedent)
  (#is-not? test.startsOnSameRowAs parent.firstChild.startPosition)
  (#is? test.lastTextOnRow)
  (#set! indent.force true))
