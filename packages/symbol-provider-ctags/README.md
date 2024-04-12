# symbol-provider-ctags package

Provides symbols to `symbols-view` via `ctags`.

This is the approach historically used by `symbols-view` — now spun out into its own “provider” package among several.

This symbol provider will typically be used on non-Tree-sitter grammars, and possibly when performing a project-wide search. Symbol-based navigation on files with Tree-sitter grammars will typically be provided by `symbol-provider-tree-sitter`.

## Language support

This provider supports any language that is present in its config file, and detects any symbols that match the specified patterns. If your language isn’t supported and you can help add support, we’ll happily accept a pull request.

## Toggle file symbols

For the **Symbols View: Toggle File Symbols** command, `ctags` will scan the file on disk and emit its tag information to stdout, where it is read by this package. You don’t need a `TAGS` file to do a symbol search within a single file.

## Toggle Project Symbols, Go To Declaration

These commands require a tags file, typically defined at `.tags`/`tags`/`.TAGS`/`TAGS` in the root of your project. This package cannot generate (or regenerate) your tags file, since it doesn’t know which files to include. You can run `ctags` regularly on your own to generate this file. Consult [the documentation for Exuberant Ctags](https://ctags.sourceforge.net/ctags.html) for more information.

Once your tags file is present, these commands can be fulfilled by `symbol-provider-ctags`…

* The **Symbols View: Toggle Project Symbols** command works like **Symbols View: Toggle File Symbols** described above, except it’ll show you symbols from the entire project.
* The **Symbols View: Go To Declaration** command works like **Symbols View: Toggle Project Symbols**, except the word under the cursor will be pre-filled in the search box, and a result will automatically be opened if it is the only result.
