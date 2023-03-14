
; STRINGS
; =======

; Single-quoted.

(string "'") @string.quoted.single.js

; There are two anonymous "'" nodes, one at the beginning and one at the end,
; but we want to scope them differently, and tree-sitter doesn't let you anchor
; queries for anonymous nodes. So we'll use `onlyIfFirst`/`onlyIfLast` and sort
; it out later on.
(string
  "'" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst "true")
)

(string
  "'" @punctuation.definition.string.end.js
  (#set! onlyIfLast "true")
)

; Double-quoted.

(string "\"" ) @string.quoted.double.js

(string
  "\"" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst true)
)
(string
  "\"" @punctuation.definition.string.end.js
  (#set! onlyIfLast true)
)

; Template string (backticks).

(template_string) @string.quoted.template.js

(template_string
  "`" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst true)
)

(template_string
  "`" @punctuation.definition.string.end.js
  (#set! onlyIfLast true)
)

; Interpolations inside of template strings.
(template_substitution
  "${" @punctuation.definition.template-expression.begin.js
  "}" @punctuation.definition.template-expression.end.js
) @meta.embedded.interpolation.js

; VARIABLES
; =========

[
  "var"
  "const"
  "let"
] @storage.type.TYPE.js

(variable_declarator
  name: (identifier) @variable.other.assignment.js
)

; A simple variable declaration:
; The "foo" in `let foo = true`
(assignment_expression
  left: (identifier) @variable.other.assignment.js
)

; A variable object destructuring:
; The "foo" in `let { foo } = something`

; `object_pattern` appears to only be encountered in assignment expressions, so
; this won't match other uses of object/prop shorthand.
((object_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring.js)
)

; A variable object destructuring:
; The "foo" and "bar" in `let [foo, bar] = something`
(variable_declarator
  (array_pattern
    (identifier) @variable.other.assignment.destructuring.js
  )
)

(for_in_statement
  left: (identifier) @variable.other.assignment.loop.js)

; Single parameter of an arrow function:
; The "foo" in `(foo => …)`
(arrow_function parameter: (identifier) @variable.parameter.js)

(formal_parameters
  [
    ; The "foo" in `function (foo) {`.
    (identifier) @variable.parameter.js
    ; The "foo" and "bar" in `function ([foo, bar]) {`.
    (array_pattern
      (identifier) @variable.parameter.destructuring.array.js)

    (object_pattern
      [
        ; The "foo" in `function ({ key: foo }) {`.
        (pair_pattern value: (identifier) @variable.parameter.destructuring.value.js)

        ; The "key" in `function ({ key: foo }) {`.
        (pair_pattern key: (property_identifier) @variable.parameter.destructuring.key.js)

        ; The "foo" in `function ({ foo }) {`.
        (shorthand_property_identifier_pattern) @variable.parameter.destructuring.shorthand.js
      ])
  ]
)

; The "foo" in `function (...foo) {`.
(formal_parameters
  (rest_pattern
    (identifier) @variable.parameter.js
  )
)

; The "foo" in `function (foo = false) {`.
(formal_parameters
  (assignment_pattern
    (identifier) @variable.parameter.js.z
  )
)

; FUNCTIONS
; =========

; Named function expressions;
; the "foo" in `let bar = function foo () {`
(function
  name: (identifier) @entity.name.function.definition.js
)

; Function definitions;
; the "foo" in `function foo () {`
(function_declaration
  name: (identifier) @entity.name.function.definition.js
)

; Named generator function expressions:
; the "foo" in `let bar = function* foo () {`
(generator_function
  name: (identifier) @entity.name.function.generator.definition.js
)

; Generator function definitions;
; the "foo" in `function* foo () {`
(generator_function_declaration
  name: (identifier) @entity.name.function.generator.definition.js
)

; Method definitions;
; the "foo" in `foo () {` (inside a class body)
(method_definition
  name: (property_identifier) @entity.name.function.method.definition.js
)

; Function property assignment:
; The "foo" in `thing.foo = (arg) => {}`
(assignment_expression
  left: (member_expression
    property: (property_identifier) @entity.name.function.definition.js
    (#set! final true)
  )
  right: [(arrow_function) (function)]
)

; Function variable assignment:
; The "foo" in `let foo = function () {`
(variable_declarator
  name: (identifier) @entity.name.function.definition.js
  value: [(function) (arrow_function)])

; Function variable reassignment:
; The "foo" in `foo = function () {`
(assignment_expression
  left: (identifier) @function
  right: [(function) (arrow_function)])

; Object key-value pair function:
; The "foo" in `{ foo: function () {} }`
(pair
  key: (property_identifier) @entity.name.function.method.definition.js
  value: [(function) (arrow_function)]
)

(function_declaration "function" @storage.type.function.js)
(function "function" @storage.type.function.js)

(generator_function_declaration "function" @storage.type.function.js)
(generator_function "function" @storage.type.function.js)

(generator_function "*" @storage.modifier.generator.js)
(generator_function_declaration "*" @storage.modifier.generator.js)


; An invocation of any function.
(call_expression
  function: (identifier) @support.function.other.js
)

; An invocation of any method.
(call_expression
  function: (member_expression
    property: (property_identifier) @support.function.other.method.js
  )
)

; OBJECTS
; =======

; The "foo" in `foo.bar`.
(member_expression
  object: (identifier) @support.object.js
)

; The "bar" in `foo.bar.baz`.
(member_expression
  object: (member_expression
    property: (property_identifier) @support.object.js
  )
)

; The "foo" in `{ foo: true }`.
(pair
  (property_identifier) @entity.other.attribute-name.js
)

; TODO: This is both a key and a value, so opinions may vary on how to treat it.
(object
  (shorthand_property_identifier) @entity.other.attribute-name.shorthand.js)


; CLASSES
; =======

(class_declaration
  "class" @storage.type.class.js
)

(class_body) @meta.class.body

; The "Bar" in `class Foo extends Bar {`.
(class_heritage
  "extends" @storage.modifier.js
  (identifier) @entity.other.inherited-class.js
)

(class_declaration
  name: (identifier) @entity.name.type.class.js
)

(new_expression
  constructor: (_) @support.class.instance.js
)

; A class getter:
; the "get" in `get foo () {...`
(method_definition
  "get" @storage.getter.js
)

; A class setter:
; the "set" in `set foo (value) {...`
(method_definition
  "set" @storage.setter.js
)

; IMPORTS/EXPORTS
; ===============

(import_clause
  (identifier) @variable.other.assignment.import.js
)

(import_specifier
  (identifier) @variable.other.assignment.import.js
)

(export_specifier
  name: (identifier) @variable.other.assignment.export.js
)

(export_specifier
  alias: (identifier) @keyword.control.default.js
  (#eq? @keyword.control.default.js "default")
)

(export_statement
  "default" @keyword.control.default.js
)
(export_statement
  (identifier) @variable.other.assignment.export.js
)


; COMMENTS
; ========

(
  (comment) @comment.line.double-slash.js
  (#match? @comment.line.double-slash.js "\/\/")
)

(
  (comment) @comment.block.js
  (#match? @comment.block.js "^/\\*")
  (#match? @comment.block.js "\\*/$")
)


; KEYWORDS
; ========

[
  "catch"
  "finally"
  "throw"
  "try"
] @keyword.control.trycatch.js

[
  "return"
  "yield"
  "continue"
  "break"
  "switch"
  "case"
  "default"
] @keyword.control.flow.TYPE.js

; TODO: "target"?

[
  "import"
  "from"
  "export"
  "as"
] @keyword.control.TYPE.js

[
  "delete"
  "typeof"
  "void"
] @keyword.operator.unary.TYPE.js

[
  "if"
  "else"
] @keyword.control.conditional.js

"new" @keyword.operator.new.js

[
  "do"
  "for"
  "in"
  "of"
  "while"
] @keyword.control.loop.js

"with" @keyword.control.with.js @invalid.deprecated.with.js

["async" "static"] @storage.modifier.TYPE.js
["await"] @keyword.control.await.js

[
  "debugger"
] @keyword.other.TYPE.js

[
  (this)
  (super)
] @variable.language.TYPE.js

; (this) @variable.language.this.js
; (super) @variable.language.super.js

(
  (identifier) @variable.builtin.TEXT.js
  (#match? @variable.builtin.TEXT.js "^(arguments|module|console|window|document)$")
  (#is-not? local)
  (#set! final true)
)

(
  (identifier) @support.function.builtin.js
  (#eq? @support.function.builtin.js "require")
  (#is-not? local)
  (#set! final true)
)

[
  (null)
  (undefined)
] @constant.language.TYPE.js

[
  (true)
  (false)
] @constant.language.boolean.TYPE.js

(arrow_function
  "=>" @punctuation.function.arrow.js
)

(member_expression
  object: (identifier) @variable.other.object.js
)

; (pair
;   key: (property_identifier) @constant.other.object.key.js
; )

(number) @constant.numeric.js

(
  [(property_identifier) (identifier)] @constant.js
  (#match? @constant.js "^[A-Z_][A-Z0-9_]*$")
)

; (pair_pattern
;   key: (_) @constant.other.object.key.js
; )
;
(object_pattern
  (pair_pattern
    key: (_) @entity.other.attribute-name.js
    value: (identifier) @variable.other.js))

;
; (arrow_function
;   parameter: (identifier) @variable.parameter.js
; )

; REGEX
; =====

; NOTE: An injection grammar should be used to tokenize the contents of regular
; expressions.
(regex) @string.regexp.js
(regex
  "/" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst true)
)
(regex
  "/" @punctuation.definition.string.end.js
  (#set! onlyIfLast true)
)

(regex_flags) @keyword.other.js


; JSX
; ===

(jsx_self_closing_element
  name: (identifier) @entity.name.tag.js
) @meta.tag.js.jsx

(jsx_attribute
  (property_identifier) @entity.other.attribute-name.js
)

(jsx_expression) @meta.embedded

(jsx_self_closing_element
  "<" @punctuation.definition.tag.begin.js
  (#set! final "true")
)

(jsx_self_closing_element
  "/" @punctuation.definition.tag.end.js
  (#set! final "true")
  ">" @punctuation.definition.tag.end.js
  (#set! final "true")
)

(jsx_opening_element
  name: (identifier) @entity.name.tag.js
)

(jsx_closing_element
  "/" @punctuation.definition.tag.end.js
  (#set! final "true")
  name: (identifier) @entity.name.tag.js
)

; OPERATORS
; ==========

"=" @keyword.operator.assignment.js

["&" "|" "<<" ">>" ">>>" "~" "^"]

[
  "&&"
  "||"
  "&&"
  "??"
  "!"
] @keyword.operator.logical.js

"..." @keyword.operator.spread.js

[
  "in"
  "instanceof"
] @keyword.operator.expression.TYPE.js

[
  "=="
  "==="
  "!="
  "!=="
] @keyword.operator.comparison.js

[
  "++"
  "--"
] @keyword.operator.increment.js

[
  ">"
  "<"
  ">="
  "<="
] @keyword.operator.relational.js

(binary_expression
  ["/" "+" "-" "*" "**" "%"] @keyword.operator.arithmetic.js
)

(unary_expression ["+" "-"] @keyword.operator.unary.js)


[
  "&&="
  "||="
  "??="
  "+="
  "-="
  "*="
  "**="
  "/="
  "%="
  "^="
  "&="
  "|="
  "<<="
  ">>="
  ">>>="
] @keyword.operator.assignment.compound.js

; TODO: There might be debate over whether `.` is treated as punctuation or as
; an operator. But the addition of `?.` to the language makes me feel like both
; should be treated as operators just for the benefit of syntax highlighting.

"." @keyword.operator.accessor.js

; The optional chaining accessor is listed in the bundled `highlights.scm` as
; an anonymous node, but it appears not to be implemented that way, so we can't
; use "?." to target it.
(optional_chain) @keyword.operator.accessor.optional-chaining.js


; PUNCTUATION
; ===========

"{" @punctuation.brace.curly.begin.js
"}" @punctuation.brace.curly.end.js
"(" @punctuation.brace.round.begin.js
")" @punctuation.brace.round.end.js
"[" @punctuation.brace.square.begin.js
"]" @punctuation.brace.square.end.js

";" @punctuation.terminator.statement.js
"," @punctuation.separator.comma.js
":" @punctuation.separator.colon.js


; MISC
; ====
;
; Inside of the parameters of an arrow function, the highlighting of parameters
; can change while the user is typing. For instance, if the user is adding a
; default value to a parameter, the parse tree will go into an error state
; until there are tokens on either side of `=`.
;
; We're trying to catch and minimize that here. This expression catches and
; highlights any parameters preceding the invalid one, but sadly can't reach
; the invalid parameter itself.
;
; This doesn't happen inside functions defined with the `function` annotation,
; probably because the parsing there is much more straightforward.
(
  (sequence_expression
    (identifier) @variable.parameter.js
  )
  (#set! onlyIfAncestorOfType ERROR)
)
