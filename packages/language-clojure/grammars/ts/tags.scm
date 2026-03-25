(list_lit
 "(" (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "defmacro")
 .
 (sym_lit) @name
 ")")  @definition.constructor

(list_lit
 "(" (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "def(protocol|struct|record)")
 .
 (sym_lit) @name
 ")")  @definition.struct

(list_lit
 "(" (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "^def(on[^\s]*|test|macro|n|n-)$")
 .
 (sym_lit) @name
 ")")  @definition.function

(list_lit
 "(" (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "^def(on[^\s]*|test|macro|n|n-)$")
 .
 (sym_lit) @name
 ")")  @definition.variable

(list_lit
 "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "/def.")
 .
 (sym_lit) @name
 ")") @definition.function

(list_lit
 "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "/def")
 .
 (sym_lit) @name
 ")") @definition.variable
