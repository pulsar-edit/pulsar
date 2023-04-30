; Class names
(class
  name: [
    (constant) @name
    (scope_resolution name: (_) @name)
  ])

(singleton_class
  value: [
    (constant) @name
    (scope_resolution name: (_) @name)
  ])

; Module names
(module
  name: [
    (constant) @name
    (scope_resolution
      name: (_) @name)
    ])

; Method names
(method name: (_) @name)
(singleton_method name: (_) @name)

; Aliased methods
(alias name: (_) @name)
