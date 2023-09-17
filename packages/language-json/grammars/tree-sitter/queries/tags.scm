

; All JSON keys are symbols as long as they descend from a chain of objects.
; Nested keys try to prepend the symbol name of their parent's key.
(pair key: (string (string_content) @name
  (#is-not? test.descendantOfType "array")
  (#set! symbol.tag "property")
  (#set! symbol.prependSymbolForNode parent.parent.parent.previousNamedSibling.firstNamedChild)
  (#set! symbol.contextNode parent.parent.parent.previousNamedSibling.firstNamedChild)
  (#set! symbol.joiner ".")))
