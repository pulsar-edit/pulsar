# git-switcher

Status bar controls for switching the active Git repository and branch.

## Features

- **Repository tile**: shows the window's active repository, with a lock icon when the selection is pinned; hidden while the window only knows a single repository.
- **Branch tile**: shows the active repository's branch (or short commit id when detached) with ahead/behind counts against its upstream.
- **Anchored pickers**: clicking a tile opens a compact overlay above it for switching repositories or checking out branches.
- **Fuzzy switch**: one command searches every repository and local branch pair in the window; picking a current branch switches repositories, picking any other branch also checks it out.

## Commands

Commands available in `atom-workspace`:

- `git-switcher:switch`: fuzzy-find across every repository and branch pair,
- `git-switcher:select-repository`: pick the active repository,
- `git-switcher:select-branch`: pick a branch of the active repository to check out.

## Customization

Adjust the popover size from your `styles.css`:

```css
.git-switcher-popover {
  width: 420px;
}
```

## Services

- **status-bar** (`^1.0.0`): consumed to display the repository and branch tiles.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
