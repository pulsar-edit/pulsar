const SelectListView = require('pulsar-select-list');
const repositoryForPath = require('./helpers');

module.exports =
class DiffListView {
  constructor() {
    this.selectList = new SelectListView({
      className: 'diff-list-view',
      emptyMessage: 'No diffs in file',
      items: [],
      filterKeyForItem: diff => diff.lineText,
      elementForItem: diff => {
        return SelectListView.createTwoLineItem({
          primary: diff.lineText,
          secondary: `-${diff.oldStart},${diff.oldLines} +${diff.newStart},${diff.newLines}`
        });
      },
      didConfirmSelection: diff => {
        this.cancel();
        const bufferRow = diff.newStart > 0 ? diff.newStart - 1 : diff.newStart;
        this.editor.setCursorBufferPosition([bufferRow, 0], {
          autoscroll: true
        });
        this.editor.moveToFirstCharacterOfLine();
      },
      didCancelSelection: () => {
        this.cancel();
      }
    });
  }

  attach() {
    this.selectList.reset();
    this.selectList.show();
  }

  cancel() {
    this.selectList.hide();
  }

  destroy() {
    this.cancel();
    return this.selectList.destroy();
  }

  async toggle() {
    const editor = atom.workspace.getActiveTextEditor();
    if (this.selectList.isVisible()) {
      this.cancel();
    } else if (editor) {
      this.editor = editor;
      const repository = await repositoryForPath(this.editor.getPath());
      let diffs = repository
        ? repository.getLineDiffs(this.editor.getPath(), this.editor.getText())
        : [];
      if (!diffs) diffs = [];
      for (let diff of diffs) {
        const bufferRow = diff.newStart > 0 ? diff.newStart - 1 : diff.newStart;
        const lineText = this.editor.lineTextForBufferRow(bufferRow);
        diff.lineText = lineText ? lineText.trim() : '';
      }

      await this.selectList.update({ items: diffs });
      this.attach();
    }
  }
}
