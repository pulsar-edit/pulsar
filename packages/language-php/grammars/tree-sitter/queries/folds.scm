
(if_statement
  body: (compound_statement) @fold
  (#set! fold.adjustToEndOfPreviousRow true))

[
  (enum_declaration_list)
  (compound_statement)
  (switch_block)
  (declaration_list)
] @fold
