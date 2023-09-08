const { TextEditor, CompositeDisposable, Disposable, Emitter, Range, Point } = require('atom');
const path = require('path');
const { getFullExtension } = require("./helpers");

module.exports =
class Dialog {
  constructor(param) {
    if (param == null) { param = {}; }
    const { initialPath, select, iconClass, prompt } = param;
    this.emitter = new Emitter();
    this.disposables = new CompositeDisposable();

    this.element = document.createElement('div');
    this.element.classList.add('tree-view-dialog');

    this.promptText = document.createElement('label');
    this.promptText.classList.add('icon');
    if (iconClass) { this.promptText.classList.add(iconClass); }
    this.promptText.textContent = prompt;
    this.element.appendChild(this.promptText);

    this.miniEditor = new TextEditor({mini: true});
    const blurHandler = () => {
      if (document.hasFocus()) { return this.close(); }
    };
    this.miniEditor.element.addEventListener('blur', blurHandler);
    this.disposables.add(new Disposable(() => this.miniEditor.element.removeEventListener('blur', blurHandler)));
    this.disposables.add(this.miniEditor.onDidChange(() => this.showError()));
    this.element.appendChild(this.miniEditor.element);

    this.errorMessage = document.createElement('div');
    this.errorMessage.classList.add('error-message');
    this.element.appendChild(this.errorMessage);

    atom.commands.add(this.element, {
      'core:confirm': () => this.onConfirm(this.miniEditor.getText()),
      'core:cancel': () => this.cancel()
    }
    );

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
      this.miniEditor.setSelectedBufferRange(Range(Point(0, selectionStart), Point(0, selectionEnd)));
    }
  }

  attach() {
    this.panel = atom.workspace.addModalPanel({item: this});
    this.miniEditor.element.focus();
    this.miniEditor.scrollToCursorPosition();
  }

  close() {
    const {
      panel
    } = this;
    this.panel = null;
    panel?.destroy();
    this.emitter.dispose();
    this.disposables.dispose();
    this.miniEditor.destroy();
    const activePane = atom.workspace.getCenter().getActivePane();
    if (!activePane.isDestroyed()) { return activePane.activate(); }
  }

  cancel() {
    this.close();
    document.querySelector('.tree-view')?.focus();
  }

  showError(message) {
    if (message == null) { message = ''; }
    this.errorMessage.textContent = message;
    if (message) {
      this.element.classList.add('error');
      window.setTimeout((() => this.element.classList.remove('error')), 300);
    }
  }
}
