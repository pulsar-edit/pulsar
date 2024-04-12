; When dealing with a self-closing element that spans multiple lines, this lets
; us fold the attribute list.
;
; This query captures elements that happen to be self-closing but don't end
; with an XHTML-style ` />`. Because `tree-sitter-html` doesn't distinguish
; these from elements that can have content, we have to check the tag name to
; know how to treat these.

((element
  (start_tag
    (tag_name) @_IGNORE_) @fold)
  (#match? @_IGNORE_ "^(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$")
)

; This one captures the XHTML-style nodes.
(self_closing_tag) @fold


; TODO: Right now, the fold cache doesn't work properly when a given range
; satisfies more than one fold. We should employ `ScopeResolver` to fix this.

; Fold up all of
;
; <div
;   foo="bar"
;   baz="thud">
;
; </div>
;
; with the fold indicator appearing on whichever line has the `>` that closes
; the opening tag.
;
; Usually this'll be the same line on which the tag opened; but when it isn't,
; this allows for the attribute list of the opening element to be folded
; separately from the element's contents.
;

(element
  (start_tag
    (tag_name) @_IGNORE_
     ">" @fold)
  (#not-match? @_IGNORE_ "^(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$")
  (#set! fold.endAt parent.parent.lastNamedChild.startPosition)
  (#set! fold.adjustToEndOfPreviousRow true)
)


; When we have…
;
; <div
;   foo="bar"
;   baz="thud"
; >
;
; </div>
;
; …we can put a fold indicator on the line with `<div` and use it to fold up
; all of a start tag's attributes.
;
; We keep the end of the fold on a separate line because otherwise we lose the
; ability to independently toggle the folding of the element's contents.
;
(element
  (start_tag
    (tag_name) @_IGNORE_) @fold
  (#not-match? @_IGNORE_ "^(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$")
  (#set! fold.endAt lastChild.startPosition)
  (#set! fold.adjustToEndOfPreviousRow true))


[
  (script_element)
  (style_element)
] @fold


((comment) @fold
  (#set! fold.endAt endPosition)
  (#set! fold.offsetEnd -3))
