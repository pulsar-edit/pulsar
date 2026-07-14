const path = require("path");
const fs = require("@lumine-code/fs-plus");

const UIWatcher = require("../lib/ui-watcher");

const { conditionPromise, timeoutPromise: wait } = require("./async-spec-helpers");

// The active theme pair is derived from the mode and the light/dark pairs;
// set both so the active pair is the given list regardless of mode.
function setActiveThemes(names) {
  atom.config.set("theme.light", names);
  atom.config.set("theme.dark", names);
}

describe("UIWatcher", () => {
  let uiWatcher = null;

  beforeEach(() => atom.packages.packageDirPaths.push(path.join(__dirname, "fixtures")));

  afterEach(() => uiWatcher && uiWatcher.destroy());

  describe("when a base stylesheet file changes", () => {
    beforeEach(() => {
      uiWatcher = new UIWatcher();
    });

    it("reloads all the base styles", async () => {
      jasmine.useRealClock();
      spyOn(atom.themes, "reloadBaseStylesheets");

      const baseStylesheetPaths = atom.themes.getBaseStylesheetFilePaths();
      expect(uiWatcher.baseTheme.entities.map((entity) => entity.getPath())).toEqual(
        baseStylesheetPaths,
      );
      expect(baseStylesheetPaths.every((filePath) => path.extname(filePath) === ".css")).toBe(true);

      uiWatcher.baseTheme.entities[0].emitter.emit("did-change");
      await conditionPromise(() => {
        return atom.themes.reloadBaseStylesheets.callCount > 0;
      });
    });
  });

  it("watches all the style sheets in the theme's styles folder", async () => {
    const packagePath = path.join(__dirname, "fixtures", "package-with-styles-folder");

    await atom.packages.activatePackage(packagePath);
    uiWatcher = new UIWatcher();

    const lastWatcher = uiWatcher.watchers[uiWatcher.watchers.length - 1];

    expect(lastWatcher.entities.length).toBe(4);
    expect(lastWatcher.entities[0].getPath()).toBe(path.join(packagePath, "styles"));
    expect(lastWatcher.entities[1].getPath()).toBe(path.join(packagePath, "styles", "3.css"));
    expect(lastWatcher.entities[2].getPath()).toBe(
      path.join(packagePath, "styles", "sub", "1.css"),
    );
    expect(lastWatcher.entities[3].getPath()).toBe(
      path.join(packagePath, "styles", "sub", "2.less"),
    );
  });

  it("starts watching a stylesheet added after activation", async () => {
    jasmine.useRealClock();
    const packagePath = path.join(__dirname, "fixtures", "package-with-styles-folder");
    const addedStylesheetPath = path.join(packagePath, "styles", "added.css");
    fs.removeSync(addedStylesheetPath);

    try {
      await atom.packages.activatePackage(packagePath);
      uiWatcher = new UIWatcher();

      const pack = atom.packages.getActivePackage("package-with-styles-folder");
      const watcher = uiWatcher.watchedPackages.get("package-with-styles-folder");
      spyOn(pack, "reloadStylesheets");

      fs.writeFileSync(addedStylesheetPath, ".added {}\n");
      watcher.entities[0].emitter.emit("did-change");

      await conditionPromise(() =>
        watcher.entities.some((entity) => entity.getPath() === addedStylesheetPath),
      );
      await conditionPromise(() => pack.reloadStylesheets.callCount > 0);

      pack.reloadStylesheets.calls.reset();
      const addedStylesheet = watcher.entities.find(
        (entity) => entity.getPath() === addedStylesheetPath,
      );
      addedStylesheet.emitter.emit("did-change");
      await conditionPromise(() => pack.reloadStylesheets.callCount > 0);
    } finally {
      fs.removeSync(addedStylesheetPath);
    }
  });

  describe("when a package stylesheet file changes", async () => {
    beforeEach(async () => {
      await atom.packages.activatePackage(
        path.join(__dirname, "fixtures", "package-with-styles-manifest"),
      );
      uiWatcher = new UIWatcher();
    });

    it("reloads all package styles", async () => {
      jasmine.useRealClock();
      const pack = atom.packages.getActivePackages()[0];
      spyOn(pack, "reloadStylesheets");

      uiWatcher.watchers[uiWatcher.watchers.length - 1].entities[1].emitter.emit("did-change");
      await conditionPromise(() => pack.reloadStylesheets.callCount > 0);

      expect(pack.reloadStylesheets).toHaveBeenCalled();
    });

    it("coalesces rapid filesystem events into one reload", async () => {
      jasmine.useRealClock();
      const pack = atom.packages.getActivePackages()[0];
      spyOn(pack, "reloadStylesheets");

      const entity = uiWatcher.watchers[uiWatcher.watchers.length - 1].entities[1];
      entity.emitter.emit("did-change");
      entity.emitter.emit("did-change");
      entity.emitter.emit("did-rename");

      await conditionPromise(() => pack.reloadStylesheets.callCount > 0);
      await wait(50);
      expect(pack.reloadStylesheets.callCount).toBe(1);
    });
  });

  describe("when a package does not have a stylesheet", () => {
    beforeEach(async () => {
      await atom.packages.activatePackage("package-with-index");
      uiWatcher = new UIWatcher();
    });

    it("does not create a PackageWatcher", () => {
      expect(uiWatcher.watchedPackages["package-with-index"]).toBeUndefined();
    });
  });

  describe("when a package global file changes", () => {
    beforeEach(async () => {
      jasmine.useRealClock();
      setActiveThemes(["theme-with-ui-variables", "theme-with-multiple-imported-files"]);

      console.log("awaiting…");
      await atom.themes.activateThemes();
      console.log("…awaited.");
      uiWatcher = new UIWatcher();
    });

    afterEach(() => atom.themes.deactivateThemes());

    it("reloads every package when the variables file changes", async () => {
      let varEntity;
      for (const theme of atom.themes.getActiveThemes()) {
        spyOn(theme, "reloadStylesheets");
      }

      for (const entity of uiWatcher.watchedThemes.get("theme-with-multiple-imported-files")
        .entities) {
        if (entity.getPath().indexOf("variables") > -1) varEntity = entity;
      }
      varEntity.emitter.emit("did-change");
      await conditionPromise(() => {
        return atom.themes.getActiveThemes().every((t) => {
          return t.reloadStylesheets.callCount > 0;
        });
      });
      await wait(50);
      for (const theme of atom.themes.getActiveThemes()) {
        expect(theme.reloadStylesheets.callCount).toBe(1);
      }
    });
  });

  describe("watcher lifecycle", () => {
    it("starts watching a package if it is activated after initial startup", async () => {
      uiWatcher = new UIWatcher();
      expect(uiWatcher.watchedPackages.size).toBe(0);

      await atom.packages.activatePackage(
        path.join(__dirname, "fixtures", "package-with-styles-folder"),
      );
      expect(uiWatcher.watchedPackages.get("package-with-styles-folder")).not.toBeUndefined();
    });

    it("unwatches a package after it is deactivated", async () => {
      await atom.packages.activatePackage(
        path.join(__dirname, "fixtures", "package-with-styles-folder"),
      );
      uiWatcher = new UIWatcher();
      const watcher = uiWatcher.watchedPackages.get("package-with-styles-folder");
      expect(watcher).not.toBeUndefined();

      const watcherDestructionSpy = jasmine.createSpy("watcher-on-did-destroy");
      watcher.onDidDestroy(watcherDestructionSpy);

      await atom.packages.deactivatePackage("package-with-styles-folder");
      expect(uiWatcher.watchedPackages.get("package-with-styles-folder")).toBeUndefined();
      expect(uiWatcher.watchedPackages.size).toBe(0);
      expect(watcherDestructionSpy).toHaveBeenCalled();
    });

    it("does not watch activated packages after the UI watcher has been destroyed", async () => {
      uiWatcher = new UIWatcher();
      uiWatcher.destroy();

      await atom.packages.activatePackage(
        path.join(__dirname, "fixtures", "package-with-styles-folder"),
      );
      expect(uiWatcher.watchedPackages.size).toBe(0);
    });
  });

  describe("minimal theme packages", () => {
    let cssTheme = null;
    let lessTheme = null;
    beforeEach(async () => {
      jasmine.useRealClock();
      setActiveThemes(["theme-with-index-css", "theme-with-index-less"]);
      await atom.themes.activateThemes();
      uiWatcher = new UIWatcher();
      cssTheme = atom.themes
        .getActiveThemes()
        .find((theme) => theme.name === "theme-with-index-css");
      lessTheme = atom.themes
        .getActiveThemes()
        .find((theme) => theme.name === "theme-with-index-less");
      await wait(50);
    });

    afterEach(async () => {
      atom.themes.deactivateThemes();
      await wait(50);
    });

    it("watches CSS and Less themes without a styles directory", async () => {
      spyOn(cssTheme, "reloadStylesheets");
      spyOn(lessTheme, "reloadStylesheets");
      spyOn(atom.themes, "reloadBaseStylesheets");

      const cssWatcher = uiWatcher.watchedThemes.get("theme-with-index-css");
      const lessWatcher = uiWatcher.watchedThemes.get("theme-with-index-less");

      expect(cssWatcher.entities.map((entity) => path.basename(entity.getPath()))).toEqual([
        "index.css",
      ]);
      expect(lessWatcher.entities.map((entity) => path.basename(entity.getPath()))).toEqual([
        "index.less",
      ]);

      cssWatcher.entities[0].emitter.emit("did-change");
      lessWatcher.entities[0].emitter.emit("did-change");
      await conditionPromise(
        () => cssTheme.reloadStylesheets.callCount > 0 && lessTheme.reloadStylesheets.callCount > 0,
      );
      expect(atom.themes.reloadBaseStylesheets).not.toHaveBeenCalled();
    });
  });

  describe("theme packages", () => {
    let pack = null;
    beforeEach(async () => {
      jasmine.useRealClock();
      setActiveThemes(["theme-with-syntax-variables", "theme-with-multiple-imported-files"]);

      await atom.themes.activateThemes();
      uiWatcher = new UIWatcher();
      pack = atom.themes.getActiveThemes()[0];
    });

    afterEach(() => atom.themes.deactivateThemes());

    it("reloads the theme when anything within the theme changes", async () => {
      spyOn(pack, "reloadStylesheets");
      spyOn(atom.themes, "reloadBaseStylesheets");

      const watcher = uiWatcher.watchedThemes.get("theme-with-multiple-imported-files");

      expect(watcher.entities.length).toBe(6);

      watcher.entities[2].emitter.emit("did-change");
      await conditionPromise(() => pack.reloadStylesheets.callCount > 0);
      expect(pack.reloadStylesheets).toHaveBeenCalled();
      expect(atom.themes.reloadBaseStylesheets).not.toHaveBeenCalled();

      watcher.entities[watcher.entities.length - 1].emitter.emit("did-change");
      await conditionPromise(() => atom.themes.reloadBaseStylesheets.callCount > 0);
    });

    it("unwatches when a theme is deactivated", async () => {
      jasmine.useRealClock();

      setActiveThemes([]);
      await conditionPromise(() => !uiWatcher.watchedThemes["theme-with-multiple-imported-files"]);
    });

    it("watches a new theme when it is deactivated", async () => {
      jasmine.useRealClock();

      setActiveThemes(["theme-with-syntax-variables", "theme-with-package-file"]);
      await conditionPromise(() => uiWatcher.watchedThemes.get("theme-with-package-file"));

      pack = atom.themes.getActiveThemes()[0];
      spyOn(pack, "reloadStylesheets");

      expect(pack.name).toBe("theme-with-package-file");

      const watcher = uiWatcher.watchedThemes.get("theme-with-package-file");
      watcher.entities[2].emitter.emit("did-change");
      await conditionPromise(() => pack.reloadStylesheets.callCount > 0);
    });
  });
});
