# image-paste

Paste clipboard images into projects as image files.

## Features

- **Native clipboard support**: reads standard image data from clipboard events with an Electron fallback.
- **Safe project paths**: saves images inside the selected project or tree-view directory.
- **Automatic naming**: suggests stable names based on the document and image content.
- **Editor integration**: inserts a relative path only after the image is written successfully.
- **Tree-view integration**: saves images into the selected directory without replacing tree-view's internal clipboard.

## Commands

Commands available in `atom-text-editor:not([mini])`:

- `image-paste:paste`: save the clipboard image and insert its relative path.

Commands available in `.tree-view`:

- `image-paste:paste`: save the clipboard image in the selected directory.

## Usage

Copy an image, invoke the normal paste command or `image-paste:paste`, review the suggested project-relative path, and confirm the save. PNG, JPG, and JPEG output names are supported; other extensions are converted to PNG.

## Customization

Customize the modal with CSS and package custom properties:

```css
.image-paste.save-dialog {
  max-width: 52rem;
  --image-paste-preview-max-height: 24rem;
}
```

## Services

- **tree-view** (`^1.0.0`): consumed to locate the selected directory for explicit image paste commands.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
