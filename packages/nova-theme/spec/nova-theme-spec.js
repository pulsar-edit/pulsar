const root = document.documentElement;

describe("nova-theme", () => {
  afterEach(async () => {
    await atom.packages.deactivatePackage("nova-theme");
  });

  it("applies its appearance settings as root attributes", async () => {
    await atom.packages.activatePackage("nova-theme");

    // Defaults.
    expect(root.getAttribute("nova-tabsizing")).toBe("even");
    expect(root.hasAttribute("nova-tab-close-button")).toBe(false);
    expect(root.hasAttribute("nova-dock-buttons")).toBe(false);
    expect(root.hasAttribute("nova-sticky-headers")).toBe(false);

    // Changing a setting updates the matching attribute.
    atom.config.set("nova-theme.tabSizing", "Maximum");
    expect(root.getAttribute("nova-tabsizing")).toBe("maximum");

    atom.config.set("nova-theme.tabCloseButton", "Left");
    expect(root.getAttribute("nova-tab-close-button")).toBe("left");

    atom.config.set("nova-theme.hideDockButtons", true);
    expect(root.getAttribute("nova-dock-buttons")).toBe("hidden");

    atom.config.set("nova-theme.stickyHeaders", true);
    expect(root.getAttribute("nova-sticky-headers")).toBe("sticky");
  });

  it("removes the attributes when deactivated", async () => {
    await atom.packages.activatePackage("nova-theme");
    atom.config.set("nova-theme.hideDockButtons", true);
    expect(root.getAttribute("nova-dock-buttons")).toBe("hidden");

    await atom.packages.deactivatePackage("nova-theme");
    expect(root.hasAttribute("nova-tabsizing")).toBe(false);
    expect(root.hasAttribute("nova-dock-buttons")).toBe(false);
  });

  it("selects its theme pairs with the select command", async () => {
    await atom.packages.activatePackage("nova-theme");

    atom.commands.dispatch(atom.views.getView(atom.workspace), "nova-theme:select");

    expect(atom.config.get("theme.light")).toEqual(["nova-day-ui", "nova-day-syntax"]);
    expect(atom.config.get("theme.dark")).toEqual(["nova-night-ui", "nova-night-syntax"]);
  });
});
