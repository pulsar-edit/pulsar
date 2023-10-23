const {CompositeDisposable} = require('atom');

module.exports = class WrapGuideElement {
  #_when = null;
  #_shouldShow = null;
  constructor(editor, editorElement, when) {
    this.editor = editor;
    this.editorElement = editorElement;
    this.subscriptions = new CompositeDisposable();
    this.configSubscriptions = new CompositeDisposable();
    this.softWrapAPLLsubscriptions = null;
    this.element = document.createElement('div');
    this.element.setAttribute('is', 'wrap-guide');
    this.element.classList.add('wrap-guide-container');
    this.attachToLines();
    this.handleEvents();
    this.setWhen(when);

    this.element.updateGuide = (async () => await this.updateGuide()).bind(this);
    this.element.getDefaultColumn = this.getDefaultColumn.bind(this);
  }

  get shouldShow() { return this.#_shouldShow; }
  get when() { return this.#_when; }

  setWhen(when) {
    if (when == this.when) return;
    this.#_when = when;
    this.updateWhen();
  }

  async updateWhen() {
    switch (this.when) {
    case "atPreferredLineLength":
      this.#_shouldShow = this.editor.isSoftWrapped() && atom.config.get('editor.softWrapAtPreferredLineLength', {scope: this.editor.getRootScopeDescriptor()});
      break;
    case "wrapping":
      this.#_shouldShow = this.editor.isSoftWrapped();
      break;
    default: // "always"
      this.#_shouldShow = true;
      break;
    }
    await this.updateGuide();
  }

  attachToLines() {
    const scrollView = this.editorElement.querySelector('.scroll-view');
    return (scrollView != null ? scrollView.appendChild(this.element) : undefined);
  }

  handleEvents() {
    const updateGuideCallback = async () => await this.updateGuide();

    this.handleConfigEvents();

    this.subscriptions.add(this.editor.onDidChangeSoftWrapped(async (wrapped) => {
      if (this.when === null) return;
      await this.updateWhen();
    }));

    this.subscriptions.add(atom.config.onDidChange('editor.fontSize', async () => {
      // Wait for editor to finish updating before updating wrap guide
      await this.editorElement.getComponent().getNextUpdatePromise();
      updateGuideCallback();
    }));

    this.subscriptions.add(this.editorElement.onDidChangeScrollLeft(updateGuideCallback));
    this.subscriptions.add(this.editor.onDidChangePath(updateGuideCallback));
    this.subscriptions.add(this.editor.onDidChangeGrammar(async () => {
      this.configSubscriptions.dispose();
      this.handleConfigEvents();
      await this.updateWhen();
    }));

    this.subscriptions.add(this.editor.onDidDestroy(() => {
      this.subscriptions.dispose();
      if (this.softWrapAPLLsubscriptions) this.softWrapAPLLsubscriptions.dispose();
      this.configSubscriptions.dispose();
    }));

    this.subscriptions.add(this.editorElement.onDidAttach(async () => {
      this.attachToLines();
      await updateGuideCallback();
    }));
  }

  handleConfigEvents() {
    const {uniqueAscending} = require('./main');

    if (this.softWrapAPLLsubscriptions) this.softWrapAPLLsubscriptions.dispose();
    this.softWrapAPLLsubscriptions = new CompositeDisposable();

    this.softWrapAPLLsubscriptions.add(atom.config.onDidChange('editor.softWrapAtPreferredLineLength',
      {scope: this.editor.getRootScopeDescriptor()}, async ({newValue}) => {
      if (this.when === null) return;
      await this.updateWhen();
    }));

    const updatePreferredLineLengthCallback = async (args) => {
      // ensure that the right-most wrap guide is the preferredLineLength
      let columns = atom.config.get('wrap-guide.columns', {scope: this.editor.getRootScopeDescriptor()});
      if (columns.length > 0) {
        columns[columns.length - 1] = args.newValue;
        columns = uniqueAscending(Array.from(columns).filter((i) => i <= args.newValue));
        atom.config.set('wrap-guide.columns', columns,
          {scopeSelector: `.${this.editor.getGrammar().scopeName}`});
      }
      return await this.updateGuide();
    };
    this.configSubscriptions.add(atom.config.onDidChange(
      'editor.preferredLineLength',
      {scope: this.editor.getRootScopeDescriptor()},
      updatePreferredLineLengthCallback
    ));

    const updateGuideCallback = async () => await this.updateGuide();
    this.configSubscriptions.add(atom.config.onDidChange(
      'wrap-guide.enabled',
      {scope: this.editor.getRootScopeDescriptor()},
      updateGuideCallback
    ));

    const updateGuidesCallback = async (args) => {
      // ensure that multiple guides stay sorted in ascending order
      const columns = uniqueAscending(args.newValue);
      if (columns != null ? columns.length : undefined) {
        atom.config.set('wrap-guide.columns', columns);
        if (atom.config.get('wrap-guide.modifyPreferredLineLength')) {
          atom.config.set('editor.preferredLineLength', columns[columns.length - 1],
            {scopeSelector: `.${this.editor.getGrammar().scopeName}`});
        }
        return await this.updateGuide();
      }
    };
    return this.configSubscriptions.add(atom.config.onDidChange(
      'wrap-guide.columns',
      {scope: this.editor.getRootScopeDescriptor()},
      updateGuidesCallback
    ));
  }

  getDefaultColumn() {
    return atom.config.get('editor.preferredLineLength', {scope: this.editor.getRootScopeDescriptor()});
  }

  getGuidesColumns(path, scopeName) {
    let left;
    const columns = (left = atom.config.get('wrap-guide.columns', {scope: this.editor.getRootScopeDescriptor()})) != null ? left : [];
    if (columns.length > 0) { return columns; }
    return [this.getDefaultColumn()];
  }

  isEnabled() {
    let left;
    return (left = atom.config.get('wrap-guide.enabled', {scope: this.editor.getRootScopeDescriptor()})) != null ? left : true;
  }

  hide() {
    return this.element.style.display = 'none';
  }

  show() {
    return this.element.style.display = 'block';
  }

  updateGuide() {
    if (this.isEnabled())
      return this.updateGuides();
    else return this.hide();
  }

  updateGuides() {
    this.removeGuides();
    if (!this.shouldShow) return this.hide();
    this.appendGuides();
    if (this.element.children.length) {
      return this.show();
    } else {
      return this.hide();
    }
  }

  destroy() {
    this.element.remove();
    this.subscriptions.dispose();
    if (this.softWrapAPLLsubscriptions) this.softWrapAPLLsubscriptions.dispose();
    return this.configSubscriptions.dispose();
  }

  removeGuides() {
    return (() => {
      const result = [];
      while (this.element.firstChild) {
        result.push(this.element.removeChild(this.element.firstChild));
      }
      return result;
    })();
  }

  appendGuides() {
    const columns = this.getGuidesColumns(this.editor.getPath(), this.editor.getGrammar().scopeName);
    return (() => {
      const result = [];
      for (let column of columns) {
        if (!(column < 0)) {
          result.push(this.appendGuide(column));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  appendGuide(column) {
    let columnWidth = this.editorElement.getDefaultCharacterWidth() * column;
    columnWidth -= this.editorElement.getScrollLeft();
    const guide = document.createElement('div');
    guide.classList.add('wrap-guide');
    guide.style.left = `${Math.round(columnWidth)}px`;
    return this.element.appendChild(guide);
  }
};
