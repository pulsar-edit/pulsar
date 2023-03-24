
; COMMENTS
; ========

((comment) @comment.line.double-slash.ts
  (#match? @comment.line.double-slash.ts "^//"))

((comment) @punctuation.definition.comment.ts
  (#match? @comment.line.double-slash.ts "^//")
  (#set! startAndEndAroundFirstMatchOf "^//"))

((comment) @comment.block.ts
  (#match? @comment.block.ts "^/\\*"))

((comment) @punctuation.definition.comment.begin.ts
  (#match? @punctuation.definition.comment.begin.ts "^/\\*")
  (#set! startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.ts
  (#match? @punctuation.definition.comment.end.ts "\\*/$")
  (#set! startAndEndAroundFirstMatchOf "\\*/$"))


; PROPERTIES
; ==========

((property_identifier) @constant.other.property.ts
  (#match? @constant.other.property.ts "^[\$A-Z_]+$")
  (#set! final true))

; (property_identifier) @variable.other.object.property.ts

((shorthand_property_identifier) @constant.other.ts
  (#match? @constant.other.ts "^[\$A-Z_]{2,}$"))

; CLASSES
; =======

(class_declaration
  name: (type_identifier) @entity.name.type.class.ts)

(extends_clause
  value: (_) @entity.other.inherited-class.ts)

(public_field_definition
  name: (property_identifier) @variable.declaration.field.ts)

(new_expression
  constructor: (identifier) @support.type.class.ts)

; A class getter:
; the "get" in `get foo () {...`
(method_definition
  "get" @storage.getter.ts)

; A class setter:
; the "set" in `set foo (value) {...`
(method_definition
  "set" @storage.setter.ts)


; INTERFACES
; ==========

(interface_declaration
  name: (_) @entity.name.type.interface.ts)

; TYPES
; =====

["var" "let" "const"] @storage.modifier._TYPE_.ts
["extends" "static" "async"] @storage.modifier._TYPE_.ts

["class" "function"] @storage.type._TYPE_.ts

"=>" @storage.type.arrow.ts

; TODO: If I allow scopes like `storage.type.string.ts`, I will make a lot of
; text look like strings by accident. This really needs to be fixed in syntax
; themes.
(predefined_type _ @storage.type.ts @support.type.ts)

(literal_type) @storage.type._TEXT_.ts @support.type.ts

[
  "implements"
  "namespace"
  "enum"
  "interface"
  "module"
  "declare"
  "public"
  "private"
  "protected"
  "readonly"
  "type"
] @storage.modifier._TYPE_.ts


; (type_annotation)

((type_identifier) @storage.type.ts @support.type.ts
  (#set! onlyIfDescendantOfType type_annotation))

((type_identifier) @storage.type.ts @support.type.ts
  (#set! onlyIfDescendantOfType type_arguments))

; OBJECTS
; =======

; The "foo" in `{ foo: true }`.
(pair
  key: (property_identifier) @entity.other.attribute-name.ts)

; TODO: This is both a key and a value, so opinions may vary on how to treat it.
(object
  (shorthand_property_identifier) @entity.other.attribute-name.shorthand.ts)

; The "foo" in `foo.bar`.
(member_expression
  object: (identifier) @support.object.other.ts)

; The "bar" in `foo.bar.baz`.
(member_expression
  object: (member_expression
    property: (property_identifier) @support.object.other.ts))


(property_signature
  (property_identifier) @entity.other.attribute-name.ts)

; FUNCTIONS
; =========

(method_definition
  name: (property_identifier) @entity.name.function.method.ts)

(call_expression
  function: (member_expression
    property: (property_identifier) @support.function.method.other.ts))

; VARIABLES
; =========

(this) @variable.language.this.ts

(variable_declarator
  name: (identifier) @variable.other.assignment.ts)

(required_parameter
  pattern: (_) @variable.parameter.ts)

(arrow_function
  parameter: (identifier) @variable.parameter.arrow.ts)

(for_in_statement
  left: (array_pattern
    (identifier) @variable.other.assignment.loop.ts))

(for_in_statement
  left: (identifier) @variable.other.assignment.loop.ts)

; NUMBERS
; =======

(number) @constant.numeric.ts

; STRINGS
; =======

((string "\"") @string.quoted.double.ts)
((string
  "\"" @punctuation.definition.string.begin.ts)
  (#set! onlyIfFirst true))

((string
  "\"" @punctuation.definition.string.end.ts)
  (#set! onlyIfLast true))

((string "'") @string.quoted.single.ts)
((string
  "'" @punctuation.definition.string.begin.ts)
  (#set! onlyIfFirst true))

((string
  "'" @punctuation.definition.string.end.ts)
  (#set! onlyIfLast true))

(template_string) @string.quoted.template.ts

((template_string "`" @punctuation.definition.string.begin.ts)
  (#set! onlyIfFirst true))
((template_string "`" @punctuation.definition.string.end.ts)
  (#set! onlyIfLast true))

; Interpolations inside of template strings.
(template_substitution
  "${" @punctuation.definition.template-expression.begin.ts
  "}" @punctuation.definition.template-expression.end.ts
) @meta.embedded.interpolation.ts

; CONSTANTS
; =========

[
  (true)
  (false)
] @constant.language.boolean._TYPE_.ts

[
  (null)
  (undefined)
] @constant.language._TYPE_.ts

; KEYWORDS
; ========

[
  "as"
  "if"
  "do"
  "else"
  "while"
  "for"
  "in"
  "of"
  "return"
  "break"
  "continue"
  "throw"
  "try"
  "catch"
  "finally"
  "switch"
  "case"
  "default"
  "export"
  "import"
  "from"
  "yield"
  "await"
  "debugger"
] @keyword.control._TYPE_.ts

; OPERATORS
; =========

["delete" "instanceof"] @keyword.operator.delete.ts
"new" @keyword.operator.new.ts

"=" @keyword.operator.assignment.ts
(non_null_expression "!" @keyword.operator.non-null.ts)
(unary_expression"!" @keyword.operator.unary.ts)

[
  "+="
  "-="
  "*="
  "/="
  "%="
  "<<="
  ">>="
  ">>>="
  "&="
  "^="
  "|="
] @keyword.operator.assignment.compound.ts

[
  "+"
  "-"
  "*"
  "/"
  "%"
] @keyword.operator.arithmetic.ts

[
  "=="
  "==="
  "!="
  "!=="
  ">="
  "<="
  ">"
  "<"
] @keyword.operator.comparison.ts

[
  "&&"
  "||"
  "??"
] @keyword.operator.logical.ts

(union_type "|" @keyword.operator.type.union.ts)

"..." @keyword.operator.spread.ts
"." @keyword.operator.accessor.ts
"?." @keyword.operator.accessor.optional-chaining.ts

(ternary_expression ["?" ":"] @keyword.operator.ternary.ts)

; TODO: Ternary doesn't highlight properly; presumably fixed in
; https://github.com/tree-sitter/tree-sitter-typescript/pull/215, but needs
; update to v0.20.2.
(ternary_expression "?" @keyword.operator.ternary.ts)

(public_field_definition "?" @keyword.operator.optional-type.ts)


; PUNCTUATION
; ===========

"{" @punctuation.definition.begin.brace.curly.ts
"}" @punctuation.definition.end.brace.curly.ts
"(" @punctuation.definition.begin.brace.round.ts
")" @punctuation.definition.end.brace.round.ts
"[" @punctuation.definition.begin.brace.square.ts
"]" @punctuation.definition.end.brace.square.ts

";" @punctuation.terminator.statement.ts
"," @punctuation.separator.comma.ts
":" @punctuation.separator.colon.ts
