During these very early stages of the Pulsar project there are many things that need to be completed, and many ways that new contributors can assist.

This document describes some of the specific methods and techniques that can be used to help during the transition from the soon to be sunset `Atom` to `Pulsar`. While any contributions to the `Pulsar-Edit` Organization should follow the organization wide [Contributor Guidelines](https://github.com/pulsar-edit/.github/blob/main/CONTRIBUTING.md) this document highlights some specific tasks that need extra attention at this time and how to help with them.

At this time here are some of the easiest ways to help the community during this time:

* [Rebranding](#rebranding)
  * [`owner/repo` References](#ownerrepo-references)
  * [`Flight Manual` References](#flight-manual-references)
  * [3rd Party References](#3rd-party-references)
  * [Historical Data References](#historical-data-references)
  * [Rebranding in Code](#rebranding-in-code)
* [Simplifying and Bringing up to Standards](#simplifying-and-bringing-up-to-our-standards)
  * [Handle Template Files](#handle-template-files)
  * [Contributing.md](#contributing.md)
* [Decaffeination](#decaffeination)
  * [CoffeeScript 1.x or 2.x](#coffeescript-1.x-or-2.x)
  * [How to Decaffeinate](#how-to-decaffeinate)
  * [Confirming the Quality of Decaffeination](#confirming-the-quality-of-decaffeination)
  * [Testing](#testing)
* [Bump Dependencies](#bump-dependencies)
* [Conclusion](#conclusion)
  * [Discord Teams](#discord-teams)
  * [GitHub Teams](#github-teams)

---

## Rebranding

At a high level Rebranding is simply the task of replacing instances of `Atom` to `Pulsar`. Now of course as expected this is not as easy as just using a Find & Replace to accomplish this. If you do use Find & Replace functionality **please** ensure to check the results for accuracy, instead of expecting everything to get caught during a code review. So below are some guidelines that **must** be adhered to, to successfully merge a rebranding PR.

### `owner/repo` References:

Any time there is a reference to a `owner/repo` of a repository, ensure this matches our format. That is `pulsar-edit/repo` since unlike `Atom` our organization name is `pulsar-edit`. Additionally its important to note that in the vast majority of cases individual repositories have not experienced rebranding in the repository name, and at this time are not likely to do so. That is the repository `atom-keymap` isn't likely to, anytime soon, become `pulsar-keymap` and instead will remain `atom-keymap` for the foreseeable future. Some examples of proper rebranding:

- `atom/atom` => `pulsar-edit/pulsar`
- `atom/atom-keymap` => `pulsar-edit/atom-keymap`
- `atom/bracket-matcher` => `pulsar-edit/bracket-matcher`

Then here are examples of incorrect rebranding efforts:

- `atom/atom-keymap` => `atom/pulsar-keymap` : The repo name has not changed, and it points to the incorrect org.
- `atom/atom-keymap` => `pulsar/atom-keymap` : The org does not match our org name.

### `Flight Manual` References:

Throughout the documentation there are many references to `Atom`'s official documentation, `https://flight-manual.atom.io`. At this time, our updated version of the documentation is not live, although it is in progress on our [docs](https://github.com/pulsar-edit/docs) repository. This means that encountering an instance of a `Flight Manual` link within the source can be handled in one of two ways.

1. If a link is found, **LEAVE AS IS** That is to say, do not modify the link. Allowing the link to still work properly even if it may be slightly outdated, or have improper rebranding as of now, at the very least it still gives the user some proper information to work off of.
2. Instead point the link to the correct identical location within the [docs](https://github.com/pulsar-edit/pulsar-edit.github.io) repository. Which is live, and all parts of this should be availible soon. For now point to the raw md file in the repo:

  - `https://flight-manual.atom.io/getting-started/sections/atom-basics/` => `https://github.com/pulsar-edit/docs/blob/main/docs/src/content/getting-started/sections/atom-basics.md`
  - `https://flight-manual.atom.io/getting-started/sections/atom-basics/#settings-and-preferences` => `https://github.com/pulsar-edit/docs/blob/main/docs/src/content/getting-started/sections/atom-basics.md#settings-and-preferences`

### 3rd Party References:

Throughout the documentation there are many references to other services, and websites that contain Atom branding. Such as links to Twitter pages, Azure Build Status, or other developers repositories that may contain Atom in the name.

When these are encountered we a few options:

1. Find the relevant equal service. Such as finding linkage to the `Atom` or `Atom-Community` Discord Server, could be updated to instead point to our Discord Server, with the branding changed to be relevant and accurate.
2. Leave as is. For example if no equal service/solution exists, or this points to another developers repository, we have no control on that repo, and as such can't expect that developer to rebrand their project, so we will have to leave as is. For example: 'Here is an archive tool for [Atom Packages]\(https://github.com/confused-Techie/AtomPackagesArchive).' - This tool was not created for Pulsar, so we couldn't honestly say the `[Pulsar Packages]()`, but in some cases changing that branding may be appropriate, but in all cases changing the link to `confused-Techie/PulsarPackagesArchive` wouldn't resolve, since we can't assume that 3rd party developer will change their branding. The cases were some rebranding may be appropriate here will depend on a case by case basis.
3. Sometimes a service should not be rebranded, and instead should be removed wholesale. This will depend on each circumstance, but can always be pointed out and asked about when encountered during the PR. Such as linkage to Azure Build status. There are no current plans to use Azure CI utilities in our project, so nothing here could be accurately rebranding. Meaning it may be the best choice to remove the whole section. Although in some cases finding a suitable alternative could be used, such as the case in CI Utilities, you could message our Discord Server, or check other issues and code for what's being used. Even though, at this time the results on which service to use are [inconclusive](https://github.com/orgs/pulsar-edit/discussions/4).

### Historical Data References:

The last important notes about rebranding are how to handle historical data. That is if something like the following is encountered during a rebrand: 'According to a [Twitter poll](https://twitter.com/daviwil/status/1006545552987701248) with about 1,600 responses, 50% of the votes chose "Atom Nightly"...' In this case it would be borderline dishonest to rebrand to '...votes chose "Pulsar Nightly"...', since this was never our poll. The poll results do not make that choice. That poll and section as a whole is the history of `Atom` **not** `Pulsar`. In the majority of cases of historical data, the best change to make is none. This specific case it would be best to make zero changes. Although that is not to say you still can't improve the documentation. In some cases it may be appropriate to 'rebrand' like so 'votes chose "Atom Nightly". And as such the successor Pulsar, will name its nightly release channel "Pulsar Nightly"'. We still effectively rebranded this section, while not trampling on the valid history of the Atom project. Since of course we don't want to frame Atom's history as ours, nor do we want to remove that history itself.

### Rebranding in Code:

When rebranding within code itself its important to note that some aspects **WILL NOT** receive any rebranding. The easiest example here is the global API within the project under the namespace `atom`. It would break the compatibility of countless parts of the core application, as well as **EVERY SINGLE PACKAGE** to rebrand this to `pulsar`, as such there are no plans at this time to rebrand. Now in the future, this global API may also be accessible as `pulsar` But it doesn't seem that it will be removed any time soon. Keeping to this concept, in the vast majority of cases attempting to rebrand within the code itself is not a good idea. The only time rebranding within source code itself is appropriate is when that code is creating strings that the end user will see.

When rebranding source code that creates or displays strings the end user will see, there has already been the creation of an internal Global API to aide in this process. That global API is accessible like so:

* `atom.branding.id` = "pulsar"
* `atom.branding.name` = "Pulsar"
* `atom.branding.urlWeb` = "https://atom.io" (Using this global API allows us to easily change the URL later on)
* `atom.branding.urlGH` = "https://github.com/pulsar-edit"

---

## Simplifying and Bringing up to Our Standards

While going through various repos we have there are a few things to do, that we currently consider best practice, or at the very least avoid a few issues that are currently present. All of these recommendations are aimed at simplifying our data going forward, and getting some of it to a universally agreed standards.

### Handle Template Files

Many repos contain their own templates for issues, prs and such. But the vast majority of these are copy pasted from others, and with these templates existing on `pulsar-edit/.github` this is no longer needed. Because if the template exists on this repo, it will still provide that template to all repos within the org that do themselves not have this template.

So when finding a template file along the lines of `PULL_REQUEST_TEMPLATE.md`, `BUG_REPORT.md` or the like, check if that template is available on [`pulsar-edit/.github` Issue Templates](https://github.com/pulsar-edit/.github/tree/main/.github/ISSUE_TEMPLATE) or [`pulsar-edit/.github` Pull Request Templates](https://github.com/pulsar-edit/.github/tree/main/.github/PULL_REQUEST_TEMPLATE).
If the template in your repo is available in one of the above, then its safe to delete it.

If your template is not in the above, it may be worth considering adding it, then deleting it from your repo.

### Contributing.md

Almost all repos contain a `CONTRIBUTING.md` file in their root. While it still may be advantageous to keep this, even if `pulsar-edit/.github` would provide this file, the only recommended change to make is the contents of the file itself, to ensure its always easy for others to find how to contribute, no matter the medium they are reviewing the codebase.

Currently `CONTRIBUTING.md` will likely contain:

```markdown
See the [Atom contributing guide](https://github.com/atom/atom/blob/master/CONTRIBUTING.md)
```

But this should always be changed to:

```markdown
[See how you can contribute](https://github.com/pulsar-edit/.github/blob/main/CONTRIBUTING.md)
```

---

## Decaffeination

A goal for the core of the editor is to 'decaffeinate' (to remove CoffeeScript and replace it with JavaScript). This goal comes largely from a group decision, considering that very few of our core team are familiar with or prefer CoffeeScript over JavaScript. Additionally a big push of `Pulsar` is to lower the barrier to entry for new contributors to be as low as possible. And using fewer languages assists in that goal.

As for how to successfully Decaffeinate the core of the editor (or any other repos/packages in use), a great template for successfully doing so can be seen on [`pulsar-edit/pulsar` PR #13](https://github.com/pulsar-edit/pulsar/pull/13).

### CoffeeScript 1.x or 2.x

What you must keep in mind is that when Atom was originally created, its authors mostly used tooling for CoffeeScript 1.x, whereas much of the latest tooling that's available is CoffeeScript 2.x based. This means that in order to decaffeinate successfully the tooling made for version CoffeeScript 1.x **MUST** be used, otherwise there may be JavaScript code produced that behaves significantly differently than the original CoffeeScript. (This could cause bugs and errors in the resulting code.)

Nevertheless, there may be some CoffeeScript 2.x code somewhere among Atom's codebase. In order to accurately determine which is being used within the repo you are working on, the best way to do so is to look at that repo's `package.json` `devDependencies` or sometimes it's `dependencies`.

Within those fields look for the `coffee-script` or `coffeescript` package to see if its versions are 1.x or 2.x.

In general it'll probably be 1.x tooling used.

### How to Decaffeinate

Now once the version is known, you have some options in the best tools to use:

1) Some of the members prefer using the official [`coffee` program](https://www.npmjs.com/package/coffeescript), with [1.12.7](https://www.npmjs.com/package/coffeescript/v/1.12.7) being recommended for CoffeeScript 1.x tooling and latest being fine for 2.x tooling.

(If using the official Coffee program, here is an example from one of the [scripts within `atom/apm`](https://github.com/atom/apm/blob/8538e0f82522be3793c947f7c63408124a4e8613/package.json#L23). You can run `coffee --compile --output lib src` to decaffeinate all .coffee files in the `src/` folder, and place them into `lib/` as .js files.)

2) Otherwise other members prefer [`decaffeinate/decaffeinate` Version 4.0.0](https://github.com/decaffeinate/decaffeinate/releases/tag/v4.0.0) for CoffeeScript 1.x tooling, and [`decaffeinate/decaffeinate` latest](https://github.com/decaffeinate/decaffeinate) for 2.x tooling.

After using either tool, while the JavaScript generated may not be the prettiest, it will at least be functional. From that functional JavaScript you can change any declarations of `var` to `let` or `const` as needed. Code improvement can always be taken further if needed, but this alone should be enough to successfully decaffeinate.

If you'd like to see some discussion about this change in how we decaffeinate, the initial problem was discovered during a [Discussion on Discord](https://discord.com/channels/992103415163396136/992103415163396139/1018628639404863550) and the solution was found on a [PR here](https://github.com/pulsar-edit/pulsar/pull/45) by a longtime member of both Atom and Pulsar.

### Confirming the Quality of Decaffeination

Once you've used a compiler to successfully decaffeinate the code, steps must be taken to ensure that the code output is of good quality and can properly be used, and maintained by further contributors. Some steps that can be taken are listed below.

* Replace [`var`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var) with [`const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const) and [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) if it's possible.
* Replace Nested [Ternary Operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator) with `if` statements.
* Remove `return` when it's not needed.
* Remove Result Arrays when they are not needed.
* Replace `for` loops with [`for-of` loops](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of).
* Use [Arrow Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) to write functions in a single line when it's possible.
* Remove unneeded `ref` variables.
* Remove [`do` blocks](https://devdocs.io/coffeescript~1/index#loops) and use `let` or `const` instead.

### Testing

After something has been decaffeinated, it's asked that you test as much as possible. And if testing is not always possible, all new PR's on `pulsar-edit/pulsar` receive GitHub Actions testing automatically.

---

## Bump Dependencies

This is the least defined process in this document. As its goals are very broad. The entire code base of the editor is severely outdated, one of the largest goals is to modernize this application. But to do this, requires that dependencies are up to date, or at the very least as up to date as possible. This means that a dependency has to be updated, anything that implements this then has to be modified for compatibility, and as a whole the editor will need to be manually tested, and automatically tested with available tests. While likely one of the more time consuming ways for a new contributor to assist, is an extremely valuable way to contribute to the healthy evolution of the editor.

---

## Conclusion

While there are several options to contribute **ANYTHING** that can be done is always appreciated. As always feel free to contact any of the developers on Discord or GitHub. We have also helpfully created teams that are ping-able for many common sections of the large codebase.

#### Discord Teams

* Admins (For Administrative Action on the Discord Server)
* Moderators (For Moderation Action on the Discord Server)
* Core (Developers dedicated to the Core of the Editor)
* Documentation (Developers dedicated to the Documentation of the editor, its READMEs, and other resources across the org)
* Backend (Developers dedicated to the Backend Server Services relevant to the editor)
* Developer (Developers dedicated to any other, or non-hyper specific part of the editor.)

#### GitHub Teams

* Core : `@pulsar-edit/core` Developers dedicated to the Core of the Editor.
* Documentation : `@pulsar-edit/documentation` Developers dedicated to the Documentation of the Editor, and Github Org as a whole.

---

But as always, thank **you** for contributing.
