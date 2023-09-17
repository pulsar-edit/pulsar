
(function_declarator
    (identifier) @name) @definition.function

(function_declarator
  declarator: (qualified_identifier) @name) @definition.function

(class_specifier
  name: (type_identifier) @name) @definition.class

(class_specifier
  body: (field_declaration_list
    (function_definition
      declarator: (function_declarator
        declarator: (field_identifier) @name)) @definition.method)
    (#set! symbol.contextNode "parent.parent.parent.parent.firstNamedChild"))
