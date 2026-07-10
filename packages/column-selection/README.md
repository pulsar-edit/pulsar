# column-selection

Create rectangular selections across lines by dragging.

## Features

- **Drag selection**: create multiple selections across lines with a mouse gesture.
- **Sticky mode**: keep column selection enabled for repeated selections.
- **Picker mode**: define a rectangular region with two clicks.
- **Edge scrolling**: continue selecting while scrolling near editor edges.
- **Selection preservation**: retain existing selections when adding a new column.

## Commands

Commands available in `atom-workspace`:

- `column-selection:sticky`: toggle persistent column selection mode,
- `column-selection:picker`: toggle two-click picker mode.

## Usage

Sticky mode applies column selection to mouse gestures until the mode is disabled. Picker mode uses the first click as one corner of the selection and the second click as the opposite corner.

## Customization

The status bar indicator can be adjusted in your `styles.less`:

```less
.status-bar .column-selection-icon {
  padding-inline: 0.5em;
  opacity: 0.85;
}
```

## Services

- **status-bar** (`^1.0.0`): consumed to show the column-selection mode indicator in the status bar.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
