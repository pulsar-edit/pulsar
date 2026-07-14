const fs = require("@lumine-code/fs-plus");
const path = require("path");

const Watcher = require("./watcher");

module.exports = class PackageWatcher extends Watcher {
  static supportsPackage(pack, type) {
    if (pack.getType() === type && pack.getStylesheetPaths().length) return true;
    return false;
  }

  constructor(pack) {
    super();
    this.pack = pack;
    this.watch();
  }

  watch() {
    // Themes provided by a multi-theme package draw styles from several
    // directories (shared directories plus the theme's own).
    this.stylesheetsPaths = this.pack.themeStylesDirectories ?? [this.pack.getStylesheetsPath()];

    for (const stylesheetsPath of this.stylesheetsPaths) {
      if (!fs.isDirectorySync(stylesheetsPath)) continue;
      this.watchDirectory(stylesheetsPath, () => this.handleDirectoryChange());
    }

    this.syncStylesheetWatchers();
  }

  syncStylesheetWatchers() {
    const stylesheetPaths = new Set(this.pack.getStylesheetPaths());
    for (const stylesheetsPath of this.stylesheetsPaths) {
      if (!fs.isDirectorySync(stylesheetsPath)) continue;

      const onFile = (stylesheetPath) => {
        if ([".css", ".less"].includes(path.extname(stylesheetPath).toLowerCase())) {
          stylesheetPaths.add(stylesheetPath);
        }
      };
      fs.traverseTreeSync(stylesheetsPath, onFile, () => true);
    }

    const watchedPaths = new Set(
      this.entities.filter((entity) => entity.isFile()).map((entity) => entity.getPath()),
    );
    for (const stylesheetPath of stylesheetPaths) {
      if (!watchedPaths.has(stylesheetPath)) this.watchFile(stylesheetPath);
    }
  }

  handleDirectoryChange() {
    this.syncStylesheetWatchers();
    this.queueReload(false);
  }

  loadStylesheet(pathName) {
    this.queueReload(path.basename(pathName).includes("variables"));
  }

  queueReload(globalsChanged) {
    this.globalsChanged ||= globalsChanged;
    this.scheduleReload(() => {
      if (this.globalsChanged) {
        this.globalsChanged = false;
        this.emitGlobalsChanged();
      } else {
        this.loadAllStylesheets();
      }
    });
  }

  loadAllStylesheets() {
    this.pack.reloadStylesheets();
  }
};
