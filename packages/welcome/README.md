# welcome

Welcomes users to Lumine with useful information the first time it is opened.

## Features

- **Welcome pane**: opens a welcome editor with helpful information when Lumine is first opened.
- **Getting-started guide**: shows a guide pane with tips for getting started.
- **Change log**: displays a change log after Lumine is updated.
- **Startup control**: choose whether the welcome panes appear on startup.

## Commands

Commands available in `atom-workspace`:

- `welcome:show`: open the welcome and guide panes,
- `welcome:showchangelog`: open the change log for the current version.

## Customization

Adjust the welcome pane's typography by adding CSS to your `styles.less`:

```less
.welcome {
  font-size: 1.4em;
  line-height: 1.6;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
