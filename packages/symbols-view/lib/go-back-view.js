
const SymbolsView = require('./symbols-view');

// TODO: Does this really need to extend SymbolsView?
module.exports = class GoBackView extends SymbolsView {
  toggle() {
    let previous = this.stack.pop();
    if (!previous) return;

    let restorePosition = () => {
      if (!previous.position) return;
      this.moveToPosition(previous.position, { beginningOfLine: false });
    };

    let allEditors = atom.workspace.getTextEditors();
    let previousEditor = allEditors.find(e => e.id === previous.editorId);

    if (previousEditor) {
      let pane = atom.workspace.paneForItem(previousEditor);
      pane.setActiveItem(previousEditor);
      restorePosition();
    } else if (previous.file) {
      // The editor is not there anymore; e.g., a package like `zentabs` might
      // have automatically closed it when a new editor view was opened. So we
      // should restore it if we can.
      atom.workspace.open(previous.file).then(restorePosition);
    }
  }
}
