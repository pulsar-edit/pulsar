describe("vscode-theme", () => {
  afterEach(async () => {
    await atom.packages.deactivatePackage("vscode-theme");
  });

  it("selects its theme pairs with the select command", async () => {
    await atom.packages.activatePackage("vscode-theme");

    atom.commands.dispatch(atom.views.getView(atom.workspace), "vscode-theme:select");

    expect(atom.config.get("theme.light")).toEqual(["vscode-day-ui", "vscode-day-syntax"]);
    expect(atom.config.get("theme.dark")).toEqual(["vscode-night-ui", "vscode-night-syntax"]);
  });
});
