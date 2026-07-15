const root = document.documentElement;

describe("one-theme", () => {
  afterEach(async () => {
    await atom.packages.deactivatePackage("one-theme");
  });

  it("applies its appearance settings as root attributes", async () => {
    await atom.packages.activatePackage("one-theme");

    // Defaults.
    expect(root.getAttribute("ui-tabsizing")).toBe("even");
    expect(root.hasAttribute("ui-tab-close-button")).toBe(false);
    expect(root.hasAttribute("ui-dock-buttons")).toBe(false);
    expect(root.hasAttribute("ui-sticky-headers")).toBe(false);

    // Changing a setting updates the matching attribute.
    atom.config.set("one-theme.tabSizing", "Maximum");
    expect(root.getAttribute("ui-tabsizing")).toBe("maximum");

    atom.config.set("one-theme.tabCloseButton", "Left");
    expect(root.getAttribute("ui-tab-close-button")).toBe("left");

    atom.config.set("one-theme.hideDockButtons", true);
    expect(root.getAttribute("ui-dock-buttons")).toBe("hidden");

    atom.config.set("one-theme.stickyHeaders", true);
    expect(root.getAttribute("ui-sticky-headers")).toBe("sticky");
  });

  it("removes the attributes when deactivated", async () => {
    await atom.packages.activatePackage("one-theme");
    atom.config.set("one-theme.hideDockButtons", true);
    expect(root.getAttribute("ui-dock-buttons")).toBe("hidden");

    await atom.packages.deactivatePackage("one-theme");
    expect(root.hasAttribute("ui-tabsizing")).toBe(false);
    expect(root.hasAttribute("ui-dock-buttons")).toBe(false);
  });

  it("selects its theme pairs with the select command", async () => {
    await atom.packages.activatePackage("one-theme");

    atom.commands.dispatch(atom.views.getView(atom.workspace), "one-theme:select");

    expect(atom.config.get("theme.light")).toEqual(["one-day-ui", "one-day-syntax"]);
    expect(atom.config.get("theme.dark")).toEqual(["one-night-ui", "one-night-syntax"]);
  });
});
