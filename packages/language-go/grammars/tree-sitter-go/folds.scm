
; This is enough to get all if/else if/else blocks folding without getting in
; each others' way.
(if_statement (block) @fold
  (#set! fold.adjustToEndOfPreviousRow true))

(block) @fold
(import_spec_list) @fold
(parameter_list) @fold
