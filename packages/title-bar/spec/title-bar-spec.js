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

  it("removes the title bar on deactivate", () => {
    waitsForPromise(() => Promise.resolve(atom.packages.deactivatePackage("title-bar")));

    runs(() => {
      expect(workspaceElement.querySelector(".title-bar")).toBeNull();
    });
  });
});
