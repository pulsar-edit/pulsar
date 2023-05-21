# Git editing support in Pulsar

Adds syntax highlighting to Git commit, merge, and rebase messages edited in Pulsar.

You can configure Pulsar to be your Git editor with the following command:

```sh
git config --global core.editor "pulsar --wait"
```

## Commit message highlighting

This package uses warning and error highlighting to help bring attention to some violations of [standard conventions around commit message best practices](http://chris.beams.io/posts/git-commit/#seven-rules):

1. If the subject line goes beyond 50 characters and again if it goes beyond 72 characters
1. If the subject line begins with a lower-case letter (emoji at the beginning of the subject line won't be highlighted)
1. If the subject line ends with a period
1. If any non-comment body line goes beyond 72 characters

## Diff highlighting

If [language-diff](https://web.pulsar-edit.dev/packages/language-diff) is installed, the
diff part of `git commit --verbose` messages is highlighted as well.

## Background

Originally [converted](https://pulsar-edit.dev/docs/launch-manual/sections/core-hacking/#converting-from-textmate) from the [Git TextMate bundle](https://github.com/textmate/git.tmbundle).

Contributions are greatly appreciated. Please fork this repository and open a pull request to add snippets, make grammar tweaks, etc.
