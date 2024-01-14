;

["{" "(" "["] @indent
["}" ")" "]"] @dedent

":" @indent

["endif" "endfor" "endforeach" "enddeclare" "endswitch"] @dedent
