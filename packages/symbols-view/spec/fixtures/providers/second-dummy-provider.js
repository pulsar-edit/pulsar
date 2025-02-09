const { Point } = require('atom');

function last(arr) {
  return arr[arr.length - 1];
}

const ICONS = [
  'icon-package',
  'icon-key',
  'icon-gear',
  'icon-tag',
  null
];

module.exports = {
  packageName: 'symbol-provider-dummy-second',
  name: 'Dummy (Second)',
  isExclusive: true,
  canProvideSymbols() {
    return true;
  },
  getSymbols(meta) {
    let { editor, type } = meta;
    let results = [];
    if (type === 'file') {
      let count = editor.getLineCount();
      // Put a symbol on every third line.
      for (let i = 0; i < count; i += 3) {
        results.push({
          position: new Point(i, 0),
          name: `(Second) Symbol on Row ${i + 1}`,
          icon: ICONS[(i / 3) % (ICONS.length + 1)]
        });
      }
    } else if (type === 'project') {
      let root = last(atom.project.getPaths());
      let count = editor.getLineCount();
      // Put a symbol on every third line.
      for (let i = 0; i < count; i += 3) {
        results.push({
          position: new Point(i, 0),
          name: `(Second) Symbol on Row ${i + 1}`,
          directory: root,
          file: 'other-file.js',
          icon: ICONS[i % (ICONS.length + 1)]
        });
      }
    }
    return results;
  }
};
