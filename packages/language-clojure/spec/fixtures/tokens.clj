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
  ;      ^ constant.numeric.long

(def a "A STRING")
  ; <- keyword.control
  ;  ^ entity.global
  ;    ^ punctuation.definition.string.begin
  ;      ^ string.quoted.double
  ;             ^ punctuation.definition.string.end

#{'asd}
; <- punctuation.section.set.begin
;  ^ meta.symbol
;     ^ punctuation.section.set.end

{:key "value"}
; <- punctuation.section.map.begin
; ^ constant.keyword
;    ^ meta.map
;            ^ punctuation.section.map.end
