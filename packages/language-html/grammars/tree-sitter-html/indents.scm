
((start_tag) @indent
  ; Only indent if this isn't a self-closing tag.
  (#not-match? @indent "^<(?:area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)\\s"))

; `end_tag` will still match when only `</div` is present. Without enforcing
; the presence of `>`, the dedent happens too soon.
((end_tag) @dedent
  (#match? @dedent ">$"))
