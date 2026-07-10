# fuzzy-workspace

Quickly find and focus any open item across the workspace.

## Features

- **Fast fuzzy search**: Uses a smart scoring algorithm to rank open items by match quality.
- **Full workspace coverage**: Lists every open pane item in the workspace center and the left, right, and bottom docks.
- **Focus on confirm**: Selecting an item reveals its dock (if hidden), activates its pane, and focuses it.
- **Item actions**: Close an item or copy its path without leaving the keyboard.
- **Icons**: Display an icon per item, derived from the item icon name or its file path.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-workspace:toggle`: toggle the fuzzy workspace panel.

Commands available in `.fuzzy-workspace`:

- `select-list:focus-selected-item`: focus the selected item,
- `select-list:close-selected-item`: close the selected item,
- `select-list:copy-selected-path`: copy the path of the selected item,
- `select-list:query-selection`: set query from editor selection.

## Contributing

This package is maintained as part of the Lumine core package set.
