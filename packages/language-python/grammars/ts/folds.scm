(
  [
    (function_definition)
    (class_definition)

    (while_statement)
    (for_statement)
    (with_statement)
    (try_statement)
    (match_statement)

    (elif_clause)
    (else_clause)
    (case_clause)

    (import_from_statement)
    (parameters)
    (argument_list)

    (parenthesized_expression)
    (generator_expression)
    (list_comprehension)
    (set_comprehension)
    (dictionary_comprehension)

    (tuple)
    (list)
    (set)
    (dictionary)

    (string)
  ] @fold
  ; No delimiter to preserve, so we want to fold all the way to this node's
  ; ending position.
  (#set! fold.endAt endPosition))

((if_statement) @fold
  ; End at the end of the first (or only) consequence block.
  (#set! fold.endAt firstNamedChild.nextNamedSibling.endPosition))
