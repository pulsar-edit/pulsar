# whitespace

Strips trailing whitespace and adds a trailing newline when an editor is saved.

## Features

- **Trailing whitespace removal**: strips whitespace from the ends of lines on save.
- **Trailing newline**: ensures the buffer ends with a single trailing newline.
- **Tab and space conversion**: convert between tabs and spaces on demand.
- **Markdown-aware**: optionally keeps the double-space line breaks Markdown relies on.
- **Scoped settings**: enable or disable behavior per language through syntax-scoped properties.

## Commands

Commands available in `atom-workspace`:

- `whitespace:remove-trailing-whitespace`: remove trailing whitespace from the active editor,
- `whitespace:save-with-trailing-whitespace`: save the editor without stripping trailing whitespace,
- `whitespace:save-without-trailing-whitespace`: strip trailing whitespace and then save,
- `whitespace:convert-tabs-to-spaces`: convert leading tabs to spaces,
- `whitespace:convert-spaces-to-tabs`: convert leading spaces to tabs,
- `whitespace:convert-all-tabs-to-spaces`: convert all tabs to spaces.

## Configuration

To disable or enable features for a certain language, use syntax-scoped properties in your `config.json`. For example:

```jsonc
{
  ".slim.text": {
    "whitespace": {
      "removeTrailingWhitespace": false,
    },
  },
}
```

You find the `scope` at the top of a grammar package's settings view. For `.source.jade`, `.source.diff`, `.source.pug` and `.source.patch`, removing trailing whitespace is disabled by default.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
