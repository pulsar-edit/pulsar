# open-repository

View the active file and its repository on its Git host's website.

## Features

- **Multi-host**: builds URLs for GitHub, GitLab, and Bitbucket, and falls back to GitHub-style URLs for other hosts.
- **Open in browser**: open the current file, its blame, or its history in the host's web interface.
- **Repository views**: jump to the repository, its issues, or its pull/merge requests.
- **Branch compare**: open the compare or new-request page for the current branch.
- **Copy URL**: copy a permalink to the current file and selected lines.
- **Remote detection**: guesses the repository URL from the Git remote and branch, with `git config` overrides.

## Commands

Commands available in `atom-pane`:

- `open-repository:file`: open the current file on its host,
- `open-repository:file-on-master`: open the current file on the `master` branch,
- `open-repository:blame`: open the blame view for the current file,
- `open-repository:history`: open the history view for the current file,
- `open-repository:issues`: open the repository issues,
- `open-repository:pull-requests`: open the repository pull or merge requests,
- `open-repository:copy-url`: copy the URL for the current file,
- `open-repository:branch-compare`: open the compare page for the current branch,
- `open-repository:repository`: open the repository on its host.

## Usage

The repository URL is guessed from the current branch and Git remote information. The host is detected from the remote's domain; unknown or self-hosted domains default to GitHub-style URLs. Use `git config` to override the remote, branch, or host when the defaults are wrong:

```
git config atom.open-repository.remote upstream
git config atom.open-repository.branch some-branch
git config atom.open-repository.provider gitlab
```

`provider` accepts `github`, `gitlab`, or `bitbucket`, which is handy for self-hosted instances whose domain does not reveal the host.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
