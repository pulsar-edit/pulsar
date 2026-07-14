# bracket-matcher

Highlights and jumps between matching brackets, and autocompletes brackets and quotes.

## Features

- **Bracket highlighting**: highlights the bracket matching the `(){}[]` character under the cursor.
- **Tag matching**: highlights matching XML and HTML tags.
- **Autocompletion**: inserts the closing bracket or quote when an opening one is typed.
- **Selection wrapping**: wraps selected text in brackets or quotes when the opening character is typed.
- **Scoped pairs**: customizes matching pairs globally or per language.
- **Universal editors**: matches brackets in every registered text editor, including docks and panels.

## Commands

Commands available in `atom-text-editor`:

- `bracket-matcher:go-to-matching-bracket`: move the cursor to the matching bracket,
- `bracket-matcher:go-to-enclosing-bracket`: move the cursor to the nearest enclosing bracket,
- `bracket-matcher:select-inside-brackets`: select the text inside the current brackets,
- `bracket-matcher:select-matching-brackets`: select both matching brackets,
- `bracket-matcher:remove-matching-brackets`: remove both matching brackets,
- `bracket-matcher:remove-brackets-from-selection`: remove the brackets surrounding the selection,
- `bracket-matcher:close-tag`: close the current XML/HTML tag.

## Configuration

Matching pairs can be customized per language through scoped settings in your `config.cson`, overriding the package defaults. Changes take effect immediately. For example:

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

## Services

- **bracket-matcher** (`1.0.0`): provided to expose the current match — `getMatchRanges(editor)` returns the highlighted bracket pair's buffer ranges, and `observe(callback)` reports every match change, enabling consumers such as scrollbar maps to display bracket positions.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
