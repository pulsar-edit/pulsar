# title-bar

Theme-aware custom title bar with integrated menu.

## Features

- **Custom title bar**: replaces the native title bar for Lumine's frameless windows.
- **Control themes**: offers Windows 11, macOS Tahoe, and GNOME window controls, with default resolving to the platform theme.
- **Theme-aware colors**: derives colors from the Lumine UI variables.
- **Keyboard menu**: navigates the menu with alt mnemonics.
- **Auto-hidden menu bar**: optionally hides the menu bar until revealed.
- **Tile host**: lets other packages add controls near the window buttons through a service.

## Commands

Commands available in `atom-workspace`:

- `title-bar:toggle`: toggle title bar visibility,
- `title-bar:focus-menu`: focus the first menu label for keyboard navigation.

## Services

- **title-bar** (`1.0.0`): provided to let other packages add control tiles to the title bar near the window buttons.

## Customization

Restyle the title bar by adding CSS to your `styles.css`. For example, to give it a custom background and taller height:

```css
.title-bar {
  --title-bar-height: 40px;
  background-color: #1f2430;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
