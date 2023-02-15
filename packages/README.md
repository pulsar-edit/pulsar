# Core Packages

This folder contains core packages that are bundled with Pulsar releases. Not all core packages are kept here; please
see the table below for the location of every core package.

> **NOTE:** There is an ongoing effort to migrate more Pulsar packages from their individual repositories to this folder.
See [RFC 003](https://github.com/atom/atom/blob/master/docs/rfcs/003-consolidate-core-packages.md) for more details.

| Package | Where to find it | Migration issue |
|---------|------------------|-----------------|
| **about** | [`./about`](./about) | |
| **atom-dark-syntax** | [`./atom-dark-syntax`](./atom-dark-syntax) | |
| **atom-dark-ui** | [`./atom-dark-ui`](./atom-dark-ui) | |
| **atom-light-syntax** | [`./atom-light-syntax`](./atom-light-syntax) | |
| **atom-light-ui** | [`./atom-light-ui`](./atom-light-ui) | |
| **autocomplete-atom-api** | [`atom/autocomplete-atom-api`][autocomplete-atom-api] |  |
| **autocomplete-css** | [`./autocomplete-css`](./autocomplete-css) |  |
| **autocomplete-html** | [`./autocomplete-html`](./autocomplete-html) |  |
| **autocomplete-plus** | [`./autocomplete-plus`][./autocomplete-plus] |  |
| **autocomplete-snippets** | [`./autocomplete-snippets`](./autocomplete-snippets) |  |
| **autoflow** | [`./autoflow`](./autoflow) | |
| **autosave** | [`pulsar-edit/autosave`][autosave] | [#17834](https://github.com/atom/atom/issues/17834) |
| **background-tips** | [`./background-tips`](./background-tips) | |
| **base16-tomorrow-dark-theme** | [`./base16-tomorrow-dark-theme`](./base16-tomorrow-dark-theme) | |
| **base16-tomorrow-light-theme** | [`./base16-tomorrow-light-theme`](./base16-tomorrow-light-theme) | |
| **bookmarks** | [`./bookmarks`](./bookmarks) | |
| **bracket-matcher** | [`atom/bracket-matcher`][bracket-matcher] |  |
| **command-palette** | [`./command-palette`](./command-palette) |  |
| **dalek** | [`./dalek`](./dalek) | |
| **deprecation-cop** | [`./deprecation-cop`](./deprecation-cop) | |
| **dev-live-reload** | [`./dev-live-reload`](./dev-live-reload) | |
| **encoding-selector** | [`./encoding-selector`](./encoding-selector) | |
| **exception-reporting** | [`./exception-reporting`](./exception-reporting) | |
| **find-and-replace** | [`pulsar-edit/find-and-replace`][find-and-replace] |  |
| **fuzzy-finder** | [`pulsar-edit/fuzzy-finder`][fuzzy-finder] |  |
| **github** | [`pulsar-edit/github`][github] |  |
| **git-diff** | [`./git-diff`](./git-diff) | |
| **go-to-line** | [`./go-to-line`](./go-to-line) | |
| **grammar-selector** | [`./grammar-selector`](./grammar-selector) | |
| **image-view** | [`./image-view`](./image-view) | |
| **incompatible-packages** | [`./incompatible-packages`](./incompatible-packages) | |
| **keybinding-resolver** | [`atom/keybinding-resolver`][keybinding-resolver] | [#18275](https://github.com/atom/atom/issues/18275) |
| **language-c** | [`./language-c`](./language-c) |  |
| **language-clojure** | [`./language-clojure`](./language-clojure) |  |
| **language-coffee-script** | [`./language-coffee-script`](./language-coffee-script) |  |
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
| **markdown-preview** | [`./markdown-preview`][./markdown-preview] |  |
| **notifications** | [`atom/notifications`][notifications] | [#18277](https://github.com/atom/atom/issues/18277) |
| **one-dark-syntax** | [`./one-dark-syntax`](./one-dark-syntax) | |
| **one-dark-ui** | [`./one-dark-ui`](./one-dark-ui) | |
| **one-light-syntax** | [`./one-light-syntax`](./one-light-syntax) | |
| **one-light-ui** | [`./one-light-ui`](./one-light-ui) | |
| **open-on-github** | [`./open-on-github`](./open-on-github) | |
| **settings-view** | [`./settings-view`](./settings-view) |  |
| **package-generator** | [`./package-generator`](./package-generator) | |
| **snippets** | [`pulsar-edit/snippets`][snippets] |  |
| **solarized-dark-syntax** | [`./solarized-dark-syntax`](./solarized-dark-syntax) | |
| **solarized-light-syntax** | [`./solarized-light-syntax`](./solarized-light-syntax) | |
| **spell-check** | [`atom/spell-check`][spell-check] |  |
| **status-bar** | [`./status-bar`](./status-bar) | |
| **styleguide** | [`./styleguide`][./styleguide] | |
| **symbols-view** | [`pulsar-edit/symbols-view`][symbols-view] |  |
| **tabs** | [`./tabs`](./tabs) |  |
| **timecop** | [`pulsar-edit/timecop`][timecop] | [#18272](https://github.com/atom/atom/issues/18272) |
| **tree-view** | [`pulsar-edit/tree-view`][tree-view] |  |
| **update-package-dependencies** | [`./update-package-dependencies`](./update-package-dependencies) | |
| **welcome** | [`./welcome`](./welcome) | |
| **whitespace** | [`./whitespace`](./whitespace) |  |
| **wrap-guide** | [`./wrap-guide`][./wrap-guide] | |

[autocomplete-atom-api]: https://github.com/pulsar-edit/autocomplete-atom-api
[autosave]: https://github.com/pulsar-edit/autosave
[bracket-matcher]: https://github.com/pulsar-edit/bracket-matcher
[find-and-replace]: https://github.com/pulsar-edit/find-and-replace
[fuzzy-finder]: https://github.com/pulsar-edit/fuzzy-finder
[github]: https://github.com/pulsar-edit/github
[keybinding-resolver]: https://github.com/pulsar-edit/keybinding-resolver
[notifications]: https://github.com/pulsar-edit/notifications
[snippets]: https://github.com/pulsar-edit/snippets
[spell-check]: https://github.com/pulsar-edit/spell-check
[symbols-view]: https://github.com/pulsar-edit/symbols-view
[timecop]: https://github.com/pulsar-edit/timecop
[tree-view]: https://github.com/pulsar-edit/tree-view
