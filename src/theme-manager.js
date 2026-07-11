/* global snapshotAuxiliaryData */

const path = require("path");
const _ = require("underscore-plus");
const { Emitter } = require("event-kit");
const fs = require("fs-plus");
const LessCompileCache = require("./less-compile-cache");

// Keeping a reference to the entire object so that it can be mocked more
// easily in the specs.
const watcher = require("./path-watcher");

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

  warnForNonExistentThemes() {
    let themeNames = this.config.get("core.themes") || [];
    if (!Array.isArray(themeNames)) {
      themeNames = [themeNames];
    }
    for (let themeName of themeNames) {
      if (
        !themeName ||
        typeof themeName !== "string" ||
        !this.packageManager.resolvePackagePath(themeName)
      ) {
        console.warn(`Enabled theme '${themeName}' is not installed.`);
      }
    }
  }

  // Public: Get the enabled theme names from the config.
  //
  // Returns an array of theme names in the order that they should be activated.
  getEnabledThemeNames() {
    let themeNames = this.config.get("core.themes") || [];
    if (!Array.isArray(themeNames)) {
      themeNames = [themeNames];
    }
    themeNames = themeNames.filter(
      (themeName) =>
        typeof themeName === "string" && this.packageManager.resolvePackagePath(themeName),
    );

    // Use a built-in syntax and UI theme any time the configured themes are not
    // available.
    if (themeNames.length < 2) {
      const builtInThemeNames = [
        "atom-dark-syntax",
        "atom-dark-ui",
        "atom-light-syntax",
        "atom-light-ui",
        "base16-tomorrow-dark-theme",
        "base16-tomorrow-light-theme",
        "solarized-dark-syntax",
        "solarized-light-syntax",
      ];
      themeNames = _.intersection(themeNames, builtInThemeNames);
      if (themeNames.length === 0) {
        themeNames = ["one-dark-syntax", "one-dark-ui"];
      } else if (themeNames.length === 1) {
        if (themeNames[0].endsWith("-ui")) {
          themeNames.unshift("one-dark-syntax");
        } else {
          themeNames.push("one-dark-ui");
        }
      }
    }

    // Reverse so the first (top) theme is loaded after the others. We want
    // the first/top theme to override later themes in the stack.
    return themeNames.reverse();
  }

  /*
  Section: Private
  */

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

  reloadBaseStylesheets() {
    this.requireStylesheet("../static/atom", -2, true);
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

  loadLessStylesheet(lessStylesheetPath, importFallbackVariables = false) {
    if (this.lessCache == null) {
      this.lessCache = new LessCompileCache({
        resourcePath: this.resourcePath,
        lessSourcesByRelativeFilePath: this.lessSourcesByRelativeFilePath,
        importedFilePathsByRelativeImportPath: this.importedFilePathsByRelativeImportPath,
        importPaths: this.getImportPaths(),
      });
    }

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

      // An explicitly configured `core.themes` (legacy configs, specs) seeds
      // the pair for the current mode before the mode takes over.
      const configuredThemes = this.config.get("core.themes", {
        sources: [this.config.getUserConfigPath()],
      });
      if (Array.isArray(configuredThemes)) {
        this.syncThemesToModePair();
      }

      // Derive `core.themes` from the theme mode before observing it, so the
      // initial observation already sees the derived pair and only one
      // activation runs.
      this.applyThemeMode();

      // @config.observe runs the callback once, then on subsequent changes.
      this.config.observe("core.themes", () => {
        this.syncThemesToModePair();
        // Serialize switches so a rapid re-toggle can't interleave with the
        // previous switch's package bookkeeping.
        this.themeSwitchPromise = this.themeSwitchPromise
          .then(() => this.switchThemes())
          .then(resolve, (error) => {
            console.error("Failed to switch themes", error);
            resolve();
          });
      });

      this.config.onDidChange("core.themeMode", () => this.applyThemeMode());
      this.config.onDidChange("core.themesLight", () => this.applyThemeMode());
      this.config.onDidChange("core.themesDark", () => this.applyThemeMode());
      this.systemThemeQuery.addEventListener("change", () => {
        if (this.config.get("core.themeMode") === "system") this.applyThemeMode();
      });
    });
  }

  // Whether the dark theme pair should be in effect for the current mode.
  isDarkThemeMode() {
    const mode = this.config.get("core.themeMode");
    return mode === "dark" || (mode !== "light" && Boolean(this.systemThemeQuery?.matches));
  }

  // Point `core.themes` at the pair selected by `core.themeMode`.
  applyThemeMode() {
    if (this.applyingThemeMode) return;

    const pair = this.config.get(this.isDarkThemeMode() ? "core.themesDark" : "core.themesLight");
    if (!Array.isArray(pair)) return;

    this.applyingThemeMode = true;
    try {
      this.config.set("core.themes", pair);
    } finally {
      this.applyingThemeMode = false;
    }
  }

  // A direct `core.themes` change (settings view, `ThemePackage.enable`)
  // becomes the new preference for whichever pair is currently in effect.
  syncThemesToModePair() {
    if (this.applyingThemeMode) return;

    const themes = this.config.get("core.themes");
    if (!Array.isArray(themes)) return;

    this.applyingThemeMode = true;
    try {
      this.config.set(this.isDarkThemeMode() ? "core.themesDark" : "core.themesLight", themes);
    } finally {
      this.applyingThemeMode = false;
    }
  }

  async switchThemes() {
    this.warnForNonExistentThemes();

    // The old themes' style sheets stay in the DOM while the new themes load
    // and compile, so the window never paints unstyled.
    const oldThemes = this.getActiveThemes();
    const enabledThemeNames = this.getEnabledThemeNames();

    // Compile against the new theme set's import paths even though the old
    // themes are still active.
    this.themeImportPathsOverride = this.getImportPathsForThemeNames(enabledThemeNames);
    this.refreshLessCache();

    const newThemes = [];
    for (const themeName of enabledThemeNames) {
      if (!this.packageManager.resolvePackagePath(themeName)) {
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

    // Everything else that bakes theme variables into its CSS — the base
    // stylesheet, the user stylesheet, and the active packages' style sheets —
    // also compiles now, so the whole window can restyle in a single frame.
    let baseStylesheetPath, baseStylesheet;
    try {
      baseStylesheetPath = this.resolveStylesheet("../static/atom");
      baseStylesheet = this.loadStylesheet(baseStylesheetPath);
    } catch {
      baseStylesheet = null;
    }

    const userStylesheet = this.readUserStylesheet();

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
      for (const pack of newThemes) pack.activateStylesheets();
      this.addActiveThemeClasses(newThemes);
      if (baseStylesheet != null) {
        this.applyStylesheet(baseStylesheetPath, baseStylesheet, -2, true);
      }
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

    const activeThemes = this.getActiveThemes();
    if (activeThemes.length > 0) {
      return activeThemes
        .filter((theme) => theme)
        .map((theme) => theme.getStylesheetsPath())
        .filter((themePath) => fs.isDirectorySync(themePath));
    }

    return this.getImportPathsForThemeNames(this.getEnabledThemeNames());
  }

  getImportPathsForThemeNames(themeNames) {
    const themePaths = [];
    for (const themeName of themeNames) {
      const themePath = this.packageManager.resolvePackagePath(themeName);
      if (themePath) {
        const deprecatedPath = path.join(themePath, "stylesheets");
        if (fs.isDirectorySync(deprecatedPath)) {
          themePaths.push(deprecatedPath);
        } else {
          themePaths.push(path.join(themePath, "styles"));
        }
      }
    }

    return themePaths.filter((themePath) => fs.isDirectorySync(themePath));
  }
};
