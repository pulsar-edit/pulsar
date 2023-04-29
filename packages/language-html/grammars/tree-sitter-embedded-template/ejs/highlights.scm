
(comment_directive) @comment.block

(output_directive
  ["<%=" "%>"] @keyword.control.directive.output)

((directive
  ["<%" "<%_"] @keyword.control.directive
  ["_%>" "%>"] @keyword.control.directive)
  (#set! test.final true))
