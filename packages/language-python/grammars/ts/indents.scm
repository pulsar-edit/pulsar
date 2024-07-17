; Excluding dictionary key/value separators…
(dictionary
  (pair ":" @_IGNORE_
  (#set! capture.final)))

; …lambda functions…
((lambda ":" @_IGNORE_)
  (#set! capture.final))

; …and type annotations on function parameters/class members…
(":" @_IGNORE_ . (type) (#set! capture.final))

; …all other colons we encounter hint at upcoming indents.
":" @indent

; When typing out "else" after an "if" statement, tree-sitter-python won't
; acknowlege it as an `else` statement until it's indented properly, which is
; quite the dilemma for us. Before that happens, it's an identifier named
; "else". This has a chance of spuriously dedenting if you're typing out a
; variable called `elsewhere` or something, but I'm OK with that.
;
; This also means that we _should not_ mark an actual `else` keyword with
; `@dedent`, because if it's recognized as such, that's a sign that it's
; already indented correctly and we shouldn't touch it.
((identifier) @dedent (#match? @dedent "^(elif|else)$"))

["(" "[" "{"] @indent
[")" "]" "}"] @dedent
