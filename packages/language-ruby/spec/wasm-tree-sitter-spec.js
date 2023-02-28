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

    normalizeTreeSitterTextData(editor, /#/).forEach(({expected, editorPosition, testPosition}) => {
      expect(editor.scopeDescriptorForBufferPosition(editorPosition).scopes).toSatisfy((scopes, reason) => {
        reason(`Expected to find scope "${expected}" but found "${scopes}"\n` +
          `      at class-wasm-ts.rb:${testPosition.row+1}:${testPosition.column+1}`
        )
        return scopes.indexOf(expected) !== -1
      })
    })
  });

  it('folds code', async () => {
    const editor = await openDocument('folds.rb');
    let grouped = {}
    normalized = normalizeTreeSitterTextData(editor, /#/).forEach(test => {
      const [kind, id] = test.expected.split('.')
      if(!kind || !id) {
        throw new Error(dedent`Folds must be in the format fold_end.some-id
          at ${test.testPosition.row+1}:${test.testPosition.column+1}`)
      }
      grouped[id] ||= {}
      grouped[id][kind] = test
    })
    for(const k in grouped) {
      const v = grouped[k]
      const keys = Object.keys(v)
      if(keys.indexOf('fold_begin') === -1)
        throw new Error(`Fold ${k} must contain fold_begin`)
      if(keys.indexOf('fold_end') === -1)
        throw new Error(`Fold ${k} must contain fold_end`)
      if(keys.indexOf('fold_new_position') === -1)
        throw new Error(`Fold ${k} must contain fold_new_position`)
    }

    for(const k in grouped) {
      const fold = grouped[k]
      const begin = fold['fold_begin']
      const end = fold['fold_end']
      const newPos = fold['fold_new_position']

      expect(editor.isFoldableAtBufferRow(begin.editorPosition.row))
        .toSatisfy((foldable, reason) => {
          reason(dedent`Editor is not foldable at row ${begin.editorPosition.row+1}
            at fixtures/folds.rb:${begin.testPosition.row+1}:${begin.testPosition.column+1}`)
          return foldable
        })
        editor.foldBufferRow(begin.editorPosition.row)

      expect(editor.screenPositionForBufferPosition(end.editorPosition))
        .toSatisfy((screenPosition, reason) => {
          const {row,column} = newPos.editorPosition
          reason(`At row ${begin.editorPosition.row+1}, editor should fold ` +
            `up to the ${end.editorPosition.row+1}:${end.editorPosition.column+1}\n` +
            `    into the new position  ${row+1}:${column+1}\n`+
            `    but folded to position ${screenPosition.row+1}:${screenPosition.column+1}\n`+
            `      at fixtures/folds.rb:${newPos.testPosition.row+1}:${newPos.testPosition.column+1}\n` +
            `      at fixtures/folds.rb:${end.testPosition.row+1}:${end.testPosition.column+1}`)
          return row === screenPosition.row && column === screenPosition.column
        })
      editor.unfoldAll()
    }
  });
});

async function openDocument(fileName) {
  const fullPath = path.join(__dirname, 'fixtures', fileName)
  const editor = await atom.workspace.open(fullPath)
  await editor.languageMode.ready
  return editor
}

// function normalizeTestData(editor, commentRegex) {
//   let allMatches = [], lastNonComment = 0
//   editor.getBuffer().getLines().forEach((row, i) => {
//     const m = row.match(commentRegex)
//     if(m) {
//       const scope = editor.scopeDescriptorForBufferPosition([i, m.index])
//       if(scope.scopes.find(s => s.match(/comment/))) {
//         allMatches.push({row: lastNonComment, text: row, col: m.index, testRow: i})
//         return
//       }
//     }
//     lastNonComment = i
//   })
//   return allMatches.map(({text, row, col, testRow}) => {
//     const exactPos = text.match(/\^\s+(.*)/)
//     if(exactPos) {
//       const expected = exactPos[1]
//       return {
//         expected,
//         editorPosition: {row, column: exactPos.index},
//         testPosition: {row: testRow, column: col}
//       }
//     } else {
//       const pos = text.match(/\<-\s+(.*)/)
//       return {
//         expected: pos[1],
//         editorPosition: {row, column: col},
//         testPosition: {row: testRow, column: col}
//       }
//     }
//   })
// }
