
; TYPES
; =====

(placeholder_type_specifier (auto) @support.type.builtin.auto.cpp)

(placeholder_type_specifier (auto) @support.type.builtin.auto.cpp)

; Mark all function definition types with data…
(function_definition
  type: (_) @_IGNORE_
  (#set! functionDefinitionType true))

; …so that we can detect when a type identifier is part of a template/generic.
((type_identifier) @variable.parameter.type.cpp
  (#is? test.descendantOfNodeWithData functionDefinitionType))

(class_specifier
  (type_identifier) @entity.name.class.cpp
  (#set! capture.final true))

; These refer to language constructs and remain in the `storage` namespace.
([
  "enum"
  "struct"
  "typedef"
  "union"
  "template"
] @storage.type._TYPE_.cpp
  (#set! capture.final))

; This one gets a slightly different scope name so it doesn't inadvertently
; match syntax themes that target `.syntax--class`.
("class" @storage.type.class-type.cpp
  (#set! capture.final))

; These refer to value types and go under `support`.
([
  "long"
  "short"
] @support.storage.type.builtin.cpp
  (#set! capture.final))

; These act as modifiers to value types and also go under `support`.
([
  "signed"
  "unsigned"
] @support.storage.modifier.builtin.cpp
  (#set! capture.final))

((type_identifier) @support.storage.type.builtin.cpp
  (#eq? @support.storage.type.builtin.cpp "string"))

; These act as general language modifiers and remain in the `storage`
; namespace.
[
  "const"
  "extern"
  "inline"
  "register"
  "restrict"
  "static"
  "volatile"

  "private"
  "protected"
  "public"

  "friend"
  "explicit"
  "virtual"
  "override"
  "final"
  "noexcept"

  "typename"
] @storage.modifier._TYPE_.cpp

(type_identifier) @support.storage.other.type.cpp


; FUNCTIONS
; =========

(field_initializer
  (field_identifier) @entity.name.function.cpp)

; The "foo" in `troz::foo(...)`.
(call_expression
  function: (qualified_identifier
    name: (identifier) @support.other.function.cpp)
  (#set! capture.final))

; The "foo" in `void Bar::foo () {`.
(function_declarator
  declarator: (qualified_identifier
    name: (identifier) @entity.name.function.cpp)
    (#set! capture.final))

; The "foo" in `void Bar::foo () {`.
(function_declarator
  declarator: (qualified_identifier
    name: (identifier) @entity.name.function.cpp)
    (#set! capture.final))

; The "foo" in `void Bar::Baz::foo () {`, regardless of namespace depth.
(qualified_identifier
  name: (identifier) @entity.name.function.cpp
  (#set! capture.final)
  (#is? test.descendantOfType "function_declarator"))

; The "Bar" in `void Bar::~Bar () {`.
(function_declarator
  declarator: (qualified_identifier
    name: (destructor_name) @entity.name.function.cpp)
    (#set! capture.final))

; The "foo" in `foo<SomeType>(...)`.
(call_expression
  function: (template_function
    name: (identifier) @support.other.function.cpp)
  (#set! capture.final))

; The "foo" in `troz::foo<SomeType>(...)`.
(call_expression
  function: (qualified_identifier
    name: (template_function
      name: (identifier) @support.other.function.cpp))
  (#set! capture.final))

; A function name in a method declaration within a class specifier.
(function_declarator
  (field_identifier) @entity.name.function.method.cpp)

; The "Foo" in `void Foo::bar() {` and `Foo::bar();`, regardless of namespace
; depth.
(qualified_identifier
  scope: (namespace_identifier) @support.other.namespace.cpp)

(string_literal (escape_sequence) @constant.character.escape.cpp)
(char_literal (escape_sequence) @constant.character.escape.cpp)

(this) @variable.language.this.cpp

; VARIABLES
; =========

; The "x" in `FSEvent& x`;
(reference_declarator
  [(identifier) (field_identifier)] @variable.other.declaration._LANG_
  (#is? test.descendantOfType "declaration field_declaration"))


; Function parameters
; -------------------

; Common naming idiom for C++ instanced vars: "fMemberName"
; ((identifier) @variable.other.readwrite.member.cpp
;   (#match? @variable.other.readwrite.member.cpp "^(f|m)[A-Z]\\w*$"))

; The "foo" in `const char *foo` within a parameter list.
; (Should work no matter how many pointers deep we are.)
(reference_declarator (identifier) @variable.parameter.cpp
  (#is? test.descendantOfType "parameter_declaration"))

; KEYWORDS
; ========

[
  "new"
  "delete"
] @keyword.control._TYPE_.cpp

[
  "catch"
  "operator"
  "try"
  "throw"
  "using"
  "namespace"
] @keyword.control._TYPE_.cpp

; OPERATORS
; =========

(qualified_identifier
  "::" @keyword.operator.accessor.namespace.cpp)

(reference_declarator "&" @keyword.operator.pointer.cpp)
(binary_expression
  ["and" "or"] @keyword.operator.logical.cpp)
(destructor_name "~" @keyword.operator.destructor.cpp)
("->" @keyword.operator.accessor.pointer-access.cpp
  (#set! capture.shy))


; PUNCTUATION
; ===========

";" @punctuation.terminator.statement.cpp

("," @punctuation.separator.comma.cpp
  (#set! capture.shy))

(if_statement
  condition: (condition_clause
    "(" @punctuation.definition.expression.begin.bracket.round.cpp
    ")" @punctuation.definition.expression.end.bracket.round.cpp
    (#set! capture.final true)))

(template_argument_list
  "<" @punctuation.definition.parameters.begin.bracket.angle.cpp
  ">" @punctuation.definition.parameters.end.bracket.angle.cpp)

(template_parameter_list
  "<" @punctuation.definition.parameters.begin.bracket.angle.cpp
  ">" @punctuation.definition.parameters.end.bracket.angle.cpp)


; TODO:
;
; * TM-style grammar has a lot of `mac-classic` scopes. I doubt they'd be
;   present if this wasn't converted from a TextMate grammar, so I'm leaving
;   them out for now.
;
