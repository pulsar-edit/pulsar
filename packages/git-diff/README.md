# git-diff

Marks lines in the editor gutter that have been added, edited, or deleted since the last commit.

## Features

- **Gutter markers**: marks added, edited, and deleted lines in the editor gutter.
- **Icon or marker style**: shows colored icons or colored markers in the gutter.
- **Diff navigation**: moves the cursor to the next or previous diff in the editor.
- **Diff list**: opens a searchable list of all diffs in the current file.
- **Wrap-around**: optionally wraps around to the first or last diff when navigating.

## Commands

Commands available in `atom-text-editor`:

- `git-diff:move-to-next-diff`: move the cursor to the next diff,
- `git-diff:move-to-previous-diff`: move the cursor to the previous diff,
- `git-diff:toggle-diff-list`: toggle the list of diffs in the current file.

## Customization

Give the added-line gutter marker a thicker, custom-colored border by adding CSS to your `styles.css`:

```css
atom-text-editor .gutter .line-number.git-line-added {
  border-left: 4px solid #98c379;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
