const { CompositeDisposable, Emitter, Range, Point } = require("atom");
const path = require("path");
const { InputDialogView } = require("@lumine-code/select-list");
const { getFullExtension } = require("./helpers");

module.exports = class Dialog {
  constructor(param) {
    if (param == null) {
      param = {};
    }
    const { initialPath, select, iconClass, prompt, checkboxes } = param;
    this.emitter = new Emitter();
    this.disposables = new CompositeDisposable();

    // The prompt renders above the input as an icon label.
    this.promptText = document.createElement("label");
    this.promptText.classList.add("icon");
    if (iconClass) {
      this.promptText.classList.add(iconClass);
    }
    this.promptText.textContent = prompt;

    this.inputDialogView = new InputDialogView({
      className: "tree-view-dialog",
      headerElement: this.promptText,
      checkboxes,
      didChangeQuery: () => this.showError(),
      didConfirm: (newPath) => this.onConfirm(newPath),
      didCancel: () => this.cancel(),
    });
    this.element = this.inputDialogView.element;
    this.miniEditor = this.inputDialogView.refs.queryEditor;

    this.miniEditor.setText(initialPath);

    if (select) {
      let selectionEnd;
      const extension = getFullExtension(initialPath);
      const baseName = path.basename(initialPath);
      const selectionStart = initialPath.length - baseName.length;
      if (baseName === extension) {
        selectionEnd = initialPath.length;
      } else {
        selectionEnd = initialPath.length - extension.length;
      }
      this.selectionRange = Range(Point(0, selectionStart), Point(0, selectionEnd));
    }
  }

  attach() {
    this.inputDialogView.show();
    // Show() selects the whole query; restore the narrower base-name selection.
    if (this.selectionRange) {
      this.miniEditor.setSelectedBufferRange(this.selectionRange);
    }
    this.miniEditor.scrollToCursorPosition();
  }

  close() {
    this.emitter.dispose();
    this.disposables.dispose();
    this.inputDialogView.destroy();
    const activePane = atom.workspace.getCenter().getActivePane();
    if (!activePane.isDestroyed()) {
      return activePane.activate();
    }
  }

  cancel() {
    this.close();
    document.querySelector(".tree-view")?.focus();
  }

  showError(message) {
    if (message == null) {
      message = "";
    }
    this.inputDialogView.update({ errorMessage: message });
    if (message) {
      this.element.classList.add("error");
      window.setTimeout(() => this.element.classList.remove("error"), 300);
    }
  }
};
