const { Point } = require('atom');

function wait (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  packageName: 'symbol-provider-very-slow',
  name: 'Very Slow',
  isExclusive: false,
  canProvideSymbols () {
    return true;
  },
  async getSymbols (meta) {
    let { signal } = meta;
    await wait(3000);
    if (signal.aborted) {
      return null;
    }
    return [
      {
        position: new Point(0, 0),
        name: `Slow Symbol on Row 1`
      }
    ];
  }
};
