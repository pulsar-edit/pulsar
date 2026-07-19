const { CompositeDisposable } = require("atom");

/**
 * Overtype Mode Package
 *
 * Enables overtype (overwrite) mode for text editors. The actual overwrite
 * behaviour lives in core (`TextEditor::applyOvertype`, driven from genuine
 * typed input in the editor component); this package only drives the per-editor
 * state via `TextEditor::setOvertypeMode` and provides the presentation:
 * commands, a global/per-editor toggle, the block-cursor class, and the status
 * bar indicator.
 */
module.exports = {
  /**
   * Activates the package and wires up commands, editor observation and the
   * status bar indicator.
   */
  activate() {
    this.global = false;
    this.switch = null;
    this.disposables = new CompositeDisposable();
    this.editorSubs = new CompositeDisposable();
    this.disposables.add(this.editorSubs);
    this.disposables.add(
      atom.config.onDidChange("overtype-mode.statusBar", (e) => {
        e.newValue ? this.activateStatusBar() : this.deactivateStatusBar();
      }),
      atom.textEditors.observe((editor) => {
        this.observeEditor(editor);
      }),
      atom.commands.add("atom-workspace", {
        "overtype-mode:toggle-global": () => {
          this.toggleGlobal();
        },
      }),
      atom.commands.add("atom-text-editor", {
        "overtype-mode:toggle-editor": (e) => {
          this.toggleEditor(e);
        },
      }),
    );
  },

  /**
   * Deactivates the package, disposes resources and clears any block cursors.
   */
  deactivate() {
    this.deactivateStatusBar();
    this.disposables.dispose();
    for (const element of document.getElementsByTagName("atom-text-editor")) {
      element.classList.remove("overtype-cursor");
    }
  },

  /**
   * Starts tracking an editor: applies the current global state, syncs the
   * block-cursor class and keeps it in sync with future mode changes.
   * @param {TextEditor} editor - The text editor to observe
   */
  observeEditor(editor) {
    if (this.global) {
      editor.setOvertypeMode(true);
    }
    this.updateEditorClass(editor);
    this.editorSubs.add(editor.onDidChangeOvertypeMode(() => this.updateEditorClass(editor)));
  },

  /**
   * Reflects an editor's overtype state on its element via the block-cursor class.
   * @param {TextEditor} editor - The text editor to update
   */
  updateEditorClass(editor) {
    editor.getElement().classList.toggle("overtype-cursor", editor.isOvertypeMode());
  },

  /**
   * Toggles overtype mode for the editor targeted by a command event.
   * @param {Event} e - The triggering command event
   */
  toggleEditor(e) {
    const element = e.target.closest("atom-text-editor");
    const editor = element.getModel();
    editor.toggleOvertypeMode();
  },

  /**
   * Toggles overtype mode globally for all editors and sets the default for
   * editors opened afterwards.
   */
  toggleGlobal() {
    this.global = !this.global;
    for (const element of document.getElementsByTagName("atom-text-editor")) {
      element.getModel().setOvertypeMode(this.global);
    }
    if (this.switch) {
      this.switch.update();
    }
  },

  /**
   * Consumes the status bar service.
   * @param {Object} statusBar - The status bar service
   */
  consumeStatusBar(statusBar) {
    this.statusBar = statusBar;
    if (!atom.config.get("overtype-mode.statusBar")) {
      return;
    }
    this.activateStatusBar();
  },

  /**
   * Activates the status bar indicator.
   */
  activateStatusBar() {
    if (!this.statusBar) {
      return;
    }
    this.switch = this.createSwitch();
    this.switch.update();
    this.statusBar.addRightTile({ item: this.switch, priority: -80 });
    this.tooltipDisposable = atom.tooltips.add(this.switch, {
      title: () => `Overtype mode is ${this.global ? "enabled" : "disabled"}`,
      keyBindingCommand: "overtype-mode:toggle-global",
      keyBindingTarget: atom.views.getView(atom.workspace),
    });
  },

  /**
   * Deactivates the status bar indicator.
   */
  deactivateStatusBar() {
    if (!this.switch) {
      return;
    }
    this.tooltipDisposable?.dispose();
    this.tooltipDisposable = null;
    this.switch.remove();
    this.switch = null;
  },

  /**
   * Creates the status bar switch element.
   * @returns {HTMLElement} The switch element with an `update` method
   */
  createSwitch() {
    const element = document.createElement("div");
    element.classList.add("overtype-mode-icon", "inline-block");
    let iconSpan = document.createElement("span");
    iconSpan.classList.add("icon", "is-icon-only", "icon-ruby");
    element.appendChild(iconSpan);
    element.onmouseup = (e) => {
      if (e.which === 1) {
        this.toggleGlobal();
      }
    };
    element.update = () => {
      if (this.global) {
        iconSpan.classList.add("active");
      } else {
        iconSpan.classList.remove("active");
      }
    };
    return element;
  },
};
