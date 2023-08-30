; TODO: Folds in Markdown files will have to wait until we can add "tags" to
; divided folds. We want an H1 section to be able to fold up everything until
; the next H1 in the file, an H2 to fold up everything until the next H2 _or_
; H1, an H3 to fold up everything until the next H3 _or_ H2 _or_ H1… but this
; is not currently possible.

; (atx_heading (atx_h1_marker)) @fold.start.h1 @fold.end.h1 @fold.end.h2 @fold.end.h3 @fold.end.h4 @fold.end.h5 @fold.end.h6
;
; (atx_heading (atx_h2_marker)) @fold.start.h2 @fold.end.h2 @fold.end.h3 @fold.end.h4 @fold.end.h5 @fold.end.h6
;
; (atx_heading (atx_h3_marker)) @fold.start.h3 @fold.end.h3 @fold.end.h4 @fold.end.h5 @fold.end.h6
;
; (atx_heading (atx_h4_marker)) @fold.start.h4 @fold.end.h4 @fold.end.h5 @fold.end.h6
;
; (atx_heading (atx_h5_marker)) @fold.start.h5 @fold.end.h5 @fold.end.h6
;
; (atx_heading (atx_h6_marker)) @fold.start.h6 @fold.end.h6
;
; ; [(atx_heading) (setext_heading)] @fold.end @fold.start

((list_item) @fold
  (#set! fold.endAt endPosition))
