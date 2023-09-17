
; WORKAROUND:
;
; When you're typing a new property name inside of a list, tree-sitter-css will
; assume the thing you're typing is a descendant selector tag name until you
; get to the colon. This prevents it from highlighting the incomplete line like
; a selector tag name.

(descendant_selector
  (tag_name) @_IGNORE_
  (#set! capture.final true))

(ERROR
  (attribute_name) @_IGNORE_
  (#set! capture.final true))

((ERROR
  (attribute_name) @invalid.illegal)
  (#set! capture.final true))

; WORKAROUND:
;
; `:hover` and other pseudo-classes don't highlight correctly inside a media
; query (https://github.com/tree-sitter/tree-sitter-css/issues/28)
(
  (ERROR) @entity.other.attribute-name.pseudo-class.css
  (#match? @entity.other.attribute-name.pseudo-class.css "^:[\\w-]+$")
)

; WORKAROUND:
;
; In `::after`, the "after" has a node type of `tag_name`. We want to catch it
; here so that it doesn't get scoped like an HTML tag name in a selector.

; Scope the entire `::after` range as one unit.
((pseudo_element_selector)
  @entity.other.attribute-name.pseudo-element.css
  (#set! adjust.startAt lastChild.previousSibling.startPosition)
  (#set! adjust.endAt lastChild.endPosition))

; Claim this range and block it from being scoped as a tag name.
(pseudo_element_selector
  (tag_name) @_IGNORE_
  (#is? test.last true)
  (#set! capture.final true))

; COMMENTS
; ========

(comment) @comment.block.css

; Scope the block-comment delimiters (`/*` and `*/`).
((comment) @punctuation.definition.comment.begin.css
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))
((comment) @punctuation.definition.comment.end.css
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))


; SELECTORS
; =========

; (selectors "," @punctuation.separator.list.comma.css)

; The "div" in `div.foo {`.
(tag_name) @entity.name.tag.css

; The "foo" in `div[attr=foo] {`.
(attribute_selector (plain_value) @string.unquoted.css)

[
  (child_selector ">")
  (sibling_selector "~")
  (adjacent_sibling_selector "+")
] @keyword.operator.combinator.css

; The "#foo" in `div#foo {`.
(id_selector
  "#" @punctuation.definition.entity.id.css) @entity.other.attribute-name.id.css

; KNOWN ISSUE: Namespace selectors like `svg|link` are not supported. See:
; https://github.com/tree-sitter/tree-sitter-css/issues/33

;(namespace_name) @entity.other.namespace-prefix.css

; The '.' in `.foo`.
(class_selector
  "." @punctuation.definition.entity.css)

; The '.foo' in `.foo`.
((class_selector) @entity.other.attribute-name.class.css
  (#set! adjust.startAt lastChild.previousSibling.startPosition))

; Pseudo-classes without arguments: the ":first-of-type" in `li:first-of-type`.
((pseudo_class_selector (class_name) (arguments) .) @entity.other.attribute-name.pseudo-class.css
  (#set! adjust.startAt lastChild.previousSibling.previousSibling.startPosition)
  (#set! adjust.endAt lastChild.previousSibling.endPosition)
  (#set! capture.final true))

; Pseudo-classes with arguments: the ":nth-of-type" in `li:nth-of-type(2n-1)`.
((pseudo_class_selector (class_name) .) @entity.other.attribute-name.pseudo-class.css
  (#set! adjust.startAt lastChild.previousSibling.startPosition)
  (#set! adjust.endAt lastChild.endPosition))

(arguments
  "(" @punctuation.definition.arguments.begin.bracket.round.css
  ")" @punctuation.definition.arguments.end.bracket.round.css)

(attribute_selector
  "[" @punctuation.definition.entity.begin.bracket.square.css
  (attribute_name) @entity.other.attribute-name.css
  "]" @punctuation.definition.entity.end.bracket.square.css)

(attribute_selector
  ["=" "^=" "$=" "~=" "|="] @keyword.operator.pattern.css)


; VARIABLES
; =========

(declaration
  (property_name) @variable.other.assignment.css
  (#match? @variable.other.assignment.css "^--" )
  (#set! capture.final true))

; PROPERTIES
; ==========

; TODO: Is it worth it to try to maintain a list of recognized property names?
; Would be useful to know if you've typo'd something, but it would be a
; maintenance headache.
(declaration
  (property_name) @support.type.property-name.css)

; VALUES
; ======

; Strings
; -------

((string_value) @string.quoted.double.css
  (#match? @string.quoted.double.css "^\"")
  (#match? @string.quoted.double.css "\"$"))

((string_value) @string.quoted.single.css
  (#match? @string.quoted.single.css "^'")
  (#match? @string.quoted.single.css "'$"))

((string_value) @punctuation.definition.string.begin.css
  (#set! adjust.startAndEndAroundFirstMatchOf "^[\"']"))

((string_value) @punctuation.definition.string.end.css
  (#set! adjust.startAndEndAroundFirstMatchOf "[\"']$"))


; Property value constants
; ------------------------

((plain_value) @support.constant.property-value.css
  (#match? @support.constant.property-value.css "^(above|absolute|active|add|additive|after-edge|alias|all|all-petite-caps|all-scroll|all-small-caps|alpha|alphabetic|alternate|alternate-reverse|always|antialiased|auto|auto-pos|available|avoid|avoid-column|avoid-page|avoid-region|backwards|balance|baseline|before-edge|below|bevel|bidi-override|blink|block|block-axis|block-start|block-end|bold|bolder|border|border-box|both|bottom|bottom-outside|break-all|break-word|bullets|butt|capitalize|caption|cell|center|central|char|circle|clip|clone|close-quote|closest-corner|closest-side|col-resize|collapse|color|color-burn|color-dodge|column|column-reverse|common-ligatures|compact|condensed|contain|content|content-box|contents|context-menu|contextual|copy|cover|crisp-edges|crispEdges|crosshair|cyclic|dark|darken|dashed|decimal|default|dense|diagonal-fractions|difference|digits|disabled|disc|discretionary-ligatures|distribute|distribute-all-lines|distribute-letter|distribute-space|dot|dotted|double|double-circle|downleft|downright|e-resize|each-line|ease|ease-in|ease-in-out|ease-out|economy|ellipse|ellipsis|embed|end|evenodd|ew-resize|exact|exclude|exclusion|expanded|extends|extra-condensed|extra-expanded|fallback|farthest-corner|farthest-side|fill|fill-available|fill-box|filled|fit-content|fixed|flat|flex|flex-end|flex-start|flip|flow-root|forwards|freeze|from-image|full-width|geometricPrecision|georgian|grab|grabbing|grayscale|grid|groove|hand|hanging|hard-light|help|hidden|hide|historical-forms|historical-ligatures|horizontal|horizontal-tb|hue|icon|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space|ideographic|inactive|infinite|inherit|initial|inline|inline-axis|inline-block|inline-end|inline-flex|inline-grid|inline-list-item|inline-size|inline-start|inline-table|inset|inside|inter-character|inter-ideograph|inter-word|intersect|invert|isolate|isolate-override|italic|jis04|jis78|jis83|jis90|justify|justify-all|kannada|keep-all|landscape|large|larger|layout|left|light|lighten|lighter|line|line-edge|line-through|linear|linearRGB|lining-nums|list-item|local|loose|lowercase|lr|lr-tb|ltr|luminance|luminosity|main-size|mandatory|manipulation|manual|margin-box|match-parent|match-source|mathematical|max-content|medium|menu|message-box|middle|min-content|miter|mixed|move|multiply|n-resize|narrower|ne-resize|nearest-neighbor|nesw-resize|newspaper|no-change|no-clip|no-close-quote|no-common-ligatures|no-contextual|no-discretionary-ligatures|no-drop|no-historical-ligatures|no-open-quote|no-repeat|none|nonzero|normal|not-allowed|nowrap|ns-resize|numbers|numeric|nw-resize|nwse-resize|oblique|oldstyle-nums|open|open-quote|optimizeLegibility|optimizeQuality|optimizeSpeed|optional|ordinal|outset|outside|over|overlay|overline|padding|padding-box|page|paint|painted|pan-down|pan-left|pan-right|pan-up|pan-x|pan-y|paused|petite-caps|pixelated|plaintext|pointer|portrait|pre|pre-line|pre-wrap|preserve-3d|progress|progressive|proportional-nums|proportional-width|proximity|radial|recto|region|relative|remove|repeat|repeat-[xy]|reset-size|reverse|revert|ridge|right|rl|rl-tb|round|row|row-resize|row-reverse|row-severse|rtl|ruby|ruby-base|ruby-base-container|ruby-text|ruby-text-container|run-in|running|s-resize|saturation|scale-down|screen|scroll|scroll-position|se-resize|semi-condensed|semi-expanded|separate|sesame|show|sideways|sideways-left|sideways-lr|sideways-right|sideways-rl|simplified|size|slashed-zero|slice|small|small-caps|small-caption|smaller|smooth|soft-light|solid|space|space-around|space-between|space-evenly|spell-out|square|sRGB|stacked-fractions|start|static|status-bar|swap|step-end|step-start|sticky|stretch|strict|stroke|stroke-box|style|sub|subgrid|subpixel-antialiased|subtract|super|sw-resize|symbolic|table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row|table-row-group|tabular-nums|tb|tb-rl|text|text-after-edge|text-before-edge|text-bottom|text-top|thick|thin|titling-caps|top|top-outside|touch|traditional|transparent|triangle|ultra-condensed|ultra-expanded|under|underline|unicase|unset|upleft|uppercase|upright|use-glyph-orientation|use-script|verso|vertical|vertical-ideographic|vertical-lr|vertical-rl|vertical-text|view-box|visible|visibleFill|visiblePainted|visibleStroke|w-resize|wait|wavy|weight|whitespace|wider|words|wrap|wrap-reverse|x|x-large|x-small|xx-large|xx-small|y|zero|zoom-in|zoom-out)$"))

; All property values that have special meaning in `font-family`.
; TODO: Restrict these to be meaningful only when the property name is font-related?
((plain_value) @support.constant.property-value.font-name.css
  (#match? @support.constant.property-value.font-name.css "^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|emoji|math|fangsong)$"))

; All property values that have special meaning in `list-style-type`.
; TODO: Restrict these to be meaningful only when the property name is `list-style-type`?
((plain_value) @support.constant.property-value.list-style-type.css
  (#match? @support.constant.property-value.list-style-type.css "^(arabic-indic|armenian|bengali|cambodian|circle|cjk-decimal|cjk-earthly-branch|cjk-heavenly-stem|cjk-ideographic|decimal|decimal-leading-zero|devanagari|disc|disclosure-closed|disclosure-open|ethiopic-halehame-am|ethiopic-halehame-ti-e[rt]|ethiopic-numeric|georgian|gujarati|gurmukhi|hangul|hangul-consonant|hebrew|hiragana|hiragana-iroha|japanese-formal|japanese-informal|kannada|katakana|katakana-iroha|khmer|korean-hangul-formal|korean-hanja-formal|korean-hanja-informal|lao|lower-alpha|lower-armenian|lower-greek|lower-latin|lower-roman|malayalam|mongolian|myanmar|oriya|persian|simp-chinese-formal|simp-chinese-informal|square|tamil|telugu|thai|tibetan|trad-chinese-formal|trad-chinese-informal|upper-alpha|upper-armenian|upper-latin|upper-roman|urdu)$"))


; Numbers & units
; ---------------

; This node type appears to always be a hex color.
(color_value) @constant.other.color.rgb-value.hex.css

[(integer_value) (float_value)] @constant.numeric.css

; All unit types with valid scope names.
((unit) @keyword.other.unit._TEXT_.css
  (#match? @keyword.other.unit._TEXT_.css "^(deg|grad|rad|turn|ch|cm|em|ex|fr|in|mm|mozmm|pc|pt|px|q|rem|vh|vmax|vmin|vw|dpi|dpcm|dpps|s|ms)$"))

((unit) @keyword.other.unit.percentage.css
  (#eq? @keyword.other.unit.percentage.css "%"))

; The magic color value `currentColor`.
((plain_value) @support.constant.color.current.css
  (#eq? @support.constant.color.current.css "currentColor"))

; Match the TM bundle's special treatment of named colors.
((plain_value) @support.constant.color.w3c-standard-color-name.css
  (#match? @support.constant.color.w3c-standard-color-name.css "^(aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow)$"))

((plain_value) @support.constant.color.w3c-extended-color-name.css
  (#match? @support.constant.color.w3c-extended-color-name.css "^(aliceblue|antiquewhite|aquamarine|azure|beige|bisque|blanchedalmond|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|gainsboro|ghostwhite|gold|goldenrod|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|limegreen|linen|magenta|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|oldlace|olivedrab|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|rebeccapurple|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|thistle|tomato|transparent|turquoise|violet|wheat|whitesmoke|yellowgreen)$"))

((plain_value) @invalid.deprecated.color.system.css
  (#match? @invalid.deprecated.color.system.css "^(ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonFace|ButtonHighlight|ButtonShadow|ButtonText|CaptionText|GrayText|Highlight|HighlightText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText)$"))


; FUNCTIONS

; (call_expression
;   (function_name) @support.function.var.css
;   (#eq? @support.function.var.css "var")
; )

((function_name) @support.function.var.css
  (arguments (plain_value) @variable.css)
  (#eq? @support.function.var.css "var"))

((function_name) @support.function._TEXT_.css
  ; Because we just handled it above.
  (#not-eq? @support.function._TEXT_.css "var"))


((function_name) @_IGNORE_
  (arguments (plain_value) @string.unquoted.css)
  (#eq? @_IGNORE_ "url"))


; AT-RULES
; ========

"@media" @keyword.control.at-rule.media.css
"@import" @keyword.control.at-rule.import.css
"@charset" @keyword.control.at-rule.charset.css
"@namespace" @keyword.control.at-rule.namespace.css
"@supports" @keyword.control.at-rule.supports.css
"@keyframes" @keyword.control.at-rule.keyframes.css

; The parser is permissive and supports at-rule keywords that don't currently
; exist, so we'll set a fallback scope for those.
((at_keyword) @keyword.control.at-rule.other.css
  (#set! capture.shy true))

[(to) (from)] @keyword.control._TYPE_.css
(important) @keyword.control.important.css

(keyword_query) @support.constant.css
(feature_name) @support.constant.css

; OPERATORS
; =========

; Used in `@media` queries.
["and" "not" "only" "or"] @keyword.operator.logical._TYPE_.css

; Used in `calc()` and elsewhere.
(binary_expression ["+" "-" "*" "/"] @keyword.operator.arithmetic.css)

; PUNCTUATION
; ===========

(rule_set
  (block "{" @punctuation.section.property-list.begin.bracket.curly.css)
  (#set! capture.final true))
(rule_set
  (block "}" @punctuation.section.property-list.end.bracket.curly.css)
  (#set! capture.final true))

"{" @punctuation.bracket.curly.begin.css
"}" @punctuation.bracket.curly.end.css
";" @punctuation.terminator.rule.css
"," @punctuation.separator.list.comma.css

(pseudo_class_selector
  [":" "::"] @punctuation.definition.entity.css)

(":" @punctuation.separator.key-value.css
  (#set! capture.shy true))


; SECTIONS
; ========

; Used by `autocomplete-css`.
(rule_set (block) @meta.block.inside-selector.css)
((block) @meta.block.css
  (#set! capture.shy true))

; Used by `autocomplete-css`. Includes everything before the opening brace so
; that autocompletion of selector segments works even when the selector is not
; yet valid.
((rule_set) @meta.selector.css
  (#set! adjust.endBeforeFirstMatchOf "{"))


; META
; ====

[
  (plain_value)
  (integer_value)
  (string_value)
] @meta.property-value.css

; `!important` starts out as an ERROR node as it's being typed, but we need it
; to be recognized as a possible property value for `autocomplete-css` to be
; able to complete it. This should match only when it comes at the end of a
; property-value pair.
(
  (declaration)
  .
  (ERROR) @meta.property-value.css
  (#match? @meta.property-value.css "^\s?!i")
  (#set! capture.final true))

(
  (declaration) @meta.property-value.css
  (#match? @meta.property-value.css ":")
  (#set! adjust.startAt firstChild.nextSibling.endPosition)
)
