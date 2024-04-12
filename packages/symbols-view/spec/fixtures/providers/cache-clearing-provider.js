const { Emitter, Point } = require('atom');
// const path = require('path');

function last (arr) {
  return arr[arr.length - 1];
}

module.exports = {
  packageName: 'symbol-provider-cache-clearing',
  name: 'Cache-clearing',
  isExclusive: false,
  canProvideSymbols (_meta) {
    return true;
  },
  onShouldClearCache (callback) {
    this.emitter ??= new Emitter;
    return this.emitter.on('should-clear-cache', callback);
  },
  getSymbols (meta) {
    let { editor, type } = meta;
    let results = [];
    setTimeout(() => {
      this.emitter.emit('should-clear-cache', { editor });
    }, 0);
    if (type === 'file') {
      results = [{
        position: new Point(1, 0),
        name: 'Transient symbol on row 2'
      }];
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
