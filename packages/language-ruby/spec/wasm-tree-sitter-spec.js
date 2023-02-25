const dedent = require('dedent');
const path = require('path');
const { Point } = require('atom');

describe('WASM Tree-sitter Ruby grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-ruby');
    atom.config.set('core.languageParser', 'wasm-tree-sitter');
  });

  it('tokenizes symbols', async () => {
    const editor = await openDocument('classes-wasm-ts.rb');

    normalizeTestData(editor, /#/).forEach(({expected, editorPosition, testPosition}) => {
      expect(editor.scopeDescriptorForBufferPosition(editorPosition).scopes).toSatisfy((scopes, reason) => {
        reason(dedent`
          Expected to find scope "${expected}" but found "${scopes}"
          at class-wasm-ts.rb:${testPosition.row+1}:${testPosition.column+1}
        `)
        return scopes.indexOf(expected) !== -1
      })
    })
  });
});

async function openDocument(fileName) {
  const fullPath = path.join(__dirname, 'fixtures', fileName)
  const editor = await atom.workspace.open(fullPath)
  await editor.languageMode.ready
  return editor
}

function normalizeTestData(editor, commentRegex) {
  let allMatches = [], lastNonComment = 0
  editor.getBuffer().getLines().forEach((row, i) => {
    const m = row.match(commentRegex)
    if(m) {
      const scope = editor.scopeDescriptorForBufferPosition([i, m.index])
      if(scope.scopes.find(s => s.match(/comment/))) {
        allMatches.push({row: lastNonComment, text: row, col: m.index, testRow: i})
        return
      }
    }
    lastNonComment = i
  })
  return allMatches.map(({text, row, col, testRow}) => {
    const exactPos = text.match(/\^\s+(.*)/)
    if(exactPos) {
      const expected = exactPos[1]
      return {
        expected,
        editorPosition: {row, column: exactPos.index},
        testPosition: {row: testRow, column: col}
      }
    } else {
      const pos = text.match(/\<-\s+(.*)/)
      return {
        expected: pos[1],
        editorPosition: {row, column: col},
        testPosition: {row: testRow, column: col}
      }
    }
  })
}
