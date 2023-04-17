; Missing compared to the TM-style grammar:
; Glob operators (`*`)

(comment) @comment.line.number-sign.shell

(function_definition
  name: (_) @entity.name.function.shell)

; Why isn't this a keyword in the parser?
((command_name) @keyword.control.return.shell
  (#eq? @keyword.control.return.shell "return")
  (#set! final true))

((command_name) @support.function.builtin.shell
  (#match? @support.function.builtin.shell "^(?:alias|bg|bind|break|builtin|caller|cd|command|compgen|complete|dirs|disown|echo|enable|eval|exec|exit|false|fc|fg|getopts|hash|help|history|jobs|kill|let|logout|popd|printf|pushd|pwd|read|readonly|set|shift|shopt|source|suspend|test|times|trap|true|type|ulimit|umask|unalias|unset|wait)$")
  (#set! final true))

(command_name) @support.other.function.shell


[
  "if"
  "fi"
  "then"
  "else"
  "elif"
  "case"
  "esac"
  "for"
  "in"
  "do"
  "done"
] @keyword.control._TYPE_.shell

(declaration_command
  ["local" "export"] @storage.modifier._TYPE_.shell)

(variable_assignment
  (variable_name) @variable.other.member.shell)


(simple_expansion
  "$" @punctuation.definition.variable.shell (variable_name))
(expansion
  "${" @punctuation.definition.variable.begin.shell
  (variable_name)
  "}" @punctuation.definition.variable.end.shell) @variable.other.bracket.shell


((simple_expansion) @variable.other.positional.shell
  (#match? @variable.other.positional.shell "^\\$\\d+$")
  (#set! final true))

((simple_expansion) @variable.other.normal.shell)

; Prevent the "foo" in $foo from matching the following rule.
(simple_expansion (variable_name) @_IGNORE_
  (#set! final true))
(variable_name) @variable.other.shell


; STRINGS
; =======

(string "\"") @string.quoted.double.shell
(string "\"" @punctuation.definition.string.begin.shell
  (#set! onlyIfFirst true))
(string "\"" @punctuation.definition.string.end.shell
  (#set! onlyIfLast true))
(raw_string) @string.quoted.single.shell

(string
  (command_substitution) @meta.embedded.line.subshell.shell)

(heredoc_start) @punctuation.definition.string.begin.heredoc.shell
(heredoc_body) @string.unquoted.heredoc.shell

; VALUES
; ======

(array) @meta.array.shell
(array
  (word) @string.unquoted.shell)


; OPERATORS
; =========

(list ["&&" "||"] @keyword.operator.logical.shell)
(binary_expression ["&&" "||"] @keyword.operator.logical.shell)

; "*" @keyword.operator.glob.shell

[
  "="
] @keyword.operator.assignment.shell

[
  "=="
  "!="
] @keyword.operator.comparison.shell

[
  "+="
  "-="
] @keyword.operator.increment.shell

(negated_command "!" @keyword.operator.unary.shell)

(expansion
  [":-" ":?"] @keyword.operator.expansion.shell
)

(file_redirect
  [
    ">"
    ">&"
    "&>"
    "&>>"
  ] @keyword.operator.redirect.shell)

(test_operator) @keyword.operator.test.shell

((file_descriptor) @constant.numeric.file-descriptor.shell
  (#match? @constant.numeric.file-descriptor.shell "^[12]$"))

(file_redirect
  destination: (word) @constant.numeric.file-descriptor.shell
    (#match? @constant.numeric.file-descriptor.shell "^[12]$"))

(test_command
  "[[" @punctuation.brace.double-square.begin.shell)
(test_command
  "]]" @punctuation.brace.double-square.end.shell)

; PUNCTUATION
; ===========

"{" @punctuation.brace.curly.begin.shell
"}" @punctuation.brace.curly.end.shell
"(" @punctuation.brace.round.begin.shell
")" @punctuation.brace.round.end.shell
"[" @punctuation.brace.square.begin.shell
"]" @punctuation.brace.square.end.shell

";" @punctuation.terminator.statement.shell
":" @punctuation.separator.colon.shell
