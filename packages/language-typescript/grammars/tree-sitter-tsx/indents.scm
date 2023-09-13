
; JSX
; ===

(jsx_opening_element ["<" ">"] @indent)
(jsx_opening_element [">"] @dedent)

(jsx_closing_element ">" @dedent)
