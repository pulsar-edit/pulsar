; Placeholder

; CAVEATS:
;
; * No support for lookbehind as of March 2023 (waiting on
; https://github.com/tree-sitter/tree-sitter-regex/pull/15)

(pattern) @string.regexp

(non_capturing_group) @meta.group.non-capturing.regexp

[
  (anonymous_capturing_group)
] @meta.group.capturing.regexp

[
  (control_escape)
  (character_class_escape)
] @constant.character.escape.backslash.regexp

"|" @keyword.operator.or.regexp
"*" @keyword.operator.quantifier.regexp

(character_class) @constant.other.character-class.set.regexp

(character_class
  "[" @punctuation.definition.character-class.begin.regexp
)

(character_class
  "]" @punctuation.definition.character-class.end.regexp
)

(character_class
  "^" @keyword.operator.negation.regexp
)
