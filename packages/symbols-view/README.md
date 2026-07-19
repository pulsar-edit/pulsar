# symbols-view

Jump to a function, method, or symbol in the current editor or across the project.

## Features

- **File symbols**: browse and jump to any symbol in the active editor.
- **Project symbols**: search for symbols across the entire project.
- **Go to declaration**: navigate to the declaration of the symbol under the cursor.
- **Return from declaration**: jump back to where you were before following a declaration.
- **Pluggable providers**: gather symbols from any package that supplies a symbol provider.
- **Hyperclick support**: follow a symbol to its declaration with a click.

## Commands

Commands available in `atom-workspace`:

- `symbols-view:toggle-project-symbols`: search for a symbol across the whole project,
- `symbols-view:show-active-providers`: list the symbol providers currently available.

Commands available in `atom-text-editor:not([mini])`:

- `symbols-view:toggle-file-symbols`: browse the symbols in the active editor,
- `symbols-view:go-to-declaration`: jump to the declaration of the symbol under the cursor,
- `symbols-view:return-from-declaration`: return to the position before the last declaration jump.

## Services

- **hyperclick** (`0.1.0`): provided to let you follow a symbol to its declaration with a click.
- **symbol.provider** (`1.0.0`): consumed to allow external sources to suggest symbols for a given file or project.

## Customization

Restyle the symbols list by adding CSS to your `styles.css`. For example, to enlarge the entries and loosen their spacing:

```css
.symbols-view .list-group li {
  font-size: 14px;
  padding: 6px 10px;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
