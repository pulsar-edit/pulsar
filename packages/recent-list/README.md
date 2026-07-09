# recent-list

Quick access to recently opened projects.

## Features

- **Recent list**: Browse and open recently opened projects.
- **Multiple open modes**: Open in new window, swap, switch in same window, or append to current window.
- **Dev and safe mode**: Open projects in dev mode or safe mode directly from the list.
- **Visual indicators**: Items configured with `devMode` or `safeMode` are marked with distinct icons in the list.
- **Tree view integration**: When used with [tree-view-plus](https://github.com/asiloisad/pulsar-tree-view-plus), the empty project view provides quick access to recent projects.

## Installation

To install `recent-list` search for [recent-list](https://web.pulsar-edit.dev/packages/recent-list) in the Install pane of the Pulsar settings or run `ppm install recent-list`. Alternatively, you can run `ppm install asiloisad/pulsar-recent-list` to install a package directly from the GitHub repository.

The [project-list](https://github.com/asiloisad/pulsar-project-list) package provides a saved project list with tags, scanning, and glob paths. Both packages share the same open modes and key bindings.

## Commands

Commands available in `atom-workspace`:

- `recent-list:toggle`: opens recent list.

Commands available in `.recent-list`:

- `select-list:open`: opens a new window with selected project,
- `select-list:swap`: closes active window and opens a new one with the selected project,
- `select-list:switch`: switches to a new window with the selected project,
- `select-list:append`: appends selected project to active window,
- `select-list:paste`: paste paths into active text-editor,
- `select-list:dev`: opens a new window with selected project in dev mode,
- `select-list:safe`: opens a new window with selected project in safe mode,
- `select-list:external`: open folders externally (via [open-external](https://github.com/asiloisad/pulsar-open-external)),
- `select-list:show`: show folders in explorer (via [open-external](https://github.com/asiloisad/pulsar-open-external)),
- `select-list:update`: update recent list,
- `select-list:delete`: remove selected project from recent list.

## Filtering

Fuzzy matching uses the `fuzzaldrin` algorithm. Match scores are adjusted by a recency bonus (more recently opened projects rank up) and a depth bonus (shallower paths rank up).

## Consumed Service `open-external`

When the [open-external](https://github.com/asiloisad/pulsar-open-external) package is installed, two additional actions become available: open folders externally and show folders in explorer. For multi-path projects, the action is applied to each path.

## Provided Service `recent-list`

Provides access to the recent projects list. Other packages can use this to open the recent list without depending on the `recent-list:toggle` command.

In your `package.json`:

```json
{
  "consumedServices": {
    "recent-list": {
      "versions": { "1.0.0": "consumeRecentList" }
    }
  }
}
```

In your main module:

```javascript
consumeRecentList(recentList) {
  this.recentList = recentList;
  return new Disposable(() => { this.recentList = null; });
}
```

- `toggle()`: opens or closes the recent projects panel.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
