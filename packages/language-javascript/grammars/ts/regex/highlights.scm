; CAVEATS:
;
; * No support for lookbehind as of March 2023 (waiting on
; https://github.com/tree-sitter/tree-sitter-regex/pull/15)

(non_capturing_group) @meta.group.non-capturing.regexp

[
  (anonymous_capturing_group)
] @meta.group.capturing.regexp

[
  (identity_escape)
  (control_escape)
  (character_class_escape)
] @constant.character.escape.backslash.regexp

[
  (boundary_assertion)
] @keyword.control.anchor.regexp

[
  (optional)
  (lazy)
] @keyword.operator.quantifier.regexp

((lookahead_assertion) @keyword.operator.lookahead.regexp
  (#set! adjust.startAndEndAroundFirstMatchOf "\\?="))

((lookahead_assertion) @keyword.operator.lookahead.negated.regexp
  (#set! adjust.startAndEndAroundFirstMatchOf "\\?!"))

((non_capturing_group) @keyword.operator.group.non-capturing.regexp
  (#set! adjust.startAndEndAroundFirstMatchOf "\\?:"))

(anonymous_capturing_group
  "(" @punctuation.definition.group.begin.bracket.round.regexp
  ")" @punctuation.definition.group.end.bracket.round.regexp
  (#set! capture.final true))

"|" @keyword.operator.or.regexp
["*" "+"] @keyword.operator.quantifier.regexp

(character_class) @constant.other.character-class.set.regexp

(character_class
  "[" @punctuation.definition.character-class.begin.regexp)

(character_class
  "]" @punctuation.definition.character-class.end.regexp)

(character_class
  "^" @keyword.operator.negation.regexp)
