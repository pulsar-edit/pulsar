; ((directive
;     "%>" @_IGNORE_
;     (#match! @_IGNORE_ "^$")
;   ) @_IGNORE_
;   (#set! capture.final true))

; We compare these to `firstChild.endPosition` because directives have a habit
; of consuming all their preceding whitespace, including newlines.
([(comment_directive) (directive) (output_directive)] @meta.embedded.block.erb
  (#set! adjust.startBeforeFirstMatchOf "\\S")
  (#is-not? test.endsOnSameRowAs firstChild.endPosition))

([(comment_directive) (directive) (output_directive)] @meta.embedded.line.erb
  (#set! adjust.startBeforeFirstMatchOf "\\S")
  (#is? test.endsOnSameRowAs firstChild.endPosition))

(comment_directive) @comment.block.erb

(directive
  ["<%" "<%-"] @keyword.directive.begin.erb
    (#set! adjust.startBeforeFirstMatchOf "\\S"))

(directive
  ["%>" "-%>"] @keyword.directive.end.erb)

; BUG: Some `directive` nodes are actually represented as `output_directive`
; nodes.
(output_directive
  ["<%=" "<%" "<%-"] @keyword.directive.begin.erb
  (#set! adjust.startBeforeFirstMatchOf "\\S"))

(output_directive
  ["%>" "-%>"] @keyword.directive.end.erb)
