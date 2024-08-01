const { Point } = require('atom');
// const path = require('path');

function last (arr) {
  return arr[arr.length - 1];
}

async function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const ICONS = [
  'icon-package',
  'icon-key',
  'icon-gear',
  'icon-tag',
  null
];

module.exports = {
  packageName: 'symbol-provider-dummy-async',
  name: 'Dummy (Async)',
  isExclusive: true,
  canProvideSymbols (_meta) {
    return true;
  },
  async getSymbols (meta, listController) {
    let { editor, type } = meta;
    let results = [];
    if (type === 'file') {
      let count = editor.getLineCount();
      // Put a symbol on every third line.
      for (let i = 0; i < count; i += 3) {
        results.push({
          position: new Point(i, 0),
          name: `Symbol on Row ${i + 1}`,
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
          name: `Symbol on Row ${i + 1}`,
          directory: root,
          file: 'other-file.js',
          icon: ICONS[i % (ICONS.length + 1)]
        });
      }
    }
    await wait(100);
    listController.set({ loadingMessage: 'Loading…' });
    await wait(250);
    listController.clear('loadingMessage');
    return results;
  }
};
