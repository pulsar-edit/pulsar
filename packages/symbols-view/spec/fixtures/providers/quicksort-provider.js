const { Point } = require('atom');
const path = require('path');

function last (arr) {
  return arr[arr.length - 1];
}

module.exports = {
  packageName: 'symbol-provider-quicksort',
  name: 'Quicksort',
  isExclusive: true,
  canProvideSymbols (meta) {
    return true;
  },
  getSymbols (meta) {
    let { editor, type } = meta;
    let results = [];
    if (type === 'file') {
      let count = editor.getLineCount();
      // Put a symbol on every third line.
      for (let i = 0; i < count; i += 3) {
        let name = `Symbol on Row ${i + 1}`;
        if (i === 0) name = 'quicksort';
        results.push({
          position: new Point(i, 0),
          name
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
