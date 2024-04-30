(list_lit
 "(" (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "^def(on[^\s]*|test|macro|n|n-|)$")
 .
 (sym_lit) @definition.function
 ")")
