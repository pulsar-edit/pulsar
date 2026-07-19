const { Utils } = require("../lib/utils");
const { ApplicationMenu } = require("../lib/app-menu");
const { MenuLabel } = require("../lib/label");
const {
  calculateAvailableMenuWidth,
  calculateVisibleLabelCount,
  resolveLaunchMode,
} = require("../lib/view");

describe("Title Bar package", () => {
  let workspaceElement;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);

    waitsForPromise(() => atom.packages.activatePackage("title-bar"));
  });

  it("adds a custom title bar to the workspace header", () => {
    expect(workspaceElement.querySelectorAll(".title-bar").length).toBe(1);
  });

  it("adds window controls", () => {
    const titleBar = workspaceElement.querySelector(".title-bar");

    expect(titleBar.querySelector(".btn-minimize")).toExist();
    expect(titleBar.querySelector(".btn-maximize")).toExist();
    expect(titleBar.querySelector(".btn-close")).toExist();
  });

  it("populates the application menu", () => {
    const titleBar = workspaceElement.querySelector(".title-bar");

    expect(titleBar.querySelector(".app-menu .menu-item")).toExist();
  });

  it("sets intrinsic logo dimensions before styles load", () => {
    const logo = workspaceElement.querySelector(".title-bar .app-icon img");

    expect(logo.getAttribute("width")).toBe("24");
    expect(logo.getAttribute("height")).toBe("24");
  });

  it("uses the canonical Lumine logo", () => {
    const logo = workspaceElement.querySelector(".title-bar .app-icon img");

    expect(logo.src.replace(/\\/g, "/")).toMatch(/\/resources\/app-icons\/lumine\.svg$/);
    expect(logo.complete).toBe(true);
    expect(logo.naturalWidth).toBe(128);
  });

  it("prioritizes safe, source, and dev launch modes for the logo indicator", () => {
    // Safe mode wins even when a source checkout also reports dev/source.
    expect(resolveLaunchMode({ sourceMode: true, devMode: true, safeMode: true })).toBe("safe");
    expect(resolveLaunchMode({ sourceMode: false, devMode: false, safeMode: true })).toBe("safe");
    // `yarn start` reports both source and dev; source marks it distinctly.
    expect(resolveLaunchMode({ sourceMode: true, devMode: true, safeMode: false })).toBe("source");
    // A bare dev window (packaged build) has neither safe nor source set.
    expect(resolveLaunchMode({ sourceMode: false, devMode: true, safeMode: false })).toBe("dev");
    expect(resolveLaunchMode({ sourceMode: false, devMode: false, safeMode: false })).toBeNull();
  });

  it("removes the title bar on deactivate", () => {
    waitsForPromise(() => Promise.resolve(atom.packages.deactivatePackage("title-bar")));

    runs(() => {
      expect(workspaceElement.querySelector(".title-bar")).toBeNull();
    });
  });

  describe("keystroke formatting", () => {
    it("formats modifiers, shifted symbols, and multi-stroke bindings", () => {
      if (process.platform === "darwin") {
        expect(Utils.formatKeystroke("cmdorctrl-shift-f")).toBe("⌘⇧F");
        expect(Utils.formatKeystroke("cmd-|")).toBe("⌘⇧\\");
        expect(Utils.formatKeystroke("cmd-k right")).toBe("⌘K →");
      } else {
        expect(Utils.formatKeystroke("cmdorctrl-shift-f")).toBe("Ctrl+Shift+F");
        expect(Utils.formatKeystroke("cmd-|")).toBe("Cmd+Shift+\\");
        expect(Utils.formatKeystroke("cmd-k right")).toBe("Cmd+K Right");
      }
    });
  });

  describe("responsive application menu", () => {
    let appMenu;

    const parent = {
      isMenuBarVisible() {
        return true;
      },
      isTitleBarVisible() {
        return true;
      },
      setMenuBarVisible() {},
    };

    const template = [
      {
        label: "&File",
        submenu: [{ label: "&New", command: "application:new-file" }],
      },
      {
        label: "&Edit",
        submenu: [
          { label: "&Undo", command: "core:undo" },
          { type: "separator" },
          { label: "Disabled", command: "example:disabled", enabled: false },
        ],
      },
      {
        label: "&Help",
        submenu: [{ label: "&About", command: "application:about" }],
      },
    ];

    afterEach(() => {
      appMenu?.destroy();
      appMenu?.getElement().remove();
      appMenu = null;
    });

    it("reserves the overflow label before hiding trailing labels", () => {
      expect(calculateVisibleLabelCount([40, 40, 40], 120, 24)).toBe(3);
      expect(calculateVisibleLabelCount([40, 40, 40], 104, 24)).toBe(2);
      expect(calculateVisibleLabelCount([40, 40, 40], 20, 24)).toBe(0);
    });

    it("reserves title space from the application menu's anchored edge", () => {
      const titleRect = { left: 450, right: 550 };

      expect(calculateAvailableMenuWidth({ left: 32, right: 332 }, titleRect, 8, 8, false)).toBe(
        402,
      );
      expect(calculateAvailableMenuWidth({ left: 700, right: 1000 }, titleRect, 8, 8, true)).toBe(
        434,
      );
    });

    it("moves trailing menus into an overflow submenu and restores them", () => {
      appMenu = ApplicationMenu.createApplicationMenu(template, parent);
      appMenu.setOverflowStartIndex(1);

      expect(appMenu.getNavigableLabels().map((label) => label.getLabelText())).toEqual([
        "&File",
        "...",
      ]);
      expect(appMenu.overflowLabel.getSubmenu().map((item) => item.getLabelText())).toEqual([
        "&Edit",
        "&Help",
      ]);
      expect(appMenu.overflowLabel.getSubmenu()[0].getSubmenu()[1].isSeparator()).toBe(true);
      expect(appMenu.overflowLabel.getSubmenu()[0].getSubmenu()[2].isEnabled()).toBe(false);

      appMenu.setOverflowStartIndex(template.length);

      expect(appMenu.getNavigableLabels().map((label) => label.getLabelText())).toEqual([
        "&File",
        "&Edit",
        "&Help",
      ]);
      expect(appMenu.overflowLabel.getSubmenu().length).toBe(0);
    });

    it("includes the overflow label in keyboard navigation", () => {
      appMenu = ApplicationMenu.createApplicationMenu(template, parent);
      appMenu.setOverflowStartIndex(1);

      appMenu.focusFirstLabel();
      expect(appMenu.getFocusedLabel().getLabelText()).toBe("&File");

      appMenu.focusNextLabel();
      expect(appMenu.getFocusedLabel().getLabelText()).toBe("...");

      appMenu.focusNextLabel();
      expect(appMenu.getFocusedLabel().getLabelText()).toBe("&File");
    });

    it("opens an overflowed menu through its mnemonic", () => {
      appMenu = ApplicationMenu.createApplicationMenu(template, parent);
      appMenu.setOverflowStartIndex(1);
      appMenu.showAltKeys(true);

      const event = {
        key: "h",
        repeat: false,
        stopPropagation() {},
        preventDefault() {},
      };
      appMenu.onKeyDown(event);

      const helpItem = appMenu.overflowLabel.getSubmenu()[1];
      expect(appMenu.getOpenLabel()).toBe(appMenu.overflowLabel);
      expect(helpItem.isOpen()).toBe(true);
      expect(helpItem.getSubmenu().getSelected().getLabelText()).toBe("&About");
    });

    it("clears overflow state when the canonical menu changes", () => {
      appMenu = ApplicationMenu.createApplicationMenu(template, parent);
      appMenu.setOverflowStartIndex(1);

      appMenu.insertLabel(
        MenuLabel.createMenuLabel({
          label: "&View",
          submenu: [{ label: "Toggle", command: "example:toggle" }],
        }),
        1,
      );

      expect(appMenu.getOverflowStartIndex()).toBe(4);
      expect(appMenu.getNavigableLabels().length).toBe(4);
      expect(appMenu.overflowLabel.getSubmenu().length).toBe(0);
    });

    describe("alt-scroll cancelling menu activation", () => {
      const altDown = () => ({
        key: "Alt",
        repeat: false,
        stopPropagation() {},
        preventDefault() {},
      });
      const altUp = () => ({ key: "Alt", stopPropagation() {}, preventDefault() {} });

      beforeEach(() => {
        atom.config.set("title-bar.altGivesFocus", true);
        // Alt-wheel amplification enabled unless a test overrides it.
        atom.config.set("editor.altWheelMultiplier", 7.5);
      });

      it("focuses the first label when Alt is tapped without an intervening scroll", () => {
        appMenu = ApplicationMenu.createApplicationMenu(template, parent);

        appMenu.onKeyDown(altDown());
        appMenu.onKeyUp(altUp());

        expect(appMenu.getFocusedLabel()?.getLabelText()).toBe("&File");
      });

      it("does not focus the menu when an alt-scroll happens during the Alt hold", () => {
        appMenu = ApplicationMenu.createApplicationMenu(template, parent);

        appMenu.onKeyDown(altDown());
        appMenu.onWheel({ altKey: true });
        appMenu.onKeyUp(altUp());

        expect(appMenu.getFocusedLabel()).toBeNull();
        expect(appMenu.showingAltKeys).toBe(false);
      });

      it("still activates the menu when the alt-wheel multiplier is disabled", () => {
        atom.config.set("editor.altWheelMultiplier", 1);
        appMenu = ApplicationMenu.createApplicationMenu(template, parent);

        appMenu.onKeyDown(altDown());
        appMenu.onWheel({ altKey: true });
        appMenu.onKeyUp(altUp());

        expect(appMenu.getFocusedLabel()?.getLabelText()).toBe("&File");
      });

      it("ignores wheel events without the Alt modifier", () => {
        appMenu = ApplicationMenu.createApplicationMenu(template, parent);

        appMenu.onKeyDown(altDown());
        appMenu.onWheel({ altKey: false });
        appMenu.onKeyUp(altUp());

        expect(appMenu.getFocusedLabel()?.getLabelText()).toBe("&File");
      });
    });
  });
});
