const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { InputDialogView } = require("@lumine-code/select-list");

module.exports = class SaveDialog {
  constructor({ nativeImage }) {
    this.nativeImage = nativeImage;

    this.previewElement = document.createElement("div");
    this.previewElement.classList.add("image-paste-preview");

    this.warningElement = document.createElement("div");
    this.warningElement.classList.add("image-paste-warning");
    this.warningElement.setAttribute("role", "alert");
    this.previewElement.appendChild(this.warningElement);

    this.imageElement = document.createElement("img");
    this.imageElement.alt = "Clipboard image preview";
    this.previewElement.appendChild(this.imageElement);

    this.inputDialogView = new InputDialogView({
      className: "image-paste save-dialog",
      infoMessage: "Enter a path relative to the current project or directory for the pasted image.",
      contentElement: this.previewElement,
      didChangeQuery: () => this.clearWarning(),
      didConfirm: () => this.confirm(),
      didCancel: () => this.hide(),
    });
    this.miniEditor = this.inputDialogView.refs.queryEditor;
  }

  destroy() {
    this.inputDialogView.destroy();
  }

  prepare({ target, pngBuffer, sourceName = null }) {
    this.target = target;
    this.pngBuffer = Buffer.from(pngBuffer);
    this.saving = false;

    const hash = crypto.createHash("md5").update(this.pngBuffer).digest("hex").slice(0, 8);
    let initialPath;
    if (target.type === "text-editor") {
      const selectedText = target.editor.getSelectedText();
      if (selectedText && !selectedText.includes("\n")) {
        initialPath = selectedText;
      } else {
        const editorName = target.editor.getPath()
          ? path.parse(target.editor.getPath()).name
          : "image";
        initialPath = path.join(
          atom.config.get("image-paste.assetsDirectory"),
          `${editorName}-${hash}.png`,
        );
      }
    } else {
      initialPath = sourceName || `${hash}.png`;
    }

    initialPath = this.normalizeImagePath(initialPath);
    if (atom.config.get("image-paste.forwardSlash")) {
      initialPath = initialPath.replace(/\\/g, "/");
    }
    this.miniEditor.setText(initialPath);
    this.clearWarning();
    this.imageElement.src = atom.config.get("image-paste.imagePreview")
      ? `data:image/png;base64,${this.pngBuffer.toString("base64")}`
      : "";
    this.inputDialogView.show();
    this.selectBaseName(initialPath);
  }

  hide() {
    this.inputDialogView.hide();
  }

  clearWarning() {
    this.overwritePath = null;
    this.warningElement.textContent = "";
  }

  warn(message) {
    this.warningElement.textContent = message;
  }

  selectBaseName(relativePath) {
    const normalizedPath = relativePath.replace(/\\/g, "/");
    const slashIndex = normalizedPath.lastIndexOf("/");
    const extensionLength = path.extname(normalizedPath).length;
    this.miniEditor.setSelectedBufferRange([
      [0, slashIndex + 1],
      [0, normalizedPath.length - extensionLength],
    ]);
  }

  normalizeImagePath(relativePath) {
    relativePath = String(relativePath).trim().replace(/[<>:"|?*\0]/g, "");
    const extension = path.extname(relativePath).toLowerCase();
    if ([".png", ".jpg", ".jpeg"].includes(extension)) return relativePath;
    if (extension) return relativePath.slice(0, -extension.length) + ".png";
    return relativePath + ".png";
  }

  async confirm() {
    if (this.saving || !this.target || !this.pngBuffer) return;

    let relativePath = this.normalizeImagePath(this.miniEditor.getText());
    if (path.isAbsolute(relativePath)) {
      this.warn("Enter a path relative to the selected project or directory.");
      return;
    }

    const filePath = path.resolve(this.target.basePath, relativePath);
    const pathFromBase = path.relative(this.target.basePath, filePath);
    if (pathFromBase.startsWith(".." + path.sep) || path.isAbsolute(pathFromBase)) {
      this.warn("The image must remain inside the selected project or directory.");
      return;
    }
    if (!path.basename(filePath)) return;

    if (fs.existsSync(filePath) && this.overwritePath !== filePath) {
      this.overwritePath = filePath;
      this.warn("The file already exists. Confirm again to overwrite it.");
      return;
    }

    this.saving = true;
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      const extension = path.extname(filePath).toLowerCase();
      const imageBuffer = [".jpg", ".jpeg"].includes(extension)
        ? this.nativeImage.createFromBuffer(this.pngBuffer).toJPEG(95)
        : this.pngBuffer;
      await fs.promises.writeFile(filePath, imageBuffer);

      const editor = this.target.editor;
      if (editor && !editor.isDestroyed()) {
        const editorDirectory = editor.getPath()
          ? path.dirname(editor.getPath())
          : this.target.basePath;
        let insertionPath = path.relative(editorDirectory, filePath);
        if (atom.config.get("image-paste.forwardSlash")) {
          insertionPath = insertionPath.replace(/\\/g, "/");
        }
        editor.insertText(insertionPath);
      }
      this.hide();
    } catch (error) {
      atom.notifications.addError("Unable to save the clipboard image.", {
        detail: error.message,
        dismissable: true,
      });
    } finally {
      this.saving = false;
    }
  }
};
