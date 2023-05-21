const {CompositeDisposable} = require('atom');
const WrapGuideElement = require('./wrap-guide-element');

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable();
    this.wrapGuides = new Map();

    this.subscriptions.add(atom.workspace.observeTextEditors(editor => {
      if (this.wrapGuides.has(editor)) { return; }

      const editorElement = atom.views.getView(editor);
      const wrapGuideElement = new WrapGuideElement(editor, editorElement);

      this.wrapGuides.set(editor, wrapGuideElement);
      this.subscriptions.add(editor.onDidDestroy(() => {
        this.wrapGuides.get(editor).destroy();
        this.wrapGuides.delete(editor);
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
