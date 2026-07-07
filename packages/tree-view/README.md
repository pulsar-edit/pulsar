# tree-view

Enhanced tree view for exploring and opening project files.

## Features

- **Configurable click behavior**: Open files and expand folders on single or double click. Double-clicking a file always opens it without pending state. The arrow icon always responds to a single click regardless of the folder click setting.
- **Middle-click selection**: Middle-click selects an entry without triggering scroll or open behavior.
- **Alt+click open externally**: Alt+click on a file opens it in an external program via the `open-external` service.
- **Natural sorting**: Treats multi-digit numbers atomically (e.g., `file2` before `file10`). Choose between natural sort and locale-aware collation.
- **Base name grouping**: Sort by filename base and extension independently, so files with the same base name are grouped together.
- **Configurable duplicate copy names**: Choose system-default, legacy, Windows, macOS, or Linux/GNOME naming when pasted copies collide.
- **Debounced file watching**: Rapid file creation/deletion no longer causes excessive reloads. File system events are batched with a 100ms debounce.
- **Survives workspace restoration**: The tree view is closeable via the X button, but protected from accidental destruction during project switching.
- **Bug fixes**: Fixed expansion state serialization, drag-and-drop URI handling, copy dialog crash, move entry error handling, continuous selection, and split pane `ItemRegistry` error.
- **Project list integration**: When the [project-list](https://github.com/asiloisad/pulsar-project-list) package is installed, the empty project view shows a "List projects" button.
- **Recent list integration**: When the [recent-list](https://github.com/asiloisad/pulsar-recent-list) package is installed, the "Reopen a project" button opens the recent projects list instead of the built-in dialog.
- **Lightweight dependencies**: Removed `underscore-plus` and `fs-plus` in favor of native Node.js APIs.
- **Special roots service**: Provides a `tree-view-roots` service that lets external packages inject virtual root sections into the tree view. Used by [tree-view-favourites](https://github.com/asiloisad/pulsar-tree-view-favourites) to add favourite sections.

## Installation

To install `tree-view` search for [tree-view](https://web.pulsar-edit.dev/packages/tree-view) in the Install pane of the Pulsar settings or run `ppm install tree-view`. Alternatively, you can run `ppm install asiloisad/pulsar-tree-view` to install a package directly from the GitHub repository.

## Commands

- `tree-view:toggle`: toggle the tree view,
- `tree-view:reveal-active-file`: reveal the active file,
- `tree-view:toggle-focus`: open and focus tree view, or return focus to editor if already focused,
- `tree-view:copy`: copy selected entries,
- `tree-view:cut`: cut selected entries,
- `tree-view:paste`: paste entries,
- `tree-view:open-selected-entry-right`,
- `tree-view:open-selected-entry-left`,
- `tree-view:open-selected-entry-up`,
- `tree-view:open-selected-entry-down`,
- `tree-view:open-selected-entry-in-pane-1..9`.

## Consumed Service `project-list`

When the [project-list](https://github.com/asiloisad/pulsar-project-list) package is installed, the empty project view (shown when no folders are open) gains a "List projects" button that toggles the project list.

## Consumed Service `recent-list`

When the [recent-list](https://github.com/asiloisad/pulsar-recent-list) package is installed, the "Reopen a project" button in the empty project view opens the recent projects list instead of the built-in Pulsar dialog.

## Provided Service `tree-view`

Compatibility service matching the API of the built-in tree-view package.

In your `package.json`:

```json
{
  "consumedServices": {
    "tree-view": {
      "versions": { "1.0.0": "consumeTreeView" }
    }
  }
}
```

In your main module:

```javascript
consumeTreeView(service) {
  this.treeViewService = service;
  return new Disposable(() => { this.treeViewService = null; });
}
```

The service provides:

- `selectedPaths()`: returns an array of currently selected file/directory paths.
- `entryForPath(filePath)`: returns the DOM entry element for the given path, or `null` if not found.

## Provided Service `tree-view`

Extended tree view API. Use this instead of `tree-view` when you need functionality beyond what the built-in package provides.

In your `package.json`:

```json
{
  "consumedServices": {
    "tree-view": {
      "versions": { "1.0.0": "consumeTreeViewPlus" }
    }
  }
}
```

In your main module:

```javascript
consumeTreeViewPlus(service) {
  this.treeViewService = service;
  return new Disposable(() => { this.treeViewService = null; });
}
```

The service provides everything from `tree-view`, plus:

- `revealPath(filePath, options)`: expands parent directories and selects the entry for `filePath`, scrolling it into view. Accepts `{ show, focus }` options to control tree view visibility and focus.

## Provided Service `tree-view-roots`

Allows external packages to inject virtual root sections into the tree view above the project folders. Used by [tree-view-favourites](https://github.com/asiloisad/pulsar-tree-view-favourites) to add favourite sections.

In your `package.json`:

```json
{
  "consumedServices": {
    "tree-view-roots": {
      "versions": { "1.0.0": "consumeRoots" }
    }
  }
}
```

In your main module:

```javascript
consumeRoots(api) {
  this.handle = api.registerRoot({
    name: 'My Section',        // Section header text
    iconClass: 'icon-star',    // Icon class for the header
    className: 'my-section',   // CSS class for the section container
    entryClassName: 'my-entry', // CSS class for each entry
    getEntries: () => [...],   // Function returning an array of file paths
    onDrop: (paths) => {...},  // Called when entries are dropped onto this section
  })
}
```

The returned handle provides:

- `handle.element`: the section's DOM element (or `null` if not attached)
- `handle.update()`: re-reads entries and re-renders
- `handle.toggle()`: toggle section visibility
- `handle.dispose()`: remove the section

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
