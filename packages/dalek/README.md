# dalek

EXTERMINATEs core packages that have been installed as community packages in `~/.lumine/packages`.

## Features

- **Duplicate detection**: finds core packages that were installed again as community packages.
- **Warning notifications**: deprecation-warns you about each duplicate so you can correct it.
- **Startup check**: runs automatically once the initial packages have activated.

## Usage

When people install core Lumine packages as if they are community packages, it can cause problems that are very hard to diagnose. This package notifies you when you are in that position so you can take corrective action.

If you get a warning:

1. Note down the packages named in the notification.
2. Exit Lumine.
3. Open a command prompt.
4. For each package named in the notification, execute `lumine -p uninstall [package-name]`.
5. Start Lumine again normally to verify that the warning notification no longer appears.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
