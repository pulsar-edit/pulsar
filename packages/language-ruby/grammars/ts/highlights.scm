; Classes
(scope_resolution (constant) @entity.name.type.class)
(scope_resolution "::" @punctuation.separator.namespace)
(superclass "<" @punctuation.separator.inheritance
             (constant) @entity.other.inherited-class)

; Keywords
"class" @keyword.control.class

[
  "alias"
  "and"
  "begin"
  "break"
  "case"
  "def"
  "do"
  "else"
  "elsif"
  "end"
  "ensure"
  "for"
  "if"
  "in"
  "module"
  "next"
  "or"
  "rescue"
  "retry"
  "return"
  "then"
  "unless"
  "until"
  "when"
  "while"
  "yield"
] @keyword.control

((identifier) @keyword.other.special-method
 (#match? @keyword.other.special-method "^(private|protected|public)$"))

; Function calls

((identifier) @keyword.other.special-method
 (#eq? @keyword.other.special-method "require"))

"defined?" @keyword.other.special-method

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
] @variable.other.readwrite.instance

((identifier) @constant.builtin
 (#match? @constant.builtin "^__(FILE|LINE|ENCODING)__$"))

(self) @variable.language.self
(super) @variable.language.super

(block_parameter (identifier) @variable.function.parameter)
(block_parameters (identifier) @variable.function.parameter)
(destructured_parameter (identifier) @variable.function.parameter)
(hash_splat_parameter (identifier) @variable.function.parameter)
(lambda_parameters (identifier) @variable.function.parameter)
(method_parameters (identifier) @variable.function.parameter)
(splat_parameter (identifier) @variable.function.parameter)

(keyword_parameter name: (identifier) @variable.function.parameter)
(optional_parameter name: (identifier) @variable.function.parameter)

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

(regex) @string.special.regex
(escape_sequence) @escape

[
  (integer)
  (float)
] @constant.numeric

[
  (nil)
  (true)
  (false)
] @constant.builtin

(interpolation
  "#{" @punctuation.special
  "}" @punctuation.special) @embedded

(comment) @comment

; Punctuations
"=" @keyword.operator.assignment
"=>" @punctuation.separator.key-value
((hash_key_symbol) ":" @punctuation.separator.key-value )
"&." @punctuation.separator.method
(method_parameters ["(" ")"] @punctuation.definition.parameters)

; Operators

[
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

(constant) @variable.other.constant
