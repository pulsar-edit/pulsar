; ADT definitions

(struct_item
    name: (type_identifier) @name) @definition.class

(enum_item
    name: (type_identifier) @name) @definition.class

(union_item
    name: (type_identifier) @name) @definition.class

; type aliases

(type_item
    name: (type_identifier) @name) @definition.class

(impl_item
  (declaration_list
    (function_item
      name: (identifier) @name)
    (#set! capture.final true)
    (#set! symbol.prependTextForNode parent.parent.parent.firstNamedChild)
    (#set! symbol.joiner " ")))

; method definitions

((declaration_list
    (function_item
        name: (identifier) @name)) @definition.method
    (#set! capture.final true))
; function definitions

(function_item
    name: (identifier) @name) @definition.function

; trait definitions
(trait_item
    name: (type_identifier) @name) @definition.interface

; module definitions
(mod_item
    name: (identifier) @name) @definition.module

; macro definitions

(macro_definition
    name: (identifier) @name) @definition.macro

; references

; (call_expression
;     function: (identifier) @name) @reference.call
;
; (call_expression
;     function: (field_expression
;         field: (field_identifier) @name)) @reference.call
;
; (macro_invocation
;     macro: (identifier) @name) @reference.call

; implementations

(impl_item
    trait: (type_identifier) @name) @reference.implementation

(impl_item
    type: (type_identifier) @name
    !trait) @reference.implementation
