# one-light-ui

A light UI theme for Lumine that adapts to most syntax themes.

## Features

- **Adaptive coloring**: picks up the background hue of the active syntax theme so light and dark combos stay coherent.
- **Font scaling**: adjust the overall UI size from the theme settings.
- **Tab sizing**: choose between Even, Maximum, and Minimum tab layouts.
- **Configurable chrome**: reposition tab close buttons, hide dock toggle buttons, and make tree-view project headers sticky.

## Usage

Activate the theme from **Settings > Themes** by selecting "One Light" as the UI theme. Adjust its options under **Settings > Themes > One Light UI > Settings**.

You can also resize individual areas by targeting the theme in your `styles.less`:

```css
.theme-one-light-ui {
  .tab-bar {
    font-size: 18px;
  }
  .tree-view {
    font-size: 14px;
  }
  .status-bar {
    font-size: 12px;
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
