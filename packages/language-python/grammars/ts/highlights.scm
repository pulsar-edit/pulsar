
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


; Builtin
; -------

(call
  (identifier) @support.function.builtin.python
  (#match? @support.function.builtin.python "^(__import__|abs|all|any|ascii|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip|file|long|raw_input|reduce|reload|unichr|unicode|xrange|apply|buffer|coerce|intern|execfile)$")
  (#set! final true))

; Function calls
; --------------

(decorator) @support.other.function.decorator.python
; (decorator) @keyword.other.special-method.decorator.python

(call
  function: (identifier) @support.function.builtin.python
  (#match? @support.function.builtin.python "^(abs|all|any|ascii|bin|bool|breakpoint|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip|__import__)$"))

(call
  function: (attribute
    attribute: (identifier) @support.other.function.python))

(call
  function: (identifier) @support.other.function.python)


; Function definitions
; --------------------

(function_definition
  (identifier) @entity.name.function.magic.python
  (#match? @entity.name.function.magic.python "^__(?:abs|add|and|bool|bytes|call|cmp|coerce|complex|contains|del|delattr|delete|delitem|delslice|dir|div|divmod|enter|eq|exit|float|floordiv|format|ge|get|getattr|getattribute|getitem|getslice|gt|hash|hex|iadd|iand|idiv|ifloordiv|ilshift|imatmul|imod|imul|index|init|instancecheck|int|invert|ior|ipow|irshift|isub|iter|itruediv|ixor|le|len|length_hint|long|lshift|lt|matmul|missing|mod|mul|ne|neg|next|new|nonzero|oct|or|pos|pow|radd|rand|rdiv|rdivmod|repr|reversed|rfloordiv|rlshift|rmatmul|rmod|rmul|ror|round|rpow|rrshift|rshift|rsub|rtruediv|rxor|set|setattr|setitem|setslice|str|sub|subclasscheck|truediv|unicode|xor)__$"))

(attribute
  attribute: (identifier) @support.other.property.python)

(function_definition
  name: (identifier) @entity.name.function.python)


; Type annotations
; ----------------

(function_definition
  (type) @support.storage.type)

(typed_parameter
  (type) @support.storage.type)

(typed_default_parameter
  (type) @support.storage.type)


; COMMENTS
; ========

(comment) @comment.line.number-sign.python
((comment) @punctuation.definition.comment.python
  (#set! endAfterFirstMatchOf "^#"))


; STRINGS
; =======

((string) @string.quoted.triple.block.python
  (#match? @string.quoted.triple.block.python "^\"\"\""))

(string
  _ @punctuation.definition.string.begin.python
  (#set! onlyIfFirst true))

(string
  _ @punctuation.definition.string.end.python
  (#set! onlyIfLast true))

((string) @string.quoted.double.single-line.python
  (#match? @string.quoted.double.single-line.python "^\"(?!\")"))

((string) @string.quoted.single.single-line.python
  (#match? @string.quoted.single.single-line.python "^\'"))

(string_content (escape_sequence) @constant.character.escape.python)

(interpolation
  "{" @punctuation.section.embedded.begin.python
  "}" @punctuation.section.embedded.end.python) @meta.embedded.interpolation.python


; SUPPORT
; =======

((identifier) @support.type.exception.python
  (#match? @support.type.exception.python "^(BaseException|Exception|TypeError|StopAsyncIteration|StopIteration|ImportError|ModuleNotFoundError|OSError|ConnectionError|BrokenPipeError|ConnectionAbortedError|ConnectionRefusedError|ConnectionResetError|BlockingIOError|ChildProcessError|FileExistsError|FileNotFoundError|IsADirectoryError|NotADirectoryError|InterruptedError|PermissionError|ProcessLookupError|TimeoutError|EOFError|RuntimeError|RecursionError|NotImplementedError|NameError|UnboundLocalError|AttributeError|SyntaxError|IndentationError|TabError|LookupError|IndexError|KeyError|ValueError|UnicodeError|UnicodeEncodeError|UnicodeDecodeError|UnicodeTranslateError|AssertionError|ArithmeticError|FloatingPointError|OverflowError|ZeroDivisionError|SystemError|ReferenceError|BufferError|MemoryError|Warning|UserWarning|DeprecationWarning|PendingDeprecationWarning|SyntaxWarning|RuntimeWarning|FutureWarning|ImportWarning|UnicodeWarning|BytesWarning|ResourceWarning|GeneratorExit|SystemExit|KeyboardInterrupt)$")
  (#set! final true))



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

((identifier) @variable.language.self.python
  (#eq? @variable.language.self.python "self")
  (#set! final true))

(keyword_argument
  name: (identifier) @variable.parameter.function.python)

(typed_parameter
  (identifier) @variable.parameter.function.python)

(typed_default_parameter
  (identifier) @variable.parameter.function.python)


; OPERATORS
; =========

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
] @keyword.operator.arithmetic.python

[
  "and"
  "in"
  "is"
  "not"
  "or"
] @keyword.operator.logical.python

(call
  (identifier) @keyword.other._TEXT_.python
  (#match? @keyword.other._TEXT_.python "^(exec|print)$")
  (#set! final true))

(print_statement "print" @keyword.other.print.python)

(attribute "." @keyword.operator.accessor.python)

; PUNCTUATION
; ===========

(function_definition
  ":" @punctuation.definition.function.colon.python
  (#set! final true))

(parameters
  "(" @punctuation.definition.parameters.begin.bracket.round.python
  ")" @punctuation.definition.parameters.end.bracket.round.python
  (#set! final true))

(parameters
  "," @punctuation.separator.parameters.comma.python
  (#set! final true))

(tuple
  "(" @punctuation.definition.tuple.begin.bracket.round.python
  ")" @punctuation.definition.tuple.end.bracket.round.python
  (#set! final true))

(tuple
  "," @punctuation.separator.tuple.comma.python
  (#set! final true))

(dictionary
  "{" @punctuation.definition.dictionary.begin.bracket.curly.python
  "}" @punctuation.definition.dictionary.end.bracket.curly.python
  (#set! final true))

(dictionary
  "," @punctuation.separator.dictionary.comma.python
  (#set! final true))
