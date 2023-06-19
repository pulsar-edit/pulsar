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
; ^ meta.symbol
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

;; Comments
;   ^ comment.line.semicolon
