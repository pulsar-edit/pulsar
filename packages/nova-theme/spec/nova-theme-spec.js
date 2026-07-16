describe("nova-theme", () => {
  afterEach(async () => {
    await atom.packages.deactivatePackage("nova-theme");
  });

  it("selects its theme pairs with the select command", async () => {
    await atom.packages.activatePackage("nova-theme");

    atom.commands.dispatch(atom.views.getView(atom.workspace), "nova-theme:select");

    expect(atom.config.get("theme.light")).toEqual(["nova-day-ui", "nova-day-syntax"]);
    expect(atom.config.get("theme.dark")).toEqual(["nova-night-ui", "nova-night-syntax"]);
  });
});
