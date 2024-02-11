
((document) @punctuation.definition.begin.comment.phpdoc.php
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*\\*"))

((document) @punctuation.definition.end.comment.phpdoc.php
  (#set! adjust.startAndEndAroundFirstMatchOf "(?:\\*)?\\*/$"))

(tag_name) @keyword.other.tag.phpdoc.php
(primitive_type) @storage.type.primitive.phpdoc.php
(named_type) @storage.type.instance.phpdoc.php
(variable_name) @variable.other.phpdoc.php
(uri) @markup.underline.link.phpdoc.php

(inline_tag "{" @punctation.definition.tag.begin.brace.curly.phpdoc.php)
(inline_tag "}" @punctation.definition.tag.end.brace.curly.phpdoc.php)
