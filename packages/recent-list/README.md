# recent-list

Quick access to recently opened projects.

## Features

- **Recent list**: browse and open recently opened projects.
- **Multiple open modes**: open in a new window, swap, switch in the same window, or append to the current window.
- **Dev and safe mode**: open projects in dev mode or safe mode directly from the list.
- **Visual indicators**: items configured with dev mode or safe mode are marked with distinct icons.
- **Recency-aware filtering**: fuzzy matching adjusts scores with a recency bonus and a shallower-path bonus.

## Commands

Commands available in `atom-workspace`:

- `recent-list:toggle`: open the recent list.

Commands available in `.recent-list`:

- `select-list:open`: open a new window with the selected project,
- `select-list:swap`: close the active window and open a new one with the selected project,
- `select-list:switch`: switch to a new window with the selected project,
- `select-list:append`: append the selected project to the active window,
- `select-list:paste`: paste paths into the active text editor,
- `select-list:dev`: open a new window with the selected project in dev mode,
- `select-list:safe`: open a new window with the selected project in safe mode,
- `select-list:external`: open folders externally,
- `select-list:show`: show folders in the explorer,
- `select-list:update`: update the recent list,
- `select-list:delete`: remove the selected project from the recent list.

## Services

- **recent-list** (`1.0.0`): provided to expose the recent projects list manager so other packages can open the list without depending on the toggle command.
- **open-external** (`^1.0.0`): consumed to open folders externally and shows them in the explorer.

## Customization

Resize the results panel by adding CSS to your `styles.less`:

```less
.recent-list {
  font-size: 14px;
  .list-group {
    max-height: 20em;
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
