# welcome

Welcomes users to Lumine with useful information the first time it is opened.

## Features

- **About pane on startup**: opens the About pane with useful information when Lumine is first opened.
- **Getting-started guide**: shows a guide pane with tips for getting started.
- **Change log**: displays a change log after Lumine is updated.
- **Startup control**: independently choose whether the About pane and the Guide appear on startup, from a checkbox on each.

## Commands

Commands available in `atom-workspace`:

- `welcome:show`: open the About and guide panes,
- `welcome:showchangelog`: open the change log for the current version.

## Customization

Adjust the guide pane's typography by adding CSS to your `styles.less`:

```less
.welcome {
  font-size: 1.4em;
  line-height: 1.6;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
