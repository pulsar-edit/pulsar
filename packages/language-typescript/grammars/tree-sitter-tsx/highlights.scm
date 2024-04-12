
; JSX
; ===

; The "Foo" in `<Foo />`.
(jsx_self_closing_element
  name: (identifier) @entity.name.tag.ts.tsx
  ) @meta.tag.ts.tsx

; The "Foo" in `<Foo>`.
(jsx_opening_element
  name: (identifier) @entity.name.tag.ts.tsx) @meta.tag.ts.tsx

; The "Foo.Bar" in `<Foo.Bar>`.
(jsx_opening_element
  name: (nested_identifier) @entity.name.tag.ts.tsx) @meta.tag.ts.tsx

; The "Foo" in `</Foo>`.
(jsx_closing_element
  name: (identifier) @entity.name.tag.ts.tsx) @meta.tag.ts.tsx

; The "Foo.Bar" in `</Foo.Bar>`.
(jsx_closing_element
  name: (nested_identifier) @entity.name.tag.ts.tsx) @meta.tag.ts.tsx

; The "bar" in `<Foo bar={true} />`.
(jsx_attribute
  (property_identifier) @entity.other.attribute-name.ts.tsx)

; The empty tag used as a shorthand for a fragment: `<>`.
(jsx_fragment) @meta.tag.ts.tsx

; The slashes in closing tags should not be interpreted as math operators.
(jsx_self_closing_element "/" @punctuation.definition.tag.end.ts.tsx
  (#set! capture.final true))
(jsx_closing_element "/" @punctuation.definition.tag.end.ts.tsx
  (#set! capture.final true))

; All JSX expressions/interpolations within braces.
((jsx_expression) @meta.embedded.block.ts.tsx
  (#match? @meta.embedded.block.ts.tsx "\\n")
  (#set! capture.final true))

(jsx_expression) @meta.embedded.line.ts.tsx

(jsx_opening_element
  "<" @punctuation.definition.tag.begin.ts.tsx
  ">" @punctuation.definition.tag.end.ts.tsx)

(jsx_closing_element
  "<" @punctuation.definition.tag.begin.ts.tsx
  ">" @punctuation.definition.tag.end.ts.tsx)

(jsx_fragment
  "<" @punctuation.definition.tag.begin.ts.tsx
  ">" @punctuation.definition.tag.end.ts.tsx)

(jsx_self_closing_element
  "<" @punctuation.definition.tag.begin.ts.tsx
  (#set! capture.final true))

((jsx_self_closing_element
  ; The "/>" in `<Foo />`, extended to cover both anonymous nodes at once.
  "/") @punctuation.definition.tag.end.ts.tsx
  (#set! adjust.startAt lastChild.previousSibling.startPosition)
  (#set! adjust.endAt lastChild.endPosition)
  (#set! capture.final true))



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
