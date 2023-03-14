(defn a [a b]
; <- fold_begin.paren
;             ^ fold_new_position.paren
  (+ a b)
  [1
  ; <- fold_begin.vector
  ;  ^ fold_new_position.vector
   2
   3]
  ; ^ fold_end.vector
  {:a 10
  ; <- fold_begin.map
  ;      ^ fold_new_position.map
   :b 20
   :c [1
   ;  ^ fold_begin.inner_vector
   ;     ^ fold_new_position.inner_vector
       2
       3]})
;         ^ fold_end.paren
;        ^ fold_end.map
;       ^ fold_end.inner_vector

#(inner
; <- fold_begin.anon
  ;     ^ fold_new_position.anon
  "function"
  #{:with
  ; <- fold_begin.set
    ;     ^ fold_new_position.set
    :inner
    :set})
;        ^ fold_end.anon
;       ^ fold_end.set
