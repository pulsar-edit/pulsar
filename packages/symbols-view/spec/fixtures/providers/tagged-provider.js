const { Point } = require('atom');
const path = require('path');

function last (arr) {
  return arr[arr.length - 1];
}

const MOCK_FILE_NAME = 'tagged.js';
const MOCK_RESULT_COUNT = 1;

module.exports = {
  // If you change these values, you MUST remember to call `reset` in an
  // `afterEach` block!
  mockResultCount: MOCK_RESULT_COUNT,
  mockFileName: MOCK_FILE_NAME,

  reset () {
    this.mockFileName = MOCK_FILE_NAME;
    this.mockResultCount = MOCK_RESULT_COUNT;
  },

  packageName: 'symbol-provider-tagged',
  name: 'Tagged',
  isExclusive: true,
  canProvideSymbols (meta) {
    if (!meta.type === 'project') return false;
    return true;
  },
  getSymbols (meta) {
    let root = last(atom.project.getPaths());
    let { editor, type } = meta;
    let results = [];
    if (!type.includes('project')) return [];
    for (let i = 0; i < this.mockResultCount; i++) {
      results.push({
        directory: root,
        file: this.mockFileName,
        position: new Point(2 + i, 10),
        name: 'callMeMaybe'
      });
    }
    return results;
  }
};
