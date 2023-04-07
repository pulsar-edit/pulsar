/** @babel */

import SymbolsView from './symbols-view';

export default class GoBackView extends SymbolsView {
  toggle() {
    const previousTag = this.stack.pop();
    if (!previousTag) {
      return;
    }

    const restorePosition = () => {
      if (previousTag.position) {
        this.moveToPosition(previousTag.position, false);
      }
    };

    const previousEditor = atom.workspace.getTextEditors().find(e => e.id === previousTag.editorId);

    if (previousEditor) {
      const pane = atom.workspace.paneForItem(previousEditor);
      pane.setActiveItem(previousEditor);
      restorePosition();
    } else if (previousTag.file) {
      atom.workspace.open(previousTag.file).then(restorePosition);
    }
  }
}
