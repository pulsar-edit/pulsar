# title-bar

Theme-aware custom title bar with integrated menu.

## Features

- Custom title bar for Lumine's frameless windows.
- Window control themes for Windows 11, macOS Tahoe, and GNOME, with `Default` resolving to the platform theme.
- Theme-aware colors based on Lumine UI variables.
- Keyboard menu navigation with Alt mnemonics.
- Optional auto-hidden menu bar.
- Service API for bundled or user packages that need title-bar controls.

## Commands

Commands available in `atom-workspace`:

- `title-bar:toggle`: toggle title bar visibility.
- `title-bar:focus-menu`: focus the first menu label for keyboard navigation.

## Configuration

The package exposes these settings:

- `title-bar.controlTheme`: `Default`, `Windows 11`, `macOS Tahoe`, or `GNOME`.
- `title-bar.logoStyle`: `Default`, `Filled`, `Unfilled`, or `None`. `Default` follows the resolved control theme.
- `title-bar.customContextMenus`: use styled DOM context menus.
- `title-bar.autoHide`: hide the menu bar until Alt or the app icon reveals it.
- `title-bar.altGivesFocus`: releasing Alt focuses the application menu.

## Styling

Users and bundled themes can override CSS custom properties from `styles.less`:

```less
:root {
  --title-bar-height: 32px;
  --title-bar-control-width: 46px;
  --title-bar-icon-size: 24px;
  --title-bar-icon-margin: 8px;

  --title-bar-menu-font-size: 12px;
  --title-bar-menu-item-height: 28px;
  --title-bar-menu-item-padding: 14px;
  --title-bar-menu-item-margin: 3px;
  --title-bar-menu-item-radius: 4px;
  --title-bar-menu-box-radius: 6px;
  --title-bar-menu-box-min-width: 200px;
  --title-bar-menu-label-padding: 8px;
  --title-bar-menu-label-radius: 0px;

  --title-bar-title-font-size: 12px;

  --title-bar-win11-button-hover-bg: fade(@text-color, 12%);
  --title-bar-win11-button-active-bg: fade(@text-color, 8%);
  --title-bar-close-hover-bg: #c42b1c;
  --title-bar-close-hover-color: #fff;

  --title-bar-macos-close: #ff5f57;
  --title-bar-macos-minimize: #febc2e;
  --title-bar-macos-maximize: #28c840;
  --title-bar-macos-blurred: #ddd;

  --title-bar-gnome-button-hover-bg: fade(@text-color, 12%);
  --title-bar-gnome-button-active-bg: fade(@text-color, 18%);
  --title-bar-gnome-close-hover-bg: #e55b4a;
  --title-bar-gnome-close-hover-color: #fff;
}
```

## Provided Service

The `title-bar` service lets packages add elements to the control area near the window buttons.

In `package.json`:

```json
{
  "consumedServices": {
    "title-bar": {
      "versions": {
        "^1.0.0": "consumeTitleBar"
      }
    }
  }
}
```

In a package main module:

```javascript
module.exports = {
  tile: null,

  consumeTitleBar(titleBar) {
    const element = document.createElement("button");
    element.textContent = "Action";

    this.tile = titleBar.addItem({ item: element, priority: 100 });
  },

  deactivate() {
    this.tile?.destroy();
  },
};
```

- `addItem({ item, priority })`: adds an element to the control tiles area. Lower priority appears earlier.
- `getTiles()`: returns the current title-bar tiles.

Tile elements are treated as non-drag regions so they can receive pointer input inside the frameless window.
