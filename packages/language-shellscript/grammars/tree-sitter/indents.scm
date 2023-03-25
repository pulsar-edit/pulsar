
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
] @dedent

(compound_statement "}" @dedent)
