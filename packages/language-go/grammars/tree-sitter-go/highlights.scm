; CAVEATS:

; * No support for string placeholders in `Printf` functions (injection
; candidate?)

; COMMENTS
; ========

((comment) @comment.line.double-slash.go
  (#match? @comment.line.double-slash.go "^\/\/")
  (#set! final true))

((comment) @punctuation.definition.comment.go
  (#match? @punctuation.definition.comment.go "^\/\/")
  (#set! startAndEndAroundFirstMatchOf "^\/\/"))


((comment) @comment.block.go
  (#match? @comment.block.go "^\\/\\*"))

((comment) @punctuation.definition.comment.begin.go
  (#match? @punctuation.definition.comment.begin.go "^\\/\\*")
  (#set! startAndEndAroundFirstMatchOf "^\\/\\*"))

((comment) @punctuation.definition.comment.end.go
  (#match? @punctuation.definition.comment.end.go "\\*\\/$")
  (#set! startAndEndAroundFirstMatchOf "\\*\\/$"))


; TYPES
; =====

(type_declaration
  (type_spec
    name: (type_identifier) @entity.name.type.go)
    (#set! final true))

(type_identifier) @storage.type.other.go

[
  "func"
  "import"
  "package"
] @keyword._TYPE_.go

"type" @storage.type.go

[
  "struct"
] @storage.type._TYPE_.go

(struct_type
  (field_declaration_list
    (field_declaration
      (field_identifier) @entity.other.attribute-name.go)))

(keyed_element
  (field_identifier) @entity.other.attribute-name.go
  .
  ":" @punctuation.separator.key-value.go)

[
  "break"
  "case"
  "continue"
  "default"
  "defer"
  "else"
  "fallthrough"
  "for"
  "go"
  "goto"
  "if"
  "range"
  "return"
  "select"
  "switch"
] @keyword.control._TYPE_.go


(function_declaration (identifier) @entity.name.function.go)

(call_expression
  (identifier) @support.function.builtin.go
  (#match? @support.function.builtin.go "^(?:append|cap|close|complex|copy|delete|imag|len|make|new|panic|print|println|real|recover)$")
  (#set! final true))

(call_expression
  (identifier) @support.other.function.go)

(call_expression
  (selector_expression
    field: (field_identifier) @support.other.function.go))

; OBJECTS
; =======

(selector_expression
  operand: (selector_expression
    operand: (identifier) @support.other.object.go
    field: (field_identifier) @support.other.object.go))

; TODO: If we do this, then we have to do chaining (`a.b.c.Close()`) and that
; won't be fun.

(selector_expression
  operand: (identifier) @support.other.object.go)

; PACKAGES
; ========

(package_clause
  (package_identifier) @entity.name.package.go
  (#set! final true))

(package_identifier) @support.object.package.go

; STRINGS
; =======

((interpreted_string_literal "\"") @string.quoted.double.go)
(interpreted_string_literal
  "\"" @punctuation.definition.string.begin.go
  (#set! onlyIfFirst true))

(interpreted_string_literal
  "\"" @punctuation.definition.string.end.go
  (#set! onlyIfLast true))

(escape_sequence) @constant.character.escape.go

(rune_literal) @string.quoted.single.rune.go

(raw_string_literal) @string.quoted.raw.go
((raw_string_literal)
  @punctuation.definition.string.begin.go
  (#set! startAndEndAroundFirstMatchOf "^`"))
((raw_string_literal)
  @punctuation.definition.string.end.go
  (#set! startAndEndAroundFirstMatchOf "`$"))


; NUMBERS
; =======

(int_literal) @constant.numeric.integer.go


; VARIABLES
; =========

[
  "var"
  "const"
] @storage.modifier._TYPE_.go

(parameter_declaration (identifier) @variable.parameter.go)
(variadic_parameter_declaration (identifier) @variable.parameter.go)

(range_clause
  (expression_list
    (identifier) @variable.parameter.range.go))

(const_spec
  name: (identifier) @variable.other.assignment.const.go)

(var_spec
  name: (identifier) @variable.other.assignment.var.go)

; (var_declaration
;   (expression_list
;     (identifier) @variable.other.assignment.go))

(short_var_declaration
  (expression_list
    (identifier) @variable.other.assignment.var.go))

(assignment_statement
  (expression_list
    (identifier) @variable.other.assigment.go))

; CONSTANTS
; =========

[
  (true)
  (false)
  (nil)
] @constant.language._TYPE_.go

((identifier) @constant.language.iota.go
  (#eq? @constant.language.iota.go "iota"))

; OPERATORS
; =========

(binary_expression
  [
    "=="
    "!="
    ">"
    "<"
  ] @keyword.operator.comparison.go)

[
  "="
  ":="
] @keyword.operator.assignment.go

[
  "+="
  "-="
  "|="
  "^="
  "*="
  "/="
  "%="
  "<<="
  ">>="
  "&^="
  "&="
] @keyword.operator.assignment.compound.go

"<-" @keyword.operator.channel.go

"++" @keyword.operator.increment.go
"--" @keyword.operator.decrement.go



(binary_expression
  ["+" "-" "*" "/" "%"] @keyword.operator.arithmetic.go)

(binary_expression
  ["&" "|" "^" "&^" "<<" ">>"] @keyword.operator.arithmetic.bitwise.go)

(binary_expression ["&&" "||"] @keyword.operator.logical.go)

(variadic_parameter_declaration "..." @keyword.operator.ellipsis.go)


(pointer_type "*" @keyword.operator.address.go)
(unary_expression ["&" "*"] @keyword.operator.address.go)

(unary_expression "!" @keyword.operator.unary.go)

"." @keyword.operator.accessor.js


; PUNCTUATION
; ===========

";" @punctuation.terminator.go
"," @punctuation.separator.comma.go
":" @punctuation.separator.colon.go

(parameter_list
  "(" @punctuation.definition.parameters.begin.bracket.round.go
  ")" @punctuation.definition.parameters.end.bracket.round.go
  (#set! final true))

(composite_literal
  body: (literal_value
    "{" @punctuation.definition.struct.begin.bracket.curly.go
    "}" @punctuation.definition.struct.end.bracket.curly.go
    (#set! final true)))

"{" @punctuation.definition.begin.bracket.curly.go
"}" @punctuation.definition.end.bracket.curly.go
"(" @punctuation.definition.group.begin.bracket.round.go
")" @punctuation.definition.group.end.bracket.round.go
"[" @punctuation.definition.begin.bracket.square.go
"]" @punctuation.definition.end.bracket.square.go

; META
; ====

(function_declaration
  (block) @meta.block.function.go
  (#set! final true))

(block) @meta.block.go

(import_spec) @meta.import-specifier.go
(import_spec_list) @meta.import-specifier.list.go
