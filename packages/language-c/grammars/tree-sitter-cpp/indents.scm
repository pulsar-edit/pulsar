

["{" "(" "["] @indent

["}" ")" "]"] @dedent


; With access specifiers like…
;
; class Foo {
; public:
;   void bar() {}
; }
;
; …prevailing style is to dedent the specifier so it matches the indentation of
; the line above.
(access_specifier) @dedent @indent

; `switch` statements have a couple schools of thought, indentation-wise, and
; we might have to make this configurable somehow.
(switch_statement
  body: (compound_statement "}" @match
    (#is? test.last true))
  (#set! indent.matchIndentOf parent.startPosition))

; 'case' and 'default' need to be indented one level more than their containing
; `switch`.
(["case" "default"] @match
  (#set! indent.matchIndentOf parent.parent.startPosition)
  (#set! indent.offsetIndent 1))

["case" "default"] @indent
