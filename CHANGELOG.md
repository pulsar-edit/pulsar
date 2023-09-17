# Changelog

- Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- Format defined in [Pulsar Change Log](PENDING_APPROVAL)
- Project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]
- Added a new autocomplete API that does not uses prefixes and instead declares the range it'll replace (better LSP support)

## 1.109.0

- Fixed a race condition that could cause `autocomplete-plus` to ignore user input.
- Fixed the `about` package linking to release notes for Pulsar.
- Reduced the amount of network requests that `settings-view` creates.
- Fixed the icon used when registering Pulsar as a file handler on Windows.
- Removed the non-functional `autoUpdate` API from Pulsar, instead relying on the `pulsar-updater` package.
- Prevented warnings in the developer console from appearing when autocomplete suggestions are shown.
- Removed the last CoffeeScript code from Pulsar and core packages.
- Migrated the majority of our CI to GitHub Actions.

### Pulsar
- Added: about: Make the About page's CSS responsive for narrow panes [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/717)
- Added: [core & settings-view] Avoid network requests for bundled packages [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/711)
- Fixed: Remove @ from example to fix Documentation CI [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/719)
- Fixed: Cirrus: Don't update last good commit if CI skipped [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/716)
- Fixed: Tree-sitter running fixes (August edition) [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/677)
- Added: [status-bar & tree-view] Manual Decaf Source [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/707)
- Added: [core] Consolidate app detail logic into single module [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/705)
- Fixed: [about] Link release notes to `CHANGELOG.md` instead of tagged release of Pulsar [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/706)
- Removed: Remove `fs-plus` from atom-protocol-handler [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/170)
- Fixed: [core] Fix the icon used when registering Pulsar as a file handler in Windows [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/704)
- Added: Decaf Packages Spec [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/700)
- Removed: settings-view: Don't fix repository for core themes [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/702)
- Added: Cirrus: Skip builds if same commit was previously built [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/701)
- Fixed: CI: Tweak Cirrus build filter to allow tag pushes [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/699)
- Added: Automatically rename binaries in CI during Regular releases [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/675)
- Removed: remove repository fallback [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/264)
- Added: [meta] GitHub Actions: Don't sign macOS builds from forked repo PRs [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/698)
- Added: [meta] Ensure Actions can upload Rolling Releases [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/695)
- Added: [meta] Cleanup `push` trigger, add `workflow_dispatch` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/694)
- Added: Migrate most binary building to GitHub Actions [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/682)
- Added: [meta] Add `ignorePaths` to renovate config [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/691)
- Added: [language- && packages] Manual Decaf Spec Bundle [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/686)
- Fixed: fix links of packages readme [@asiloisad](https://github.com/pulsar-edit/pulsar/pull/689)
- Added: [meta] Add new and missing packages to renovate config [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/687)
- Added: Small Update to Docs [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/621)
- Fixed: [autocomplete-plus] Detect when menu state gets out of sync with DOM [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/680)
- Removed: Remove AutoUpdate functionality from Core [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/668)
- Bumped: Update autocomplete-html package [@renovate](https://github.com/pulsar-edit/pulsar/pull/688)
- Added: [core]: Make showing tab title in window title optional [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/671)
- Fixed: [autocomplete-plus] Suppress `marked` warnings [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/683)
- Added: [pulsar-updater] Don't notify if Pulsar is running via `yarn start` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/679)
- Bumped: bump actions/checkout to v3 [@casswedson](https://github.com/pulsar-edit/pulsar/pull/678)

## 1.108.0

- Restored ability for `less` files in packages to use inline JavaScript inside backticks.
- Fixed a syntax highlighting issue inside the `styleguide` package.
- Fixed an issue with rubygems timing out on ARM Linux workflow.
- Rewrote Tree-sitter scope predicates to use `#is?` and `#is-not?` where applicable.
- Ensure that project-specific setting overrides don't leak to the user's config file when the settings UI is visited.
- Added a feature in `markdown-preview` that adds support for Linguist, Chroma, Rouge, and HighlightJS for language identifiers in fenced code blocks.
- Fixed the `TextMate` `language-toml` grammar to properly support whitespace where-ever it may appear.
- Added a Tree-Sitter grammar for YAML files.
- Added a new core package `pulsar-updater` to help users update Pulsar.
- Added `ppm` and `ppm.cmd` binaries/launchers within ppm. This allows easier integration of correctly named binaries on more systems in more contexts (especially Windows). Existing `apm` and `apm.cmd` binaries/launchers are still there for the time being.
- Added a modern Tree-Sitter grammar for Markdown files.

### Pulsar
- Added: Add the Tree-Sitter Markdown grammar [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/659)
- Fixed: [pulsar-updater] Correct deb-get instructions ( + readme change) [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/669)
- Added: Tree-sitter running fixes [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/660)
- Added: Add `pulsar-updater` as a core bundled Package [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/656)
- Added: Manual Decaf Bundle (`autocomplete-atom-api`, `autoflow`, `deprecation-cop`) Source [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/664)
- Bumped: [Time Sensitive] Update Cirrus Encrypted token for GitHub Access [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/666)
- Added: [core]: Transforming Deprecated Math Usage - Support for Variables [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/653)
- Added: Add Tree-sitter grammar for YAML [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/634)
- Fixed: [language-toml] Add whitespace rule to values [@arite](https://github.com/pulsar-edit/pulsar/pull/646)
- Added: [markdown-preview]: Support for nested table objects in Yaml Frontmatter [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/629)
- Added: [markdown-preview]: Revamp Fenced Code Block Language Identifiers [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/622)
- Bumped: ppm: Update submodule to 49c8ced8f9552bb4aeb279130 [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/654)
- Fixed: [settings-view] Don't let project-specific settings pollute the UI [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/655)
- Added: [modern-tree-sitter] Overhaul Tree-sitter scope tests [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/652)
- Fixed: fix(arm): use rubygems from APT [@cat-master21](https://github.com/pulsar-edit/pulsar/pull/651)
- Added: [language-*]: Manual Spec Decaf (Part 1) [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/632)
- Fixed: [styleguide] Fix error when styleguide is shown... [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/648)
- Bumped: Bump `less-cache` to 2.0.1 [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/644)

### ppm

- Added: Add 'ppm' bins to complement existing 'apm' bins [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/80)
- Fixed: Replace "apm" by "ppm" in help messages. [@azuledu](https://github.com/pulsar-edit/ppm/pull/62)
- Bumped: Update OS, actions, node [@Spiker985](https://github.com/pulsar-edit/ppm/pull/57)

## 1.107.1

- Updated the `github` package to resolve incompatibility in Style Sheets against Less v4

### Pulsar

- Bumped: deps: Update github package to v0.36.17-pretranspiled [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/639)

### github

- Fixed: Fix Less Syntax [@confused-Techie](https://github.com/pulsar-edit/github/pull/34)

## 1.107.0

- Fixed a number of issues with the experimental modern Tree-sitter grammar mode
- Pulsar can now be added to the PATH on Windows, via the "System" pane within Settings View.
- Bumped `less-cache` to `v2.0.0` which uses `less@4.1.3`. This adds many new features of Less, while causing breaking changes to existing Less StyleSheets. Read more about these changes [here](https://github.com/pulsar-edit/less-cache/releases/tag/v2.0.0). Pulsar will attempt to automatically repair any breaking changes in any package style sheets, while emitting deprecations.
- Fixed a bug that would render files unable to be clicked with sticky headers enabled on One-Dark and One-Light themes.
- Added a Modern Tree-Sitter TOML Grammar.
- Added a new API endpoint within Pulsar of `atom.versionSatisifes()` to allow packages to safely check the version of Pulsar, instead of having to do so themselves.
- An issue in a downstream dependency has been resolved that improperly flagged Pulsar as malicious.

### Pulsar
- Added: Improved Windows Install (`PATH`, `ATOM_HOME`, `InstallLocation`) [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/604)
- Fixed: Running PR for Tree-Sitter fixes [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/555)
- Added: [autocomplete-css]: Manual Decaf of Source [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/631)
- Fixed: [welcome]: Ensure Changelog Always Shows if enabled, and version hasn't been dismissed [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/607)
- Bumped: [autocomplete-plus] Maintenance - Deps bumps, remove CoffeeScript files [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/630)
- Fixed: Fix tree-view sticky headers of one-dark & one-light themes [@asiloisad](https://github.com/pulsar-edit/pulsar/pull/599)
- Fixed: [spell-check]: Remove usage of reserved word [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/620)
- Added: [core]: Implement API on `atom.` to compare Pulsar Versions [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/588)
- Added: [settings-view]: Manual Decaf (source) [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/558)
- Bumped: [core]: Bump `less-cache` to `v2.0.0` Upgrades `less` to `4.1.3` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/611)
- Added: [core]: Bundle `spell-check` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/614)
- Bumped: Update dependency semver to v7.5.2 [SECURITY] [@renovate](https://github.com/pulsar-edit/pulsar/pull/609)
- Added: [modern-tree-sitter] Add TOML tree-sitter grammar [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/617)
- Fixed: [language-toml]: Allow spaces within Array [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/610)
- Fixed: Pin `es5-ext` to `pulsar-edit/es5-ext` removing code flagged as malicious [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/608)
- Bumped: [git-diff] Bump all Deps [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/603)
- Bumped: Update dependency semver [SECURITY] [@renovate](https://github.com/pulsar-edit/pulsar/pull/605)
- Fixed: [autocomplete-css] Get tests passing for new CSS tree-sitter grammar [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/601)
- Bumped: [dalek] Bump dependencies to latest, fix links [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/602)
- Bumped: Update dependency marked to v5.0.3 [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/568)

### less-cache
- Bumped: Bump `1.1.1` => `2.0.0` [@confused-Techie](https://github.com/pulsar-edit/less-cache/pull/5)
- Bumped: Bump `less` `3.12.2` => `4.1.3` [@confused-Techie](https://github.com/pulsar-edit/less-cache/pull/4)
- Added: Repository Cleanup + CoffeeScript tool Removal (Depends on #2) [@confused-Techie](https://github.com/pulsar-edit/less-cache/pull/3)
- Added: Manual decaf of source files [@confused-Techie](https://github.com/pulsar-edit/less-cache/pull/2)
- Added: Implement Repo Tests [@confused-Techie](https://github.com/pulsar-edit/less-cache/pull/1)

## 1.106.0

- Fixed bug that happens on some systems when trying to launch Pulsar using the Cinnamon desktop environment
- Added a modern implementation of Tree-sitter grammars behind an experimental flag. Enable the “Use Modern Tree-Sitter Implementation” in the Core settings to try it out
- Bugfix: fixed Clojure indentation on tree-sitter
- Improved the Clojure language support by migrating it to tree-sitter and support block comments, quoting, and other advanced features on modern tree-sitter implementation
- Fixed a bug that could cause images to not appear the first time opening them
- `autocomplete-css` Completions are now sorted in a way that may match what users expect
- Added a "Log Out" menu item for the `github` package

### Pulsar
- Updated: deps: Bump github to v0.36.16-pretranspiled [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/592)
- Removed: Mostly remove `request` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/474)
- Fixed: Fix: Image doesn't appear at first open [@asiloisad](https://github.com/pulsar-edit/pulsar/pull/579)
- Removed: Remove specific cinnamon condition [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/563)
- Fixed: Fix of Clojure's indentation rules by removing query file [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/584)
- Fixed: Update links in settings page [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/570)
- Added: [autocomplete-css] Sort `completions.json` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/552)
- Fixed: Fixes on "comment block" for Clojure grammar [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/573)
- Added: Hardcode NSIS GUID [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/566)
- Fixed: Make yarn sane [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/567)
- Fixed: Huge improvement on Clojure highlighting [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/553)
- Removed: Removed unused_require method [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/561)
- Bumped: Update dependency underscore to 1.12.1 [SECURITY] [@renovate](https://github.com/pulsar-edit/pulsar/pull/504)
- Added: Add modern tree-sitter support behind an experimental flag [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/472)
- Added: Make CHANGELOG easier to merge and update dompurify [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/537)
- Added: js operators [@icecream17](https://github.com/pulsar-edit/pulsar/pull/79)
- Bumped: Update dependency postcss to v8.2.13 [SECURITY] [@renovate](https://github.com/pulsar-edit/pulsar/pull/514)

### github
- Added: Add logout menu option [@Daeraxa](https://github.com/pulsar-edit/github/pull/27)
- Updated: ci: Bump action dependencies [@Spiker985](https://github.com/pulsar-edit/github/pull/19)

## 1.105.0

- Rebranded notifications, using our backend to find new versions of package,
and our github repository to find issues on Pulsar. Also fixed the "view issue"
and "create issue" buttons that were not working
- Bumped to latest version of `second-mate`, fixing a memory usage issue in `vscode-oniguruma`
- Removed a cache for native modules - fix bugs where an user rebuilds a native
module outside of Pulsar, but Pulsar refuses to load anyway
- Removed `nslog` dependency
- Fixed an error where the GitHub package tried to interact with a diff view after it was closed
- Fixed RPM installation failure when Atom was installed on the same machine
- Added a new set of Package `activationHooks`, `...:uri-opened` lets a package activate when any URI is opened within Pulsar, and `...:file-name-opened` lets a package activate when any specific filename is opened within Pulsar.

### Pulsar
- Added: Add new `...:uri-opened` && `...:file-name-opened` Package Activation Hook [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/518)
- Fixed: Properly localize Download/Stargazer Counts within `settings-view` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/526)
- Added: Add bookmarks service for consumption by other packages [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/525)
- Added: Bundle notifications [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/529)
- Fixed: Fix Ripgrep download issues in CirrusCI [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/530)
- Removed: Revert Incorrect Commit [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/528)
- Fixed: Making CI green, hopefully [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/523)
- Bumped: Bump `second-mate` to 96866771 [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/524)
- Removed: Remove cache of incompatible native packages [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/493)
- Added: Simplify and bundle fuzzy-finder [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/515)
- Added: Bundle find and replace [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/517)
- Added: Bundle tree view [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/513)
- Added: Bundle `autocomplete-atom-api` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/476)
- Added: Add FPM option to stop rpm buildid clash [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/505)
- Bumped: chore(deps): update dependency minimist [security] [@renovate](https://github.com/pulsar-edit/pulsar/pull/502)
- Fixed: Disable Failing Tests [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/477)
- Bumped: chore(deps): update dependency ajv to 6.12.3 [security] [@renovate](https://github.com/pulsar-edit/pulsar/pull/501)
- Bumped: chore(deps): update dependency async to 3.2.2 [security] [@renovate](https://github.com/pulsar-edit/pulsar/pull/495)
- Added: Add "icon only" class to settings view icon [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/456)
- Bumped: chore(deps): update dependency minimatch [security] [@renovate](https://github.com/pulsar-edit/pulsar/pull/496)
 - Removed: Remove `nslog` dependency [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/494)
- Added: Setup Renovate [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/469)
- Fixed: Don't mark diff ranges on a destroyed buffer [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/481)
- Added: First Architectural Design Records [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/480)
- Bumped: use pular's `typscript-simple` fork, which bumps `typescript` to 5.0.3 [@Meadowsys](https://github.com/pulsar-edit/pulsar/pull/458)
- Added: CI: cache and restore dependencies, plus skip rebuilding all over the place (saves a lot of time) [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/492)

### notifications
- Fixed: Cleanup and rename [@Sertonix](https://github.com/pulsar-edit/notifications/pull/1)
- Added: reject promise with Error instance [@Sertonix](https://github.com/pulsar-edit/notifications/pull/2)
- Added: Add our Testing Action [@confused-Techie](https://github.com/pulsar-edit/notifications/pull/3)
- Fixed: Change atom strings to pulsar [@mdibella-dev](https://github.com/pulsar-edit/notifications/pull/4)
- Bumped: Bump to v3.2 of action-pulsar-dependency [@confused-Techie](https://github.com/pulsar-edit/notifications/pull/5)
- Fixed: Fix all Tests [@confused-Techie](https://github.com/pulsar-edit/notifications/pull/6)

## 1.104.0

- The settings-view package now lists a package’s snippets more accurately
- Fixed some issues with some packages with WebComponents v0 (tablr package
should work now) by internalizing and patching document-register-element
- Migrated away from `node-oniguruma` in favor of `vscode-oniguruma` (WASM
version). This fixes issues with Electron 21
- Ensured new WASM packages will work on Apple Silicon
- Completions for HTML will now be as bleeding edge as possible.

### Pulsar
- Added: `settings-view` Support for Badges [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/451)
- Removed: remove weird duplicate accented fixture file (hopefully?) [@Meadowsys](https://github.com/pulsar-edit/pulsar/pull/488)
- Added: Add optional entitlements monkey-patch [@confused-Tecie](https://github.com/pulsar-edit/pulsar/pull/483)
- Added: Decaf `wrap-guide` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/443)
- Added: Additional Bundling of Core Packages [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/424)
- Added: add allow-jit entitlement (fixes Apple Silicon builds) [@Meadowsys](https://github.com/pulsar-edit/pulsar/pull/454)
- Removed: Revert "Create i18n API" [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/471)
- Added: Build first, and test later [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/463)
- Update: [settings-view] Update package snippets view to reflect new features [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/406)
- Added: Create i18n API [@Meadowsys](https://github.com/pulsar-edit/pulsar/pull/446)
- Added: Add Automated updating of `autocomplete-html` `completions.json` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/405)
- Fixed: docs: fix markdown links in packages README [@oakmac](https://github.com/pulsar-edit/pulsar/pull/450)
- Fixed: Patch document register element [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/438)
- Added: Using "second-mate" [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/435)
- Fixed: Fix spacing of PHP's "for ..." snippet [@machitgarha](https://github.com/pulsar-edit/pulsar/pull/440)
- Update: Update resources metadata [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/414)
- Fixed: Cirrus: Windows: install ppm deps with Yarn [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/434)
- Added: made cirrus build scripts consistent [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/239)
- Update: Update package.json author [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/432)

### second-mate
- Added: Migrate to vscode-oniguruma [@mauricioszabo](https://github.com/pulsar-edit/second-mate/pull/1)

### autosave
- Removed: removed fs-plus dependency [@Sertonix](https://github.com/pulsar-edit/autosave/pull/2)
- Update: Cleanup and rename [@Sertonix](https://github.com/pulsar-edit/autosave/pull/1)

### bracket-matcher
- Fixed: Fixing test that need to run locally [@mauricioszabo](https://github.com/pulsar-edit/bracket-matcher/pull/3)
- Update: cleanup .md and rename repo url [@Sertonix](https://github.com/pulsar-edit/bracket-matcher/pull/2)
- Update: Rename A[a]tom -> P[p]ulsar [@Spiker985](https://github.com/pulsar-edit/bracket-matcher/pull/1)

### timecop
- Update: cleanup and rename [@Sertonix](https://github.com/pulsar-edit/timecop/pull/1)

### keybinding-resolver
- Update: Cleanup and rename [@Sertonix](https://github.com/pulsar-edit/keybinding-resolver/pull/1)

## 1.103.0

- Added a new feature to Search for Pulsar's settings
- Updated the completions provided by `autocomplete-css` to be as bleeding edge as possible.
- Updated the instructions and look of the login flow for the `github` package.
- Snippet transformations no longer have an implied global flag, bringing them into compatibility with snippets in most other editors.
- Snippets can now be given command names instead of tab triggers, and thus can now be assigned to key shortcuts in `keymap.cson`.

### Pulsar
- Added: feature: Implement Search Settings Ability [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/416)
- Added: Show Settings Icon in Status Bar [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/421)
- Added: Add Automated updated of `autocomplete-css` `completions.json` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/398)
- Bumped: ppm: Update submodule to 9af239277180f2a9ee9e86714 [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/403)
- Bumped: ppm: Update submodule to 915cbf6e5f9ea1141ef5dcaf8 [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/418)
- Bumped: deps: Bump github to v0.36.15-pretranspiled [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/415)
- Added: actually cache based on sha [@Meadowsys](https://github.com/pulsar-edit/pulsar/pull/412)
- Bumped: Bump `snippets` to bb00f9 [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/408)
- Added: [skip-ci] Small Readme Touchup [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/404)
- Added: json language - add .har extension [@wesinator](https://github.com/pulsar-edit/pulsar/pull/396)
- Added: Bundle `markdown-preview`, `styleguide`, `wrap-guide` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/374)
- Added: Add GitHub Token to Doc CI [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/400)
- Added: Add Setup Node to Package Tests [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/399)
- Added: feat: add dev.pulsar_edit.Pulsar.metainfo.xml [@cat-master21](https://github.com/pulsar-edit/pulsar/pull/380)

### Snippets
- Added: Add `command` property that registers a command name for a snippet [@savetheclocktower](https://github.com/pulsar-edit/snippets/pull/10)
- Removed: Remove implicit `g` flag from snippet transformations [@savetheclocktower](https://github.com/pulsar-edit/snippets/pull/7)
- Fixed: Fix failing specs [@mauricioszabo](https://github.com/pulsar-edit/snippets/pull/6)
- Added: cleanup and rename [@Sertonix](https://github.com/pulsar-edit/snippets/pull/5)

### Github
- Added: rebrand git-tab-view [@icecream17](https://github.com/pulsar-edit/github/pull/17)
- Added: lib: Update login instructions for PATs, not OAuth [@DeeDeeG](https://github.com/pulsar-edit/github/pull/15)

### PPM
- Fixed: src: Update default Pulsar install paths [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/49)
- Bumped: deps: Upgrade npm to 6.14.18 [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/53)
- Fixed: Fix installing with yarn on Windows [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/58)
- Fixed: Fix inability to notice newer versions of git-installed packages [@savetheclocktower](https://github.com/pulsar-edit/ppm/pull/59)
- Added: meta: Actually sync yarn.lock [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/60)

## 1.102.0

- Fixed a bug where `pulsar` on Windows could never trigger
- Fixed `github` package shelling out to `git` on macOS
- Fixed minor bugs found during fixes to tests
- Improved our testing infrastructure to aide in finding and fixing further bugs
- Updated many dependencies of Pulsar and its core packages
- New Pulsar Icon on macOS
- Selected text is styled by default
- Restored `right-clicked` CSS class on tags
- Fixed syntax highlighting on C++
- Updated JavaScript snippets to modern ES6 syntax
- PPM no longer assumes `master` for git branches

### Pulsar
- Added: implement signing and notarizing for macOS, PR #4 lol [@Meadowsys](https://github.com/pulsar-edit/pulsar/pull/387)
- Fixed: Pin `python` brew installation to `3.10` during MacOS Intel Cirrus Build [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/384)
- Update: Bump `ppm` to `a46537c0b7f0eaaef5404ef88003951fdc988c65` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/383)
- Added: Add new macOS icon [@mdibella-dev](https://github.com/pulsar-edit/pulsar/pull/372)
- Fixed: type $ as # [@Meadowsys](https://github.com/pulsar-edit/pulsar/pull/378)
- Update: deps: Update github to v0.36.14-pretranspiled-take-2 [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/375)
- Added: add style to selected text by default [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/238)
- Added: Set Max Concurrent Package Tests [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/376)
- Fixed: c++ fixes [@icecream17](https://github.com/pulsar-edit/pulsar/pull/369)
- Update: deps: Update github to v0.36.14-pretranspiled [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/373)
- Update `coffeescript` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/361)
- Updated: Misc Dependency Updates [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/362)
- Added: Bundle `autocomplete-plus` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/358)
- Fixed: Add LICENSE.md to extra resources (resourcesPath) [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/354)
- Fixed: Get Windows `pulsar` Working [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/340)
- Fixed: Restore `right-clicked` class on a right-clicked tab [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/368)
- Updated: ppm: Update submodule to commit 4645ba2905747897b0 [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/371)
- Added: Machine decaf tabs spec [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/367)
- Added: Manually Decaf `tabs` package Specs [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/357)
- Fixed: Uncomment and fix a settings-view package test [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/366)
- Added: Decaf Changes from Manual and Machine Decaf to Main [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/356)
- Added: Manual decafe tabs [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/352)
- Added: Organize failing tests [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/307)
- Fixed: autocomplete-snippets: Fix repo URL [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/341)
- Updated: update apm message to pulsar -p [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/337)
- Fixed: Replace incorrect spellings of 'macOS' with the correct one [@mdibella-dev](https://github.com/pulsar-edit/pulsar/pull/336)
- Changed: use `let` and `const` in js snippets [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/326)
- Fixed: Fix URI to correct address [@mdibella-dev](https://github.com/pulsar-edit/pulsar/pull/335)
- Updated: update copyright year (2023) [@icecream17](https://github.com/pulsar-edit/pulsar/pull/332)

### ppm
- Fixed: fix: Don't assume `master` when checking git packages for upgrades [@savetheclocktower](https://github.com/pulsar-edit/ppm/pull/56)
- Fixed: meta: Normalize package.json and lockfile line endings [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/54)
- Update: spec: Fixtures Node v10.20.1 --> Electron v12.2.3 [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/52)
- Fixed: Fix .com links, pulsar rebranding and rebranding readme [@Daeraxa](https://github.com/pulsar-edit/ppm/pull/48)

### github
- Fixed: lib: Rebrand getAtomAppName() function (fix shelling out to `git` on macOS) [@DeeDeeG](https://github.com/pulsar-edit/github/pull/13)
- Fixed: meta: Revert "main" to "./lib/index", no dist (fix package on `master` branch) [@DeeDeeG](https://github.com/pulsar-edit/github/pull/12)

## 1.101.0-beta

- Fixed a bug where macOS menus like "Open" don't do anything
- Fixed a bug where macOS wouldn't open files by dragging them onto the dock.
- Fixed a bug where devtools won't open (https://github.com/pulsar-edit/pulsar/issues/260)
- Fixed a bug where the editor refused to open with the message "GPU process
isn't usable. Goodbye" (https://github.com/pulsar-edit/pulsar/issues/233)
- Fixed logo artifacts on Linux
- Fixed Windows Taskbar Icon being 'Cut in Half'
- Fixed commands like `--version`, `--package` or `--help` did not show outputs
- Fixed additional flags not being sent to `--package`
- Small improvement on the binary size
- Fixed "install command line tools" on Mac and Windows
- Cached queries for featured packages (featured packages will load faster, and
fewer errors on the settings-view regarding package info)
- Added warning when `settings-view` is disabled, describing how to re-enable it

### Pulsar
- Added: script: Clean up `pulsar` and `ppm` on uninstall [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/297)
- Added: increase search query delay [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/289)
- Fixed: update `packages/README.md` [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/317)
- Fixed: Fix Windows Icon being cut in half [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/318)
- Removed: remove unused json [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/309)
- Added: add ignored `package-lock.json` to packages [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/308)
- Rebrand: Rebrand AppUserModelID - Ensure Pulsar is separated as its own App Icon on Windows [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/315)
- Removed: remove fs-plus from image-view package [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/305)
- Added: Additional Bundling of Core Packages [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/314)
- Fixed: Resolve some `about` package tests (6 Resolved Tests) [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/310)
- Fixed: Fix Package Test Cache Issue [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/302)
- Fixed: Resolve all Tests within `language-html` (Resolves 2 Failing Tests) [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/300)
- Fixed: Resolve all Tests within `language-javascript` (Resolves 24 Failing Tests) [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/299)
- Fixed: Resolve 40 Failing `image-view` Tests [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/293)
- Added: Added changelog entries that we missed [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/292)
- Removed: meta: Delete preinstall script from package.json [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/296)
- Added: Improve macOS Builds [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/280)
- Fixed: Fix `archive-view` [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/294)
- Added: Improved Windows Builds [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/279)
- Added: More Bundles [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/290)
- Fixed: Fix macOS open without window [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/291)
- Removed: delete workflow from language-java [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/285)
- Removed: Remove handlers for opening things on Mac [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/288)
- Rebrand: Rebranding and relinking to new site [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/282)
- Added: script: symlink ppm in post-install.sh (for .deb and .rpm packages) [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/273)
- Added: Add --no-sandbox to start script [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/276)
- Added: exclude directories from build [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/265)
- Added: add warning when settings-view is disabled [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/243)
- Fixed: Fix typo [@snowcatridge10](https://github.com/pulsar-edit/pulsar/pull/267)
- Fixed: Fix install on packaged code [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/269)
- Fixed: Fix Logo weirdness [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/271)
- Fixed: Fix installing shell commands to path (macOS) [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/263)
- Fixed: 🍎 Fix wrong app name resolution in pulsar.sh on Mac [@soupertonic](https://github.com/pulsar-edit/pulsar/pull/252)
- Fixed: Postinstall error with rm usr/bin/pulsar [@Spiker985](https://github.com/pulsar-edit/pulsar/pull/228)
- Added: Made changes to the main.js file. [@CatPerson136](https://github.com/pulsar-edit/pulsar/pull/232)
- Added: Add `--no-sandbox` to Linux Launch [@confused-Techie](https://github.com/pulsar-edit/pulsar/pull/262)
- Removed: removed unused files [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/219)
- Rebrand: rebrand package publish domain [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/245)
- Removed: remove metrics code from welcome package [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/244)
- Fixed: Deep cache for settings view [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/250)
- Fixed: fix syntax error in `packages/README.md` [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/248)
- Removed: remove package.json dependencies [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/169)
- Added: `underscore-plus` to dependencies [@Sertonix](https://github.com/pulsar-edit/pulsar/pull/218)

### ppm
- Added: Convert body params to query params [@Spiker985](https://github.com/pulsar-edit/ppm/pull/47)
- Fixed: src: Update Electron header download URL [@DeeDeeG](https://github.com/pulsar-edit/ppm/pull/43)

## v1.100.0-beta

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
- Bumped:   `tree-sitter` NA -> 0.20.0 [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/14)
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
