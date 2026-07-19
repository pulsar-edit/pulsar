# timecop

Display information about where time is spent while Lumine loads.

## Features

- **Startup breakdown**: shows overall startup and compile cache timing.
- **Package timing**: reports how long packages take to load and activate.
- **Theme timing**: reports how long themes take to load and activate.
- **Slowdown hints**: highlights the packages and themes that cost the most time.

## Commands

Commands available in `atom-workspace`:

- `timecop:view`: open the Timecop view with load timing details.

## Customization

Change the background of the Timecop panel by adding CSS to your `styles.css`:

```css
.timecop .timecop-panel {
  background-color: #21252b;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
