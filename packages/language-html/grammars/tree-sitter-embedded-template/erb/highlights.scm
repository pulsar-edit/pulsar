((directive
    "%>" @_IGNORE_
    (#match! @_IGNORE_ "^$")
  ) @_IGNORE_
  (#set! test.final true))


(comment_directive) @comment.block.erb @meta.embedded

(directive
  ["<%" "<%-"] @keyword.directive.begin.erb
  ["%>" "-%>"] @keyword.directive.end.erb
) @meta.embedded

(output_directive
  ["<%="] @keyword.directive.begin.erb
  ["%>" "-%>"] @keyword.directive.end.erb
) @meta.embedded
