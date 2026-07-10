# autosave

Save editors when they lose focus or are closed.

## Features

- **Save on blur**: saves an editor when it loses focus.
- **Save on close**: saves an item when its pane is closed or the window is closed.
- **Conflict aware**: skips saving files that are in conflict when prompting is enabled.
- **Opt-in**: disabled by default and enabled through the `autosave.enabled` setting.
- **Exclusion hook**: lets other packages exclude items from autosaving through the provided service.

## Services

- **autosave** (`1.0.0`): provided to expose a `dontSaveIf` callback so other packages can exclude specific pane items from being autosaved.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
