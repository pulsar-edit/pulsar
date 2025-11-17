(
  [
    (function_definition)
    (class_definition)

    (while_statement)
    (for_statement)
    (with_statement)
    (match_statement)

    (except_clause)

    (elif_clause)
    (else_clause)
    (case_clause)

    (import_from_statement)
    (parameters)

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

; Fold a `try` block only up to the first `except`. This can't be done with
; node position descriptors because we can't reliably predict the position of
; the `except_clause` node, so we can only express it with a divided fold.
;
; (Each `except_clause`, on the other hand, can have its fold expressed with a
; simple fold capture.)
(
  (try_statement
    "try" @fold.start
    body: (block)
    .
    (except_clause) @fold.end
  )
)

(
  ; All these data structures have opening and closing delimiters, so we can
  ; use the default behavior.
  [
    (argument_list)
    (tuple)
    (list)
    (set)
    (dictionary)
  ] @fold
)

((if_statement) @fold
  ; End at the end of the first (or only) consequence block.
  (#set! fold.endAt firstNamedChild.nextNamedSibling.endPosition))
