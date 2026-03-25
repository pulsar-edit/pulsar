
; Each individual list item can be folded if it's hard-wrapped.
((list_item) @fold
  (#set! fold.endAt endPosition)
  (#set! fold.adjustToEndOfPreviousRow true))

; Each section represents a heading and all the content underneath it until the
; next heading of equivalent or higher importance.
((section) @fold
  (#set! fold.endAt endPosition)
  (#set! fold.adjustToEndOfPreviousRow true))
