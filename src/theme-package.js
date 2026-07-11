const path = require("path");
const fs = require("fs-plus");
const Package = require("./package");

module.exports = class ThemePackage extends Package {
  // A theme provided by a multi-theme package (a `themes` array in
  // package.json) lives in one or more styles directories inside the owning
  // package — shared directories first, the theme's own directory (holding
  // its variables.css) last.
  constructor(options) {
    super(options);
    this.themeStylesDirectories = options.themeStylesDirectories ?? null;
  }

  getType() {
    return "theme";
  }

  getStyleSheetPriority() {
    return 1;
  }

  getStylesheetsPath() {
    if (this.themeStylesDirectories != null) {
      return this.themeStylesDirectories[this.themeStylesDirectories.length - 1];
    }
    return super.getStylesheetsPath();
  }

  getStylesheetPaths() {
    if (this.themeStylesDirectories != null) {
      const stylesheetPaths = [];
      for (const directory of this.themeStylesDirectories) {
        stylesheetPaths.push(...fs.listSync(directory, ["css", "less"]).sort());
      }
      return stylesheetPaths;
    }
    return super.getStylesheetPaths();
  }

  // Use this theme in the mode currently in effect, replacing any existing
  // theme of the same type (ui/syntax) in that mode's pair.
  enable() {
    const keyPath = this.themeManager.getActiveThemesKeyPath();
    let themes = this.config.get(keyPath);
    themes = Array.isArray(themes) ? themes.slice() : [];
    themes = themes.filter(
      (name) => name !== this.name && this.themeManager.getThemeType(name) !== this.metadata.theme,
    );
    themes.unshift(this.name);
    this.config.set(keyPath, themes);
  }

  // Stop using this theme in either mode's pair.
  disable() {
    for (const keyPath of ["theme.light", "theme.dark"]) {
      const themes = this.config.get(keyPath);
      if (Array.isArray(themes) && themes.includes(this.name)) {
        this.config.set(
          keyPath,
          themes.filter((name) => name !== this.name),
        );
      }
    }
  }

  preload() {
    this.loadTime = 0;
    this.configSchemaRegisteredOnLoad = this.registerConfigSchemaFromMetadata();
  }

  finishLoading() {
    this.path = path.join(this.packageManager.resourcePath, this.path);
  }

  load() {
    this.loadTime = 0;
    this.configSchemaRegisteredOnLoad = this.registerConfigSchemaFromMetadata();
    return this;
  }

  activate() {
    if (this.activationPromise == null) {
      this.activationPromise = new Promise((resolve, reject) => {
        this.resolveActivationPromise = resolve;
        this.rejectActivationPromise = reject;
        this.measure("activateTime", () => {
          try {
            this.loadStylesheets();
            this.activateNow();
          } catch (error) {
            this.handleError(`Failed to activate the ${this.name} theme`, error);
          }
        });
      });
    }

    return this.activationPromise;
  }
};
