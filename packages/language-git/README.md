# Git editing support in Atom
[![macOS Build Status](https://travis-ci.org/atom/language-git.svg?branch=master)](https://travis-ci.org/atom/language-git)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/481319gyrr1feo8b/branch/master?svg=true)](https://ci.appveyor.com/project/Atom/language-git/branch/master)
[![Dependency Status](https://david-dm.org/atom/language-git.svg)](https://david-dm.org/atom/language-git)

Adds syntax highlighting to Git commit, merge, and rebase messages edited in Atom.

You can configure Atom to be your Git editor with the following command:

```sh
git config --global core.editor "atom --wait"
```

## Commit message highlighting

This package uses warning and error highlighting to help bring attention to some violations of [standard conventions around commit message best practices](http://chris.beams.io/posts/git-commit/#seven-rules):

1. If the subject line goes beyond 50 characters and again if it goes beyond 72 characters
1. If the subject line begins with a lower-case letter (emoji at the beginning of the subject line won't be highlighted)
1. If the subject line ends with a period
1. If any non-comment body line goes beyond 72 characters

## Diff highlighting

If [language-diff](https://atom.io/packages/language-diff) is installed, the
diff part of `git commit --verbose` messages is highlighted as well.

## Background

Originally [converted](http://flight-manual.atom.io/hacking-atom/sections/converting-from-textmate) from the [Git TextMate bundle](https://github.com/textmate/git.tmbundle).

Contributions are greatly appreciated. Please fork this repository and open a pull request to add snippets, make grammar tweaks, etc.
