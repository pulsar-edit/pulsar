# Status Bar package

Display information about the current editor such as cursor position, file path, grammar, current branch, ahead/behind commit counts, and line diff count.

![](https://f.cloud.github.com/assets/671378/2241819/f8418cb8-9ce5-11e3-87e5-109e965986d0.png)

## Configuration

The status bar package accepts the following configuration values:

* `status-bar.cursorPositionFormat` &mdash; A string that describes the format to use for the cursor position status bar tile. It defaults to `%L:%C`. In the format string, `%L` represents the 1-based line number and `%C` represents the 1-based column number.

* `status-bar.selectionCountFormat` &mdash; A string that describes the format to use for the selection count status bar tile. It defaults to `(%L, %C)`. In the format string, `%L` represents the 1-based line count and `%C` represents the 1-based character count.

### Tile Priorities

Each built-in tile has a configurable priority. The sign determines which side of the status bar the tile appears on, and the absolute value determines its position. Set to `0` to hide a tile.

* `status-bar.launchModePriority` &mdash; Default: `-1`
* `status-bar.fileInfoPriority` &mdash; Default: `-11`
* `status-bar.cursorPositionPriority` &mdash; Default: `-12`
* `status-bar.selectionCountPriority` &mdash; Default: `-13`
* `status-bar.gitInfoPriority` &mdash; Default: `10`

Priority layout:

```
LEFT EDGE ←  -1 -2 -10 -100  [0=hidden]  100 10 5 2 1  → RIGHT EDGE
```

Negative values place tiles on the left, positive on the right. Smaller absolute values are closer to the edge, larger values are closer to the center.

## API

This package provides a service that you can use in other Pulsar packages.

### v2 API (recommended)

The v2 API uses a single `addTile` method where the priority sign determines the side.

```json
{
  "name": "my-package",
  "consumedServices": {
    "status-bar": {
      "versions": {
        "^2.0.0": "consumeStatusBar"
      }
    }
  }
}
```

```js
module.exports = {
  activate() { /* ... */ },

  consumeStatusBar(statusBar) {
    // Negative priority = left side, positive = right side, 0 = hidden
    this.tile = statusBar.addTile({ item: myElement, priority: -50 });

    // Or bind to a config key for reactive priority changes:
    this.tile = statusBar.addTile({ item: myElement, priorityConfig: 'my-package.tilePriority' });
  },

  deactivate() {
    this.tile?.destroy();
    this.tile = null;
  }
};
```

The v2 `status-bar` API has two methods:

  * `addTile({ item, priority })` &mdash; Add a tile to the status bar. Negative priority places it on the left, positive on the right. Priority `0` hides the tile. Optionally pass `priorityConfig` instead of `priority` to bind the tile's priority to a config key (the tile will automatically update when the config changes).
  * `getTiles()` &mdash; Retrieve all tiles in visual order (left to right).

The `item` parameter can be a DOM element or a model object for which a view provider has been registered in the view registry.

`addTile` returns a `Tile` object with the following methods:

  * `getPriority()` &mdash; Retrieve the tile's current priority. If using `priorityConfig`, reads the current value from config.
  * `getItem()` &mdash; Retrieve the tile's item.
  * `isVisible()` &mdash; Returns `true` if the tile is visible (priority is not `0`).
  * `setPriority(newPriority)` &mdash; Change the tile's priority. The tile will be repositioned (or hidden if `0`). Can move tiles between left and right sides by changing the sign.
  * `destroy()` &mdash; Remove the tile from the status bar and clean up any config observers.

### v1 API (legacy)

The v1 API uses separate methods for left and right tiles. Priority `0` is a valid position in v1.

```json
{
  "name": "my-package",
  "consumedServices": {
    "status-bar": {
      "versions": {
        "^1.0.0": "consumeStatusBar"
      }
    }
  }
}
```

```js
module.exports = {
  activate() { /* ... */ },

  consumeStatusBar(statusBar) {
    this.tile = statusBar.addLeftTile({ item: myElement, priority: 100 });
  },

  deactivate() {
    this.tile?.destroy();
    this.tile = null;
  }
};
```

  * `addLeftTile({ item, priority })` &mdash; Add a tile to the left side. Lower priority tiles are placed further to the left.
  * `addRightTile({ item, priority })` &mdash; Add a tile to the right side. Lower priority tiles are placed further to the right.
  * `getLeftTiles()` &mdash; Retrieve all tiles on the left side.
  * `getRightTiles()` &mdash; Retrieve all tiles on the right side.
