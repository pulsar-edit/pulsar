# window-title

Customize the window title with a template.

## Features

- **Template-based title**: compose the window title with a Liquid template from variables like the project title, file name, or git branch.
- **Project awareness**: shows the matching project title from the `project-list` package when the window's roots match a saved project.
- **Safe fallback**: if the template renders empty or fails, the default title is kept untouched.

## Configuration

The `Window Title Template` setting is a [LiquidJS](https://liquidjs.com/) template. Use `{{ variable }}` to output a value and tags such as `{% if variable %}...{% else %}...{% endif %}` for conditional content. Available variables:

| Variable           | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| `projectTitle`     | Title of the matched project from the project-list configuration. |
| `projectPaths`     | All project roots, joined with a comma.                           |
| `projectName`      | Base name of the first project root.                              |
| `projectPath`      | Full path of the first project root.                              |
| `fileName`         | Name of the active file (or the active item's title).             |
| `filePath`         | Full path of the active file.                                     |
| `relativeFilePath` | Path of the active file relative to its project root.             |
| `gitHead`          | Short head (branch) of the first project repository.              |
| `appName`          | Application name.                                                 |
| `devMode`          | `true` when the window runs in dev mode.                          |
| `safeMode`         | `true` when the window runs in safe mode.                         |

Unavailable variables render as empty strings; leftover empty brackets and doubled whitespace are cleaned up. The default template shows the project title when the window matches a saved project. Otherwise, it shows the active file name and project paths. It adds a `[Dev]`/`[Safe]` marker when running in dev or safe mode:

```
{% if projectTitle %}{{ projectTitle }}{% else %}{{ fileName }} — {{ projectPaths }}{% endif %}{% if devMode %} [Dev]{% endif %}{% if safeMode %} [Safe]{% endif %}
```

A richer example:

```
{% if projectTitle %}{{ projectTitle }}{% else %}{{ projectName }}{% endif %} — {{ fileName }} [{{ gitHead }}]
```

## Services

- **project-list** (`^1.0.0`): consumed to resolve the `{projectTitle}` placeholder from the current window's matched project.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
