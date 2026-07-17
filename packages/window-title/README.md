# window-title

Choose a preset or customize the window title with a Liquid template.

## Features

- **Preset and custom titles**: choose a project, file, project-and-file, or full-path title, or compose one with a Liquid template.
- **Project awareness**: shows the matching project title from the `project-list` package when the window's roots match a saved project.
- **Safe fallback**: if the template renders empty or fails, the title falls back to `Lumine`.

## Configuration

The `Window Title` setting provides `Project`, `File`, `Project and File`, and `Full Path` presets.

Choose `Custom` to use the `Custom Template` setting. Custom titles use [LiquidJS](https://liquidjs.com/) syntax: `{{ variable }}` outputs a value, and tags such as `{% if variable %}...{% else %}...{% endif %}` add conditional content. Available variables:

| Variable           | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| `projectTitle`     | Title of the matched project from the project-list configuration. |
| `projectPaths`     | All project roots, joined with a comma.                           |
| `projectCount`     | Number of project roots in the window.                            |
| `projectName`      | Base name of the first project root.                              |
| `projectPath`      | Full path of the first project root.                              |
| `fileName`         | Name of the active file (or the active item's title).             |
| `filePath`         | Full path of the active file.                                     |
| `relativeFilePath` | Path of the active file relative to its project root.             |
| `gitHead`          | Short head (branch) of the first project repository.              |
| `appName`          | Application name.                                                 |
| `devMode`          | `true` when the window runs in dev mode.                          |
| `safeMode`         | `true` when the window runs in safe mode.                         |

Unavailable variables render as empty strings; leftover empty brackets and doubled whitespace are cleaned up.

## Examples

After selecting `Custom`, use the saved project title when available, or the active file and project roots otherwise. This example also marks development and safe-mode windows:

```
{% if projectTitle %}{{ projectTitle }}{% else %}{{ fileName }} — {{ projectPaths }}{% endif %}{% if devMode %} [Dev]{% endif %}{% if safeMode %} [Safe]{% endif %}
```

Show the number of roots only when the window contains more than one:

```
{% if projectCount > 1 %}{{ projectCount }} roots — {% endif %}{{ fileName }}
```

Combine the project, relative file path, and current Git branch:

```
{% if projectTitle %}{{ projectTitle }}{% else %}{{ projectName }}{% endif %} — {{ relativeFilePath }} [{{ gitHead }}]
```

## Services

- **project-list** (`^1.0.0`): consumed to resolve the `{projectTitle}` placeholder from the current window's matched project.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
