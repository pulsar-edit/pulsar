## Background Tips package

Displays tips about Lumine in the background when there are no open editors.

![Screen shot](https://f.cloud.github.com/assets/69169/1796267/c3de038c-6a60-11e3-8bf8-36f45684902c.png)

### Contributing tips

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
