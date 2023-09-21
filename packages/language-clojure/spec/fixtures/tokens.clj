(ns foobar)
; <- punctuation.section.expression.begin
; ^ meta.definition.global
;   ^ entity.global
;         ^ punctuation.section.expression.end

(defn foobar [a b]
  ; <- keyword.control
  ;   ^ entity.global
  ;   ^ meta.definition.global
  ;          ^ punctuation.section.vector.begin
  ;           ^ meta.vector
  ;           ^ meta.symbol
  ;              ^ punctuation.section.vector.end
  (+ a b 10 20))
  ;^ meta.expression
  ;^ entity.name.function
  ;  ^ !entity.name.function
  ;      ^ constant.numeric

(deftest abc (+ a b))
;  ^ keyword.control
;        ^ entity.global

(defmacro abc [a b])
;  ^ keyword.control
;         ^ entity.global

(defaults a)
;  ^ !keyword.control
;         ^ !entity.global

(s/defn foobar [a b])
;  ^ keyword.control
;       ^ entity.global

(def a "A STRING")
  ; <- keyword.control
  ;  ^ entity.global
  ;    ^ punctuation.definition.string.begin
  ;      ^ string.quoted.double
  ;             ^ punctuation.definition.string.end

#{'foo}
; <- punctuation.section.set.begin
;   ^ meta.symbol
;     ^ punctuation.section.set.end

{:key "value"}
; <- punctuation.section.map.begin
; ^ constant.keyword
;    ^ meta.map
;            ^ punctuation.section.map.end

;; Primitives
10
; <- constant.numeric
10.2
; <- constant.numeric
10M
; <- constant.numeric
10N
; <- constant.numeric
10/2
; <- constant.numeric
:key
; <- constant.keyword
symbol
; <- meta.symbol
"A string"
; <- string.quoted.double
#"A regular expression"
; <- string.regexp
nil
; <- constant.language
true
; <- constant.language
false
; <- constant.language
error/
; <- meta.symbol
;    ^ invalid.illegal

;; Quoting
'(call param ~(call))
;  ^ meta.symbol
;  ^ !entity.name.function
;       ^ meta.symbol
;       ^ !entity.name.function
;               ^ meta.symbol
;               ^ !entity.name.function

`(call param param# ~(call something param#))
;  ^ meta.symbol
;  ^ entity.name.function
;       ^ meta.symbol.syntax-quoted
;            ^ meta.symbol.generated
;            ^ !meta.symbol.syntax-quoted
;                     ^ entity.name.function
;                          ^ !meta.syntax-quoted
;                          ^ !meta.symbol.syntax-quoted
;                                    ^ !meta.symbol.generated
(call param param#)
;       ^ !meta.symbol.syntax-quoted
;            ^ !meta.symbol.generated

;; Comments
;   ^ comment.line.semicolon

#_
(+ 1 2 3 (+ 4 5))
;  ^ comment.block
;           ^ comment.block

#_
(+ '1 '(:foo))
;   ^ comment.block
;   ^ !constant.numeric
;       ^ comment.block
;       ^ !constant.keyword

(comment 1 2 3)
;  ^ keyword.control
;        ^ constant.numeric

;; Deprecations
(use '[foo.bar])
; ^ invalid.deprecated


(:use [foo.bar])
; ^ !invalid.deprecated

(ns other.namespace
  (:use [foo.bar]))
;   ^ invalid.deprecated

^{:some :meta} (def foo 10)
;  ^ meta.metadata.clojure

#_
(+ '1 `(+ ba))
;   ^ comment.block
;   ^ !constant.numeric
;      ^ !punctuation
;       ^ comment.block
;       ^ !constant.keyword

;; Special forms (core language features)
(do :foo)
; ^ storage.control
#_
(do :foo)
; ^ !storage.control
(if true 10)
; ^ keyword.control.conditional.if
#_
(if true 10)
; ^ !keyword.control.conditional.if
(when true 10)
; ^ keyword.control.conditional.when
#_
(when true 10)
; ^ !keyword.control.conditional.when
(cond true 10)
; ^ keyword.control.conditional.cond
#_
(cond true 10)
; ^ !keyword.control.conditional.cond
(condp true 10)
; ^ keyword.control.conditional.cond
#_
(condp true 10)
; ^ !keyword.control.conditional.cond
(cond-> true 10)
; ^ keyword.control.conditional.cond
#_
(cond-> true 10)
; ^ !keyword.control.conditional.cond

;; Specific stuff
[js* "console.log('abc');", "'foo'"]
; ^ !keyword.control.js.clojure
;      ^ !support.class.builtin.console.js

(js* "console.log('abc');", "'foo'")
; ^ keyword.control.js.clojure
;      ^ support.class.builtin.console.js
;                   ^ string.quoted.single.js
;                            ^ !string.quoted.single.js

(native/raw "cout << 10;", "10")
;                 ^ keyword.operator.bitwise.cpp
;                    ^ constant.numeric.cpp
;                           ^ !constant.numeric.cpp
;; ^ keyword.control.jank.clojure
