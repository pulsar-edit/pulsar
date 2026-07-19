const fs = require("fs");
const path = require("path");
const { CompositeDisposable, Disposable } = require("atom");
const { clipboard, nativeImage } = require("@electron/remote");
const SaveDialog = require("./save-dialog");

module.exports = {
  activate() {
    this.disposables = new CompositeDisposable();
    this.saveDialog = new SaveDialog({ nativeImage });
    this.pasteProvider = { handlePaste: (context) => this.handlePaste(context) };

    this.disposables.add(
      atom.pasteProviders.add(this.pasteProvider, { priority: 100 }),
      atom.commands.add("atom-text-editor:not([mini])", {
        "image-paste:paste": () => this.pasteIntoActiveEditor(),
      }),
      atom.commands.add(".tree-view", {
        "image-paste:paste": () => this.pasteIntoSelectedTreePath(),
      }),
    );
  },

  deactivate() {
    this.disposables?.dispose();
    this.saveDialog?.destroy();
    this.disposables = null;
    this.saveDialog = null;
    this.pasteProvider = null;
  },

  consumeTreeView(treeView) {
    this.treeView = treeView;
    return new Disposable(() => {
      this.treeView = null;
    });
  },

  pasteIntoActiveEditor() {
    const editor = atom.textEditors.getActiveTextEditor();
    if (!editor) return false;
    return this.handlePaste({
      target: { type: "text-editor", editor },
      explicit: true,
    });
  },

  pasteIntoSelectedTreePath() {
    const selectedPath = this.treeView?.selectedPaths()?.[0];
    if (!selectedPath) {
      atom.notifications.addWarning("Select a tree-view file or directory first.");
      return false;
    }
    return this.handlePaste({
      target: { type: "directory", path: selectedPath },
      explicit: true,
    });
  },

  handlePaste(context) {
    const imageFile = this.imageFileFromDataTransfer(context.clipboardData);
    if (imageFile) {
      const target = this.resolveTarget(context.target);
      if (!target) return this.notifyMissingTarget();
      this.prepareImageFile(imageFile, target);
      return true;
    }

    const image = clipboard.readImage();
    if (image.isEmpty()) {
      if (context.explicit) atom.notifications.addInfo("The clipboard does not contain an image.");
      return false;
    }

    const pngBuffer = image.toPNG();
    if (pngBuffer.length === 0) return false;
    const target = this.resolveTarget(context.target);
    if (!target) return this.notifyMissingTarget();
    this.saveDialog.prepare({ target, pngBuffer });
    return true;
  },

  notifyMissingTarget() {
    atom.notifications.addWarning("Save the editor or open a project before pasting an image.");
    return true;
  },

  resolveTarget(target) {
    if (target?.type === "text-editor") {
      const { editor } = target;
      const editorPath = editor?.getPath();
      let projectPath = editorPath ? atom.project.relativizePath(editorPath)[0] : null;
      if (!projectPath) projectPath = atom.project.getPaths()[0];
      if (!projectPath && editorPath) projectPath = path.dirname(editorPath);
      if (!projectPath) return null;
      return { type: "text-editor", editor, basePath: projectPath };
    }

    if (target?.type === "directory" && target.path) {
      let directoryPath = target.path;
      try {
        if (!fs.statSync(directoryPath).isDirectory()) directoryPath = path.dirname(directoryPath);
      } catch {
        return null;
      }
      return { type: "directory", basePath: directoryPath };
    }

    return null;
  },

  imageFileFromDataTransfer(clipboardData) {
    if (!clipboardData) return null;
    const files = Array.from(clipboardData.files || []);
    const directFile = files.find((file) => file.type?.startsWith("image/"));
    if (directFile) return directFile;

    for (const item of Array.from(clipboardData.items || [])) {
      if (item.type?.startsWith("image/") && typeof item.getAsFile === "function") {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
    return null;
  },

  async prepareImageFile(file, target) {
    try {
      const sourceBuffer = Buffer.from(await file.arrayBuffer());
      const image = nativeImage.createFromBuffer(sourceBuffer);
      if (image.isEmpty()) throw new Error("The clipboard image could not be decoded.");
      const pngBuffer = image.toPNG();
      this.saveDialog.prepare({ target, pngBuffer, sourceName: file.name });
    } catch (error) {
      atom.notifications.addError("Unable to read the clipboard image.", {
        detail: error.message,
        dismissable: true,
      });
    }
  },
};
