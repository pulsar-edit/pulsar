; HEADINGS
; ========

(setext_heading
  (heading_content) @markup.heading.heading-1.gfm
  (setext_h1_underline) @punctuation.definition.heading-underline.gfm)

(setext_heading
  (heading_content) @markup.heading.heading-2.gfm
  (setext_h2_underline) @punctuation.definition.heading-underline.gfm)

(atx_heading
  (atx_h1_marker) @punctuation.definition.heading.gfm
  ) @markup.heading.heading-1.gfm

(atx_heading
  (atx_h2_marker) @punctuation.definition.heading.gfm
  ) @markup.heading.heading-2.gfm

(atx_heading
  (atx_h3_marker) @punctuation.definition.heading.gfm
  ) @markup.heading.heading-3.gfm

(atx_heading
  (atx_h4_marker) @punctuation.definition.heading.gfm
  ) @markup.heading.heading-4.gfm

(atx_heading
  (atx_h5_marker) @punctuation.definition.heading.gfm
  ) @markup.heading.heading-5.gfm

(atx_heading
  (atx_h6_marker) @punctuation.definition.heading.gfm
  ) @markup.heading.heading-6.gfm


; SECTIONS
; ========

(paragraph) @markup.paragraph.gfm

(thematic_break) @markup.horizontal-rule.gfm

(block_quote) @markup.quote.blockquote.gfm
((block_quote) @punctuation.definition.blockquote.gfm
  (#set! adjust.endAfterFirstMatchOf ">"))


; LISTS
; =====

; `markup.list` gets applied to individual list items, unintuitively. So let's
; scope the entire list. “Tight” vs “Loose” has to do with whether each `<li>`
; has one or more implicit `<p>` tags around it.

[(tight_list) (loose_list)] @meta.list.gfm

((list_item
  (list_marker) @punctuation.definition.list-item.gfm) @markup.list.unnumbered
  ; Instead of matching bullet or minus or plus, any not-digit here is
  ; guaranteed to be an unordered list.
  (#not-match? @punctuation.definition.list-item.gfm "^\\d"))

((list_item
  (list_marker) @punctuation.definition.list-item.gfm) @markup.list.numbered
  (#match? @punctuation.definition.list-item.gfm "^\\d"))

((task_list_item
  (list_marker) @punctuation.definition.list-item.gfm) @markup.list.unnumbered
  ; Instead of matching bullet or minus or plus, any not-digit here is
  ; guaranteed to be an unordered list.
  (#not-match? @punctuation.definition.list-item.gfm "^\\d"))

((task_list_item
  (list_marker) @punctuation.definition.list-item.gfm) @markup.list.numbered
  (#match? @punctuation.definition.list-item.gfm "^\\d"))


; INLINE/REPLACED
; ===============

; The text inside []s in anchors/image syntax.
[(link_text) (image_description)] @string.unquoted.gfm @meta.link.text

(link_label (text) @meta.link.text)

; A URL between ()s in anchor syntax.
(link_destination) @markup.underline.link.gfm
((link) @punctuation.definition.begin.link.bracket.round.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "(?<=\\])\\("))
((link) @punctuation.definition.end.link.bracket.round.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "\\)$"))

((link) @punctuation.definition.begin.link.bracket.square.gfm
  (#set! adjust.endAfterFirstMatchOf "^\\["))
((link) @punctuation.definition.end.link.bracket.square.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "\\](?=\\(|\\[)"))
((link_reference_definition) @punctuation.definition.begin.link.bracket.square.gfm
  (#set! adjust.endAfterFirstMatchOf "^\\["))
((link_reference_definition) @punctuation.definition.end.link.bracket.square.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "\\](?=\\(|\\[)"))
((link_reference_definition) @punctuation.separator.link.colon.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf ":"))

; A URL between <>s in autolink syntax.
(uri_autolink (text) @markup.underline.link.gfm)
((uri_autolink) @punctuation.definition.link.begin.bracket.angle.gfm
  (#set! adjust.endAfterFirstMatchOf "^<"))
((uri_autolink) @punctuation.definition.link.end.bracket.angle.gfm
  (#set! adjust.startBeforeFirstMatchOf ">$"))

; A link title: `[foo](http://example.com "Example web site")`
((link_title) @string.quoted.double.link-title.gfm
  (#match? @string.quoted.double.link-title.gfm "^\"")
  (#set! capture.final true))

((link_title) @punctuation.definition.string.begin.gfm
  (#match? @punctuation.definition.string.begin.gfm "^\"")
  (#set! adjust.endAfterFirstMatchOf "^\""))

((link_title) @punctuation.definition.string.end.gfm
  (#match? @punctuation.definition.string.end.gfm "\"$")
  (#set! adjust.startBeforeFirstMatchOf "\"$"))

; Out of laziness, let's throw all other kinds of link title into the generic
; bin — they are all delimited _somehow_, right?
(link_title) @string.quoted.link-title.gfm

; Link labels in `[foo][bar]` syntax, where `bar` is associated with a URL via
; a subsequent footnote, actually work correctly when one runs "Link: Open" in
; Pulsar, so these should be treated like links.
(link_label) @markup.underline.link.link-label.gfm

(image) @meta.image.gfm


; CODE BLOCKS
; ===========

(code_span) @meta.embedded.line.inline-code.gfm @markup.raw.inline.gfm
(info_string) @storage.modifier.language._TEXT_.gfm

(fenced_code_block
  (code_fence_content) @markup.raw.block.fenced.gfm) @meta.embedded.block.fenced-code.gfm
(indented_code_block) @markup.raw.block.indented.gfm @meta.embedded.block.indented-code.gfm


; BOLD/ITALIC/OTHER
; =================

(emphasis) @markup.italic.gfm
(strong_emphasis) @markup.bold.gfm
(strikethrough) @markup.strike.gfm

((emphasis) @punctuation.delimiter.emphasis.begin.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "^(\\*|_)"))

((emphasis) @punctuation.delimiter.emphasis.end.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "(\\*|_)$"))

((strong_emphasis) @punctuation.delimiter.emphasis.begin.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "^(\\*{2}|_{2})"))

((strong_emphasis) @punctuation.delimiter.emphasis.end.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "(\\*{2}|_{2})$"))

((strikethrough) @punctuation.delimiter.strike.begin.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "^~~"))

((strikethrough) @punctuation.delimiter.strike.begin.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "~~$"))

; HTML
; ====

(html_comment) @comment.block.html

; MISC
; ====

(table) @markup.other.table.gfm
(table_header_row (table_cell) @markup.other.table-cell.header.gfm)
(table_data_row (table_cell) @markup.other.table-cell.data.gfm)

(table_delimiter_row (table_column_alignment) @punctuation.separator.table-row.gfm)


(backslash_escape) @constant.character.escape.gfm
