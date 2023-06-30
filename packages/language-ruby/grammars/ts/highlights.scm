; NOTES:
;
; (#set! test.final "true") means that any later rule that matches this exact range
; will be ignored.
;
; (#set! shy "true") means that this rule will be ignored if any previous rule
; has marked this exact range, whether or not it was marked as final.

; SUPPORT
; =======

(call
  receiver: (constant) @support.class.builtin.ruby
  method: (identifier) @keyword.other.special-method.new.ruby
  (#match? @keyword.other.special-method.new.ruby "new")
  (#match? @support.class.builtin.ruby "^(Array|BasicObject|Date|DateTime|Dir|Exception|File|FileUtils|Float|Hash|Integer|Object|Pathname|Process|Range|Rational|Regexp|Set|Struct|Time|Symbol)$")
  (#set! test.final true))


; Common receivers of "static" method calls. Some of these are gems, but
; they're popular.
(scope_resolution
  name: (constant) @support.class.builtin.ruby
  (#match? @support.class.builtin.ruby "^(File|FileUtils|JSON|Nokogiri|Psych|PTY|Rake|TTY|YAML)$" ))

; Names of built-in error classes are highly unlikely to be false positives, so
; we can scope them in all contexts.
((identifier) @support.class.builtin.error.ruby
  (#match? @support.class.builtin.error.ruby "^(ArgumentError|ClosedQueueError|EncodingError|FiberError|FloatDomainError|FrozenError|IOError|IndexError|KeyError|LoadError|LocalJumpError|NameError|NoMatchingPattern(Key)?Error|No(Memory|Method)Error|NotImplementedError|RangeError|RegexpError|RuntimeError|ScriptError|SecurityError|StandardError|SyntaxError|System(Call|Stack)Error|ThreadError|TypeError|UncaughtThrowError|ZeroDivisionError)$"))

(
  (identifier) @support.function.kernel.ruby
  (#match? @support.function.kernel.ruby "^(abort|at_exit|autoload|binding|callcc|caller|caller_locations|chomp|chop|eval|exec|exit|fork|format|gets|global_variables|gsub|lambda|load|local_variables|open|p|print|printf|proc|putc|puts|rand|readline|readlines|select|set_trace_func|sleep|spawn|sprintf|srand|sub|syscall|system|test|trace_var|trap|untrace_var|warn)$")
  (#set! test.final "true"))

(call
  method: (identifier) @keyword.other.pseudo-method.ruby
    (#match? @keyword.other.pseudo-method.ruby "^(alias_method)$")
    (#set! test.final true))

(call
  method: (identifier) @support.other.function.ruby)


; CLASSES/MODULES
; ===============

; "Foo" in `class Foo`
(class
  name: (constant) @entity.name.type.class.ruby
  (#set! test.final true))

; "<" in `class Foo < Bar`
(superclass
  "<" @punctuation.separator.inheritance.ruby
  (constant) @entity.other.inherited-class.ruby
  (#set! test.final "true"))

; "Foo" in `module Foo`
(module
  name: (constant) @entity.name.type.module.ruby
  (#set! test.final "true"))


; Mark `new` as a special method in all contexts, from `Foo.new` to
; `Foo::Bar::Baz.new` and so on.
(call
  receiver: (_)
  method: (identifier) @keyword.other.special-method.new.ruby
  (#eq? @keyword.other.special-method.new.ruby "new"))

(call
  (identifier) @keyword.other.special-method.ruby
  (#match? @keyword.other.special-method.ruby "^(loop|include|extend|prepend|raise|fail|attr_reader|attr_writer|attr_accessor|attr|catch|throw|private_class_method|public_class_method|module_function|refine|using)$")
  (#set! test.final true))

((identifier) @keyword.other.special-method
  (#match? @keyword.other.special-method "^(private|protected|public)$"))

(call
  method: [(identifier) (constant)] @keyword.other.special-method
  (#match? @keyword.other.special-method "^(extend)$"))

; "Foo" and "Bar" in `class Zort < Foo::Bar`.
(superclass
  (scope_resolution
    scope: (constant) @entity.other.inherited-class.ruby
    name: (constant) @entity.other.inherited-class.ruby)
    (#set! test.final true))

; "Foo" in `Foo::Bar`.
(scope_resolution
  scope: (constant) @support.other.namespace.ruby)

; "::" in `Foo::Bar`.
(scope_resolution
  "::" @keyword.operator.namespace.ruby
  (#set! test.final "true"))

; "Bar" in `Foo::Bar`.
(scope_resolution
  name: (constant) @support.other.class.ruby)




; Function calls

((identifier) @keyword.other.special-method
 (#eq? @keyword.other.special-method "require"))

(unary
  "defined?" @keyword.other.defined.ruby)

(method
  name: [(identifier) (constant)] @entity.name.function.ruby
  (#set! test.final "true"))

(singleton_method
  "." @keyword.operator.accessor.ruby
  ) @meta.function.method.with-arguments

(call
  method: (identifier) @keyword.other.special-method
  (#match? @keyword.other.special-method "^(raise|loop)$"))

; Identifiers

(global_variable) @variable.other.readwrite.global.ruby
((global_variable) @punctuation.definition.variable.global.ruby
  (#set! adjust.endAfterFirstMatchOf "^\\$"))

(class_variable) @variable.other.readwrite.class.ruby
((class_variable) @punctuation.definition.variable.class.ruby
  (#set! adjust.endAfterFirstMatchOf "^@@"))

(instance_variable) @variable.other.readwrite.instance.ruby
((instance_variable) @punctuation.definition.variable.instance.ruby
  (#set! adjust.endAfterFirstMatchOf "^@"))

(exception_variable (identifier) @variable.parameter.ruby)

(assignment
  left: (identifier) @variable.other.assignment.ruby)

(constant) @constant.ruby

(element_reference
  (constant) @support.class.ruby
  (#match? @support.class.ruby "^(Set)$"))


(scope_resolution
  scope: [(constant) (scope_resolution)]
  "::" @keyword.operator.namespace.ruby
  name: [(constant)] @support.other.class.ruby
  (#set! test.final "true"))

; (call
;   receiver: (constant) @constant.ruby (#match? @constant.ruby "^[A-Z\\d_]+$")
; )
(call
  receiver: (constant) @support.other.class.ruby
 (#set! test.final "true"))

(call "." @keyword.operator.accessor.ruby (#set! test.final "true"))
(call "&." @keyword.operator.accessor.ruby (#set! test.final "true"))

((identifier) @constant.builtin.ruby
 (#match? @constant.builtin.ruby "^__(FILE|LINE|ENCODING)__$"))

; Anything that hasn't been highlighted yet is probably a bare identifier. Mark
; it as `constant` if it's all uppercase…
((constant) @constant.ruby
 (#match? @constant.ruby "^[A-Z\\d_]+$")
 (#set! test.final "true"))

; …otherwise treat it as a variable.
; ((constant) @variable.other.constant.ruby)
((constant) @support.other.module.ruby)

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
  (#set! adjust.startAt firstChild.startPosition)
  (#set! adjust.endAt firstChild.nextSibling.endPosition)
  (#set! test.final true))

; This scope should span both the key and the adjacent colon.
((pair key: (hash_key_symbol)) @constant.other.symbol.hashkey.ruby
  (#set! adjust.startAt firstChild.startPosition)
  (#set! adjust.endAt firstChild.nextSibling.endPosition)
  (#set! test.final true))

(pair
  key: (simple_symbol) @constant.other.symbol.hashkey.ruby)

(pair
  key: (hash_key_symbol) @constant.other.symbol.hashkey.ruby
  ; In `{ foo: 'bar' }` syntax, the `:` both marks the key as a symbol and
  ; separates it from its value.
  ":" @punctuation.definition.constant.hashkey.ruby
      @punctuation.separator.key-value.ruby
      (#set! test.final true))

(optional_parameter
  name: (identifier) @variable.parameter.function.optional.ruby)


;((constant) @constant.ruby
;  (#match? @constant.ruby "^[A-Z\\d_]+$"))

; (identifier) @variable

; STRINGS
; =======

; Single-quoted string 'foo'
(
  ; The anonymous nodes in the tree-sitter grammar are all called "\"" no
  ; matter what the delimiter is. We can work around this by using `#match?`
  ; predicates.
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.single.ruby
  (#match? @string.quoted.single.ruby "^'")
  (#match? @string.quoted.single.ruby "'$")
  (#set! test.final true))


; Double-quoted string "bar"
(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.double.interpolated.ruby
  (#match? @string.quoted.double.interpolated.ruby "^\"")
  (#match? @string.quoted.double.interpolated.ruby "\"$")
  (#set! test.final true))

; "Other" strings
(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.other.ruby
  (#match? @string.quoted.other.ruby "^%q")
  (#set! test.final true))

(
  (string
    "\"" @punctuation.definition.string.begin.ruby
    (string_content)?
    "\"" @punctuation.definition.string.end.ruby)
  @string.quoted.other.interpolated.ruby
  (#set! test.final true))

; Highlight the interpolation inside of a string.
(
  (interpolation
    "#{" @punctuation.section.embedded.begin.ruby
    "}" @punctuation.section.embedded.end.ruby)
  @meta.embedded.line.interpolation.ruby)

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

; Backtick-delimited subshells like `\`ls ${foo}\``.
(
  (subshell
    "`" @punctuation.definition.string.begin.ruby
    (_)?
    "`" @punctuation.definition.string.end.ruby)
  (#set! test.final true))

(subshell) @meta.embedded.line.subshell.ruby @string.quoted.subshell.interpolation.ruby

[
  (bare_string)
  (heredoc_body)
  (heredoc_beginning)
] @string.unquoted.ruby

((heredoc_body) @meta.embedded
  (#set! adjust.endAt lastChild.startPosition))


; LITERALS
; ========

(simple_symbol) @constant.other.symbol.ruby
(bare_symbol) @constant.other.symbol.bare.ruby
(delimited_symbol) @constant.other.symbol.delimited.ruby

((simple_symbol) @punctuation.definition.symbol.ruby
  (#set! adjust.endAfterFirstMatchOf "^:"))

((delimited_symbol) @punctuation.definition.symbol.ruby
  (#set! adjust.endAfterFirstMatchOf "^:"))


(regex) @string.regexp.interpolated.ruby
(regex "/" @punctuation.definition.begin.regexp.ruby
  (#set! test.onlyIfFirst true))
(regex "/" @punctuation.definition.end.regexp.ruby
  (#set! test.onlyIfLast true))

(escape_sequence) @constant.character.escape.ruby

[
  (integer)
  (float)
] @constant.numeric.decimal._TYPE_.ruby

(nil) @constant.language.nil.ruby

[
  (true)
  (false)
] @constant.language.boolean._TYPE_.ruby

; COMMENTS
; ========

((comment) @comment.line.number-sign.ruby
  (#match? @comment.line.number-sign.ruby "^#"))

; Scope the initial `#` of a line comment as punctuation.
((comment) @punctuation.definition.comment.ruby
  (#match? @comment.line.number-sign.ruby "^#")
  (#set! adjust.endAfterFirstMatchOf "^#"))

; For block comments, the `=begin` and `=end` need to be on their own lines
; without leading whitespace, but we don't have to care about this because the
; parser does it for us.
((comment) @comment.block.ruby
  (#match? @comment.block.ruby "^=begin"))

((comment) @punctuation.definition.comment.begin.ruby
  (#match? @punctuation.definition.comment.begin.ruby "^=begin")
  (#set! adjust.endAfterFirstMatchOf "^=begin"))

((comment) @punctuation.definition.comment.end.ruby
  (#match? @punctuation.definition.comment.end.ruby "=end$")
  (#set! adjust.endAfterFirstMatchOf "=end$"))

; KEYWORDS
; ========

"class" @keyword.control.class.ruby
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
  "redo"
  "rescue"
  "retry"
  "return"
  "then"
  "undef"
  "unless"
  "until"
  "when"
  "while"
  "yield"
] @keyword.control._TYPE_.ruby


; OPERATORS
; =========

(splat_parameter "*" @keyword.operator.splat.ruby (#set! test.final true))
(splat_argument "*" @keyword.operator.splat.ruby (#set! test.final true))
(rest_assignment "*" @keyword.operator.splat.ruby (#set! test.final true))

(hash_splat_argument
  "**" @keyword.operator.double-splat.ruby
  (#set! test.final true))
(hash_splat_parameter
  "**" @keyword.operator.double-splat.ruby
  (#set! test.final true))

(singleton_class
  "<<" @keyword.operator.assignment.ruby)

(binary
  "|" @keyword.operator.bitwise.ruby)

(conditional
  ["?" ":"] @keyword.operator.conditional.ruby
  (#set! test.final "true"))

(binary
  ["+" "-" "*" "/" "**"] @keyword.operator.arithmetic.ruby
  (#set! test.final true))

(unary
  ["+" "-" "!" "~" "not" "&" "*"] @keyword.operator.unary.ruby
  (#set! test.final true))

[
  "="
  "||="
  "+="
  "-="
  "<<"
] @keyword.operator.assignment.ruby

[
  "||"
  "&&"
] @keyword.operator.logical.ruby

[
  "&"
] @keyword.operator.other.ruby

[
  "=="
  "==="
  "!="
  ">="
  "<="
  "=~"
  ">"
  "<"
] @keyword.operator.comparison.ruby

"->" @keyword.operator.ruby

; PUNCTUATION
; ===========

(symbol_array
  "%i(" @punctuation.definition.begin.array.other.ruby
  ")" @punctuation.definition.end.array.other.ruby)
(string_array
  "%w(" @punctuation.definition.begin.array.other.ruby
  ")" @punctuation.definition.end.array.other.ruby)

"[" @punctuation.definition.begin.array.bracket.square.ruby
"]" @punctuation.definition.end.array.bracket.square.ruby

(parenthesized_statements
 "(" @punctuation.definition.expression.begin.bracket.round.ruby
 ")" @punctuation.definition.expression.end.bracket.round.ruby)

(hash
 "{" @punctuation.definition.hash.begin.bracket.curly.ruby
 "}" @punctuation.definition.hash.end.bracket.curly.ruby)

(block
 "{" @punctuation.definition.block.begin.bracket.curly.ruby
 "}" @punctuation.definition.block.end.bracket.curly.ruby)

; To distinguish them from the bitwise "|" operator.
(block_parameters
  "|" @punctuation.separator.parameters.begin.ruby
  (#set! test.onlyIfFirst true)
  (#set! test.final true))

(block_parameters
  "|" @punctuation.separator.parameters.end.ruby
  (#set! test.onlyIfLast true)
  (#set! test.final true))

(block_parameters
  "," @punctuation.separator.parameters.ruby
  (#set! test.final true))

"=>" @punctuation.separator.key-value.ruby

";" @punctuation.terminator.statement.ruby

"," @punctuation.separator.comma.ruby
"." @punctuation.separator.dot.ruby
":" @punctuation.separator.colon.ruby

; META
; ====

; Scope the entire inside of a class body; it's semantically useful even though
; it probably won't get highlighted.
(class) @meta.block.class.ruby

; Scoping the entire inside of a block is tricky because we need to define
; different boundaries when block parameters exist than when they don't.
((do_block (block_parameters)) @_IGNORE_
  (#set! hasBlockParameters true)
  ; Adjust the range of this data so that it matches the adjustments needed
  ; when we look it up.
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

((do_block (block_parameters)) @meta.block.ruby
  ; Start after the parameters.
  (#set! adjust.startAt firstNamedChild.endPosition)
  ; End just before `end`.
  (#set! adjust.endAt lastChild.startPosition))

((do_block) @meta.block.ruby
  (#set! test.onlyIfNotRangeWithData hasBlockParameters)
  ; Start just after `do`.
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))
