
; When we've got
;
; if (foo) {
;   // something
; } else if (bar) {
;   // something else
; }
;
; we want the folds to work a little differently so that collapsing the `if`
; fold doesn't interfere with our ability to collapse the `else` fold.
(if_expression
  consequence: (block) @fold
  (#set! fold.adjustToEndOfPreviousRow true)
  alternative: (else_clause))

(else_clause
  (if_expression
    consequence: (block) @fold)
    (#set! fold.adjustToEndOfPreviousRow true))

(match_block) @fold
(block) @fold
(macro_definition) @fold
