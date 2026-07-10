# search-panel

Find and replace within buffers and across the project.

## Features

- **Buffer search**: find, highlight, and navigate matches in the active editor.
- **Project search**: search and replace across the project with ripgrep or scandal.
- **In-place replace**: replace matches without a full buffer refresh.
- **Search options**: toggle regex, case sensitivity, whole word, and within-selection.
- **Multiple selections**: select matching ranges to edit them simultaneously.
- **Search adapters**: search custom pane items such as data grids when they expose an adapter.

## Commands

Commands available in `atom-workspace`:

- `search-panel:show`: show the buffer find panel,
- `search-panel:toggle`: toggle the buffer find panel,
- `search-panel:show-replace`: show the buffer find panel focused on replace,
- `search-panel:project-show`: show the project find panel,
- `search-panel:project-toggle`: toggle the project find panel,
- `search-panel:project-show-in-current-directory`: search within the selected directory,
- `search-panel:find-next`: find the next match,
- `search-panel:find-previous`: find the previous match,
- `search-panel:find-all`: find all matches,
- `search-panel:find-next-selected`: use the selection and find the next match,
- `search-panel:find-previous-selected`: use the selection and find the previous match,
- `search-panel:use-selection-as-find-pattern`: set the find pattern from the selection,
- `search-panel:use-selection-as-replace-pattern`: set the replace pattern from the selection,
- `search-panel:replace-next`: replace the current match and advance,
- `search-panel:replace-previous`: replace the current match and step back,
- `search-panel:replace-current`: replace the current match in place,
- `search-panel:replace-all`: replace every match,
- `search-panel:clear-history`: clear the find and replace history,
- `search-panel:clear`: clear the search results and fields.

Commands available in `.editor:not(.mini)`:

- `search-panel:select-next`: select the next match,
- `search-panel:select-all`: select all matches,
- `search-panel:select-skip`: skip the current match and select the next,
- `search-panel:select-undo`: undo the last match selection.

Commands available in `.search-panel`:

- `search-panel:confirm`: run the buffer search,
- `search-panel:show-previous`: recall the previous find entry,
- `search-panel:focus-next`: move focus to the next field,
- `search-panel:focus-previous`: move focus to the previous field,
- `search-panel:toggle-regex-option`: toggle the regular-expression option,
- `search-panel:toggle-case-option`: toggle the case-sensitivity option,
- `search-panel:toggle-selection-option`: toggle the within-selection option,
- `search-panel:toggle-whole-word-option`: toggle the whole-word option.

Commands available in `.search-panel-project`:

- `search-panel:project-confirm`: run the project search,
- `search-panel:project-replace-all`: replace every project match,
- `search-panel:project-toggle-regex-option`: toggle the regular-expression option,
- `search-panel:project-toggle-case-option`: toggle the case-sensitivity option,
- `search-panel:project-toggle-whole-word-option`: toggle the whole-word option,
- `search-panel:focus-next`: move focus to the next field,
- `search-panel:focus-previous`: move focus to the previous field.

Commands available in `.results-view`:

- `search-panel:open-in-new-tab`: open the selected result in a new tab,
- `search-panel:copy-path`: copy the selected result's file path.

## Customization

Both find panels share a `search-panel` root class (`search-panel-editor` and
`search-panel-project` mark the buffer and project panels). Restyle them in your
`styles.less`:

```less
.search-panel {
  .editor-container .editor {
    font-style: italic;
  }
}
```

## Services

- **search-panel** (`0.0.1`): provided to expose find options, panel visibility controls, and programmatic search triggers.
- **atom.file-icons** (`1.0.0`): consumed to render file-type icons in project results.
- **file-icons.element-icons** (`1.0.0`): consumed to render element-based file-type icons in project results.
- **autocomplete.watchEditor** (`1.0.0`): consumed to enable autocompletion in the find fields.
- **search-adapter** (`1.0.0`): consumed to let non-editor pane items be searched through the buffer find panel.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
