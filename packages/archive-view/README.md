# archive-view

Browse the files and folders inside archive files in Lumine.

## Features

- **Archive browsing**: opens archives as a tree of their contents inside an editor tab.
- **Broad format support**: handles `.egg`, `.epub`, `.jar`, `.love`, `.nupkg`, `.tar`, `.tar.gz`, `.tgz`, `.war`, `.whl`, `.xpi`, and `.zip` files.
- **Extract and open**: selecting a file extracts it to a temporary file and opens it in a new editor.
- **File icons**: shows file-type icons for entries when an icon service is available.

## Services

- **atom.file-icons** (`1.0.0`): consumed to supply file-type icon classes for archive entries.
- **file-icons.element-icons** (`1.0.0`): consumed to supply element-based file icons for archive entries.

## Customization

Change the archive browser's background by adding CSS to your `styles.css`:

```css
.archive-editor {
  background-color: #1e1e1e;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
