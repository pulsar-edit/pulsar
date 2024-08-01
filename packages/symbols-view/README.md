# symbols-view

Display a list of symbols in the editor. Typically, a symbol will correspond to a meaningful part of a source code file (like a function definition) but can refer to other important parts of files depending on context.

## Providers

`symbols-view` uses a provider/subscriber model similar to that of `autocomplete-plus`. This package implements the UI, but it relies on other packages to suggest symbols.

### Built-in providers

The original symbol provider, `ctags`, now lives in its own provider package called `symbol-provider-ctags`. Another package, `symbol-provider-tree-sitter`, is the preferred provider (by default) in buffers that use a Tree-sitter grammar.

### Community package providers

Any package can act as a symbol provider. [These are the packages on the Pulsar Package Repository that provide the `symbol.provider` service.](https://web.pulsar-edit.dev/packages?service=symbol.provider&serviceType=provided)

## Commands

|Command|Description|Keybinding (Linux/Windows)|Keybinding (macOS)|
|-------|-----------|------------------|-----------------|
|`symbols-view:toggle-file-symbols`|Show all symbols in current file|<kbd>ctrl-r</kbd>|<kbd>cmd-r</kbd>|
|`symbols-view:toggle-project-symbols`|Show all symbols in the project|<kbd>ctrl-shift-r</kbd>|<kbd>cmd-shift-r</kbd>|
|`symbols-view:go-to-declaration`|Jump to the symbol under the cursor|<kbd>ctrl-alt-down</kbd>|<kbd>cmd-alt-down</kbd>|
|`symbols-view:return-from-declaration`|Return from the jump|<kbd>ctrl-alt-up</kbd>|<kbd>cmd-alt-up</kbd>|
|`symbols-view:show-active-providers`|Display a list of all known symbol providers|||

Commands relating to project-wide symbols may fail if no provider can satisfy a request for project-wide symbols. See `symbol-provider-ctags` for more information.
