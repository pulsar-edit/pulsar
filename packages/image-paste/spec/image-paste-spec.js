const fs = require("fs");
const os = require("os");
const path = require("path");
const { clipboard, nativeImage } = require("@electron/remote");
const imagePaste = require("../lib/main");
const SaveDialog = require("../lib/save-dialog");

describe("image-paste", () => {
  let directoryPath, originalClipboardImage, originalClipboardText, originalSaveDialog;

  beforeEach(async () => {
    await atom.packages.activatePackage("image-paste");
    directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), "image-paste-"));
    originalClipboardImage = clipboard.readImage();
    originalClipboardText = clipboard.readText();
    originalSaveDialog = imagePaste.saveDialog;
    imagePaste.saveDialog = { prepare: jasmine.createSpy("prepare") };
  });

  afterEach(() => {
    clipboard.write({ image: originalClipboardImage, text: originalClipboardText });
    imagePaste.saveDialog = originalSaveDialog;
    fs.rmSync(directoryPath, { recursive: true, force: true });
  });

  it("claims image data and snapshots it before opening the save dialog", () => {
    const pngBuffer = Buffer.from("png image data");
    spyOn(clipboard, "readImage").and.returnValue({
      isEmpty: () => false,
      toPNG: () => pngBuffer,
    });

    expect(
      imagePaste.handlePaste({ target: { type: "directory", path: directoryPath } }),
    ).toBe(true);
    expect(imagePaste.saveDialog.prepare).toHaveBeenCalledWith({
      target: { type: "directory", basePath: directoryPath },
      pngBuffer,
    });
  });

  it("falls through when the clipboard does not contain an image", () => {
    spyOn(clipboard, "readImage").and.returnValue({ isEmpty: () => true });

    expect(
      imagePaste.handlePaste({ target: { type: "directory", path: directoryPath } }),
    ).toBe(false);
    expect(imagePaste.saveDialog.prepare).not.toHaveBeenCalled();
  });

  it("explains why an image cannot be pasted into an untitled editor", () => {
    const pngBuffer = Buffer.from("png image data");
    spyOn(clipboard, "readImage").and.returnValue({
      isEmpty: () => false,
      toPNG: () => pngBuffer,
    });
    spyOn(atom.notifications, "addWarning");
    atom.project.setPaths([]);
    const editor = atom.workspace.buildTextEditor();

    expect(
      imagePaste.handlePaste({ target: { type: "text-editor", editor } }),
    ).toBe(true);
    expect(atom.notifications.addWarning).toHaveBeenCalledWith(
      "Save the editor or open a project before pasting an image.",
    );
    expect(imagePaste.saveDialog.prepare).not.toHaveBeenCalled();
  });

  it("normalizes unsupported output extensions to PNG", () => {
    expect(SaveDialog.prototype.normalizeImagePath("assets/example.gif")).toBe(
      "assets/example.png",
    );
    expect(SaveDialog.prototype.normalizeImagePath("assets/example.jpg")).toBe(
      "assets/example.jpg",
    );
  });

  it("handles the normal editor paste command through the provider registry", async () => {
    const editorPath = path.join(directoryPath, "document.md");
    fs.writeFileSync(editorPath, "");
    atom.project.setPaths([directoryPath]);
    const editor = await atom.workspace.open(editorPath);
    const image = nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    );
    expect(image.isEmpty()).toBe(false);
    clipboard.writeImage(image);

    atom.views.getView(editor).pasteText();

    const { target, pngBuffer } = imagePaste.saveDialog.prepare.calls.mostRecent().args[0];
    expect(target.type).toBe("text-editor");
    expect(target.editor).toBe(editor);
    expect(target.basePath).toBe(atom.project.relativizePath(editorPath)[0]);
    expect(pngBuffer).toEqual(jasmine.any(Buffer));
  });
});
