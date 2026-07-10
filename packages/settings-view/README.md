# settings-view

Edit config settings, install packages, and change themes in Lumine.

## Features

- **Settings editor**: browse and change core and editor settings from a single view.
- **Package management**: install, uninstall, and update community packages.
- **Theme management**: install, uninstall, and switch between UI and syntax themes.
- **Keybinding browser**: view all active keybindings in one place.
- **Settings search**: find individual settings by name across every panel.
- **Status bar integration**: open settings from the status bar and see when package updates are available.

## Commands

Commands available in `atom-workspace`:

- `settings-view:open`: open the settings view,
- `settings-view:core`: open the core settings panel,
- `settings-view:editor`: open the editor settings panel,
- `settings-view:show-keybindings`: open the keybindings panel,
- `settings-view:change-themes`: open the themes panel to change themes,
- `settings-view:install-packages-and-themes`: open the install panel,
- `settings-view:view-installed-themes`: open the themes panel to view installed themes,
- `settings-view:uninstall-themes`: open the themes panel to manage themes,
- `settings-view:view-installed-packages`: open the packages panel,
- `settings-view:uninstall-packages`: open the packages panel to manage packages,
- `settings-view:check-for-package-updates`: open the updates panel,
- `settings-view:system`: open the system panel (Windows only).

## Services

- **status-bar** (`^1.0.0`): consumed to add a settings icon and a package-updates indicator to the status bar.
- **snippets** (`0.1.0`): consumed to read user snippets so they can be displayed alongside settings.

## Customization

Adjust the settings view to taste by adding CSS to your `styles.less`:

```less
.settings-view {
  font-size: 15px;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
