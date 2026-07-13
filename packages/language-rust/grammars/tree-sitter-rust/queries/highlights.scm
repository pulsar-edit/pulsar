; COMMENTS
; ========

(line_comment) @comment.line.double-slash.rust
((line_comment) @punctuation.definition.comment.rust
  (#set! adjust.endAfterFirstMatchOf "^//"))

(block_comment) @comment.block.rust
((block_comment) @punctuation.definition.begin.comment.rust
  (#set! adjust.endAfterFirstMatchOf "^/\\*"))
((block_comment) @punctuation.definition.end.comment.rust
  (#set! adjust.startBeforeFirstMatchOf "\\*/$"))


; FUNCTIONS
; =========

; Definitions
; -----------

(function_item
  name: (identifier) @entity.name.function.rust)

(function_signature_item
  name: (identifier) @entity.name.function.rust)

(macro_definition
  name: (identifier) @entity.name.function.macro.rust)


; Invocations
; -----------

; Wrap the "foo" and "!" of `foo!()`.
((macro_invocation (identifier)) @support.other.function.rust
  (#set! adjust.endAt firstChild.nextSibling.endPosition))

(call_expression
  function: (identifier) @support.other.function.rust)

(call_expression
  (scoped_identifier
    name: (_) @support.other.function.rust))


(call_expression
  function: (field_expression
    field: (field_identifier) @support.other.function.method.rust))

(call_expression
  function: (scoped_identifier
    "::"
    name: (identifier) @support.other.function.rust))

(generic_function
  function: (identifier) @support.other.function.generic.rust)

(generic_function
  function: (scoped_identifier
    name: (identifier) @support.other.function.generic.rust))

(generic_function
  function: (field_expression
    field: (field_identifier) @support.other.function.method.rust))

; TYPES
; ======

((identifier) @support.class.rust
  (#match? @support.class.rust "^[A-Z]"))

(primitive_type) @storage.type.builtin.rust
(type_identifier) @storage.type.other.rust

(lifetime (identifier) @storage.modifier.label.rust)

[
  "let"
  "const"
  "static"
  "extern"
  "fn"
  "type"
  "impl"
  "dyn"
  "trait"
  "mod"
  "pub"
  "default"
  "struct"
  "enum"
  "union"
] @storage.modifier._TYPE_.rust

(mutable_specifier) @storage.modifier.mut.rust


; VARIABLES
; =========

(parameters
  (parameter
    pattern: (_) @variable.parameter.function.rust))

(let_declaration
  pattern: (_) @variable.other.assignment.rust)


(field_identifier) @variable.other.member.rust

(self) @variable.language.self.rust

; CONSTANTS
; =========

((identifier) @constant.language.underscore.rust
  (#eq? @constant.language.underscore.rust "_"))

(match_pattern "_" @constant.language.underscore.rust)

((identifier) @constant.other.rust
  (#match? @constant.other.rust "^[A-Z_][A-Z\\d_]+$")
  (#set! capture.final true))

(boolean_literal) @constant.language.boolean._TEXT_.rust
(escape_sequence) @constant.character.escape.rust

(integer_literal) @constant.numeric.decimal.integer.rust
(float_literal) @constant.numeric.decimal.float.rust


; KEYWORDS
; ========

(use_list (self) @keyword.control.rust)
(scoped_use_list (self) @keyword.control.rust)
(scoped_identifier (self) @keyword.control.rust)


[
  "use"
] @keyword.control.import._TYPE_.rust

[
  "match"
  "if"
  "in"
  "else"
  "move"
  "where"
  "ref"
  "async"
  "await"
] @keyword.control._TYPE_.rust

[
  "unsafe"
] @keyword.control._TYPE_.rust

[
  "while"
  "loop"
  "for"
  "return"
  "continue"
  "break"
] @keyword.control.flow._TYPE_.rust

"macro_rules!" @keyword.control.macro-rules.rust

; STRINGS
; =======

(char_literal) @string.quoted.single.rust
(string_literal) @string.quoted.double.rust
(raw_string_literal) @string.quoted.other.rust


; VALUES
; ======

[
  (attribute_item)
  (inner_attribute_item)
] @entity.other.attribute-name.rust


; OPERATORS
; =========

(reference_type "&" @keyword.operator.reference.rust)
(type_cast_expression "as" @keyword.operator.as.rust)
(unary_expression "*" @keyword.operator.dereference.rust)
(lifetime "'" @keyword.operator.lifetime.rust)

(binary_expression
  ["==" "!=" ">" "<"] @keyword.operator.comparison.rust)

"=" @keyword.operator.assignment.rust

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
] @keyword.operator.assignment.compound.rust

(reference_expression "&" @keyword.operator.reference.rust)

(binary_expression
  ["&" "|" "^" ">>" "<<"] @keyword.operator.bitwise.rust)

(binary_expression
  ["+" "-" "*" "/" "%"] @keyword.operator.arithmetic.rust)

(unary_expression
  ["-" "!"] @keyword.operator.unary.rust)

["||" "&&"] @keyword.operator.logical.rust

(range_pattern
  ["..="] @keyword.operator.range.rust)

; WORKAROUND: Apparently '..' is the right-exclusive variant of '..=', but
; tree-sitter-rust doesn't support it yet.
(ERROR
  (integer_literal)
  ".." @keyword.operator.range.rust)

(remaining_field_pattern
  ".." @keyword.operator.rest.rust
)

"." @keyword.operator.accessor.rust
"::" @keyword.operator.namespace.rust


; MISC
; ====

(block) @meta.block.rust


; PUNCTUATION
; ===========

"{" @punctuation.definition.begin.bracket.curly.rust
"}" @punctuation.definition.end.bracket.curly.rust
"(" @punctuation.definition.begin.bracket.round.rust
")" @punctuation.definition.end.bracket.round.rust
"[" @punctuation.definition.begin.bracket.square.rust
"]" @punctuation.definition.end.bracket.square.rust

":" @punctuation.separator.colon.rust

"->" @punctuation.separator.return-type.rust
"=>" @punctuation.separator.match-arm.rust
