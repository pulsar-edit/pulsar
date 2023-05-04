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

((comment) @comment.line.double-slash.ts
  (#match? @comment.line.double-slash.ts "^//"))

((comment) @punctuation.definition.comment.ts
  (#match? @comment.line.double-slash.ts "^//")
  (#set! adjust.startAndEndAroundFirstMatchOf "^//"))

((comment) @comment.block.ts
  (#match? @comment.block.ts "^/\\*"))

((comment) @punctuation.definition.comment.begin.ts
  (#match? @punctuation.definition.comment.begin.ts "^/\\*")
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.ts
  (#match? @punctuation.definition.comment.end.ts "\\*/$")
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))


; PROPERTIES
; ==========

((property_identifier) @constant.other.property.ts
  (#match? @constant.other.property.ts "^[\$A-Z_]+$")
  (#set! test.final true))

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
  (#set! test.onlyIfDescendantOfType type_annotation))

((type_identifier) @storage.type.ts @support.type.ts
  (#set! test.onlyIfDescendantOfType type_arguments))

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
  object: (identifier) @support.other.object.ts)

; The "bar" in `foo.bar.baz`.
(member_expression
  object: (member_expression
    property: (property_identifier) @support.other.object.ts))


(property_signature
  (property_identifier) @entity.other.attribute-name.ts)

; FUNCTIONS
; =========

(method_definition
  name: (property_identifier) @entity.name.function.method.ts)

(call_expression
  function: (member_expression
    property: (property_identifier) @support.other.function.method.ts))

; Named function expressions:
; the "foo" in `let bar = function foo () {`
(function
  name: (identifier) @entity.name.function.definition.ts)

; Function definitions:
; the "foo" in `function foo () {`
(function_declaration
  name: (identifier) @entity.name.function.definition.ts)

; Named generator function expressions:
; the "foo" in `let bar = function* foo () {`
(generator_function
  name: (identifier) @entity.name.function.generator.definition.ts)

; Generator function definitions:
; the "foo" in `function* foo () {`
(generator_function_declaration
  name: (identifier) @entity.name.function.generator.definition.ts)

; Method definitions:
; the "foo" in `foo () {` (inside a class body)
(method_definition
  name: (property_identifier) @entity.name.function.method.definition.ts)

; Function property assignment:
; The "foo" in `thing.foo = (arg) => {}`
(assignment_expression
  left: (member_expression
    property: (property_identifier) @entity.name.function.definition.ts
    (#set! test.final true))
  right: [(arrow_function) (function)])

; Function variable assignment:
; The "foo" in `let foo = function () {`
(variable_declarator
  name: (identifier) @entity.name.function.definition.ts
  value: [(function) (arrow_function)])

; Function variable reassignment:
; The "foo" in `foo = function () {`
(assignment_expression
  left: (identifier) @function
  right: [(function) (arrow_function)])

; Object key-value pair function:
; The "foo" in `{ foo: function () {} }`
(pair
  key: (property_identifier) @entity.name.function.method.definition.ts
  value: [(function) (arrow_function)])

(function "function" @storage.type.function.ts)
(function_declaration "function" @storage.type.function.ts)

(generator_function "function" @storage.type.function.ts)
(generator_function_declaration "function" @storage.type.function.ts)

(generator_function "*" @storage.modifier.generator.ts)
(generator_function_declaration "*" @storage.modifier.generator.ts)
(method_definition "*" @storage.modifier.generator.ts)


; VARIABLES
; =========

(this) @variable.language.this.ts

(required_parameter
  pattern: (identifier) @variable.parameter.ts)

(required_parameter
  pattern: (object_pattern
    (shorthand_property_identifier_pattern) @variable.parameter.destructuring.ts)
    (#set! test.final true))

["var" "const" "let"] @storage.type._TYPE_.ts

; A simple variable declaration:
; The "foo" in `let foo = true`
(variable_declarator
  name: (identifier) @variable.other.assignment.ts)

; A reassignment of a variable declared earlier:
; The "foo" in `foo = true`
(assignment_expression
  left: (identifier) @variable.other.assignment.ts)

; The "foo" in `foo += 1`.
(augmented_assignment_expression
  left: (identifier) @variable.other.assignment.ts)

; The "foo" in `foo++`.
(update_expression
  argument: (identifier) @variable.other.assignment.ts)

; `object_pattern` appears to only be encountered in assignment expressions, so
; this won't match other uses of object/prop shorthand.
((object_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring.ts))

; A variable object destructuring with default value:
; The "foo" in `let { foo = true } = something`
(object_assignment_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring.ts)

; A variable object alias destructuring:
; The "bar" and "foo" in `let { bar: foo } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name.ts
    value: (identifier) @variable.other.assignment.destructuring.ts))

; A variable object alias destructuring with default value:
; The "bar" and "foo" in `let { bar: foo = true } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name.ts
    value: (assignment_pattern
      left: (identifier) @variable.other.assignment.destructuring.ts)))

; A variable array destructuring:
; The "foo" and "bar" in `let [foo, bar] = something`
(variable_declarator
  (array_pattern
    (identifier) @variable.other.assignment.destructuring.ts))

; A variable declaration in a for…(in|of) loop:
; The "foo" in `for (let foo of bar) {`
(for_in_statement
  left: (identifier) @variable.other.assignment.loop.ts)

; A variable array destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let [foo, bar] of baz)`
(for_in_statement
  left: (array_pattern
    (identifier) @variable.other.assignment.loop.ts))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let { foo, bar } of baz)`
(for_in_statement
  left: (object_pattern
    (shorthand_property_identifier_pattern) @variable.other.assignment.loop.ts))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" in `for (let { bar: foo } of baz)`
(for_in_statement
  left: (object_pattern
    (pair_pattern
      key: (_) @entity.other.attribute-name.ts
      value: (identifier) @variable.other.assignment.loop.ts)
      (#set! test.final true)))

; The "error" in `} catch (error) {`
(catch_clause
  parameter: (identifier) @variable.other.assignment.catch.ts)

; Single parameter of an arrow function:
; The "foo" in `(foo => …)`
(arrow_function parameter: (identifier) @variable.parameter.ts)


; NUMBERS
; =======

(number) @constant.numeric.ts

; STRINGS
; =======

((string "\"") @string.quoted.double.ts)
((string
  "\"" @punctuation.definition.string.begin.ts)
  (#set! test.onlyIfFirst true))

((string
  "\"" @punctuation.definition.string.end.ts)
  (#set! test.onlyIfLast true))

((string "'") @string.quoted.single.ts)
((string
  "'" @punctuation.definition.string.begin.ts)
  (#set! test.onlyIfFirst true))

((string
  "'" @punctuation.definition.string.end.ts)
  (#set! test.onlyIfLast true))

(template_string) @string.quoted.template.ts

((template_string "`" @punctuation.definition.string.begin.ts)
  (#set! test.onlyIfFirst true))
((template_string "`" @punctuation.definition.string.end.ts)
  (#set! test.onlyIfLast true))

; Interpolations inside of template strings.
(template_substitution
  "${" @punctuation.definition.template-expression.begin.ts
  "}" @punctuation.definition.template-expression.end.ts
) @meta.embedded.line.interpolation.ts

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

["++" "--"] @keyword.operator.increment.ts

[
  "&&"
  "||"
  "??"
] @keyword.operator.logical.ts

(union_type "|" @keyword.operator.type.union.ts)

"..." @keyword.operator.spread.ts
"." @keyword.operator.accessor.ts
"?." @keyword.operator.accessor.optional-chaining.ts

(ternary_expression
  ["?" ":"] @keyword.operator.ternary.ts
  (#set! test.final true))

; TODO: Ternary doesn't highlight properly; presumably fixed in
; https://github.com/tree-sitter/tree-sitter-typescript/pull/215, but needs
; update to v0.20.2.
((ternary_expression) @keyword.operator.ternary.ts
  (#set! adjust.startAndEndAroundFirstMatchOf "\\?"))

(public_field_definition "?" @keyword.operator.optional-type.ts)


; PUNCTUATION
; ===========

"{" @punctuation.definition.begin.bracket.curly.ts
"}" @punctuation.definition.end.bracket.curly.ts
"(" @punctuation.definition.begin.bracket.round.ts
")" @punctuation.definition.end.bracket.round.ts
"[" @punctuation.definition.begin.bracket.square.ts
"]" @punctuation.definition.end.bracket.square.ts

";" @punctuation.terminator.statement.ts
"," @punctuation.separator.comma.ts
":" @punctuation.separator.colon.ts
