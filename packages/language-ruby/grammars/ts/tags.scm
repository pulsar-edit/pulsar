; Class names
(class
  name: [
    (constant) @name
    (scope_resolution name: (_) @name)
  ]) @definition.class

(singleton_class
  value: [
    (constant) @name
    (scope_resolution name: (_) @name)
  ]) @definition.class

; Module names
(module
  name: [
    (constant) @name
    (scope_resolution
      name: (_) @name)
    ]) @definition.module

; Method names
(method name: (_) @name) @definition.method
(singleton_method name: (_) @name) @definition.method

; Aliased methods
(alias name: (_) @name) @definition.method
