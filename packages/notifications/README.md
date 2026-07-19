# notifications

A tidy way to display Lumine notifications.

## Features

- **Notification popups**: renders info, success, warning, and error notifications from Lumine and its packages.
- **Notification log**: keeps a searchable history of notifications in a dedicated panel.
- **Error reporting**: captures uncaught exceptions and presents them as dismissable error notifications.
- **Configurable timeout**: control how long non-dismissable notifications stay on screen.

## Commands

Commands available in `atom-workspace`:

- `notifications:toggle-log`: show or hide the notifications log,
- `notifications:clear-log`: dismiss and clear all notifications.

## Customization

Restyle the notification popups by adding CSS to your `styles.css`:

```css
atom-notifications atom-notification {
  font-size: 1.1em;
  border-radius: 6px;
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
