
; Prevent postfix modifiers from triggering indents on the next line.
(unless_modifier "unless" @_IGNORE_
  (#set! final true))
(if_modifier "if" @_IGNORE_
  (#set! final true))
(while_modifier "while" @_IGNORE_
  (#set! final true))
(until_modifier "until" @_IGNORE_
  (#set! final true))


[
  "class"
  ; (singleton_class)
  "def"
  ; (singleton_method)
  "module"
  "if"
  "elsif"
  "else"
  "unless"
  "case"
  "when"
  "while"
  "until"
  "for"
  ; (for)
  "begin"
  "do"
  "rescue"
  "ensure"
  "("
  "{"
  "["
] @indent

[
  "end"
  ")"
  "}"
  "]"
  "when"
  "elsif"
  "else"
  "rescue"
  "ensure"
  ; (ensure)
] @dedent

(comment) @ignore
