; TODO
; ====
;
; * numbers: hex, octal, binary, and log versions of each
; * long integers
; * complex numbers
; * how to scope import identifiers?


; CAVEATS
; =======
;
; * No support for highlighting replacement fields in `String.format` calls
;   because `tree-sitter-python` doesn't parse them at all. Would need a
;   special-purpose tree-sitter parser in an injection.
;
; * The TM grammar highlighted any strings that looked like SQL; this could
;   be supported via an injection.

; SUPPORT
; =======

((identifier) @support.type.exception.python
  (#match? @support.type.exception.python "^(BaseException|Exception|TypeError|StopAsyncIteration|StopIteration|ImportError|ModuleNotFoundError|OSError|ConnectionError|BrokenPipeError|ConnectionAbortedError|ConnectionRefusedError|ConnectionResetError|BlockingIOError|ChildProcessError|FileExistsError|FileNotFoundError|IsADirectoryError|NotADirectoryError|InterruptedError|PermissionError|ProcessLookupError|TimeoutError|EOFError|RuntimeError|RecursionError|NotImplementedError|NameError|UnboundLocalError|AttributeError|SyntaxError|IndentationError|TabError|LookupError|IndexError|KeyError|ValueError|UnicodeError|UnicodeEncodeError|UnicodeDecodeError|UnicodeTranslateError|AssertionError|ArithmeticError|FloatingPointError|OverflowError|ZeroDivisionError|SystemError|ReferenceError|BufferError|MemoryError|Warning|UserWarning|DeprecationWarning|PendingDeprecationWarning|SyntaxWarning|RuntimeWarning|FutureWarning|ImportWarning|UnicodeWarning|BytesWarning|ResourceWarning|GeneratorExit|SystemExit|KeyboardInterrupt)$")
  (#set! capture.final true))

; These methods have magic interpretation by python and are generally called
; indirectly through syntactic constructs.
((identifier) @support.function.magic.python
  (#match? @support.function.magic.python "^__(abs|add|and|bool|bytes|call|cmp|coerce|complex|contains|del|delattr|delete|delitem|delslice|dir|div|divmod|enter|eq|exit|float|floordiv|format|ge|get|getattr|getattribute|getitem|getslice|gt|hash|hex|iadd|iand|idiv|ifloordiv|ilshift|imatmul|imod|imul|index|init|instancecheck|int|invert|ior|ipow|irshift|isub|iter|itruediv|ixor|le|len|length_hint|long|lshift|lt|matmul|missing|mod|mul|ne|neg|next|new|nonzero|oct|or|pos|pow|radd|rand|rdiv|rdivmod|repr|reversed|rfloordiv|rlshift|rmatmul|rmod|rmul|ror|round|rpow|rrshift|rshift|rsub|rtruediv|rxor|set|setattr|setitem|setslice|str|sub|subclasscheck|truediv|unicode|xor)__$")
  (#is? test.descendantOfType call)
  (#set! capture.final true))

; Magic variables which a class/module may have.
((identifier) @support.variable.magic.python
  (#match? @support.variable.magic.python "^__(all|annotations|bases|class|closure|code|debug|dict|doc|file|func|globals|kwdefaults|members|metaclass|methods|module|name|qualname|self|slots|weakref)__$"))

(call
  function: (identifier) @support.type.constructor.python
  (#match? @support.type.constructor.python "^[A-Z][a-z_]+")
  (#set! capture.final true))

(call
  function: (attribute
    attribute: (identifier) @support.type.constructor.python)
    (#match? @support.type.constructor.python "^[A-Z][a-z_]+")
    (#set! capture.final true))

(call
  (identifier) @support.function.builtin.python
  (#match? @support.function.builtin.python "^(__import__|abs|all|any|ascii|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip|file|long|raw_input|reduce|reload|unichr|unicode|xrange|apply|buffer|coerce|intern|execfile)$")
  (#set! capture.final true))

; `NotImplemented` is a constant, but is not recognized as such by the parser.
((identifier) @constant.language.not-implemented.python
  (#eq? @constant.language.not-implemented.python "NotImplemented")
  (#set! capture.final true))

; `Ellipsis` is also a constant, and though there don't seem to be any use
; cases for using it directly instead of `...`, we should at least mark it as a
; constant because that's how it'll be interpreted by Python.
((identifier) @constant.language.ellipsis.python
  (#eq? @constant.language.ellipsis.python "Ellipsis")
  (#set! capture.final true))


; CLASSES
; =======

((identifier) @constant.other.python
  (#match? @constant.other.python "^[A-Z][A-Z_]*$")
  (#set? final true))

; ((identifier) @support.class.python
;   (#match? @support.class.python "^[A-Z]"))

; CLASSES
; =======

; The "class" and "Foo" in `class Foo():`
(class_definition
  "class" @storage.type.class.python
  name: (identifier) @entity.name.type.class.python)

; The "Bar" in `class Foo(Bar):`
(class_definition
  superclasses: (argument_list
    (identifier) @entity.other.inherited-class.python))


; FUNCTIONS
; =========

(function_definition "def" @storage.type.function.python)

; Lambdas
; -------

(lambda ":") @punctuation.definition.function.lambda.colon.python


; Function calls
; --------------

; An entire decorator without arguments, like `@foo`.
(decorator "@" (identifier) .) @support.other.function.decorator.python

; A namespaced decorator, like the `@foo` in `@foo.bar`, with or without a
; function invocation.
((decorator [(attribute) (call)]) @support.other.function.decorator.python
  (#set! adjust.endAfterFirstMatchOf "\\."))

; The "@" and "foo" together in a decorator with arguments, like `@foo(True)`.
((decorator "@" (call function: (identifier))) @support.other.function.decorator.python
  (#set! adjust.endAt firstNamedChild.firstNamedChild.endPosition))

; Claim the "foo" in `@foo(True)` so it doesn't get scoped like an ordinary
; function call.
(decorator
  (call
    function: (identifier) @_IGNORE_
    (#set! capture.final true)))

(call
  function: (attribute
    attribute: (identifier) @support.other.function.python)
    (#set! capture.final true))

(call
  function: (identifier) @support.other.function.python)


; Function definitions
; --------------------

(function_definition
  (identifier) @entity.name.function.magic.python
  (#match? @entity.name.function.magic.python "^__(?:abs|add|and|bool|bytes|call|cmp|coerce|complex|contains|del|delattr|delete|delitem|delslice|dir|div|divmod|enter|eq|exit|float|floordiv|format|ge|get|getattr|getattribute|getitem|getslice|gt|hash|hex|iadd|iand|idiv|ifloordiv|ilshift|imatmul|imod|imul|index|init|instancecheck|int|invert|ior|ipow|irshift|isub|iter|itruediv|ixor|le|len|length_hint|long|lshift|lt|matmul|missing|mod|mul|ne|neg|next|new|nonzero|oct|or|pos|pow|radd|rand|rdiv|rdivmod|repr|reversed|rfloordiv|rlshift|rmatmul|rmod|rmul|ror|round|rpow|rrshift|rshift|rsub|rtruediv|rxor|set|setattr|setitem|setslice|str|sub|subclasscheck|truediv|unicode|xor)__$"))

(attribute
  attribute: (identifier) @support.other.property.python)

(attribute
  attribute: (identifier) @constant.other.property.python
    (#match? @constant.other.property.python "^[A-Z][A-Z_]*$"))

(function_definition
  name: (identifier) @entity.name.function.python)


; Type annotations
; ----------------

(function_definition
  (type) @support.storage.type.python)

(typed_parameter
  (type) @support.storage.type.python)

(typed_default_parameter
  (type) @support.storage.type.python)


; COMMENTS
; ========

(comment) @comment.line.number-sign.python
((comment) @punctuation.definition.comment.python
  (#set! adjust.endAfterFirstMatchOf "^#"))

; DICTIONARIES
; ============

(dictionary
  (pair
    key: (identifier) @entity.other.attribute-name.python))

; STRINGS
; =======

; Each kind of string (single-, double-, triple-quoted) can have certain
; prefixes. Luckily, there are limits to how these prefixes can be combined;
; format strings, for instance, are new in Python 3 and are implicitly Unicode,
; so there's no such thing as an `fu` string.
;
; All format strings can be optionally raw, so we need to treat `f` and `fr`
; similarly here. No need to account for the rawness of a string in the scope
; name unless someone requests that feature.

((string) @string.quoted.triple.block.python
  (#match? @string.quoted.triple.block.python "^[bBrRuU]*\"\"\""))

((string) @string.quoted.triple.block.format.python
  (#match? @string.quoted.triple.block.format.python "^[fFrR]*\"\"\""))

((string) @string.quoted.double.single-line.python
  (#match? @string.quoted.double.single-line.python "^[bBrRuU]*\"(?!\")"))

((string) @string.quoted.double.single-line.format.python
  (#match? @string.quoted.double.single-line.format.python "^[fFrR]*\""))

((string) @string.quoted.single.single-line.python
  (#match? @string.quoted.single.single-line.python "^[bBrRuU]*\'"))

((string) @string.quoted.single.single-line.format.python
  (#match? @string.quoted.single.single-line.format.python "^[fFrR]*?\'"))

(string_content (escape_sequence) @constant.character.escape.python)

(interpolation
  "{" @punctuation.section.embedded.begin.python
  "}" @punctuation.section.embedded.end.python) @meta.embedded.line.interpolation.python

(string
  _ @punctuation.definition.string.begin.python
  (#is? test.first true))

(string
  _ @punctuation.definition.string.end.python
  (#is? test.last true))

(string prefix: _ @storage.type.string.python
  (#match? @storage.type.string.python "^[bBfFrRuU]+")
  (#set! adjust.endAfterFirstMatchOf "^[bBfFrRuU]+"))


; CONSTANTS
; =========

[(none) (true) (false)] @constant.builtin._TYPE_.python


; NUMBERS
; =======

(integer) @constant.numeric.integer.python
(float) @constant.numeric.float.python


; KEYWORDS
; ========

[
  "if"
  "elif"
  "else"
] @keyword.control.conditional._TYPE_.python

[
  "async"
  "await"
  "pass"
  "return"
  "with"
] @keyword.control.statement._TYPE_.python

[
  "continue"
  "for"
  "while"
  "yield"
] @keyword.control.repeat._TYPE_.python

"import" @keyword.control.import.python
"from" @keyword.control.import.from.python

[
  "except"
  "finally"
  "try"
] @keyword.control.exception._TYPE_.python

[
  "global"
  "nonlocal"
] @keyword.control.scope._TYPE_.python

[
  "as"
  "assert"
  "case"
  "del"
  "lambda"
  "match"
] @keyword.control._TYPE_.python

[
  "raise"
] @keyword.control._TYPE_.python


; VARIABLES
; =========

(parameters
  (identifier) @variable.parameter.function.python)

(parameters
  (default_parameter
    (identifier) @variable.parameter.function.python))

(parameters
  (list_splat_pattern
    (identifier) @variable.parameter.function.python))


; `self` and `cls` are just conventions, but they are _strong_ conventions.
((identifier) @variable.language.self.python
  (#eq? @variable.language.self.python "self")
  (#set! capture.final true))

((identifier) @variable.language.cls.python
  (#eq? @variable.language.cls.python "cls")
  (#set! capture.final true))

(keyword_argument
  name: (identifier) @variable.parameter.function.python)

(typed_parameter
  (identifier) @variable.parameter.function.python)

(typed_default_parameter
  (identifier) @variable.parameter.function.python)

(lambda_parameters
  (identifier) @variable.parameter.function.lambda.python)

(lambda_parameters
  (default_parameter
    (identifier) @variable.parameter.function.lambda.python))

(lambda_parameters
  (list_splat_pattern
    (identifier) @variable.parameter.function.lambda.python))

(assignment
  left: (identifier) @variable.other.assignment.python)

; The "a" and "b" in `a, b = 2, 3`.
(assignment
  left: (pattern_list
    (identifier) @variable.other.assignment.python))

; OPERATORS
; =========

(list_splat_pattern "*" @keyword.operator.splat.python
  (#set! capture.final true))

"=" @keyword.operator.assignment.python

[
  "-="
  "*="
  "**="
  "/="
  "//="
  "%="
  "+="
  ":="
] @keyword.operator.assignment.compound.python

["&" "|" "^" "~" "<<"] @keyword.operator.bitwise.python

"->" @keyword.operator.function-annotation.python

[
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
] @keyword.operator.comparison.python

"<>" @keyword.operator.comparison.python @invalid.deprecated.python

[
  "+"
  "-"
  "/"
  "*"
  "**"
  "//"
  "%"
] @keyword.operator.arithmetic.python

[
  "and"
  "in"
  "is"
  "not"
  "or"
] @keyword.operator.logical._TYPE_.python

"is not" @keyword.operator.logical.is-not.python

(call
  (identifier) @keyword.other._TEXT_.python
  (#match? @keyword.other._TEXT_.python "^(exec|print)$")
  (#set! capture.final true))

(print_statement "print" @keyword.other.print.python)

(attribute "." @keyword.operator.accessor.python)


; PUNCTUATION
; ===========

(subscript
  "[" @punctuation.definition.subscript.begin.bracket.square.python
  "]" @punctuation.definition.subscript.end.bracket.square.python)

(list
  "[" @punctuation.definition.list.begin.bracket.square.python
  "]" @punctuation.definition.list.end.bracket.square.python)


(slice ":" @punctuation.separator.slice.colon.python)

(function_definition
  ":" @punctuation.definition.function.colon.python
  (#set! capture.final true))

(dictionary (pair ":" @puncutation.separator.key-value.python))

(parameters
  "(" @punctuation.definition.parameters.begin.bracket.round.python
  ")" @punctuation.definition.parameters.end.bracket.round.python
  (#set! capture.final true))

(parameters
  "," @punctuation.separator.parameters.comma.python
  (#set! capture.final true))

(pattern_list "," @punctuation.separator.destructuring.comma.python)

(argument_list
  "(" @punctuation.definition.arguments.begin.bracket.round.python
  ")" @punctuation.definition.arguments.end.bracket.round.python
  (#set! capture.final true))

(argument_list
  "," @punctuation.separator.arguments.comma.python
  (#set! capture.final true))

(tuple
  "(" @punctuation.definition.tuple.begin.bracket.round.python
  ")" @punctuation.definition.tuple.end.bracket.round.python
  (#set! capture.final true))

(tuple
  "," @punctuation.separator.tuple.comma.python
  (#set! capture.final true))

(dictionary
  "{" @punctuation.definition.dictionary.begin.bracket.curly.python
  "}" @punctuation.definition.dictionary.end.bracket.curly.python
  (#set! capture.final true))

(dictionary
  "," @punctuation.separator.dictionary.comma.python
  (#set! capture.final true))
