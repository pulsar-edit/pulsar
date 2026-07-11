const path = require("path");
const fs = require("fs");

const CSON = require("season");

const PackageManager = require("../lib/package-manager");
const ThemesPanel = require("../lib/themes-panel");
const { conditionPromise, timeoutPromise: wait } = require("./async-spec-helpers");

describe("ThemesPanel", function () {
  let [panel, packageManager, reloadedHandler] = [];
  const settingsView = null;

  beforeEach(async () => {
    jasmine.useRealClock();
    atom.packages.loadPackage("atom-light-ui");
    atom.packages.loadPackage("atom-dark-ui");
    atom.packages.loadPackage("atom-light-syntax");
    atom.packages.loadPackage("atom-dark-syntax");
    atom.packages.packageDirPaths.push(path.join(__dirname, "fixtures"));
    atom.config.set("core.themeMode", "dark");
    atom.config.set("core.themesLight", ["atom-light-ui", "atom-light-syntax"]);
    atom.config.set("core.themes", ["atom-dark-ui", "atom-dark-syntax"]);
    reloadedHandler = jasmine.createSpy("reloadedHandler");
    atom.themes.onDidChangeActiveThemes(reloadedHandler);
    await atom.themes.activatePackages();

    await conditionPromise(() => reloadedHandler.callCount === 1, "themes to be reloaded");

    packageManager = new PackageManager();
    const themeMetadata = CSON.readFileSync(
      path.join(__dirname, "fixtures", "a-theme", "package.json"),
    );
    spyOn(packageManager, "getFeatured").andCallFake((_) => Promise.resolve([themeMetadata]));
    panel = new ThemesPanel(settingsView, packageManager);

    // Make updates synchronous
    spyOn(panel, "scheduleUpdateThemeConfig").andCallFake(function () {
      return this.updateThemeConfig();
    });
  });

  afterEach(function () {
    if (atom.packages.isPackageLoaded("a-theme")) {
      atom.packages.unloadPackage("a-theme");
    }
    waitsForPromise(() => Promise.resolve(atom.themes.deactivateThemes()));
  }); // Ensure works on promise and non-promise versions

  it("selects the configured mode and theme pairs", function () {
    expect(panel.refs.modeMenu.value).toBe("dark");
    expect(panel.refs.darkUiMenu.value).toBe("atom-dark-ui");
    expect(panel.refs.darkSyntaxMenu.value).toBe("atom-dark-syntax");
    expect(panel.refs.lightUiMenu.value).toBe("atom-light-ui");
    expect(panel.refs.lightSyntaxMenu.value).toBe("atom-light-syntax");
    expect(panel.refs.darkActiveBadge.style.display).toBe("");
    expect(panel.refs.lightActiveBadge.style.display).toBe("none");
  });

  describe("when a UI theme is selected for the active pair", () =>
    it("updates the pair config key and switches the active themes", function () {
      for (let child of Array.from(panel.refs.darkUiMenu.children)) {
        child.selected = child.value === "atom-light-ui";
        child.dispatchEvent(new Event("change", { bubbles: true }));
      }
      waitsFor(() => reloadedHandler.callCount === 2);
      runs(function () {
        expect(atom.config.get("core.themesDark")).toEqual(["atom-light-ui", "atom-dark-syntax"]);
        expect(atom.config.get("core.themes")).toEqual(["atom-light-ui", "atom-dark-syntax"]);
      });
    }));

  describe("when a syntax theme is selected for the inactive pair", () =>
    it("updates the pair config key without switching the active themes", function () {
      reloadedHandler.reset();
      for (let child of Array.from(panel.refs.lightSyntaxMenu.children)) {
        child.selected = child.value === "atom-dark-syntax";
        child.dispatchEvent(new Event("change", { bubbles: true }));
      }
      waitsFor(
        () => atom.config.get("core.themesLight")[1] === "atom-dark-syntax",
        "the light pair to update",
      );
      runs(function () {
        expect(atom.config.get("core.themesLight")).toEqual(["atom-light-ui", "atom-dark-syntax"]);
        expect(atom.config.get("core.themes")).toEqual(["atom-dark-ui", "atom-dark-syntax"]);
        expect(reloadedHandler.callCount).toBe(0);
      });
    }));

  describe("when the theme mode is selected", () =>
    it("updates 'core.themeMode' and switches to the matching pair", function () {
      panel.refs.modeMenu.value = "light";
      panel.refs.modeMenu.dispatchEvent(new Event("change", { bubbles: true }));

      waitsFor(() => reloadedHandler.callCount === 2);
      runs(function () {
        expect(atom.config.get("core.themeMode")).toBe("light");
        expect(atom.config.get("core.themes")).toEqual(["atom-light-ui", "atom-light-syntax"]);
        expect(panel.refs.lightActiveBadge.style.display).toBe("");
        expect(panel.refs.darkActiveBadge.style.display).toBe("none");
      });
    }));

  describe("when the theme pair config keys change", () =>
    it("refreshes the theme menus", function () {
      reloadedHandler.reset();
      atom.config.set("core.themesDark", ["atom-light-ui", "atom-light-syntax"]);

      waitsFor(() => reloadedHandler.callCount === 1);

      runs(function () {
        expect(panel.refs.darkUiMenu.value).toBe("atom-light-ui");
        expect(panel.refs.darkSyntaxMenu.value).toBe("atom-light-syntax");
      });
    }));

  xdescribe("when the themes panel is navigated to", () =>
    xit("focuses the search filter", function () {
      settingsView.showPanel("Themes");
      expect(panel.refs.filterEditor.element).toHaveFocus();
    }));

  describe("theme lists", function () {
    let [installed] = [];
    beforeEach(function () {
      installed = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "installed.json")));
      spyOn(packageManager, "loadCompatiblePackageVersion").andCallFake(function () {});
      spyOn(packageManager, "getInstalled").andReturn(Promise.resolve(installed));
      panel = new ThemesPanel(settingsView, packageManager);

      waitsFor(
        () =>
          packageManager.getInstalled.callCount === 1 &&
          panel.refs.communityCount.textContent.indexOf("…") < 0,
      );
    });

    it("shows the themes", function () {
      expect(panel.refs.communityCount.textContent.trim()).toBe("1");
      expect(
        panel.refs.communityPackages.querySelectorAll(".package-card:not(.hidden)").length,
      ).toBe(1);

      expect(panel.refs.coreCount.textContent.trim()).toBe("1");
      expect(panel.refs.corePackages.querySelectorAll(".package-card:not(.hidden)").length).toBe(1);

      expect(panel.refs.devCount.textContent.trim()).toBe("1");
      expect(panel.refs.devPackages.querySelectorAll(".package-card:not(.hidden)").length).toBe(1);
    });

    it("filters themes by name", async () => {
      panel.refs.filterEditor.setText("user-");
      await wait(panel.refs.filterEditor.getBuffer().stoppedChangingDelay);
      expect(panel.refs.communityCount.textContent.trim()).toBe("1/1");
      expect(
        panel.refs.communityPackages.querySelectorAll(".package-card:not(.hidden)").length,
      ).toBe(1);

      expect(panel.refs.coreCount.textContent.trim()).toBe("0/1");
      expect(panel.refs.corePackages.querySelectorAll(".package-card:not(.hidden)").length).toBe(0);

      expect(panel.refs.devCount.textContent.trim()).toBe("0/1");
      expect(panel.refs.devPackages.querySelectorAll(".package-card:not(.hidden)").length).toBe(0);
    });

    it("adds newly installed themes to the list", async () => {
      spyOn(packageManager, "installGitHubPackage").andReturn(
        Promise.resolve({ name: "another-user-theme", theme: "ui" }),
      );
      spyOn(atom.packages, "loadPackage").andCallFake((name) =>
        installed.user.push({ name, theme: "ui" }),
      );

      expect(panel.refs.communityCount.textContent.trim()).toBe("1");
      expect(
        panel.refs.communityPackages.querySelectorAll(".package-card:not(.hidden)").length,
      ).toBe(1);

      packageManager.install({ name: "another-user-theme", theme: "ui" });

      await conditionPromise(() => panel.refs.communityCount.textContent.trim() === "2");
      expect(
        panel.refs.communityPackages.querySelectorAll(".package-card:not(.hidden)").length,
      ).toBe(2);
    });

    it("collapses/expands a sub-section if its header is clicked", function () {
      expect(panel.element.querySelectorAll(".sub-section-heading.has-items").length).toBe(3);
      panel.element
        .querySelector(".sub-section.installed-packages .sub-section-heading.has-items")
        .click();
      expect(panel.element.querySelector(".sub-section.installed-packages")).toHaveClass(
        "collapsed",
      );

      expect(panel.element.querySelector(".sub-section.core-packages")).not.toHaveClass(
        "collapsed",
      );
      expect(panel.element.querySelector(".sub-section.dev-packages")).not.toHaveClass("collapsed");

      panel.element
        .querySelector(".sub-section.installed-packages .sub-section-heading.has-items")
        .click();
      expect(panel.element.querySelector(".sub-section.installed-packages")).not.toHaveClass(
        "collapsed",
      );
    });

    it("can collapse and expand any of the sub-sections", function () {
      let heading;
      expect(panel.element.querySelectorAll(".sub-section-heading.has-items").length).toBe(3);

      for (heading of Array.from(
        panel.element.querySelectorAll(".sub-section-heading.has-items"),
      )) {
        heading.click();
      }
      expect(panel.element.querySelector(".sub-section.installed-packages")).toHaveClass(
        "collapsed",
      );
      expect(panel.element.querySelector(".sub-section.core-packages")).toHaveClass("collapsed");
      expect(panel.element.querySelector(".sub-section.dev-packages")).toHaveClass("collapsed");

      for (heading of Array.from(
        panel.element.querySelectorAll(".sub-section-heading.has-items"),
      )) {
        heading.click();
      }
      expect(panel.element.querySelector(".sub-section.installed-packages")).not.toHaveClass(
        "collapsed",
      );
      expect(panel.element.querySelector(".sub-section.core-packages")).not.toHaveClass(
        "collapsed",
      );
      expect(panel.element.querySelector(".sub-section.dev-packages")).not.toHaveClass("collapsed");
    });

    it("can collapse sub-sections when filtering", async () => {
      panel.refs.filterEditor.setText("user-");
      await wait(panel.refs.filterEditor.getBuffer().stoppedChangingDelay);

      const hasItems = panel.element.querySelectorAll(".sub-section-heading.has-items");
      expect(hasItems.length).toBe(1);
      expect(hasItems[0].textContent).toMatch(/^Community Themes/);
    });
  });

  describe("when there are no themes", function () {
    beforeEach(function () {
      const installed = {
        dev: [],
        user: [],
        core: [],
      };

      spyOn(packageManager, "loadCompatiblePackageVersion").andCallFake(function () {});
      spyOn(packageManager, "getInstalled").andReturn(Promise.resolve(installed));
      panel = new ThemesPanel(settingsView, packageManager);

      waitsFor(
        () =>
          packageManager.getInstalled.callCount === 1 &&
          panel.refs.communityCount.textContent.indexOf("…") < 0,
      );
    });

    afterEach(() => waitsForPromise(() => Promise.resolve(atom.themes.deactivateThemes()))); // Ensure works on promise and non-promise versions

    it("has a count of zero in all headings", function () {
      for (let heading of Array.from(panel.element.querySelector(".section-heading-count"))) {
        expect(heading.textContent).toMatch(/^0+$/);
      }
      expect(panel.element.querySelectorAll(".sub-section .icon-paintcan").length).toBe(4);
      expect(panel.element.querySelectorAll(".sub-section .icon-paintcan.has-items").length).toBe(
        0,
      );
    });

    it("can collapse and expand any of the sub-sections", function () {
      for (let heading of Array.from(panel.element.querySelectorAll(".sub-section-heading"))) {
        heading.click();
      }
      expect(panel.element.querySelector(".sub-section.installed-packages")).not.toHaveClass(
        "collapsed",
      );
      expect(panel.element.querySelector(".sub-section.core-packages")).not.toHaveClass(
        "collapsed",
      );
      expect(panel.element.querySelector(".sub-section.dev-packages")).not.toHaveClass("collapsed");
    });

    it("does not allow collapsing on any section when filtering", async () => {
      panel.refs.filterEditor.setText("user-");
      await wait(panel.refs.filterEditor.getBuffer().stoppedChangingDelay);

      for (let heading of Array.from(panel.element.querySelector(".section-heading-count"))) {
        expect(heading.textContent).toMatch(/^(0\/0)+$/);
      }
      expect(panel.element.querySelectorAll(".sub-section .icon-paintcan").length).toBe(4);
      expect(panel.element.querySelectorAll(".sub-section .icon-paintcan.has-items").length).toBe(
        0,
      );
    });
  });
});
