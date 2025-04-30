; COMMENTS
; ========

; This query file is included for highlights queries for the “JSON” grammar
; only; it is excluded from the “JSON with Comments” grammar. This is what
; marks comments as illegal _unless_ the user has opted into that behavior via
; configuration.

((comment) @invalid.illegal.comment.json
  (#is-not? test.config "language-json.allowCommentsInJsonFiles")
  ; Ensure this doesn't match empty or missing nodes.
  (#match? @invalid.illegal.comment.json ".")
  (#set! capture.final)
)
