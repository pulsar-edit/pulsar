const { Emitter } = require("atom");

const HISTORY_MAX = 25;

class History {
  constructor(items = []) {
    this.items = items;
    this.emitter = new Emitter();
    this.length = this.items.length;
  }

  onDidAddItem(callback) {
    return this.emitter.on("did-add-item", callback);
  }

  serialize() {
    return this.items.slice(-HISTORY_MAX);
  }

  getLast() {
    return this.items.at(-1);
  }

  getAtIndex(index) {
    return this.items[index];
  }

  add(text) {
    this.items.push(text);
    this.length = this.items.length;
    this.emitter.emit("did-add-item", text);
  }

  clear() {
    this.items = [];
    this.length = 0;
  }
}

// Adds the ability to cycle through history
class HistoryCycler {
  // * `buffer` an {Editor} instance to attach the cycler to
  // * `history` a {History} object
  constructor(buffer, history) {
    this.buffer = buffer;
    this.history = history;
    this.index = this.history.length;
    this.scratch = null;

    this.history.onDidAddItem((text) => {
      if (text !== this.buffer.getText()) {
        this.buffer.setText(text);
      }
    });
  }

  addEditorElement(editorElement) {
    return atom.commands.add(editorElement, {
      "core:move-up": () => this.previous(),
      "core:move-down": () => this.next(),
    });
  }

  previous() {
    if (
      this.history.length === 0 ||
      (this.atLastItem() && this.buffer.getText() !== this.history.getLast())
    ) {
      this.scratch = this.buffer.getText();
    } else if (this.index > 0) {
      this.index--;
    }

    const item = this.history.getAtIndex(this.index);
    this.buffer.setText(item != null ? item : "");
  }

  next() {
    let item;
    if (this.index < this.history.length - 1) {
      this.index++;
      item = this.history.getAtIndex(this.index);
    } else if (this.scratch) {
      item = this.scratch;
    } else {
      item = "";
    }

    this.buffer.setText(item);
  }

  atLastItem() {
    return this.index === this.history.length - 1;
  }

  store() {
    const text = this.buffer.getText();
    if (!text || text === this.history.getLast()) {
      return;
    }
    this.scratch = null;
    this.history.add(text);
    this.index = this.history.length - 1;
  }
}

module.exports = { History, HistoryCycler };
