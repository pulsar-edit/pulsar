# wrap-guide

Displays a vertical line in the editor to guide line length.

## Features

- **Wrap guide line**: places a vertical line at a column so lines do not exceed a chosen width.
- **Preferred line length**: uses the `editor.preferredLineLength` value, falling back to the 80th column.
- **Multiple guides**: shows several guide lines at custom columns.
- **Scoped control**: enables or disables the guide per language through scoped configuration.
- **Styling**: lets you change the guide's color and width with your own CSS/LESS.

## Configuration

Disable the guide for a particular language through scoped configuration in your `config.cson`. For example, to turn it off for GitHub-Flavored Markdown:

```coffeescript
'.source.gfm':
  'wrap-guide':
    'enabled': false
```

Show multiple guide lines by listing the columns. The right-most line acts as your `editor.preferredLineLength`:

```coffeescript
'wrap-guide':
  'columns': [72, 80, 100, 120]
```

## Customization

Change the guide's color and width by adding CSS to your `styles.less`:

```less
atom-text-editor .wrap-guide {
  width: 10px;
  background-color: red;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
