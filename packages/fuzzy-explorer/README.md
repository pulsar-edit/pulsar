# fuzzy-explorer

Fuzzy search files across user-defined directories.

## Features

- **Fast fuzzy search**: Uses algorithm with smart scoring.
- **Manual refresh**: Cache updates only when triggered by user.
- **External opening**: Open files with external applications through the `open-external` service.

## Commands

Commands available in `atom-workspace`:

- `fuzzy-explorer:toggle`: toggle fuzzy explorer panel,
- `fuzzy-explorer:refresh`: refresh file cache,
- `fuzzy-explorer:edit`: open config file.

Commands available in `.fuzzy-explorer`:

- `select-list:open`: open file,
- `select-list:open-external`: open file externally,
- `select-list:show-in-folder`: show in folder,
- `select-list:split-left/right/up/down`: open in split pane,
- `select-list:refresh-index`: refresh file index,
- `select-list:copy-relative-path`: copy relative path,
- `select-list:copy-absolute-path`: copy absolute path,
- `select-list:copy-file-name`: copy file name,
- `select-list:insert-relative-path`: insert relative path,
- `select-list:insert-absolute-path`: insert absolute path,
- `select-list:insert-file-name`: insert file name,
- `select-list:use-default-separator`: use default separator,
- `select-list:use-forward-slashes`: use forward slash,
- `select-list:use-backslashes`: use backslash,
- `select-list:query-selected-path`: set query from selected item path,
- `select-list:query-selection`: set query from editor selection,
- `select-list:claude-chat`: attach file to claude-chat.

## Configuration

Create a config file at the Lumine config path, `explorer.cson`, with an array of glob patterns:

```cson
[
  "C:/Projects/**"
  "D:/Work/src/*.ts"
  "E:/Documents/**/*.md"
]
```

## Services

- **atom.file-icons** (`1.0.0`): consumed to show file-type icons next to results.
- **open-external** (`^1.0.0`): consumed to open files with the configured external application.
- **claude-chat** (`^1.0.0`): consumed to attach the selected file to a claude-chat session.

## Customization

Resize the results panel by adding CSS to your `styles.css`:

```css
.fuzzy-explorer {
  font-size: 14px;
  .list-group {
    max-height: 20em;
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
