# Bracket Matcher package

Highlights and jumps between `[]`, `()`, and `{}`. Also highlights matching XML
and HTML tags.

Autocompletes `[]`, `()`, `{}`, `""`, `''`, `“”`, `‘’`, `«»`, `‹›`, and
backticks by default.

Use <kbd>ctrl-m</kbd> to jump to the bracket matching the one adjacent to the cursor.
It jumps to the nearest enclosing bracket when there's no adjacent bracket,

Use <kbd>ctrl-cmd-m</kbd> to select all the text inside the current brackets.

Use <kbd>alt-cmd-.</kbd> to close the current XML/HTML tag.

---
### Configuration

Matching brackets and quotes are sensibly inserted for you. If you dislike this
functionality, you can disable it from the Bracket Matcher section of the
Settings View.

#### Custom Pairs

You can customize matching pairs in Bracket Matcher at any time. You can do so either globally via the Settings View or at the scope level via your `config.cson`. Changes take effect immediately.

* **Autocomplete Characters** - Comma-separated pairs that the editor will treat as brackets / quotes. Entries in this field override the package defaults.
  * For example: `<>, (), []`

* **Pairs With Extra Newline** - Comma-separated pairs that enhance the editor's auto indent feature. When used, a newline is automatically added between the pair when enter is pressed between them. Note: This feature is meant to be used in combination with brackets defined for indentation by the active language package (`increaseIndentPattern` / `decreaseIndentPattern`).
Example:
```
fn main() {
    | <---- Cursor positioned at one indent level higher
}
```

#### Scoped settings
In addition to the global settings, you are also able to add scope-specific modifications to Pulsar in your `config.cson`. This is especially useful for editor rule changes specific to each language. Scope-specific settings override package defaults _and_ global settings.
Example:
```cson
".rust.source":
  "bracket-matcher":
    autocompleteCharacters: [
      "()"
      "[]"
      "{}"
      "<>"
      "\"\""
      "``"
    ]
```
