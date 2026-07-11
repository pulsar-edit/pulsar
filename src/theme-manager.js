/* global snapshotAuxiliaryData */

const path = require("path");
const _ = require("underscore-plus");
const { Emitter } = require("event-kit");
const fs = require("fs-plus");
const LessCompileCache = require("./less-compile-cache");
const { UI_VARIABLES, SYNTAX_VARIABLES } = require("./theme-variables");
const { writeShimDirectory } = require("./theme-variable-shim");

// Keeping a reference to the entire object so that it can be mocked more
// easily in the specs.
const watcher = require("./path-watcher");

// The core stylesheets, in loading order (relative to static/). Plain CSS —
// all theming flows through the custom-property contract at runtime, so the
// base never recompiles on theme switches.
const BASE_STYLESHEETS = [
  "variables/base-variables.css",
  "icons/octicons.css",
  "normalize.css",
  "scaffolding.css",
  "core-ui/cursors.css",
  "core-ui/theme-transition.css",
  "core-ui/panels.css",
  "core-ui/docks.css",
  "core-ui/panes.css",
  "core-ui/syntax.css",
  "core-ui/text-editor.css",
  "core-ui/workspace-view.css",
  "atom-ui/styles/private/scaffolding.css",
  "atom-ui/styles/private/alerts.css",
  "atom-ui/styles/private/close.css",
  "atom-ui/styles/private/code.css",
  "atom-ui/styles/private/forms.css",
  "atom-ui/styles/private/links.css",
  "atom-ui/styles/private/navs.css",
  "atom-ui/styles/private/sections.css",
  "atom-ui/styles/private/tables.css",
  "atom-ui/styles/private/utilities.css",
  "atom-ui/styles/badges.css",
  "atom-ui/styles/button-groups.css",
  "atom-ui/styles/buttons.css",
  "atom-ui/styles/git-status.css",
  "atom-ui/styles/icons.css",
  "atom-ui/styles/inputs.css",
  "atom-ui/styles/layout.css",
  "atom-ui/styles/lists.css",
  "atom-ui/styles/loading.css",
  "atom-ui/styles/messages.css",
  "atom-ui/styles/modals.css",
  "atom-ui/styles/panels.css",
  "atom-ui/styles/select-list.css",
  "atom-ui/styles/site-colors.css",
  "atom-ui/styles/text.css",
  "atom-ui/styles/tooltip.css",
];

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Extended: Handles loading and activating available themes.
//
// An instance of this class is always available as the `atom.themes` global.
module.exports = class ThemeManager {
  constructor({ packageManager, config, styleManager, notificationManager, viewRegistry }) {
    this.packageManager = packageManager;
    this.config = config;
    this.styleManager = styleManager;
    this.notificationManager = notificationManager;
    this.viewRegistry = viewRegistry;
    this.emitter = new Emitter();
    this.styleSheetDisposablesBySourcePath = {};
    this.lessCache = null;
    this.initialLoadComplete = false;
    this.themeImportPathsOverride = null;
    this.themeShimDir = null;
    this.themeSwitchPromise = Promise.resolve();
    this.packageManager.registerPackageActivator(this, ["theme"]);

    this.reloadStylesheet = _.debounce(() => {
      this.loadUserStylesheet();
    }, 20);
  }

  initialize({ resourcePath, configDirPath, safeMode, devMode }) {
    this.resourcePath = resourcePath;
    this.configDirPath = configDirPath;
    this.safeMode = safeMode;
    this.lessSourcesByRelativeFilePath = null;
    if (devMode || typeof snapshotAuxiliaryData === "undefined") {
      this.lessSourcesByRelativeFilePath = {};
      this.importedFilePathsByRelativeImportPath = {};
    } else {
      this.lessSourcesByRelativeFilePath = snapshotAuxiliaryData.lessSourcesByRelativeFilePath;
      this.importedFilePathsByRelativeImportPath =
        snapshotAuxiliaryData.importedFilePathsByRelativeImportPath;
    }
  }

  /*
  Section: Event Subscription
  */

  // Essential: Invoke `callback` when style sheet changes associated with
  // updating the list of active themes have completed.
  //
  // * `callback` {Function}
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidChangeActiveThemes(callback) {
    return this.emitter.on("did-change-active-themes", callback);
  }

  /*
  Section: Accessing Available Themes
  */

  getAvailableNames() {
    // TODO: Maybe should change to list all the available themes out there?
    return this.getLoadedNames();
  }

  /*
  Section: Accessing Loaded Themes
  */

  // Public: Returns an {Array} of {String}s of all the loaded theme names.
  getLoadedThemeNames() {
    return this.getLoadedThemes().map((theme) => theme.name);
  }

  // Public: Returns an {Array} of all the loaded themes.
  getLoadedThemes() {
    return this.packageManager.getLoadedPackages().filter((pack) => pack.isTheme());
  }

  /*
  Section: Accessing Active Themes
  */

  // Public: Returns an {Array} of {String}s of all the active theme names.
  getActiveThemeNames() {
    return this.getActiveThemes().map((theme) => theme.name);
  }

  // Public: Returns an {Array} of all the active themes.
  getActiveThemes() {
    return this.packageManager.getActivePackages().filter((pack) => pack.isTheme());
  }

  activatePackages() {
    return this.activateThemes();
  }

  /*
  Section: Managing Enabled Themes
  */

  // The config key holding the theme pair for the mode currently in effect.
  getActiveThemesKeyPath() {
    return this.isDarkThemeMode() ? "theme.dark" : "theme.light";
  }

  warnForNonExistentThemes() {
    let themeNames = this.config.get(this.getActiveThemesKeyPath()) || [];
    if (!Array.isArray(themeNames)) {
      themeNames = [themeNames];
    }
    for (let themeName of themeNames) {
      if (!themeName || typeof themeName !== "string" || !this.isThemeInstalled(themeName)) {
        console.warn(`Enabled theme '${themeName}' is not installed.`);
      }
    }
  }

  // A theme is installed when it is already loaded (which covers themes
  // provided by multi-theme packages) or when its name resolves to a package
  // on disk.
  isThemeInstalled(themeName) {
    return (
      this.packageManager.getLoadedPackage(themeName) != null ||
      this.packageManager.resolvePackagePath(themeName) != null
    );
  }

  // Public: Get the enabled theme names from the config.
  //
  // Returns an array of theme names in the order that they should be activated.
  getEnabledThemeNames() {
    let themeNames = this.config.get(this.getActiveThemesKeyPath()) || [];
    if (!Array.isArray(themeNames)) {
      themeNames = [themeNames];
    }
    themeNames = themeNames.filter(
      (themeName) => typeof themeName === "string" && this.isThemeInstalled(themeName),
    );

    // Nothing usable configured: fall back to the bundled pair matching the
    // current mode. A configured half pair (only a ui or only a syntax theme)
    // runs alone on top of the base-variables fallbacks.
    if (themeNames.length === 0) {
      themeNames = this.isDarkThemeMode()
        ? ["one-night-ui", "one-night-syntax"]
        : ["one-day-ui", "one-day-syntax"];
      themeNames = themeNames.filter((name) => this.isThemeInstalled(name));
    }

    // Reverse so the first (top) theme is loaded after the others. We want
    // the first/top theme to override later themes in the stack.
    return themeNames.reverse();
  }

  // Returns the `theme` field of the named theme's metadata ("ui" or
  // "syntax"), or null when the theme can't be found.
  getThemeType(themeName) {
    const loadedPackage = this.packageManager.getLoadedPackage(themeName);
    if (loadedPackage) {
      return loadedPackage.metadata.theme || null;
    }
    const packagePath = this.packageManager.resolvePackagePath(themeName);
    if (!packagePath) return null;
    const metadata = this.packageManager.loadPackageMetadata(packagePath, true);
    return metadata?.theme || null;
  }

  /*
  Section: Private
  */

  // The styles directory of the named theme, or null.
  getThemeStylesPath(themeName) {
    const loadedPackage = this.packageManager.getLoadedPackage(themeName);
    if (loadedPackage != null) {
      return loadedPackage.getStylesheetsPath();
    }
    const packagePath = this.packageManager.resolvePackagePath(themeName);
    if (!packagePath) return null;
    const deprecatedPath = path.join(packagePath, "stylesheets");
    if (fs.isDirectorySync(deprecatedPath)) return deprecatedPath;
    return path.join(packagePath, "styles");
  }

  // A modern theme defines its palette as CSS custom properties in a
  // variables.css inside its styles directory. Returns that path, or null for
  // legacy Less themes.
  getThemeVariablesPath(themeName) {
    const stylesPath = this.getThemeStylesPath(themeName);
    if (!stylesPath) return null;
    const variablesPath = path.join(stylesPath, "variables.css");
    return fs.isFileSync(variablesPath) ? variablesPath : null;
  }

  // For the modern themes in `themeNames`, write the generated Less shim
  // (ui-variables.less / syntax-variables.less derived from their CSS
  // palettes) and return its directory; returns null when no enabled theme is
  // modern. The directory is added to the Less import path so community
  // stylesheets keep compiling against the classic contract. Only the sides
  // (ui / syntax) provided by modern themes are generated — a legacy theme in
  // the pair keeps providing its own Less variables directly.
  generateThemeShims(themeNames) {
    const paletteSources = [];
    const modernThemeNames = [];
    const modernTypes = new Set();

    for (const themeName of themeNames) {
      const variablesPath = this.getThemeVariablesPath(themeName);
      if (!variablesPath) continue;
      try {
        paletteSources.push(fs.readFileSync(variablesPath, "utf8"));
        modernThemeNames.push(themeName);
        modernTypes.add(this.getThemeType(themeName) === "syntax" ? "syntax" : "ui");
      } catch (error) {
        this.notificationManager.addError(
          `Failed to read the '${themeName}' theme's variables.css`,
          { detail: error.message, dismissable: true },
        );
      }
    }

    if (paletteSources.length === 0) return null;

    try {
      return writeShimDirectory(modernThemeNames.join("+"), paletteSources.join("\n"), {
        includeUi: modernTypes.has("ui"),
        includeSyntax: modernTypes.has("syntax"),
      });
    } catch (error) {
      this.notificationManager.addError("Failed to generate the theme's Less variable shim", {
        detail: error.message,
        dismissable: true,
      });
      return null;
    }
  }

  // The custom-properties bridge exposes a legacy (ui/syntax) theme's Less
  // variables as CSS custom properties on :root, so core and bundled-package
  // CSS is themed correctly by community themes that predate the custom
  // property contract.
  getBridgeSourcePath() {
    return path.join(this.resourcePath, "static", "custom-properties-bridge.css");
  }

  buildBridgeSource(includeUi, includeSyntax) {
    const lines = [
      // Fallbacks first, then the
      // active theme's definitions (Less last-wins). The syntax pair must come
      // before the ui pair — a ui theme may itself import "syntax-variables",
      // and Less's import-once semantics would otherwise let the fallback
      // shadow the theme's values.
      '@import "variables/syntax-variables";',
      '@import "syntax-variables";',
      '@import "variables/ui-variables";',
      '@import "ui-variables";',
      ":root {",
    ];
    const names = [...(includeUi ? UI_VARIABLES : []), ...(includeSyntax ? SYNTAX_VARIABLES : [])];
    for (const name of names) {
      lines.push(`  --${name}: @${name};`);
    }
    lines.push("}");
    return lines.join("\n");
  }

  // Compile the bridge against the current import paths, covering only the
  // given sides of the contract. Returns the CSS or null when compilation
  // fails (a notification is shown).
  compileCustomPropertiesBridge(includeUi, includeSyntax) {
    this.ensureLessCache();
    // The virtual path lives directly under static/ so that relative
    // resolution does not shadow the theme's own ui-variables.less.
    const virtualPath = path.join(this.resourcePath, "static", "custom-properties-bridge.less");
    try {
      return this.lessCache.cssForFile(
        virtualPath,
        this.buildBridgeSource(includeUi, includeSyntax),
      );
    } catch (error) {
      this.notificationManager.addError("Failed to compile the theme variables bridge", {
        detail: error.message,
        dismissable: true,
      });
      return null;
    }
  }

  // Resolve and apply the stylesheet specified by the path.
  //
  // This supports both CSS and Less stylesheets.
  //
  // * `stylesheetPath` A {String} path to the stylesheet that can be an absolute
  //   path or a relative path that will be resolved against the load path.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to remove the
  // required stylesheet.
  requireStylesheet(
    stylesheetPath,
    priority,
    skipDeprecatedSelectorsTransformation,
    skipDeprecatedMathUsageTransformation,
  ) {
    let fullPath = this.resolveStylesheet(stylesheetPath);
    if (fullPath) {
      const content = this.loadStylesheet(fullPath);
      return this.applyStylesheet(
        fullPath,
        content,
        priority,
        skipDeprecatedSelectorsTransformation,
        skipDeprecatedMathUsageTransformation,
      );
    } else {
      throw new Error(`Could not find a file at path '${stylesheetPath}'`);
    }
  }

  async unwatchUserStylesheet() {
    this.userStylesheetSubscription?.dispose();
    this.userStylesheetSubscription = null;

    // Pause a moment for file-watcher cleanup.
    await wait(10);
  }

  removeUserStylesheet() {
    this.userStyleSheetDisposable?.dispose();
    this.userStyleSheetDisposable = null;
  }

  async loadUserStylesheet() {
    await this.watchUserStylesheet();
    this.applyUserStylesheet(this.readUserStylesheet());
  }

  async watchUserStylesheet() {
    await this.unwatchUserStylesheet();

    const userStylesheetPath = this.styleManager.getUserStyleSheetPath();
    if (!fs.isFileSync(userStylesheetPath)) {
      return;
    }

    try {
      // `watchPath` is recursive, even though we don't need it to be. So the
      // easiest way to be sure our stylesheet is the one that was modified
      // (rather than some other file called `styles.less` deeper in the tree)
      // is to determine its real path (without symlinks) before we start the
      // watcher.
      let realStylesheetPath = fs.realpathSync(userStylesheetPath);

      this.userStylesheetSubscription = await watcher.watchPath(realStylesheetPath, {}, () => {
        this.reloadStylesheet();
      });
    } catch {
      let message = `
Unable to watch path: \`${path.basename(userStylesheetPath)}\`. Make sure
you have permissions to \`${userStylesheetPath}\`.
`;
      if (process.platform === "linux") {
        message = `${message}

On Linux there are currently problems with watch sizes. See [this document][watches] for more info.
[watches]:https://pulsar-edit.dev/docs/atom-archive/hacking-atom/#typeerror-unable-to-watch-path
`;
      }
      this.notificationManager.addError(message, { dismissable: true });
    }
  }

  readUserStylesheet() {
    const sourcePath = this.styleManager.getUserStyleSheetPath();
    if (!fs.isFileSync(sourcePath)) {
      return { sourcePath, exists: false, contents: null };
    }

    try {
      return { sourcePath, exists: true, contents: this.loadStylesheet(sourcePath, true) };
    } catch {
      // Compile error — the notification was already shown; keep the
      // previous styles applied.
      return { sourcePath, exists: true, contents: null };
    }
  }

  applyUserStylesheet({ sourcePath, exists, contents }) {
    if (!exists) {
      this.removeUserStylesheet();
      return;
    }
    if (contents == null) return;

    // `addStyleSheet` updates the existing style element in place when the
    // source path matches, so the user styles never leave the DOM. Drop the
    // old disposable without disposing it — disposing would remove the
    // reused element.
    this.userStyleSheetDisposable = this.styleManager.addStyleSheet(contents, {
      sourcePath,
      priority: 2,
    });
  }

  loadBaseStylesheets() {
    this.reloadBaseStylesheets();
  }

  getBaseStylesheetPath() {
    return path.join(this.resourcePath, "static", "atom.css");
  }

  // The absolute paths of the files the base stylesheet is built from
  // (used by dev-live-reload to watch them).
  getBaseStylesheetFilePaths() {
    const staticPath = path.join(this.resourcePath, "static");
    return BASE_STYLESHEETS.map((relativePath) => path.join(staticPath, relativePath));
  }

  buildBaseStylesheet() {
    const staticPath = path.join(this.resourcePath, "static");
    return BASE_STYLESHEETS.map(
      (relativePath) =>
        `/* --- ${relativePath} --- */\n` +
        fs.readFileSync(path.join(staticPath, relativePath), "utf8"),
    ).join("\n");
  }

  reloadBaseStylesheets() {
    this.applyStylesheet(this.getBaseStylesheetPath(), this.buildBaseStylesheet(), -2, true, true);
  }

  stylesheetElementForId(id) {
    const escapedId = id.replace(/\\/g, "\\\\");
    return document.head.querySelector(`atom-styles style[source-path="${escapedId}"]`);
  }

  resolveStylesheet(stylesheetPath) {
    if (path.extname(stylesheetPath).length > 0) {
      return fs.resolveOnLoadPath(stylesheetPath);
    } else {
      return fs.resolveOnLoadPath(stylesheetPath, ["css", "less"]);
    }
  }

  loadStylesheet(stylesheetPath, importFallbackVariables) {
    if (path.extname(stylesheetPath) === ".less") {
      return this.loadLessStylesheet(stylesheetPath, importFallbackVariables);
    } else {
      return fs.readFileSync(stylesheetPath, "utf8");
    }
  }

  ensureLessCache() {
    if (this.lessCache == null) {
      this.lessCache = new LessCompileCache({
        resourcePath: this.resourcePath,
        lessSourcesByRelativeFilePath: this.lessSourcesByRelativeFilePath,
        importedFilePathsByRelativeImportPath: this.importedFilePathsByRelativeImportPath,
        importPaths: this.getImportPaths(),
      });
    }
    return this.lessCache;
  }

  loadLessStylesheet(lessStylesheetPath, importFallbackVariables = false) {
    this.ensureLessCache();

    try {
      if (importFallbackVariables) {
        const baseVarImports = `\
@import "variables/ui-variables";
@import "variables/syntax-variables";\
`;
        const relativeFilePath = path.relative(this.resourcePath, lessStylesheetPath);
        const lessSource = this.lessSourcesByRelativeFilePath[relativeFilePath];

        let content, digest;
        if (lessSource != null) {
          ({ content } = lessSource);
          ({ digest } = lessSource);
        } else {
          content = baseVarImports + "\n" + fs.readFileSync(lessStylesheetPath, "utf8");
          digest = null;
        }

        return this.lessCache.cssForFile(lessStylesheetPath, content, digest);
      } else {
        return this.lessCache.read(lessStylesheetPath);
      }
    } catch (error) {
      let detail, message;
      error.less = true;
      if (error.line != null) {
        // Adjust line numbers for import fallbacks
        if (importFallbackVariables) {
          error.line -= 2;
        }

        message = `Error compiling Less stylesheet: \`${lessStylesheetPath}\``;
        detail = `Line number: ${error.line}\n${error.message}`;
      } else {
        message = `Error loading Less stylesheet: \`${lessStylesheetPath}\``;
        detail = error.message;
      }

      this.notificationManager.addError(message, { detail, dismissable: true });
      throw error;
    }
  }

  removeStylesheet(stylesheetPath) {
    if (this.styleSheetDisposablesBySourcePath[stylesheetPath] != null) {
      this.styleSheetDisposablesBySourcePath[stylesheetPath].dispose();
    }
  }

  applyStylesheet(
    path,
    text,
    priority,
    skipDeprecatedSelectorsTransformation,
    skipDeprecatedMathUsageTransformation,
  ) {
    this.styleSheetDisposablesBySourcePath[path] = this.styleManager.addStyleSheet(text, {
      priority,
      skipDeprecatedSelectorsTransformation,
      skipDeprecatedMathUsageTransformation,
      sourcePath: path,
    });

    return this.styleSheetDisposablesBySourcePath[path];
  }

  activateThemes() {
    return new Promise((resolve) => {
      // Created lazily so specs can install a fake before activation.
      if (this.systemThemeQuery == null) {
        this.systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
      }

      // Serialize switches so a rapid re-toggle can't interleave with the
      // previous switch's package bookkeeping. The active pair is derived from
      // `theme.mode` + `theme.light`/`theme.dark`, so we switch whenever any of
      // those (or the system preference, under `mode: system`) changes.
      const queueSwitch = (onSettled) => {
        this.themeSwitchPromise = this.themeSwitchPromise
          .then(() => this.switchThemes())
          .then(
            () => onSettled?.(),
            (error) => {
              console.error(`Failed to switch themes: ${error?.stack ?? error}`);
              onSettled?.();
            },
          );
      };

      // The initial activation resolves the returned promise.
      queueSwitch(resolve);

      this.config.onDidChange("theme.mode", () => queueSwitch());
      this.config.onDidChange("theme.light", () => {
        if (!this.isDarkThemeMode()) queueSwitch();
      });
      this.config.onDidChange("theme.dark", () => {
        if (this.isDarkThemeMode()) queueSwitch();
      });
      this.systemThemeQuery.addEventListener("change", () => {
        if (this.config.get("theme.mode") === "system") queueSwitch();
      });
    });
  }

  // Whether the dark theme pair should be in effect for the current mode.
  isDarkThemeMode() {
    const mode = this.config.get("theme.mode");
    return mode === "dark" || (mode !== "light" && Boolean(this.systemThemeQuery?.matches));
  }

  async switchThemes() {
    this.warnForNonExistentThemes();

    // The old themes' style sheets stay in the DOM while the new themes load
    // and compile, so the window never paints unstyled.
    const oldThemes = this.getActiveThemes();
    const enabledThemeNames = this.getEnabledThemeNames();

    // Compile against the new theme set's import paths even though the old
    // themes are still active. A dual theme additionally contributes the
    // generated Less shim directory derived from its CSS palette.
    this.themeShimDir = this.generateThemeShims(enabledThemeNames);
    this.themeImportPathsOverride = this.getImportPathsForThemeNames(enabledThemeNames);
    if (this.themeShimDir) {
      this.themeImportPathsOverride.push(this.themeShimDir);
    }
    this.refreshLessCache();

    const newThemes = [];
    for (const themeName of enabledThemeNames) {
      if (!this.isThemeInstalled(themeName)) {
        console.warn(`Failed to activate theme '${themeName}' because it isn't installed.`);
        continue;
      }
      const pack = this.packageManager.loadPackage(themeName);
      if (pack == null) continue;
      // Theme packages compile their style sheets on activation, not on load,
      // so compile here — before the swap — against the new import paths.
      // `activate` recompiles later, but that hits the compile cache.
      try {
        pack.loadStylesheets();
      } catch (error) {
        pack.handleError(`Failed to load the ${pack.name} theme stylesheets`, error);
      }
      newThemes.push(pack);
    }

    // Everything else that bakes theme variables into its compiled CSS — the
    // user stylesheet and the active packages' style sheets — also compiles
    // now, so the whole window can restyle in a single frame. The core base
    // stylesheet is plain CSS on the custom-property contract and never needs
    // recompiling.
    const userStylesheet = this.readUserStylesheet();

    // Legacy Less themes don't define the CSS custom-property contract
    // themselves; compile the bridge that derives it from their Less
    // variables. Only the sides actually provided by legacy themes are
    // bridged, so a modern theme paired with a legacy one is not overridden.
    const legacyTypes = new Set();
    for (const themeName of enabledThemeNames) {
      if (this.getThemeVariablesPath(themeName)) continue;
      legacyTypes.add(this.getThemeType(themeName) === "syntax" ? "syntax" : "ui");
    }
    const needsBridge = legacyTypes.size > 0;
    const bridgeCss = needsBridge
      ? this.compileCustomPropertiesBridge(legacyTypes.has("ui"), legacyTypes.has("syntax"))
      : null;

    const activePackages = this.packageManager
      .getActivePackages()
      .filter((pack) => pack.getType() !== "theme" && typeof pack.loadStylesheets === "function");
    for (const pack of activePackages) {
      try {
        pack.loadStylesheets();
      } catch (error) {
        pack.handleError(`Failed to reload the ${pack.name} package stylesheets`, error);
      }
    }

    // Apply all the precompiled styles in one synchronous block; the browser
    // cannot paint a frame in the middle of it.
    const applyStyles = () => {
      this.removeActiveThemeClasses(oldThemes);
      for (const pack of oldThemes) pack.deactivateStylesheets();
      if (bridgeCss != null) {
        this.applyStylesheet(this.getBridgeSourcePath(), bridgeCss, 1, true, true);
      } else if (!needsBridge) {
        this.removeStylesheet(this.getBridgeSourcePath());
      }
      for (const pack of newThemes) pack.activateStylesheets();
      this.addActiveThemeClasses(newThemes);
      this.applyUserStylesheet(userStylesheet);
      for (const pack of activePackages) {
        pack.deactivateStylesheets();
        pack.activateStylesheets();
      }
    };

    // Cross-fade between the two themes; the compositor snapshots the old
    // rendering before `applyStyles` mutates the page.
    if (
      this.initialLoadComplete &&
      !document.hidden &&
      typeof document.startViewTransition === "function"
    ) {
      const transition = document.startViewTransition(applyStyles);
      // A skipped transition rejects `finished`; that's expected, not an error.
      transition.finished.catch(() => {});
      // Hidden, occluded, or otherwise render-throttled windows may never get
      // the rendering opportunity the transition callback waits for; force the
      // swap through rather than stalling the switch. Skipping still invokes
      // the update callback.
      const timer = setTimeout(() => transition.skipTransition(), 100);
      try {
        await transition.updateCallbackDone;
      } finally {
        clearTimeout(timer);
      }
    } else {
      applyStyles();
    }

    // Complete the package lifecycle switch. Themes present in both sets stay
    // active; their recompiled styles were already re-attached above, and
    // `activatePackage` skips re-attaching because `stylesheetsActivated` is
    // set.
    const newThemeNames = new Set(newThemes.map((pack) => pack.name));
    const themesToDeactivate = oldThemes.filter((pack) => !newThemeNames.has(pack.name));
    await Promise.all(
      themesToDeactivate.map((pack) => this.packageManager.deactivatePackage(pack.name)),
    );
    // Re-register sequentially so the active-package order — which
    // `getImportPaths` and `getActiveThemes` reflect — matches the enabled
    // order. Continuing themes are dropped from the registry first (their
    // style sheets stay attached) and re-added at the right position.
    for (const pack of newThemes) {
      delete this.packageManager.activePackages[pack.name];
    }
    for (const pack of newThemes) {
      await this.packageManager.activatePackage(pack.name);
    }

    this.themeImportPathsOverride = null;
    this.refreshLessCache(); // Update cache again now that @getActiveThemes() is populated
    await this.watchUserStylesheet();
    this.initialLoadComplete = true;
    this.emitter.emit("did-change-active-themes");
  }

  deactivateThemes() {
    this.themeShimDir = null;
    this.removeActiveThemeClasses();
    this.unwatchUserStylesheet();
    this.removeUserStylesheet();
    const results = this.getActiveThemes().map((pack) =>
      this.packageManager.deactivatePackage(pack.name),
    );
    return Promise.all(results.filter((r) => r != null && typeof r.then === "function"));
  }

  isInitialLoadComplete() {
    return this.initialLoadComplete;
  }

  addActiveThemeClasses(themes = this.getActiveThemes()) {
    const workspaceElement = this.viewRegistry.getView(this.workspace);
    if (workspaceElement) {
      for (const pack of themes) {
        workspaceElement.classList.add(`theme-${pack.name}`);
      }
    }
  }

  removeActiveThemeClasses(themes = this.getActiveThemes()) {
    const workspaceElement = this.viewRegistry.getView(this.workspace);
    for (const pack of themes) {
      workspaceElement.classList.remove(`theme-${pack.name}`);
    }
  }

  refreshLessCache() {
    if (this.lessCache) this.lessCache.setImportPaths(this.getImportPaths());
  }

  getImportPaths() {
    if (this.themeImportPathsOverride) {
      return this.themeImportPathsOverride;
    }

    let themePaths;
    const activeThemes = this.getActiveThemes();
    if (activeThemes.length > 0) {
      themePaths = activeThemes
        .filter((theme) => theme)
        .map((theme) => theme.getStylesheetsPath())
        .filter((themePath) => fs.isDirectorySync(themePath));
    } else {
      themePaths = this.getImportPathsForThemeNames(this.getEnabledThemeNames());
    }

    if (this.themeShimDir) {
      themePaths = themePaths.concat([this.themeShimDir]);
    }
    return themePaths;
  }

  getImportPathsForThemeNames(themeNames) {
    const themePaths = [];
    for (const themeName of themeNames) {
      const stylesPath = this.getThemeStylesPath(themeName);
      if (stylesPath) {
        themePaths.push(stylesPath);
      }
    }

    return themePaths.filter((themePath) => fs.isDirectorySync(themePath));
  }
};
