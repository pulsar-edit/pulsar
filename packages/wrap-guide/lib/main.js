/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const {CompositeDisposable} = require('atom');
const WrapGuideElement = require('./wrap-guide-element');

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable();
    this.wrapGuides = new Map();

    return this.subscriptions.add(atom.workspace.observeTextEditors(editor => {
      if (this.wrapGuides.has(editor)) { return; }

      const editorElement = atom.views.getView(editor);
      const wrapGuideElement = new WrapGuideElement(editor, editorElement);

      this.wrapGuides.set(editor, wrapGuideElement);
      return this.subscriptions.add(editor.onDidDestroy(() => {
        this.wrapGuides.get(editor).destroy();
        return this.wrapGuides.delete(editor);
      })
      );
    })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
    this.wrapGuides.forEach((wrapGuide, editor) => wrapGuide.destroy());
    return this.wrapGuides.clear();
  },

  uniqueAscending(list) {
    return (list.filter((item, index) => list.indexOf(item) === index)).sort((a, b) => a - b);
  }
};
