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
(if_statement
  consequence: (compound_statement) @fold
  (#set! fold.adjustToEndOfPreviousRow true))

[
 (field_declaration_list)
 (enumerator_list)
 (compound_statement)
] @fold

; Divided folds for preprocessor statements because they can't reliably be
; expressed with simple folds.
["#ifndef" "#ifdef" "#elif" "#else" "#if"] @fold.start
["#elif" "#else" "#endif"] @fold.end
