# markdown-preview

Open a live, rendered preview of the Markdown in the current editor.

## Features

- **Live preview**: renders the active Markdown file and updates as you type.
- **Split pane**: opens the preview beside the source or in a new tab.
- **Tree view preview**: opens a preview straight from a Markdown file in the tree view.
- **HTML export**: copies the rendered HTML to the clipboard or saves it to a file.
- **GitHub styling**: optionally renders the preview with GitHub.com styles in light, dark, or system mode.
- **Zoom controls**: zooms the preview in and out or resets it to the default level.

## Commands

Commands available in `atom-text-editor[data-grammar=...]`:

- `markdown-preview:toggle`: open or close the preview for the current editor,
- `markdown-preview:copy-html`: copy the rendered HTML to the clipboard,
- `markdown-preview:save-as-html`: save the rendered HTML to a file,
- `markdown-preview:toggle-break-on-single-newline`: toggle line breaks on single newlines,
- `markdown-preview:toggle-github-style`: toggle the GitHub.com preview style.

Commands available in `.markdown-preview`:

- `markdown-preview:select-all`: select all of the rendered content,
- `markdown-preview:zoom-in`: zoom the preview in,
- `markdown-preview:zoom-out`: zoom the preview out,
- `markdown-preview:reset-zoom`: reset the preview zoom to the default level,
- `markdown-preview:toggle-break-on-single-newline`: toggle line breaks on single newlines,
- `markdown-preview:toggle-github-style`: toggle the GitHub.com preview style.

Commands available in `.tree-view .file .name`:

- `markdown-preview:preview-file`: open a preview of the selected Markdown file.

## Customization

Adjust the preview's typography by adding CSS to your `styles.less`:

```less
.markdown-preview {
  font-size: 16px;
  max-width: 800px;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
