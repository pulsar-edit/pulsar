# Contributing to Pulsar

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to Pulsar and its packages, which are hosted in the [Pulsar Organization](https://github.com/pulsar-edit) on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

---

Its also worth mentioning, that while many items here to apply, during our early stages as an Organization, there are [special guidelines to consider.](https://github.com/pulsar-edit/.github/blob/main/project-birth/CONTRIBUTING-DURING-START.md)

---

#### Table Of Contents

[Code of Conduct](#code-of-conduct)

[I don't want to read this whole thing, I just have a question!!!](#i-dont-want-to-read-this-whole-thing-i-just-have-a-question)

[What should I know before I get started?](#what-should-i-know-before-i-get-started)
  * [Pulsar and Packages](#pulsar-and-packages)
  * [Pulsar Design Decisions](#design-decisions)

[How Can I Contribute?](#how-can-i-contribute)
  * [Reporting Bugs](#reporting-bugs)
  * [Suggesting Enhancements](#suggesting-enhancements)
  * [Your First Code Contribution](#your-first-code-contribution)
  * [Pull Requests](#pull-requests)

[Styleguides](#styleguides)
  * [Git Commit Messages](#git-commit-messages)
  * [JavaScript Styleguide](#javascript-styleguide)
  * [CoffeeScript Styleguide](#coffeescript-styleguide)
  * [Specs Styleguide](#specs-styleguide)
  * [Documentation Styleguide](#documentation-styleguide)

[Additional Notes](#additional-notes)
  * [Issue and Pull Request Labels](#issue-and-pull-request-labels)

## Code of Conduct

This project and everyone participating in it is governed by the [Pulsar Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers or GitHub.

## I don't want to read this whole thing I just have a question!!!

> **Note:** Please don't file an issue to ask a question. You'll get faster results by using the resources below.

Feel free to contribute to the Pulsar-Edit Discussions to talk with the community, and have questions answered. Or we also have a Discord server where questions can be asked directly with the maintainers.

* [GitHub Discussions](https://github.com/orgs/pulsar-edit/discussions)
* [Discord Server](https://discord.gg/7aEbB9dGRT)

## What should I know before I get started?

### Pulsar and Packages

Pulsar is a large open source project &mdash; it's made up of over [200 repositories](https://github.com/pulsar-edit). When you initially consider contributing to Pulsar, you might be unsure about which of those 200 repositories implements the functionality you want to change or report a bug for. This section should help you with that.

Pulsar is intentionally very modular. Nearly every non-editor UI element you interact with comes from a package, even fundamental things like tabs and the status-bar. These packages are packages in the same way that packages in the [Pulsar package repository](https://pulsar-edit.com/packages) are packages, with one difference: they are bundled into the [default distribution](https://github.com/pulsar-edit/pulsar).

<a id="pulsar-packages-image"/>

![pulsar-packages](images/editor-layout.png)

To get a sense for the packages that are bundled with Pulsar, you can go to `Settings` > `Packages` within Pulsar and take a look at the Core Packages section.

To see a list of repos that are within the org, you can refer to the [full repo table](REPOS.md).

There are many more, but this list should be a good starting point. For more information on how to work with Pulsar's official packages, see [Contributing to Pulsar Packages][contributing-to-official-pulsar-packages].

Also, because Pulsar is so extensible, it's possible that a feature you've become accustomed to in Pulsar or an issue you're encountering isn't coming from a bundled package at all, but rather a [community package](https://pulsar-edit.com/packages) you've installed. Each community package has its own repository too.

#### Package Conventions

There are a few conventions that have developed over time around packages:

* Packages that add one or more syntax highlighting grammars are named `language-[language-name]`
    * Language packages can add other things besides just a grammar. Many offer commonly-used snippets. Try not to add too much though.
* Theme packages are split into two categories: UI and Syntax themes
    * UI themes are named `[theme-name]-ui`
    * Syntax themes are named `[theme-name]-syntax`
    * Often themes that are designed to work together are given the same root name, for example: `one-dark-ui` and `one-dark-syntax`
    * UI themes style everything outside of the editor pane &mdash; all of the green areas in the [packages image above](#pulsar-packages-image)
    * Syntax themes style just the items inside the editor pane, mostly syntax highlighting
* Packages that add [autocomplete providers](https://github.com/pulsar-edit/autocomplete-plus/wiki/Autocomplete-Providers) are named `autocomplete-[what-they-autocomplete]` &mdash; ex: [autocomplete-css](https://github.com/pulsar-edit/autocomplete-css)

### Design Decisions

When we make a significant decision in how we maintain the project and what we can or cannot support, we will document it in the [pulsar-edit/design-decisions repository](https://github.com/pulsar-edit/design-decisions). If you have a question around how we do things, check to see if it is documented there. If it is *not* documented there, please open a new topic on [Github Discussions, the official Pulsar message board](https://github.com/orgs/pulsar-edit/discussions) and ask your question.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Pulsar. Following these guidelines helps maintainers and the community understand your report :pencil:, reproduce the behavior :computer: :computer:, and find related reports :mag_right:.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please [include as many details as possible](#how-do-i-submit-a-good-bug-report). Fill out [the required template](https://github.com/pulsar-edit/.github/blob/master/.github/ISSUE_TEMPLATE/bug_report.md), the information it asks for helps us resolve issues faster.

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

#### Before Submitting A Bug Report

* **Check the [debugging guide](https://flight-manual.atom.io/hacking-atom/sections/debugging/).** You might be able to find the cause of the problem and fix things yourself. Most importantly, check if you can reproduce the problem [in the latest version of Pulsar](https://flight-manual.atom.io/hacking-atom/sections/debugging/#update-to-the-latest-version), if the problem happens when you run Pulsar in [safe mode](https://flight-manual.atom.io/hacking-atom/sections/debugging/#check-if-the-problem-shows-up-in-safe-mode), and if you can get the desired behavior by changing [Atom's or packages' config settings](https://flight-manual.atom.io/hacking-atom/sections/debugging/#check-atom-and-package-settings).
* **Check the [faq](https://flight-manual.atom.io/faq/) and the [discussions](https://github.com/orgs/pulsar-edit/discussions)** for a list of common questions and problems.
* **Determine [which repository the problem should be reported in](#pulsar-and-packages)**.
* **Perform a [cursory search](https://github.com/search?q=+is%3Aissue+user%3Apulsar)** to see if the problem has already been reported. If it has **and the issue is still open**, add a comment to the existing issue instead of opening a new one.

#### How Do I Submit A (Good) Bug Report?

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you've determined [which repository](#pulsar-and-packages) your bug is related to, create an issue on that repository and provide the following information by filling in [the template](https://github.com/pulsar-edit/.github/blob/master/.github/ISSUE_TEMPLATE/bug_report.md).

Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible. For example, start by explaining how you started Pulsar, e.g. which command exactly you used in the terminal, or how you started Pulsar otherwise. When listing steps, **don't just say what you did, but explain how you did it**. For example, if you moved the cursor to the end of a line, explain if you used the mouse, or a keyboard shortcut or an Pulsar command, and if so which one?
* **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples. If you're providing snippets in the issue, use [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem. If you use the keyboard while following the steps, **record the GIF with the [Keybinding Resolver](https://github.com/pulsar-edit/keybinding-resolver) shown**. You can use [this tool](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows, and [this tool](https://github.com/colinkeenan/silentcast) or [this tool](https://github.com/GNOME/byzanz) on Linux.
* **If you're reporting that Pulsar crashed**, include a crash report with a stack trace from the operating system. On macOS, the crash report will be available in `Console.app` under "Diagnostic and usage information" > "User diagnostic reports". Include the crash report in the issue in a [code block](https://help.github.com/articles/markdown-basics/#multiple-lines), a [file attachment](https://help.github.com/articles/file-attachments-on-issues-and-pull-requests/), or put it in a [gist](https://gist.github.com/) and provide link to that gist.
* **If the problem is related to performance or memory**, include a [CPU profile capture](https://flight-manual.atom.io/hacking-atom/sections/debugging/#diagnose-runtime-performance) with your report.
* **If Chrome's developer tools pane is shown without you triggering it**, that normally means that you have a syntax error in one of your themes or in your `styles.less`. Try running in [Safe Mode](https://flight-manual.atom.io/hacking-atom/sections/debugging/#using-safe-mode) and using a different theme or comment out the contents of your `styles.less` to see if that fixes the problem.
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and share more information using the guidelines below.

Provide more context by answering these questions:

* **Can you reproduce the problem in [safe mode](https://flight-manual.atom.io/hacking-atom/sections/debugging/#diagnose-runtime-performance-problems-with-the-dev-tools-cpu-profiler)?**
* **Did the problem start happening recently** (e.g. after updating to a new version of Pulsar) or was this always a problem?
* If the problem started happening recently, **can you reproduce the problem in an older version of Pulsar?** What's the most recent version in which the problem doesn't happen? You can download older versions of Pulsar from [the releases page](https://github.com/pulsar-edit/pulsar/releases).
* **Can you reliably reproduce the issue?** If not, provide details about how often the problem happens and under which conditions it normally happens.
* If the problem is related to working with files (e.g. opening and editing files), **does the problem happen for all files and projects or only some?** Does the problem happen only when working with local or remote files (e.g. on network drives), with files of a specific type (e.g. only JavaScript or Python files), with large files or files with very long lines, or with files in a specific encoding? Is there anything else special about the files you are using?

Include details about your configuration and environment:

* **Which version of Pulsar are you using?** You can get the exact version by running `pulsar -v` in your terminal, or by starting Pulsar and running the `Application: About` command from the [Command Palette](https://github.com/pulsar-edit/command-palette).
* **What's the name and version of the OS you're using**?
* **Are you running Pulsar in a virtual machine?** If so, which VM software are you using and which operating systems and versions are used for the host and the guest?
* **Which [packages](#pulsar-and-packages) do you have installed?** You can get that list by running `apm list --installed`.
* **Are you using [local configuration files](https://flight-manual.atom.io/using-atom/sections/basic-customization/)** `config.cson`, `keymap.cson`, `snippets.cson`, `styles.less` and `init.coffee` to customize Pulsar? If so, provide the contents of those files, preferably in a [code block](https://help.github.com/articles/markdown-basics/#multiple-lines) or with a link to a [gist](https://gist.github.com/).
* **Are you using Pulsar with multiple monitors?** If so, can you reproduce the problem when you use a single monitor?
* **Which keyboard layout are you using?** Are you using a US layout or some other layout?

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Pulsar, including completely new features and minor improvements to existing functionality. Following these guidelines helps maintainers and the community understand your suggestion :pencil: and find related suggestions :mag_right:.

Before creating enhancement suggestions, please check [this list](#before-submitting-an-enhancement-suggestion) as you might find out that you don't need to create one. When you are creating an enhancement suggestion, please [include as many details as possible](#how-do-i-submit-a-good-enhancement-suggestion). Fill in [the template](https://github.com/pulsar-edit/.github/blob/master/.github/ISSUE_TEMPLATE/feature_request.md), including the steps that you imagine you would take if the feature you're requesting existed.

#### Before Submitting An Enhancement Suggestion

* **Check the [debugging guide](https://flight-manual.atom.io/hacking-atom/sections/debugging/)** for tips — you might discover that the enhancement is already available. Most importantly, check if you're using [the latest version of Pulsar](https://flight-manual.atom.io/hacking-atom/sections/debugging/#update-to-the-latest-version) and if you can get the desired behavior by changing [Pulsar's or packages' config settings](https://flight-manual.atom.io/hacking-atom/sections/debugging/#check-atom-and-package-settings).
* **Check if there's already [a package](https://pulsar-edit.com/packages) which provides that enhancement.**
* **Determine [which repository the enhancement should be suggested in](#pulsar-and-packages).**
* **Perform a [cursory search](https://github.com/search?q=+is%3Aissue+user%3Apulsar)** to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.

#### How Do I Submit A (Good) Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you've determined [which repository](#pulsar-and-packages) your enhancement suggestion is related to, create an issue on that repository and provide the following information:

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
* **Provide specific examples to demonstrate the steps**. Include copy/pasteable snippets which you use in those examples, as [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
* **Include screenshots and animated GIFs** which help you demonstrate the steps or point out the part of Pulsar which the suggestion is related to. You can use [this tool](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows, and [this tool](https://github.com/colinkeenan/silentcast) or [this tool](https://github.com/GNOME/byzanz) on Linux.
* **Explain why this enhancement would be useful** to most Pulsar users and isn't something that can or should be implemented as a [community package](#pulsar-and-packages).
* **List some other text editors or applications where this enhancement exists.**
* **Specify which version of Pulsar you're using.** You can get the exact version by running `pulsar -v` in your terminal, or by starting Pulsar and running the `Application: About` command from the [Command Palette](https://github.com/pulsar-edit/command-palette).
* **Specify the name and version of the OS you're using.**

### Your First Code Contribution

Unsure where to begin contributing to Pulsar? You can start by looking through these `beginner` and `help-wanted` issues:

* [Beginner issues][beginner] - issues which should only require a few lines of code, and a test or two.
* [Help wanted issues][help-wanted] - issues which should be a bit more involved than `beginner` issues.

Both issue lists are sorted by total number of comments. While not perfect, number of comments is a reasonable proxy for impact a given change will have.

If you want to read about using Pulsar or developing packages in Pulsar, the [Atom Flight Manual](https://flight-manual.atom.io) is free and available online. You can find the source to the manual in [pulsar-edit/flight-manual.atom.io](https://github.com/pulsar-edit/flight-manual.atom.io).

#### Local development

Pulsar Core and all packages can be developed locally. For instructions on how to do this, see the following sections in the [Atom Flight Manual](https://flight-manual.atom.io):

* [Hacking on Pulsar Core][hacking-on-pulsar-core]
* [Contributing to Official Pulasr Packages][contributing-to-official-pulsar-packages]

### Pull Requests

The process described here has several goals:

- Maintain Pulsar's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible Pulsar
- Enable a sustainable system for Pulsar's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Follow all instructions in [the template](PULL_REQUEST_TEMPLATE.md)
2. Follow the [styleguides](#styleguides)
3. After you submit your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing <details><summary>What if the status checks are failing?</summary>If a status check is failing, and you believe that the failure is unrelated to your change, please leave a comment on the pull request explaining why you believe the failure is unrelated. A maintainer will re-run the status check for you. If we conclude that the failure was a false positive, then we will open an issue to track that problem with our status check suite.</details>

While the prerequisites above must be satisfied prior to having your pull request reviewed, the reviewer(s) may ask you to complete additional design work, tests, or other changes before your pull request can be ultimately accepted.

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* When only changing documentation, include `[ci skip]` in the commit title

### JavaScript Styleguide

All JavaScript code is linted with [Prettier](https://prettier.io/).

* Prefer the object spread operator (`{...anotherObj}`) to `Object.assign()`
* Inline `export`s with expressions whenever possible
  ```js
  // Use this:
  export default class ClassName {

  }

  // Instead of:
  class ClassName {

  }
  export default ClassName
  ```
* Place requires in the following order:
    * Built in Node Modules (such as `path`)
    * Built in Atom and Electron Modules (such as `atom`, `remote`)
    * Local Modules (using relative paths)
* Place class properties in the following order:
    * Class methods and properties (methods starting with `static`)
    * Instance methods and properties
* [Avoid platform-dependent code](https://flight-manual.atom.io/hacking-atom/sections/cross-platform-compatibility/)

### CoffeeScript Styleguide

* Its also important to note that CoffeeScript is depreciated, while the codebase is decaffeinated.
* Set parameter defaults without spaces around the equal sign
    * `clear = (count=1) ->` instead of `clear = (count = 1) ->`
* Use spaces around operators
    * `count + 1` instead of `count+1`
* Use spaces after commas (unless separated by newlines)
* Use parentheses if it improves code clarity.
* Prefer alphabetic keywords to symbolic keywords:
    * `a is b` instead of `a == b`
* Avoid spaces inside the curly-braces of hash literals:
    * `{a: 1, b: 2}` instead of `{ a: 1, b: 2 }`
* Include a single line of whitespace between methods.
* Capitalize initialisms and acronyms in names, except for the first word, which
  should be lower-case:
  * `getURI` instead of `getUri`
  * `uriToOpen` instead of `URIToOpen`
* Use `slice()` to copy an array
* Add an explicit `return` when your function ends with a `for`/`while` loop and
  you don't want it to return a collected array.
* Use `this` instead of a standalone `@`
  * `return this` instead of `return @`
* Place requires in the following order:
    * Built in Node Modules (such as `path`)
    * Built in Atom and Electron Modules (such as `atom`, `remote`)
    * Local Modules (using relative paths)
* Place class properties in the following order:
    * Class methods and properties (methods starting with a `@`)
    * Instance methods and properties
* [Avoid platform-dependent code](https://flight-manual.atom.io/hacking-atom/sections/cross-platform-compatibility/)

### Specs Styleguide

- Include thoughtfully-worded, well-structured [Jasmine](https://jasmine.github.io/) specs in the `./spec` folder.
- Treat `describe` as a noun or situation.
- Treat `it` as a statement about state or how an operation changes state.

#### Example

```coffee
describe 'a dog', ->
 it 'barks', ->
 # spec here
 describe 'when the dog is happy', ->
  it 'wags its tail', ->
  # spec here
```

### Documentation Styleguide

* Use [AtomrDoc](https://github.com/pulsar-edit/atomdoc).
* Use [Markdown](https://daringfireball.net/projects/markdown).
* Reference methods and classes in markdown with the custom `{}` notation:
    * Reference classes with `{ClassName}`
    * Reference instance methods with `{ClassName::methodName}`
    * Reference class methods with `{ClassName.methodName}`

#### Example

```coffee
# Public: Disable the package with the given name.
#
# * `name`    The {String} name of the package to disable.
# * `options` (optional) The {Object} with disable options (default: {}):
#   * `trackTime`     A {Boolean}, `true` to track the amount of time taken.
#   * `ignoreErrors`  A {Boolean}, `true` to catch and ignore errors thrown.
# * `callback` The {Function} to call after the package has been disabled.
#
# Returns `undefined`.
disablePackage: (name, options, callback) ->
```

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests. Most labels are used across all Pulsar repositories, but some are specific to `pulsar-edit/pulsar`.

[GitHub search](https://help.github.com/articles/searching-issues/) makes it easy to use labels for finding groups of issues or pull requests you're interested in. For example, you might be interested in [open issues across `pulsar-edit/pulsar` and all Pulsar-owned packages which are labeled as bugs, but still need to be reliably reproduced](https://github.com/search?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+user%3Apulsar+label%3Abug+label%3Aneeds-reproduction) or perhaps [open pull requests in `pulsar-edit/pulsar` which haven't been reviewed yet](https://github.com/search?utf8=%E2%9C%93&q=is%3Aopen+is%3Apr+repo%3Apulsar%2Fpulsar+comments%3A0). To help you find issues and pull requests, each label is listed with search links for finding open items with that label in `pulsar-edit/pulsar` only and also across all Pulsar repositories. We  encourage you to read about [other search filters](https://help.github.com/articles/searching-issues/) which will help you write more focused queries.

The labels are loosely grouped by their purpose, but it's not required that every issue has a label from every group or that an issue can't have more than one label from the same group.

Please open an issue on `pulsar-edit/pulsar` if you have suggestions for new labels, and if you notice some labels are missing on some repositories, then please open an issue on that repository.

#### Type of Issue and Issue State

| Label name | `pulsar-edit/pulsar` :mag_right: | `pulsar-edit`‑org :mag_right: | Description |
| --- | --- | --- | --- |
| `enhancement` | [search][search-pulsar-repo-label-enhancement] | [search][search-pulsar-org-label-enhancement] | Feature requests. |
| `bug` | [search][search-pulsar-repo-label-bug] | [search][search-pulsar-org-label-bug] | Confirmed bugs or reports that are very likely to be bugs. |
| `question` | [search][search-pulsar-repo-label-question] | [search][search-pulsar-org-label-question] | Questions more than bug reports or feature requests (e.g. how do I do X). |
| `feedback` | [search][search-pulsar-repo-label-feedback] | [search][search-pulsar-org-label-feedback] | General feedback more than bug reports or feature requests. |
| `help-wanted` | [search][search-pulsar-repo-label-help-wanted] | [search][search-pulsar-org-label-help-wanted] | The Pulsar core team would appreciate help from the community in resolving these issues. |
| `beginner` | [search][search-pulsar-repo-label-beginner] | [search][search-pulsar-org-label-beginner] | Less complex issues which would be good first issues to work on for users who want to contribute to Pulsar. |
| `more-information-needed` | [search][search-pulsar-repo-label-more-information-needed] | [search][search-pulsar-org-label-more-information-needed] | More information needs to be collected about these problems or feature requests (e.g. steps to reproduce). |
| `needs-reproduction` | [search][search-pulsar-repo-label-needs-reproduction] | [search][search-pulsar-org-label-needs-reproduction] | Likely bugs, but haven't been reliably reproduced. |
| `blocked` | [search][search-pulsar-repo-label-blocked] | [search][search-pulsar-org-label-blocked] | Issues blocked on other issues. |
| `duplicate` | [search][search-pulsar-repo-label-duplicate] | [search][search-pulsar-org-label-duplicate] | Issues which are duplicates of other issues, i.e. they have been reported before. |
| `wontfix` | [search][search-pulsar-repo-label-wontfix] | [search][search-pulsar-org-label-wontfix] | The Pulsar core team has decided not to fix these issues for now, either because they're working as intended or for some other reason. |
| `invalid` | [search][search-pulsar-repo-label-invalid] | [search][search-pulsar-org-label-invalid] | Issues which aren't valid (e.g. user errors). |
| `package-idea` | [search][search-pulsar-repo-label-package-idea] | [search][search-pulsar-org-label-package-idea] | Feature request which might be good candidates for new packages, instead of extending Pulsar or core Pulsar packages. |
| `wrong-repo` | [search][search-pulsar-repo-label-wrong-repo] | [search][search-pulsar-org-label-wrong-repo] | Issues reported on the wrong repository (e.g. a bug related to the [Settings View package](https://github.com/pulsar-edit/settings-view) was reported on [Pulsar core](https://github.com/pulsar-edit/pulsar)). |
| `rebrand` | [search][search-pulsar-repo-label-rebrand] | [search][search-pulsar-org-label-rebrand] | Related to the rebrand effort across the org. |

#### Topic Categories

| Label name | `pulsar-edit/pulsar` :mag_right: | `pulsar-edit`‑org :mag_right: | Description |
| --- | --- | --- | --- |
| `windows` | [search][search-pulsar-repo-label-windows] | [search][search-pulsar-org-label-windows] | Related to Pulsar running on Windows. |
| `linux` | [search][search-pulsar-repo-label-linux] | [search][search-pulsar-org-label-linux] | Related to Pulsar running on Linux. |
| `mac` | [search][search-pulsar-repo-label-mac] | [search][search-pulsar-org-label-mac] | Related to Pulsar running on macOS. |
| `documentation` | [search][search-pulsar-repo-label-documentation] | [search][search-pulsar-org-label-documentation] | Related to any type of documentation (e.g. [API documentation](https://atom.io/docs/api/latest/) and the [flight manual](https://flight-manual.atom.io/)). |
| `performance` | [search][search-pulsar-repo-label-performance] | [search][search-pulsar-org-label-performance] | Related to performance. |
| `security` | [search][search-pulsar-repo-label-security] | [search][search-pulsar-org-label-security] | Related to security. |
| `ui` | [search][search-pulsar-repo-label-ui] | [search][search-pulsar-org-label-ui] | Related to visual design. |
| `api` | [search][search-pulsar-repo-label-api] | [search][search-pulsar-org-label-api] | Related to Pulsar's public APIs. |
| `uncaught-exception` | [search][search-pulsar-repo-label-uncaught-exception] | [search][search-pulsar-org-label-uncaught-exception] | Issues about uncaught exceptions, normally created from the [Notifications package](https://github.com/pulsar-edit/notifications). |
| `crash` | [search][search-pulsar-repo-label-crash] | [search][search-pulsar-org-label-crash] | Reports of Pulsar completely crashing. |
| `auto-indent` | [search][search-pulsar-repo-label-auto-indent] | [search][search-pulsar-org-label-auto-indent] | Related to auto-indenting text. |
| `encoding` | [search][search-pulsar-repo-label-encoding] | [search][search-pulsar-org-label-encoding] | Related to character encoding. |
| `network` | [search][search-pulsar-repo-label-network] | [search][search-pulsar-org-label-network] | Related to network problems or working with remote files (e.g. on network drives). |
| `git` | [search][search-pulsar-repo-label-git] | [search][search-pulsar-org-label-git] | Related to Git functionality (e.g. problems with gitignore files or with showing the correct file status). |

#### `pulsar-edit/pulsar` Topic Categories

| Label name | `pulsar-edit/pulsar` :mag_right: | `pulsar-edit`‑org :mag_right: | Description |
| --- | --- | --- | --- |
| `editor-rendering` | [search][search-pulsar-repo-label-editor-rendering] | [search][search-pulsar-org-label-editor-rendering] | Related to language-independent aspects of rendering text (e.g. scrolling, soft wrap, and font rendering). |
| `build-error` | [search][search-pulsar-repo-label-build-error] | [search][search-pulsar-org-label-build-error] | Related to problems with building Pulsar from source. |
| `error-from-pathwatcher` | [search][search-pulsar-repo-label-error-from-pathwatcher] | [search][search-pulsar-org-label-error-from-pathwatcher] | Related to errors thrown by the [pathwatcher library](https://github.com/atom/node-pathwatcher). |
| `error-from-save` | [search][search-pulsar-repo-label-error-from-save] | [search][search-pulsar-org-label-error-from-save] | Related to errors thrown when saving files. |
| `error-from-open` | [search][search-pulsar-repo-label-error-from-open] | [search][search-pulsar-org-label-error-from-open] | Related to errors thrown when opening files. |
| `installer` | [search][search-pulsar-repo-label-installer] | [search][search-pulsar-org-label-installer] | Related to the Pulsar installers for different OSes. |
| `auto-updater` | [search][search-pulsar-repo-label-auto-updater] | [search][search-pulsar-org-label-auto-updater] | Related to the auto-updater for different OSes. |
| `deprecation-help` | [search][search-pulsar-repo-label-deprecation-help] | [search][search-pulsar-org-label-deprecation-help] | Issues for helping package authors remove usage of deprecated APIs in packages. |
| `electron` | [search][search-pulsar-repo-label-electron] | [search][search-pulsar-org-label-electron] | Issues that require changes to [Electron](https://electron.atom.io) to fix or implement. |

#### Pull Request Labels

| Label name | `pulsar-edit/pulsar` :mag_right: | `pulsar-edit`‑org :mag_right: | Description
| --- | --- | --- | --- |
| `work-in-progress` | [search][search-pulsar-repo-label-work-in-progress] | [search][search-pulsar-org-label-work-in-progress] | Pull requests which are still being worked on, more changes will follow. |
| `needs-review` | [search][search-pulsar-repo-label-needs-review] | [search][search-pulsar-org-label-needs-review] | Pull requests which need code review, and approval from maintainers or Pulsar core team. |
| `under-review` | [search][search-pulsar-repo-label-under-review] | [search][search-pulsar-org-label-under-review] | Pull requests being reviewed by maintainers or Pulsar core team. |
| `requires-changes` | [search][search-pulsar-repo-label-requires-changes] | [search][search-pulsar-org-label-requires-changes] | Pull requests which need to be updated based on review comments and then reviewed again. |
| `needs-testing` | [search][search-pulsar-repo-label-needs-testing] | [search][search-pulsar-org-label-needs-testing] | Pull requests which need manual testing. |

[search-pulsar-repo-label-rebrand]: https://github.com/search?q=is%3Aoepn+is%3Aissue+repo%3Apulsar-edit%2Fpular+label%3Arebrand
[search-pulsar-org-label-rebrand]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Arebrand
[search-pulsar-repo-label-enhancement]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aenhancement
[search-pulsar-org-label-enhancement]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aenhancement
[search-pulsar-repo-label-bug]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Abug
[search-pulsar-org-label-bug]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Abug
[search-pulsar-repo-label-question]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aquestion
[search-pulsar-org-label-question]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aquestion
[search-pulsar-repo-label-feedback]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Afeedback
[search-pulsar-org-label-feedback]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Afeedback
[search-pulsar-repo-label-help-wanted]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ahelp-wanted
[search-pulsar-org-label-help-wanted]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ahelp-wanted
[search-pulsar-repo-label-beginner]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Abeginner
[search-pulsar-org-label-beginner]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Abeginner
[search-pulsar-repo-label-more-information-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Amore-information-needed
[search-pulsar-org-label-more-information-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Amore-information-needed
[search-pulsar-repo-label-needs-reproduction]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aneeds-reproduction
[search-pulsar-org-label-needs-reproduction]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aneeds-reproduction
[search-pulsar-repo-label-triage-help-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Atriage-help-needed
[search-pulsar-org-label-triage-help-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Atriage-help-needed
[search-pulsar-repo-label-windows]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Awindows
[search-pulsar-org-label-windows]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Awindows
[search-pulsar-repo-label-linux]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Alinux
[search-pulsar-org-label-linux]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Alinux
[search-pulsar-repo-label-mac]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Amac
[search-pulsar-org-label-mac]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Amac
[search-pulsar-repo-label-documentation]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar%2Fpulsar+label%3Adocumentation
[search-pulsar-org-label-documentation]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Adocumentation
[search-pulsar-repo-label-performance]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aperformance
[search-pulsar-org-label-performance]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aperformance
[search-pulsar-repo-label-security]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Asecurity
[search-pulsar-org-label-security]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Asecurity
[search-pulsar-repo-label-ui]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aui
[search-pulsar-org-label-ui]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aui
[search-pulsar-repo-label-api]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aapi
[search-pulsar-org-label-api]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aapi
[search-pulsar-repo-label-crash]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Acrash
[search-pulsar-org-label-crash]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Acrash
[search-pulsar-repo-label-auto-indent]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aauto-indent
[search-pulsar-org-label-auto-indent]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aauto-indent
[search-pulsar-repo-label-encoding]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aencoding
[search-pulsar-org-label-encoding]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aencoding
[search-pulsar-repo-label-network]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Anetwork
[search-pulsar-org-label-network]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Anetwork
[search-pulsar-repo-label-uncaught-exception]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Auncaught-exception
[search-pulsar-org-label-uncaught-exception]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Auncaught-exception
[search-pulsar-repo-label-git]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Agit
[search-pulsar-org-label-git]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Agit
[search-pulsar-repo-label-blocked]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ablocked
[search-pulsar-org-label-blocked]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ablocked
[search-pulsar-repo-label-duplicate]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aduplicate
[search-pulsar-org-label-duplicate]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aduplicate
[search-pulsar-repo-label-wontfix]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Awontfix
[search-pulsar-org-label-wontfix]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Awontfix
[search-pulsar-repo-label-invalid]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ainvalid
[search-pulsar-org-label-invalid]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ainvalid
[search-pulsar-repo-label-package-idea]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Apackage-idea
[search-pulsar-org-label-package-idea]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Apackage-idea
[search-pulsar-repo-label-wrong-repo]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Awrong-repo
[search-pulsar-org-label-wrong-repo]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Awrong-repo
[search-pulsar-repo-label-editor-rendering]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aeditor-rendering
[search-pulsar-org-label-editor-rendering]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aeditor-rendering
[search-pulsar-repo-label-build-error]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Abuild-error
[search-pulsar-org-label-build-error]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Abuild-error
[search-pulsar-repo-label-error-from-pathwatcher]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aerror-from-pathwatcher
[search-pulsar-org-label-error-from-pathwatcher]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aerror-from-pathwatcher
[search-pulsar-repo-label-error-from-save]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aerror-from-save
[search-pulsar-org-label-error-from-save]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aerror-from-save
[search-pulsar-repo-label-error-from-open]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aerror-from-open
[search-pulsar-org-label-error-from-open]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aerror-from-open
[search-pulsar-repo-label-installer]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ainstaller
[search-pulsar-org-label-installer]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ainstaller
[search-pulsar-repo-label-auto-updater]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aauto-updater
[search-pulsar-org-label-auto-updater]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aauto-updater
[search-pulsar-repo-label-deprecation-help]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Adeprecation-help
[search-pulsar-org-label-deprecation-help]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Adeprecation-help
[search-pulsar-repo-label-electron]: https://github.com/search?q=is%3Aissue+repo%3Apulsar-edit%2Fpulsar+is%3Aopen+label%3Aelectron
[search-pulsar-org-label-electron]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aelectron
[search-pulsar-repo-label-work-in-progress]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Awork-in-progress
[search-pulsar-org-label-work-in-progress]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Awork-in-progress
[search-pulsar-repo-label-needs-review]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Aneeds-review
[search-pulsar-org-label-needs-review]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Aneeds-review
[search-pulsar-repo-label-under-review]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Aunder-review
[search-pulsar-org-label-under-review]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Aunder-review
[search-pulsar-repo-label-requires-changes]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Arequires-changes
[search-pulsar-org-label-requires-changes]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Arequires-changes
[search-pulsar-repo-label-needs-testing]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Aneeds-testing
[search-pulsar-org-label-needs-testing]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Aneeds-testing

[beginner]:https://github.com/search?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+label%3Abeginner+label%3Ahelp-wanted+user%3Apulsar-edit+sort%3Acomments-desc
[help-wanted]:https://github.com/search?q=is%3Aopen+is%3Aissue+label%3Ahelp-wanted+user%3Apulsar-edit+sort%3Acomments-desc+-label%3Abeginner
[contributing-to-official-pulsar-packages]:https://flight-manual.atom.io/hacking-atom/sections/contributing-to-official-atom-packages/
[hacking-on-pulsar-core]: https://flight-manual.atom.io/hacking-atom/sections/hacking-on-atom-core/
