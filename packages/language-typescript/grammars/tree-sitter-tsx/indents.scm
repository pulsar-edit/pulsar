
; JSX
; ===

(jsx_opening_element [">"] @indent)

; Support things like…
; <div
;   className={'foo'}
;   onClick={onClick}
; >
(jsx_opening_element ["<"] @indent
  (#is-not? test.startsOnSameRowAs parent.lastChild.startPosition))
((jsx_opening_element [">"] @dedent)
  (#is-not? test.startsOnSameRowAs parent.firstChild.startPosition))

; We match on the whole node here because
; (a) we need to please the dedent-while-typing heuristic, so the line text
;     must match the capture node's text; and
; (b) we don't want the dedent to trigger until the very last `>` has been
;     typed.
(jsx_closing_element ">") @dedent

; Support things like…
; <img
;   height={40}
;   width={40}
;   alt={'foo'}
; />
(jsx_self_closing_element "<" @indent
  (#is-not? test.startsOnSameRowAs parent.lastChild.startPosition))

; There isn't a single node whose exact text will match the line content at any
; point, so the usual heuristic won't work. Instead we set `indent.force` and
; use `test.lastTextOnRow` to ensure that the dedent fires exactly once while
; typing.
((jsx_self_closing_element ">" @dedent)
  (#is-not? test.startsOnSameRowAs parent.firstChild.startPosition)
  (#is? test.lastTextOnRow)
  (#set! indent.force true))
