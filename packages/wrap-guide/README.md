# Wrap Guide package

The `wrap-guide` package places a vertical line in each editor at a certain column to guide your formatting, so lines do not exceed a certain width.

By default, the wrap-guide is placed at the value of `editor.preferredLineLength` config setting. The 80th column is used as the fallback if the config value is unset.

![](https://f.cloud.github.com/assets/671378/2241976/dbf6a8f6-9ced-11e3-8fef-d8a226301530.png)

## Configuration

You can customize where the column is placed for different file types by opening the Settings View and configuring the "Preferred Line Length" value. If you do not want the guide to show for a particular language, that can be set using scoped configuration. For example, to turn off the guide for GitHub-Flavored Markdown, you can add the following to your `config.cson`:

```coffeescript
'.source.gfm':
  'wrap-guide':
    'enabled': false
```

It is possible to configure the color and/or width of the line by adding the following CSS/LESS to your `styles.less`:

```css
atom-text-editor .wrap-guide {
  width: 10px;
  background-color: red;
}
```

Multiple guide lines are also supported. For example, add the following to your `config.cson` to create four columns at the indicated positions:

```coffeescript
'wrap-guide':
  'columns': [72, 80, 100, 120]
```

> Note: When using multiple guide lines, the right-most guide line functions as your `editor.preferredLineLength` setting.
