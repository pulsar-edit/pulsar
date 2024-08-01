const { Point } = require('atom');

function last (arr) {
  return arr[arr.length - 1];
}

const SYMBOLS = [
  {
    name: 'Lorem ipsum',
    position: new Point(0, 0),
    file: 'other-file.js',
  },
  {
    name: 'Loyalty',
    position: new Point(1, 0),
    file: 'other-file.js',
  },
  {
    name: 'Lox',
    position: new Point(2, 0),
    file: 'other-file.js',
  },
  {
    name: 'Lo mein',
    position: new Point(3, 0),
    file: 'other-file.js',
  }
];

module.exports = {
  packageName: 'symbol-provider-progressive',
  name: 'Progressive Project Provider',
  isExclusive: true,
  canProvideSymbols (meta) {
    return meta.type === 'project';
  },
  getSymbols (meta, controller) {
    let root = last(atom.project.getPaths());
    let { type, query = '' } = meta;
    if (type !== 'project') return [];

    // Simulate a provider that requires a minimum character count.
    if (query.length < 3) {
      controller.set({ emptyMessage: 'Query must be at least 3 characters long.' });
      return [];
    } else {
      controller.clear('emptyMessage');
    }

    let results = SYMBOLS.filter(s => {
      let term = s.name.toLowerCase();
      return term.startsWith(query);
    });

    return results.map(r => ({ ...r, directory: root }));
  }
};
