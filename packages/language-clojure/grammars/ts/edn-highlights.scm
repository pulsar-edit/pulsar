;; Metadata
((meta_lit) @meta.metadata.clojure)

;; Collections
(list_lit
 "(" @punctuation.section.list.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
 ")" @punctuation.section.list.end)
@meta.list

(vec_lit
 "[" @punctuation.section.vector.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
 "]" @punctuation.section.vector.end)
@meta.vector

(map_lit
 "{" @punctuation.section.map.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
 "}" @punctuation.section.map.end)
@meta.map

(set_lit
 ("#" "{") @punctuation.section.set.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
 "}" @punctuation.section.set.end)
@meta.set

((regex_lit) @string.regexp (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((sym_lit) @meta.symbol (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((kwd_lit) @constant.keyword (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((str_lit) @string.quoted.double (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((num_lit) @constant.numeric (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((nil_lit) @constant.language (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((bool_lit) @constant.language (#set! test.onlyIfNotDescendantOfNodeWithData clojure.dismissTag))
(comment) @comment.line.semicolon
((dis_expr)
 @comment.block.clojure
 (#set! test.onlyIfConfig language-clojure.dismissTag)
 (#set! clojure.dismissTag true)
 (#set! test.final true))

("ERROR" @invalid.illegal)
