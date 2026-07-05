# Contributing to Pulsar

👍🎉 First off, thanks for taking the time to contribute! 🎉👍

The following is a set of guidelines for contributing to Pulsar and its packages, which are hosted in the [pulsar-edit Organization](https://github.com/pulsar-edit) on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

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
  * [Specs Styleguide](#specs-styleguide)
  * [Documentation Styleguide](#documentation-styleguide)

[Additional Notes](#additional-notes)
  * [Issue and Pull Request Labels](#issue-and-pull-request-labels)

## Code of Conduct

This project and everyone participating in it is governed by the [Pulsar Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [admin@pulsar-edit.dev](mailto:admin@pulsar-edit.dev).

## I don't want to read this whole thing I just have a question!!!

> **Note:** Please don't file an issue to ask a question. You'll get faster results by using the resources below.

We have [an official message board]((https://github.com/orgs/pulsar-edit/discussions) where the community chimes in with helpful advice if you have questions.

## What should I know before I get started?

### Pulsar and Packages

Pulsar is a large open source project &mdash; it's made up of over [200 repositories](https://github.com/pulsar-edit). When you initially consider contributing to Pulsar, you might be unsure about which of those 200 repositories implements the functionality you want to change or report a bug for. This section should help you with that.

Pulsar is intentionally very modular. Nearly every non-editor UI element you interact with comes from a package, even fundamental things like tabs and the status-bar. These packages are packages in the same way that packages in the [Pulsar package repository](https://packages.pulsar-edit.dev/packages) are packages, with one difference: they are bundled into the [default distribution](https://github.com/pulsar-edit/pulsar/blob/master/package.json).

<a id="pulsar-packages-image"></a>

![pulsar-packages](https://cloud.githubusercontent.com/assets/69169/10472281/84fc9792-71d3-11e5-9fd1-19da717df079.png)

To get a sense for the packages that are bundled with Pulsar, you can go to `Settings` > `Packages` within Pulsar and take a look at the Core Packages section.

Here's a list of the big ones:

* [pulsar-edit/pulsar](https://github.com/pulsar-edit/pulsar) - Pulsar Core! The core editor component is responsible for basic text editing (e.g. cursors, selections, scrolling), text indentation, wrapping, and folding, text rendering, editor rendering, file system operations (e.g. saving), and installation and auto-updating. You should also use this repository for feedback related to the [API](https://docs.pulsar-edit.dev/api/) and for large, overarching design proposals.
* [tree-view](https://github.com/pulsar-edit/pulsar/tree/master/packages/tree-view) - file and directory listing on the left of the UI.
* [fuzzy-finder](https://github.com/pulsar-edit/pulsar/tree/master/packages/fuzzy-finder) - the quick file opener.
* [find-and-replace](https://github.com/pulsar-edit/pulsar/tree/master/packages/find-and-replace) - all search and replace functionality.
* [tabs](https://github.com/pulsar-edit/pulsar/tree/master/packages/tabs) - the tabs for open editors at the top of the UI.
* [status-bar](https://github.com/pulsar-edit/pulsar/tree/master/packages/status-bar) - the status bar at the bottom of the UI.
* [markdown-preview](https://github.com/pulsar-edit/pulsar/tree/master/packages/markdown-preview) - the rendered markdown pane item.
* [settings-view](https://github.com/pulsar-edit/pulsar/tree/master/packages/settings-view) - the settings UI pane item.
* [autocomplete-plus](https://github.com/pulsar-edit/pulsar/tree/master/packages/autocomplete-plus) - autocompletions shown while typing. Some languages have additional packages for autocompletion functionality, such as [autocomplete-html](https://github.com/pulsar-edit/pulsar/tree/master/packages/autocomplete-html).
* [git-diff](https://github.com/pulsar-edit/pulsar/tree/master/packages/git-diff) - Git change indicators shown in the editor's gutter.
* [language-javascript](https://github.com/pulsar-edit/pulsar/tree/master/packages/language-javascript) - all bundled languages are packages too, and each one has a separate package `language-[name]`. Use these for feedback on syntax highlighting issues that only appear for a specific language.
* [one-dark-ui](https://github.com/pulsar-edit/pulsar/tree/master/packages/one-dark-ui) - the default UI styling for anything but the text editor. UI theme packages (i.e. packages with a `-ui` suffix) provide only styling and it's possible that a bundled package is responsible for a UI issue. There are other bundled UI themes, such as [one-light-ui](https://github.com/pulsar-edit/pulsar/tree/master/packages/one-light-ui).
* [one-dark-syntax](https://github.com/pulsar-edit/pulsar/tree/master/packages/one-dark-syntax) - the default syntax highlighting styles applied for all languages. There are other bundled syntax themes, such as [solarized-dark-syntax](https://github.com/pulsar-edit/pulsar/tree/master/packages/solarized-dark-syntax). You should use these packages for reporting issues that appear in many languages, but disappear if you change to another syntax theme.
* [ppm](https://github.com/pulsar-edit/ppm) - the `ppm` command line tool (Pulsar Package Manager). You should use this repository for any contributions related to the `ppm` tool and for publishing packages.
* [package-frontend](https://github.com/pulsar-edit/package-frontend) and [package-backend](https://github.com/pulsar-edit/package-backend) - the frontend and backend repos for the Pulsar package registry ([website](https://packages.pulsar-edit.dev/packages), [API](https://api.pulsar-edit.dev/swagger-ui/)) used by [ppm](https://github.com/pulsar-edit/ppm).

There are many more, but this list should be a good starting point. For more information on how to work with Pulsar's official packages, see [Contributing to Pulsar Packages][contributing-to-official-atom-packages].

Also, because Pulsar is so extensible, it's possible that a feature you've become accustomed to in Pulsar or an issue you're encountering isn't coming from a bundled package at all, but rather a [community package](https://packages.pulsar-edit.dev/packages) you've installed. Each community package has its own repository too.

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
* Packages that add autocomplete providers are named `autocomplete-[what-they-autocomplete]` &mdash; ex: [autocomplete-css](https://github.com/pulsar-edit/pulsar/tree/master/packages/autocomplete-css)

### Design Decisions

When we make a significant decision in how we maintain the project and what we can or cannot support, we will document it in the [Pulsar RFCs](https://github.com/pulsar-edit/pulsar/tree/master/docs/rfcs). If you have a question around how we do things, check to see if it is documented there. If it is *not* documented there, please open a new topic on [Github Discussions, the official Pulsar message board](https://github.com/orgs/pulsar-edit/discussions) and ask your question.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Pulsar. Following these guidelines helps maintainers and the community understand your report 📝, reproduce the behavior 💻 💻, and find related reports 🔎.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please [include as many details as possible](#how-do-i-submit-a-good-bug-report). Fill out [the required template](https://github.com/pulsar-edit/.github/blob/main/.github/ISSUE_TEMPLATE/bug-report.yml), the information it asks for helps us resolve issues faster.

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

#### Before Submitting A Bug Report

* **Check the [debugging guide](https://docs.pulsar-edit.dev/troubleshooting-pulsar/).** You might be able to find the cause of the problem and fix things yourself. Most importantly, check if you can reproduce the problem [in the latest version of Pulsar](https://docs.pulsar-edit.dev/troubleshooting-pulsar/updating-to-the-latest-version/), if the problem happens when you run Pulsar in [safe mode](https://docs.pulsar-edit.dev/troubleshooting-pulsar/using-safe-mode/), and if you can get the desired behavior by changing [Pulsar's or packages' config settings](https://docs.pulsar-edit.dev/troubleshooting-pulsar/checking-pulsar-and-package-settings/).
* **Search the [discussions](https://github.com/orgs/pulsar-edit/discussions)** for a list of common questions and problems.
* **Determine [which repository the problem should be reported in](#pulsar-and-packages)**.
* **Perform a [cursory search](https://github.com/search?q=+is%3Aissue+user%3Apulsar-edit)** to see if the problem has already been reported. If it has **and the issue is still open**, add a comment to the existing issue instead of opening a new one.

#### How Do I Submit A (Good) Bug Report?

Bugs are tracked as [GitHub issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues). After you've determined [which repository](#pulsar-and-packages) your bug is related to, create an issue on that repository and provide the following information by filling in [the template](https://github.com/pulsar-edit/.github/blob/main/.github/ISSUE_TEMPLATE/bug-report.yml).

Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible. For example, start by explaining how you started Pulsar, e.g. which command exactly you used in the terminal, or how you started Pulsar otherwise. When listing steps, **don't just say what you did, but explain how you did it**. For example, if you moved the cursor to the end of a line, explain if you used the mouse, or a keyboard shortcut or a Pulsar command, and if so which one?
* **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples. If you're providing snippets in the issue, use [Markdown code blocks](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github).
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and/or screencasts** which show you following the described steps and clearly demonstrate the problem. If you use the keyboard while following the steps, **record the screencast with the [Keybinding Resolver](https://github.com/pulsar-edit/pulsar/tree/master/packages/keybinding-resolver) shown**.  The exact program used to record one's screen will vary from platform to platform. If you like, you can use `ffmpeg` to convert your screencast to MP4 for broadest compatibility: e.g., `ffmpeg -i screencast.mov screencast.mp4`.
* **If you're reporting that Pulsar crashed**, include a crash report with a stack trace from the operating system. On macOS, the crash report will be available in `Console.app` under "Diagnostic and usage information" > "User diagnostic reports". On Windows and Linux, you should be able to find a new crashdump in the `crashdumps` folder within `ATOM_HOME` — e.g., `~/.pulsar/crashdumps` on Linux. Include the crash report in the issue in a [code block](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github), a [file attachment](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files), or put it in a [gist](https://gist.github.com/discover) and provide link to that gist.
* **If the problem is related to performance or memory**, include a [CPU profile capture](https://docs.pulsar-edit.dev/troubleshooting-pulsar/diagnosing-runtime-performance/) with your report.
* **If Chrome's developer tools pane is shown without you triggering it**, that typically means that an installed package is throwing an error, or else that there is a syntax error in your `styles.less`. In the former case, running in [Safe Mode](https://docs.pulsar-edit.dev/troubleshooting-pulsar/using-safe-mode/) will disable non-core packages so you can compare the behavior; in the latter case, you can try using a different theme or commenting out the contents of your `styles.less` to see if that fixes the problem.
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and share more information using the guidelines below.

Provide more context by answering these questions:

* **Can you reproduce the problem in [safe mode](https://docs.pulsar-edit.dev/troubleshooting-pulsar/using-safe-mode/)?**
* **Did the problem start happening recently** (e.g. after updating to a new version of Pulsar) or was this always a problem?
* If the problem started happening recently, **can you reproduce the problem in an older version of Pulsar?** What's the most recent version in which the problem doesn't happen? You can download older versions of Pulsar from [the releases page](https://github.com/pulsar-edit/pulsar/releases).
* **Can you reliably reproduce the issue?** If not, provide details about how often the problem happens and under which conditions it normally happens.
* If the problem is related to working with files (e.g. opening and editing files), **does the problem happen for all files and projects or only some?** Does the problem happen only when working with local or remote files (e.g. on network drives), with files of a specific type (e.g. only JavaScript or Python files), with large files or files with very long lines, or with files in a specific encoding? Is there anything else special about the files you are using?

Include details about your configuration and environment:

* **Which version of Pulsar are you using?** You can get the exact version by running `pulsar -v` in your terminal, or by starting Pulsar and running the `Application: About` command from the [Command Palette](https://github.com/pulsar-edit/pulsar/tree/master/packages/command-palette).
* **What's the name and version of the OS you're using**?
* **Are you running Pulsar in a virtual machine?** If so, which VM software are you using and which operating systems and versions are used for the host and the guest?
* **Which [packages](#pulsar-and-packages) do you have installed?** You can get that list by running `ppm list --installed`.
* **Are you using [local configuration files](https://docs.pulsar-edit.dev/customizing-pulsar/configuring-with-cson/)** `config.cson`, `keymap.cson`, `snippets.cson`, `styles.less` and `init.js` to customize Pulsar? If so, provide the contents of those files, preferably in a [code block](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github) or with a link to a [gist](https://gist.github.com/discover).
* **Are you using Pulsar with multiple monitors?** If so, can you reproduce the problem when you use a single monitor?
* **Which keyboard layout are you using?** Are you using a US layout or some other layout?

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Pulsar, including completely new features and minor improvements to existing functionality. Following these guidelines helps maintainers and the community understand your suggestion 📝 and find related suggestions 🔎.

Before creating enhancement suggestions, please check [this list](#before-submitting-an-enhancement-suggestion) as you might find out that you don't need to create one. When you are creating an enhancement suggestion, please [include as many details as possible](#how-do-i-submit-a-good-enhancement-suggestion). Fill in [the template](https://github.com/pulsar-edit/.github/blob/main/.github/ISSUE_TEMPLATE/feature_request.yml), including the steps that you imagine you would take if the feature you're requesting existed.

#### Before Submitting An Enhancement Suggestion

* **Check the [debugging guide](https://docs.pulsar-edit.dev/troubleshooting-pulsar/)** for tips — you might discover that the enhancement is already available. Most importantly, check if you're using [the latest version of Pulsar](https://docs.pulsar-edit.dev/troubleshooting-pulsar/updating-to-the-latest-version/) and if you can get the desired behavior by changing [Pulsar's or packages' config settings](https://docs.pulsar-edit.dev/troubleshooting-pulsar/checking-pulsar-and-package-settings/).
* **Check if there's already [a package](https://packages.pulsar-edit.dev/packages) which provides that enhancement.**
* **Determine [which repository the enhancement should be suggested in](#pulsar-and-packages).**
* **Perform a [cursory search](https://github.com/search?q=+is%3Aissue+user%3Apulsar-edit)** to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.

#### How Do I Submit A (Good) Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues). After you've determined [which repository](#pulsar-and-packages) your enhancement suggestion is related to, create an issue on that repository and provide the following information:

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
* **Provide specific examples to demonstrate the steps**. Include copy/pasteable snippets which you use in those examples, as [Markdown code blocks](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github).
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
* **Include screenshots and animated GIFs** which help you demonstrate the steps or point out the part of Pulsar which the suggestion is related to. You can use [this tool](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows, and [this tool](https://github.com/colinkeenan/silentcast) on Linux.
* **Explain why this enhancement would be useful** to most Pulsar users and isn't something that can or should be implemented as a [community package](#pulsar-and-packages).
* **List some other text editors or applications where this enhancement exists.**
* **Specify which version of Pulsar you're using.** You can get the exact version by running `pulsar -v` in your terminal, or by starting Pulsar and running the `Application: About` command from the [Command Palette](https://github.com/pulsar-edit/pulsar/tree/master/packages/command-palette).
* **Specify the name and version of the OS you're using.**

### Your First Code Contribution

Unsure where to begin contributing to Pulsar? You can start by looking through these `beginner` and `help-wanted` issues:

* [Beginner issues][beginner] - issues which should only require a few lines of code, and a test or two.
* [Help wanted issues][help-wanted] - issues which should be a bit more involved than `beginner` issues. These could be issues that require subject matter expertise that we don't have. They could also be issues that aren't on our roadmap — for which we'd accept a well-written pull request, but which otherwise don't have a high chance of being addressed by the core maintainers in the near future.

Both issue lists are sorted by total number of comments. While not perfect, number of comments is a reasonable proxy for impact a given change will have.

If you want to read about using Pulsar or developing packages in Pulsar, the [Pulsar documentation](https://docs.pulsar-edit.dev/) is free and available online. You can find the source to the manual in [pulsar-edit/pulsar-edit.github.io](https://github.com/pulsar-edit/pulsar-edit.github.io).

#### Local development

Pulsar Core and all packages can be developed locally. For instructions on how to do this, see the following sections in the [Pulsar documentation](https://docs.pulsar-edit.dev/):

* [Hacking on Pulsar Core][hacking-on-atom-core]
* [Contributing to Official Pulsar Packages][contributing-to-official-atom-packages]

### Pull Requests

The process described here has several goals:

- Maintain Pulsar's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible Pulsar
- Enable a sustainable system for Pulsar's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Follow all instructions in [the template](PULL_REQUEST_TEMPLATE.md)
2. Follow the [styleguides](#styleguides)
3. After you submit your pull request, verify that all [status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks) are passing <details><summary>What if the status checks are failing?</summary>If a status check is failing, and you believe that the failure is unrelated to your change, please leave a comment on the pull request explaining why you believe the failure is unrelated. A maintainer will re-run the status check for you. If we conclude that the failure was a false positive, then we will open an issue to track that problem with our status check suite.</details>

While the prerequisites above must be satisfied prior to having your pull request reviewed, the reviewer(s) may ask you to complete additional design work, tests, or other changes before your pull request can be ultimately accepted.

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

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
    * Built-in Node Modules (such as `path`)
    * Built-in Pulsar and Electron Modules (such as `atom`, `remote`)
    * Local Modules (using relative paths)
* Place class properties in the following order:
    * Class methods and properties (methods starting with `static`)
    * Instance methods and properties
* Avoid platform-dependent code
  * If you must resort to a platform-dependent fix, you should still ensure that the affected code path works as expected on each of our three supported platforms — and that we prove it with specs to the greatest possible extent

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

* Use [AtomDoc](https://github.com/pulsar-edit/atomdoc).
* Use [Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github).
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

[GitHub search](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) makes it easy to use labels for finding groups of issues or pull requests you're interested in. For example, you might be interested in [open issues across `pulsar-edit/pulsar` and all Pulsar-owned packages which are labeled as bugs, but still need to be reliably reproduced](https://github.com/search?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Abug+label%3Aneeds-reproduction) or perhaps [open pull requests in `pulsar-edit/pulsar` which haven't been reviewed yet](https://github.com/search?utf8=%E2%9C%93&q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+comments%3A0). To help you find issues and pull requests, each label is listed with search links for finding open items with that label in `pulsar-edit/pulsar` only and also across all Pulsar repositories. We  encourage you to read about [other search filters](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) which will help you write more focused queries.

The labels are loosely grouped by their purpose, but it's not required that every issue has a label from every group or that an issue can't have more than one label from the same group.

Please open an issue on `pulsar-edit/pulsar` if you have suggestions for new labels, and if you notice some labels are missing on some repositories, then please open an issue on that repository.

#### Type of Issue and Issue State

| Label name | `pulsar-edit/pulsar` 🔎 | `pulsar-edit`‑org 🔎 | Description |
| --- | --- | --- | --- |
| `enhancement` | [search][search-atom-repo-label-enhancement] | [search][search-atom-org-label-enhancement] | Feature requests. |
| `bug` | [search][search-atom-repo-label-bug] | [search][search-atom-org-label-bug] | Confirmed bugs or reports that are very likely to be bugs. |
| `question` | [search][search-atom-repo-label-question] | [search][search-atom-org-label-question] | Questions more than bug reports or feature requests (e.g. how do I do X). |
| `feedback` | [search][search-atom-repo-label-feedback] | [search][search-atom-org-label-feedback] | General feedback more than bug reports or feature requests. |
| `help-wanted` | [search][search-atom-repo-label-help-wanted] | [search][search-atom-org-label-help-wanted] | The Pulsar core team would appreciate help from the community in resolving these issues. |
| `beginner` | [search][search-atom-repo-label-beginner] | [search][search-atom-org-label-beginner] | Less complex issues which would be good first issues to work on for users who want to contribute to Pulsar. |
| `more-information-needed` | [search][search-atom-repo-label-more-information-needed] | [search][search-atom-org-label-more-information-needed] | More information needs to be collected about these problems or feature requests (e.g. steps to reproduce). |
| `needs-reproduction` | [search][search-atom-repo-label-needs-reproduction] | [search][search-atom-org-label-needs-reproduction] | Likely bugs, but haven't been reliably reproduced. |
| `blocked` | [search][search-atom-repo-label-blocked] | [search][search-atom-org-label-blocked] | Issues blocked on other issues. |
| `duplicate` | [search][search-atom-repo-label-duplicate] | [search][search-atom-org-label-duplicate] | Issues which are duplicates of other issues, i.e. they have been reported before. |
| `wontfix` | [search][search-atom-repo-label-wontfix] | [search][search-atom-org-label-wontfix] | The Pulsar core team has decided not to fix these issues for now, either because they're working as intended or for some other reason. |
| `invalid` | [search][search-atom-repo-label-invalid] | [search][search-atom-org-label-invalid] | Issues which aren't valid (e.g. user errors). |
| `package-idea` | [search][search-atom-repo-label-package-idea] | [search][search-atom-org-label-package-idea] | Feature request which might be good candidates for new packages, instead of extending Pulsar or core Pulsar packages. |
| `wrong-repo` | [search][search-atom-repo-label-wrong-repo] | [search][search-atom-org-label-wrong-repo] | Issues reported on the wrong repository (e.g. a bug related to the [Settings View package](https://github.com/pulsar-edit/pulsar/tree/master/packages/settings-view) was reported on [Pulsar core](https://github.com/pulsar-edit/pulsar)). |

#### Topic Categories

| Label name | `pulsar-edit/pulsar` 🔎 | `pulsar-edit`‑org 🔎 | Description |
| --- | --- | --- | --- |
| `windows` | [search][search-atom-repo-label-windows] | [search][search-atom-org-label-windows] | Related to Pulsar running on Windows. |
| `linux` | [search][search-atom-repo-label-linux] | [search][search-atom-org-label-linux] | Related to Pulsar running on Linux. |
| `mac` | [search][search-atom-repo-label-mac] | [search][search-atom-org-label-mac] | Related to Pulsar running on macOS. |
| `documentation` | [search][search-atom-repo-label-documentation] | [search][search-atom-org-label-documentation] | Related to any type of documentation (e.g. [API documentation](https://docs.pulsar-edit.dev/api/) and the [Pulsar documentation](https://docs.pulsar-edit.dev/)). |
| `performance` | [search][search-atom-repo-label-performance] | [search][search-atom-org-label-performance] | Related to performance. |
| `security` | [search][search-atom-repo-label-security] | [search][search-atom-org-label-security] | Related to security. |
| `ui` | [search][search-atom-repo-label-ui] | [search][search-atom-org-label-ui] | Related to visual design. |
| `api` | [search][search-atom-repo-label-api] | [search][search-atom-org-label-api] | Related to Pulsar's public APIs. |
| `uncaught-exception` | [search][search-atom-repo-label-uncaught-exception] | [search][search-atom-org-label-uncaught-exception] | Issues about uncaught exceptions, normally created from the [Notifications package](https://github.com/pulsar-edit/pulsar/tree/master/packages/notifications). |
| `crash` | [search][search-atom-repo-label-crash] | [search][search-atom-org-label-crash] | Reports of Pulsar completely crashing. |
| `auto-indent` | [search][search-atom-repo-label-auto-indent] | [search][search-atom-org-label-auto-indent] | Related to auto-indenting text. |
| `encoding` | [search][search-atom-repo-label-encoding] | [search][search-atom-org-label-encoding] | Related to character encoding. |
| `network` | [search][search-atom-repo-label-network] | [search][search-atom-org-label-network] | Related to network problems or working with remote files (e.g. on network drives). |
| `git` | [search][search-atom-repo-label-git] | [search][search-atom-org-label-git] | Related to Git functionality (e.g. problems with gitignore files or with showing the correct file status). |

#### `pulsar-edit/pulsar` Topic Categories

| Label name | `pulsar-edit/pulsar` 🔎 | `pulsar-edit`‑org 🔎 | Description |
| --- | --- | --- | --- |
| `editor-rendering` | [search][search-atom-repo-label-editor-rendering] | [search][search-atom-org-label-editor-rendering] | Related to language-independent aspects of rendering text (e.g. scrolling, soft wrap, and font rendering). |
| `build-error` | [search][search-atom-repo-label-build-error] | [search][search-atom-org-label-build-error] | Related to problems with building Pulsar from source. |
| `error-from-pathwatcher` | [search][search-atom-repo-label-error-from-pathwatcher] | [search][search-atom-org-label-error-from-pathwatcher] | Related to errors thrown by the [pathwatcher library](https://github.com/pulsar-edit/node-pathwatcher). |
| `error-from-save` | [search][search-atom-repo-label-error-from-save] | [search][search-atom-org-label-error-from-save] | Related to errors thrown when saving files. |
| `error-from-open` | [search][search-atom-repo-label-error-from-open] | [search][search-atom-org-label-error-from-open] | Related to errors thrown when opening files. |
| `installer` | [search][search-atom-repo-label-installer] | [search][search-atom-org-label-installer] | Related to the Pulsar installers for different OSes. |
| `auto-updater` | [search][search-atom-repo-label-auto-updater] | [search][search-atom-org-label-auto-updater] | Related to the auto-updater for different OSes. |
| `deprecation-help` | [search][search-atom-repo-label-deprecation-help] | [search][search-atom-org-label-deprecation-help] | Issues for helping package authors remove usage of deprecated APIs in packages. |
| `electron` | [search][search-atom-repo-label-electron] | [search][search-atom-org-label-electron] | Issues that require changes to [Electron](https://www.electronjs.org) to fix or implement. |

#### Pull Request Labels

| Label name | `pulsar-edit/pulsar` 🔎 | `pulsar-edit`‑org 🔎 | Description
| --- | --- | --- | --- |
| `work-in-progress` | [search][search-atom-repo-label-work-in-progress] | [search][search-atom-org-label-work-in-progress] | Pull requests which are still being worked on, more changes will follow. |
| `needs-review` | [search][search-atom-repo-label-needs-review] | [search][search-atom-org-label-needs-review] | Pull requests which need code review, and approval from maintainers or Pulsar core team. |
| `under-review` | [search][search-atom-repo-label-under-review] | [search][search-atom-org-label-under-review] | Pull requests being reviewed by maintainers or Pulsar core team. |
| `requires-changes` | [search][search-atom-repo-label-requires-changes] | [search][search-atom-org-label-requires-changes] | Pull requests which need to be updated based on review comments and then reviewed again. |
| `needs-testing` | [search][search-atom-repo-label-needs-testing] | [search][search-atom-org-label-needs-testing] | Pull requests which need manual testing. |

[search-atom-repo-label-enhancement]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aenhancement
[search-atom-org-label-enhancement]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aenhancement
[search-atom-repo-label-bug]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Abug
[search-atom-org-label-bug]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Abug
[search-atom-repo-label-question]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aquestion
[search-atom-org-label-question]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aquestion
[search-atom-repo-label-feedback]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Afeedback
[search-atom-org-label-feedback]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Afeedback
[search-atom-repo-label-help-wanted]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ahelp-wanted
[search-atom-org-label-help-wanted]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ahelp-wanted
[search-atom-repo-label-beginner]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Abeginner
[search-atom-org-label-beginner]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Abeginner
[search-atom-repo-label-more-information-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Amore-information-needed
[search-atom-org-label-more-information-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Amore-information-needed
[search-atom-repo-label-needs-reproduction]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aneeds-reproduction
[search-atom-org-label-needs-reproduction]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aneeds-reproduction
[search-atom-repo-label-triage-help-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Atriage-help-needed
[search-atom-org-label-triage-help-needed]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Atriage-help-needed
[search-atom-repo-label-windows]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Awindows
[search-atom-org-label-windows]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Awindows
[search-atom-repo-label-linux]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Alinux
[search-atom-org-label-linux]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Alinux
[search-atom-repo-label-mac]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Amac
[search-atom-org-label-mac]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Amac
[search-atom-repo-label-documentation]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Adocumentation
[search-atom-org-label-documentation]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Adocumentation
[search-atom-repo-label-performance]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aperformance
[search-atom-org-label-performance]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aperformance
[search-atom-repo-label-security]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Asecurity
[search-atom-org-label-security]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Asecurity
[search-atom-repo-label-ui]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aui
[search-atom-org-label-ui]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aui
[search-atom-repo-label-api]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aapi
[search-atom-org-label-api]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aapi
[search-atom-repo-label-crash]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Acrash
[search-atom-org-label-crash]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Acrash
[search-atom-repo-label-auto-indent]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aauto-indent
[search-atom-org-label-auto-indent]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aauto-indent
[search-atom-repo-label-encoding]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aencoding
[search-atom-org-label-encoding]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aencoding
[search-atom-repo-label-network]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Anetwork
[search-atom-org-label-network]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Anetwork
[search-atom-repo-label-uncaught-exception]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Auncaught-exception
[search-atom-org-label-uncaught-exception]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Auncaught-exception
[search-atom-repo-label-git]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Agit
[search-atom-org-label-git]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Agit
[search-atom-repo-label-blocked]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ablocked
[search-atom-org-label-blocked]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ablocked
[search-atom-repo-label-duplicate]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aduplicate
[search-atom-org-label-duplicate]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aduplicate
[search-atom-repo-label-wontfix]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Awontfix
[search-atom-org-label-wontfix]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Awontfix
[search-atom-repo-label-invalid]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ainvalid
[search-atom-org-label-invalid]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ainvalid
[search-atom-repo-label-package-idea]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Apackage-idea
[search-atom-org-label-package-idea]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Apackage-idea
[search-atom-repo-label-wrong-repo]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Awrong-repo
[search-atom-org-label-wrong-repo]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Awrong-repo
[search-atom-repo-label-editor-rendering]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aeditor-rendering
[search-atom-org-label-editor-rendering]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aeditor-rendering
[search-atom-repo-label-build-error]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Abuild-error
[search-atom-org-label-build-error]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Abuild-error
[search-atom-repo-label-error-from-pathwatcher]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aerror-from-pathwatcher
[search-atom-org-label-error-from-pathwatcher]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aerror-from-pathwatcher
[search-atom-repo-label-error-from-save]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aerror-from-save
[search-atom-org-label-error-from-save]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aerror-from-save
[search-atom-repo-label-error-from-open]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aerror-from-open
[search-atom-org-label-error-from-open]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aerror-from-open
[search-atom-repo-label-installer]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Ainstaller
[search-atom-org-label-installer]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Ainstaller
[search-atom-repo-label-auto-updater]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Aauto-updater
[search-atom-org-label-auto-updater]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aauto-updater
[search-atom-repo-label-deprecation-help]: https://github.com/search?q=is%3Aopen+is%3Aissue+repo%3Apulsar-edit%2Fpulsar+label%3Adeprecation-help
[search-atom-org-label-deprecation-help]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Adeprecation-help
[search-atom-repo-label-electron]: https://github.com/search?q=is%3Aissue+repo%3Apulsar-edit%2Fpulsar+is%3Aopen+label%3Aelectron
[search-atom-org-label-electron]: https://github.com/search?q=is%3Aopen+is%3Aissue+user%3Apulsar-edit+label%3Aelectron
[search-atom-repo-label-work-in-progress]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Awork-in-progress
[search-atom-org-label-work-in-progress]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Awork-in-progress
[search-atom-repo-label-needs-review]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Aneeds-review
[search-atom-org-label-needs-review]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Aneeds-review
[search-atom-repo-label-under-review]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Aunder-review
[search-atom-org-label-under-review]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Aunder-review
[search-atom-repo-label-requires-changes]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Arequires-changes
[search-atom-org-label-requires-changes]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Arequires-changes
[search-atom-repo-label-needs-testing]: https://github.com/search?q=is%3Aopen+is%3Apr+repo%3Apulsar-edit%2Fpulsar+label%3Aneeds-testing
[search-atom-org-label-needs-testing]: https://github.com/search?q=is%3Aopen+is%3Apr+user%3Apulsar-edit+label%3Aneeds-testing

[beginner]:https://github.com/search?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+label%3Abeginner+label%3Ahelp-wanted+user%3Apulsar-edit+sort%3Acomments-desc
[help-wanted]:https://github.com/search?q=is%3Aopen+is%3Aissue+label%3Ahelp-wanted+user%3Apulsar-edit+sort%3Acomments-desc+-label%3Abeginner
[contributing-to-official-atom-packages]:https://docs.pulsar-edit.dev/contributing-to-pulsar/contributing-to-official-pulsar-packages/
[hacking-on-atom-core]: https://docs.pulsar-edit.dev/contributing-to-pulsar/hacking-on-the-core/
