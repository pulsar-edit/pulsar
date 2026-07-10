# project-list

Quick access and switching between projects.

## Features

- **Project list**: browse and open projects saved in a `projects.cson` config file.
- **Directory scanning**: auto-discover subdirectories as projects with glob patterns.
- **Glob paths**: wildcard patterns in `paths` expand to all matching directories at load time.
- **Tags support**: organize and filter projects by tags; a `#tag` query targets tags explicitly.
- **Multiple open modes**: open in a new window, swap, switch in the same window, or append to the current window.
- **Performance cache**: the built list is cached and kept in sync across windows.

## Commands

Commands available in `atom-workspace`:

- `project-list:toggle`: toggle the project list,
- `project-list:update`: rebuild the project list,
- `project-list:edit`: open the configuration file.

Commands available in `.project-list`:

- `select-list:open`: open the selected project in a new window,
- `select-list:swap`: open the selected project in a new window and close the current one,
- `select-list:switch`: switch the current window to the selected project,
- `select-list:append`: append the selected project to the current window,
- `select-list:paste`: insert the project paths into the active text editor,
- `select-list:dev`: open the selected project in a new window in dev mode,
- `select-list:safe`: open the selected project in a new window in safe mode,
- `select-list:external`: open the project folders externally (via open-external),
- `select-list:show`: show the project folders in the system file manager (via open-external),
- `select-list:update`: rebuild the project list.

## Configuration

Projects are defined in `projects.cson` in the Lumine config directory — open it with `project-list:edit`. The file holds an array of project objects:

| Setting    | Type                        | Description                                                                                 | Default                 |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| `title`    | `string`                    | Project title shown in the list. `[tag]` patterns are styled as tags.                       | _mandatory_             |
| `paths`    | `string[]`                  | Project directories. Glob wildcards (`*`, `**`, `?`, `[...]`, `{...}`) expand at load time. | _mandatory_             |
| `tags`     | `string[]`                  | Tags used to organize and find projects.                                                    | `[]`                    |
| `scan`     | `boolean\|string\|string[]` | Scan paths and add matching subdirectories as projects. `true` is equal to `"*/"`.          | `false`                 |
| `icon`     | `string`                    | Custom icon of the project, e.g. `"icon-star"`.                                             | `"icon-file-directory"` |
| `devMode`  | `boolean`                   | Open the project in dev mode.                                                               | `false`                 |
| `safeMode` | `boolean`                   | Open the project in safe mode.                                                              | `false`                 |

Example `projects.cson`:

```cson
[
  {
    title: "My Library"
    paths: [
      "C:/Work/library/"
    ]
    tags: [
      "work"
    ]
    scan: true
  },
  {
    title: "Packages"
    paths: [
      "C:/Work/packages/*"
    ]
    tags: [
      "work"
    ]
  }
]
```

The search query is matched against a combined text string in the format `#tag1 #tag2 Title`, so a `#`-prefixed term ranks tag matches higher. Match scores favor shorter titles and projects with fewer tags.

## Customization

Tweak the appearance of the list by adding CSS to your `styles.less`:

```less
.project-list {
  .tag {
    color: @text-color-info;
  }
  .list-group {
    max-height: 20em;
  }
}
```

## Services

- **project-list** (`1.0.0`): provided to expose the project list manager — used by tree-view's empty project view to show a "List projects" button, and by window-title to resolve the current project title via `getCurrentProject()` / `onDidChangeCurrentProject()`.
- **open-external** (`^1.0.0`): consumed to open project folders externally or show them in the system file manager. For multi-path projects, the action is applied to each path.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
