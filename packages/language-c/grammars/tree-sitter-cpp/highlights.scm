; PREPROCESSOR
; ============

[
  "#if"
  "#ifdef"
  "#ifndef"
  "#endif"
  "#elif"
  "#else"
] @keyword.control.directive.conditional.cpp

"#define" @keyword.control.directive.define.cpp
"#include" @keyword.control.directive.include.cpp

; This will match if the more specific rules above haven't matched. The
; anonymous nodes will match under ideal conditions, but might not be present
; if the parser is flummoxed.
((preproc_directive) @keyword.control.directive.c
  (#set! capture.shy true))

((preproc_ifdef
  (identifier) @entity.name.function.preprocessor.c
  (#match? @entity.name.function.preprocessor.c "[a-zA-Z_$][\\w$]*")))

(preproc_function_def
  (identifier) @entity.name.function.preprocessor.c
  (#set! capture.final true))

(preproc_function_def
  (identifier) @entity.name.function.preprocessor.cpp
  (#set! capture.final true)
)

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


(primitive_type) @storage.type.builtin.cpp

(class_specifier
  (type_identifier) @entity.name.class.cpp
  (#set! capture.final true))

(type_identifier) @storage.type.other.cpp
; (struct_specifier) @storage.type.cpp

; These types are all reserved words; if we see an identifier with this name,
; it must be a type.
((identifier) @storage.type.builtin.cpp
  (#match? @storage.type.builtin.cpp "^(char|int|float|double|long)$"))

; Assume any identifier that ends in `_t` is a type. This convention is not
; always followed, but it's a very strong indicator when it's present.
((identifier) @storage.type.other.cpp
  (#match? @storage.type.other.cpp "_t$"))


[
  "enum"
  "long"
  "short"
  "signed"
  "struct"
  "typedef"
  "union"
  "unsigned"

  "template"
] @storage.type.cpp

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
] @storage.modifier.cpp

(
  (primitive_type) @support.type.stdint.cpp
  (#match? @support.type.stdint.cpp "^(int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|int_least8_t|int_least16_t|int_least32_t|int_least64_t|uint_least8_t|uint_least16_t|uint_least32_t|uint_least64_t|int_fast8_t|int_fast16_t|int_fast32_t|int_fast64_t|uint_fast8_t|uint_fast16_t|uint_fast32_t|uint_fast64_t|intptr_t|uintptr_t|intmax_t|intmax_t|uintmax_t|uintmax_t)$")
)

"typename" @storage.modifier.typename.cpp


; FUNCTIONS
; =========

(function_declarator
  (identifier) @entity.name.function.cpp)

(function_declarator
  (field_identifier) @entity.name.function.method.cpp)

(call_expression
  (identifier) @support.function.c99.cpp
  ; Regex copied from the TM grammar.
  (#match? @support.function.c99.cpp "^(_Exit|(?:nearbyint|nextafter|nexttoward|netoward|nan)[fl]?|a(?:cos|sin)h?[fl]?|abort|abs|asctime|assert|atan(?:[h2]?[fl]?)?|atexit|ato[ifl]|atoll|bsearch|btowc|cabs[fl]?|cacos|cacos[fl]|cacosh[fl]?|calloc|carg[fl]?|casinh?[fl]?|catanh?[fl]?|cbrt[fl]?|ccosh?[fl]?|ceil[fl]?|cexp[fl]?|cimag[fl]?|clearerr|clock|clog[fl]?|conj[fl]?|copysign[fl]?|cosh?[fl]?|cpow[fl]?|cproj[fl]?|creal[fl]?|csinh?[fl]?|csqrt[fl]?|ctanh?[fl]?|ctime|difftime|div|erfc?[fl]?|exit|fabs[fl]?|exp(?:2[fl]?|[fl]|m1[fl]?)?|fclose|fdim[fl]?|fe[gs]et(?:env|exceptflag|round)|feclearexcept|feholdexcept|feof|feraiseexcept|ferror|fetestexcept|feupdateenv|fflush|fgetpos|fgetw?[sc]|floor[fl]?|fmax?[fl]?|fmin[fl]?|fmod[fl]?|fopen|fpclassify|fprintf|fputw?[sc]|fread|free|freopen|frexp[fl]?|fscanf|fseek|fsetpos|ftell|fwide|fwprintf|fwrite|fwscanf|genv|get[sc]|getchar|gmtime|gwc|gwchar|hypot[fl]?|ilogb[fl]?|imaxabs|imaxdiv|isalnum|isalpha|isblank|iscntrl|isdigit|isfinite|isgraph|isgreater|isgreaterequal|isinf|isless(?:equal|greater)?|isw?lower|isnan|isnormal|isw?print|isw?punct|isw?space|isunordered|isw?upper|iswalnum|iswalpha|iswblank|iswcntrl|iswctype|iswdigit|iswgraph|isw?xdigit|labs|ldexp[fl]?|ldiv|lgamma[fl]?|llabs|lldiv|llrint[fl]?|llround[fl]?|localeconv|localtime|log[2b]?[fl]?|log1[p0][fl]?|longjmp|lrint[fl]?|lround[fl]?|malloc|mbr?len|mbr?towc|mbsinit|mbsrtowcs|mbstowcs|memchr|memcmp|memcpy|memmove|memset|mktime|modf[fl]?|perror|pow[fl]?|printf|puts|putw?c(?:har)?|qsort|raise|rand|remainder[fl]?|realloc|remove|remquo[fl]?|rename|rewind|rint[fl]?|round[fl]?|scalbl?n[fl]?|scanf|setbuf|setjmp|setlocale|setvbuf|signal|signbit|sinh?[fl]?|snprintf|sprintf|sqrt[fl]?|srand|sscanf|strcat|strchr|strcmp|strcoll|strcpy|strcspn|strerror|strftime|strlen|strncat|strncmp|strncpy|strpbrk|strrchr|strspn|strstr|strto[kdf]|strtoimax|strtol[dl]?|strtoull?|strtoumax|strxfrm|swprintf|swscanf|system|tan|tan[fl]|tanh[fl]?|tgamma[fl]?|time|tmpfile|tmpnam|tolower|toupper|trunc[fl]?|ungetw?c|va_arg|va_copy|va_end|va_start|vfw?printf|vfw?scanf|vprintf|vscanf|vsnprintf|vsprintf|vsscanf|vswprintf|vswscanf|vwprintf|vwscanf|wcrtomb|wcscat|wcschr|wcscmp|wcscoll|wcscpy|wcscspn|wcsftime|wcslen|wcsncat|wcsncmp|wcsncpy|wcspbrk|wcsrchr|wcsrtombs|wcsspn|wcsstr|wcsto[dkf]|wcstoimax|wcstol[dl]?|wcstombs|wcstoull?|wcstoumax|wcsxfrm|wctom?b|wmem(?:set|chr|cpy|cmp|move)|wprintf|wscanf)$")
  (#set! capture.final true))

; The "foo" in `thing->troz->foo(...)`.
(call_expression
  (field_expression
    field: (field_identifier) @support.other.function.cpp)
  (#set! capture.final true))

(call_expression
  (identifier) @support.other.function.cpp
  (#set! capture.final true))


; STRINGS
; =======

; CAVEAT: tree-sitter-c doesn't identify placeholders like `%c` in strings.
; Candidate for an injection grammar.
(string_literal "\"") @string.quoted.double.cpp

(string_literal
  "\"" @punctuation.definition.string.begin.cpp
  (#is? test.first true))

(string_literal
  "\"" @punctuation.definition.string.end.cpp
  (#is? test.last true))

(char_literal "'") @string.quoted.single.cpp

(char_literal
  "'" @punctuation.definition.string.begin.cpp
  (#is? test.first true))

(char_literal
  "'" @punctuation.definition.string.end.cpp
  (#is? test.last true))

(string_literal (escape_sequence) @constant.character.escape.cpp)
(char_literal (escape_sequence) @constant.character.escape.cpp)

; VARIABLES
; =========

(this) @variable.language.this.cpp

; Declarations and assignments
; ----------------------------

; The "x" in `int x`;
(declaration
  declarator: (identifier) @variable.declaration.cpp)

; The "x" in `int x = y`;
(init_declarator
  declarator: (identifier) @variable.declaration.cpp)

(field_declaration
  (field_identifier) @variable.declaration.cpp)

(field_declaration
  (pointer_declarator
  	(field_identifier) @variable.declaration.cpp))

(field_declaration
  (array_declarator
  	(field_identifier) @variable.declaration.cpp))

(init_declarator
  (pointer_declarator
    (identifier) @variable.declaration.cpp))

(assignment_expression
  left: (identifier) @variable.other.assignment.cpp)

(reference_declarator
  (identifier) @variable.declaration.cpp)

; Function parameters
; -------------------

(preproc_params
  (identifier) @variable.parameter.preprocessor.cpp)

(parameter_declaration
  declarator: (identifier) @variable.parameter.cpp)

(parameter_declaration
  declarator: (pointer_declarator
    declarator: (identifier) @variable.parameter.cpp))

; The "foo" in `const char foo[]` within a parameter list.
(parameter_declaration
  declarator: (array_declarator
    declarator: (identifier) @variable.parameter.cpp))

; The "argv" in `char* argv[]` within a parameter list.
(parameter_declaration
  declarator: (pointer_declarator
    declarator: (array_declarator
      declarator: (identifier) @variable.parameter.cpp)))

; The "size" in `finfo->size`.
(field_expression
  "->"
  field: (field_identifier) @variable.other.member.cpp)

; Common naming idiom for C++ instanced vars: "fMemberName"
; ((identifier) @variable.other.readwrite.member.cpp
;   (#match? @variable.other.readwrite.member.cpp "^(f|m)[A-Z]\\w*$"))



; NUMBERS
; =======

(number_literal) @constant.numeric.cpp

; CONSTANTS
; =========

[
  (null)
  (true)
  (false)
  (nullptr)
] @constant.language._TYPE_.cpp

((identifier) @constant.cpp
  (#match? @constant.cpp "[_A-Z][_A-Z0-9]*$"))


; COMMENTS
; ========

; Match // comments.
((comment) @comment.line.double-slash.cpp
  (#match? @comment.line.double-slash.cpp "^\\s*//"))

((comment) @punctuation.definition.comment.cpp
  (#match? @comment.line.double-slash.cpp "^\\s*//")
  (#set! adjust.startAndEndAroundFirstMatchOf "//"))

; Match /* */ comments.
((comment) @comment.block.cpp
  (#match? @comment.block.cpp "^/\\*"))

((comment) @punctuation.definition.comment.begin.cpp
  (#match? @punctuation.definition.comment.begin.cpp "^/\\*")
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.cpp
  (#match? @punctuation.definition.comment.end.cpp "\\*/$")
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))


; KEYWORDS
; ========

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

(pointer_declarator "*" @keyword.operator.pointer.cpp)
(abstract_pointer_declarator "*" @keyword.operator.pointer.cpp)
(pointer_expression "*" @keyword.operator.pointer.cpp)


"sizeof" @keyword.operator.sizeof.cpp
(pointer_expression "&" @keyword.operator.pointer.cpp)
(reference_declarator "&" @keyword.operator.pointer.cpp)


"=" @keyword.operator.assignment.cpp

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
] @keyword.operator.assignment.compound.cpp

(binary_expression
  ["==" "!=" ">" "<" ">=" "<="] @keyword.operator.comparison.cpp)


["&&" "||"] @keyword.operator.logical.cpp

"++" @keyword.operator.increment.cpp
"--" @keyword.operator.decrement.cpp

(binary_expression
  ["&" "|" "^" "~" "<<" ">>"]
    @keyword.operator.bitwise.cpp)

(binary_expression
  ["<" ">"] @keyword.operator.comparison.cpp)

(binary_expression
  ["+" "-" "*" "/" "%"] @keyword.operator.arithmetic.cpp)

(unary_expression
  ["+" "-" "!"] @keyword.operator.unary.cpp)

(conditional_expression
  ["?" ":"] @keyword.operator.ternary.cpp)

(qualified_identifier
  "::" @keyword.operator.accessor.namespace.cpp)

(field_expression "." @keyword.operator.accessor.dot.cpp)
(preproc_params "..." @keyword.operator.ellipsis.cpp)

; PUNCTUATION
; ===========

";" @punctuation.terminator.statement.cpp

"," @punctuation.separator.comma.cpp
"->" @keyword.operator.accessor.cpp

(parameter_list
  "(" @punctuation.definition.parameters.begin.bracket.round.cpp
  ")" @punctuation.definition.parameters.end.bracket.round.cpp
  (#set! capture.final true))

(parenthesized_expression
  "(" @punctuation.definition.expression.begin.bracket.round.cpp
  ")" @punctuation.definition.expression.end.bracket.round.cpp
  (#set! capture.final true))

(if_statement
  condition: (condition_clause
    "(" @punctuation.definition.expression.begin.bracket.round.cpp
    ")" @punctuation.definition.expression.end.bracket.round.cpp
    (#set! capture.final true)))

"{" @punctuation.definition.block.begin.bracket.curly.cpp
"}" @punctuation.definition.block.end.bracket.curly.cpp
"(" @punctuation.definition.begin.bracket.round.cpp
")" @punctuation.definition.end.bracket.round.cpp
"[" @punctuation.definition.array.begin.bracket.square.cpp
"]" @punctuation.definition.array.end.bracket.square.cpp

; TODO:
;
; * TM-style grammar has a lot of `mac-classic` scopes. I doubt they'd be
;   present if this wasn't converted from a TextMate grammar, so I'm leaving
;   them out for now.
;
