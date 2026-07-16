const path = require("path");
const { pathToFileURL } = require("url");
const TreeView = require("../lib/tree-view");

function createClipboardData(initialData = {}) {
  const data = new Map(Object.entries(initialData));
  return {
    getData(type) {
      return data.get(type) || "";
    },
    setData(type, value) {
      data.set(type, value);
    },
    get types() {
      return Array.from(data.keys());
    },
  };
}

describe("TreeView clipboard data", () => {
  it("writes standard path formats and versioned copy metadata", () => {
    const paths = [path.resolve("one.txt"), path.resolve("two.txt")];
    const clipboardData = createClipboardData();
    const pendingCopyOperation = { operation: "cut", paths, handled: false };
    const treeView = {
      pendingCopyOperation,
      selectedPaths: () => [],
    };
    const event = { clipboardData, preventDefault: jasmine.createSpy("preventDefault") };

    TreeView.prototype.didCopy.call(treeView, event);

    expect(clipboardData.types).toEqual([
      "text/plain",
      "text/uri-list",
      "application/lumine-tree-view",
    ]);
    expect(clipboardData.getData("text/uri-list")).toBe(
      paths.map((entryPath) => pathToFileURL(entryPath).href).join("\r\n"),
    );
    expect(JSON.parse(clipboardData.getData("application/lumine-tree-view"))).toEqual({
      version: 1,
      operation: "cut",
      paths,
    });
    expect(pendingCopyOperation.handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("reads tree metadata written by another renderer", () => {
    const paths = [path.resolve("one.txt")];
    const clipboardData = createClipboardData({
      "application/lumine-tree-view": JSON.stringify({
        version: 1,
        operation: "copy",
        paths,
      }),
    });

    expect(TreeView.prototype.readTreeClipboardData.call({}, clipboardData)).toEqual({
      version: 1,
      operation: "copy",
      paths,
    });
  });

  it("accepts standard file URI lists from other applications", () => {
    const paths = [path.resolve("one.txt"), path.resolve("two.txt")];
    const clipboardData = createClipboardData({
      "text/uri-list": paths.map((entryPath) => pathToFileURL(entryPath).href).join("\n"),
    });

    expect(TreeView.prototype.readTreeClipboardData.call({}, clipboardData)).toEqual({
      operation: "copy",
      paths,
    });
  });

  it("pastes tree entries before offering the clipboard to other providers", () => {
    const paths = [path.resolve("one.txt")];
    const clipboardData = createClipboardData({
      "application/lumine-tree-view": JSON.stringify({
        version: 1,
        operation: "copy",
        paths,
      }),
    });
    const treeView = {
      pendingPasteOperation: { targetPath: path.resolve("target"), handled: false },
      readTreeClipboardData: TreeView.prototype.readTreeClipboardData,
      pastePaths: jasmine.createSpy("pastePaths").and.returnValue(true),
    };
    spyOn(atom.pasteProviders, "handlePaste").and.returnValue(true);
    const event = { clipboardData, preventDefault: jasmine.createSpy("preventDefault") };

    TreeView.prototype.didPaste.call(treeView, event);

    expect(treeView.pastePaths).toHaveBeenCalledWith(paths, "copy", path.resolve("target"));
    expect(atom.pasteProviders.handlePaste).not.toHaveBeenCalled();
    expect(treeView.pendingPasteOperation.handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
