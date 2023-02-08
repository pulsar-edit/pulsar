# Symbols View package

Display the list of functions/methods in the editor.

If your project has a `tags`/`.tags`/`TAGS`/`.TAGS` file at the root then following are supported:

|Command|Description|Keybinding (Linux)|Keybinding (macOS)|Keybinding (Windows)|
|-------|-----------|------------------|-----------------|--------------------|
|`symbols-view:toggle-file-symbols`|Show all symbols in current file|<kbd>ctrl-r</kbd>|<kbd>cmd-r</kbd>|<kbd>ctrl-r</kbd>|
|`symbols-view:toggle-project-symbols`|Show all symbols in the project|<kbd>ctrl-shift-r</kbd>|<kbd>cmd-shift-r</kbd>|<kbd>ctrl-shift-r</kbd>|
|`symbols-view:go-to-declaration`|Jump to the symbol under the cursor|<kbd>ctrl-alt-down</kbd>|<kbd>cmd-alt-down</kbd>||
|`symbols-view:return-from-declaration`|Return from the jump|<kbd>ctrl-alt-up</kbd>|<kbd>cmd-alt-up</kbd>||

This package uses [ctags](http://ctags.sourceforge.net).

![](https://f.cloud.github.com/assets/671378/2241860/30ef0b2e-9ce8-11e3-86e2-2c17c0885fa4.png)
