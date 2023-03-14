
[
  "("
  "{"
  "case"
  "default"
] @indent

; TODO: Figure out how to indent this:
;
; switch (foo) {
;   case 'bar':
;     foo();
;   case 'baz':
;     thud();
;     break;
;   default:
;     ahaha();
; }
;
; All of it works as expected except for the first `case` statement.


[
  "}"
  ")"
] @indent_end

[
  "case"
  "default"
  "}"
  ")"
] @branch
