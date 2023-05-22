;; Collections
(anon_fn_lit
 "(" @punctuation.section.expression.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @entity.name.function @meta.expression
 ")" @punctuation.section.expression.end)

(list_lit
 "(" @punctuation.section.expression.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @entity.name.function @meta.expression
 ")" @punctuation.section.expression.end)

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
@meta.map

; Includes
((sym_name) @meta.symbol (#eq? @meta.symbol "import") (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")) @keyword.control
((sym_name) @meta.symbol (#eq? @meta.symbol "require") (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")) @keyword.control
((sym_name)
 @meta.symbol
 (#eq? @meta.symbol "use")
 (#set! test.onlyIfConfig language-clojure.markDeprecations)
 (#set! test.onlyIfNotDescendantOfNodeWithData clojure.dismissTag))
@invalid.deprecated

((sym_name)
 @meta.symbol
 (#eq? @meta.symbol "use")
 (#set! test.onlyIfNotConfig language-clojure.markDeprecations)
 (#set! test.onlyIfNotDescendantOfNodeWithData clojure.dismissTag))
@keyword.control

((list_lit
  "(" @punctuation.section.expression.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
  .
  (sym_lit) @meta.definition.global @keyword.control (#eq? @meta.definition.global "ns")
  .
  (sym_lit) @meta.definition.global @entity.global
  ")" @punctuation.section.expression.end)
 @meta.namespace.clojure
 (#set! isNamespace true))

(list_lit
  "("
  .
  (kwd_lit) @invalid.deprecated (#eq? @invalid.deprecated ":use")
  (#set! test.onlyIfDescendantOfNodeWithData isNamespace)
  (#set! test.onlyIfConfig language-clojure.markDeprecations))

(list_lit
 "(" @punctuation.section.expression.begin (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "^def")
 .
 (sym_lit) @meta.definition.global @entity.global
 ")" @punctuation.section.expression.end)

((regex_lit) @string.regexp (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((sym_lit) @meta.symbol (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((kwd_lit) @constant.keyword (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((str_lit) @string.quoted.double (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((num_lit) @constant.numeric (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((nil_lit) @constant.numeric (#set! test.onlyIfNotDescendantOfNodeWithData "clojure.dismissTag"))
((bool_lit) @constant.language (#set! test.onlyIfNotDescendantOfNodeWithData clojure.dismissTag))
(comment) @comment.line.semicolon
((dis_expr)
 @comment.block.clojure
 (#set! test.onlyIfConfig language-clojure.dismissTag)
 (#set! clojure.dismissTag true)
 (#set! test.final true))

((list_lit
  "(" @punctuation.section.expression.begin
  .
  (sym_lit) @meta.definition.global @keyword.control (#eq? @keyword.control "comment")
  ")" @punctuation.section.expression.end)
 @comment.block.clojure
 (#set! test.onlyIfConfig language-clojure.commentTag)
 (#set! clojure.dismissTag true))

(list_lit
 "(" @punctuation.section.expression.begin
 .
 (sym_lit) @keyword.control (#eq? @keyword.control "comment")
 (#set! test.onlyIfNotConfig language-clojure.commentTag)
 ")" @punctuation.section.expression.end)

("ERROR" @invalid.illegal)
