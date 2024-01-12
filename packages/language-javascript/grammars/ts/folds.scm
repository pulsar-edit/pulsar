
[
  (switch_body)
  (class_body)
  (object)
  (template_string)
  (named_imports)
] @fold

; When we've got
;
; function foo(
;   bar,
;   baz,
;   thud
; )
;
; we want to be able to fold up the group of function parameters while
; preserving the ability to collapse the function body.
([(arguments) (formal_parameters)] @fold
  (#set! fold.adjustToEndOfPreviousRow true))

; When we've got
;
; if (foo) {
;   // something
; } else {
;   // something else
; }
;
; we want the folds to work a little differently so that collapsing the `if`
; fold doesn't interfere with our ability to collapse the `else` fold.
((if_statement
  consequence: (statement_block) @fold
  alternative: (else_clause)
  (#set! fold.adjustToEndOfPreviousRow true)
))

(else_clause (statement_block) @fold)

(statement_block) @fold

((comment) @fold
  (#set! fold.endAt endPosition)
  (#set! fold.offsetEnd -2))


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
  (#set! fold.adjustToEndOfPreviousRow true)
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
