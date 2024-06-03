; WORKAROUND:
;
; When you're typing a new property name inside of a list, tree-sitter-css will
; assume the thing you're typing is a descendant selector tag name until you
; get to the colon. This prevents it from highlighting the incomplete line like
; a selector tag name.

(ERROR
  (descendant_selector
    (tag_name) @_IGNORE_
    (#set! capture.final true)))

(ERROR
  (attribute_name) @_IGNORE_
  (#set! capture.final true))

((ERROR
  (attribute_name) @invalid.illegal)
  (#set! capture.final true))

; COMMENTS
; ========

(comment) @comment.block.scss

; Scope the block-comment delimiters (`/*` and `*/`).
((comment) @punctuation.definition.comment.begin.scss
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))
((comment) @punctuation.definition.comment.end.scss
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))

(single_line_comment) @comment.line.double-slash.scss

((single_line_comment) @punctuation.definition.comment.scss
  (#set! adjust.startAndEndAroundFirstMatchOf "^//"))


; SELECTORS
; =========

; (selectors "," @punctuation.separator.list.comma.scss)

; The "div" in `div.foo {`.
(tag_name) @entity.name.tag.scss
; The "*" in `div > * {`.
(universal_selector) @entity.name.tag.universal.scss
; The "&" in `&:hover {`.
(nesting_selector) @entity.name.tag.reference.scss

; The "foo" in `div[attr=foo] {`.
(attribute_selector (plain_value) @string.unquoted.scss)

[
  (child_selector ">")
  (sibling_selector "~")
  (adjacent_sibling_selector "+")
] @keyword.operator.combinator.scss

; The '.' in `.foo`.
(class_selector "." @punctuation.definition.entity.scss)

; The '.foo' in `.foo`.
((class_selector) @entity.other.attribute-name.class.scss
  (#set! adjust.startAt lastChild.previousSibling.startPosition))

; The '%' in `%foo`.
(placeholder_selector "%" @punctuation.definition.entity.scss)

; The '%foo' in `%foo`.
(placeholder_selector) @entity.other.attribute-name.class.scss


(pseudo_class_selector [":" "::"] @punctuation.definition.entity.scss)

; Pseudo-classes without arguments: the ":first-of-type" in `li:first-of-type`.
((pseudo_class_selector (class_name) (arguments) .) @entity.other.attribute-name.pseudo-class.scss
  (#set! adjust.startAt lastChild.previousSibling.previousSibling.startPosition)
  (#set! adjust.endAt lastChild.previousSibling.endPosition)
  (#set! capture.final true))

; Pseudo-classes with arguments: the ":nth-of-type" in `li:nth-of-type(2n-1)`.
((pseudo_class_selector (class_name) .) @entity.other.attribute-name.pseudo-class.scss
  (#set! adjust.startAt lastChild.previousSibling.startPosition)
  (#set! adjust.endAt lastChild.endPosition))

(arguments
  "(" @punctuation.definition.arguments.begin.bracket.round.scss
  ")" @punctuation.definition.arguments.end.bracket.round.scss)

(attribute_selector
  "[" @punctuation.definition.entity.begin.bracket.square.scss
  (attribute_name) @entity.other.attribute-name.scss
  "]" @punctuation.definition.entity.end.bracket.square.scss)

(attribute_selector
  ["=" "^=" "$=" "~=" "|="] @keyword.operator.pattern.scss)


; CSS VARIABLES
; =============

(declaration
  (property_name) @variable.other.assignment.scss
  (#match? @variable.other.assignment.scss "^--" )
  (#set! capture.final true))


; SCSS VARIABLES
; ==============

(variable_name) @variable.declaration.scss
[(variable_value)] @variable.scss
(argument_name) @variable.parameter.scss
(each_statement (value) @variable.declaration.scss)

; PROPERTIES
; ==========

; TODO: Is it worth it to try to maintain a list of recognized property names?
; Would be useful to know if you've typo'd something, but it would be a
; maintenance headache.
(declaration
  (property_name) @support.type.property-name.scss)

(important) @keyword.other.important.css.scss
(default) @keyword.other.default.scss

; VALUES
; ======

; Strings
; -------

((string_value) @string.quoted.double.scss
  (#match? @string.quoted.double.scss "^\"")
  (#match? @string.quoted.double.scss "\"$"))

((string_value) @string.quoted.single.scss
  (#match? @string.quoted.single.scss "^'")
  (#match? @string.quoted.single.scss "'$"))

((string_value) @punctuation.definition.string.begin.scss
  (#set! adjust.startAndEndAroundFirstMatchOf "^[\"']"))

((string_value) @punctuation.definition.string.end.scss
  (#set! adjust.startAndEndAroundFirstMatchOf "[\"']$"))


; Property value constants
; ------------------------

; TODO: Is this worth it?
((plain_value) @support.constant.property-value.scss
  (#match? @support.constant.property-value.scss "^(above|absolute|active|add|additive|after-edge|alias|all|all-petite-caps|all-scroll|all-small-caps|alpha|alphabetic|alternate|alternate-reverse|always|antialiased|auto|auto-pos|available|avoid|avoid-column|avoid-page|avoid-region|backwards|balance|baseline|before-edge|below|bevel|bidi-override|blink|block|block-axis|block-start|block-end|bold|bolder|border|border-box|both|bottom|bottom-outside|break-all|break-word|bullets|butt|capitalize|caption|cell|center|central|char|circle|clip|clone|close-quote|closest-corner|closest-side|col-resize|collapse|color|color-burn|color-dodge|column|column-reverse|common-ligatures|compact|condensed|contain|content|content-box|contents|context-menu|contextual|copy|cover|crisp-edges|crispEdges|crosshair|cyclic|dark|darken|dashed|decimal|default|dense|diagonal-fractions|difference|digits|disabled|disc|discretionary-ligatures|distribute|distribute-all-lines|distribute-letter|distribute-space|dot|dotted|double|double-circle|downleft|downright|e-resize|each-line|ease|ease-in|ease-in-out|ease-out|economy|ellipse|ellipsis|embed|end|evenodd|ew-resize|exact|exclude|exclusion|expanded|extends|extra-condensed|extra-expanded|fallback|farthest-corner|farthest-side|fill|fill-available|fill-box|filled|fit-content|fixed|flat|flex|flex-end|flex-start|flip|flow-root|forwards|freeze|from-image|full-width|geometricPrecision|georgian|grab|grabbing|grayscale|grid|groove|hand|hanging|hard-light|help|hidden|hide|historical-forms|historical-ligatures|horizontal|horizontal-tb|hue|icon|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space|ideographic|inactive|infinite|inherit|initial|inline|inline-axis|inline-block|inline-end|inline-flex|inline-grid|inline-list-item|inline-start|inline-table|inset|inside|inter-character|inter-ideograph|inter-word|intersect|invert|isolate|isolate-override|italic|jis04|jis78|jis83|jis90|justify|justify-all|kannada|keep-all|landscape|large|larger|left|light|lighten|lighter|line|line-edge|line-through|linear|linearRGB|lining-nums|list-item|local|loose|lowercase|lr|lr-tb|ltr|luminance|luminosity|main-size|mandatory|manipulation|manual|margin-box|match-parent|match-source|mathematical|max-content|medium|menu|message-box|middle|min-content|miter|mixed|move|multiply|n-resize|narrower|ne-resize|nearest-neighbor|nesw-resize|newspaper|no-change|no-clip|no-close-quote|no-common-ligatures|no-contextual|no-discretionary-ligatures|no-drop|no-historical-ligatures|no-open-quote|no-repeat|none|nonzero|normal|not-allowed|nowrap|ns-resize|numbers|numeric|nw-resize|nwse-resize|oblique|oldstyle-nums|open|open-quote|optimizeLegibility|optimizeQuality|optimizeSpeed|optional|ordinal|outset|outside|over|overlay|overline|padding|padding-box|page|painted|pan-down|pan-left|pan-right|pan-up|pan-x|pan-y|paused|petite-caps|pixelated|plaintext|pointer|portrait|pre|pre-line|pre-wrap|preserve-3d|progress|progressive|proportional-nums|proportional-width|proximity|radial|recto|region|relative|remove|repeat|repeat-[xy]|reset-size|reverse|revert|ridge|right|rl|rl-tb|round|row|row-resize|row-reverse|row-severse|rtl|ruby|ruby-base|ruby-base-container|ruby-text|ruby-text-container|run-in|running|s-resize|saturation|scale-down|screen|scroll|scroll-position|se-resize|semi-condensed|semi-expanded|separate|sesame|show|sideways|sideways-left|sideways-lr|sideways-right|sideways-rl|simplified|slashed-zero|slice|small|small-caps|small-caption|smaller|smooth|soft-light|solid|space|space-around|space-between|space-evenly|spell-out|square|sRGB|stacked-fractions|start|static|status-bar|swap|step-end|step-start|sticky|stretch|strict|stroke|stroke-box|style|sub|subgrid|subpixel-antialiased|subtract|super|sw-resize|symbolic|table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row|table-row-group|tabular-nums|tb|tb-rl|text|text-after-edge|text-before-edge|text-bottom|text-top|thick|thin|titling-caps|top|top-outside|touch|traditional|transparent|triangle|ultra-condensed|ultra-expanded|under|underline|unicase|unset|upleft|uppercase|upright|use-glyph-orientation|use-script|verso|vertical|vertical-ideographic|vertical-lr|vertical-rl|vertical-text|view-box|visible|visibleFill|visiblePainted|visibleStroke|w-resize|wait|wavy|weight|whitespace|wider|words|wrap|wrap-reverse|x|x-large|x-small|xx-large|xx-small|y|zero|zoom-in|zoom-out)$"))

; All property values that have special meaning in `font-family`.
; TODO: Restrict these to be meaningful only when the property name is font-related?
((plain_value) @support.constant.property-value.font-name.scss
  (#match? @support.constant.property-value.font-name.scss "^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|emoji|math|fangsong)$"))

; All property values that have special meaning in `list-style-type`.
; TODO: Restrict these to be meaningful only when the property name is `list-style-type`?
((plain_value) @support.constant.property-value.list-style-type.scss
  (#match? @support.constant.property-value.list-style-type.scss "^(arabic-indic|armenian|bengali|cambodian|circle|cjk-decimal|cjk-earthly-branch|cjk-heavenly-stem|cjk-ideographic|decimal|decimal-leading-zero|devanagari|disc|disclosure-closed|disclosure-open|ethiopic-halehame-am|ethiopic-halehame-ti-e[rt]|ethiopic-numeric|georgian|gujarati|gurmukhi|hangul|hangul-consonant|hebrew|hiragana|hiragana-iroha|japanese-formal|japanese-informal|kannada|katakana|katakana-iroha|khmer|korean-hangul-formal|korean-hanja-formal|korean-hanja-informal|lao|lower-alpha|lower-armenian|lower-greek|lower-latin|lower-roman|malayalam|mongolian|myanmar|oriya|persian|simp-chinese-formal|simp-chinese-informal|square|tamil|telugu|thai|tibetan|trad-chinese-formal|trad-chinese-informal|upper-alpha|upper-armenian|upper-latin|upper-roman|urdu)$"))

; Numbers & units
; ---------------

; This node type appears to always be a hex color.
(color_value) @constant.other.color.rgb-value.hex.scss

[(integer_value) (float_value)] @constant.numeric.scss

; All unit types with valid scope names.
((unit) @keyword.other.unit._TEXT_.scss
  (#match? @keyword.other.unit._TEXT_.scss "^(deg|grad|rad|turn|ch|cm|em|ex|fr|in|mm|mozmm|pc|pt|px|q|rem|vh|vmax|vmin|vw|dpi|dpcm|dpps|s|ms)$"))

((unit) @keyword.other.unit.percentage.scss
  (#eq? @keyword.other.unit.percentage.scss "%"))

; The magic color value `currentColor`.
((plain_value) @support.constant.color.current.scss
  (#eq? @support.constant.color.current.scss "currentColor"))

; Match the TM bundle's special treatment of named colors.
((plain_value) @support.constant.color.w3c-standard-color-name.scss
  (#match? @support.constant.color.w3c-standard-color-name.scss "^(aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow)$"))

((plain_value) @support.constant.color.w3c-extended-color-name.scss
  (#match? @support.constant.color.w3c-extended-color-name.scss "^(aliceblue|antiquewhite|aquamarine|azure|beige|bisque|blanchedalmond|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|gainsboro|ghostwhite|gold|goldenrod|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|limegreen|linen|magenta|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|oldlace|olivedrab|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|rebeccapurple|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|thistle|tomato|transparent|turquoise|violet|wheat|whitesmoke|yellowgreen)$"))

((plain_value) @invalid.deprecated.color.system.scss
  (#match? @invalid.deprecated.color.system.scss "^(ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonFace|ButtonHighlight|ButtonShadow|ButtonText|CaptionText|GrayText|Highlight|HighlightText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText)$"))

; Builtins
; --------

(boolean_value) @constant.boolean._TEXT_.scss
(null_value) @constant.language.null.scss


; FUNCTIONS
; =========

((function_name) @support.function.var.css.scss
  (arguments (plain_value) @variable.css.scss)
  (#eq? @support.function.var.css.scss "var")
  (#set! capture.final true))

((function_name) @support.function._TEXT_.css.scss
  (#match? @support.function._TEXT_.css.scss "^(abs|acos|annotation|asin|atan2?attr|blur|brightness|calc|character-variant|circle|clamp|color-contrast|color-mix|conic-gradient|contrast|cos|counters|cross-fade|cubic-bezier|device-cmyk|drop-shadow|element|ellipse|env|exp|format|grayscale|hsla?|hue-rotate|hwp|hypot|image|image-set|inset|invert|lab|lch|linear-gradient|local|log|matrix|matrix3d|max|min|minmax|mod|oklab|oklch|opacity|ornaments|paint|path|perspective|polygon|pow|radial-gradient|ray|rect|rem|repeat|repeating-(conic|linear|radial)-gradient|rgba?|rotate(3d)?|rotate(X|Y|Z)|round|saturate|scale(3d)?|scale(X|Y|Z)|sepia|sign|sin|skew(X|Y)?|sqrt|steps|styleset|stylistic|swash|symbols|tan|translate(3d)?|translate(X|Y|Z)|url)$")
  (#set! capture.final true))

((function_name) @support.other.function._TEXT_.scss)

((function_name) @_IGNORE_
  (arguments (plain_value) @string.unquoted.scss)
  (#eq? @_IGNORE_ "url"))

((module) @support.module._TEXT_.scss
  (#match? @support.module._TEXT_.scss "^(color|list|map|math|meta|selector|string)$")
  (#set! capture.final true))

(module) @support.other.module.scss


; MIXINS
; ======

(mixin_statement
	(name) @entity.name.function.mixin.scss)

(include_statement
  (mixin_name) @support.other.function.mixin.scss)


; AT-RULES
; ========

"@media" @keyword.control.at-rule.media.css.scss
"@import" @keyword.control.at-rule.import.css.scss
"@charset" @keyword.control.at-rule.charset.css.scss
"@namespace" @keyword.control.at-rule.namespace.css.scss
"@supports" @keyword.control.at-rule.supports.css.scss
"@keyframes" @keyword.control.at-rule.keyframes.css.scss

"@include" @keyword.control.at-rule.include.scss
"@mixin" @keyword.control.at-rule.mixin.scss
"@if" @keyword.control.at-rule.if.scss
"@else" @keyword.control.at-rule.else.scss
"@for" @keyword.control.at-rule.for.scss
"@use" @keyword.control.at-rule.use.scss
"@forward" @keyword.control.at-rule.forward.scss
"@extend" @keyword.control.at-rule.extend.scss
"@function" @keyword.control.at-rule.function.scss
"@return" @keyword.control.at-rule.return.scss
"@each" @keyword.control.at-rule.each.scss
"@at-root" @keyword.control.at-rule.at-root.scss

"@error" @keyword.directive.error.scss
"@warn" @keyword.directive.warn.scss
"@debug" @keyword.directive.debug.scss

(each_statement "in" @keyword.control.in.scss)

; The parser is permissive and supports at-rule keywords that don't currently
; exist, so we'll set a fallback scope for those.
((at_keyword) @keyword.control.at-rule.other.scss
  (#set! capture.shy true))

[(to) (from)] @keyword.control._TYPE_.css.scss

(keyword_query) @support.constant.css.scss
(feature_name) @support.constant.css.scss

[
  "as"
  "from"
  "through"
] @keyword.control._TYPE_.scss


(id_selector
  "#" @punctuation.definition.entity.id.scss) @entity.other.attribute-name.id.scss

((use_alias) @variable.language.alias.expanded.scss
  (#eq? @variable.language.alias.expanded.scss "*")
  (#set! capture.final true))

(use_alias) @variable.other.alias.scss

; FUNCTIONS
; =========

(function_statement (name) @entity.name.function.scss)


; OPERATORS
; =========

; Used in `@media` queries.
["and" "not" "only" "or"] @keyword.operator.logical._TYPE_.scss

; Used in `calc()` and elsewhere.
(binary_expression ["+" "-" "*" "/"] @keyword.operator.arithmetic.scss)

"..." @keyword.operator.spread.scss

; When `ERROR` is present here, it's typically because a rest parameter or
; argument is not the last in the list. Indicate this to the user by marking
; the '...' itself as invalid.
(ERROR
  [
    (rest_parameter "..." @invalid.illegal.spread.scss)
    (rest_argument "..." @invalid.illegal.spread.scss)
  ]
)


; INTERPOLATION
; =============

(interpolation) @meta.embedded.line.interpolation.scss
(interpolation "#{" @punctuation.section.embedded.begin.scss)
(interpolation "}" @punctuation.section.embedded.end.scss)

; OTHER STUFF
; ===========

(keyframes_statement
  name: (keyframes_name) @entity.name.keyframes.css.scss)

(nesting_value) @entity.other.tag.reference.scss

; PUNCTUATION
; ===========

(parameters "(") @punctuation.definition.parameters.begin.brace.round.scss
(parameters ")") @punctuation.definition.parameters.end.brace.round.scss

"," @punctuation.separator.comma.scss
":" @punctuation.separator.colon.scss
";" @punctuation.separator.semicolon.scss

("{" @punctuation.brace.curly.begin.scss
  (#set! capture.shy))
("}" @punctuation.brace.curly.end.scss
  (#set! capture.shy))

("(" @punctuation.brace.round.begin.scss
  (#set! capture.shy))
(")" @punctuation.brace.round.end.scss
  (#set! capture.shy))

(":" @punctuation.separator.key-value.scss
  (#set! capture.shy))


; SECTIONS
; ========

(rule_set (block) @meta.block.inside-selector.scss)
((block) @meta.block.scss
  (#set! capture.shy))
(selectors) @meta.selector.scss
