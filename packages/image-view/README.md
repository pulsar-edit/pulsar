# image-view

Open and view images directly inside a Lumine editor tab.

## Features

- **Image tabs**: opens `.bmp`, `.gif`, `.ico`, `.jpeg`, `.jpg`, `.png`, and `.webp` files in an editor.
- **Zoom controls**: zoom in, zoom out, fit to window, or reset to the original size.
- **Background options**: switch the backdrop behind the image to inspect transparency.
- **Status bar info**: shows the image dimensions and file size while viewing.

## Commands

Commands available in `.image-view`:

- `image-view:reload`: reload the image from disk,
- `image-view:zoom-in`: zoom in on the image,
- `image-view:zoom-out`: zoom out from the image,
- `image-view:zoom-to-fit`: scale the image to fit the window,
- `image-view:reset-zoom`: reset the image to its original size.

## Services

- **status-bar** (`^1.0.0`): consumed to display the image dimensions and file size in the status bar.

## Customization

Change the backdrop behind the image by adding CSS to your `styles.less`:

```less
.image-view {
  background-color: #1e1e1e;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
