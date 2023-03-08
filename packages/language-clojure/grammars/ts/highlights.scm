;; Collections
(list_lit
 "(" @punctuation.section.expression.begin
 .
 (sym_lit) @entity.name.function
 ")" @punctuation.section.expression.end)

(vec_lit
 "[" @punctuation.section.vector.begin
 "]" @punctuation.section.vector.end) @meta.vector

(map_lit
 "{" @punctuation.section.map.begin
 "}" @punctuation.section.map.end) @meta.map

(set_lit
 ("#" "{") @punctuation.section.set.begin
 "}" @punctuation.section.set.end) @meta.map

; Includes
((sym_name) @meta.symbol (#eq? @meta.symbol "import")) @keyword.control
((sym_name) @meta.symbol (#eq? @meta.symbol "require")) @keyword.control
((sym_name) @meta.symbol (#eq? @meta.symbol "use")) @keyword.control

(list_lit
 "(" @punctuation.section.expression.begin
 .
 ((sym_lit) @meta.symbol (#eq? @meta.symbol "ns")) @keyword.control @meta.definition.global
 .
 (sym_lit) @meta.definition.global @entity.global
 ")" @punctuation.section.expression.end)

(list_lit
 "(" @punctuation.section.expression.begin
 .
 ((sym_lit) @meta.symbol (#match? @meta.symbol "^def")) @keyword.control
 .
 (sym_lit) @meta.definition.global @entity.global
 ")" @punctuation.section.expression.end)

(sym_lit) @meta.symbol
(kwd_lit) @constant.keyword
(str_lit) @string.quoted.double
(num_lit) @constant.numeric
(comment) @comment.line.semicolon
