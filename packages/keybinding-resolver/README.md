# keybinding-resolver

Show what commands a keybinding resolves to.

## Features

- **Keybinding inspection**: displays every command a pressed keybinding maps to.
- **Resolution order**: highlights which binding wins and which are shadowed.
- **Copy directive**: copies the selected keybinding directive so you can paste it into a keymap file.

## Commands

Commands available in `atom-workspace`:

- `key-binding-resolver:toggle`: open or close the keybinding resolver panel.

## Customization

Restyle the resolver panel by adding CSS to your `styles.less`:

```less
.key-binding-resolver {
  font-size: 13px;
  .panel-heading {
    background-color: fade(blue, 10%);
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
