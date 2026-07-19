# snippets

Expand snippets matching the current prefix with `tab`.

## Features

- **Prefix expansion**: type a prefix and press tab to expand it into its full body.
- **Tab stops**: cycle through placeholders in the expanded snippet.
- **Command triggers**: invoke snippets by command name in addition to prefixes.
- **Variables and transforms**: use LSP and VSCode-style variables with case and sed-style transformations.
- **User and package snippets**: load snippets from packages and from your user `snippets.json`.

## Commands

Commands available in `atom-text-editor`:

- `snippets:expand`: expand the snippet under the cursor,
- `snippets:next-tab-stop`: move to the next tab stop,
- `snippets:previous-tab-stop`: move to the previous tab stop,
- `snippets:available`: show the snippets available for the current editor.

## Usage

Snippet files live in a package's `snippets/` folder and in your user `snippets.json`, and may be `.json`, `.jsonc`, or `.cson`. The outermost keys are the scope selectors, the next level are snippet names, and each snippet provides a `body` along with at least one trigger (`prefix` or `command`):

```jsonc
{
  ".source.js": {
    "console.log": {
      "prefix": "log",
      "body": "console.log(${1:\"crash\"});$2",
    },
  },
}
```

`$` followed by a number marks tab stops that can be cycled with tab once the snippet has expanded. Snippets support a subset of TextMate features plus LSP and VSCode-style variables such as `TM_SELECTED_TEXT`, `TM_FILENAME`, and `CLIPBOARD`, with transformation flags like `/upcase`, `/downcase`, `/camelcase`, and `/kebabcase`.

## Services

- **snippets** (`0.1.0`): provided to expose the loaded snippets so other packages can query and expand them.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
