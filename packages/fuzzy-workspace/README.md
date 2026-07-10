# fuzzy-workspace

Quickly find and focus any open item across the workspace.

## Features

- **Fast fuzzy search**: ranks open items by match quality with a smart scoring algorithm.
- **Full workspace coverage**: lists every open pane item in the workspace center and the left, right, and bottom docks.
- **Focus on confirm**: reveals an item's dock if hidden, activates its pane, and focuses it.
- **Item actions**: closes an item or copies its path without leaving the keyboard.
- **Icons**: shows an icon per item, derived from the item icon name or its file path.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-workspace:toggle`: toggle the fuzzy workspace panel.

Commands available in `.fuzzy-workspace`:

- `select-list:focus-selected-item`: focus the selected item,
- `select-list:close-selected-item`: close the selected item,
- `select-list:copy-selected-path`: copy the path of the selected item,
- `select-list:query-selection`: set the query from the editor selection.

## Customization

Resize the results panel by adding CSS to your `styles.less`:

```less
.fuzzy-workspace {
  font-size: 14px;
  .list-group {
    max-height: 20em;
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
