; MISC
; ====

; In the JSX construct `<Foo.Bar>`, `Foo.Bar` is treated as a
; `member_expression`. We don't want the ordinary rules for member expressions
; to apply, so we block them off.
;
; TODO: If we wanted to give these segments individual scopes, we'd do that
; here — replacing the `@_IGNORE_`s with scope names.

(jsx_opening_element
  (member_expression
    (identifier) @_IGNORE_
    (property_identifier) @_IGNORE_
      (#set! capture.final)))

(jsx_closing_element
  (member_expression
    (identifier) @_IGNORE_
    (property_identifier) @_IGNORE_
      (#set! capture.final)))

(jsx_self_closing_element
  (member_expression
    (identifier) @_IGNORE_
    (property_identifier) @_IGNORE_
      (#set! capture.final)))

; JSX
; ===

[
  (jsx_self_closing_element)
  (jsx_opening_element)
  (jsx_closing_element)
] @meta.tag.ts.tsx

; The "Foo" in `<Foo />`.
(jsx_self_closing_element
  name: (_) @entity.name.tag.ts.tsx)

; The "Foo" in `<Foo>`.
(jsx_opening_element
  name: (identifier) @entity.name.tag.ts.tsx)

; The "Foo.Bar" in `<Foo.Bar>`.
(jsx_opening_element
  name: (member_expression) @entity.name.tag.ts.tsx)

; The "Foo" in `</Foo>`.
(jsx_closing_element
  name: (identifier) @entity.name.tag.ts.tsx)

; The "Foo.Bar" in `</Foo.Bar>`.
(jsx_closing_element
  name: (member_expression) @entity.name.tag.ts.tsx)

; The "bar" in `<Foo bar={true} />`.
(jsx_attribute
  (property_identifier) @entity.other.attribute-name.ts.tsx)

; The "wat:bar" in `<Foo wat:bar={true} />`.
(jsx_attribute
  (jsx_namespace_name
    (identifier)) @entity.other.attribute-name.namespaced.ts.tsx)

; The "wat" in `<Foo wat:bar={true} />`. Worth tagging with its own scope name
; just in case a theme wants to highlight the namespace differently from the
; rest of the attribute.
(jsx_attribute
  (jsx_namespace_name
    (identifier) @meta.attribute-namespace.ts.tsx
    (#is-not? test.last)))

; All JSX expressions/interpolations within braces.
((jsx_expression) @meta.embedded.block.ts.tsx
  (#match? @meta.embedded.block.ts.tsx "\\n")
  (#set! capture.final))

(jsx_expression) @meta.embedded.line.ts.tsx

(jsx_opening_element
  "<" @punctuation.definition.tag.begin.ts.tsx
  ">" @punctuation.definition.tag.end.ts.tsx)
;
(jsx_closing_element
  "</" @punctuation.definition.tag.begin.ts.tsx
  ">" @punctuation.definition.tag.end.ts.tsx)

(jsx_self_closing_element
  "<" @punctuation.definition.tag.begin.ts.tsx
  "/>" @punctuation.definition.tag.end.ts.tsx
  (#set! capture.final))


; META
; ====

([
  (jsx_opening_element)
  (jsx_closing_element)
] @meta.jsx.inside-tag.ts.tsx
(#set! adjust.startAt firstChild.endPosition))

((jsx_self_closing_element) @meta.jsx.inside-tag.ts.tsx
(#set! adjust.startAt firstChild.endPosition)
(#set! adjust.endAt lastChild.startPosition))

((jsx_element) @meta.block.jsx.ts.tsx
  (#set! adjust.startAt firstChild.endPosition)
  (#set! adjust.endAt lastChild.startPosition))
