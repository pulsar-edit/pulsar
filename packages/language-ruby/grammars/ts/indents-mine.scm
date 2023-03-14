
[
  "do"
  "module"
  "class"
] @indent

; If the user has typed `if foo` but hasn't typed `end` yet, the only way to
; recognize that we should indent is via these anonymous nodes… TO

"if" @indent
"unless" @indent

; …but that also improperly catches postfix conditionals like `exit if foo`. So
; we dedent those to balance it out.
(if_modifier) @dedent
(unless_modifier) @dedent

[
  "end"
] @dedent
