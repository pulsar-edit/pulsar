"use babel";

import { SelectListView, highlightMatches } from "@lumine-code/select-list";
import repositoryForPath from "./helpers";

export default class DiffListView {
  constructor() {
    this.selectListView = new SelectListView({
      className: "diff-list-view",
      emptyMessage: "No diffs in file",
      items: [],
      filterKeyForItem: (diff) => diff.lineText,
      elementForItem: (diff, { filterKey, matchIndices }) => ({
        primary: highlightMatches(filterKey, matchIndices),
        secondary: `-${diff.oldStart},${diff.oldLines} +${diff.newStart},${diff.newLines}`,
      }),
      didConfirmSelection: (diff) => {
        this.selectListView.hide();
        const bufferRow = diff.newStart > 0 ? diff.newStart - 1 : diff.newStart;
        this.editor.setCursorBufferPosition([bufferRow, 0], {
          autoscroll: true,
        });
        this.editor.moveToFirstCharacterOfLine();
      },
      didCancelSelection: () => {
        this.selectListView.hide();
      },
    });
  }

  destroy() {
    return this.selectListView.destroy();
  }

  async toggle() {
    const editor = atom.workspace.getActiveTextEditor();
    if (this.selectListView.isVisible()) {
      this.selectListView.hide();
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
        diff.lineText = lineText ? lineText.trim() : "";
      }

      this.selectListView.reset();
      await this.selectListView.update({ items: diffs });
      this.selectListView.show();
    }
  }
}
