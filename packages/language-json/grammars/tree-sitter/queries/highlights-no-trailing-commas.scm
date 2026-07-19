; TRAILING COMMAS
; ===============

; The strict JSON grammar includes this query, while the JSONC grammar omits it.
; Tree-sitter represents a trailing comma as an error because its parser follows
; strict JSON. Mark only the comma as invalid so other incomplete input remains
; unobtrusive while typing.

(ERROR "," @invalid.illegal.comma.json)
