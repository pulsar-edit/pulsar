const SelectListView = require('pulsar-select-list');
const { TextEditor } = require('atom');
const { setLineEnding } = require('./main');

class Selector {

  // Make a selector object (should be called once)
  constructor(selectorItems) {
    this.selectList = new SelectListView({
      items: selectorItems,

      elementForItem: lineEnding => {
        const element = document.createElement('li');
        element.textContent = lineEnding.name;
        return element;
      },

      filterKeyForItem: lineEnding => {
        return lineEnding.name;
      },

      didConfirmSelection: lineEnding => {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor instanceof TextEditor) {
          setLineEnding(editor, lineEnding.value);
        }
        this.hide();
      },

      didCancelSelection: () => {
        this.hide();
      }
    });
  }

  show() {
    this.selectList.reset();
    this.selectList.show();
  }

  hide() {
    this.selectList.hide();
  }

  dispose() {
    this.selectList.destroy();
  }
}

module.exports = { Selector };
