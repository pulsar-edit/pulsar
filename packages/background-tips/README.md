# background-tips

Displays tips about Lumine in the background when there are no editors open.

## Features

- **Idle tips**: shows helpful tips whenever the workspace has no open editors.
- **Live keybindings**: replaces `{command}` placeholders with the current keybinding for that command.
- **Package contributions**: lets any package add its own tips through a `backgroundTips` array.

## Usage

Packages can contribute tips by adding a `backgroundTips` array to their `package.json`. Each entry is a string displayed as-is, with optional `{command}` placeholders that are replaced by the current keybinding for that command.

```json
"backgroundTips": [
  "You can toggle the Tree View with {atom-workspace>tree-view:toggle}",
  "You can open any file quickly using {atom-workspace>fuzzy-files:toggle}"
]
```

The placeholder syntax is `{command}` or `{scope>command}`:

- `{command}` resolves the keybinding using the current platform.
- `{scope>command}` resolves the keybinding for the given CSS selector scope (e.g. `atom-workspace`, `atom-text-editor`, `body`).

If the command in a placeholder has no keybinding defined, the tip is skipped entirely.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
