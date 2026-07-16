# one-theme

The One themes for Lumine: day and night UI and syntax themes.

## Features

- **Four themes**: provides `one-day-ui`, `one-day-syntax`, `one-night-ui`, and `one-night-syntax` as independently selectable themes.
- **CSS custom properties**: each theme defines its palette as CSS custom properties in a `variables.css`, the source of truth for the theme variable contract.
- **Less compatibility**: community packages that import `ui-variables`/`syntax-variables` keep working — Lumine generates the Less shim from the palettes automatically.
- **Mix and match**: any theme can be paired with a community counterpart, e.g. `one-night-ui` with a third-party syntax theme.
- **Pure variant**: an optional neutral variant of both palettes — pure-white day background, desaturated night — with blue accents and flatter, rounder controls.

## Commands

Commands available in `atom-workspace`:

- `one-theme:select`: sets the One day and night pairs as the light and dark themes.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
