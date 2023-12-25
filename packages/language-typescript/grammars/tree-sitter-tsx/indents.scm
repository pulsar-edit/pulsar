
; JSX
; ===

(jsx_opening_element [">"] @indent)
(jsx_opening_element ["<"] @indent
  (#is-not? test.startsOnSameRowAs parent.lastChild))
((jsx_opening_element [">"] @dedent)
  (#is-not? test.startsOnSameRowAs parent.firstChild))

(jsx_closing_element ">") @dedent

; Support things like…
; <img
;   height={40}
;   width={40}
;   alt={'foo'}
; />
(jsx_self_closing_element "<" @indent
  (#is-not? test.startsOnSameRowAs parent.lastChild))

; There isn't a single node whose exact text will match the line content at any
; point, so the usual heuristic won't work. Instead we set `indent.force` and
; use `test.lastTextOnRow` to ensure that the dedent fires exactly once while
; typing.
((jsx_self_closing_element ">" @dedent)
  (#is-not? test.startsOnSameRowAs parent.firstChild)
  (#is? test.lastTextOnRow)
  (#set! indent.force true))
