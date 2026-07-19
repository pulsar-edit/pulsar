const path = require("path");
const fs = require("@lumine-code/fs-plus");
const temp = require("temp").track();

const { conditionPromise: waitForCondition } = require("./helpers/async-spec-helpers");

// The active theme pair is derived from `theme.mode` + `theme.light`/
// `theme.dark`. Set both pairs so the active pair is the given list regardless
// of the mode currently in effect.
function setActiveThemes(names) {
  atom.config.set("theme.light", names);
  atom.config.set("theme.dark", names);
}

describe("atom.themes", () => {
  beforeEach(() => {
    jasmine.useRealClock();
    spyOn(atom, "inSpecMode").and.returnValue(false);
    spyOn(console, "warn");
  });

  afterEach(async () => {
    await atom.themes.deactivateThemes();
    try {
      temp.cleanupSync();
    } catch {
      // Temp cleanup is best-effort.
    }
  });

  describe("theme getters and setters", () => {
    beforeEach(() => {
      jasmine.snapshotDeprecations();
      atom.packages.loadPackages();
    });

    afterEach(() => jasmine.restoreDeprecationsSnapshot());

    describe("getLoadedThemes", () =>
      it("gets all the loaded themes", () => {
        const themes = atom.themes.getLoadedThemes();
        expect(themes.length).toBeGreaterThan(2);
      }));

    describe("getActiveThemes", () =>
      it("gets all the active themes", async function () {
        await atom.themes.activateThemes();

        const names = atom.config.get(atom.themes.getActiveThemesKeyPath());
        expect(names.length).toBeGreaterThan(0);
        const themes = atom.themes.getActiveThemes();
        expect(themes).toHaveLength(names.length);
      }));
  });

  describe("when the active theme pair contains invalid entries", () => {
    it("ignores them", () => {
      setActiveThemes([
        "theme-with-ui-variables",
        null,
        undefined,
        "",
        false,
        4,
        {},
        [],
        "theme-with-syntax-variables",
      ]);

      expect(atom.themes.getEnabledThemeNames()).toEqual([
        "theme-with-syntax-variables",
        "theme-with-ui-variables",
      ]);
    });
  });

  describe("when the active theme pair contains only one theme", () => {
    it("runs the configured half alone without auto-completing the pair", () => {
      setActiveThemes(["theme-modern-ui"]);
      expect(atom.themes.getEnabledThemeNames()).toEqual(["theme-modern-ui"]);
    });
  });

  describe("::getImportPaths()", () => {
    it("returns the theme directories before the themes are loaded", () => {
      setActiveThemes([
        "theme-with-index-less",
        "theme-with-ui-variables",
        "theme-with-syntax-variables",
      ]);

      const paths = atom.themes.getImportPaths();

      // theme-with-index-less has no styles directory at this time, so only two.
      expect(paths.length).toBe(2);
      expect(paths[0]).toContain("theme-with-syntax-variables");
      expect(paths[1]).toContain("theme-with-ui-variables");
    });

    it("ignores themes that cannot be resolved to a directory", () => {
      setActiveThemes(["definitely-not-a-theme"]);
      expect(() => atom.themes.getImportPaths()).not.toThrow();
    });
  });

  describe("when the active theme pair changes", () => {
    it("add/removes stylesheets to reflect the new config value", async () => {
      jasmine.useRealClock();
      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);
      spyOn(atom.styles, "getUserStyleSheetPath").and.callFake(() => null);

      await atom.themes.activateThemes();
      didChangeActiveThemesHandler.calls.reset();
      setActiveThemes([]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() === 1;
      });

      didChangeActiveThemesHandler.calls.reset();
      expect(document.querySelectorAll("style.theme")).toHaveLength(0);
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(0);
      setActiveThemes(["theme-with-ui-variables"]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() === 1;
      });

      didChangeActiveThemesHandler.calls.reset();
      // The legacy theme's stylesheet plus the custom-properties bridge
      // compiled from its Less variables.
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(2);
      expect(
        document.querySelectorAll('style[priority="1"]')[0].getAttribute("source-path"),
      ).toMatch(/custom-properties-bridge/);
      expect(
        document.querySelectorAll('style[priority="1"]')[1].getAttribute("source-path"),
      ).toMatch(/theme-with-ui-variables/);
      setActiveThemes(["theme-with-syntax-variables", "theme-with-ui-variables"]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() === 1;
      });

      didChangeActiveThemesHandler.calls.reset();
      // Both legacy theme stylesheets plus the bridge; the first configured
      // theme is attached last so that it wins.
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(3);
      expect(
        document.querySelectorAll('style[priority="1"]')[1].getAttribute("source-path"),
      ).toMatch(/theme-with-ui-variables/);
      expect(
        document.querySelectorAll('style[priority="1"]')[2].getAttribute("source-path"),
      ).toMatch(/theme-with-syntax-variables/);
      setActiveThemes([]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() === 1;
      });

      didChangeActiveThemesHandler.calls.reset();
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(0);

      // theme-with-ui-variables has a styles directory, theme-with-index-less doesn't
      setActiveThemes(["theme-with-index-less", "theme-with-ui-variables"]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() === 1;
      });

      // Two theme stylesheets plus the bridge.
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(3);

      const importPaths = atom.themes.getImportPaths();
      expect(importPaths.length).toBe(1);
      expect(importPaths[0]).toContain("theme-with-ui-variables");
    });

    it("adds theme-* classes to the workspace for each active theme", async () => {
      setActiveThemes(["theme-modern-ui", "theme-modern-syntax"]);

      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);

      await atom.themes.activateThemes();

      const workspaceElement = atom.workspace.getElement();
      expect(workspaceElement).toHaveClass("theme-theme-modern-ui");

      atom.themes.onDidChangeActiveThemes((didChangeActiveThemesHandler = jasmine.createSpy()));
      setActiveThemes(["theme-with-ui-variables", "theme-with-syntax-variables"]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() > 0;
      });

      // `theme-` twice as it prefixes the name with `theme-`
      expect(workspaceElement).toHaveClass("theme-theme-with-ui-variables");
      expect(workspaceElement).toHaveClass("theme-theme-with-syntax-variables");
      expect(workspaceElement).not.toHaveClass("theme-theme-modern-ui");
      expect(workspaceElement).not.toHaveClass("theme-theme-modern-syntax");
    });
  });

  describe("when the theme.mode config value changes", () => {
    let systemThemeQuery, systemThemeListeners;

    beforeEach(() => {
      jasmine.useRealClock();
      systemThemeListeners = [];
      systemThemeQuery = {
        matches: true,
        addEventListener(event, listener) {
          systemThemeListeners.push(listener);
        },
      };
      atom.themes.systemThemeQuery = systemThemeQuery;
      atom.config.set("theme.light", ["theme-modern-ui", "theme-modern-syntax"]);
      atom.config.set("theme.dark", ["theme-with-ui-variables", "theme-with-syntax-variables"]);
    });

    async function waitForThemeChange(fn) {
      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);
      fn();
      await waitForCondition(() => didChangeActiveThemesHandler.calls.count() === 1);
    }

    it("applies the pair matching the mode and follows the system preference", async () => {
      atom.config.set("theme.mode", "system");
      await atom.themes.activateThemes();

      // system + matches:true -> dark pair
      expect(atom.themes.getActiveThemeNames()).toContain("theme-with-ui-variables");

      await waitForThemeChange(() => atom.config.set("theme.mode", "light"));
      expect(atom.themes.getActiveThemeNames()).toContain("theme-modern-ui");

      await waitForThemeChange(() => atom.config.set("theme.mode", "dark"));
      expect(atom.themes.getActiveThemeNames()).toContain("theme-with-ui-variables");

      // In system mode, an OS preference change switches the pair.
      systemThemeQuery.matches = false;
      await waitForThemeChange(() => atom.config.set("theme.mode", "system"));
      expect(atom.themes.getActiveThemeNames()).toContain("theme-modern-ui");

      await waitForThemeChange(() => {
        systemThemeQuery.matches = true;
        for (const listener of systemThemeListeners) listener();
      });
      expect(atom.themes.getActiveThemeNames()).toContain("theme-with-ui-variables");
    });

    it("switches when the pair for the active mode changes", async () => {
      atom.config.set("theme.mode", "dark");
      await atom.themes.activateThemes();
      expect(atom.themes.getActiveThemeNames()).toContain("theme-with-ui-variables");

      await waitForThemeChange(() =>
        atom.config.set("theme.dark", ["theme-modern-ui", "theme-modern-syntax"]),
      );
      expect(atom.themes.getActiveThemeNames()).toContain("theme-modern-ui");
    });

    it("ignores changes to the pair for the inactive mode", async () => {
      atom.config.set("theme.mode", "dark");
      await atom.themes.activateThemes();

      const handler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(handler);
      // Changing the light pair while in dark mode does not switch.
      atom.config.set("theme.light", ["theme-modern-ui", "theme-modern-syntax"]);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("when a theme fails to load", () =>
    it("logs a warning", () => {
      console.warn.calls.reset();
      atom.packages.activatePackage("a-theme-that-will-not-be-found").then(
        () => {},
        () => {},
      );
      expect(console.warn.calls.count()).toBe(1);
      expect(console.warn.calls.argsFor(0)[0]).toContain(
        "Could not resolve 'a-theme-that-will-not-be-found'",
      );
    }));

  describe("::requireStylesheet(path)", () => {
    beforeEach(() => jasmine.snapshotDeprecations());

    afterEach(() => jasmine.restoreDeprecationsSnapshot());

    it("synchronously loads css at the given path and installs a style tag for it in the head", () => {
      let styleElementAddedHandler;
      atom.styles.onDidAddStyleElement(
        (styleElementAddedHandler = jasmine.createSpy("styleElementAddedHandler")),
      );

      const cssPath = getAbsolutePath(atom.project.getDirectories()[0], "css.css");
      const lengthBefore = document.querySelectorAll("head style").length;

      atom.themes.requireStylesheet(cssPath);
      expect(document.querySelectorAll("head style").length).toBe(lengthBefore + 1);

      expect(styleElementAddedHandler).toHaveBeenCalled();

      const element = document.querySelector('head style[source-path*="css.css"]');
      expect(element.getAttribute("source-path")).toEqualPath(cssPath);
      expect(element.textContent).toBe(fs.readFileSync(cssPath, "utf8"));

      // doesn't append twice
      styleElementAddedHandler.calls.reset();
      atom.themes.requireStylesheet(cssPath);
      expect(document.querySelectorAll("head style").length).toBe(lengthBefore + 1);
      expect(styleElementAddedHandler).not.toHaveBeenCalled();

      document.querySelectorAll('head style[id*="css.css"]').forEach((styleElement) => {
        styleElement.remove();
      });
    });

    it("synchronously loads and parses less files at the given path and installs a style tag for it in the head", () => {
      const lessPath = getAbsolutePath(atom.project.getDirectories()[0], "sample.less");
      const lengthBefore = document.querySelectorAll("head style").length;
      atom.themes.requireStylesheet(lessPath);
      expect(document.querySelectorAll("head style").length).toBe(lengthBefore + 1);

      const element = document.querySelector('head style[source-path*="sample.less"]');
      expect(element.getAttribute("source-path")).toEqualPath(lessPath);
      expect(element.textContent.toLowerCase()).toBe(`\
#header {
  color: #4d926f;
}
h2 {
  color: #4d926f;
}
\
`);

      // doesn't append twice
      atom.themes.requireStylesheet(lessPath);
      expect(document.querySelectorAll("head style").length).toBe(lengthBefore + 1);
      document.querySelectorAll('head style[id*="sample.less"]').forEach((styleElement) => {
        styleElement.remove();
      });
    });

    it("supports requiring css and less stylesheets without an explicit extension", () => {
      atom.themes.requireStylesheet(path.join(__dirname, "fixtures", "css"));
      expect(
        document.querySelector('head style[source-path*="css.css"]').getAttribute("source-path"),
      ).toEqualPath(getAbsolutePath(atom.project.getDirectories()[0], "css.css"));
      atom.themes.requireStylesheet(path.join(__dirname, "fixtures", "sample"));
      expect(
        document
          .querySelector('head style[source-path*="sample.less"]')
          .getAttribute("source-path"),
      ).toEqualPath(getAbsolutePath(atom.project.getDirectories()[0], "sample.less"));

      document.querySelector('head style[source-path*="css.css"]').remove();
      document.querySelector('head style[source-path*="sample.less"]').remove();
    });

    it("returns a disposable allowing styles applied by the given path to be removed", () => {
      const cssPath = require.resolve("./fixtures/css.css");

      expect(getComputedStyle(document.body).fontWeight).not.toBe("700");
      const disposable = atom.themes.requireStylesheet(cssPath);
      expect(getComputedStyle(document.body).fontWeight).toBe("700");

      let styleElementRemovedHandler;
      atom.styles.onDidRemoveStyleElement(
        (styleElementRemovedHandler = jasmine.createSpy("styleElementRemovedHandler")),
      );

      disposable.dispose();

      expect(getComputedStyle(document.body).fontWeight).not.toBe("bold");

      expect(styleElementRemovedHandler).toHaveBeenCalled();
    });
  });

  describe("base style sheet loading", () => {
    beforeEach(async () => {
      jasmine.useRealClock();
      const workspaceElement = atom.workspace.getElement();
      jasmine.attachToDOM(atom.workspace.getElement());
      workspaceElement.appendChild(document.createElement("atom-text-editor"));
      await atom.themes.activateThemes();
    });

    it("loads the correct values from the theme's ui-variables file", async () => {
      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);
      setActiveThemes(["theme-with-ui-variables", "theme-with-syntax-variables"]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() > 0;
      });

      // an override loaded in the base css
      expect(getComputedStyle(atom.workspace.getElement())["background-color"]).toBe(
        "rgb(0, 0, 255)",
      );

      // from within the theme itself
      expect(getComputedStyle(document.querySelector("atom-text-editor")).paddingTop).toBe("150px");
      expect(getComputedStyle(document.querySelector("atom-text-editor")).paddingRight).toBe(
        "150px",
      );
      expect(getComputedStyle(document.querySelector("atom-text-editor")).paddingBottom).toBe(
        "150px",
      );
    });

    describe("when there is a theme with incomplete variables", () => {
      it("loads the correct values from the fallback ui-variables", async () => {
        let didChangeActiveThemesHandler = jasmine.createSpy();
        atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);

        setActiveThemes(["theme-with-incomplete-ui-variables", "theme-with-syntax-variables"]);

        await waitForCondition(() => {
          return didChangeActiveThemesHandler.calls.count() > 0;
        });

        // an override loaded in the base css
        expect(getComputedStyle(atom.workspace.getElement())["background-color"]).toBe(
          "rgb(0, 0, 255)",
        );

        // from within the theme itself
        expect(getComputedStyle(document.querySelector("atom-text-editor")).backgroundColor).toBe(
          "rgb(0, 152, 255)",
        );
      });
    });
  });

  describe("user stylesheet", () => {
    let userStylesheetPath;
    beforeEach(async () => {
      userStylesheetPath = path.join(temp.mkdirSync("atom"), "styles.less");
      fs.writeFileSync(userStylesheetPath, "body {border-style: dotted !important;}");
      spyOn(atom.styles, "getUserStyleSheetPath").and.returnValue(userStylesheetPath);
    });

    describe("when the user stylesheet changes", () => {
      beforeEach(() => jasmine.snapshotDeprecations());

      afterEach(() => jasmine.restoreDeprecationsSnapshot());

      it("reloads it", async () => {
        jasmine.useRealClock();

        await atom.themes.activateThemes();
        let styleElementRemovedHandler = jasmine.createSpy("styleElementRemovedHandler");
        let styleElementUpdatedHandler = jasmine.createSpy("styleElementUpdatedHandler");
        atom.styles.onDidRemoveStyleElement(styleElementRemovedHandler);
        atom.styles.onDidUpdateStyleElement(styleElementUpdatedHandler);

        spyOn(atom.themes, "loadUserStylesheet").and.callThrough();

        expect(getComputedStyle(document.body).borderStyle).toBe("dotted");

        fs.writeFileSync(userStylesheetPath, "body {border-style: dashed}");

        await waitForCondition(() => {
          return getComputedStyle(document.body).borderStyle === "dashed";
        });

        // The style element is updated in place rather than removed and
        // re-added, so the user styles never leave the DOM.
        expect(styleElementRemovedHandler).not.toHaveBeenCalled();
        expect(styleElementUpdatedHandler).toHaveBeenCalled();
        expect(styleElementUpdatedHandler.calls.argsFor(0)[0].textContent).toContain("dashed");

        fs.removeSync(userStylesheetPath);

        await waitForCondition(() => {
          return getComputedStyle(document.body).borderStyle === "none";
        });

        expect(styleElementRemovedHandler).toHaveBeenCalled();
      });
    });

    describe("when there is an error reading the stylesheet", () => {
      let addErrorHandler = null;
      beforeEach(async () => {
        addErrorHandler = jasmine.createSpy();
        await atom.themes.loadUserStylesheet();
        spyOn(atom.themes.lessCache, "cssForFile").and.callFake(() => {
          throw new Error('EACCES permission denied "styles.less"');
        });
        atom.notifications.onDidAddNotification(addErrorHandler);
      });

      it("creates an error notification and keeps the previous stylesheet", async () => {
        await atom.themes.loadUserStylesheet();
        expect(addErrorHandler).toHaveBeenCalled();
        const note = addErrorHandler.calls.mostRecent().args[0];
        expect(note.getType()).toBe("error");
        expect(note.getMessage()).toContain("Error loading");
        const styleElement =
          atom.styles.styleElementsBySourcePath[atom.styles.getUserStyleSheetPath()];
        expect(styleElement).not.toBeUndefined();
        expect(styleElement.textContent).toContain("dotted");
      });
    });

    describe("when there is an error watching the user stylesheet", () => {
      let addErrorHandler = null;

      beforeEach(() => {
        addErrorHandler = jasmine.createSpy();
        const watcher = require("../src/path-watcher");
        spyOn(watcher, "watchPath").and.callFake(() => {
          throw new Error("Unable to watch path");
        });
        spyOn(atom.themes, "loadStylesheet").and.returnValue("");
        atom.notifications.onDidAddNotification(addErrorHandler);
      });

      it("creates an error notification", async () => {
        await atom.themes.loadUserStylesheet();
        expect(addErrorHandler).toHaveBeenCalled();
        const note = addErrorHandler.calls.mostRecent()?.args[0];
        expect(note?.getType()).toBe("error");
        expect(note?.getMessage()).toContain("Unable to watch path");
      });
    });

    it("adds a notification when a theme's stylesheet is invalid", () => {
      const addErrorHandler = jasmine.createSpy();
      atom.notifications.onDidAddNotification(addErrorHandler);
      expect(() =>
        atom.packages.activatePackage("theme-with-invalid-styles").then(
          () => {},
          () => {},
        ),
      ).not.toThrow();
      expect(addErrorHandler.calls.count()).toBe(2);
      expect(addErrorHandler.calls.argsFor(1)[0].message).toContain(
        "Failed to activate the theme-with-invalid-styles theme",
      );
    });
  });

  describe("when a non-existent theme is present in the config", () => {
    beforeEach(async () => {
      console.warn.calls.reset();
      atom.packages.loadPackage("one-theme");
      atom.themes.systemThemeQuery = { matches: true, addEventListener() {} };
      setActiveThemes(["non-existent-dark-ui", "non-existent-dark-syntax"]);

      await atom.themes.activateThemes();
    });

    it("uses the bundled night UI and syntax themes and logs a warning", () => {
      const activeThemeNames = atom.themes.getActiveThemeNames();
      expect(console.warn.calls.count()).toBe(2);
      expect(activeThemeNames.length).toBe(2);
      expect(activeThemeNames).toContain("one-night-ui");
      expect(activeThemeNames).toContain("one-night-syntax");
    });
  });

  describe("when in safe mode", () => {
    beforeEach(() => {
      atom.packages.loadPackage("one-theme");
      atom.themes.systemThemeQuery = { matches: true, addEventListener() {} };
    });

    describe("when the enabled UI and syntax themes are installed", () => {
      beforeEach(async () => {
        setActiveThemes(["one-day-ui", "one-night-syntax"]);

        await atom.themes.activateThemes();
      });

      it("uses the enabled themes", () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames.length).toBe(2);
        expect(activeThemeNames).toContain("one-day-ui");
        expect(activeThemeNames).toContain("one-night-syntax");
      });
    });

    describe("when neither enabled theme is installed", () => {
      beforeEach(async () => {
        setActiveThemes(["installed-dark-ui", "installed-dark-syntax"]);

        await atom.themes.activateThemes();
      });

      it("falls back to the bundled pair for the current mode", () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames.length).toBe(2);
        expect(activeThemeNames).toContain("one-night-ui");
        expect(activeThemeNames).toContain("one-night-syntax");
      });
    });

    describe("when only the enabled syntax theme is installed", () => {
      beforeEach(async () => {
        setActiveThemes(["installed-dark-ui", "one-day-syntax"]);

        await atom.themes.activateThemes();
      });

      it("runs the syntax theme alone without auto-completing the pair", () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames).toEqual(["one-day-syntax"]);
      });
    });

    describe("when only the enabled UI theme is installed", () => {
      beforeEach(async () => {
        setActiveThemes(["one-day-ui", "installed-dark-syntax"]);

        await atom.themes.activateThemes();
      });

      it("runs the UI theme alone without auto-completing the pair", () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames).toEqual(["one-day-ui"]);
      });
    });
  });

  describe("multi-theme packages", () => {
    it("registers each entry of the themes array as a loaded theme package", () => {
      atom.packages.loadPackage("multi-theme-package");

      // The containing package loads as a normal package (so its main and
      // configSchema apply); the entries load as virtual theme packages.
      const container = atom.packages.getLoadedPackage("multi-theme-package");
      expect(container).toBeDefined();
      expect(container.isTheme()).toBeFalsy();

      const uiTheme = atom.packages.getLoadedPackage("multi-alpha-ui");
      const syntaxTheme = atom.packages.getLoadedPackage("multi-alpha-syntax");
      expect(uiTheme).toBeDefined();
      expect(syntaxTheme).toBeDefined();
      expect(uiTheme.isTheme()).toBeTruthy();
      expect(syntaxTheme.isTheme()).toBeTruthy();
      expect(uiTheme.getType()).toBe("theme");
      expect(syntaxTheme.getType()).toBe("theme");
      expect(uiTheme.metadata.theme).toBe("ui");
      expect(syntaxTheme.metadata.theme).toBe("syntax");
    });

    it("activates the provided themes like any other theme", async () => {
      atom.packages.loadPackage("multi-theme-package");
      setActiveThemes(["multi-alpha-ui", "multi-alpha-syntax"]);

      await atom.themes.activateThemes();

      const activeThemeNames = atom.themes.getActiveThemeNames();
      expect(activeThemeNames).toContain("multi-alpha-ui");
      expect(activeThemeNames).toContain("multi-alpha-syntax");

      const workspaceElement = atom.workspace.getElement();
      expect(workspaceElement).toHaveClass("theme-multi-alpha-ui");
      expect(workspaceElement).toHaveClass("theme-multi-alpha-syntax");
    });
  });

  describe("modern themes (CSS custom-property palettes)", () => {
    it("keeps the legacy atom Less import available to community packages", async () => {
      setActiveThemes(["theme-modern-ui", "theme-modern-syntax"]);
      await atom.themes.activateThemes();

      const lessPath = path.join(temp.mkdirSync("atom"), "legacy-import.less");
      fs.writeFileSync(
        lessPath,
        '@import "atom";\n.legacy-import { color: @text-color; background: @syntax-background-color; }',
      );

      const css = atom.themes.loadLessStylesheet(lessPath);
      expect(css).toContain("#123456");
      expect(css).toContain("#654321");
    });

    it("exposes the palette to Less through a generated shim directory", async () => {
      setActiveThemes(["theme-modern-ui", "theme-modern-syntax"]);

      await atom.themes.activateThemes();

      const importPaths = atom.themes.getImportPaths();
      expect(importPaths.some((importPath) => importPath.includes("theme-shims"))).toBe(true);

      const lessPath = path.join(temp.mkdirSync("atom"), "shim-consumer.less");
      fs.writeFileSync(
        lessPath,
        '@import "ui-variables";\n@import "syntax-variables";\n' +
          ".shim-consumer { color: @text-color; background: @syntax-background-color; }",
      );

      const css = atom.themes.loadLessStylesheet(lessPath);
      expect(css).toContain("#123456");
      expect(css).toContain("#654321");
    });

    it("compiles a custom-properties bridge for legacy themes and drops it for modern ones", async () => {
      const findBridgeElement = () =>
        atom.styles
          .getStyleElements()
          .find((element) =>
            (element.getAttribute("source-path") || "").endsWith("custom-properties-bridge.css"),
          );

      setActiveThemes(["theme-with-ui-variables", "theme-with-syntax-variables"]);
      await atom.themes.activateThemes();

      const bridgeElement = findBridgeElement();
      expect(bridgeElement).toBeDefined();
      expect(bridgeElement.textContent).toContain("--text-color:");

      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);
      setActiveThemes(["theme-modern-ui", "theme-modern-syntax"]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.calls.count() > 0;
      });

      expect(findBridgeElement()).toBeUndefined();
    });
  });
});

function getAbsolutePath(directory, relativePath) {
  if (directory) {
    return directory.resolve(relativePath);
  }
}
