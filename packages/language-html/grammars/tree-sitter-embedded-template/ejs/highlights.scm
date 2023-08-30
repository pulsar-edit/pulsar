; We compare these to `firstChild.endPosition` because directives have a habit
; of consuming all their preceding whitespace, including newlines.
([(comment_directive) (directive) (output_directive)] @meta.embedded.block.ejs
  (#set! adjust.startBeforeFirstMatchOf "\\S")
  (#is-not? test.endsOnSameRowAs firstChild.endPosition))

  ([(comment_directive) (directive) (output_directive)] @meta.embedded.line.ejs
    (#set! adjust.startBeforeFirstMatchOf "\\S")
    (#is? test.endsOnSameRowAs firstChild.endPosition))

(comment_directive) @comment.block.ejs

; (output_directive
;   ["<%=" "%>"] @keyword.control.directive.output)
;
(directive
  ["<%" "<%-" "<%_"] @keyword.directive.begin.ejs
  (#set! adjust.startBeforeFirstMatchOf "\\S"))

(directive
  ["_%>" "%>" "-%>"] @keyword.directive.end.ejs)

; BUG: Some `directive` nodes are actually represented as `output_directive`
; nodes.
(output_directive
  ["<%=" "<%" "<%-" "<%_" "<%%"] @keyword.directive.begin.ejs
  (#set! adjust.startBeforeFirstMatchOf "\\S"))

(output_directive
  ["%>" "-%>" "_%>"] @keyword.directive.end.ejs)
