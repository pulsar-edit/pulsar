(comment) @comment.line.number-sign.diff @spell

[
  (addition)
  (new_file)
] @markup.inserted.diff

[
  (deletion)
  (old_file)
] @markup.deleted.diff

(location) @meta.diff.range.unified

(linerange) @constant.numeric.line-number.diff

(command
  "diff" @keyword.other.diff
  (argument) @variable.parameter.diff)

(filename) @string.unquoted.filename.diff

(commit) @constant.sha.diff

(mode) @constant.numeric.mode.diff

[
  (binary_change)
  (similarity)
  (file_change)
  (index)
] @meta.diff.header

([
  ".."
  "+"
  "++"
  "+++"
  "++++"
  "-"
  "--"
  "---"
  "----"
  "@@"
] @punctuation.definition.diff
  (#set! priority 95))
