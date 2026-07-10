# open-external

Open files and directories with their system applications from Lumine.

## Features

- **External opening**: opens active files and tree-view selections in their default system applications.
- **File manager integration**: reveals active files and tree-view selections in the system file manager.
- **Automatic redirection**: opens files with configured extensions outside Lumine.
- **Custom handlers**: lets other packages intercept external file operations.

## Commands

Commands available in `atom-workspace`:

- `open-external:toggle`: toggle automatic external opening.

Commands available in `atom-text-editor:not([mini]), .image-view, .image-editor, .pdf-viewer`:

- `open-external:open`: open the active file externally,
- `open-external:show`: reveal the active file in the system file manager.

Commands available in `.tree-view`:

- `open-external:open`: open selected items externally,
- `open-external:show`: reveal selected items in the system file manager.

## Usage

The provided service exposes `openExternal(filePath)`, `showInFolder(filePath)`, and
`registerHandler(handler)`. A custom handler must define a finite numeric `priority` and at least
one operation. Higher-priority handlers run first; returning `null` or `undefined` passes the
operation to the next handler.

## Services

- **open-external** (`1.0.0`): provided to open or reveal paths and register custom handlers for those operations.
- **tree-view** (`^1.0.0`): consumed to access the paths currently selected in the tree view.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
