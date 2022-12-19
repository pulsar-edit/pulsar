# Changelog

- Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- Format defined in [Pulsar Change Log](PENDING_APPROVAL)
- Project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)


## [Unreleased]

- Bump to Electron 12 and Node 14
- Added a rebranding API
- Removed experimental file watchers on the editor
- Ability to install packages from git repositories
- New Pulsar Package Repository Backend
- Better error messages when installing a package fails
- Config watching fixes
- Bump tree-sitter to 0.20.1 and all grammars to their recent versions
- Native support for Apple Silicon and ARM Linux
- Removed Benchmark Startup Mode
- Removed all telemetry from Core Editor
- New Pulsar Website
- New Test Runner to Improve Testing
- Added Apple Silicon support to `github` Package v0.36.13

### Pulsar
- Added:    Incorporate settings-view to core [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/220)
- Added:    Bundle `autocomplete-css` && `autocomplete-html` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/212)
- Added:    add or update `packages/*/package-lock.json` [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/209)
- Fixed:    Organize our Exclusions/Inclusions [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/208)
- Added:    Bundle `package-generator` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/207)
- Fixed:    meta: Don't exclude 'loophole' or 'pegjs' packages [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/206)
- Fixed:    Fix `dugite` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/201)
- Bumped:   ppm: Update ppm submodule (new Electron headers download URL) [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/198)
- Removed:  Revert "Merge pull request #184 from pulsar-edit/bump-autocomplete-plus" [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/196)
- Bumped:   Bump GitHub package [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/186)
- Fixed:    CI (Windows): Use npm (not yarn) to install ppm [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/185)
- Bumped:   Bumped `autocomplete-plus` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/184)
- Added:    Adding test runner missing files [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/183)
- Fixed:    fix about package test [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/180)
- Added:    Add tar.gz target to electron-builder [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/178)
- Fixed:    Cleanup/standardize pulsar.sh [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/175)
- Fixed:    Update LICENSE.md [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/171)
- Removed:  remove old scripts [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/168)
- Fixed:    Fix Codacy Ignore [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/167)
- Added:    New ChangeLog Format [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/166)
- Fixed:    shorten task description if too long [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/163)
- Fixed:    Improve Package Tests [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/161)
- Removed:  Metric docs from `welcome` [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/159)
- Fixed:    PostInstall of `ppm` [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/153)
- Fixed:    Unmerged Menus ignoring separators [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/151)
- Removed:  `mkdirp` [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/150)
- Fixed:    `--package` exiting incorrectly [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/149)
- Bumped:   `ppm` submodule [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/144)
- Fixed:    undefined `nsole` [@jonian](https://github.com/pulsar-edit/pulsar/pull/142)
- Fixed:    Git tab in Binaries [@benonymus](https://github.com/pulsar-edit/pulsar/pull/140)
- Fixed:    `yarn.lock` versions [@jonian](https://github.com/pulsar-edit/pulsar/pull/139)
- Added:    `dist` & `binaries` to `gitignore` [@jonain](https://github.com/pulsar-edit/pulsar/pull/138)
- Bumped:   `ppm` submodule to allow Git Package Install [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/131)
- Bumped:   `settings-view` 0.261.9 -> 0.261.10 [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/130)
- Removed:  Unused code fragments from build scripts [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/128)
- Added:    Ability to run `ppm` from `pulsar` CLI [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/125)
- Fixed:    base16 URL to use WayBack Machine [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/121)
- Removed:  `fs-plus` from `exception-reporting` [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/118)
- Removed:  Benchmark Startup Mode Part 2 [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/115)
- Removed:  Unused scripts [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/114)
- Bumped:   `background-tips` 0.28.0 -> 0.28.1 [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/111)
- Removed:  Tooling bloat [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/110)
- Bumped:   `snippets` NA -> 1.6.1 [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/107)
- Removed:  Benchmark Startup mode [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/105)
- Added:    Binaries for Intel Mac & ARM Linux [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/101)
- Added:    `yarn dist` accepts arguments [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/97)
- Fixed:    Load core packages `README.md` [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/96)
- Fixed:    Unlock terminal on Linux [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/82)
- Added:    Aliases to workflow for link generation [@kaosine](https://github.com/pulsar-edit/pulsar/pull/78)
- Fixed:    Hooked `NSFW` directly [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/77)
- Bumped:   `settings-view` 0.261.8 -> 0.261.9 [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/72)
- Bumped:   `.nvmrc` 12.18 -> 16 [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/71)
- Bumped:   `ppm` submodule for new backend [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/68)
- Removed:  Experimental and internal watchers [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/67)
- Fixed:    Improvements for windows binaries [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/66)
- Fixed:    Improvements for binary building [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/63)
- Bumped:   `async` 3.2.0 -> 3.2.4 [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/59)
- Removed:  Mystery/Ghost Submodule [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/51)
- Removed:  Telemetry and Remote Crash Reports [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/40)
- Added:    Bundled `language-c` into the editor [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/33)
- Bumped:   `electron` 11.5.0 -> 12.2.3 [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/28)
- Fixed:    `yarn install` due to syntax error [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/16)
- Added:    Bundled most language grammars into the editor [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/14)
- Bumped:   `autocomplete-html` 0.8.8 -> 0.8.9 [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/14)
- Bumped:   `tree-sitter` NA -> 0.20.0 [@mauricioszaba](https://github.com/pulsar-edit/pulsar/pull/14)
- Added:    Branding Config on Global Atom API [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/7)
- Added:    `yarn` as method to build editor. [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/6)
- Bumped:   `fs-admin` 0.15.0 -> 0.19.0 [@kaosine](https://github.com/pulsar-edit/pulsar/pull/4)
- Bumped:   `text-buffer` 13.18.5 -> 13.18.6 [@kaosine](https://github.com/pulsar-edit/pulsar/pull/4)
- Decaffeinate: Numerous efforts from many contributors to decaffeinate the editor:
  * [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/112)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/45)
  * [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/29)
  * [@fabianfiorotto](https://github.com/pulsar-edit/pulsar/pull/13)
- Rebrand: Numerous efforts from many contributors to rebrand the editor:
  * [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/190)
  * [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/173)
  * [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/172)
  * [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/156)
  * [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/145)
  * [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/136)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/126)
  * [@ElectronicsArchiver](https://github.com/pulsar-edit/pulsar/pull/123)
  * [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/122)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/120)
  * [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/103)
  * [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/83)
  * [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/81)
  * [@kaosine](https://github.com/pulsar-edit/pulsar/pull/65)
  * [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/58)
  * [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/54)
  * [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/22)
  * [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/17)
  * [@softcode589](https://github.com/pulsar-edit/pulsar/pull/11)
  * [@LandarXT](https://github.com/pulsar-edit/pulsar/pull/10)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/8)
- Tests: Numerous efforts from many contributors to improve our tests:
  * [@icecream17](https://github.com/pulsar-edit/pulsar/pull/152)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/141)
  * [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/116)
  * [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/109)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/70)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/50)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/48)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/46)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/42)
  * [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/41)
  * [@fabianfiorotto](https://github.com/pulsar-edit/pulsar/pull/36)
  * [@fabianfiorotto](https://github.com/pulsar-edit/pulsar/pull/35)
  * [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/18)

### ppm
- Fixed:    ppm PostInstall [@mauricioszabo](https://github.com/pulsar-edit/ppm/pull/41)
- Added:    Better `help` command display [@mauricioszabo](https://github.com/pulsar-edit/ppm/pull/40)
- Fixed:    Empty Featured Packages [@jonian](https://github.com/pulsar-edit/ppm/pull/38)
- Fixed:    Use ppm as basename in `getResourcePath` [@jonain](https://github.com/pulsar-edit/ppm/pull/36)
- Fixed:    Installation from Git [@mauricioszabo](https://github.com/pulsar-edit/ppm/pull/34)
- Added:    Ability to define tag to install [@mauricioszabo](https://github.com/pulsar-edit/ppm/pull/13)
- Added:    Our new Pulsar Package Repository Backend [@confused-Techie](https://github.com/pulsar-edit/ppm/pull/5)
- Bumped:   `electron` to 12 [@mauricioszabo](https://github.com/pulsar-edit/ppm/pull/2)
- Rebrand: Numerous efforts from many contributors to rebrand ppm:
  * [@Sertonix](https://github.com/pulsar-edit/ppm/pull/12)
  * [@softcode589](https://github.com/pulsar-edit/ppm/pull/7)
  * [@mauricioszabo](https://github.com/pulsar-edit/ppm/pull/6)
- Tests: Numerous efforts from many contributors to improve our tests:
  * [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/39)

### autocomplete-html
- Fixed:    Finding the proper Node version [@mauricioszabo](https://github.com/pulsar-edit/autocomplete-html/pull/1)  

### settings-view
- Added:    Remember Scroll Position [@jonian](https://github.com/pulsar-edit/settings-view/pull/12)
- Removed:  Support for deprecated packages [@Sertonix](https://github.com/pulsar-edit/settings-view/pull/6)
- Added:    Better errors when search fails [@mauricioszabo](https://github.com/pulsar-edit/settings-view/pull/2)
- Rebrand: Numerous efforts from many contributors to rebrand settings-view:
  * [@mauricioszabo](https://github.com/pulsar-edit/settings-view/pull/7)
  * [@softcode589](https://github.com/pulsar-edit/settings-view/pull/3)
  * [@mauricioszabo](https://github.com/pulsar-edit/settings-view/pull/1)
- Tests: Numerous efforts from many contributors to improve our tests:
  * [@confused-Techie](https://github.com/pulsar-edit/settings-view/pull/10)

### snippets
- Added:    Proper Testing [@confused-Techie](https://github.com/pulsar-edit/snippets/pull/4)
- Removed:  `fs-plus` [@Sertonix](https://github.com/pulsar-edit/snippets/pull/2)
- Fixed:    Fix open Snippets URI [@Sertonix](https://github.com/pulsar-edit/snippets/pull/1)

### background-tips
- Bumped:   `background-tips` 0.28.0 -> 0.28.1 [@confused-Techie](https://github.com/pulsar-edit/background-tips/pull/4)
- Rebrand: Numerous efforts from many contributors to rebrand background-tips:
  * [@Sertonix](https://github.com/pulsar-edit/background-tips/pull/5)
  * [@Sertonix](https://github.com/pulsar-edit/background-tips/pull/2)
  * [@Sertonix](https://github.com/pulsar-edit/background-tips/pull/1)


## Atom v1.6.0

- See https://atom.io/releases
