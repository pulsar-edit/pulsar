[
  "class"
  (singleton_class)
  "def"
  (singleton_method)
  "module"
  "if"
  "else"
  "unless"
  ; (block)
  ; (argument_list)
  (case)
  (while)
  (until)
  (for)
  "begin"
  "do"
  "rescue"
  ; (unless)
  "("
  "{"
  "["
] @indent



[
  "end"
  ")"
  "}"
  "]"
] @indent_end

[
  "end"
  ")"
  "}"
  "]"
  (when)
  (elsif)
  (else)
  "rescue"
  (ensure)
] @branch

(comment) @ignore
