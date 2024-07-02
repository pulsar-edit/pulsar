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

    (string)
  ] @fold
  ; No delimiter to preserve, so we want to fold all the way to this node's
  ; ending position.
  (#set! fold.endAt endPosition))

(
  ; All these data structures have opening and closing delimiters, so we can
  ; use the default behavior.
  [
    (tuple)
    (list)
    (set)
    (dictionary)
  ] @fold
)

((if_statement) @fold
  ; End at the end of the first (or only) consequence block.
  (#set! fold.endAt firstNamedChild.nextNamedSibling.endPosition))
