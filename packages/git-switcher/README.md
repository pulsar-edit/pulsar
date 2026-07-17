# git-switcher

Status bar controls for switching the active Git repository and branch.

## Features

- **Repository tile**: shows the window's active repository, or the focused folder dimmed when it is not part of one; choosing a repository locks it, while `Auto` follows the active workspace item.
- **Branch tile**: shows the active repository's branch and offers branch creation, start-point selection, and detached checkout; reads "No repository" outside every repository.
- **Filterable pickers**: clicking a tile opens a list for switching repositories or checking out branches.
- **Quick switching**: the mouse wheel over the repository tile cycles through repositories, and middle click locks or unlocks the current selection.

## Commands

Commands available in `atom-workspace`:

- `git-switcher:select-repository`: pick the active repository,
- `git-switcher:select-branch`: pick a branch of the active repository to check out,
- `git-switcher:toggle-lock`: pin or unpin the active repository so it stops or resumes following the active editor.

## Services

- **status-bar** (`^1.0.0`): consumed to display the repository and branch tiles.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
