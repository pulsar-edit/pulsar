; Keywords

"alias" @keyword.control.alias
"and" @keyword.control.and
"begin" @keyword.control.begin
"break" @keyword.control.break
"case" @keyword.control.case
"class" @keyword.control.class
"def" @keyword.control.def
"do" @keyword.control.do
"else" @keyword.control.else
"elsif" @keyword.control.elsif
"end" @keyword.control.end
"ensure" @keyword.control.ensure
"for" @keyword.control.for
"if" @keyword.control.if
"in" @keyword.control.in
"module" @keyword.control.module
"next" @keyword.control.next
"or" @keyword.control.or
"rescue" @keyword.control.rescue
"retry" @keyword.control.retry
"return" @keyword.control.return
"then" @keyword.control.then
"unless" @keyword.control.unless
"until" @keyword.control.until
"when" @keyword.control.when
"while" @keyword.control.while
"yield" @keyword.control.yield

((identifier) @keyword.other.special-method
 (#match? @keyword.other.special-method "^(private|protected|public)$"))

; Function calls

((identifier) @function.method.builtin
 (#eq? @function.method.builtin "require"))

"defined?" @function.method.builtin

(call
  method: [(identifier) (constant)] @function.method)

; Function definitions

(alias (identifier) @function.method)
(setter (identifier) @function.method)
(method name: [(identifier) (constant)] @function.method)
(singleton_method name: [(identifier) (constant)] @function.method)

; Identifiers

[
  (class_variable)
  (instance_variable)
] @property

((identifier) @constant.builtin
 (#match? @constant.builtin "^__(FILE|LINE|ENCODING)__$"))

;; Class stuff
("class"
  [(scope_resolution) (constant)]
  "<" @punctuation.separator.inheritance)
("class" (constant) @entity.name.type.class)
("class" (scope_resolution (constant) @entity.name.type.class))
(scope_resolution "::" @punctuation.separator.namespace)

((constant) @constant
 (#match? @constant "^[A-Z\\d_]+$"))

(constant) @constructor

(self) @variable.builtin
(super) @variable.builtin

(block_parameter (identifier) @variable.parameter)
(block_parameters (identifier) @variable.parameter)
(destructured_parameter (identifier) @variable.parameter)
(hash_splat_parameter (identifier) @variable.parameter)
(lambda_parameters (identifier) @variable.parameter)
(method_parameters (identifier) @variable.parameter)
(splat_parameter (identifier) @variable.parameter)

(keyword_parameter name: (identifier) @variable.parameter)
(optional_parameter name: (identifier) @variable.parameter)

((identifier) @function.method
 (#is-not? local))
(identifier) @variable

; Literals

[
  (string)
  (bare_string)
  (subshell)
  (heredoc_body)
  (heredoc_beginning)
] @string

[
  (simple_symbol)
  (delimited_symbol)
  (hash_key_symbol)
  (bare_symbol)
] @string.special.symbol

; (regex) @string.special.regex
(escape_sequence) @escape

[
  (integer)
  (float)
] @number

[
  (nil)
  (true)
  (false)
]@constant.builtin

(interpolation
  "#{" @punctuation.special
  "}" @punctuation.special) @embedded

(comment) @comment

; Operators

[
"="
"=>"
"->"
] @operator

[
  ","
  ";"
  "."
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "%w("
  "%i("
] @punctuation.bracket

;; Additional things
(regex
 "/" @punctuation.section.regexp
 (string_content) @string.regexp
 "/" @punctuation.section.regexp)
