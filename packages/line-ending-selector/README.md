# line-ending-selector

Show and change the line ending used by the current editor.

## Features

- **Line ending indicator**: displays the current line ending (`CRLF`, `LF`, or `Mixed`) in the status bar.
- **Quick switching**: pick a new line ending from a modal in the status bar.
- **Conversion commands**: convert the active file to `LF` or `CRLF`.
- **Default line ending**: choose the line ending applied to newly created files.

## Commands

Commands available in `atom-text-editor`:

- `line-ending-selector:show`: open the line ending picker,
- `line-ending-selector:convert-to-LF`: convert the file to `LF` line endings,
- `line-ending-selector:convert-to-CRLF`: convert the file to `CRLF` line endings.

## Services

- **status-bar** (`^1.0.0`): consumed to show the current line ending in the status bar.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
