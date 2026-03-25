const { CompositeDisposable, Emitter } = require('atom');

const Config = {
  activate() {
    if (this.activated) return;
    this.emitter ??= new Emitter();
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.onDidChange('symbols-view', config => {
        this.emitter.emit('did-change-config', config);
      })
    );
    this.activated = true;
  },

  deactivate() {
    this.activated = false;
    this.subscriptions?.dispose();
  },

  getForEditor(editor, key) {
    let grammar = editor.getGrammar();
    return atom.config.get(`symbols-view.${key}`, { scope: [grammar?.scopeName] });
  },

  get(key) {
    return atom.config.get(`symbols-view.${key}`);
  },

  set(key, value) {
    return atom.config.set(`symbols-view.${key}`, value);
  },

  observe(key, callback) {
    return atom.config.observe(`symbols-view.${key}`, callback);
  },

  onDidChange(callback) {
    return this.emitter.on('did-change-config', callback);
  }
};

module.exports = Config;
