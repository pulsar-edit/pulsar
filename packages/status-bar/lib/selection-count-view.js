/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let SelectionCountView;
const _ = require('underscore-plus');

module.exports =
(SelectionCountView = class SelectionCountView {
  constructor() {
    let left;
    this.element = document.createElement('status-bar-selection');
    this.element.classList.add('selection-count', 'inline-block');

    this.tooltipElement = document.createElement('div');
    this.tooltipDisposable = atom.tooltips.add(this.element, {item: this.tooltipElement});

    this.formatString = (left = atom.config.get('status-bar.selectionCountFormat')) != null ? left : '(%L, %C)';

    this.activeItemSubscription = atom.workspace.onDidChangeActiveTextEditor(() => this.subscribeToActiveTextEditor());

    this.subscribeToConfig();
    this.subscribeToActiveTextEditor();
  }

  destroy() {
    this.activeItemSubscription.dispose();
    this.selectionSubscription?.dispose();
    this.configSubscription?.dispose();
    return this.tooltipDisposable.dispose();
  }

  subscribeToConfig() {
    this.configSubscription?.dispose();
    return this.configSubscription = atom.config.observe('status-bar.selectionCountFormat', value => {
      this.formatString = value != null ? value : '(%L, %C)';
      return this.scheduleUpdateCount();
    });
  }

  subscribeToActiveTextEditor() {
    this.selectionSubscription?.dispose();
    const activeEditor = this.getActiveTextEditor();
    const selectionsMarkerLayer = activeEditor?.selectionsMarkerLayer;
    this.selectionSubscription = selectionsMarkerLayer?.onDidUpdate(this.scheduleUpdateCount.bind(this));
    return this.scheduleUpdateCount();
  }

  getActiveTextEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  scheduleUpdateCount() {
    if (!this.scheduledUpdate) {
      this.scheduledUpdate = true;
      return atom.views.updateDocument(() => {
        this.updateCount();
        return this.scheduledUpdate = false;
      });
    }
  }

  updateCount() {
    const count = this.getActiveTextEditor()?.getSelectedText().length;
    const range = this.getActiveTextEditor()?.getSelectedBufferRange();
    let lineCount = range?.getRowCount();
    if (range?.end.column === 0) { lineCount -= 1; }
    if (count > 0) {
      this.element.textContent = this.formatString.replace('%L', lineCount).replace('%C', count);
      return this.tooltipElement.textContent = `${_.pluralize(lineCount, 'line')}, ${_.pluralize(count, 'character')} selected`;
    } else {
      this.element.textContent = '';
      return this.tooltipElement.textContent = '';
    }
  }
});
