
; COMMENTS
; ========

((comment) @comment.line.double-slash.ts.tsx
  (#match? @comment.line.double-slash.ts.tsx "^//"))

((comment) @punctuation.definition.comment.ts.tsx
  (#match? @comment.line.double-slash.ts.tsx "^//")
  (#set! startAndEndAroundFirstMatchOf "^//"))

((comment) @comment.block.ts.tsx
  (#match? @comment.block.ts.tsx "^/\\*"))

((comment) @punctuation.definition.comment.begin.ts.tsx
  (#match? @punctuation.definition.comment.begin.ts.tsx "^/\\*")
  (#set! startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.ts.tsx
  (#match? @punctuation.definition.comment.end.ts.tsx "\\*/$")
  (#set! startAndEndAroundFirstMatchOf "\\*/$"))


; PROPERTIES
; ==========

((property_identifier) @constant.other.property.ts.tsx
  (#match? @constant.other.property.ts.tsx "^[\$A-Z_]+$")
  (#set! final true))

; (property_identifier) @variable.other.object.property.ts.tsx

((shorthand_property_identifier) @constant.other.ts.tsx
  (#match? @constant.other.ts.tsx "^[\$A-Z_]{2,}$"))

; CLASSES
; =======

(class_declaration
  name: (type_identifier) @entity.name.type.class.ts.tsx)

(extends_clause
  value: (_) @entity.other.inherited-class.ts.tsx)

(public_field_definition
  name: (property_identifier) @variable.declaration.field.ts.tsx)

(new_expression
  constructor: (identifier) @support.type.class.ts.tsx)

; A class getter:
; the "get" in `get foo () {...`
(method_definition
  "get" @storage.getter.ts.tsx)

; A class setter:
; the "set" in `set foo (value) {...`
(method_definition
  "set" @storage.setter.ts.tsx)


; INTERFACES
; ==========

(interface_declaration
  name: (_) @entity.name.type.interface.ts.tsx)

; TYPES
; =====

["var" "let" "const"] @storage.modifier._TYPE_.ts.tsx
["extends" "static" "async"] @storage.modifier._TYPE_.ts.tsx

["class" "function"] @storage.type._TYPE_.ts.tsx

"=>" @storage.type.arrow.ts.tsx

; TODO: If I allow scopes like `storage.type.string.ts.tsx`, I will make a lot of
; text look like strings by accident. This really needs to be fixed in syntax
; themes.
(predefined_type _ @storage.type.ts.tsx @support.type.ts.tsx)

(literal_type) @storage.type._TEXT_.ts.tsx @support.type.ts.tsx

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
] @storage.modifier._TYPE_.ts.tsx


; (type_annotation)

((type_identifier) @storage.type.ts.tsx @support.type.ts.tsx
  (#set! onlyIfDescendantOfType type_annotation))

((type_identifier) @storage.type.ts.tsx @support.type.ts.tsx
  (#set! onlyIfDescendantOfType type_arguments))

; OBJECTS
; =======

; The "foo" in `{ foo: true }`.
(pair
  key: (property_identifier) @entity.other.attribute-name.ts.tsx)

; TODO: This is both a key and a value, so opinions may vary on how to treat it.
(object
  (shorthand_property_identifier) @entity.other.attribute-name.shorthand.ts.tsx)

; The "foo" in `foo.bar`.
(member_expression
  object: (identifier) @support.object.other.ts.tsx)

; The "bar" in `foo.bar.baz`.
(member_expression
  object: (member_expression
    property: (property_identifier) @support.object.other.ts.tsx))


(property_signature
  (property_identifier) @entity.other.attribute-name.ts.tsx)

; FUNCTIONS
; =========

(method_definition
  name: (property_identifier) @entity.name.function.method.ts.tsx)

(call_expression
  function: (member_expression
    property: (property_identifier) @support.function.method.other.ts.tsx))

; VARIABLES
; =========

(this) @variable.language.this.ts.tsx

(variable_declarator
  name: (identifier) @variable.other.assignment.ts.tsx)

(required_parameter
  pattern: (_) @variable.parameter.ts.tsx)

(arrow_function
  parameter: (identifier) @variable.parameter.arrow.ts.tsx)

(for_in_statement
  left: (array_pattern
    (identifier) @variable.other.assignment.loop.ts.tsx))

(for_in_statement
  left: (identifier) @variable.other.assignment.loop.ts.tsx)

; NUMBERS
; =======

(number) @constant.numeric.ts.tsx

; STRINGS
; =======

((string "\"") @string.quoted.double.ts.tsx)
((string
  "\"" @punctuation.definition.string.begin.ts.tsx)
  (#set! onlyIfFirst true))

((string
  "\"" @punctuation.definition.string.end.ts.tsx)
  (#set! onlyIfLast true))

((string "'") @string.quoted.single.ts.tsx)
((string
  "'" @punctuation.definition.string.begin.ts.tsx)
  (#set! onlyIfFirst true))

((string
  "'" @punctuation.definition.string.end.ts.tsx)
  (#set! onlyIfLast true))

(template_string) @string.quoted.template.ts.tsx

((template_string "`" @punctuation.definition.string.begin.ts.tsx)
  (#set! onlyIfFirst true))
((template_string "`" @punctuation.definition.string.end.ts.tsx)
  (#set! onlyIfLast true))

; Interpolations inside of template strings.
(template_substitution
  "${" @punctuation.definition.template-expression.begin.ts.tsx
  "}" @punctuation.definition.template-expression.end.ts.tsx
) @meta.embedded.interpolation.ts.tsx

; CONSTANTS
; =========

[
  (true)
  (false)
] @constant.language.boolean._TYPE_.ts.tsx

[
  (null)
  (undefined)
] @constant.language._TYPE_.ts.tsx

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
] @keyword.control._TYPE_.ts.tsx

; OPERATORS
; =========

["delete" "instanceof"] @keyword.operator.delete.ts.tsx
"new" @keyword.operator.new.ts.tsx

"=" @keyword.operator.assignment.ts.tsx
(non_null_expression "!" @keyword.operator.non-null.ts.tsx)
(unary_expression"!" @keyword.operator.unary.ts.tsx)

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
] @keyword.operator.assignment.compound.ts.tsx

[
  "+"
  "-"
  "*"
  "/"
  "%"
] @keyword.operator.arithmetic.ts.tsx

[
  "=="
  "==="
  "!="
  "!=="
  ">="
  "<="
  ">"
  "<"
] @keyword.operator.comparison.ts.tsx

[
  "&&"
  "||"
  "??"
] @keyword.operator.logical.ts.tsx

(union_type "|" @keyword.operator.type.union.ts.tsx)

"..." @keyword.operator.spread.ts.tsx
"." @keyword.operator.accessor.ts.tsx
"?." @keyword.operator.accessor.optional-chaining.ts.tsx

(ternary_expression ["?" ":"] @keyword.operator.ternary.ts.tsx)

; TODO: Ternary doesn't highlight properly; presumably fixed in
; https://github.com/tree-sitter/tree-sitter-typescript/pull/215, but needs
; update to v0.20.2.
(ternary_expression "?" @keyword.operator.ternary.ts.tsx)

(public_field_definition "?" @keyword.operator.optional-type.ts.tsx)


; PUNCTUATION
; ===========

"{" @punctuation.definition.begin.brace.curly.ts.tsx
"}" @punctuation.definition.end.brace.curly.ts.tsx
"(" @punctuation.definition.begin.brace.round.ts.tsx
")" @punctuation.definition.end.brace.round.ts.tsx
"[" @punctuation.definition.begin.brace.square.ts.tsx
"]" @punctuation.definition.end.brace.square.ts.tsx

";" @punctuation.terminator.statement.ts.tsx
"," @punctuation.separator.comma.ts.tsx
":" @punctuation.separator.colon.ts.tsx


; JSX
; ===

; The "Foo" in `<Foo />`.
(jsx_self_closing_element
  name: (identifier) @entity.name.tag.ts.tsx
  ) @meta.tag.ts.tsx

; The "Foo" in `<Foo>`.
(jsx_opening_element
  name: (identifier) @entity.name.tag.ts.tsx)

; The "Foo" in `</Foo>`.
(jsx_closing_element
  "/" @punctuation.definition.tag.end.ts.tsx
  (#set! final true)
  name: (identifier) @entity.name.tag.ts.tsx)

; The "bar" in `<Foo bar={true} />`.
(jsx_attribute
  (property_identifier) @entity.other.attribute-name.ts.tsx)

; All JSX expressions/interpolations within braces.
(jsx_expression) @meta.embedded.ts.tsx

(jsx_self_closing_element
  "<" @punctuation.definition.tag.begin.ts.tsx
  (#set! final true))

((jsx_self_closing_element
  ; The "/>" in `<Foo />`, extended to cover both anonymous nodes at once.
  "/") @punctuation.definition.tag.end.ts.tsx
  (#set! startAt lastChild.previousSibling.startPosition)
  (#set! endAt lastChild.endPosition)
  (#set! final true))
