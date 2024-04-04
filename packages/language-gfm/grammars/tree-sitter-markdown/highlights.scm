; HEADINGS
; ========

(setext_heading
  heading_content: (_) @markup.heading.heading-1.gfm
  (setext_h1_underline) @punctuation.definition.heading-underline.gfm)

(setext_heading
  heading_content: (_) @markup.heading.heading-2.gfm
  (setext_h2_underline) @punctuation.definition.heading-underline.gfm)

(atx_heading
  (atx_h1_marker)) @markup.heading.heading-1.gfm

(atx_heading
  (atx_h2_marker)) @markup.heading.heading-2.gfm

(atx_heading
  (atx_h3_marker)) @markup.heading.heading-3.gfm

(atx_heading
  (atx_h4_marker)) @markup.heading.heading-4.gfm

(atx_heading
  (atx_h5_marker)) @markup.heading.heading-5.gfm

(atx_heading
  (atx_h6_marker)) @markup.heading.heading-6.gfm


; SECTIONS
; ========

(paragraph) @markup.paragraph.gfm
(thematic_break) @markup.horizontal-rule.gfm

(block_quote) @markup.quote.blockquote.gfm
((block_quote_marker) @punctuation.definition.blockquote.gfm
  (#set! adjust.startAndEndAroundFirstMatchOf "\\S"))


; LISTS
; =====

(list) @meta.list.gfm

(list_item
  (list_marker_dot) @punctuation.definition.list-item.gfm
) @markup.list.numbered

(list_item
  [
    (list_marker_star)
    (list_marker_minus)
    (list_marker_plus)
  ] @punctuation.definition.list-item.gfm
) @markup.list.unnumbered

(task_list_marker_unchecked) @punctuation.definition.task-marker.unchecked.gfm
(task_list_marker_checked) @punctuation.definition.task-marker.unchecked.gfm

; CODE BLOCKS
; ===========

(info_string) @storage.modifier.language._TEXT_.gfm

(fenced_code_block
  (code_fence_content) @markup.raw.block.fenced.gfm) @meta.embedded.block.fenced-code.gfm
(indented_code_block) @markup.raw.block.indented.gfm @meta.embedded.block.indented-code.gfm


; MISC
; ====

(pipe_table) @markup.other.table.gfm
(pipe_table_header
  (pipe_table_cell) @markup.other.table-cell.header.gfm)
(pipe_table_row
  (pipe_table_cell) @markup.other.table-cell.data.gfm)
(pipe_table_delimiter_row
  (pipe_table_delimiter_cell
    (_) @punctuation.separator.table-row.gfm)
)


; Link definitions

(link_reference_definition
  (link_label)
  (link_destination) @markup.underline.link.gfm)

((link_label) @meta.link.text
  (#set! adjust.offsetStart 1)
  (#set! adjust.offsetEnd -1))
