# Core Packages

This folder contains core packages that are bundled with Pulsar releases. Not all core packages are kept here; please
see the table below for the location of every core package.

> **NOTE:** There is an ongoing effort to migrate more Atom packages from their individual repositories to this folder.
See [RFC 003](https://github.com/atom/atom/blob/master/docs/rfcs/003-consolidate-core-packages.md) for more details.

| Package | Where to find it | Migration issue |
|---------|------------------|-----------------|
| **about** | [`./about`](./about) | |
| **atom-dark-syntax** | [`./atom-dark-syntax`](./atom-dark-syntax) | |
| **atom-dark-ui** | [`./atom-dark-ui`](./atom-dark-ui) | |
| **atom-light-syntax** | [`./atom-light-syntax`](./atom-light-syntax) | |
| **atom-light-ui** | [`./atom-light-ui`](./atom-light-ui) | |
| **autocomplete-atom-api** | [`atom/autocomplete-atom-api`][autocomplete-atom-api] |  |
| **autocomplete-css** | [`atom/autocomplete-css`][autocomplete-css] |  |
| **autocomplete-html** | [`atom/autocomplete-html`][autocomplete-html] |  |
| **autocomplete-plus** | [`atom/autocomplete-plus`][autocomplete-plus] |  |
| **autocomplete-snippets** | [`atom/autocomplete-snippets`][autocomplete-snippets] |  |
| **autoflow** | [`./autoflow`](./autoflow) | |
| **autosave** | [`atom/autosave`][autosave] | [#17834](https://github.com/atom/atom/issues/17834) |
| **background-tips** | [`atom/background-tips`][background-tips] | [#17835](https://github.com/atom/atom/issues/17835) |
| **base16-tomorrow-dark-theme** | [`./base16-tomorrow-dark-theme`](./base16-tomorrow-dark-theme) | |
| **base16-tomorrow-light-theme** | [`./base16-tomorrow-light-theme`](./base16-tomorrow-light-theme) | |
| **bookmarks** | [`atom/bookmarks`][bookmarks] | [#18273](https://github.com/atom/atom/issues/18273) |
| **bracket-matcher** | [`atom/bracket-matcher`][bracket-matcher] |  |
| **command-palette** | [`atom/command-palette`][command-palette] |  |
| **dalek** | [`./dalek`](./dalek) | [#17838](https://github.com/atom/atom/issues/17838) |
| **deprecation-cop** | [`./deprecation-cop`](./deprecation-cop) | |
| **dev-live-reload** | [`./dev-live-reload`](./dev-live-reload) | |
| **encoding-selector** | [`atom/encoding-selector`][encoding-selector] | [#17841](https://github.com/atom/atom/issues/17841) |
| **exception-reporting** | [`./exception-reporting`](./exception-reporting) | |
| **find-and-replace** | [`atom/find-and-replace`][find-and-replace] |  |
| **fuzzy-finder** | [`atom/fuzzy-finder`][fuzzy-finder] |  |
| **github** | [`atom/github`][github] |  |
| **git-diff** | [`./git-diff`](./git-diff) | |
| **go-to-line** | [`./go-to-line`](./go-to-line) | |
| **grammar-selector** | [`./grammar-selector`](./grammar-selector) | |
| **image-view** | [`atom/image-view`][image-view] | [#18274](https://github.com/atom/atom/issues/18274) |
| **incompatible-packages** | [`./incompatible-packages`](./incompatible-packages) | |
| **keybinding-resolver** | [`atom/keybinding-resolver`][keybinding-resolver] | [#18275](https://github.com/atom/atom/issues/18275) |
| **language-c** | [`./language-c`](./language-c) |  |
| **language-clojure** | [`./language-clojure`](./language-clojure) |  |
| **language-coffeescript** | [`./language-coffeescript`](./language-coffeescript) |  |
| **language-csharp** | [`./language-csharp`](./language-csharp) |  |
| **language-css** | [`./language-css`](./language-css) |  |
| **language-gfm** | [`./language-gfm`](./language-gfm) |  |
| **language-git** | [`./language-git`](./language-git) |  |
| **language-go** | [`./language-go`](./language-go) |  |
| **language-html** | [`./language-html`](./language-html) |  |
| **language-hyperlink** | [`./language-hyperlink`](./language-hyperlink) |  |
| **language-java** | [`./language-java`](./language-java) |  |
| **language-javascript** | [`./language-javascript`](./language-javascript) |  |
| **language-json** | [`./language-json`](./language-json) |  |
| **language-less** | [`./language-less`](./language-less) |  |
| **language-make** | [`./language-make`](./language-make) |  |
| **language-mustache** | [`./language-mustache`](./language-mustache) |  |
| **language-objective-c** | [`./language-objective-c`](./language-objective-c) |  |
| **language-perl** | [`./language-perl`](./language-perl) |  |
| **language-php** | [`./language-php`](./language-php) |  |
| **language-property-list** | [`./language-property-list`](./language-property-list) |  |
| **language-python** | [`./language-python`](./language-python) |  |
| **language-ruby** | [`./language-ruby`](./language-ruby) |  |
| **language-ruby-on-rails** | [`./language-ruby-on-rails`](./language-ruby-on-rails) |  |
| **language-rust-bundled** | [`./language-rust-bundled`](./language-rust-bundled) |  |
| **language-sass** | [`./language-sass`](./language-sass) |  |
| **language-shellscript** | [`./language-shellscript`](./language-shellscript) |  |
| **language-source** | [`./language-source`](./language-source) |  |
| **language-sql** | [`./language-sql`](./language-sql) |  |
| **language-text** | [`./language-text`](./language-text) |  |
| **language-todo** | [`./language-todo`](./language-todo) |  |
| **language-toml** | [`./language-toml`](./language-toml) |  |
| **language-typescript** | [`./language-typescript`](./language-typescript) |  |
| **language-xml** | [`./language-xml`](./language-xml) |  |
| **language-yaml** | [`./language-yaml`](./language-yaml) |  |
| **line-ending-selector** | [`./line-ending-selector`](./line-ending-selector) | |
| **link** | [`./link`](./link) | |
| **markdown-preview** | [`atom/markdown-preview`][markdown-preview] |  |
| **notifications** | [`atom/notifications`][notifications] | [#18277](https://github.com/atom/atom/issues/18277) |
| **one-dark-syntax** | [`./one-dark-syntax`](./one-dark-syntax) | |
| **one-dark-ui** | [`./one-dark-ui`](./one-dark-ui) | |
| **one-light-syntax** | [`./one-light-syntax`](./one-light-syntax) | |
| **one-light-ui** | [`./one-light-ui`](./one-light-ui) | |
| **open-on-github** | [`atom/open-on-github`][open-on-github] | [#18278](https://github.com/atom/atom/issues/18278) |
| **package-generator** | [`atom/package-generator`][package-generator] | [#18279](https://github.com/atom/atom/issues/18279) |
| **settings-view** | [`atom/settings-view`][settings-view] |  |
| **snippets** | [`atom/snippets`][snippets] |  |
| **solarized-dark-syntax** | [`./solarized-dark-syntax`](./solarized-dark-syntax) | |
| **solarized-light-syntax** | [`./solarized-light-syntax`](./solarized-light-syntax) | |
| **spell-check** | [`atom/spell-check`][spell-check] |  |
| **status-bar** | [`atom/status-bar`][status-bar] | [#18282](https://github.com/atom/atom/issues/18282) |
| **styleguide** | [`atom/styleguide`][styleguide] | [#18283](https://github.com/atom/atom/issues/18283) |
| **symbols-view** | [`atom/symbols-view`][symbols-view] |  |
| **tabs** | [`atom/tabs`][tabs] |  |
| **timecop** | [`atom/timecop`][timecop] | [#18272](https://github.com/atom/atom/issues/18272) |
| **tree-view** | [`atom/tree-view`][tree-view] |  |
| **update-package-dependencies** | [`./update-package-dependencies`](./update-package-dependencies) | |
| **welcome** | [`./welcome`](./welcome) | |
| **whitespace** | [`atom/whitespace`][whitespace] |  |
| **wrap-guide** | [`atom/wrap-guide`][wrap-guide] | [#18286](https://github.com/atom/atom/issues/18286) |

[archive-view]: https://github.com/pulsar-edit/archive-view
[autocomplete-atom-api]: https://github.com/pulsar-edit/autocomplete-atom-api
[autocomplete-css]: https://github.com/pulsar-edit/autocomplete-css
[autocomplete-html]: https://github.com/pulsar-edit/autocomplete-html
[autocomplete-plus]: https://github.com/pulsar-edit/autocomplete-plus
[autocomplete-snippets]: https://github.com/pulsar-edit/autocomplete-snippets
[autosave]: https://github.com/pulsar-edit/autosave
[background-tips]: https://github.com/pulsar-edit/background-tips
[bookmarks]: https://github.com/pulsar-edit/bookmarks
[bracket-matcher]: https://github.com/pulsar-edit/bracket-matcher
[command-palette]: https://github.com/pulsar-edit/command-palette
[encoding-selector]: https://github.com/pulsar-edit/encoding-selector
[find-and-replace]: https://github.com/pulsar-edit/find-and-replace
[fuzzy-finder]: https://github.com/pulsar-edit/fuzzy-finder
[github]: https://github.com/pulsar-edit/github
[image-view]: https://github.com/pulsar-edit/image-view
[keybinding-resolver]: https://github.com/pulsar-edit/keybinding-resolver
[markdown-preview]: https://github.com/pulsar-edit/markdown-preview
[notifications]: https://github.com/pulsar-edit/notifications
[open-on-github]: https://github.com/pulsar-edit/open-on-github
[package-generator]: https://github.com/pulsar-edit/package-generator
[settings-view]: https://github.com/pulsar-edit/settings-view
[snippets]: https://github.com/pulsar-edit/snippets
[spell-check]: https://github.com/pulsar-edit/spell-check
[status-bar]: https://github.com/pulsar-edit/status-bar
[styleguide]: https://github.com/pulsar-edit/styleguide
[symbols-view]: https://github.com/pulsar-edit/symbols-view
[tabs]: https://github.com/pulsar-edit/tabs
[timecop]: https://github.com/pulsar-edit/timecop
[tree-view]: https://github.com/pulsar-edit/tree-view
[whitespace]: https://github.com/pulsar-edit/whitespace
[wrap-guide]: https://github.com/pulsar-edit/wrap-guide
