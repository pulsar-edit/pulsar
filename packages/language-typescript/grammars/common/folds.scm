[
  (switch_body)
  (class_body)
  (object)
  (formal_parameters)
  (template_string)
  (named_imports)
] @fold

((arguments) @fold
  (#set! fold.adjustToEndOfPreviousRow true))


; When we've got
;
; if (foo) {
;   // something
; } else {
;   // something else
; }
;
; we want the folds to work a little differently so that collapsing the `if`
; fold doesn't interfere with our ability to collapse the `else` fold.
((if_statement
  consequence: (statement_block) @fold)
  (#set! fold.adjustToEndOfPreviousRow true))

(else_clause (statement_block) @fold)

(statement_block) @fold

((comment) @fold
  (#set! fold.endAt endPosition)
  (#set! fold.adjustEndColumn 0))
