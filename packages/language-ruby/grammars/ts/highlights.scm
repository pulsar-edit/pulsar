; NOTES:
;
; (#set! final "true") means that any later rule that matches this exact range
; will be ignored.
;
; (#set! shy "true") means that this rule will be ignored if any previous rule
; has marked this exact range, whether or not it was marked as final.

; CLASSES/MODULES
; ===============

(superclass
  (constant) @entity.name._TYPE_.class.ruby
  .)

(superclass
  "<" @punctuation.separator.inheritance.ruby
  (constant) @entity.other.inherited-class.ruby
  (#set! final "true"))

; module [Foo]
(module
  name: (constant) @entity.name._TYPE_.module.ruby
  (#set! final "true"))

(singleton_class
  "<<" @keyword.operator.assigment.ruby)

; Mark `new` as a special method in all contexts, from `Foo.new` to
; `Foo::Bar::Baz.new` and so on.
(call
  receiver: (_)
  method: (identifier) @function.method.builtin.ruby
  (#eq? @function.method.builtin.ruby "new"))

; "Foo" and "Bar" in `class Zort < Foo::Bar`.
(superclass
  (scope_resolution
    scope: (constant) @entity.other.inherited-class.ruby
    name: (constant) @entity.other.inherited-class.ruby))

; "Foo" in `Foo::Bar`.
(scope_resolution
  scope: (constant) @support.class.ruby
  (#set! final "true"))

(scope_resolution
  "::" @keyword.operator.namespace.ruby
  (#set! final "true"))

; "Bar" in `Foo::Bar`.
(scope_resolution
  name: (constant) @support.class.ruby
  (#set! final "true"))


; ((variable) @keyword.other.special-method
; (#match? @keyword.other.special-method "^(extend)$"))

((identifier) @keyword.other.special-method
  (#match? @keyword.other.special-method "^(private|protected|public)$"))


; Highlight the interpolation inside of a string, plus the strings that delimit
; the interpolation.
(
  (interpolation
    "#{" @punctuation.section.embedded.begin.ruby
    "}" @punctuation.section.embedded.end.ruby)
  @meta.embedded)
  ; (#set! final "true"))


; Function calls

(
  (identifier) @keyword.other.special-method
 (#eq? @keyword.other.special-method "require"))


(unary
  "defined?" @function.method.builtin.ruby)

(class name: [(constant)]
  @entity.name._TYPE_.class.ruby
  (#set! final "true"))

; Scope the entire inside of a class body to `meta.class.ruby`; it's
; semantically useful even though it probably won't get highlighted.
(class) @meta.class.ruby

(method
  name: [(identifier) (constant)] @entity.name.function.ruby
  (#set! final "true"))

(singleton_method "." @punctuation.separator.method.ruby) @meta.function.method.with-arguments

(call
  method: (identifier) @keyword.other.special-method (#match? @keyword.other.special-method "^(raise|loop)$"))

; Identifiers

(global_variable) @variable.other.readwrite.global.ruby

(class_variable) @variable.other.readwrite.class.ruby

(instance_variable) @variable.other.readwrite.instance.ruby

(exception_variable (identifier) @variable.parameter.ruby)
(call receiver: (identifier) @variable.other.ruby)

; (call
;   receiver: (constant) @support.class.ruby
;   method: (identifier) @function.method.builtin.ruby
;   (#eq? @function.method.builtin.ruby "new")
; )

(element_reference
  (constant) @support.class.ruby
  (#match? @support.class.ruby "^(Set)$"))
  ; (#set! final "true")


(call
  method: [(identifier) (constant)] @keyword.other.special-method
  (#match? @keyword.other.special-method "^(extend)$"))


; (call
;   method: [(identifier) (constant)] @function.method)

; (call
;   method: (scope_resolution
;     scope: [(constant) (scope_resolution)] @support.class.ruby
;     "::" @keyword.operator.namespace.ruby
;     name: [(constant)] @support.class.ruby
;   )
; )

(scope_resolution
  scope: [(constant) (scope_resolution)]
  "::" @keyword.operator.namespace.ruby
  name: [(constant)] @support.class.ruby
  (#set! final "true"))

; (call
;   receiver: (constant) @constant.ruby (#match? @constant.ruby "^[A-Z\\d_]+$")
; )
(call receiver: (constant)
 @support.class.ruby
 (#set! final "true"))

(call "." @punctuation.separator.method (#set! final "true"))

((identifier) @constant.builtin.ruby
 (#match? @constant.builtin.ruby "^__(FILE|LINE|ENCODING)__$"))

; Anything that hasn't been highlighted yet is probably a bare identifier. Mark
; it as `constant` if it's all uppercase…
((constant) @constant.ruby
 (#match? @constant.ruby "^[A-Z\\d_]+$")
 (#set! final "true"))

; …otherwise treat it as a variable.
((constant) @variable.other.constant.ruby)

(self) @variable.language.self.ruby
(super) @keyword.control.pseudo-method.ruby

(block_parameter (identifier) @variable.parameter.function.block.ruby)
(block_parameters (identifier) @variable.parameter.function.block.ruby)
(destructured_parameter (identifier) @variable.parameter.function.ruby)
(hash_splat_parameter (identifier) @variable.parameter.function.splat.ruby)
(lambda_parameters (identifier) @variable.parameter.function.lambda.ruby)
(method_parameters (identifier) @variable.parameter.function.ruby)
(splat_parameter (identifier) @variable.parameter.function.splat.ruby)

; A keyword-style parameter when defining a method.
((keyword_parameter) @constant.other.symbol.hashkey.parameter.ruby
  (#set! startAt firstChild.startPosition)
  (#set! endAt firstChild.nextSibling.endPosition)
  (#set! final true))

; This scope should span both the key and the adjacent colon.
((pair key: (hash_key_symbol)) @constant.other.symbol.hashkey.ruby
  (#set! startAt firstChild.startPosition)
  (#set! endAt firstChild.nextSibling.endPosition)
  (#set! final true))

(pair
  key: (hash_key_symbol)
  ":" @punctuation.definition.constant.hashkey.ruby)

(optional_parameter
  name: (identifier) @variable.parameter.function.optional.ruby)

(
  (identifier) @support.function.kernel.ruby
  (#match? @support.function.kernel.ruby "^(abort|at_exit|autoload|binding|callcc|caller|caller_locations|chomp|chop|eval|exec|exit|fork|format|gets|global_variables|gsub|lambda|load|local_variables|open|p|print|printf|proc|putc|puts|rand|readline|readlines|select|set_trace_func|sleep|spawn|sprintf|srand|sub|syscall|system|test|trace_var|trap|untrace_var|warn)$")
  (#set! final "true"))


;((constant) @constant.ruby
;  (#match? @constant.ruby "^[A-Z\\d_]+$"))

; (identifier) @variable

; Literals

; Single-quoted string 'foo'
(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.single.ruby
  (#match? @string.quoted.single.ruby "^'")
  (#match? @string.quoted.single.ruby "'$")
  (#set! final true))


; Double-quoted string "bar"
(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.double.interpolated.ruby
  (#match? @string.quoted.double.interpolated.ruby "^\"")
  (#match? @string.quoted.double.interpolated.ruby "\"$")
  (#set! final true))

; "Other" strings

(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.other.ruby
  (#match? @string.quoted.other.ruby "^%q")
  (#set! final true))


(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.other.interpolated.ruby
  (#match? @string.quoted.other.interpolated.ruby "^%Q")
  (#set! final true))


(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.other.ruby
  (#set! final true))

; (
;   (
;     (heredoc_beginning) @punctuation.definition.string.begin.ruby.html
;     (#eq? @punctuation.definition.string.begin.ruby.html "<<-HTML")
;   )
;   (heredoc_body) @meta.embedded
; )

; TODO: Heredoc strings seem not to work as described.

; (
;   (heredoc_beginning) @meta.embedded
;   (_)+ @meta.embedded
;   ; (heredoc_body) @meta.embedded
; ) ;@meta.embedded
; (
;   (_) @meta.embedded
;   .
;   (heredoc_body) @meta.embedded
; )

; (heredoc_end) @meta.embedded
; (
;   (assignment
;     right: (heredoc_beginning)
;     @punctuation.definition.string.begin.ruby.html
;     (#match?
;       @punctuation.definition.string.begin.ruby.html
;       "^<<.HTML$"
;     )
;   )
;   (heredoc_body)
; ) @meta.embedded

(
  (subshell
    "`" @punctuation.definition.string.begin.ruby
    (_)?
    "`" @punctuation.definition.string.end.ruby)
  (#set! final true))

[
  (bare_string)
  (heredoc_body)
  (heredoc_beginning)]
@string.unquoted.ruby

((heredoc_body) @meta.embedded
  (#set! endAt lastChild.startPosition))



[
  (simple_symbol)
  (delimited_symbol)
  (hash_key_symbol)
  (bare_symbol)]
@constant.other.symbol.ruby

(splat_parameter "*" @storage.type.variable (#set! final true))
(rest_assignment "*" @storage.type.variable (#set! final true))

(regex
 "/" @punctuation.section.regexp
 (string_content) @string.regexp.interpolated
 "/" @punctuation.section.regexp)
(escape_sequence) @constant.character.escape

[
  (integer)
  (float)]
@constant.numeric.ruby

(nil) @constant.language.nil.ruby

[
  (true)
  (false)]
@constant.language.boolean.ruby

((comment) @comment.line.number-sign.ruby
  (#match? @comment.line.number-sign.ruby "^#"))

; Scope the initial `#` of a line comment as punctuation.
((comment) @punctuation.definition.comment.ruby
  (#match? @comment.line.number-sign.ruby "^#")
  (#set! endAfterFirstMatchOf "^#"))

((comment) @comment.block.ruby
  (#match? @comment.block.ruby "^=begin"))


; To distinguish them from the bitwise "|" operator.
(block_parameters
  "|" @punctuation.separator.variable.ruby)

(binary
  "|" @keyword.operator.other.ruby)

; Operators

"[" @punctuation.brace.square.begin.ruby
"]" @punctuation.brace.square.end.ruby

(parenthesized_statements
 "(" @punctuation.brace.round.begin.ruby
 ")" @punctuation.brace.round.end.ruby)

(hash
 "{" @punctuation.brace.curly.begin.ruby
 "}" @punctuation.brace.curly.end.ruby)

(block
 "{" @punctuation.section.scope.begin.ruby
 "}" @punctuation.section.scope.end.ruby)

; "{"
; "}" @punctuation.brace.curly.end.ruby

(conditional
  ["?" ":"] @keyword.operator.conditional.ruby
  (#set! final "true"))

[
  "="
  "||="
  "+="
  "-="
  "<<"]
@keyword.operator.assigment.ruby

[
  "||"
  "&&"]
@keyword.operator.logical.ruby

[
  "&"]
@keyword.operator.other.ruby

[
  "=="
  ">="
  "<="
  ">"
  "<"]
@keyword.operator.comparison.ruby

[
  "+"
  "-"
  "**"]
@keyword.operator.arithmetic.ruby

"=>" @punctuation.separator.key-value
"->" @keyword.operator.ruby

(binary "/" @keyword.operator.arithmetic.ruby)
(binary "*" @keyword.operator.arithmetic.ruby)

[
  ","
  ";"
  "."
  ":"]
@punctuation.separator.ruby

; Keywords

"class" @keyword.control.class
[
  "alias"
  "and"
  "begin"
  "break"
  "case"
  "def"
  "do"
  "else"
  "elsif"
  "end"
  "ensure"
  "for"
  "if"
  "in"
  "module"
  "next"
  "or"
  "rescue"
  "retry"
  "return"
  "then"
  "unless"
  "until"
  "when"
  "while"
  "yield"]
@keyword.control._TYPE_.ruby

; Any identifiers we haven't caught yet can be given a generic scope.
((identifier) @function.method.ruby
 (#is-not? local)
 (#set! shy "true"))
