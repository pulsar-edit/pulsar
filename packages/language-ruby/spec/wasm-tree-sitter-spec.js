const dedent = require('dedent');
const path = require('path');
const { Point } = require('atom');

xdescribe('WASM Tree-sitter Ruby grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-ruby');
    atom.config.set('core.useTreeSitterParsers', true);
    atom.config.set('core.useExperimentalModernTreeSitter', true);
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
    const fullPath = path.join(__dirname, 'fixtures', 'folds.rb')
    await runFoldsTests(fullPath, /#/)
  });
});

async function openDocument(fileName) {
  const fullPath = path.join(__dirname, 'fixtures', fileName)
  const editor = await atom.workspace.open(fullPath)
  await editor.languageMode.ready
  return editor
}
