const TreeView = require("../lib/tree-view");

describe("TreeView root updates", () => {
  it("ignores updates after the project has been cleared during teardown", () => {
    const project = atom.project;
    const treeView = { selectedPaths: jasmine.createSpy("selectedPaths") };

    try {
      atom.project = null;
      expect(() => TreeView.prototype.updateRoots.call(treeView)).not.toThrow();
      expect(treeView.selectedPaths).not.toHaveBeenCalled();
    } finally {
      atom.project = project;
    }
  });
});
