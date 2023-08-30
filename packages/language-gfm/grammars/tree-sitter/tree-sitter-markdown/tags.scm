
((atx_heading
  (atx_h1_marker)
  (heading_content) @name) @definition.heading
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "· "))

((atx_heading
  (atx_h2_marker)
  (heading_content) @name) @definition.heading
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "·· "))

((atx_heading
  (atx_h3_marker)
  (heading_content) @name) @definition.heading
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "··· "))

((atx_heading
  (atx_h4_marker)
  (heading_content) @name) @definition.heading
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "···· "))

((atx_heading
  (atx_h5_marker)
  (heading_content) @name) @definition.heading
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "····· "))

((atx_heading
  (atx_h6_marker)
  (heading_content) @name) @definition.heading
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "······ "))

((setext_heading
  (heading_content) @name) @definition.heading
  (setext_h1_underline)
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "· "))

((setext_heading
  (heading_content) @name) @definition.heading
  (setext_h2_underline)
  (#set! symbol.strip "(^\\s*|\\s*$)")
  (#set! symbol.prepend "·· "))
