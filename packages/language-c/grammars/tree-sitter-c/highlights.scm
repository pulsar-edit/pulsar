
; TYPES
; =====

(type_identifier) @support.other.storage.type.c

; These refer to language constructs and remain in the `storage` namespace.
[
  "enum"
  "struct"
  "typedef"
  "union"
] @storage.type._TYPE_.c

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

(enum_specifier
  name: (type_identifier) @variable.other.declaration.type.c)
(type_definition
  declarator: (_) @variable.other.declaration.type.c)


; TODO:
;
; * TM-style grammar has a lot of `mac-classic` scopes. I doubt they'd be
;   present if this wasn't converted from a TextMate grammar, so I'm leaving
;   them out for now.
;
