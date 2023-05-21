# Tree View package

Explore and open files in the current project.

Press <kbd>ctrl-\\</kbd> or <kbd>cmd-\\</kbd> to open/close the tree view and
<kbd>alt-\\</kbd> or <kbd>ctrl-0</kbd> to focus it.

When the tree view has focus you can press <kbd>a</kbd>, <kbd>shift-a</kbd>,
<kbd>m</kbd>, or <kbd>delete</kbd> to add, move or delete files and folders.

To move the Tree view to the opposite side, select and drag the Tree view dock to the other side.

![](https://f.cloud.github.com/assets/671378/2241932/6d9cface-9ceb-11e3-9026-31d5011d889d.png)

## API
This package provides a service that you can use in other Pulsar packages.
To use it, include `tree-view` in the `consumedServices` section of your
`package.json`:

``` json
{
  "name": "my-package",
  "consumedServices": {
    "tree-view": {
      "versions": {
        "^1.0.0": "consumeTreeView"
      }
    }
  }
}
```

Then, in your package's main module, call methods on the service:

``` coffee
module.exports =
  activate: -> # ...

  consumeTreeView: (treeView) ->
    selectedPaths = treeView.selectedPaths()
    # Do something with the paths...
```

The `tree-view` API has two methods:
* `selectedPaths()` - Returns the paths to the selected tree view entries.
* `entryForPath(entryPath)` - Returns a tree view entry for the given path.

## Customization
The tree view displays icons next to files. These icons are customizable by
installing a package that provides an `atom.file-icons` service.

The `atom.file-icons` service must provide the following methods:
* `iconClassForPath(path)` - Returns a CSS class name to add to the file view.
