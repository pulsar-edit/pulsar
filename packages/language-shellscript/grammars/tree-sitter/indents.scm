
[
  "then"
  "do"
  "("
  "else"
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
