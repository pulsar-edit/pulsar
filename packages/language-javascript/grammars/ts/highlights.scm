
; STRINGS
; =======

; Single-quoted.
(string "'") @string.quoted.single.js

(string
  "'" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst true))

(string
  "'" @punctuation.definition.string.end.js
  (#set! onlyIfLast true))

; Double-quoted.
(string "\"") @string.quoted.double.js

(string
  "\"" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst true))

(string
  "\"" @punctuation.definition.string.end.js
  (#set! onlyIfLast true))

; Template string (backticks).
(template_string) @string.quoted.template.js

(template_string
  "`" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst true))

(template_string
  "`" @punctuation.definition.string.end.js
  (#set! onlyIfLast true))

; Interpolations inside of template strings.
(template_substitution
  "${" @punctuation.definition.template-expression.begin.js
  "}" @punctuation.definition.template-expression.end.js
) @meta.embedded.interpolation.js

(string
  (escape_sequence) @constant.character.escape.js)

(template_string
  (escape_sequence) @constant.character.escape.js)


; NUMBERS
; =======

(number) @constant.numeric.js


; VARIABLES
; =========

["var" "const" "let"] @storage.type._TYPE_.js

(variable_declarator
  name: (identifier) @variable.other.assignment.js)

; A simple variable declaration:
; The "foo" in `let foo = true`
(assignment_expression
  left: (identifier) @variable.other.assignment.js)

; A reassignment of a variable declared earlier:
; The "foo" in `foo = true`
(assignment_expression
  left: (member_expression
    property: (property_identifier)) @variable.other.asssignment.property.js)

; A variable object destructuring:
; The "foo" in `let { foo } = something`

; `object_pattern` appears to only be encountered in assignment expressions, so
; this won't match other uses of object/prop shorthand.
((object_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring.js))

; A variable object destructuring with default value:
; The "foo" in `let { foo = true } = something`
(object_assignment_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring.js)

; A variable object alias destructuring:
; The "bar" and "foo" in `let { bar: foo } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name.js
    value: (identifier) @variable.other.assignment.destructuring.js))

; A variable object alias destructuring with default value:
; The "bar" and "foo" in `let { bar: foo = true } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name.js
    value: (assignment_pattern
      left: (identifier) @variable.other.assignment.destructuring.js)))

; A variable array destructuring:
; The "foo" and "bar" in `let [foo, bar] = something`
(variable_declarator
  (array_pattern
    (identifier) @variable.other.assignment.destructuring.js))

; A variable declaration in a for…(in|of) loop:
; The "foo" in `for (let foo of bar) {`
(for_in_statement
  left: (identifier) @variable.other.assignment.loop.js)

; A variable array destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let [foo, bar] of baz)`
(for_in_statement
  left: (array_pattern
    (identifier) @variable.other.assignment.loop.js))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let { foo, bar } of baz)`
(for_in_statement
  left: (object_pattern
    (shorthand_property_identifier_pattern) @variable.other.assignment.loop.js))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" in `for (let { bar: foo } of baz)`
(for_in_statement
  left: (object_pattern
    (pair_pattern
      key: (_) @entity.other.attribute-name.js
      value: (identifier) @variable.other.assignment.loop.js)
      (#set! final true)))

; Single parameter of an arrow function:
; The "foo" in `(foo => …)`
(arrow_function parameter: (identifier) @variable.parameter.js)


; PARAMETERS
; ----------

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
  ])

; The "foo" in `function (...foo) {`.
(formal_parameters
  (rest_pattern
    (identifier) @variable.parameter.js))

; The "foo" in `function (foo = false) {`.
(formal_parameters
  (assignment_pattern
    (identifier) @variable.parameter.js))


; FUNCTIONS
; =========

; Named function expressions:
; the "foo" in `let bar = function foo () {`
(function
  name: (identifier) @entity.name.function.definition.js)

; Function definitions:
; the "foo" in `function foo () {`
(function_declaration
  name: (identifier) @entity.name.function.definition.js)

; Named generator function expressions:
; the "foo" in `let bar = function* foo () {`
(generator_function
  name: (identifier) @entity.name.function.generator.definition.js)

; Generator function definitions:
; the "foo" in `function* foo () {`
(generator_function_declaration
  name: (identifier) @entity.name.function.generator.definition.js
)

; Method definitions:
; the "foo" in `foo () {` (inside a class body)
(method_definition
  name: (property_identifier) @entity.name.function.method.definition.js
)

; Function property assignment:
; The "foo" in `thing.foo = (arg) => {}`
(assignment_expression
  left: (member_expression
    property: (property_identifier) @entity.name.function.definition.js
    (#set! final true))
  right: [(arrow_function) (function)])

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
  value: [(function) (arrow_function)])

(function "function" @storage.type.function.js)
(function_declaration "function" @storage.type.function.js)

(generator_function "function" @storage.type.function.js)
(generator_function_declaration "function" @storage.type.function.js)

(generator_function "*" @storage.modifier.generator.js)
(generator_function_declaration "*" @storage.modifier.generator.js)


; FUNCTION CALLS
; ==============

; An invocation of any function.
(call_expression
  function: (identifier) @support.function.other.js)

; An invocation of any method.
(call_expression
  function: (member_expression
    property: (property_identifier) @support.function.other.method.js))


; OBJECTS
; =======

; The "foo" in `foo.bar`.
(member_expression
  object: (identifier) @support.object.other.js)

; The "bar" in `foo.bar.baz`.
(member_expression
  object: (member_expression
    property: (property_identifier) @support.object.other.js))

; The "foo" in `{ foo: true }`.
(pair
  key: (property_identifier) @entity.other.attribute-name.js)

; TODO: This is both a key and a value, so opinions may vary on how to treat it.
; The "foo" in `{ foo }`.
(object
  (shorthand_property_identifier) @entity.other.attribute-name.shorthand.js)


; CLASSES
; =======

; The "class" in `class Foo {`.
(class_declaration
  "class" @storage.type.class.js)

; The "Foo" in `class Foo {`.
(class_declaration
  name: (identifier) @entity.name.type.class.js)

; The "Bar" in `class Foo extends Bar {`.
(class_heritage
  "extends" @storage.modifier.extends.js
  (identifier) @entity.other.inherited-class.js)

; The interior of a class body (useful for snippets and commands).
(class_body) @meta.class.body

; The "Foo" in `new Foo()`.
(new_expression
  constructor: (_) @support.class.instance.js)

; A class getter:
; the "get" in `get foo () {...`
(method_definition
  "get" @storage.getter.js)

; A class setter:
; the "set" in `set foo (value) {...`
(method_definition
  "set" @storage.setter.js)


; IMPORTS/EXPORTS
; ===============

; The "Foo" in `import Foo from './bar'`
(import_clause
  (identifier) @variable.other.assignment.import.js)

; The "Foo" in `import { Foo } from './bar'`
(import_specifier
  (identifier) @variable.other.assignment.import.js)

; The "Foo" in `export { Foo }`
(export_specifier
  name: (identifier) @variable.other.assignment.export.js)

; The "default" in `export { Foo as default }`
(export_specifier
  alias: (identifier) @keyword.control.default.js
  (#eq? @keyword.control.default.js "default"))

; The "default" in `export default Foo`
(export_statement
  "default" @keyword.control.default.js)

; The "Foo" in `export Foo`
(export_statement
  (identifier) @variable.other.assignment.export.js)


; COMMENTS
; ========

; Line comments. `//`
((comment) @comment.line.double-slash.js
  (#match? @comment.line.double-slash.js "^\/\/"))

((comment) @punctuation.definition.comment.js
  (#match? @punctuation.definition.comment.js "^\/\/")
  (#set! startAndEndAroundFirstMatchOf "^\/\/"))

; Block comments. `/* */`
((comment) @comment.block.js
  (#match? @comment.block.js "^/\\*")
  (#match? @comment.block.js "\\*/$"))

((comment) @punctuation.definition.comment.begin.js
  (#match? @punctuation.definition.comment.begin.js "^/\\*")
  (#set! startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.js
  (#match? @punctuation.definition.comment.end.js "\\*/$")
  (#set! startAndEndAroundFirstMatchOf "\\*/$"))


; KEYWORDS
; ========

[
  "catch"
  "finally"
  "throw"
  "try"
] @keyword.control.trycatch._TYPE_.js

[
  "return"
  "yield"
  "continue"
  "break"
  "switch"
  "case"
  "default"
] @keyword.control.flow._TYPE_.js

[
  "import"
  "from"
  "export"
  "as"
] @keyword.control._TYPE_.js

[
  "delete"
  "typeof"
  "void"
] @keyword.operator.unary._TYPE_.js

[
  "if"
  "else"
] @keyword.control.conditional._TYPE_.js

"new" @keyword.operator.new.js

[
  "do"
  "for"
  "in"
  "of"
  "while"
] @keyword.control.loop._TYPE_.js

"with" @keyword.control.with.js @invalid.deprecated.with.js

["async" "static"] @storage.modifier._TYPE_.js
["await"] @keyword.control.await.js

[
  "debugger"
] @keyword.other._TYPE_.js

; BUILTINS
; ========

[
  (this)
  (super)
] @variable.language._TYPE_.js

((identifier) @support.builtin._TEXT_.js
  (#match? @support.builtin._TEXT_.js "^(arguments|module|console|window|document)$")
  (#is-not? local)
  (#set! final true))

((identifier) @support.function.builtin.js
  (#eq? @support.function.builtin.js "require")
  (#is-not? local)
  (#set! final true))

[
  (null)
  (undefined)
] @constant.language._TYPE_.js

[
  (true)
  (false)
] @constant.language.boolean._TYPE_.js

(arrow_function
  "=>" @punctuation.function.arrow.js)

; Things that `LOOK_LIKE_CONSTANTS`.
([(property_identifier) (identifier)] @constant.other.js
  (#match? @constant.other.js "^[A-Z_][A-Z0-9_]*$")
  (#set! shy true))

; TODO: What do we do with computed object keys?
;
; { [foo]: "bar" }
;
; If we scope the whole thing as `entity.other.attribute-name`, it arguably
; looks too similar to an ordinary object key. The Babel grammar scopes the
; `[foo]` as an object key, but the `foo` inside it as a variable. But we
; aren't scoping all identifiers as variables, so we don't have that option.
; (pair
;   key: (computed_property_name
;     ["[""]"] @entity.other.attribute-name.computed.js))


; REGEX
; =====

; NOTE: An injection grammar tokenizes the contents of regular
; expressions. Thus we're highlighting only sparingly here.

(regex) @string.regexp.js
(regex
  "/" @punctuation.definition.string.begin.js
  (#set! onlyIfFirst true))

(regex
  "/" @punctuation.definition.string.end.js
  (#set! onlyIfLast true))

(regex_flags) @keyword.other.js


; JSX
; ===

; The "Foo" in `<Foo />`.
(jsx_self_closing_element
  name: (identifier) @entity.name.tag.js
  ) @meta.tag.js.jsx

; The "Foo" in `<Foo>`.
(jsx_opening_element
  name: (identifier) @entity.name.tag.js)

; The "Foo" in `</Foo>`.
(jsx_closing_element
  "/" @punctuation.definition.tag.end.js
  (#set! final true)
  name: (identifier) @entity.name.tag.js)

; The "bar" in `<Foo bar={true} />`.
(jsx_attribute
  (property_identifier) @entity.other.attribute-name.js.jsx)

; All JSX expressions/interpolations within braces.
(jsx_expression) @meta.embedded.js.jsx

(jsx_opening_element
  "<" @punctuation.definition.tag.begin.js
  ">" @punctuation.definition.tag.end.js)

(jsx_closing_element
  "<" @punctuation.definition.tag.begin.js
  ">" @punctuation.definition.tag.end.js)

(jsx_self_closing_element
  "<" @punctuation.definition.tag.begin.js.jsx
  (#set! final true))

((jsx_self_closing_element
  ; The "/>" in `<Foo />`, extended to cover both anonymous nodes at once.
  "/") @punctuation.definition.tag.end.js
  (#set! startAt lastChild.previousSibling.startPosition)
  (#set! endAt lastChild.endPosition)
  (#set! final true))


; OPERATORS
; ==========

"=" @keyword.operator.assignment.js

["&" "|" "<<" ">>" ">>>" "~" "^"] @keyword.operator.bitwise.js

["&&" "||" "&&" "??" "!"] @keyword.operator.logical.js

"..." @keyword.operator.spread.js

["in" "instanceof"] @keyword.operator.expression._TYPE_.js

["==" "===" "!=" "!=="] @keyword.operator.comparison.js

["++" "--"] @keyword.operator.increment.js

(binary_expression
  [">" "<" ">=" "<="] @keyword.operator.relational.js)

(binary_expression
  ["/" "+" "-" "*" "**" "%"] @keyword.operator.arithmetic.js)

(unary_expression ["+" "-"] @keyword.operator.unary.js)

(ternary_expression ["?" ":"] @keyword.operator.ternary.js)

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

; Optional chaining is illegal…:

; …on the left-hand side of an assignment.
(assignment_expression
  left: (_) @_IGNORE_
    (#set! prohibitsOptionalChaining true))

; …within a `new` expression.
(new_expression
  constructor: (_) @_IGNORE_
    (#set! prohibitsOptionalChaining true))

((optional_chain) @invalid.illegal.optional-chain.js
  (#set! onlyIfDescendantOfNodeWithData prohibitsOptionalChaining))


; PUNCTUATION
; ===========

"{" @punctuation.definition.begin.brace.curly.js
"}" @punctuation.definition.end.brace.curly.js
"(" @punctuation.definition.begin.brace.round.js
")" @punctuation.definition.end.brace.round.js
"[" @punctuation.definition.begin.brace.square.js
"]" @punctuation.definition.end.brace.square.js

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

; ((sequence_expression
;   left: (identifier) @variable.parameter.js)
;   right: (arrow_function))
