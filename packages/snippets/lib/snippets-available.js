/** @babel */

import _ from "underscore-plus";
import { SelectListView } from "select-list";

export default class SnippetsAvailable {
  constructor(snippets) {
    this.snippets = snippets;
    this.selectListView = new SelectListView({
      className: "available-snippets",
      panelItem: this,
      items: [],
      filterKeyForItem: (snippet) => snippet.searchText,
      elementForItem: (snippet) => ({
        primary: snippet.prefix,
        secondary: snippet.name,
      }),
      didConfirmSelection: (snippet) => {
        for (const cursor of this.editor.getCursors()) {
          this.snippets.insert(snippet.bodyText, this.editor, cursor);
        }
        this.cancel();
      },
      didConfirmEmptySelection: () => {
        this.cancel();
      },
      didCancelSelection: () => {
        this.cancel();
      },
    });
    this.element = this.selectListView.element;
  }

  async toggle(editor) {
    this.editor = editor;
    if (this.selectListView.isVisible()) {
      this.cancel();
    } else {
      this.selectListView.reset();
      await this.populate();
      this.selectListView.show();
    }
  }

  cancel() {
    this.editor = null;
    this.selectListView.hide();
  }

  destroy() {
    return this.selectListView.destroy();
  }

  populate() {
    const snippets = Object.values(this.snippets.getSnippets(this.editor));
    for (let snippet of snippets) {
      snippet.searchText = _.compact([snippet.prefix, snippet.name]).join(" ");
    }
    return this.selectListView.update({ items: snippets });
  }
}
