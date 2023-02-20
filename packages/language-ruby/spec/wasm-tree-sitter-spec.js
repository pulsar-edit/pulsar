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

    let allMatches = [], lastNonComment = 0
    editor.getBuffer().getLines().forEach((row, i) => {
      const m = row.match(/#/)
      if(m) {
        const scope = editor.scopeDescriptorForBufferPosition([i, m.index])
        if(scope.scopes.find(s => s.match(/comment/))) {
          allMatches.push({row: lastNonComment, text: row, col: m.index})
          return
        }
      }
      lastNonComment = i
    })
    expect(allMatches).toSatisfy((matches, reason) => {
      reason("Tokenizer wasn't able to run")
      return matches.length > 0
    })

    allMatches.forEach(({text, row, col}) => {
      const exactPos = text.match(/\^\s+(.*)/)
      if(exactPos) {
        console.log(
          'Scopes:',
          editor.scopeDescriptorForBufferPosition([row, exactPos.index]).toString()
        )
        expect(editor.scopeDescriptorForBufferPosition([row, exactPos.index]).scopes).toSatisfy((scopes, reason) => {
          const expected = exactPos[1]
          reason(dedent`
            Expected to find scope "${expected}" but found "${scopes}"
            at class-was-ts.rb:${row+1}:${exactPos.index+1}
          `)
          return scopes.indexOf(expected) !== -1
        })
      } else {
        const pos = text.match(/\<-\s+(.*)/)
        // console.log('Finding Scope', pos[1], 'on', [row, col], 'and scopes:', editor.scopeDescriptorForBufferPosition([row, col]))
        expect(editor.scopeDescriptorForBufferPosition([row, col]).scopes).toSatisfy((scopes, reason) => {
          const expected = pos[1]
          reason(dedent`
            Expected to find scope "${expected}" but found "${scopes}"
            at class-node.ts.rb:${row+1}:${col+1}
          `)
          return scopes.indexOf(expected) !== -1
        })
      }
    })
    const mode = editor.languageMode
  });
});

async function openDocument(fileName) {
  const fullPath = path.join(__dirname, 'fixtures', fileName)
  const editor = await atom.workspace.open(fullPath)
  await editor.languageMode.ready
  // editor.languageMode.buildHighlightIterator().seek({row: 0, column: 0} )
  // await new Promise(resolve => {
  //   console.log("WAT")
  //   editor.languageMode.onDidTokenize(resolve)
  // })
  return editor
}
