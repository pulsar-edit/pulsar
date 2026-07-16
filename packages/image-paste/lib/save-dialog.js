const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { CompositeDisposable, Disposable, TextEditor } = require("atom");

module.exports = class SaveDialog {
  constructor({ nativeImage }) {
    this.nativeImage = nativeImage;
    this.disposables = new CompositeDisposable();
    this.element = document.createElement("div");
    this.element.classList.add("dialog", "image-paste", "save-dialog");

    this.miniEditor = new TextEditor({ mini: true });
    this.element.appendChild(this.miniEditor.element);
    this.disposables.add(atom.textEditors.add(this.miniEditor));

    this.previewElement = document.createElement("div");
    this.previewElement.classList.add("image-paste-preview");
    this.element.appendChild(this.previewElement);

    this.warningElement = document.createElement("div");
    this.warningElement.classList.add("image-paste-warning");
    this.warningElement.setAttribute("role", "alert");
    this.previewElement.appendChild(this.warningElement);

    this.imageElement = document.createElement("img");
    this.imageElement.alt = "Clipboard image preview";
    this.previewElement.appendChild(this.imageElement);

    const blurHandler = () => {
      if (document.hasFocus()) this.hide();
    };
    this.miniEditor.element.addEventListener("blur", blurHandler);
    this.disposables.add(
      new Disposable(() => this.miniEditor.element.removeEventListener("blur", blurHandler)),
      this.miniEditor.onDidChange(() => this.clearWarning()),
      atom.commands.add(this.element, {
        "core:confirm": () => this.confirm(),
        "core:cancel": () => this.hide(),
      }),
    );
  }

  destroy() {
    this.panel?.destroy();
    this.panel = null;
    this.miniEditor.destroy();
    this.disposables.dispose();
  }

  prepare({ target, pngBuffer, sourceName = null }) {
    this.target = target;
    this.pngBuffer = Buffer.from(pngBuffer);
    this.overwritePath = null;
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
    this.selectBaseName(initialPath);
    this.clearWarning();
    this.imageElement.src = atom.config.get("image-paste.imagePreview")
      ? `data:image/png;base64,${this.pngBuffer.toString("base64")}`
      : "";
    this.show();
  }

  show() {
    if (!this.panel) this.panel = atom.workspace.addModalPanel({ item: this });
    const activeElement = document.activeElement;
    if (activeElement && !activeElement.closest(".modal")) this.priorFocus = activeElement;
    this.panel.show();
    this.miniEditor.element.focus();
  }

  hide() {
    if (!this.panel?.isVisible()) return;
    this.panel.hide();
    this.priorFocus?.focus();
    this.priorFocus = null;
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
