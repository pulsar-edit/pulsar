; Missing compared to the TM-style grammar:
; Glob operators (`*`)

(comment) @comment.line.number-sign.shell

(function_definition
  name: (_) @entity.name.function.shell)

; Why isn't this a keyword in the parser?
((command_name) @keyword.control.return.shell
  (#eq? @keyword.control.return.shell "return")
  (#set! capture.final true))

((command_name) @support.function.builtin._TEXT_.shell
  (#match? @support.function.builtin._TEXT_.shell "^(?:alias|bg|bind|break|builtin|caller|cd|command|compgen|complete|dirs|disown|echo|enable|eval|exec|exit|false|fc|fg|getopts|hash|help|history|jobs|kill|let|logout|popd|printf|pushd|pwd|read|readonly|set|shift|shopt|source|suspend|test|times|trap|true|type|ulimit|umask|unalias|unset|wait)$")
  (#set! capture.final true))

(unset_command "unset" @support.function.builtin.unset.shell)

((command_name) @support.other.function.shell
  (#is-not? test.descendantOfType "command_substitution"))


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
  "while"
] @keyword.control._TYPE_.shell

(declaration_command
  ["local" "export" "declare" "readonly"] @storage.modifier._TYPE_.shell)

(variable_assignment
  (variable_name) @variable.other.member.shell
  (#set! capture.final true))


(simple_expansion
  "$" @punctuation.definition.variable.shell (variable_name))
(expansion
  "${" @punctuation.definition.variable.begin.shell
  ; (variable_name)
  "}" @punctuation.definition.variable.end.shell) @variable.other.bracket.shell


((simple_expansion) @variable.other.positional.shell
  (#match? @variable.other.positional.shell "^\\$\\d+$")
  (#set! capture.final true))

((simple_expansion) @variable.other.normal.shell)

; Prevent the "foo" in $foo from matching the following rule.
(simple_expansion (variable_name) @_IGNORE_
  (#set! capture.final true))
(variable_name) @variable.other.shell


; STRINGS
; =======

(string "\"") @string.quoted.double.shell
(string "\"" @punctuation.definition.string.begin.shell
  (#is? test.first true))
(string "\"" @punctuation.definition.string.end.shell
  (#is? test.last true))
(raw_string) @string.quoted.single.shell
((raw_string) @punctuation.definition.string.begin.shell
  (#match? @punctuation.definition.string.begin.shell "^.")
  (#set! adjust.startAndEndAroundFirstMatchOf "^."))
((raw_string) @punctuation.definition.string.end.shell
  (#match? @punctuation.definition.string.begin.shell ".$")
  (#set! adjust.startAndEndAroundFirstMatchOf ".$"))
(ansi_c_string) @string.quoted.single.dollar.shell
((ansi_c_string) @punctuation.definition.string.begin.shell
  (#match? @punctuation.definition.string.begin.shell "^..")
  (#set! adjust.startAndEndAroundFirstMatchOf "^.."))
((ansi_c_string) @punctuation.definition.string.end.shell
  (#match? @punctuation.definition.string.end.shell ".$")
  (#set! adjust.startAndEndAroundFirstMatchOf ".$"))

(string
  (command_substitution) @meta.embedded.line.subshell.shell
  (#set! capture.final true))

; Command substitution with backticks: var=`cmd`
((command_substitution) @string.quoted.interpolated.backtick.shell
  (#match? @string.quoted.interpolated.backtick.shell "^`"))

((command_substitution) @punctuation.definition.string.begin.shell
  (#match? @punctuation.definition.string.begin.shell "^`")
  (#set! adjust.endAfterFirstMatchOf "^`"))

((command_substitution) @punctuation.definition.string.end.shell
  (#match? @punctuation.definition.string.end.shell "`$")
  (#set! adjust.startBeforeFirstMatchOf "`$"))

; Command substitution of the form: var=$(cmd)
((command_substitution) @string.quoted.interpolated.dollar.shell
  (#match? @string.quoted.interpolated.dollar.shell "^\\$\\("))

((command_substitution) @punctuation.definition.string.begin.shell
  (#match? @punctuation.definition.string.begin.shell "^\\$\\(")
  (#set! adjust.endAfterFirstMatchOf "^\\$\\("))

((command_substitution) @punctuation.definition.string.end.shell
  (#match? @punctuation.definition.string.end.shell "\\)$")
  (#set! adjust.startBeforeFirstMatchOf "\\)$"))


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

(pipeline "|" @keyword.operator.pipe.shell)

; Any expansion operator, including all `#`s and `%`s in the following examples:
;
; foo="${bar#*.}"
; foo="${bar##*.}"
; foo="${bar%*.}"
; foo="${bar%%*.}"
; 
(expansion operator: _ @keyword.operator.expansion.shell)


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
    "<"
    ">"
    ">&"
    "&>"
    "&>>"
  ] @keyword.operator.redirect.shell)

(test_operator) @keyword.operator.test.shell
(unary_expression "!" @keyword.operator.unary.shell)

((file_descriptor) @constant.numeric.file-descriptor.shell
  (#match? @constant.numeric.file-descriptor.shell "^[12]$"))

(file_redirect
  destination: (word) @constant.numeric.file-descriptor.shell
    (#match? @constant.numeric.file-descriptor.shell "^[12]$"))

(number) @constant.numeric.decimal.shell

; TODO: Double parentheses are used like `let` expressions, but ((i++)) is not
; understood by `tree-sitter-bash` as a variable increment. It needs an equals
; sign before it construes the contents as math.
(test_command
  "((" @punctuation.brace.double-round.begin.shell)
(test_command
  "))" @punctuation.brace.double-round.end.shell)


(test_command
  "[[" @punctuation.brace.double-square.begin.shell)
(test_command
  "]]" @punctuation.brace.double-square.end.shell)

; PUNCTUATION
; ===========

("{" @punctuation.brace.curly.begin.shell (#set! capture.shy))
("}" @punctuation.brace.curly.end.shell (#set! capture.shy))
("(" @punctuation.brace.round.begin.shell (#set! capture.shy))
(")" @punctuation.brace.round.end.shell (#set! capture.shy))
("[" @punctuation.brace.square.begin.shell (#set! capture.shy))
("]" @punctuation.brace.square.end.shell (#set! capture.shy))

(";" @punctuation.terminator.statement.shell (#set! capture.shy))
(":" @punctuation.separator.colon.shell (#set! capture.shy))
