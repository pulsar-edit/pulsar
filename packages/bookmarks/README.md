# bookmarks

Mark lines in the editor and jump back to them.

## Features

- **Line bookmarks**: toggle a bookmark on any line and see it highlighted in the gutter.
- **Quick navigation**: jump to the next or previous bookmark in the editor.
- **Range selection**: select the text between the cursor and the surrounding bookmarks.
- **Bookmark browser**: view all bookmarks across open editors and jump straight to one.

## Commands

Commands available in `atom-workspace`:

- `bookmarks:view-all`: view all bookmarks in a searchable list.

Commands available in `atom-text-editor`:

- `bookmarks:toggle-bookmark`: add or remove a bookmark on the current line,
- `bookmarks:clear-bookmarks`: remove all bookmarks in the editor,
- `bookmarks:jump-to-next-bookmark`: move the cursor to the next bookmark,
- `bookmarks:jump-to-previous-bookmark`: move the cursor to the previous bookmark,
- `bookmarks:select-to-next-bookmark`: select from the cursor to the next bookmark,
- `bookmarks:select-to-previous-bookmark`: select from the cursor to the previous bookmark.

## Services

- **bookmarks** (`1.0.0`): provided to expose the list of bookmarks to any package that wants to know about them.

## Customization

Change the color of the bookmark marker in the gutter by adding CSS to your `styles.css`:

```css
atom-text-editor .gutter .line-number.bookmarked .icon-right:before {
  color: #e5c07b;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
