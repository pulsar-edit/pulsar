# tree-view

Explore and open project files in a tree-like view of your directories.

## Features

- **Configurable click behavior**: open files and expand folders on single or double click.
- **Open externally**: alt-click a file to open it in an external program through the `open-external` service.
- **Flexible sorting**: choose locale-aware or natural sort, list folders before files, and group entries by base name.
- **Native clipboard**: copy or cut entries across windows and external applications while preserving platform-specific duplicate names.
- **Debounced file watching**: rapid file creation and deletion is batched so the tree does not reload excessively.
- **Virtual root sections**: let external packages inject their own root sections above the project folders.

## Commands

Commands available in `atom-workspace`:

- `tree-view:show`: show the tree view,
- `tree-view:toggle`: toggle the tree view,
- `tree-view:toggle-focus`: open and focus the tree view, or return focus to the editor if already focused,
- `tree-view:reveal-active-file`: reveal the active file in the tree view,
- `tree-view:add-file`: create a new file,
- `tree-view:add-folder`: create a new folder,
- `tree-view:duplicate`: duplicate the selected entry,
- `tree-view:remove`: delete the selected entries,
- `tree-view:rename`: rename the selected entry,
- `tree-view:show-current-file-in-file-manager`: show the active file in the system file manager.

Commands available in `.tree-view`:

- `tree-view:expand-item`: open the selected entry with pending state,
- `tree-view:recursive-expand-directory`: recursively expand the selected directory,
- `tree-view:collapse-directory`: collapse the selected directory,
- `tree-view:recursive-collapse-directory`: recursively collapse the selected directory,
- `tree-view:collapse-all`: collapse all directories,
- `tree-view:open-selected-entry`: open the selected entry,
- `tree-view:open-selected-entry-right`: open the selected entry in a split to the right,
- `tree-view:open-selected-entry-left`: open the selected entry in a split to the left,
- `tree-view:open-selected-entry-up`: open the selected entry in a split above,
- `tree-view:open-selected-entry-down`: open the selected entry in a split below,
- `tree-view:open-selected-entry-in-pane-1..9`: open the selected entry in the numbered pane,
- `tree-view:move`: move or rename the selected entry,
- `tree-view:copy`: copy the selected entries,
- `tree-view:cut`: cut the selected entries,
- `tree-view:paste`: paste entries,
- `tree-view:copy-full-path`: copy the full path of the selected entry,
- `tree-view:copy-project-path`: copy the project-relative path of the selected entry,
- `tree-view:show-in-file-manager`: show the selected entry in the system file manager,
- `tree-view:open-in-new-window`: open the selected entry in a new window,
- `tree-view:unfocus`: return focus to the editor,
- `tree-view:toggle-vcs-ignored-files`: toggle visibility of VCS-ignored files,
- `tree-view:toggle-ignored-names`: toggle visibility of ignored names,
- `tree-view:remove-project-folder`: remove the selected project folder.

## Services

- **tree-view** (`1.0.0`): provided to expose the selected paths and entry elements of the tree, matching the API of the built-in tree view.
- **tree-view** (`1.0.0`): provided to add reveal and navigation support on top of the base tree view API.
- **tree-view-roots** (`1.0.0`): provided to let external packages register virtual root sections above the project folders.
- **atom.file-icons** (`1.0.0`): consumed to show file-type icons next to entries.
- **file-icons.element-icons** (`1.0.0`): consumed to show element-based file-type icons next to entries.
- **open-external** (`1.0.0`): consumed to open files with the configured external application.
- **project-list** (`1.0.0`): consumed to add a "List projects" button to the empty project view.
- **recent-list** (`1.0.0`): consumed to add a "Reopen a project" button to the empty project view.

## Customization

Adjust the tree's appearance by adding CSS to your `styles.css`. For example, to enlarge the entry text and loosen the row spacing:

```css
.tree-view {
  font-size: 14px;
  line-height: 1.6;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
