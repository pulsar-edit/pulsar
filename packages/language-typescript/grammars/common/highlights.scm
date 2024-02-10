; IMPORTS/EXPORTS
; ===============

; The "Foo" in `import Foo from './bar'`
(import_clause
  (identifier) @variable.other.assignment.import._LANG_)

; The "Foo" in `import { Foo } from './bar'`
(import_specifier
  (identifier) @variable.other.assignment.import._LANG_)

; The "*" in `import * as Foo from './bar'`
(import_clause
  (namespace_import "*" @variable.other.assignment.import.all._LANG_))

; The "foo" in `import * as foo from './bar'`
(namespace_import
  (identifier) @variable.other.assignment.import.namespace._LANG_)

; The "Foo" in `export { Foo }`
(export_specifier
  name: (identifier) @variable.other.assignment.export._LANG_)

; The "default" in `export { Foo as default }`
(export_specifier
  alias: (identifier) @keyword.control.default._LANG_
  (#eq? @keyword.control.default._LANG_ "default"))

; The "default" in `export default Foo`
(export_statement
  "default" @keyword.control.default._LANG_)

; The "Foo" in `export Foo`
(export_statement
  (identifier) @variable.other.assignment.export._LANG_)


; VARIABLES
; =========

(this) @variable.language.this._LANG_
(super) @variable.language.super._LANG_._LANG_x

(required_parameter
  pattern: (identifier) @variable.parameter.with-default._LANG_
  value: (_)
  (#set! capture.final true))

(required_parameter
  pattern: (identifier) @variable.parameter._LANG_)

(required_parameter
  pattern: (rest_pattern
    (identifier) @variable.parameter.rest._LANG_))

(required_parameter
  pattern: (object_pattern
    (shorthand_property_identifier_pattern) @variable.parameter.destructuring._LANG_)
    (#set! capture.final true))

(required_parameter
  pattern: (object_pattern
    (object_assignment_pattern
      (shorthand_property_identifier_pattern) @variable.parameter.destructuring.with-default._LANG_))
    (#set! capture.final true))

(optional_parameter
  pattern: (identifier) @variable.parameter.optional._LANG_)

(optional_parameter "?" @keyword.operator.type.optional._LANG_)

(type_predicate
  name: (identifier) @variable.other.type._LANG_
  "is" @keyword.operator.type.is._LANG_)

; Assertion functions: the `asserts` in
; `function checkFoo(obj: unknown): asserts obj is foo`
(asserts "asserts" @keyword.type.asserts._LANG_)
(asserts (identifier) @variable.other.type._LANG_)

; A simple variable declaration:
; The "foo" in `let foo = true`
(variable_declarator
  name: (identifier) @variable.other.assignment._LANG_)

; A reassignment of a variable declared earlier:
; The "foo" in `foo = true`
(assignment_expression
  left: (identifier) @variable.other.assignment._LANG_)

; The "bar" in `foo.bar = true`
(assignment_expression
  left: (member_expression
    property: (property_identifier) @variable.other.assignment.property._LANG_))

; The "foo" in `foo += 1`.
(augmented_assignment_expression
  left: (identifier) @variable.other.assignment._LANG_)

; The "foo" in `foo++`.
(update_expression
  argument: (identifier) @variable.other.assignment._LANG_)

; `object_pattern` appears to only be encountered in assignment expressions, so
; this won't match other uses of object/prop shorthand.
((object_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring._LANG_))

; A variable object destructuring with default value:
; The "foo" in `let { foo = true } = something`
(object_assignment_pattern
  (shorthand_property_identifier_pattern) @variable.other.assignment.destructuring._LANG_)

; A variable object alias destructuring:
; The "bar" and "foo" in `let { bar: foo } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name._LANG_
    value: (identifier) @variable.other.assignment.destructuring._LANG_)
    (#set! capture.final true))

; A complex object alias destructuring:
; The "bar" in `let { bar: { foo: troz } } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name._LANG_)
    (#set! capture.final true))

; A variable object alias destructuring with default value:
; The "bar" and "foo" in `let { bar: foo = true } = something`
(object_pattern
  (pair_pattern
    ; TODO: This arguably isn't an object key.
    key: (_) @entity.other.attribute-name._LANG_
    value: (assignment_pattern
      left: (identifier) @variable.other.assignment.destructuring._LANG_)))

; An array-destructured assignment or reassignment, regardless of depth:
; The "foo" in `[foo] = bar;` and `[[foo]] = bar;`.
(array_pattern
  (identifier) @variable.other.assignment.destructuring._LANG_)

; An array-destructured assignment or reassignment with a default, regardless of depth:
; The "baz" in `let [foo, bar, baz = false] = something;` and `let [[baz = 5]] = something`;
(array_pattern
  (assignment_pattern
    (identifier) @variable.other.assignment.destructuring._LANG_))

; A variable declaration in a for…(in|of) loop:
; The "foo" in `for (let foo of bar) {`
(for_in_statement
  left: (identifier) @variable.other.assignment.loop._LANG_)

; A variable array destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let [foo, bar] of baz)`
(for_in_statement
  left: (array_pattern
    (identifier) @variable.other.assignment.loop._LANG_))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" and "bar" in `for (let { foo, bar } of baz)`
(for_in_statement
  left: (object_pattern
    (shorthand_property_identifier_pattern) @variable.other.assignment.loop._LANG_))

; A variable object destructuring in a for…(in|of) loop:
; The "foo" in `for (let { bar: foo } of baz)`
(for_in_statement
  left: (object_pattern
    (pair_pattern
      key: (_) @entity.other.attribute-name._LANG_
      value: (identifier) @variable.other.assignment.loop._LANG_)
      (#set! capture.final true)))

; The "error" in `} catch (error) {`
(catch_clause
  parameter: (identifier) @variable.other.assignment.catch._LANG_)

; Single parameter of an arrow function:
; The "foo" in `(foo => …)`
(arrow_function parameter: (identifier) @variable.parameter._LANG_)

; `infer` keywords inside `extends` clauses function as a sort of type
; parameter, so we'll try highlighting them that way.
;
; TODO: We may or may not want `capture.final` here.
(infer_type (type_identifier) @variable.parameter.type._LANG_
  (#set! capture.final true))

; COMMENTS
; ========

((comment) @comment.line.double-slash._LANG_
  (#match? @comment.line.double-slash._LANG_ "^//"))

((comment) @punctuation.definition.comment._LANG_
  (#match? @punctuation.definition.comment._LANG_ "^//")
  (#set! adjust.startAndEndAroundFirstMatchOf "^//"))

((comment) @comment.block.documentation._LANG_
  (#match? @comment.block.documentation._LANG_ "^/\\*\\*")
  (#set! capture.final true)
  (#set! highlight.invalidateOnChange true))

; Block comments. `/* */`
((comment) @comment.block._LANG_
  (#match? @comment.block._LANG_ "^/\\*")
  (#match? @comment.block._LANG_ "\\*/$")
  (#set! highlight.invalidateOnChange true))

; ((comment) @comment.block._LANG_
;   (#match? @comment.block._LANG_ "^/\\*"))

((comment) @punctuation.definition.comment.begin._LANG_
  (#match? @punctuation.definition.comment.begin._LANG_ "^/\\*")
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end._LANG_
  (#match? @punctuation.definition.comment.end._LANG_ "\\*/$")
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))


; PROPERTIES
; ==========

((property_identifier) @constant.other.property._LANG_
  (#match? @constant.other.property._LANG_ "^[\$A-Z_]+$")
  (#set! capture.final true))

; (property_identifier) @variable.other.object.property._LANG_

((shorthand_property_identifier) @constant.other._LANG_
  (#match? @constant.other._LANG_ "^[\$A-Z_]{2,}$"))

; CLASSES
; =======

(class_declaration
  name: (type_identifier) @entity.name.type.class._LANG_
  (#set! capture.final true))

(extends_clause
  value: (_) @entity.other.inherited-class._LANG_)

(public_field_definition
  name: (property_identifier) @variable.declaration.field._LANG_)

(public_field_definition
  name: (private_property_identifier) @variable.declaration.field.private._LANG_)

(new_expression
  constructor: (identifier) @support.type.class._LANG_)

; A class getter:
; the "get" in `get foo () {...`
(method_definition
  "get" @storage.getter._LANG_)

; A class setter:
; the "set" in `set foo (value) {...`
(method_definition
  "set" @storage.setter._LANG_)


; NAMESPACES
; ==========

(internal_module
  name: (identifier) @entity.name.type.namespace._LANG_)

; The "Bar" of `namespace Foo.Bar` and `namespace Foo.Baz.Bar`.
(internal_module
  name: (nested_identifier
    (identifier) @entity.name.type.namespace._LANG_ .)
    (#set! isLastNamespaceSegment true))

; The "Foo" and "Baz" of `namespace Foo.Bar` and `namespace Foo.Baz.Bar`.
(nested_identifier (identifier) @support.type.namespace._LANG_
  (#is? test.descendantOfType "internal_module")
  (#is-not? test.rangeWithData isLastNamespaceSegment))

; DECLARATIONS
; ============

(function_signature
  name: (identifier) @entity.name.function.signature._LANG_)


; INTERFACES
; ==========

(interface_declaration
  name: (_) @entity.name.type.interface._LANG_
  (#set! capture.final))

; ENUMS
; =====

; The "Foo" in `enum Foo {`
(enum_declaration
  name: (_) @entity.name.type.enum._LANG_
  (#set! capture.final))

; The "foo" and "bar" in `enum Baz { foo, bar }`
(enum_body
  name: (property_identifier) @variable.declaration.enum._LANG_)

; The "foo" in `enum Bar { foo = 1 }`
(enum_assignment
  name: (property_identifier) @variable.declaration.enum._LANG_)

; TYPES
; =====

; These go under `storage.type`/`storage.modifier` because they’re core
; language constructs.
["var" "let" "const" "class" "function"] @storage.type._TYPE_._LANG_
["extends" "static" "async" "infer"] @storage.modifier._TYPE_._LANG_

(type_arguments "<" @punctuation.definition.parameters.begin.bracket.angle._LANG_
  (#set! capture.final))
(type_arguments ">" @punctuation.definition.parameters.end.bracket.angle._LANG_
  (#set! capture.final))

(type_parameters "<" @punctuation.definition.parameters.begin.bracket.angle._LANG_
  (#set! capture.final))
(type_parameters ">" @punctuation.definition.parameters.end.bracket.angle._LANG_
  (#set! capture.final))

"=>" @storage.type.arrow._LANG_

; TODO: If I allow scopes like `storage.type.string._LANG_`, I will make a lot of
; text look like strings by accident. This really needs to be fixed in syntax
; themes.
;
; NOTE: To settle the long debate (in my head) about whether value types are
; `support.type` or `storage.type`, I’ve adopted the same compromised used
; by legacy Tree-sitter: value types are filed under `support.storage.type`.

; These appear to be the primitives like `number`, `string`, `boolean`, `void`,
; et cetera. `null` and `undefined` get their own nodes.
(predefined_type _ @support.storage.type.predefined._LANG_)

(type_alias_declaration
  name: (type_identifier) @variable.declaration.type._LANG_)

((literal_type [(null) (undefined)]) @support.storage.type._TEXT_._LANG_
  (#set! capture.final))

; TODO: Decide whether other literal types — strings, booleans, and whatnot —
; should be highlighted as they are in JS, or should be highlighted like other
; types in annotations.

; These are `storage.type` because they are core language constructs rather
; than value types.
[
  "namespace"
  "enum"
  "interface"
  "module"
  "declare"
] @storage.type._TYPE_._LANG_
"type" @storage.type._LANG_

; These are `storage.modifier` becase they act as adjectives and verbs for
; language constructs.
[
  "implements"
  "public"
  "private"
  "protected"
  "readonly"
  "satisfies"
] @storage.modifier._TYPE_._LANG_

(index_signature
  name: (identifier) @entity.other.attribute-name.type._LANG_)

; The utility types documented at
; https://www.typescriptlang.org/docs/handbook/utility-types.html.
(generic_type
  (type_identifier) @support.storage.type.builtin.utility._LANG_
  (#match? @support.storage.type.builtin.utility._LANG_ "^(Awaited|Partial|Required|Readonly|Record|Pick|Omit|Exclude|Extract|NonNullable|(?:Constructor)?Parameters|(?:Return|Instance|(?:Omit)?ThisParameter|This)Type|(?:Upper|Lower)case|Capitalize|Uncapitalize)$")
  (#set! capture.final))

; All core language builtin types.
((type_identifier) @support.storage.type.builtin._LANG_
(#match? @support.storage.type.builtin._LANG_ "^(AggregateError|Array|ArrayBuffer|BigInt|BigInt64Array|BigUint64Array|DataView|Date|Error|EvalError|FinalizationRegistry|Float32Array|Float64Array|Function|ImageCapture|Int8Array|Int16Array|Int32Array|Map|Object|Promise|Proxy|RangeError|ReferenceError|RegExp|Set|Symbol|SyntaxError|TypeError|Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|URIError|URL|WeakMap|WeakRef|WeakSet|XMLHttpRequest)$")
  (#set! capture.final))

; TODO: We could add a special scope name to the entire suite of DOM types, but
; I don't have the strength for that right now.

;
((type_identifier) @support.storage.other.type._LANG_
  )

; SUPPORT
; =======

; Array methods.
(member_expression
  object: (identifier) @support.object.builtin._LANG_
    (#eq? @support.object.builtin._LANG_ "Array")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(from|isArray|of)$")
    (#set! capture.final true))

; Date methods.
(member_expression
  object: (identifier) @support.object.builtin._LANG_
    (#eq? @support.object.builtin._LANG_ "Date")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(now|parse|UTC)$")
    (#set! capture.final true))

; JSON methods.
(member_expression
  object: (identifier) @support.object.builtin._LANG_
    (#eq? @support.object.builtin._LANG_ "JSON")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(parse|stringify)$")
    (#set! capture.final true))

; Math methods.
(member_expression
  object: (identifier) @support.object.builtin._LANG_
    (#eq? @support.object.builtin._LANG_ "Math")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(abs|acos|acosh|asin|asinh|atan|atanh|atan2|cbrt|ceil|clz32|cos|cosh|exp|expm1|floor|fround|hypot|imul|log|log1p|log10|log2|max|min|pow|random|round|sign|sin|sinh|sqrt|tan|tanh|trunc)$")
    (#set! capture.final true))

; Object methods.
(member_expression
  object: (identifier) @support.object.builtin._LANG_
    (#eq? @support.object.builtin._LANG_ "Object")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(assign|create|defineProperty|defineProperties|entries|freeze|fromEntries|getOwnPropertyDescriptor|getOwnPropertyDescriptors|getOwnPropertyNames|getOwnPropertySymbols|getPrototypeOf|is|isExtensible|isFrozen|isSealed|keys|preventExtensions|seal|setPrototypeOf|values)$")
    (#set! capture.final true))

; Reflect methods.
(member_expression
  object: (identifier) @support.object.builtin._LANG_
    (#eq? @support.object.builtin._LANG_ "Reflect")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(apply|construct|defineProperty|deleteProperty|get|getOwnPropertyDescriptor|getPrototypeOf|has|isExtensible|ownKeys|preventExtensions|set|setPrototypeOf)$")
    (#set! capture.final true))

; Intl.X instantiations.
(new_expression
  constructor: (member_expression
    object: (identifier) @support.object.builtin._LANG_
      (#eq? @support.object.builtin._LANG_ "Intl")
    property: (property_identifier) @support.class.builtin._LANG_
      (#match? @support.class.builtin._LANG_ "^(Collator|DateTimeFormat|DisplayNames|ListFormat|Locale|NumberFormat|PluralRules|Segmenter)$"))
      (#set! capture.final true))

; Built-in class instantiations.
(new_expression
  constructor: (identifier) @support.class.builtin.instance._LANG_
    (#match? @support.class.builtin.instance._LANG_ "^(AggregateError|Array|ArrayBuffer|BigInt64Array|BigUint64Array|Boolean|DataView|Date|Error|EvalError|FinalizationRegistry|Float32Array|Float64Array|Function|ImageCapture|Int8Array|Int16Array|Int32Array|Map|Number|Object|Promise|RangeError|ReferenceError|RegExp|Set|String|SyntaxError|TypeError|Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|URIError|URL|WeakMap|WeakRef|WeakSet|XMLHttpRequest)$")
    (#set! capture.final true))

; Built-in constructors that can be invoked without `new`.
(call_expression
  (identifier) @support.function.builtin._LANG_
  (#match? @support.function.builtin._LANG_ "^(AggregateError|Array|ArrayBuffer|Boolean|BigInt|Error|EvalError|Function|Number|Object|Proxy|RangeError|String|Symbol|SyntaxError|URIError)$")
  (#set! capture.final true))

; Built-in functions.
(call_expression
  (identifier) @support.function.builtin._LANG_
  (#match? @support.function.builtin._LANG_ "^(decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|isNaN|parseFloat|parseInt)$")
  (#set! capture.final true))

; Built-in `console` functions.

(member_expression
  object: (identifier) @support.class.builtin.console._LANG_
    (#eq? @support.class.builtin.console._LANG_ "console")
  property: (property_identifier) @support.function.builtin.console._LANG_
    (#match? @support.function.builtin.console._LANG_ "^(assert|clear|count(Reset)?|debug|dir(xml)?|error|group(End)?info|log|profile(End)?|table|time(End|Log|Stamp)?|trace|warn)$")
    (#set! capture.final true))

; Static methods of `Promise`.
(member_expression
  object: (identifier) @support.class.builtin._LANG_
    (#eq? @support.class.builtin._LANG_ "Promise")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(all|allSettled|any|race|resolve|reject)$")
    (#set! capture.final true))

; All “well-known” symbols (as they are referred to in the spec).
(member_expression
  object: (identifier) @support.class.builtin._LANG_
  property: (property_identifier) @support.property.builtin._LANG_
  (#eq? @support.class.builtin._LANG_ "Symbol")
  (#match? @support.property.builtin._LANG_ "^(asyncIterator|hasInstance|isConcatSpreadable|iterator|match|matchAll|replace|search|split|species|toPrimitive|toStringTag|unscopables)$")
  (#set! capture.final true))

; Static methods of `Symbol`.
(member_expression
  object: (identifier) @support.class.builtin._LANG_
    (#eq? @support.class.builtin._LANG_ "Symbol")
  property: (property_identifier) @support.function.builtin._LANG_
    (#match? @support.function.builtin._LANG_ "^(for|keyFor)$")
    (#set! capture.final true))

; Other built-in objects.
((identifier) @support.class.builtin._LANG_
  (#match? @support.class.builtin._LANG_ "^(Symbol)$")
  (#set! capture.final true))

; Deprecated built-in functions.
(call_expression
  (identifier) @invalid.deprecated.function._LANG_
  (#match? @invalid.deprecated.function._LANG_ "^(escape|unescape)$")
  (#set! capture.final true))

; Built-in DOM classes.
((identifier) @support.class.builtin._LANG_
  (#match? @support.class.builtin._LANG_ "^(Document|Element|HTMLElement|HTMLDocument|HTML(Select|BR|HR|LI|Div|Map|Mod|Pre|Area|Base|Body|Data|Font|Form|Head|Html|Link|Menu|Meta|Slot|Span|Time|Audio|DList|Embed|Image|Input|Label|Media|Meter|OList|Param|Quote|Style|Table|Title|Track|UList|Video|Anchor|Button|Canvas|Dialog|IFrame|Legend|Object|Option|Output|Script|Source|Content|Details|Heading|Marquee|Picture|Unknown|DataList|FieldSet|FrameSet|MenuItem|OptGroup|Progress|TableCol|TableRow|Template|TextArea|Paragraph|TableCell|Options|TableCaption|TableSection|FormControls))$")
  (#set! capture.final true))

; Deprecated built-in DOM classes.
((identifier) @invalid.deprecated.class._LANG_
  (#match? @invalid.deprecated.class._LANG_ "^(HTMLShadowElement)$")
  (#set! capture.final true))

; Built-in DOM methods on `document`.
(call_expression
  function: (member_expression
    object: (identifier) @support.object.builtin._LANG_
    (#eq? @support.object.builtin._LANG_ "document")
    property: (property_identifier) @support.function.method.builtin._LANG_
    (#match? @support.function.method.builtin._LANG_ "^(adoptNode|append|caretPositionFromPoint|caretRangeFromPoint|createAttribute(?:NS)?|createCDATASection|createComment|createDocumentFragment|createElement(?:NS)?|createEvent|createNodeIterator|createProcessingInstruction|createRange|createTextNode|createTreeWalker|elementFromPoint|elementsFromPoint|exitFullscreen|exitPictureInPicture|exitPointerLock|getAnimations|getElementById|getElementsByClassName|getElementsByTagName(?:NS)?|getSelection|hasStorageAccess|importNode|prepend|querySelector|querySelectorAll|releaseCapture|replaceChildren|requestStorageAccess|createExpression|createNSResolver|evaluate|getElementsByName|hasFocus|write|writeln|open|close)$")
    (#set! capture.final true)))

; Built-in DOM methods on nodes. These will show up as builtins on _any_ class, but
; they're distinctive enough that we're OK with that possibility.
(call_expression
  function: (member_expression
    property: (property_identifier) @support.function.method.builtin._LANG_
    (#match? @support.function.method.builtin._LANG_ "^(addEventListener|appendChild|cloneNode|compareDocumentPosition|contains|getElementsByClassName|getElementsByTagName(?:NS)?|getRootNode|hasChildNodes|insertBefore|isDefaultNamespace|isEqualNode|isSameNode|lookupPrefix|lookupNamespaceURI|normalize|querySelector|querySelectorAll|removeChild|replaceChild|removeEventListener)$")
    (#set! capture.final true)))

; BUILTINS
; ========

((identifier) @support.object.builtin._TEXT_._LANG_
  (#match? @support.object.builtin._TEXT_._LANG_ "^(arguments|module|window|document)$")
  (#is-not? local)
  (#set! capture.final true))

((identifier) @support.object.builtin.filename._LANG_
  (#eq? @support.object.builtin.filename._LANG_ "__filename")
  (#is-not? local)
  (#set! capture.final true))

((identifier) @support.object.builtin.dirname._LANG_
  (#eq? @support.object.builtin.dirname._LANG_ "__dirname")
  (#is-not? local)
  (#set! capture.final true))

((identifier) @support.function.builtin.require._LANG_
  (#eq? @support.function.builtin.require._LANG_ "require")
  (#is-not? local)
  (#set! capture.final true))

((identifier) @constant.language.infinity._LANG_
  (#eq? @constant.language.infinity._LANG_ "Infinity")
  (#set! capture.final true))


; OBJECTS
; =======

; The "foo" in `{ foo: true }`.
(pair
  key: (property_identifier) @entity.other.attribute-name._LANG_)

; TODO: This is both a key and a value, so opinions may vary on how to treat it.
(object
  (shorthand_property_identifier) @entity.other.attribute-name.shorthand._LANG_)

; The "FOO" in `FOO.bar` should be scoped as a constant.
(member_expression
  object: (identifier) @constant.other.object._LANG_
  (#match? @constant.other.object._LANG_ "^[_A-Z]+$")
  (#set! capture.final true))


; The "foo" in `foo.bar`.
(member_expression
  object: (identifier) @support.other.object._LANG_)

; The "bar" in `foo.bar`, `foo.bar.baz`, and `foo.bar[baz]`.
(member_expression
  property: (property_identifier) @support.other.property._LANG_)

; ; The "bar" in `foo.bar.baz`.
; (member_expression
;   object: (member_expression
;     property: (property_identifier) @support.other.object._LANG_)
;     (#set! capture.final))

(method_signature
  (property_identifier) @entity.other.attribute-name.method._LANG_)

(property_signature
  (property_identifier) @entity.other.attribute-name._LANG_)


; FUNCTIONS
; =========

(call_expression
  function: (member_expression
    property: (property_identifier) @support.other.function.method._LANG_))

; Named function expressions:
; the "foo" in `let bar = function foo () {`
(function
  name: (identifier) @entity.name.function.definition._LANG_)

; Function definitions:
; the "foo" in `function foo () {`
(function_declaration
  name: (identifier) @entity.name.function.definition._LANG_)

; Named generator function expressions:
; the "foo" in `let bar = function* foo () {`
(generator_function
  name: (identifier) @entity.name.function.generator.definition._LANG_)

; Generator function definitions:
; the "foo" in `function* foo () {`
(generator_function_declaration
  name: (identifier) @entity.name.function.generator.definition._LANG_)

; Method definitions:
; the "foo" in `foo () {` (inside a class body)
(method_definition
  name: (property_identifier) @entity.name.function.method.definition._LANG_)

; Private field method definitions:
; the "#foo" in `#foo () {` (inside a class body)
(method_definition
  name: (private_property_identifier) @entity.name.function.method.private.definition._LANG_)

; Function property assignment:
; The "foo" in `thing.foo = (arg) => {}`
(assignment_expression
  left: (member_expression
    property: (property_identifier) @entity.name.function.definition._LANG_
    (#set! capture.final true))
  right: [(arrow_function) (function)])

; Function variable assignment:
; The "foo" in `let foo = function () {`
(variable_declarator
  name: (identifier) @entity.name.function.definition._LANG_
  value: [(function) (arrow_function)])

; Function variable reassignment:
; The "foo" in `foo = function () {`
(assignment_expression
  left: (identifier) @function
  right: [(function) (arrow_function)])

; Object key-value pair function:
; The "foo" in `{ foo: function () {} }`
(pair
  key: (property_identifier) @entity.name.function.method.definition._LANG_
  value: [(function) (arrow_function)])

; Function is `storage.type` because it's a core language construct.
(function "function" @storage.type.function._LANG_)
(function_declaration "function" @storage.type.function._LANG_)

(generator_function "function" @storage.type.function._LANG_)
(generator_function_declaration "function" @storage.type.function._LANG_)

; The `*` sigil acts as a modifier on a core language construct, hence
; `storage.modifier`.
(generator_function "*" @storage.modifier.generator._LANG_)
(generator_function_declaration "*" @storage.modifier.generator._LANG_)
(method_definition "*" @storage.modifier.generator._LANG_)

(asserts "asserts" @keyword.control.type.asserts._LANG_)

; An invocation of any function.
(call_expression
  function: (identifier) @support.other.function._LANG_
  (#set! capture.shy true))

; Things that `LOOK_LIKE_CONSTANTS`.
([(property_identifier) (identifier)] @constant.other._LANG_
  (#match? @constant.other._LANG_ "^[A-Z_][A-Z0-9_]*$")
  (#set! capture.shy true))


; NUMBERS
; =======

(number) @constant.numeric._LANG_

; STRINGS
; =======

((string "\"") @string.quoted.double._LANG_)
((string
  "\"" @punctuation.definition.string.begin._LANG_)
  (#is? test.first true))

((string
  "\"" @punctuation.definition.string.end._LANG_)
  (#is? test.last true))

((string "'") @string.quoted.single._LANG_)
((string
  "'" @punctuation.definition.string.begin._LANG_)
  (#is? test.first true))

((string
  "'" @punctuation.definition.string.end._LANG_)
  (#is? test.last true))

(template_string) @string.quoted.template._LANG_

((template_string "`" @punctuation.definition.string.begin._LANG_)
  (#is? test.first true))
((template_string "`" @punctuation.definition.string.end._LANG_)
  (#is? test.last true))

; Interpolations inside of template strings.
(template_substitution
  "${" @punctuation.definition.template-expression.begin._LANG_
  "}" @punctuation.definition.template-expression.end._LANG_
) @meta.embedded.line.interpolation._LANG_

(string
  (escape_sequence) @constant.character.escape.js)

(template_string
  (escape_sequence) @constant.character.escape.js)


; CONSTANTS
; =========

[
  (true)
  (false)
] @constant.language.boolean._TYPE_._LANG_

[
  (null)
  (undefined)
] @constant.language._TYPE_._LANG_

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
] @keyword.control._TYPE_._LANG_

; OPERATORS
; =========

["delete" "instanceof" "typeof" "keyof"] @keyword.operator._TYPE_._LANG_
"new" @keyword.operator.new._LANG_

"=" @keyword.operator.assignment._LANG_
(non_null_expression "!" @keyword.operator.non-null._LANG_)
(unary_expression"!" @keyword.operator.unary._LANG_)

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
  "??="
  "||="
] @keyword.operator.assignment.compound._LANG_

(binary_expression
  ["+" "-" "*" "/" "%"] @keyword.operator.arithmetic._LANG_)

(binary_expression
  [
    "=="
    "==="
    "!="
    "!=="
    ">="
    "<="
    ">"
    "<"
  ] @keyword.operator.comparison._LANG_
)

["++" "--"] @keyword.operator.increment._LANG_

[
  "&&"
  "||"
  "??"
] @keyword.operator.logical._LANG_


; The "|" in a `Foo | Bar` type annotation.
(union_type "|" @keyword.operator.type.union._LANG_)

; The "&" in a `Foo & Bar` type annotation.
(intersection_type "&" @keyword.operator.type.intersection._LANG_)

; The "?" in a `isFoo?: boolean` property type annotation.
(property_signature "?" @keyword.operator.type.optional._LANG_)
; The "?" in a `isFoo()?: boolean` method type annotation.
(method_signature "?" @keyword.operator.type.optional._LANG_)

; The "?" in a `isFoo?: boolean` class field annotation.
(public_field_definition "?" @keyword.operator.type.optional._LANG_)
; The "!" in a `isFoo!: boolean` class field annotation.
(public_field_definition "!" @keyword.operator.type.definite._LANG_)

"..." @keyword.operator.spread._LANG_
"." @keyword.operator.accessor._LANG_
"?." @keyword.operator.accessor.optional-chaining._LANG_


(ternary_expression
  ["?" ":"] @keyword.operator.ternary._LANG_
  (#set! capture.final))

(conditional_type
  ["?" ":"] @keyword.operator.ternary._LANG_
  (#set! capture.final))

; Try to highlight `?` like an operator while the user is typing without
; waiting for its paired `:`.
("?" @keyword.operator.ternary._LANG_
  (#is? test.descendantOfType "ERROR"))

; PUNCTUATION
; ===========

"{" @punctuation.definition.begin.bracket.curly._LANG_
"}" @punctuation.definition.end.bracket.curly._LANG_
"(" @punctuation.definition.begin.bracket.round._LANG_
")" @punctuation.definition.end.bracket.round._LANG_
"[" @punctuation.definition.begin.bracket.square._LANG_
"]" @punctuation.definition.end.bracket.square._LANG_

";" @punctuation.terminator.statement._LANG_
"," @punctuation.separator.comma._LANG_
":" @punctuation.separator.colon._LANG_


; META
; ====

; The interiors of functions (useful for snippets and commands).
(method_definition
  body: (statement_block) @meta.block.function._LANG_
  (#set! capture.final true))

(function_declaration
  body: (statement_block) @meta.block.function._LANG_
  (#set! capture.final true))

(generator_function_declaration
  body: (statement_block) @meta.block.function._LANG_
  (#set! capture.final true))

(function
  body: (statement_block) @meta.block.function._LANG_
  (#set! capture.final true))

(generator_function
  body: (statement_block) @meta.block.function._LANG_
  (#set! capture.final true))

; The interior of a class body (useful for snippets and commands).
(class_body) @meta.block.class._LANG_

; All other sorts of blocks.
(statement_block) @meta.block._LANG_

; The inside of a parameter definition list.
((formal_parameters) @meta.parameters._LANG_
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

; The inside of an object literal.
((object) @meta.object._LANG_
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

; MISC
; ====

; A label. Rare, but it can be used to prefix any statement and to control
; which loop is affected in `continue` or `break` statements. Svelte uses them
; for another purpose.
(statement_identifier) @entity.name.label._LANG_
