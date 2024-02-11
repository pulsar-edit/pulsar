[
  (switch_body)
  (class_body)
  (object)
  (template_string)
  (named_imports)
  (object_type)
] @fold

; When we've got
;
; function foo(
;   bar,
;   baz,
;   thud
; )
;
; we want to be able to fold up the group of function parameters while
; preserving the ability to collapse the function body.
([(arguments) (formal_parameters)] @fold
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
  (#set! fold.offsetEnd -2))
