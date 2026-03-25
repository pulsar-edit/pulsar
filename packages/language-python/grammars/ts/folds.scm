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

; Folding individual branches of `if` statements is tricky. We want to end at
; the end of the first/only consequence block, but we can't currently target it
; by name; we can only identify it via `nextNamedSibling` and its friends.
;
; But that doesn't work right because a comment at the top of the consequence
; block is not considered to be _part of_ that block, so it ends up being
; folded _instead of_ the block.
;
; We can fix this better after the query predicate overhaul by allowing more
; complex queries that identify fold start/end in one fell swoop. For now,
; we can do this with a divided fold — but also adjusting the `@fold.end` to
; identify the _last_ line of the block, not the first.
(if_statement "if" @fold.start)
(if_statement consequence: (block) @fold.end
  (#set! fold.endAt endPosition))
