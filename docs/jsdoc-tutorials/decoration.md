{Decoration} objects are not meant to be created directly, but created with {TextEditor::decorateMarker} eg.

```coffee
range = editor.getSelectedBufferRange() # any range you like
marker = editor.markBufferRange(range)
decoration = editor.decorateMarker(marker, {type: 'line', class: 'my-line-class'})
```

Best practice for destroying the decoration is by destorying the {DisplayMarker}.

```cofee
marker.destroy()
```

You should only use {Decoration::destroy} when you still need or do not own the marker.
