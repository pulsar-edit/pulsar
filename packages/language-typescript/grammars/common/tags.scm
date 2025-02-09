(function_declaration
  name: (identifier) @name
  (#set! symbol.tag "function")) @definition.function

(function_expression
  name: (identifier) @name
  (#set! symbol.tag "function")) @definition.function

(method_definition
  name: [(property_identifier) (private_property_identifier)] @name
  (#set! symbol.tag "method")) @definition.method

(abstract_method_signature
  name: [(property_identifier) (private_property_identifier)] @name
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

(
  (comment)* @doc
  .
  (lexical_declaration
    (variable_declarator
      name: (identifier) @name
      value: [(arrow_function) (function_expression)]) @definition.function)
  (#strip! @doc "^[\\s\\*/]+|^[\\s\\*/]$")
  (#select-adjacent! @doc @definition.function)
)
