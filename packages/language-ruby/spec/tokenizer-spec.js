const dedent = require('dedent');
const path = require('path');
const { Point } = require('atom');

describe('Ruby grammars', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-ruby');
  });

  it('tokenizes the editor using TextMate parser', async () => {
    atom.config.set('core.languageParser', 'textmate');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'textmate-grammar.rb'), /#/)
  });

  it('tokenizes the editor using node tree-sitter parser', async () => {
    atom.config.set('core.languageParser', 'wasm-tree-sitter');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'textmate-grammar.rb'), /#/)
  });
});
