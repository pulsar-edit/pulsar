;; "Special" things
(list_lit
  "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData clojure.dismissTag)
  .
  (sym_lit) @storage.control (#eq? @storage.control "do"))

(list_lit
  "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData clojure.dismissTag)
  .
  (sym_lit) @keyword.control.conditional.if (#eq? @keyword.control.conditional.if "if"))

(list_lit
  "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData clojure.dismissTag)
  .
  (sym_lit) @keyword.control.conditional.when (#eq? @keyword.control.conditional.when "when"))

;; Syntax quoting
((syn_quoting_lit)
  @meta.syntax-quoted
  (#is? test.ancestorTypeNearerThan "syn_quoting_lit unquoting_lit"))

((sym_lit) @meta.symbol.syntax-quoted
  (#is? test.ancestorTypeNearerThan "syn_quoting_lit unquoting_lit")
  (#match? @meta.symbol.syntax-quoted "[^#]$"))

((sym_lit) @meta.symbol.generated
  (#is? test.ancestorTypeNearerThan "syn_quoting_lit unquoting_lit")
  (#match? @meta.symbol.generated "#$"))

;; Function calls
(list_lit
  "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData clojure.dismissTag)
  .
  (sym_lit) @keyword.control.conditional.cond (#match? @keyword.control.conditional.cond "^cond(|.|-{1,2}>)$"))

;; Other function calls
(anon_fn_lit
 "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @entity.name.function @meta.expression
 ")" @punctuation.section.expression.end)

(list_lit
 "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @entity.name.function @meta.expression
 ")" @punctuation.section.expression.end)

; NS things like require
((sym_name) @meta.symbol (#eq? @meta.symbol "import") (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")) @keyword.control
((sym_name) @meta.symbol (#eq? @meta.symbol "require") (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")) @keyword.control

;; USE
((sym_name)
 @meta.symbol
 (#eq? @meta.symbol "use")
 (#is? test.config language-clojure.markDeprecations)
 (#is-not? test.descendantOfNodeWithData clojure.dismissTag))
@invalid.deprecated

((sym_name)
 @meta.symbol
 (#eq? @meta.symbol "use")
 (#is-not? test.config language-clojure.markDeprecations)
 (#is-not? test.descendantOfNodeWithData clojure.dismissTag))
@keyword.control

;; Namespace declaration
((list_lit
  "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
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
  (#is? test.descendantOfNodeWithData isNamespace)
  (#is? test.config language-clojure.markDeprecations))

;; Definition
(list_lit
 "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "^def(test|macro|n|n-|)$")
 .
 (sym_lit) @meta.definition.global @entity.global
 ")" @punctuation.section.expression.end)

(list_lit
 "(" @punctuation.section.expression.begin (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
 .
 (sym_lit) @keyword.control (#match? @keyword.control "/def")
 .
 (sym_lit) @meta.definition.global @entity.global
 ")" @punctuation.section.expression.end)

;; Comment form ("Rich" comments)
((list_lit
  "(" @punctuation.section.expression.begin
  .
  (sym_lit) @meta.definition.global @keyword.control (#eq? @keyword.control "comment")
  ")" @punctuation.section.expression.end)
 @comment.block.clojure
 (#is? test.config language-clojure.commentTag)
 (#set! clojure.dismissTag true))

(list_lit
 "(" @punctuation.section.expression.begin
 .
 (sym_lit) @keyword.control (#eq? @keyword.control "comment")
 (#is-not? test.config language-clojure.commentTag)
 ")" @punctuation.section.expression.end)

;;; COPY-PASTED from edn-highlights.
;; IF you need to add something here, add to edn-highlights
;; and then paste here, but DON'T PASTE the first `list_lit`

;; Collections
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
(str_lit
  "\"" @punctuation.definition.string.begin.clojure
  (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
  (#is? test.first))
(str_lit
  "\"" @punctuation.definition.string.end.clojure
  (#is-not? test.descendantOfNodeWithData "clojure.dismissTag")
  (#is? test.last))
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
