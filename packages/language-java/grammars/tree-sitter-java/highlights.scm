; COMMENTS
; ========

((comment) @comment.line.double-slash.java
  (#match? @comment.line.double-slash.java "^//"))

((comment) @punctuation.definition.comment.java
  (#match? @punctuation.definition.comment.java "^//")
  (#set! adjust.startAndEndAroundFirstMatchOf "^//"))


((comment) @comment.block.documentation.javadoc.java
  (#match? @comment.block.documentation.javadoc.java "^/\\*\\*")
  (#set! capture.final true)
  (#set! highlight.invalidateOnChange true))

((comment) @comment.block.java
  (#match? @comment.block.java "^/\\*")
  (#set! highlight.invalidateOnChange true))

((comment) @punctuation.definition.comment.begin.java
  (#match? @punctuation.definition.comment.begin.java "^/\\*\\*?")
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.java
  (#match? @punctuation.definition.comment.end.java "\\*/$")
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))

; OBJECTS
; =======

(class_declaration
  "class" @storage.modifier.class.java
  name: (_) @entity.name.type.class.java)

(superclass
  "extends" @storage.modifier.extends.java
  (type_identifier) @entity.other.inherited-class.java
  (#set! capture.final true))

(class_declaration body: (_) @meta.class.body.java)

; INTERFACES
; ==========

(interface_declaration
  "interface" @storage.modifier.interface
  name: (identifier) @entity.name.type.interface.java)

(interface_declaration body: (_) @meta.interface.body.java)

(annotation_type_declaration
  "@interface"
  @keyword.other.interface.annotated.java
    name: (_) @entity.name.type.interface.annotated.java)

(annotation_type_declaration body: (_) @meta.interface.annotated.body.java)

(annotation_type_element_declaration
  name: (_) @entity.name.function.interface.java)


(extends_interfaces "extends" @storage.modifier.extends.java)

(extends_interfaces
  (interface_type_list
    (type_identifier) @entity.other.inherited-class.java)
    (#set! capture.final true))

(super_interfaces "implements" @storage.modifier.implements.java)

(super_interfaces
  (interface_type_list
    (type_identifier) @entity.other.inherited-class.java)
    (#set! capture.final true))

(static_initializer "static" @storage.modifier.static.java)


; ANNOTATIONS
; ===========

(marker_annotation
  "@" @punctuation.definition.annotation.java) @meta.declaration.annotation.java

; Cover both the '@' and the 'Foo' in `@Foo`.
((marker_annotation) @storage.type.annotation.java @support.type.annotation.java
  (#set! adjust.endAt firstChild.nextSibling.endPosition))

(annotation
  "@" @punctuation.definition.annotation.java) @meta.declaration.annotation.java

  ; Cover both the '@' and the 'Foo' in `@Foo`.
((annotation) @storage.type.annotation.java @support.type.annotation.java
  (#set! adjust.endAt firstChild.nextSibling.endPosition))

(element_value_pair key: (_) @variable.other.annotation.element.java)

; TYPES
; =====

(object_creation_expression (type_identifier)
  @support.other.class.java
  (#set! capture.final true))

; WORKAROUND: This matches often when the user is typing, so we shouldn't
; highlight it until we know for sure what it is.
(ERROR
  (type_identifier) @_IGNORE_
  (#set! capture.final true))

; WORKAROUND: A chain like `System.out.println` shouldn't match at all until
; it's out of an ERROR state; this should catch all references no matter how
; long the chain is.
(scoped_type_identifier
  (type_identifier) @_IGNORE
  (#is? test.descendantOfType ERROR)
  (#set! capture.final true))

(type_identifier) @storage.type.java
(type_parameter (identifier) @storage.type.java)

(void_type) @storage.type.void.java
(integral_type) @storage.type.integral.java
(floating_point_type) @storage.type.float.java
(boolean_type) @storage.type.boolean.java

[
  "public"
  "private"
  "protected"
  "abstract"
  "static"
  "final"
  "strictfp"
  "synchronized"
  "native"
  "transient"
  "volatile"
] @storage.modifier._TYPE_.java

(type_arguments (wildcard "?" @storage.type.generic.wildcard.java))
(type_arguments (wildcard "extends" @storage.modifier.extends.java))
(type_arguments (wildcard (super) @storage.modifier.super.java))

(type_bound "extends" @storage.modifier.extends)
(type_bound "&" @punctuation.separator.types.java)




; ENTITIES
; ========

(enum_declaration "enum" @storage.type.enum.java)

(enum_declaration
  name: (identifier) @entity.name.type.enum.java)

(enum_declaration (enum_body) @meta.enum.body.java)

(enum_constant
  name: (identifier) @constant.other.enum.java)



; FUNCTIONS
; =========

(method_declaration (identifier) @entity.name.function.method.java)

(method_declaration (block)  @meta.method.body.java)

(constructor_declaration (identifier) @entity.name.function.method.constructor.java)

(constructor_body) @meta.method.constructor.body.java

(throws "throws" @storage.modifier.throws.java)

(method_invocation (identifier)
  @support.other.function.java)

(field_access (identifier) @constant.other.java
  (#match? @constant.other.java "^[A-Z][A-Z0-9_\\$]+$")
  (#set! capture.final true))

(field_access
  object: (identifier) @support.other.class.java
  (#match? @support.other.class.java "^[A-Z]")
  (#set! capture.final true))

(field_access
  field: (identifier) @support.other.class.java
  (#match? @support.other.class.java "^[A-Z]")
  (#set! capture.final true))


(method_invocation (identifier) @constant.other.java
  (#match? @constant.other.java "^[A-Z][A-Z0-9_\\$]+$")
  (#set! capture.final true))


; VARIABLES
; =========

[(this) (super)] @variable.language._TYPE_.java

(spread_parameter "..." @keyword.operator.ellipsis.java)

(formal_parameter (identifier) @variable.parameter.method.java)

(lambda_expression
  parameters: (identifier) @variable.parameter.lambda.java)

(lambda_expression
  parameters: (inferred_parameters
    (identifier) @variable.parameter.lambda.java))

(variable_declarator
  name: (identifier) @variable.other.declaration.java)

(assignment_expression
  left: (identifier) @variable.other.assignment.java)

(update_expression
  (identifier) @variable.other.assignment.java)

; PACKAGES
; ========

(package_declaration) @meta.package.java

"package" @keyword.other.package.java

(import_declaration) @meta.import.java

(import_declaration
  ["import"] @keyword.other._TYPE_.java)

(import_declaration (asterisk) @variable.language.wildcard.java)


; STRINGS
; =======

(character_literal) @string.quoted.single.java

((character_literal) @punctuation.definition.string.begin.java
  (#set! adjust.startAndEndAroundFirstMatchOf "^'"))
((character_literal) @punctuation.definition.string.end.java
  (#set! adjust.startAndEndAroundFirstMatchOf "'$"))


(string_literal) @string.quoted.double.java

((string_literal) @punctuation.definition.string.begin.java
  (#set! adjust.startAndEndAroundFirstMatchOf "^\""))
((string_literal) @punctuation.definition.string.end.java
  (#set! adjust.startAndEndAroundFirstMatchOf "\"$"))

; CAVEAT: Parser doesn't recognize escape sequences in strings.

; KEYWORDS
; ========

[
  "assert"
  "break"
  "case"
  "catch"
  "continue"
  "default"
  "do"
  "else"
  "finally"
  "for"
  "if"
  "new"
  "return"
  "switch"
  "throw"
  "try"
  "while"
] @keyword.control._TYPE_.java

; MISCELLANEOUS
; =============

; (lambda_expression "->" @storage.type.function.arrow.java)

(catch_type "|" @punctuation.separator.catch.java)



; CONSTANTS
; =========

[
  (true)
  (false)
] @constant.language.boolean._TYPE_.java

(null_literal) @constant.language.null.java

; NUMBERS
; =======

(decimal_integer_literal) @constant.numeric.integer.decimal.java
(hex_integer_literal) @constant.numeric.integer.hexadecimal.java
(octal_integer_literal) @constant.numeric.integer.octal.java
(binary_integer_literal) @constant.numeric.integer.binary.java

(decimal_floating_point_literal) @constant.numeric.float.decimal.java
(hex_floating_point_literal) @constant.numeric.float.hexadecimal.java


; OPERATORS
; =========

(ternary_expression ["?" ":"] @keyword.operator.ternary.java)

"instanceof" @keyword.operator.instanceof.java

"=" @keyword.operator.assignment.java

[
  "+="
  "-="
  "*="
  "/="
  "%="
  "&="
  "|="
  "^="
  "<<="
  ">>="
  ">>>="
] @keyword.operator.assignment.compound.java

(binary_expression
  ["&&" "||"] @keyword.operator.logical.java)
(unary_expression "!" @keyword.operator.logical.java)

(binary_expression
  [
    "=="
    "!="
    "<="
    ">="
    ">"
    "<"
  ] @keyword.operator.comparison.java)

(binary_expression
  [
    "-"
    "+"
    "*"
    "/"
    "%"
  ] @keyword.operator.arithmetic.java)

(binary_expression
  ["&" "|" "^" "~" "<<" ">>" ">>>"] @keyword.operator.bitwise.java)

["++" "--"] @keyword.operator.increment.java

"." @keyword.operator.accessor.dot.java
"::" @keyword.operator.accessor.method-reference.java

; PUNCTUATION
; ===========

";" @punctuation.terminator.statement.java

"," @punctuation.separator.comma.java
"->" @punctuation.separator.lambda.java

(if_statement
  condition: (parenthesized_expression
    "(" @punctuation.definition.expression.begin.bracket.round.java
    ")" @punctuation.definition.expression.end.bracket.round.java
    (#set! capture.final true)))

(formal_parameters
  "(" @punctuation.definition.parameters.begin.bracket.round.java
  ")" @punctuation.definition.parameters.end.bracket.round.java
  (#set! capture.final true))

(argument_list
  "(" @punctuation.definition.arguments.begin.bracket.round.java
  ")" @punctuation.definition.arguments.end.bracket.round.java
  (#set! capture.final true))


"{" @punctuation.definition.block.begin.bracket.curly.java
"}" @punctuation.definition.block.end.bracket.curly.java
"(" @punctuation.definition.expression.begin.bracket.round.java
")" @punctuation.definition.expression.end.bracket.round.java
"[" @punctuation.definition.array.begin.bracket.square.java
"]" @punctuation.definition.array.end.bracket.square.java

(type_arguments "<" @punctuation.definition.type.begin.bracket.angle.java)
(type_arguments ">" @punctuation.definition.type.end.bracket.angle.java)

(type_parameters "<" @punctuation.definition.type.begin.bracket.angle.java)
(type_parameters ">" @punctuation.definition.type.end.bracket.angle.java)
