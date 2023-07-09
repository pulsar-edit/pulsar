; IMPORTS/EXPORTS
; ===============

; The "Foo" in `import Foo from './bar'`
(import_clause
  (identifier) @variable.other.assignment.import.ts)

; The "Foo" in `import { Foo } from './bar'`
(import_specifier
  (identifier) @variable.other.assignment.import.ts)

; The "Foo" in `export { Foo }`
(export_specifier
  name: (identifier) @variable.other.assignment.export.ts)

; The "default" in `export { Foo as default }`
(export_specifier
  alias: (identifier) @keyword.control.default.ts
  (#eq? @keyword.control.default.ts "default"))

; The "default" in `export default Foo`
(export_statement
  "default" @keyword.control.default.ts)

; The "Foo" in `export Foo`
(export_statement
  (identifier) @variable.other.assignment.export.ts)


; COMMENTS
; ========

((comment) @comment.line.double-slash.ts.tsx
  (#match? @comment.line.double-slash.ts.tsx "^//"))

((comment) @punctuation.definition.comment.ts.tsx
  (#match? @comment.line.double-slash.ts.tsx "^//")
  (#set! adjust.startAndEndAroundFirstMatchOf "^//"))

((comment) @comment.block.ts.tsx
  (#match? @comment.block.ts.tsx "^/\\*"))

((comment) @punctuation.definition.comment.begin.ts.tsx
  (#match? @punctuation.definition.comment.begin.ts.tsx "^/\\*")
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.ts.tsx
  (#match? @punctuation.definition.comment.end.ts.tsx "\\*/$")
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))


; PROPERTIES
; ==========

((property_identifier) @constant.other.property.ts.tsx
  (#match? @constant.other.property.ts.tsx "^[\$A-Z_]+$")
  (#set! test.final true))

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

(type_alias_declaration
  name: (type_identifier) @variable.declaration.type.ts)

((literal_type [(null) (undefined)]) @storage.type._TEXT_.ts.tsx)
((literal_type [(null) (undefined)]) @support.type.ts.tsx
  (#set! test.final true))

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
  "satisfies"
  "type"
] @storage.modifier._TYPE_.ts.tsx


(index_signature
  name: (identifier) @entity.other.attribute-name.type.ts.tsx)

((type_identifier) @storage.type.ts.tsx
  (#set! test.onlyIfDescendantOfType "type_annotation type_arguments satisfies_expression"))

; A capture can satisfy more than one of these criteria, so we need to guard
; against multiple matches. That's why we use `test.final` here, and why the
; two capture names are applied in separate captures — otherwise `test.final`
; would be applied after the first capture.
((type_identifier) @support.type.ts.tsx
  (#set! test.onlyIfDescendantOfType "type_annotation type_arguments satisfies_expression")
  (#set! test.final true))


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
  object: (identifier) @support.other.object.ts.tsx)

; The "bar" in `foo.bar.baz`.
(member_expression
  object: (member_expression
    property: (property_identifier) @support.other.object.ts.tsx))


(property_signature
  (property_identifier) @entity.other.attribute-name.ts.tsx)

; FUNCTIONS
; =========

; Named function expressions:
; the "foo" in `let bar = function foo () {`
(function
  name: (identifier) @entity.name.function.definition.ts.tsx)

; Function definitions:
; the "foo" in `function foo () {`
(function_declaration
  name: (identifier) @entity.name.function.definition.ts.tsx)

; Named generator function expressions:
; the "foo" in `let bar = function* foo () {`
(generator_function
  name: (identifier) @entity.name.function.generator.definition.ts.tsx)

; Generator function definitions:
; the "foo" in `function* foo () {`
(generator_function_declaration
  name: (identifier) @entity.name.function.generator.definition.ts.tsx)

; Method definitions:
; the "foo" in `foo () {` (inside a class body)
(method_definition
  name: (property_identifier) @entity.name.function.method.definition.ts.tsx)

; Function property assignment:
; The "foo" in `thing.foo = (arg) => {}`
(assignment_expression
  left: (member_expression
    property: (property_identifier) @entity.name.function.definition.ts.tsx
    (#set! test.final true))
  right: [(arrow_function) (function)])

; Function variable assignment:
; The "foo" in `let foo = function () {`
(variable_declarator
  name: (identifier) @entity.name.function.definition.ts.tsx
  value: [(function) (arrow_function)])

; Function variable reassignment:
; The "foo" in `foo = function () {`
(assignment_expression
  left: (identifier) @function
  right: [(function) (arrow_function)])

; Object key-value pair function:
; The "foo" in `{ foo: function () {} }`
(pair
  key: (property_identifier) @entity.name.function.method.definition.ts.tsx
  value: [(function) (arrow_function)])

(function "function" @storage.type.function.ts.tsx)
(function_declaration "function" @storage.type.function.ts.tsx)

(generator_function "function" @storage.type.function.ts.tsx)
(generator_function_declaration "function" @storage.type.function.ts.tsx)

(generator_function "*" @storage.modifier.generator.ts.tsx)
(generator_function_declaration "*" @storage.modifier.generator.ts.tsx)
(method_definition "*" @storage.modifier.generator.ts.tsx)


; VARIABLES
; =========

(this) @variable.language.this.ts.tsx

(required_parameter
  pattern: (_) @variable.parameter.ts)

(required_parameter
  pattern: (object_pattern
    (shorthand_property_identifier_pattern) @variable.parameter.destructuring.ts)
    (#set! test.final true))

(update_expression
  argument: (identifier) @variable.other.assignment.js)

["var" "const" "let"] @storage.type._TYPE_.ts.tsx

; A simple variable declaration:
; The "foo" in `let foo = true`
(variable_declarator
  name: (identifier) @variable.other.assignment.ts.tsx)

; A reassignment of a variable declared earlier:
; The "foo" in `foo = true`
(assignment_expression
  left: (identifier) @variable.other.assignment.ts.tsx)

; A variable object destructuring:
; The "foo" in `let { foo } = something`
(assignment_expression
  left: (member_expression
    property: (property_identifier)) @variable.other.assignment.property.ts.tsx)

; The "foo" in `foo += 1`.
(augmented_assignment_expression
  left: (identifier) @variable.other.assignment.ts.tsx)

; The "foo" in `foo++`.
(update_expression
  argument: (identifier) @variable.other.assignment.ts.tsx)

; `object_pattern` appears to only be encountered in assignment expressions, so
; this won't match other uses of object/prop shorthand.
((object_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring.ts.tsx))

; A variable object destructuring with default value:
; The "foo" in `let { foo = true } = something`
(object_assignment_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring.ts.tsx)

; A variable object alias destructuring:
; The "bar" and "foo" in `let { bar: foo } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name.ts.tsx
    value: (identifier) @variable.other.assignment.destructuring.ts.tsx))

; A variable object alias destructuring with default value:
; The "bar" and "foo" in `let { bar: foo = true } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name.ts.tsx
    value: (assignment_pattern
      left: (identifier) @variable.other.assignment.destructuring.ts.tsx)))

; A variable array destructuring:
; The "foo" and "bar" in `let [foo, bar] = something`
(variable_declarator
  (array_pattern
    (identifier) @variable.other.assignment.destructuring.ts.tsx))

; A variable declaration in a for…(in|of) loop:
; The "foo" in `for (let foo of bar) {`
(for_in_statement
  left: (identifier) @variable.other.assignment.loop.ts.tsx)

; A variable array destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let [foo, bar] of baz)`
(for_in_statement
  left: (array_pattern
    (identifier) @variable.other.assignment.loop.ts.tsx))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let { foo, bar } of baz)`
(for_in_statement
  left: (object_pattern
    (shorthand_property_identifier_pattern) @variable.other.assignment.loop.ts.tsx))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" in `for (let { bar: foo } of baz)`
(for_in_statement
  left: (object_pattern
    (pair_pattern
      key: (_) @entity.other.attribute-name.ts.tsx
      value: (identifier) @variable.other.assignment.loop.ts.tsx)
      (#set! test.final true)))

; The "error" in `} catch (error) {`
(catch_clause
  parameter: (identifier) @variable.other.assignment.catch.ts.tsx)

; Single parameter of an arrow function:
; The "foo" in `(foo => …)`
(arrow_function parameter: (identifier) @variable.parameter.ts.tsx)


; NUMBERS
; =======

(number) @constant.numeric.ts.tsx

; STRINGS
; =======

((string "\"") @string.quoted.double.ts.tsx)
((string
  "\"" @punctuation.definition.string.begin.ts.tsx)
  (#set! test.onlyIfFirst true))

((string
  "\"" @punctuation.definition.string.end.ts.tsx)
  (#set! test.onlyIfLast true))

((string "'") @string.quoted.single.ts.tsx)
((string
  "'" @punctuation.definition.string.begin.ts.tsx)
  (#set! test.onlyIfFirst true))

((string
  "'" @punctuation.definition.string.end.ts.tsx)
  (#set! test.onlyIfLast true))

(template_string) @string.quoted.template.ts.tsx

((template_string "`" @punctuation.definition.string.begin.ts.tsx)
  (#set! test.onlyIfFirst true))
((template_string "`" @punctuation.definition.string.end.ts.tsx)
  (#set! test.onlyIfLast true))

; Interpolations inside of template strings.
(template_substitution
  "${" @punctuation.definition.template-expression.begin.ts.tsx
  "}" @punctuation.definition.template-expression.end.ts.tsx
) @meta.embedded.line.interpolation.ts.tsx

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

["delete" "instanceof" "typeof" "keyof"] @keyword.operator._TYPE_.ts.tsx
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

["++" "--"] @keyword.operator.increment.ts.tsx

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

"{" @punctuation.definition.begin.bracket.curly.ts.tsx
"}" @punctuation.definition.end.bracket.curly.ts.tsx
"(" @punctuation.definition.begin.bracket.round.ts.tsx
")" @punctuation.definition.end.bracket.round.ts.tsx
"[" @punctuation.definition.begin.bracket.square.ts.tsx
"]" @punctuation.definition.end.bracket.square.ts.tsx

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
  (#set! test.final true)
  name: (identifier) @entity.name.tag.ts.tsx)

; The "bar" in `<Foo bar={true} />`.
(jsx_attribute
  (property_identifier) @entity.other.attribute-name.ts.tsx)

; All JSX expressions/interpolations within braces.
((jsx_expression) @meta.embedded.block.ts.tsx
  (#match? @meta.embedded.block.ts.tsx "\\n")
  (#set! test.final true))

(jsx_expression) @meta.embedded.line.ts.tsx

(jsx_self_closing_element
  "<" @punctuation.definition.tag.begin.ts.tsx
  (#set! test.final true))

((jsx_self_closing_element
  ; The "/>" in `<Foo />`, extended to cover both anonymous nodes at once.
  "/") @punctuation.definition.tag.end.ts.tsx
  (#set! adjust.startAt lastChild.previousSibling.startPosition)
  (#set! adjust.endAt lastChild.endPosition)
  (#set! test.final true))

; META
; ====

; The interiors of functions (useful for snippets and commands).
(method_definition
  body: (statement_block) @meta.block.function.ts
  (#set! test.final true))

(function_declaration
  body: (statement_block) @meta.block.function.ts
  (#set! test.final true))

(generator_function_declaration
  body: (statement_block) @meta.block.function.ts
  (#set! test.final true))

(function
  body: (statement_block) @meta.block.function.ts
  (#set! test.final true))

(generator_function
  body: (statement_block) @meta.block.function.ts
  (#set! test.final true))

; The interior of a class body (useful for snippets and commands).
(class_body) @meta.block.class.ts

; All other sorts of blocks.
(statement_block) @meta.block.ts

; The inside of a parameter definition list.
((formal_parameters) @meta.parameters.ts
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

; The inside of an object literal.
((object) @meta.object.ts
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

; MISC
; ====

; A label. Rare, but it can be used to prefix any statement and to control
; which loop is affected in `continue` or `break` statements. Svelte uses them
; for another purpose.
(statement_identifier) @entity.name.label.ts
