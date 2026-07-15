const root = document.documentElement;

describe("vscode-theme", () => {
  afterEach(async () => {
    await atom.packages.deactivatePackage("vscode-theme");
  });

  it("applies its appearance settings as root attributes", async () => {
    await atom.packages.activatePackage("vscode-theme");

    // Defaults.
    expect(root.getAttribute("vscode-tabsizing")).toBe("even");
    expect(root.hasAttribute("vscode-tab-close-button")).toBe(false);
    expect(root.hasAttribute("vscode-dock-buttons")).toBe(false);
    expect(root.hasAttribute("vscode-sticky-headers")).toBe(false);

    // Changing a setting updates the matching attribute.
    atom.config.set("vscode-theme.tabSizing", "Maximum");
    expect(root.getAttribute("vscode-tabsizing")).toBe("maximum");

    atom.config.set("vscode-theme.tabCloseButton", "Left");
    expect(root.getAttribute("vscode-tab-close-button")).toBe("left");

    atom.config.set("vscode-theme.hideDockButtons", true);
    expect(root.getAttribute("vscode-dock-buttons")).toBe("hidden");

    atom.config.set("vscode-theme.stickyHeaders", true);
    expect(root.getAttribute("vscode-sticky-headers")).toBe("sticky");
  });

  it("removes the attributes when deactivated", async () => {
    await atom.packages.activatePackage("vscode-theme");
    atom.config.set("vscode-theme.hideDockButtons", true);
    expect(root.getAttribute("vscode-dock-buttons")).toBe("hidden");

    await atom.packages.deactivatePackage("vscode-theme");
    expect(root.hasAttribute("vscode-tabsizing")).toBe(false);
    expect(root.hasAttribute("vscode-dock-buttons")).toBe(false);
  });

  it("selects its theme pairs with the select command", async () => {
    await atom.packages.activatePackage("vscode-theme");

    atom.commands.dispatch(atom.views.getView(atom.workspace), "vscode-theme:select");

    expect(atom.config.get("theme.light")).toEqual(["vscode-day-ui", "vscode-day-syntax"]);
    expect(atom.config.get("theme.dark")).toEqual(["vscode-night-ui", "vscode-night-syntax"]);
  });
});
