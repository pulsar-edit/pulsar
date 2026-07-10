# overtype-mode

Replace existing text as you type instead of inserting, with a visual block cursor and a status bar indicator.

## Features

- **Toggle mode**: switch overtype globally or per editor.
- **Block cursor**: visual feedback while overtype mode is active.
- **Status indicator**: shows the current mode in the status bar.
- **Line-aware**: typing at the end of a line inserts rather than eating the newline.

## Commands

Commands available in `atom-workspace`:

- `overtype-mode:toggle-global`: toggle overtype mode for all editors and set the default for editors opened afterwards.

Commands available in `atom-text-editor`:

- `overtype-mode:toggle-editor`: toggle overtype mode for the current editor only.

## Customization

The block cursor style can be adjusted in your `styles.less`:

```less
atom-text-editor.overtype-cursor .cursors .cursor {
  border-color: @syntax-cursor-color;
  background-color: fade(@syntax-cursor-color, 30%);
}
```

## Services

- **status-bar** (`^1.0.0`): consumed to show the overtype-mode indicator tile in the status bar.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
