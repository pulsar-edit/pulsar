

["{" "(" "["] @indent
["}" ")" "]"] @dedent

; if ($foo):
(colon_block ":" @indent)

["endif" "endfor" "endforeach" "enddeclare" "endswitch"] @dedent
