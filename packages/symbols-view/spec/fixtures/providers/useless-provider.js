const { Point } = require('atom');

module.exports = {
  packageName: 'symbol-provider-useless',
  name: 'Useless',
  isExclusive: false,
  canProvideSymbols (meta) {
    return false;
  },
  getSymbols (meta) {
    return null;
  }
};
