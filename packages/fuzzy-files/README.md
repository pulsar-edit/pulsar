# fuzzy-files

Quickly find and take an action over project files.

## Features

- **Fast fuzzy search**: ranks results by match quality, adjusted by distance from the active file and directory depth.
- **Line navigation**: jumps to a specific line using `:` syntax such as `file.js:42`.
- **Multiple projects**: searches across every open project path.
- **Real-time updates**: auto-refreshes on file create, delete, and rename.
- **Path actions**: copies, inserts, or reveals file paths in several formats.
- **Service integration**: opens files externally, reveals them in the tree view, and copies them to the clipboard through optional services.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-files:toggle`: toggle the fuzzy files panel,
- `fuzzy-files:refresh`: refresh the file cache.

Commands available in `.fuzzy-files`:

- `select-list:open`: open the selected file,
- `select-list:open-external`: open the selected file externally,
- `select-list:show-in-folder`: show the selected file in its folder,
- `select-list:trash`: move the selected file to the trash,
- `select-list:split-left/right/up/down`: open the selected file in a split pane,
- `select-list:refresh-index`: refresh the file index,
- `select-list:copy-relative-path`: copy the relative path,
- `select-list:copy-project-path`: copy the project path,
- `select-list:copy-absolute-path`: copy the absolute path,
- `select-list:copy-file-name`: copy the file name,
- `select-list:insert-relative-path`: insert the relative path,
- `select-list:insert-project-path`: insert the project path,
- `select-list:insert-absolute-path`: insert the absolute path,
- `select-list:insert-file-name`: insert the file name,
- `select-list:use-default-separator`: use the default path separator,
- `select-list:use-forward-slashes`: use forward slashes in paths,
- `select-list:use-backslashes`: use backslashes in paths,
- `select-list:query-selected-path`: set the query from the selected item path,
- `select-list:query-selection`: set the query from the editor selection,
- `select-list:reveal-in-tree-view`: reveal the selected file in the tree view,
- `select-list:cut-file`: cut the selected file,
- `select-list:copy-file`: copy the selected file,
- `select-list:claude-chat`: attach the selected file to claude-chat.

## Services

- **fuzzy-files.score-modifier** (`1.0.0`): provided to let other packages register functions that boost or penalize the score of search results.
- **atom.file-icons** (`1.0.0`): consumed to show file-type icons next to results.
- **open-external** (`1.0.0`): consumed to open files with the configured external application.
- **windows-clip** (`1.0.0`): consumed to copy and cuts files to the Windows clipboard.
- **claude-chat** (`1.0.0`): consumed to attach the selected file to a claude-chat session.
- **tree-view-plus** (`1.0.0`): consumed to reveal the selected file in the tree view.

## Customization

Resize the results panel by adding CSS to your `styles.less`:

```less
.fuzzy-files {
  font-size: 14px;
  .list-group {
    max-height: 20em;
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
