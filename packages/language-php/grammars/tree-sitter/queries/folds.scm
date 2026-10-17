
(if_statement
  body: (compound_statement) @fold
  (#set! fold.adjustToEndOfPreviousRow true))

[
  (enum_declaration_list)
  (compound_statement)
  (switch_block)
  (declaration_list)
  (array_creation_expression)
] @fold

; Fold multiline comments. Should work with both ordinary multiline comments
; and PHPDoc-style comments.
((comment) @fold
  (#set! fold.endAt endPosition)
  (#set! fold.offsetEnd -2))
