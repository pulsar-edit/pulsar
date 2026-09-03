const path = require('path');
const fs = require('fs-plus');

// A normalized, read-only description of a single selectable theme.
//
// It represents both a "variant" declared in a package's `themes` array and a
// classic single-theme package, and it works whether or not the underlying
// package is currently loaded (`pack` may be null when the description was built
// from on-disk metadata). Keeping every theme behind this one shape means the
// theme manager never has to duck-type what it is looking at.
module.exports = class ThemeVariant {
  constructor({ pack = null, packageName, packagePath, metadata, variant = null }) {
    this.pack = pack;
    this.variant = variant;
    const baseMetadata = metadata || (pack ? pack.metadata : {}) || {};
    this.packageName = packageName || (pack ? pack.name : baseMetadata.name);
    this.packagePath = packagePath || (pack ? pack.path : undefined);
    if (variant) {
      this.name = variant.name;
      this.metadata = Object.assign({}, baseMetadata, variant, {
        name: variant.name,
        theme: variant.theme || variant.type
      });
    } else {
      this.name = baseMetadata.name || this.packageName;
      this.metadata = baseMetadata;
    }
  }

  isTheme() {
    return true;
  }

  getType() {
    return 'theme';
  }

  getStyleSheetPriority() {
    return 1;
  }

  get bundledPackage() {
    return this.pack ? this.pack.bundledPackage : false;
  }

  reloadStylesheets() {
    try {
      this.pack.themeManager.reloadActiveThemeStylesheets();
    } catch (error) {
      this.pack.handleError(
        `Failed to reload the ${this.name} theme stylesheets`,
        error
      );
    }
  }

  getStylesheetsPath() {
    return this.getStylesheetsPaths()[0];
  }

  getStylesheetsPaths() {
    const stylesheetsPath =
      this.metadata.stylesheetsPath || this.metadata.styleSheetsPath;
    if (stylesheetsPath) {
      const stylesheetsPaths = normalizeStylesheetsPaths(
        this.packagePath,
        stylesheetsPath
      );
      // A variant may `@import` shared files that live in the package's default
      // `styles` folder, so keep it available as a fallback import path.
      if (this.variant) {
        const packageStylesheetsPath = this.getPackageStylesheetsPath();
        if (!stylesheetsPaths.includes(packageStylesheetsPath)) {
          stylesheetsPaths.push(packageStylesheetsPath);
        }
      }
      return stylesheetsPaths;
    }
    return [this.getPackageStylesheetsPath()];
  }

  getPackageStylesheetsPath() {
    if (this.pack) {
      return this.pack.getStylesheetsPath();
    }
    const deprecatedPath = path.join(this.packagePath, 'stylesheets');
    if (fs.isDirectorySync(deprecatedPath)) {
      return deprecatedPath;
    }
    return path.join(this.packagePath, 'styles');
  }

  getStylesheetPaths() {
    let stylesheetPaths;
    if (this.metadata.mainStyleSheet) {
      stylesheetPaths = [
        fs.resolve(this.packagePath, this.metadata.mainStyleSheet)
      ];
    } else if (this.metadata.styleSheets) {
      const stylesheetDirPath = this.getStylesheetsPath();
      stylesheetPaths = this.metadata.styleSheets.map(name =>
        fs.resolve(stylesheetDirPath, name, ['css', 'less', ''])
      );
    } else {
      const stylesheetDirPath = this.getStylesheetsPath();
      stylesheetPaths = [
        fs.resolve(stylesheetDirPath, 'index', ['css', 'less'])
      ];
    }
    return stylesheetPaths.filter(stylesheetPath => stylesheetPath);
  }
};

function normalizeStylesheetsPaths(packagePath, stylesheetsPath) {
  const stylesheetsPaths = Array.isArray(stylesheetsPath)
    ? stylesheetsPath
    : [stylesheetsPath];
  return stylesheetsPaths.map(stylesheetPath =>
    path.join(packagePath, stylesheetPath)
  );
}
