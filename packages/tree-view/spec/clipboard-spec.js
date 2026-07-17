const path = require("path");
const os = require("os");
const TreeView = require("../lib/tree-view");

describe("TreeView clipboard data", () => {
  it("writes versioned copy metadata for the selected paths", () => {
    const paths = [path.resolve("one.txt"), path.resolve("two.txt")];
    const treeView = { selectedPaths: () => paths };
    spyOn(atom.clipboard, "writeNativeData").and.returnValue(Promise.resolve(true));

    const handled = TreeView.prototype.performCopyOperation.call(treeView, "cut");

    expect(handled).toBe(true);
    expect(atom.clipboard.writeNativeData).toHaveBeenCalledWith(
      paths.join(os.EOL),
      "application/lumine-tree-view",
      { version: 1, operation: "cut", paths },
    );
  });

  it("does not touch the clipboard when nothing is selected", () => {
    const treeView = { selectedPaths: () => [] };
    spyOn(atom.clipboard, "writeNativeData");

    expect(TreeView.prototype.performCopyOperation.call(treeView, "copy")).toBe(false);
    expect(atom.clipboard.writeNativeData).not.toHaveBeenCalled();
  });

  it("reads tree metadata written by another renderer", async () => {
    const paths = [path.resolve("one.txt")];
    spyOn(atom.clipboard, "readNativeData").and.returnValue(
      Promise.resolve({ version: 1, operation: "copy", paths }),
    );

    const entry = await TreeView.prototype.readTreeClipboardData.call({});

    expect(atom.clipboard.readNativeData).toHaveBeenCalledWith("application/lumine-tree-view");
    expect(entry).toEqual({ version: 1, operation: "copy", paths });
  });

  it("rejects unknown versions, operations, and malformed path lists", async () => {
    const readNativeData = spyOn(atom.clipboard, "readNativeData");
    const rejected = [
      { version: 2, operation: "copy", paths: ["a"] },
      { version: 1, operation: "duplicate", paths: ["a"] },
      { version: 1, operation: "copy", paths: [] },
      { version: 1, operation: "copy", paths: ["a", 7] },
      { version: 1, operation: "copy", paths: ["a", ""] },
      null,
    ];
    for (const data of rejected) {
      readNativeData.and.returnValue(Promise.resolve(data));
      expect(await TreeView.prototype.readTreeClipboardData.call({})).toBeNull();
    }
  });

  it("pastes tree entries before offering the clipboard to other providers", async () => {
    const paths = [path.resolve("one.txt")];
    const targetPath = path.resolve("target");
    const treeView = {
      getPasteTargetPath: () => targetPath,
      readTreeClipboardData: TreeView.prototype.readTreeClipboardData,
      pastePaths: jasmine.createSpy("pastePaths").and.returnValue(true),
    };
    spyOn(atom.clipboard, "readNativeData").and.returnValue(
      Promise.resolve({ version: 1, operation: "cut", paths }),
    );
    spyOn(atom.pasteProviders, "handlePaste").and.returnValue(true);

    const handled = await TreeView.prototype.pasteEntries.call(treeView);

    expect(handled).toBe(true);
    expect(treeView.pastePaths).toHaveBeenCalledWith(paths, "cut", targetPath);
    expect(atom.pasteProviders.handlePaste).not.toHaveBeenCalled();
  });

  it("falls back to paste providers when the clipboard has no tree entry", async () => {
    const targetPath = path.resolve("target");
    const treeView = {
      getPasteTargetPath: () => targetPath,
      readTreeClipboardData: TreeView.prototype.readTreeClipboardData,
      pastePaths: jasmine.createSpy("pastePaths"),
    };
    spyOn(atom.clipboard, "readNativeData").and.returnValue(Promise.resolve(null));
    spyOn(atom.pasteProviders, "handlePaste").and.returnValue(true);

    const handled = await TreeView.prototype.pasteEntries.call(treeView);

    expect(handled).toBe(true);
    expect(treeView.pastePaths).not.toHaveBeenCalled();
    expect(atom.pasteProviders.handlePaste).toHaveBeenCalledWith({
      target: { type: "directory", path: targetPath },
    });
  });
});
