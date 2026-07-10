# window-title

Customize the window title with a template.

## Features

- **Template-based title**: compose the window title from placeholders like the project title, file name, or git branch.
- **Project awareness**: shows the matching project title from the `project-list` package when the window's roots match a saved project.
- **Safe fallback**: if the template renders empty, the default title is kept untouched.

## Configuration

The `Window Title Template` setting is a plain string with `{placeholder}` variables. Available placeholders:

| Placeholder          | Value                                                             |
| -------------------- | ----------------------------------------------------------------- |
| `{projectTitle}`     | Title of the matched project from the project-list configuration. |
| `{projectName}`      | Base name of the first project root.                              |
| `{projectPath}`      | Full path of the first project root.                              |
| `{fileName}`         | Name of the active file (or the active item's title).             |
| `{filePath}`         | Full path of the active file.                                     |
| `{relativeFilePath}` | Path of the active file relative to its project root.             |
| `{gitHead}`          | Short head (branch) of the first project repository.              |
| `{appName}`          | Application name.                                                 |
| `{devMode}`          | `dev` when the window runs in dev mode, empty otherwise.          |
| `{safeMode}`         | `safe` when the window runs in safe mode, empty otherwise.        |

Empty placeholders are removed, together with leftover empty brackets and doubled whitespace. Example:

```
{projectTitle} — {fileName} [{gitHead}]
```

## Services

- **project-list** (`^1.0.0`): consumed to resolve the `{projectTitle}` placeholder from the current window's matched project.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
