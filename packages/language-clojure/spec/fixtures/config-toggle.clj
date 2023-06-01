#_
(+ 1 2 3 (+ 4 5))
;  ^ constant.numeric
;         ^ entity.name.function

(comment 1 2 3)
;  ^ keyword.control
;        ^ comment.block

;; Deprecations
(use '[foo.bar])
; ^ keyword.control
; ^ !invalid.deprecation

(:use [foo.bar])
; ^ !invalid.deprecated

(ns other.namespace
  (:use [foo.bar]))
;   ^ !invalid.deprecated
