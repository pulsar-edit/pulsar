;; Collections
(list_lit
 "(" @punctuation.section.list.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 ")" @punctuation.section.list.end)
@meta.list

(vec_lit
 "[" @punctuation.section.vector.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 "]" @punctuation.section.vector.end)
@meta.vector

(map_lit
 "{" @punctuation.section.map.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 "}" @punctuation.section.map.end)
@meta.map

(set_lit
 ("#" "{") @punctuation.section.set.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 "}" @punctuation.section.set.end)
@meta.set

(meta_lit) @meta.metadata.clojure

((regex_lit) @string.regexp (#is-not? test.descendantOfNodeWithData "clojure.dismissTag"))
((sym_lit) @meta.symbol (#is-not? test.descendantOfNodeWithData "clojure.dismissTag"))
((kwd_lit) @constant.keyword (#is-not? test.descendantOfNodeWithData "clojure.dismissTag"))
((str_lit) @string.quoted.double (#is-not? test.descendantOfNodeWithData "clojure.dismissTag"))
((num_lit) @constant.numeric (#is-not? test.descendantOfNodeWithData "clojure.dismissTag"))
((nil_lit) @constant.language (#is-not? test.descendantOfNodeWithData "clojure.dismissTag"))
((bool_lit) @constant.language (#is-not? test.descendantOfNodeWithData clojure.dismissTag))
(comment) @comment.line.semicolon
((dis_expr)
 @comment.block.clojure
 (#is? test.config language-clojure.dismissTag)
 (#set! clojure.dismissTag true)
 (#set! capture.final true))

("ERROR" @invalid.illegal)
