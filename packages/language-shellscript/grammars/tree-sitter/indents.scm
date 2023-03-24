
[
  "then"
  "do"
  "("
] @indent

(compound_statement "{" @indent)

[
  "fi"
  "done"
  ")"
  "elif"
  "else"
] @indent_end @branch

(compound_statement "}" @indent_end @branch)
