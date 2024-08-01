const { Point } = require('atom');

module.exports = {
  packageName: 'symbol-provider-empty',
  name: 'Empty',
  isExclusive: false,
  canProvideSymbols (meta) {
    return true;
  },
  getSymbols (meta) {
    return [];
  }
};
