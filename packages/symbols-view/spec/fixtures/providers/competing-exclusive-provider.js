const { Point } = require('atom');

function last (arr) {
  return arr[arr.length - 1];
}

module.exports = {
  packageName: 'symbol-provider-competing-exclusive',
  name: 'Competing Exclusive',
  isExclusive: true,
  canProvideSymbols () {
    return 0.9;
  },
  getSymbols (meta) {
    let { editor, type } = meta;
    let results = [];
    if (type === 'file') {
      let count = editor.getLineCount();
      // Put a symbol on every third line.
      for (let i = 0; i < count; i += 3) {
        results.push({
          position: new Point(i, 0),
          name: `Symbol on Row ${i + 1}`
        });
      }
    } else if (type === 'project') {
      let root = last(atom.project.getPaths());
      let count = editor.getLineCount();
      // Put a symbol on every third line.
      for (let i = 0; i < count; i += 3) {
        results.push({
          position: new Point(i, 0),
          name: `Symbol on Row ${i + 1}`,
          directory: root,
          file: 'other-file.js'
        });
      }
    }
    return results;
  }
};
