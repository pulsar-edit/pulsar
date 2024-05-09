const Variable = require('../lib/variable');
const {Point} = require('atom');

describe('Variable', () => {

  let fakeCursor = {
    getCurrentWordBufferRange () { return true; },
    getBufferRow () { return 9; },
  };

  let fakeSelectionRange = {
    isEmpty: () => false
  };

  let fakeEditor = {
    getTitle () { return 'foo.rb'; },
    getPath () { return '/Users/pulsar/code/foo.rb'; },
    getTextInBufferRange (x) {
      return x === true ? 'word' : 'this text is selected';
    },
    lineTextForBufferRow () {
      return `this may be considered an entire line for the purposes of variable tests`;
    }
  };

  let fakeParams = {editor: fakeEditor, cursor: fakeCursor, selectionRange: fakeSelectionRange};

  it('resolves to the right value', () => {
    const expected = {
      'TM_FILENAME': 'foo.rb',
      'TM_FILENAME_BASE': 'foo',
      'TM_CURRENT_LINE': `this may be considered an entire line for the purposes of variable tests`,
      'TM_CURRENT_WORD': 'word',
      'TM_LINE_INDEX': '9',
      'TM_LINE_NUMBER': '10',
      'TM_DIRECTORY': '/Users/pulsar/code',
      'TM_SELECTED_TEXT': 'this text is selected'
    };

    for (let variable in expected) {
      let vrbl = new Variable({variable});
      expect(
        vrbl.resolve(fakeParams)
      ).toEqual(expected[variable]);
    }

  });

  it('transforms', () => {
    let vrbl = new Variable({
      variable: 'TM_FILENAME',
      substitution: {
        find: /(?:^|_)([A-Za-z0-9]+)(?:\.rb)?/g,
        replace: [
          {escape: 'u'},
          {backreference: 1}
        ]
      },
      point: new Point(0, 0),
      snippet: {}
    });

    expect(
      vrbl.resolve({editor: fakeEditor})
    ).toEqual('Foo');
  });
});
