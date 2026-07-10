# open-on-github

View the active file and its repository on github.com.

## Features

- **Open in browser**: open the current file, blame, or history view on github.com.
- **Repository views**: jump to the repository, its issues, or its pull requests.
- **Branch compare**: open the compare page for the current branch.
- **Copy URL**: copy a github.com URL for the current file and selected lines.
- **Remote detection**: guesses the repository URL from the Git remote and branch, with `git config` overrides.

## Commands

Commands available in `atom-pane`:

- `open-on-github:file`: open the current file on github.com,
- `open-on-github:file-on-master`: open the current file on the default branch,
- `open-on-github:blame`: open the blame view for the current file,
- `open-on-github:history`: open the history view for the current file,
- `open-on-github:issues`: open the repository issues,
- `open-on-github:pull-requests`: open the repository pull requests,
- `open-on-github:copy-url`: copy the github.com URL for the current file,
- `open-on-github:branch-compare`: open the compare page for the current branch,
- `open-on-github:repository`: open the repository on github.com.

## Usage

The GitHub repository URL is guessed from the current branch and Git remote information. To override the defaults, use `git config` to set the remote and branch name:

```
git config atom.open-on-github.remote upstream
git config atom.open-on-github.branch some-branch
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
