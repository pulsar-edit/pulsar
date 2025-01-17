
; IGNORE NON-BLOCK-STARTING COLONS
; ================================

; First, exclude dictionary key/value separators…
(dictionary
  (pair ":" @_IGNORE_
  (#set! capture.final)))

; …lambda functions…
((lambda ":" @_IGNORE_)
  (#set! capture.final))

; …list subscript syntax…
(slice ":" @_IGNORE_
  (#set! capture.final))

; …and type annotations on function parameters/class members.
(":" @_IGNORE_ . (type) (#set! capture.final))

; IGNORE BLOCK-STARTING COLONS BEFORE ONE-LINERS
; ==============================================

; Now that we've done that, all block-starting colons that have their
; consequence block start and end on the same line should be filtered out.
;
; We also test for `lastTextOnRow` to ensure we're not followed by an _empty_
; consequence block, which is surprisingly common. Probably a bug, but it's got
; to be worked around in the meantime.
;
; We check for adjacency between the `:` and the `block` because otherwise we
; might incorrectly match cases like
;
;     if 2 > 1: # some comment
;
; since those comments can also be followed by an empty `block` node on the same
; line.
;
(if_statement
  ":" @_IGNORE_
  .
  consequence: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(elif_clause
  ":" @_IGNORE_
  .
  consequence: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(else_clause
  ":" @_IGNORE_
  .
  body: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(match_statement
  ":" @_IGNORE_
  .
  body: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(case_clause
  ":" @_IGNORE_
  .
  consequence: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(while_statement
  ":" @_IGNORE_
  .
  body: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(for_statement
  ":" @_IGNORE_
  .
  body: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(try_statement
  ":" @_IGNORE_
  .
  body: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(except_clause
  ":" @_IGNORE_
  .
  (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

; Special case for try/except statements, since they don't seem to be valid
; until they're fully intact. If we don't do this, `except` doesn't dedent.
;
; This is like the `elif`/`else` problem below, but it's trickier because an
; identifier could plausibly begin with the string `except` and we don't want
; to make an across-the-board assumption.
(ERROR
  "try"
  ":" @indent
  (block
    (expression_statement
      (identifier) @dedent
      (#match? @dedent "except")
    )
  )
)

(function_definition
  ":" @_IGNORE_
  .
  body: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)

(class_definition
  ":" @_IGNORE_
  .
  body: (block)
  (#is-not? test.lastTextOnRow)
  (#is? test.startsOnSameRowAs "nextSibling.endPosition")
  (#set! capture.final)
)


; REMAINING COLONS
; ================

; Now that we've done this work, all other colons we encounter hint at upcoming
; indents.
;
; TODO: Based on the stuff we're doing above, it's arguable that the
; exclude-all-counterexamples approach is no longer useful and we should
; instead be opting into indentation. Revisit this!
":" @indent

; MISCELLANEOUS
; =============

; When typing out "else" after an "if" statement, tree-sitter-python won't
; acknowledge it as an `else` statement until it's indented properly, which is
; quite the dilemma for us. Before that happens, it's an identifier named
; "else". This has a chance of spuriously dedenting if you're typing out a
; variable called `elsewhere` or something, but I'm OK with that.
;
; This also means that we _should not_ mark an actual `else` keyword with
; `@dedent`, because if it's recognized as such, that's a sign that it's
; already indented correctly and we shouldn't touch it.
;
; All this also applies to `elif`.
((identifier) @dedent (#match? @dedent "^(elif|else)$"))

; Likewise, typing `case` at the beginning of a line within a match block — in
; cases where it's interpreted as an identifier — strongly suggests that we
; should dedent one level so it's properly recognized as a new `case` keyword.
(
  (identifier) @dedent
  (#equals? @dedent "case")
  (#is? test.descendantOfType "case_clause")
)


; All instances of brackets/braces should be indented if they span multiple
; lines.
["(" "[" "{"] @indent
[")" "]" "}"] @dedent
