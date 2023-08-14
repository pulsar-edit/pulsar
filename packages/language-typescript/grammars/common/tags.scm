(function_declaration
  name: (identifier) @name
  (#set! symbol.tag "function")) @definition.function

(function
  name: (identifier) @name
  (#set! symbol.tag "function")) @definition.function

(method_definition
  name: (property_identifier) @name
  (#set! symbol.tag "method")) @definition.method

(abstract_method_signature
  name: (property_identifier) @name
  (#set! symbol.tag "method")) @definition.method

(class_declaration
  name: (type_identifier) @name
  (#set! symbol.tag "class")) @definition.class

(module
  name: (identifier) @name
  (#set! symbol.tag "module")) @definition.module

(interface_declaration
  name: (type_identifier) @name
  (#set! symbol.tag "interface")) @definition.interface

(function_signature
  name: (identifier) @name
  (#set! symbol.tag "function")) @definition.function
