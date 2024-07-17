[
  (method)
  (singleton_method)
  (class)
  (module)
  (case)
  (do_block)
  (block)
  (singleton_class)
  (lambda)
  (hash)
  (argument_list)
  (array)
  (symbol_array)
  (string_array)
] @fold

; Multi-line comment syntax (=begin…=end) is obscure and out of favor, but we
; might as well make it foldable.
((comment) @fold
  (#set! fold.endAt endPosition))

; Fold from `if` to the next `elsif` or `else` in the chain.
((if
  alternative: [(elsif) (else)]) @fold
  (#set! fold.endAt lastNamedChild.startPosition)
  (#set! fold.adjustToEndOfPreviousRow true))

((unless
  alternative: (else)) @fold
  (#set! fold.endAt lastNamedChild.startPosition)
  (#set! fold.adjustToEndOfPreviousRow true))

; Fold from `elsif` to the next `elsif` or `else` in the chain.
((elsif
  consequence: [(then) (elsif)]) @fold
  (#set! fold.endAt lastNamedChild.startPosition)
  (#set! fold.adjustToEndOfPreviousRow true))

; Fold from `else` to `end`.
((else) @fold
  (#set! fold.endAt endPosition))

; A bare `if` without an `else` or `elsif`.
(if) @fold
(unless) @fold
