// This will normalize the comments for the special format of grammar tests
// that TextMate and Tree-Sitter do
//
// Basically, receiving a text editor and the regex that probably defines
// what a comment is, it'll return an object with `expect` - that is what was
// expected to pass the test, like a scope description for example, and two
// Point-compatible fields - `editorPosition`, that is basically in what
// position of the editor `expect` should be satisfied, and `testPosition`, that
// is where in file the test actually happened. This makes it easier for us
// to construct an error showing where EXACTLY was the assertion that failed
function normalizeTreeSitterTextData(editor, commentRegex, trailingCommentRegex) {
  let allMatches = [], lastNonComment = 0
  const checkAssert = new RegExp('^\\s*' + commentRegex.source + '\\s*[\\<\\-|\\^]')
  editor.getBuffer().getLines().forEach((row, i) => {
    const m = row.match(commentRegex)
    if (m) {
      if (trailingCommentRegex) {
        row = row.replace(trailingCommentRegex, '')
      }
      // Strip extra space at the end of the line (but not the beginning!)
      row = row.replace(/\s+$/, '')
      // const scope = editor.scopeDescriptorForBufferPosition([i, m.index])
      // FIXME: use editor.scopeDescriptorForBufferPosition when it works
      const scope = editor.tokensForScreenRow(i)
      const scopes = scope.flatMap(e => e.scopes)
      if(scopes.find(s => s.match(/comment/)) && row.match(checkAssert)) {
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
      const pos = text.match(/<-\s+(.*)/)
      if(!pos) throw new Error(`Can't match ${text}`)
      return {
        expected: pos[1],
        editorPosition: {row, column: col},
        testPosition: {row: testRow, column: col}
      }
    }
  })
}
exports.normalizeTreeSitterTextData = normalizeTreeSitterTextData;
window.normalizeTreeSitterTextData = normalizeTreeSitterTextData

async function openDocument(fullPath) {
  const editor = await atom.workspace.open(fullPath);
  await editor.languageMode.ready;
  return editor;
}

async function runGrammarTests(fullPath, commentRegex, trailingCommentRegex = null) {
  const editor = await openDocument(fullPath);

  const normalized = normalizeTreeSitterTextData(editor, commentRegex, trailingCommentRegex)
  expect(normalized.length).toSatisfy((n, reason) => {
    reason("Tokenizer didn't run correctly - could not find any comment")
    return n > 0
  })
  normalized.forEach(({expected, editorPosition, testPosition}) => {
    expect(editor.scopeDescriptorForBufferPosition(editorPosition).scopes).toSatisfy((scopes, reason) => {
      const dontFindScope = expected.startsWith("!");
      expected = expected.replace(/^!/, "")
      if(dontFindScope) {
        reason(`Expected to NOT find scope "${expected}" but found it\n` +
          `      at ${fullPath}:${testPosition.row+1}:${testPosition.column+1}`
        );
      } else {
        reason(`Expected to find scope "${expected}" but found "${scopes}"\n` +
          `      at ${fullPath}:${testPosition.row+1}:${testPosition.column+1}`
        );
      }
      const normalized = expected.replace(/([\.\-])/g, '\\$1');
      const scopeRegex = new RegExp('^' + normalized + '(\\..+)?$');
      let result = scopes.find(e => e.match(scopeRegex)) !== undefined;
      if(dontFindScope) result = !result;
      return result
    })
  })
}
exports.runGrammarTests = runGrammarTests;
window.runGrammarTests = runGrammarTests;

async function runFoldsTests(fullPath, commentRegex) {
  const editor = await openDocument(fullPath);
  let grouped = {}
  const normalized = normalizeTreeSitterTextData(editor, commentRegex).forEach(test => {
    const [kind, id] = test.expected.split('.')
    if(!kind || !id) {
      throw new Error(`Folds must be in the format fold_end.some-id\n` +
        `      at ${test.testPosition.row+1}:${test.testPosition.column+1}`)
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
        reason(`Editor is not foldable at row ${begin.editorPosition.row+1}\n` +
          `      at ${fullPath}:${begin.testPosition.row+1}:${begin.testPosition.column+1}`)
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
          `      at ${fullPath}:${newPos.testPosition.row+1}:${newPos.testPosition.column+1}\n` +
          `      at ${fullPath}:${end.testPosition.row+1}:${end.testPosition.column+1}`)
        return row === screenPosition.row && column === screenPosition.column
      })
    editor.unfoldAll()
  }
}
exports.runFoldsTests = runFoldsTests;
window.runFoldsTests = runFoldsTests;
