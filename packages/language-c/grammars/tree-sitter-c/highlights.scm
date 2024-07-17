; PREPROCESSOR
; ============

[
  "#if"
  "#ifdef"
  "#ifndef"
  "#endif"
  "#elif"
  "#else"
] @keyword.control.directive.conditional.c

"#define" @keyword.control.directive.define.c
"#include" @keyword.control.directive.include.c

(["#if" "#ifdef" "#ifndef" "#endif" "#elif" "#else" "#define" "#include"] @punctuation.definition.directive.c
  (#set! adjust.endAfterFirstMatchOf "^#"))

; `preproc_directive` will be used when the parser doesn't recognize the
; directive as one of the above. It's permissive; `#afdfafsdfdfad` would be
; parsed as a `preproc_directive`.
;
; Hence this rule will match if the more specific rules above haven't matched.
; The anonymous nodes will match under ideal conditions, but might not be
; present even when they ought to be _if_ the parser is flummoxed; so this'll
; sometimes catch `#ifdef` and others.
((preproc_directive) @keyword.control.directive.c
  (#set! capture.shy true))

((preproc_directive) @punctuation.definition.directive.c
  (#set! capture.shy true)
  (#set! adjust.endAfterFirstMatchOf "^#"))

; Macro functions are definitely entities.
(preproc_function_def
  (identifier) @entity.name.function.preprocessor.c
  (#set! capture.final true))

; Identifiers in macro definitions are definitely constants.
((preproc_def
  name: (identifier) @constant.preprocessor.c))

; We can also safely treat identifiers as constants in `#ifdef`…
((preproc_ifdef
  (identifier) @constant.preprocessor.c))

; …and `#if` and `#elif`…
(preproc_if
  (binary_expression
    (identifier) @constant.preprocessor.c))
(preproc_elif
  (binary_expression
    (identifier) @constant.preprocessor.c))

; …and `#undef`.
((preproc_call
  directive: (preproc_directive) @_IGNORE_
  argument: (preproc_arg) @constant.preprocessor.c)
  (#eq? @_IGNORE_ "#undef"))

(system_lib_string) @string.quoted.other.lt-gt.include.c
((system_lib_string) @punctuation.definition.string.begin.c
  (#set! adjust.endAfterFirstMatchOf "^<"))
((system_lib_string) @punctuation.definition.string.end.c
  (#set! adjust.startBeforeFirstMatchOf ">$"))


; TYPES
; =====

; WORKAROUND: If we're in an error state, don't trust the parser's designation
; of `type_identifier`. Someone's probably just typing on a new line.
(ERROR
  (type_identifier) @_IGNORE_
  (#set! capture.final true))

(primitive_type) @support.storage.type.builtin.c

; When the user has typed `#define FOO`, the macro injection thinks that `FOO`
; is a type declaration (for some reason). This node structure seems to exist
; only in that unusual and incorrect scenario, so we'll stop it from happening
; so that it doesn't override the underlying `constant.other.c` scope.
(translation_unit
  (type_identifier) @_IGNORE_
  (#set! capture.final))

(type_identifier) @support.other.storage.type.c

; These types are all reserved words; if we see an identifier with this name,
; it must be a type.
((identifier) @support.storage.type.builtin.c
  (#match? @support.storage.type.builtin.c "^(char|int|float|double|long)$"))

; Assume any identifier that ends in `_t` is a type. This convention is not
; always followed, but it's a very strong indicator when it's present.
((identifier) @support.other.storage.type.c
  (#match? @support.other.storage.type.c "_t$"))

; These refer to language constructs and remain in the `storage` namespace.
[
  "enum"
  "struct"
  "typedef"
  "union"
] @storage.type.c

; These refer to value types and go under `support`.
[
  "long"
  "short"
] @support.storage.type.builtin.c

; These act as modifiers to value types and also go under `support`.
[
  "signed"
  "unsigned"
] @support.storage.modifier.builtin.c

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
] @storage.modifier._TYPE_.c

((primitive_type) @support.storage.type.stdint.c
  (#match? @support.storage.type.stdint.c "^(int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|int_least8_t|int_least16_t|int_least32_t|int_least64_t|uint_least8_t|uint_least16_t|uint_least32_t|uint_least64_t|int_fast8_t|int_fast16_t|int_fast32_t|int_fast64_t|uint_fast8_t|uint_fast16_t|uint_fast32_t|uint_fast64_t|intptr_t|uintptr_t|intmax_t|intmax_t|uintmax_t|uintmax_t)$"))

(enum_specifier
  name: (type_identifier) @variable.other.declaration.type.c)
(type_definition
  declarator: (_) @variable.other.declaration.type.c)

; CAVEAT: tree-sitter-c doesn't identify placeholders like `%c` in strings.
; Candidate for an injection grammar.
(string_literal "\"") @string.quoted.double.c

(string_literal
  "\"" @punctuation.definition.string.begin.c
  (#is? test.first true))

(string_literal
  "\"" @punctuation.definition.string.end.c
  (#is? test.last true))

(char_literal "'") @string.quoted.single.c

(char_literal
  "'" @punctuation.definition.string.begin.c
  (#is? test.first true))

(char_literal
  "'" @punctuation.definition.string.end.c
  (#is? test.last true))

(string_literal (escape_sequence) @constant.character.escape.c)
(char_literal (escape_sequence) @constant.character.escape.c)

; VARIABLES
; =========

; Declarations and assignments
; ----------------------------

; The "x" in `int x;`
(declaration
  declarator: (identifier) @variable.other.declaration.c)

; The "x" in `int x = y;`
(init_declarator
  declarator: (identifier) @variable.other.declaration.c)

; The "x" in `SomeType *x;`
; (Should work no matter how many pointers deep we are.)
(pointer_declarator
  declarator: [(identifier) (field_identifier)] @variable.other.declaration.pointer.c
  (#is? test.descendantOfType "declaration field_declaration"))

; An array declarator: the "table" in `int table[4];`
(array_declarator
  declarator: (identifier) @variable.other.declaration.c)

; A member of a struct.
(field_declaration
  (field_identifier) @variable.other.declaration.member.c)

; An attribute in a C99 struct designated initializer:
; the "foo" in `MY_TYPE a = { .foo = true };
(initializer_pair
  (field_designator
    (field_identifier) @variable.other.declaration.member.c))

; (and the associated ".")
(initializer_pair
  (field_designator
    "." @keyword.operator.accessor.c))

(field_declaration
  (pointer_declarator
    (field_identifier) @variable.other.declaration.member.c))

(field_declaration
  (array_declarator
    (field_identifier) @variable.other.declaration.member.c))

(init_declarator
  (pointer_declarator
    (identifier) @variable.other.declaration.member.c))

; The "x" in `x = y;`
(assignment_expression
  left: (identifier) @variable.other.assignment.c)

; The "foo" in `something->foo = "bar";`
(assignment_expression
  left: (field_expression
    field: (field_identifier) @variable.other.member.assignment.c)
    (#set! capture.final))

; Goto label definitions: the "foo" in `foo:` before a statement.
(labeled_statement
  label: (statement_identifier) @entity.name.label.c)

; Goto statements — the "foo" in `goto foo;`
(goto_statement
  label: (statement_identifier) @support.other.label.c)


; Function parameters
; -------------------

(preproc_params
  (identifier) @variable.parameter.preprocessor.c)

; The "foo" in `const char foo` within a parameter list.
(parameter_declaration
  declarator: (identifier) @variable.parameter.c)

; The "foo" in `const char *foo` within a parameter list.
; (Should work no matter how many pointers deep we are.)
(pointer_declarator
  declarator: [(identifier) (field_identifier)] @variable.parameter.pointer.c
  (#is? test.descendantOfType "parameter_declaration"))

; The "foo" in `const char foo[]` within a parameter list.
(parameter_declaration
  declarator: (array_declarator
    declarator: (identifier) @variable.parameter.c))

; The "argv" in `char* argv[]` within a parameter list.
(parameter_declaration
  declarator: (pointer_declarator
    declarator: (array_declarator
      declarator: (identifier) @variable.parameter.c)))

; The "size" in `finfo->size`.
(field_expression
  "->"
  field: (field_identifier) @variable.other.member.c)

; The "bar" in `foo.bar`.
(field_expression
  operator: "."
  field: (field_identifier) @variable.other.member.c)



; FUNCTIONS
; =========

(function_declarator
  (identifier) @entity.name.function.c)

(call_expression
  (identifier) @support.function.c99.c
  ; Regex copied from the TM grammar.
  (#match? @support.function.c99.c "^(_Exit|(?:nearbyint|nextafter|nexttoward|netoward|nan)[fl]?|a(?:cos|sin)h?[fl]?|abort|abs|asctime|assert|atan(?:[h2]?[fl]?)?|atexit|ato[ifl]|atoll|bsearch|btowc|cabs[fl]?|cacos|cacos[fl]|cacosh[fl]?|calloc|carg[fl]?|casinh?[fl]?|catanh?[fl]?|cbrt[fl]?|ccosh?[fl]?|ceil[fl]?|cexp[fl]?|cimag[fl]?|clearerr|clock|clog[fl]?|conj[fl]?|copysign[fl]?|cosh?[fl]?|cpow[fl]?|cproj[fl]?|creal[fl]?|csinh?[fl]?|csqrt[fl]?|ctanh?[fl]?|ctime|difftime|div|erfc?[fl]?|exit|fabs[fl]?|exp(?:2[fl]?|[fl]|m1[fl]?)?|fclose|fdim[fl]?|fe[gs]et(?:env|exceptflag|round)|feclearexcept|feholdexcept|feof|feraiseexcept|ferror|fetestexcept|feupdateenv|fflush|fgetpos|fgetw?[sc]|floor[fl]?|fmax?[fl]?|fmin[fl]?|fmod[fl]?|fopen|fpclassify|fprintf|fputw?[sc]|fread|free|freopen|frexp[fl]?|fscanf|fseek|fsetpos|ftell|fwide|fwprintf|fwrite|fwscanf|genv|get[sc]|getchar|gmtime|gwc|gwchar|hypot[fl]?|ilogb[fl]?|imaxabs|imaxdiv|isalnum|isalpha|isblank|iscntrl|isdigit|isfinite|isgraph|isgreater|isgreaterequal|isinf|isless(?:equal|greater)?|isw?lower|isnan|isnormal|isw?print|isw?punct|isw?space|isunordered|isw?upper|iswalnum|iswalpha|iswblank|iswcntrl|iswctype|iswdigit|iswgraph|isw?xdigit|labs|ldexp[fl]?|ldiv|lgamma[fl]?|llabs|lldiv|llrint[fl]?|llround[fl]?|localeconv|localtime|log[2b]?[fl]?|log1[p0][fl]?|longjmp|lrint[fl]?|lround[fl]?|malloc|mbr?len|mbr?towc|mbsinit|mbsrtowcs|mbstowcs|memchr|memcmp|memcpy|memmove|memset|mktime|modf[fl]?|perror|pow[fl]?|printf|puts|putw?c(?:har)?|qsort|raise|rand|remainder[fl]?|realloc|remove|remquo[fl]?|rename|rewind|rint[fl]?|round[fl]?|scalbl?n[fl]?|scanf|setbuf|setjmp|setlocale|setvbuf|signal|signbit|sinh?[fl]?|snprintf|sprintf|sqrt[fl]?|srand|sscanf|strcat|strchr|strcmp|strcoll|strcpy|strcspn|strerror|strftime|strlen|strncat|strncmp|strncpy|strpbrk|strrchr|strspn|strstr|strto[kdf]|strtoimax|strtol[dl]?|strtoull?|strtoumax|strxfrm|swprintf|swscanf|system|tan|tan[fl]|tanh[fl]?|tgamma[fl]?|time|tmpfile|tmpnam|tolower|toupper|trunc[fl]?|ungetw?c|va_arg|va_copy|va_end|va_start|vfw?printf|vfw?scanf|vprintf|vscanf|vsnprintf|vsprintf|vsscanf|vswprintf|vswscanf|vwprintf|vwscanf|wcrtomb|wcscat|wcschr|wcscmp|wcscoll|wcscpy|wcscspn|wcsftime|wcslen|wcsncat|wcsncmp|wcsncpy|wcspbrk|wcsrchr|wcsrtombs|wcsspn|wcsstr|wcsto[dkf]|wcstoimax|wcstol[dl]?|wcstombs|wcstoull?|wcstoumax|wcsxfrm|wctom?b|wmem(?:set|chr|cpy|cmp|move)|wprintf|wscanf)$")
  (#set! capture.final true))

; The "foo" in `thing->troz->foo(...)`.
(call_expression
  (field_expression
    field: (field_identifier) @support.other.function.c)
    (#set! capture.final true))

(call_expression
  (identifier) @support.other.function.c
  (#set! capture.final true))

; NUMBERS
; =======

(number_literal) @constant.numeric.c


; CONSTANTS
; =========

[
  (null)
  (true)
  (false)
] @constant.language._TYPE_.c

; Don't try to scope (e.g.) `int FOO = 1` as a constant when the user types `=`
; but has not typed the value yet.
(ERROR
  (identifier) @_IGNORE_
  (#set! capture.final))

; In most languages we wouldn't be making the assumption that an all-caps
; identifier should be treated as a constant. But those languages don't have
; macro preprocessors. The convention is decently strong in C/C++ that all-caps
; identifiers will refer to `#define`d things.
((identifier) @constant.other.c
  (#match? @constant.other.c "^[_A-Z][_A-Z0-9]*$")
  (#set! capture.shy))


; COMMENTS
; ========

; Match // comments.
((comment) @comment.line.double-slash.c
  (#match? @comment.line.double-slash.c "^\\s*//"))

((comment) @punctuation.definition.comment.c
  (#match? @comment.line.double-slash.c "^\\s*//")
  (#set! adjust.startAndEndAroundFirstMatchOf "//"))

; Match /* */ comments.
((comment) @comment.block.c
  (#match? @comment.block.c "^/\\*"))

((comment) @punctuation.definition.comment.begin.c
  (#match? @punctuation.definition.comment.begin.c "^/\\*")
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.c
  (#match? @punctuation.definition.comment.end.c "\\*/$")
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))


[
  "break"
  "case"
  "continue"
  "default"
  "do"
  "else"
  "for"
  "goto"
  "if"
  "return"
  "switch"
  "while"
] @keyword.control._TYPE_.c

; OPERATORS
; =========

(pointer_declarator "*" @keyword.operator.pointer.c)
(abstract_pointer_declarator "*" @keyword.operator.pointer.c)
(pointer_expression "*" @keyword.operator.pointer.c)

"sizeof" @keyword.operator.sizeof.c
(pointer_expression "&" @keyword.operator.pointer.c)

"=" @keyword.operator.assignment.c

[
  "%="
  "+="
  "-="
  "*="
  "/="
  "&="
  "^="
  "<<="
  ">>="
  "|="
] @keyword.operator.assignment.compound.c


(binary_expression
  ["==" "!=" ">" "<" ">=" "<="] @keyword.operator.comparison.c)

(binary_expression
  ["&" "|" "^" "~" "<<" ">>"]
    @keyword.operator.bitwise.c)

"++" @keyword.operator.increment.c
"--" @keyword.operator.decrement.c

(binary_expression ["+" "-" "*" "/" "%"] @keyword.operator.arithmetic.c)
(unary_expression ["+" "-" "!"] @keyword.operator.unary.c)

(conditional_expression
  ["?" ":"] @keyword.operator.ternary.c)


["||" "&&"] @keyword.operator.logical.c

(field_expression "." @keyword.operator.accessor.dot.c)
(field_expression "->" @keyword.operator.accessor.c)
(preproc_params "..." @keyword.operator.ellipsis.c)

; PUNCTUATION
; ===========

";" @punctuation.terminator.statement.c

("," @punctuation.separator.comma.c
  (#set! capture.shy))
("->" @keyword.operator.accessor.pointer-access.c
  (#set! capture.shy))

(parameter_list
  "(" @punctuation.definition.parameters.begin.bracket.round.c
  ")" @punctuation.definition.parameters.end.bracket.round.c
  (#set! capture.final true))

(parenthesized_expression
  "(" @punctuation.definition.expression.begin.bracket.round.c
  ")" @punctuation.definition.expression.end.bracket.round.c
  (#set! capture.final true))

(if_statement
  condition: (parenthesized_expression
    "(" @punctuation.definition.expression.begin.bracket.round.c
    ")" @punctuation.definition.expression.end.bracket.round.c
    (#set! capture.final true)))

"{" @punctuation.definition.block.begin.bracket.curly.c
"}" @punctuation.definition.block.end.bracket.curly.c
"(" @punctuation.definition.begin.bracket.round.c
")" @punctuation.definition.end.bracket.round.c
"[" @punctuation.definition.array.begin.bracket.square.c
"]" @punctuation.definition.array.end.bracket.square.c


; META
; ====

((compound_statement) @meta.block.c
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

((enumerator_list) @meta.block.enum.c
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

((field_declaration_list) @meta.block.field.c
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))

; TODO:
;
; * TM-style grammar has a lot of `mac-classic` scopes. I doubt they'd be
;   present if this wasn't converted from a TextMate grammar, so I'm leaving
;   them out for now.
;
