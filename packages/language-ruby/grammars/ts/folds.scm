[
  (method)
  (singleton_method)
  (class)
  (module)
  (case)
  (do_block)
  (singleton_class)
  (lambda)
  (hash)
  (array)
] @fold


; Fold from `if` to the next `elsif` or `else` in the chain.
((if
  alternative: [(elsif) (else)]) @fold
  (#set! endAt firstNamedChild.nextNamedSibling.nextNamedSibling.startPosition)
  (#set! adjustToEndOfPreviousLine true))

; Fold from `elsif` to the next `elsif` or `else` in the chain.
((elsif
  consequence: [(then) (elsif)]) @fold
  (#set! endAt firstNamedChild.nextNamedSibling.nextNamedSibling.startPosition)
  (#set! adjustToEndOfPreviousLine true))

; Fold from `else` to `end`.
((else) @fold
  (#set! endAt endPosition))

; A bare `if` without an `else` or `elsif`.
(if) @fold
