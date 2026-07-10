# deprecation-cop

Shows a list of deprecated calls used by Lumine and installed packages.

## Features

- **Deprecation list**: collects deprecated method calls and displays them in a dedicated view.
- **Stack traces**: shows where each deprecated call originates.
- **Status bar count**: reports the number of deprecations from the status bar.

## Commands

Commands available in `atom-workspace`:

- `deprecation-cop:view`: open the deprecation cop view.

## Services

- **status-bar** (`^1.0.0`): consumed to show the deprecation count in the status bar.

## Customization

Highlight the stack-trace blocks in the deprecation view by adding CSS to your `styles.less`:

```less
.deprecation-cop .stack-trace {
  background-color: #2c313a;
  border-left: 3px solid #e06c75;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
