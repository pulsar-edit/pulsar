; BOLD/ITALIC/OTHER
; ===============

(emphasis) @markup.italic.gfm

(emphasis
  . (emphasis_delimiter) @punctuation.definition.emphasis.begin.gfm)

(emphasis
  (emphasis_delimiter) @punctuation.definition.emphasis.end.gfm .)

(strong_emphasis) @markup.bold.gfm
((strong_emphasis) @punctuation.definition.emphasis.begin.gfm
  (#set! adjust.endAfterFirstMatchOf "^\\*\\*"))
((strong_emphasis) @punctuation.definition.emphasis.end.gfm
  (#set! adjust.startBeforeFirstMatchOf "\\*\\*$"))

(strikethrough) @markup.strike.gfm

((strikethrough) @punctuation.definition.strike.begin.gfm
  (#set! adjust.endAfterFirstMatchOf "^~~"))
((strikethrough) @punctuation.definition.strike.end.gfm
  (#set! adjust.startBeforeFirstMatchOf "~~$"))


; INLINE/REPLACED
; ===============

((uri_autolink) @markup.underline.link
  (#set! adjust.startAfterFirstMatchOf "^<")
  (#set! adjust.endBeforeFirstMatchOf ">$"))

((uri_autolink) @punctuation.definition.begin.uri-autolink.gfm
  (#set! adjust.endAfterFirstMatchOf "^<"))

((uri_autolink) @punctuation.definition.end.uri-autolink.gfm
  (#set! adjust.startBeforeFirstMatchOf ">$"))

((link_text (image (image_description))) @_IGNORE_
  (#set! capture.final))

[(link_text) (image_description)] @string.unquoted.gfm @meta.link.text

; The text inside []s in anchors/image syntax.
(full_reference_link
  (link_label) @markup.underline.link.gfm
  (#set! adjust.startAfterFirstMatchOf "^\\[")
  (#set! adjust.endBeforeFirstMatchOf "]$"))

(image
  (link_destination) @markup.underline.link.gfm)

(inline_link
  (link_destination) @markup.underline.link.gfm)

(link_title) @string.quoted.link-title.gfm


; CODE SPANS
; ==========

(code_span) @meta.embedded.line.inline-code.gfm @markup.raw.inline.gfm

(code_span
  . (code_span_delimiter) @punctuation.definition.begin.string.inline-code.gfm)

(code_span
  (code_span_delimiter) @punctuation.definition.end.string.inline-code.gfm
  .)


; MISC
; ====

(backslash_escape) @constant.character.escape.gfm

(numeric_character_reference) @constant.character.entity.gfm
