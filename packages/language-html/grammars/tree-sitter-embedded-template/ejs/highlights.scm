
; (
;   (comment_directive) @comment.block
; )

(comment_directive) @comment.block

(output_directive
  ["<%=" "%>"] @keyword.control.directive.output
)

(
  (directive
    ["<%" "<%_"] @keyword.control.directive
    ["_%>" "%>"] @keyword.control.directive
  )
  (#set! final true)
)

; (
;
;   (#set! onlyIfNotChildOfType comment_directive)
; )
