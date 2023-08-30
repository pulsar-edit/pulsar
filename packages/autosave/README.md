# Autosave package

Autosaves editor when they lose focus, are destroyed, or when the window is closed.

This package is disabled by default and can be enabled via the `autosave.enabled` config
setting or by checking *Enabled* in the settings for the *autosave* package in the
Settings view.

## Service API
The service exposes an object with a function `dontSaveIf`, which accepts a callback.
Callbacks will be invoked with each pane item eligible for an autosave and if the callback
returns true, the item will be skipped.

### Usage

#### package.json
``` json
"consumedServices": {
  "autosave": {
    "versions": {
      "1.0.0": "consumeAutosave"
    }
  }
}
```

#### package initialize
``` javascript
consumeAutosave({dontSaveIf}) {
  dontSaveIf(paneItem -> paneItem.getPath() === '/dont/autosave/me.coffee')
}
```
