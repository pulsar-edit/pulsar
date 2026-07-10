# find-and-replace

Find and replace text in the current buffer or across the entire project in Lumine.

## Features

- **Buffer search**: find and replace matches within the active editor.
- **Project search**: search and replace across every file in the project.
- **Search options**: toggle regex, case-sensitive, whole-word, and selection-only matching.
- **Multiple selections**: select the next or all occurrences of the current match for simultaneous editing.
- **Search history**: cycle through and reuse previous find and replace patterns.
- **Result markers**: expose the marker layer of search results to other packages through a service.

## Commands

Commands available in `atom-workspace`:

- `find-and-replace:show`: open the buffer find panel,
- `find-and-replace:toggle`: toggle the buffer find panel,
- `find-and-replace:show-replace`: open the buffer find panel focused on the replace field,
- `find-and-replace:find-all`: find and mark every match in the buffer,
- `find-and-replace:find-next`: move to the next match,
- `find-and-replace:find-previous`: move to the previous match,
- `find-and-replace:find-next-selected`: use the selection as the pattern and find the next match,
- `find-and-replace:find-previous-selected`: use the selection as the pattern and find the previous match,
- `find-and-replace:use-selection-as-find-pattern`: set the find pattern from the current selection,
- `find-and-replace:use-selection-as-replace-pattern`: set the replace pattern from the current selection,
- `find-and-replace:replace-next`: replace the current match and move to the next,
- `find-and-replace:replace-previous`: replace the current match and move to the previous,
- `find-and-replace:replace-all`: replace every match in the buffer,
- `find-and-replace:clear-history`: clear the stored find and replace history,
- `project-find:show`: open the project find panel,
- `project-find:toggle`: toggle the project find panel,
- `project-find:show-in-current-directory`: open the project find panel scoped to the selected directory.

Commands available in `.editor:not(.mini)`:

- `find-and-replace:select-next`: add the next occurrence of the current selection to the selections,
- `find-and-replace:select-all`: add every occurrence of the current selection to the selections,
- `find-and-replace:select-undo`: remove the last selection added,
- `find-and-replace:select-skip`: skip the current occurrence and select the next.

Commands available in `.list-item.match-row` and `.list-item.path-row`:

- `find-and-replace:open-in-new-tab`: open the result in a new tab,
- `find-and-replace:copy-path`: copy the path of the result.

## Services

- **find-and-replace** (`0.0.1`): provided to expose `resultsMarkerLayerForTextEditor`, returning the marker layer of search results for a given editor.
- **atom.file-icons** (`1.0.0`): consumed to show file-type icons next to project search results.
- **file-icons.element-icons** (`1.0.0`): consumed to show element-based file-type icons next to project search results.
- **autocomplete.watchEditor** (`1.0.0`): consumed to enable autocompletion inside the find search field.

## Customization

Restyle the find-and-replace panel by adding CSS to your `styles.less`. For example, to add extra padding and a top border:

```less
.find-and-replace {
  padding: 8px;
  border-top: 1px solid fade(#000, 20%);
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
