# fuzzy-files

Quickly find and take an action over project files.

## Features

- **Fast fuzzy search**: Uses algorithm with smart scoring. Results are ranked by match quality, adjusted by relative distance from the active editor file and directory depth. Files closer to your current context appear higher.
- **Line navigation**: Jump to specific line using `:` syntax (e.g., `file.js:42`).
- **Multiple projects**: Supports multiple project paths.
- **Real-time updates**: Auto-refreshes on file create/delete/rename.
- **File icons**: Display file icons in the list, via [file-icons](https://github.com/file-icons/atom).
- **External opening**: Open files with external applications through the `open-external` service.
- **Chat attachment**: Attach file to Claude chat context through the `claude-chat` service.
- **Clipboard support**: Copy/cut file to Windows clipboard through the `windows-clip` service.
- **Tree view reveal**: Reveal selected file in tree view through the `tree-view-plus` service.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-files:toggle`: toggle fuzzy files panel,
- `fuzzy-files:refresh`: refresh file cache.

Commands available in `.fuzzy-files`:

- `select-list:open`: open file,
- `select-list:open-external`: open file externally,
- `select-list:show-in-folder`: show in folder,
- `select-list:trash`: move file to trash,
- `select-list:split-left/right/up/down`: open in split pane,
- `select-list:refresh-index`: refresh file index,
- `select-list:copy-relative-path`: copy relative path,
- `select-list:copy-project-path`: copy project path,
- `select-list:copy-absolute-path`: copy absolute path,
- `select-list:copy-file-name`: copy file name,
- `select-list:insert-relative-path`: insert relative path,
- `select-list:insert-project-path`: insert project path,
- `select-list:insert-absolute-path`: insert absolute path,
- `select-list:insert-file-name`: insert file name,
- `select-list:use-default-separator`: use default separator,
- `select-list:use-forward-slashes`: use forward slash,
- `select-list:use-backslashes`: use backslash,
- `select-list:query-selected-path`: set query from selected item path,
- `select-list:query-selection`: set query from editor selection,
- `select-list:reveal-in-tree-view`: reveal selected file in tree view,
- `select-list:cut-file`: cut selected file,
- `select-list:copy-file`: copy selected file.

## Provided Service `fuzzy-files.score-modifier`

Allows other packages to register functions that modify the score of search results. Consumer packages can use this to boost or penalize specific files in the ranking.

In your `package.json`:

```json
{
  "consumedServices": {
    "fuzzy-files.score-modifier": {
      "versions": { "^1.0.0": "consumeScoreModifier" }
    }
  }
}
```

In your main module:

```javascript
consumeScoreModifier(service) {
  return service.add((score, item) => {
    // item: { fPath, aPath, pPath, nPath, rPath, distance }
    return score * multiplier;
  });
}
```

## Consumed Service `atom.file-icons`

Displays file type icons next to entries in the file list. Provided by [file-icons](https://github.com/file-icons/atom).

## Consumed Service `open-external`

Opens files with external applications.

## Consumed Service `claude-chat`

Attaches selected files to the Claude chat context.

## Consumed Service `windows-clip`

Copy and cut files to the Windows clipboard.

## Consumed Service `tree-view-plus`

Reveals the selected file in the tree view.
