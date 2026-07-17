"use babel";

import { Point } from "atom";
const { InputDialogView } = require("@lumine-code/select-list");

const HELP_MESSAGE =
  'Enter a <row> or <row>:<column> to go there. Examples: "3" for row 3 or "2:7" for row 2 and column 7';

class GoToLineView {
  constructor() {
    this.inputDialogView = new InputDialogView({
      className: "go-to-line",
      infoMessage: HELP_MESSAGE,
      didChangeQuery: () => this.navigate({ keepOpen: true }),
      didConfirm: () => this.navigate(),
      didCancel: () => this.close(),
    });
    this.miniEditor = this.inputDialogView.refs.queryEditor;
    this.miniEditor.onWillInsertText((arg) => {
      if (arg.text.match(/[^0-9:]/)) {
        arg.cancel();
      }
    });

    // Create the (hidden) modal panel eagerly so `panel` is available before the
    // first toggle, matching the previous constructor behavior.
    this.panel = this.inputDialogView.getPanel();

    atom.commands.add("atom-text-editor", "go-to-line:toggle", () => {
      this.toggle();
      return false;
    });
  }

  toggle() {
    this.inputDialogView.isVisible() ? this.close() : this.open();
  }

  open() {
    if (this.inputDialogView.isVisible() || !atom.workspace.getActiveTextEditor()) return;
    this.inputDialogView.show();
  }

  close() {
    if (!this.inputDialogView.isVisible()) return;
    this.inputDialogView.reset();
    this.inputDialogView.hide();
  }

  navigate(options = {}) {
    const lineNumber = this.miniEditor.getText();
    const editor = atom.workspace.getActiveTextEditor();
    if (!options.keepOpen) {
      this.close();
    }
    if (!editor || !lineNumber.length) return;

    const currentRow = editor.getCursorBufferPosition().row;
    const rowLineNumber = lineNumber.split(/:+/)[0] || "";
    const row = rowLineNumber.length > 0 ? parseInt(rowLineNumber) - 1 : currentRow;
    const columnLineNumber = lineNumber.split(/:+/)[1] || "";
    const column = columnLineNumber.length > 0 ? parseInt(columnLineNumber) - 1 : -1;

    const position = new Point(row, column);
    editor.setCursorBufferPosition(position);
    editor.unfoldBufferRow(row);
    if (column < 0) {
      editor.moveToFirstCharacterOfLine();
    }
    editor.scrollToBufferPosition(position, {
      center: true,
    });
  }
}

export default {
  activate() {
    return new GoToLineView();
  },
};
