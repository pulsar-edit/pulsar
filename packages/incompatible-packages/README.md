# incompatible-packages

Show installed Lumine packages whose native modules are incompatible with the current version.

## Features

- **Compatibility scan**: checks installed packages for native modules that fail to load.
- **Detailed view**: lists each incompatible package with its error output.
- **Status bar indicator**: surfaces a warning in the status bar when incompatible packages are found.

## Commands

Commands available in `atom-workspace`:

- `incompatible-packages:view`: open the list of incompatible packages.

## Services

- **status-bar** (`^1.0.0`): consumed to show an indicator in the status bar when incompatible packages are detected.

## Customization

Restyle each incompatible-package card by adding CSS to your `styles.less`:

```less
.incompatible-packages .incompatible-package {
  border-color: #e06c75;
  border-radius: 3px;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
