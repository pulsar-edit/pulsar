# command-palette

Find and run available commands from a searchable list.

## Features

- **Command search**: fuzzy-search every available command by name.
- **Hidden commands**: optionally include commands normally hidden from the palette.
- **Keybinding hints**: shows the keybinding bound to each command.
- **Persistent search**: optionally preserves the last search when reopening the palette.

## Commands

Commands available in `atom-workspace`:

- `command-palette:toggle`: open the command palette,
- `command-palette:show-hidden-commands`: open the palette including hidden commands.

## Customization

Adjust the palette's size by adding CSS to your `styles.less`:

```less
.command-palette {
  font-size: 14px;
  .list-group {
    max-height: 20em;
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
