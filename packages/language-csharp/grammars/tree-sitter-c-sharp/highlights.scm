
[
	"public"
	"private"
	"internal"
	"extern"
	"implicit"
	"explicit"
	"global"
	"params"
	"partial"
	"static"
	"async"
	"readonly"
	"unchecked"
	"unmanaged"
] @storage.modifier._TYPE_.cs

(
	["file" "scoped"] @storage.modifier._TYPE_.cs
	; Identifiers are allowed to have these names, so guard against false
	; positives.
	(#is-not? test.descendantOfType "identifier implicit_parameter")
)

[
	"class"
	"const"
	"enum"
	"event"
	"interface"
	"let"
	"namespace"
	"operator"
	"struct"
] @storage.type._TYPE_.cs

; TODO: `nameof` is like a utility type function, but the parser marks it as a
; type of its own in all valid contexts, so there's seemingly nothing to do
; there.

(
	["var"] @storage.type._TYPE_.cs
	; Identifiers are allowed to have these names, so guard against false
	; positives.
	(#is-not? test.descendantOfType "identifier implicit_parameter")
)

(accessor_declaration "get" @storage.getter.cs)
(accessor_declaration "set" @storage.setter.cs)

; VALUES

(null_literal) @constant.language.null.cs

(boolean_literal) @constant.language.boolean._TEXT_.cs

(integer_literal) @constant.numeric.integer.cs
(real_literal) @constant.numeric.float.cs

; STRINGS

(character_literal) @string.quoted.single.cs
(string_literal) @string.quoted.double.cs
(raw_string_literal) @string.quoted.triple.cs
(verbatim_string_literal) @string.quoted.double.verbatim.cs

; Double-quoted interpolated string expressions. We want to match `$""` and
; `$"x"` but not `$"""`. Also, `$`/`$@`/`@$` are all valid sigils!
((interpolated_string_expression) @string.quoted.double.interpolated.cs
	(#match? @string.quoted.double.interpolated.cs "^(\\$|\\$@|@\\$)\"[^\"]"))
((interpolated_string_expression) @string.quoted.double.interpolated.cs
	(#eq? @string.quoted.double.interpolated.cs "$\"\""))

; Triple-quoted interpolation strings.
(interpolated_string_expression (interpolation_quote)) @string.quoted.triple.interpolated.cs

; Delimiters for triple-quoted interpolation strings.
(interpolated_string_expression
	(interpolation_quote) @punctuation.definition.string.begin.cs
	(#is? test.firstOfType))
(interpolated_string_expression
	(interpolation_quote) @punctuation.definition.string.end.cs
	(#is? test.lastOfType))

; The sigil in an interpolation string.
(interpolation_start) @punctuation.definition.string.begin.cs

(escape_sequence) @constant.character.escape.cs

; Interpolations within strings.
(interpolated_string_expression
	(interpolation) @meta.embedded.block.cs
	(#match? @meta.embedded.block.cs "\\n")
	(#set! capture.final))

(interpolated_string_expression
	(interpolation) @meta.embedded.line.cs)

(interpolation
	(interpolation_brace) @punctuation.section.embedded.begin.cs
	(#is? test.firstOfType))

(interpolation
	(interpolation_brace) @punctuation.section.embedded.end.cs
	(#is? test.lastOfType))

; COMMENTS

((comment) @comment.line.cs
	(#match? @comment.line.cs "^//")
	(#set! capture.final))

((comment) @comment.block.cs
	(#match? @comment.block.cs "^/\\*"))

; ENTITIES

(interface_declaration
	name: (identifier) @entity.name.type.declaration.cs)

(enum_declaration
	name: (identifier) @entity.name.type.enum.cs)

(struct_declaration
	(identifier) @entity.name.type.struct.cs)

(record_declaration
	(identifier) @entity.name.type.record.cs)

(namespace_declaration
	name: (identifier) @entity.name.type.module.cs)

(file_scoped_namespace_declaration
	name: (identifier) @entity.name.type.module.cs)

(class_declaration
	name: (identifier) @entity.name.type.class.cs)

(constructor_declaration
	name: (identifier) @entity.name.function.declaration.constructor.cs)

(destructor_declaration
	name: (identifier) @entity.name.function.declaration.destructor.cs)

(method_declaration
	name: (identifier) @entity.name.function.method.cs)

(local_function_statement
	name: (identifier) @entity.name.function.cs)

(attribute name: (identifier) @entity.other.attribute-name.cs)

; SUPPORT

(invocation_expression
	function: (identifier) @support.other.function.cs)

; TYPES

; Builtin types like `string`.
(predefined_type) @support.storage.type.builtin.cs

; The `Foo` in "List<Foo>".
(type_argument_list
	(identifier) @support.storage.type.cs)

; The inner `List` in "List<List<Foo>>".
(type_argument_list
	(generic_name
		(identifier) @support.storage.type.cs))

; The first `List` in "static List<int> x = new List<int>();".
(variable_declaration
	type: (generic_name (identifier) @support.storage.type.cs))

; Type coercion.
(as_expression
	right: (identifier) @support.storage.type.cs)

; Type checking/binding.
(is_expression
	right: (identifier) @support.storage.type.cs)

; Generally, anything with a `type:` field should be highlighted like a type.
(_ type: (identifier) @support.storage.type.cs)

; TODO: This might be overbroad.
(base_list (identifier) @support.storage.type.cs)

; Generally, anything with a `returns:` field should be highlighted like a type.
(_
	returns: (identifier) @support.storage.type.cs
	(#set! capture.shy))

(_
	returns: (qualified_name
		name: (identifier) @support.storage.type.cs))

; VARIABLES

"this" @variable.language.this.cs

(variable_declarator
	name: (identifier) @variable.other.assignment.cs)

(parameter
	name: (identifier) @variable.parameter.cs)

(assignment_expression
	left: (identifier) @variable.other.assignment.cs)

(type_parameter_list
	(type_parameter
		name: (identifier) @support.storage.type.parameter.cs))

(bracketed_parameter_list
	name: (identifier) @variable.parameter.bracketed.cs)

(enum_member_declaration
	(identifier) @variable.other.property.cs)

; The `EndsWith` in 'someString.EndsWith("foo")'.
(invocation_expression
	(member_access_expression
		name: (identifier) @support.other.function.method.cs))

; The `Sort` in "Array.Sort<Foo>".
(invocation_expression
	(member_access_expression
		name: (generic_name (identifier) @support.other.function.method.cs))
	(#set! capture.final))

; The "X" in `ptr->X`.
(member_access_expression
	name: (identifier) @variable.other.property.cs
	(#is-not? test.descendantOfType "invocation_expression"))

; KEYWORDS

[
	"add"
	"alias"
	"as"
	"base"
	"break"
	"case"
	"catch"
	"checked"
	"continue"
	"default"
	"delegate"
	"do"
	"else"
	"finally"
	"for"
	"foreach"
	"goto"
	"if"
	"is"
	"lock"
	"notnull"
	"return"
	"remove"
	"using"
	"while"
	"await"
	"yield"
	"when"
	"out"
	"ref"
	"where"
	"select"
	"record"
	"init"
	"unsafe"
	"with"
	"stackalloc"
] @keyword.control._TYPE_.cs

(
	["from"] @keyword.control._TYPE_.cs
	(#is-not? test.descendantOfType "identifier")
)

; OPERATORS

"=" @keyword.operator.assignment.cs

"." @keyword.operator.accessor.cs
"->" @keyword.operator.accessor.member.cs

; TODO: `tree-sitter-csharp` doesn't seem to handle this properly; the `?` and
; `.` are divided into separate tokens.
;
; In the meantime, both `?` and `.` will probably be highlighted as individual
; characters identically to how they'd be highlighted as a unit, so we can live
; with this for now.
; "?." @keyword.operator.optional-chain.cs

"?" @keyword.operator.optional.cs
".." @keyword.operator.range.cs

["new"] @keyword.operator._TYPE_.cs

(prefix_unary_expression
	["&" "^" "+" "-"] @keyword.operator.unary.cs)

(prefix_unary_expression
	["++" "--"] @keyword.operator.unary.increment.cs)

(prefix_unary_expression
	["~"] @keyword.operator.unary.bitwise.cs)

(postfix_unary_expression
	["!" @keyword.operator.null-forgiving.cs])

[
	"sizeof"
	"typeof"
] @keyword.operator.unary._TYPE_.cs

[ "in" ] @keyword.operator._TYPE_.cs

[
	"+"
	"-"
	"*"
	"/"
	"%"
] @keyword.operator.arithmetic.cs

["++" "--"] @keyword.operator.increment.cs

["&&" "||" "??"] @keyword.operator.logical.cs

("!" @keyword.operator.unary.logical.cs
	(#set! capture.shy))

([
	"&"
	"|"
	"^"
	"~"
	"<<"
	">>"
	">>>"
] @keyword.operator.bitwise.cs
	(#set! capture.shy))

[
	"+="
	"-="
	"*="
	"/="
	"%="
] @keyword.operator.arithmetic.compound.cs

[
	"&="
	"|="
	"^="
	"<<="
	">>="
	">>>="
] @keyword.operator.bitwise.compound.cs

((type_parameter_list
	"<" @punctuation.definition.parameters.begin.bracket.angle.cs
	">" @punctuation.definition.parameters.end.bracket.angle.cs)
	(#set! capture.final))

((type_argument_list
	"<" @punctuation.definition.parameters.begin.bracket.angle.cs
	">" @punctuation.definition.parameters.end.bracket.angle.cs)
	(#set! capture.final))

[
	"=="
	"!="
	">="
	"<="
	">"
	"<"
] @keyword.operator.comparison.cs

(destructor_declaration "~" @keyword.operator.destructor.cs)

; PUNCTUATION

";" @punctuation.terminator.statement.semicolon.cs
"," @punctuation.separator.comma.cs
":" @punctuation.separator.colon.cs

"=>" @punctuation.other.arrow.cs

("[" @punctuation.definition.begin.bracket.square.cs
	(#set! capture.shy))
("]" @punctuation.definition.end.bracket.square.cs
	(#set! capture.shy))

("{" @punctuation.definition.begin.bracket.curly.cs
	(#set! capture.shy))
("}" @punctuation.definition.end.bracket.curly.cs
	(#set! capture.shy))

("(" @punctuation.definition.begin.bracket.round.cs
	(#set! capture.shy))
(")" @punctuation.definition.end.bracket.round.cs
	(#set! capture.shy))
