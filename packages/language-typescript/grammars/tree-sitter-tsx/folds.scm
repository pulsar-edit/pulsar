; When you have…
;
; <Element
;   foo="bar"
;   baz="thud">
;
; </Element>
;
; …this will put the fold on line 3 and let you fold up the contents separately
; from the opening tag's attributes.
;
(jsx_element
  (jsx_opening_element ">" @fold)
  (#set! fold.endAt parent.parent.lastChild.startPosition)
  (#set! fold.offsetEnd -1)
)

; When you have…
;
; <Element
;   foo="bar"
;   baz="thud"
; >
;
; </Element>
;
; …the presence of the `>` on its own line will let you treat the opening tag's
; attributes and the element's contents as separate folds.
;
(jsx_element
  (jsx_opening_element) @fold
  (#set! fold.endAt lastChild.previousSibling.endPosition))

((jsx_self_closing_element) @fold
  ; Exclude both the slash and angle bracket `/>` from the fold.
  (#set! fold.endAt lastChild.previousSibling.startPosition))
