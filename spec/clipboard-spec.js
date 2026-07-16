const Clipboard = require("../src/clipboard");

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

describe("Clipboard", () => {
  describe("write(text, metadata) and read()", () => {
    it("writes and reads text to/from the native clipboard", () => {
      expect(atom.clipboard.read()).toBe("initial clipboard content");
      atom.clipboard.write("next");
      expect(atom.clipboard.read()).toBe("next");
    });

    it("returns metadata if the item on the native clipboard matches the last written item", () => {
      atom.clipboard.write("next", { meta: "data" });
      expect(atom.clipboard.read()).toBe("next");
      expect(atom.clipboard.readWithMetadata().text).toBe("next");
      expect(atom.clipboard.readWithMetadata().metadata).toEqual({
        meta: "data",
      });
    });
  });

  describe("line endings", () => {
    let originalPlatform = process.platform;

    const eols = new Map([
      ["win32", "\r\n"],
      ["darwin", "\n"],
      ["linux", "\n"],
    ]);
    for (let [platform, eol] of eols) {
      it(`converts line endings to the OS's native line endings on ${platform}`, () => {
        Object.defineProperty(process, "platform", { value: platform });

        atom.clipboard.write("next\ndone\r\n\n", { meta: "data" });
        expect(atom.clipboard.readWithMetadata()).toEqual({
          text: `next${eol}done${eol}${eol}`,
          metadata: { meta: "data" },
        });

        Object.defineProperty(process, "platform", { value: originalPlatform });
      });
    }
  });

  describe("ClipboardEvent data", () => {
    it("writes plain text, VS Code metadata, and Lumine editor metadata", () => {
      const clipboardData = createClipboardData();
      const metadata = { indentBasis: 0, fullLine: true };

      atom.clipboard.createDataTransferClipboard(clipboardData).write("next\n", metadata);

      expect(clipboardData.types).toEqual([
        "text/plain",
        "vscode-editor-data",
        "application/lumine-text-editor",
      ]);
      expect(clipboardData.getData("text/plain").replace(/\r\n/g, "\n")).toBe("next\n");

      const editorData = JSON.parse(clipboardData.getData("vscode-editor-data"));
      expect(editorData.version).toBe(1);
      expect(editorData.isFromEmptySelection).toBe(true);
      expect(editorData.multicursorText).toBe(null);
      expect(editorData.mode).toBe(null);
      expect(editorData.lumine.version).toBe(1);
      expect(editorData.lumine.signature).toEqual(jasmine.any(String));
      expect(editorData.lumine.metadata).toEqual(metadata);

      expect(JSON.parse(clipboardData.getData("application/lumine-text-editor"))).toEqual(
        editorData.lumine,
      );
    });

    it("reads Lumine metadata in a different clipboard instance", () => {
      const clipboardData = createClipboardData();
      const metadata = {
        selections: [
          { text: "one", indentBasis: 0, fullLine: false },
          { text: "two", indentBasis: 1, fullLine: true },
        ],
      };
      atom.clipboard.createDataTransferClipboard(clipboardData).write("one\ntwo", metadata);
      clipboardData.setData("vscode-editor-data", "");

      const otherRendererClipboard = new Clipboard();
      expect(otherRendererClipboard.createDataTransferClipboard(clipboardData).readWithMetadata()).toEqual({
        text: clipboardData.getData("text/plain"),
        metadata,
      });
    });

    it("reads VS Code linewise and multicursor metadata", () => {
      const clipboardData = createClipboardData({
        "text/plain": "one\ntwo",
        "vscode-editor-data": JSON.stringify({
          version: 1,
          isFromEmptySelection: true,
          multicursorText: ["one", "two"],
          mode: null,
        }),
      });

      expect(new Clipboard().createDataTransferClipboard(clipboardData).readWithMetadata()).toEqual({
        text: "one\ntwo",
        metadata: {
          fullLine: true,
          selections: [
            { text: "one", fullLine: true },
            { text: "two", fullLine: true },
          ],
        },
      });
    });

    it("ignores stale Lumine metadata when the plain text has changed", () => {
      const clipboardData = createClipboardData();
      atom.clipboard
        .createDataTransferClipboard(clipboardData)
        .write("original", { fullLine: true });
      clipboardData.setData("text/plain", "replacement");

      expect(new Clipboard().createDataTransferClipboard(clipboardData).readWithMetadata()).toEqual({
        text: "replacement",
      });
    });
  });
});
