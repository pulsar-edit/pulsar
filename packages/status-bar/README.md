# status-bar

Display information about the current editor such as cursor position, file path, grammar, and selection count.

## Features

- **Cursor position**: shows the current line and column of the cursor.
- **Selection count**: shows the line and character count of the active selection.
- **File info**: shows the path and grammar of the current editor.
- **Tile host**: lets other packages add custom tiles to the left or right side of the bar.

## Commands

Commands available in `atom-workspace`:

- `status-bar:toggle`: show or hide the status bar at the bottom of the workspace.

## Services

- **status-bar** (`1.1.0`, `0.58.0`): provided to host indicator tiles at the bottom of the workspace, with a left and right side other packages can add to.

## Customization

Restyle the status bar by adding CSS to your `styles.less`. For example, to enlarge the text and add a top border:

```less
status-bar {
  font-size: 13px;
  border-top: 1px solid fade(#000, 20%);
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
