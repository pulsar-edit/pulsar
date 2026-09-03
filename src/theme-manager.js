/* global snapshotAuxiliaryData */

const path = require('path');
const _ = require('underscore-plus');
const { CompositeDisposable, Emitter } = require('event-kit');
const fs = require('fs-plus');
const LessCompileCache = require('./less-compile-cache');
const Color = require('./color');
const ThemeVariant = require('./theme-variant');

// Keeping a reference to the entire object so that it can be mocked more
// easily in the specs.
const watcher = require('./path-watcher');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Extended: Handles loading and activating available themes.
//
// An instance of this class is always available as the `atom.themes` global.
module.exports = class ThemeManager {
  constructor({
    packageManager,
    config,
    styleManager,
    notificationManager,
    viewRegistry,
    applicationDelegate
  }) {
    this.applicationDelegate = applicationDelegate;
    this.packageManager = packageManager;
    this.config = config;
    this.styleManager = styleManager;
    this.notificationManager = notificationManager;
    this.viewRegistry = viewRegistry;
    this.emitter = new Emitter();
    this.styleSheetDisposablesBySourcePath = {};
    this.activeThemeStyleSheetDisposables = new CompositeDisposable();
    this.activeThemes = [];
    this.lessCache = null;
    this.initialLoadComplete = false;
    this.packageManager.registerPackageActivator(this, ['theme']);
    this.packageManager.onDidActivateInitialPackages(() => {
      this.onDidChangeActiveThemes(() =>
        this.packageManager.reloadActivePackageStyleSheets()
      );
    });

    this.reloadStylesheet = _.debounce(() => {
      this.loadUserStylesheet();
    }, 20);
  }

  initialize({ resourcePath, configDirPath, safeMode, devMode }) {
    this.resourcePath = resourcePath;
    this.configDirPath = configDirPath;
    this.safeMode = safeMode;
    this.lessSourcesByRelativeFilePath = null;
    if (devMode || typeof snapshotAuxiliaryData === 'undefined') {
      this.lessSourcesByRelativeFilePath = {};
      this.importedFilePathsByRelativeImportPath = {};
    } else {
      this.lessSourcesByRelativeFilePath =
        snapshotAuxiliaryData.lessSourcesByRelativeFilePath;
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
    return this.emitter.on('did-change-active-themes', callback);
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
    return this.getLoadedThemes().map(theme => theme.name);
  }

  // Public: Returns an {Array} of all the loaded themes.
  getLoadedThemes() {
    const themes = [];
    for (const pack of this.packageManager.getLoadedPackages()) {
      if (pack.metadata && pack.metadata.theme) {
        themes.push(pack);
      }
      for (const variant of this.getThemeVariantsForPackage(pack)) {
        themes.push(variant);
      }
    }
    return themes;
  }

  /*
  Section: Accessing Active Themes
  */

  // Public: Returns an {Array} of {String}s of all the active theme names.
  getActiveThemeNames() {
    return this.getActiveThemes().map(theme => theme.name);
  }

  // Public: Returns an {Array} of all the active themes.
  getActiveThemes() {
    if (this.activeThemes.length > 0) {
      return this.activeThemes.slice();
    }
    return this.packageManager
      .getActivePackages()
      .filter(pack => pack.metadata && pack.metadata.theme);
  }

  activatePackages() {
    return this.activateThemes();
  }

  /*
  Section: Managing Enabled Themes
  */

  warnForNonExistentThemes() {
    let themeNames = this.config.get('core.themes') || [];
    if (!Array.isArray(themeNames)) {
      themeNames = [themeNames];
    }
    for (let themeName of themeNames) {
      if (
        !themeName ||
        typeof themeName !== 'string' ||
        !this.resolveTheme(themeName)
      ) {
        console.warn(`Enabled theme '${themeName}' is not installed.`);
      }
    }
  }

  // Public: Get the enabled theme names from the config.
  //
  // Returns an array of theme names in the order that they should be activated.
  getEnabledThemeNames() {
    let themeNames = this.config.get('core.themes') || [];
    if (!Array.isArray(themeNames)) {
      themeNames = [themeNames];
    }
    themeNames = themeNames.filter(
      themeName =>
        typeof themeName === 'string' &&
        this.resolveTheme(themeName)
    );

    // Use a built-in syntax and UI theme any time the configured themes are not
    // available.
    if (themeNames.length < 2) {
      const builtInThemeNames = [
        'atom-dark-syntax',
        'atom-dark-ui',
        'atom-light-syntax',
        'atom-light-ui',
        'base16-tomorrow-dark-theme',
        'base16-tomorrow-light-theme',
        'solarized-dark-syntax',
        'solarized-light-syntax'
      ];
      themeNames = _.intersection(themeNames, builtInThemeNames);
      if (themeNames.length === 0) {
        themeNames = ['one-dark-syntax', 'one-dark-ui'];
      } else if (themeNames.length === 1) {
        if (themeNames[0].endsWith('-ui')) {
          themeNames.unshift('one-dark-syntax');
        } else {
          themeNames.push('one-dark-ui');
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

  getThemeVariantsForPackage(pack) {
    if (!pack.metadata || !Array.isArray(pack.metadata.themes)) {
      return [];
    }

    return pack.metadata.themes
      .filter(
        variant =>
          variant &&
          typeof variant.name === 'string' &&
          typeof (variant.theme || variant.type) === 'string'
      )
      .map(variant => new ThemeVariant({ pack, variant }));
  }

  // Resolve a configured theme name to a normalized {ThemeVariant} description,
  // or null if no matching theme is installed. The description is uniform
  // whether the name refers to a variant, a classic single-theme package, or a
  // package that is not currently loaded.
  resolveTheme(themeName) {
    for (const theme of this.getLoadedThemes()) {
      if (theme.name === themeName) {
        return theme instanceof ThemeVariant
          ? theme
          : new ThemeVariant({ pack: theme });
      }
    }

    const packagePath = this.packageManager.resolvePackagePath(themeName);
    if (packagePath) {
      const metadata = this.packageManager.loadPackageMetadata(
        packagePath,
        true
      );
      if (metadata && metadata.theme) {
        return new ThemeVariant({
          packageName: themeName,
          packagePath,
          metadata
        });
      }
    }

    for (const availablePackage of this.packageManager.getAvailablePackages()) {
      const metadata = this.packageManager.loadPackageMetadata(
        availablePackage,
        true
      );
      const variant = this.getThemeVariantMetadata(metadata, themeName);
      if (variant) {
        return new ThemeVariant({
          packageName: metadata.name || availablePackage.name,
          packagePath: availablePackage.path,
          metadata,
          variant
        });
      }
    }

    return null;
  }

  getThemeVariantMetadata(metadata, themeName) {
    if (!metadata || !Array.isArray(metadata.themes)) {
      return null;
    }
    return metadata.themes.find(
      variant => variant && variant.name === themeName
    );
  }

  getThemeStylesheetsPaths(theme) {
    return theme ? theme.getStylesheetsPaths() : [];
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
    skipDeprecatedMathUsageTransformation
  ) {
    let fullPath = this.resolveStylesheet(stylesheetPath);
    if (fullPath) {
      const content = this.loadStylesheet(fullPath);
      return this.applyStylesheet(
        fullPath,
        content,
        priority,
        skipDeprecatedSelectorsTransformation,
        skipDeprecatedMathUsageTransformation
      );
    } else {
      throw new Error(`Could not find a file at path '${stylesheetPath}'`);
    }
  }

  async unwatchUserStylesheet() {
    this.userStylesheetSubscription?.dispose();
    this.userStylesheetSubscription = null;

    this.userStyleSheetDisposable?.dispose();
    this.userStyleSheetDisposable = null;

    // Pause a moment for file-watcher cleanup.
    await wait(10);
  }

  async loadUserStylesheet() {
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
    } catch (error) {
      let message = `
Unable to watch path: \`${path.basename(userStylesheetPath)}\`. Make sure
you have permissions to \`${userStylesheetPath}\`.
`;
      if (process.platform === 'linux') {
        message = `${message}

On Linux there are currently problems with watch sizes. See [this document][watches] for more info.
[watches]:https://pulsar-edit.dev/docs/atom-archive/hacking-atom/#typeerror-unable-to-watch-path
`
      }
      this.notificationManager.addError(message, { dismissable: true });
    }

    let userStylesheetContents;
    try {
      userStylesheetContents = this.loadStylesheet(userStylesheetPath, true);
    } catch (error) {
      return;
    }

    this.userStyleSheetDisposable = this.styleManager.addStyleSheet(
      userStylesheetContents,
      { sourcePath: userStylesheetPath, priority: 2 }
    );
  }

  loadBaseStylesheets() {
    this.reloadBaseStylesheets();
  }

  reloadBaseStylesheets() {
    this.requireStylesheet('../static/atom', -2, true);
  }

  stylesheetElementForId(id) {
    const escapedId = id.replace(/\\/g, '\\\\');
    return document.head.querySelector(
      `atom-styles style[source-path="${escapedId}"]`
    );
  }

  resolveStylesheet(stylesheetPath) {
    if (path.extname(stylesheetPath).length > 0) {
      return fs.resolveOnLoadPath(stylesheetPath);
    } else {
      return fs.resolveOnLoadPath(stylesheetPath, ['css', 'less']);
    }
  }

  loadStylesheet(stylesheetPath, importFallbackVariables) {
    if (path.extname(stylesheetPath) === '.less') {
      return this.loadLessStylesheet(stylesheetPath, importFallbackVariables);
    } else {
      return fs.readFileSync(stylesheetPath, 'utf8');
    }
  }

  loadLessStylesheet(lessStylesheetPath, importFallbackVariables = false) {
    if (this.lessCache == null) {
      this.lessCache = new LessCompileCache({
        resourcePath: this.resourcePath,
        lessSourcesByRelativeFilePath: this.lessSourcesByRelativeFilePath,
        importedFilePathsByRelativeImportPath: this
          .importedFilePathsByRelativeImportPath,
        importPaths: this.getImportPaths()
      });
    }

    try {
      if (importFallbackVariables) {
        const baseVarImports = `\
@import "variables/ui-variables";
@import "variables/syntax-variables";\
`;
        const relativeFilePath = path.relative(
          this.resourcePath,
          lessStylesheetPath
        );
        const lessSource = this.lessSourcesByRelativeFilePath[relativeFilePath];

        let content, digest;
        if (lessSource != null) {
          ({ content } = lessSource);
          ({ digest } = lessSource);
        } else {
          content =
            baseVarImports + '\n' + fs.readFileSync(lessStylesheetPath, 'utf8');
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

  applyStylesheet(path, text, priority, skipDeprecatedSelectorsTransformation, skipDeprecatedMathUsageTransformation) {
    this.styleSheetDisposablesBySourcePath[
      path
    ] = this.styleManager.addStyleSheet(text, {
      priority,
      skipDeprecatedSelectorsTransformation,
      skipDeprecatedMathUsageTransformation,
      sourcePath: path
    });

    return this.styleSheetDisposablesBySourcePath[path];
  }

  applyThemeStylesheets(theme) {
    for (const sourcePath of theme.getStylesheetPaths()) {
      const match = path.basename(sourcePath).match(/[^.]*\.([^.]*)\./);

      let context;
      if (match) {
        context = match[1];
      } else if (theme.metadata.theme === 'syntax') {
        context = 'atom-text-editor';
      }

      this.activeThemeStyleSheetDisposables.add(
        this.styleManager.addStyleSheet(
          this.loadStylesheet(sourcePath, true),
          {
            sourcePath,
            priority: theme.getStyleSheetPriority(),
            context,
            skipDeprecatedSelectorsTransformation:
              theme.bundledPackage
                ? theme.bundledPackage
                : !this.config.get(
                    "core.transformDeprecatedStyleSheetSelectors"
                  ),
            skipDeprecatedMathUsageTransformation:
              theme.bundledPackage
                ? theme.bundledPackage
                : !this.config.get(
                    "core.transformDeprecatedStyleSheetMathExpressions"
                  )
          }
        )
      );
    }
  }

  removeActiveThemeStylesheets() {
    this.activeThemeStyleSheetDisposables.dispose();
    this.activeThemeStyleSheetDisposables = new CompositeDisposable();
  }

  reloadActiveThemeStylesheets() {
    this.removeActiveThemeStylesheets();
    this.refreshLessCache();
    for (const theme of this.getActiveThemes()) {
      // Only variants have their stylesheets managed here; classic single-theme
      // packages own their stylesheets through their own package disposables.
      if (theme instanceof ThemeVariant) {
        this.applyThemeStylesheets(theme);
      }
    }
  }

  activateTheme(themeName) {
    const resolvedTheme = this.resolveTheme(themeName);
    if (!resolvedTheme) {
      console.warn(
        `Failed to activate theme '${themeName}' because it isn't installed.`
      );
      return Promise.resolve(null);
    }

    const packageName = resolvedTheme.packageName;
    return this.packageManager.activatePackage(packageName).then(pack => {
      const variantMetadata = this.getThemeVariantMetadata(
        pack.metadata,
        themeName
      );
      if (variantMetadata) {
        const theme = new ThemeVariant({ pack, variant: variantMetadata });
        this.applyThemeStylesheets(theme);
        return theme;
      } else {
        return pack;
      }
    });
  }

  refreshWindowTheme() {
    let bgColor = Color.parse(getComputedStyle(document.documentElement).backgroundColor);

    let luminosity = 0.2126 * bgColor.red + 0.7152 * bgColor.green + 0.0722 * bgColor.blue;
    // ^^ Luminosity per ITU-R BT.709
    if (luminosity < 40) {
      // Considered Dark
      this.applicationDelegate.setWindowTheme("dark");
    } else {
      // Considered Bright
      this.applicationDelegate.setWindowTheme("light");
    }
  }

  activateThemes() {
    return new Promise(resolve => {
      // @config.observe runs the callback once, then on subsequent changes.
      this.config.observe('core.themes', () => {
        this.deactivateThemes().then(() => {
          this.warnForNonExistentThemes();
          this.refreshLessCache(); // Update cache for packages in core.themes config

          const promises = this.getEnabledThemeNames().map(themeName =>
            this.activateTheme(themeName)
          );

          return Promise.all(promises).then(async activeThemes => {
            this.activeThemes = _.compact(activeThemes);
            this.addActiveThemeClasses();
            this.refreshLessCache(); // Update cache again now that @getActiveThemes() is populated
            await this.loadUserStylesheet();
            this.reloadBaseStylesheets();
            if (this.config.get("editor.syncWindowThemeWithPulsarTheme")) {
              this.refreshWindowTheme();
            }
            this.initialLoadComplete = true;
            this.emitter.emit('did-change-active-themes');
            resolve();
          });
        });
      });
    });
  }

  deactivateThemes() {
    this.removeActiveThemeClasses();
    this.removeActiveThemeStylesheets();
    this.unwatchUserStylesheet();
    const packageNames = _.uniq(
      this.getActiveThemes().map(theme => theme.packageName || theme.name)
    );
    this.activeThemes = [];
    const results = packageNames.map(packageName =>
      this.packageManager.deactivatePackage(packageName)
    );
    return Promise.all(
      results.filter(r => r != null && typeof r.then === 'function')
    );
  }

  isInitialLoadComplete() {
    return this.initialLoadComplete;
  }

  addActiveThemeClasses() {
    const workspaceElement = this.viewRegistry.getView(this.workspace);
    if (workspaceElement) {
      for (const theme of this.getActiveThemes()) {
        workspaceElement.classList.add(`theme-${theme.name}`);
      }
    }
  }

  removeActiveThemeClasses() {
    const workspaceElement = this.viewRegistry.getView(this.workspace);
    for (const theme of this.getActiveThemes()) {
      workspaceElement.classList.remove(`theme-${theme.name}`);
    }
  }

  refreshLessCache() {
    if (this.lessCache) this.lessCache.setImportPaths(this.getImportPaths());
  }

  getImportPaths() {
    const primaryThemePaths = [];
    const fallbackThemePaths = [];
    for (const themeName of this.getEnabledThemeNames()) {
      const themeStylesheetsPaths = this.getThemeStylesheetsPaths(
        this.resolveTheme(themeName)
      );
      for (let index = 0; index < themeStylesheetsPaths.length; index++) {
        const themePath = themeStylesheetsPaths[index];
        if (themePath && fs.isDirectorySync(themePath)) {
          if (index === 0) {
            primaryThemePaths.push(themePath);
          } else {
            fallbackThemePaths.push(themePath);
          }
        }
      }
    }
    return primaryThemePaths.concat(fallbackThemePaths);
  }
};
