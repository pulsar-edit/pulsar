
const TreeSitterProvider = require('./tree-sitter-provider');

module.exports = {
  activate () {
    this.provider = new TreeSitterProvider();
  },

  deactivate () {
    this.provider?.destroy?.();
  },

  provideSymbols () {
    return this.provider;
  }
};
