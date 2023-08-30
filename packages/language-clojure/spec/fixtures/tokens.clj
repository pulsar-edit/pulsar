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

(def a "A STRING")
  ; <- keyword.control
  ;  ^ entity.global
  ;      ^ string.quoted.double

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

`(call param ~(call))
;  ^ meta.symbol
;  ^ !entity.name.function
;       ^ meta.symbol
;       ^ !entity.name.function
;               ^ entity.name.function

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
