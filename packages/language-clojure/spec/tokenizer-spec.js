const path = require('path');

describe('Clojure grammars', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-clojure');
  });

  it('tokenizes the editor using TextMate parser', async () => {
    atom.config.set('core.languageParser', 'textmate');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tokens.clj'), /;/)
  });

  it('tokenizes the editor using node tree-sitter parser the same as TextMate', async () => {
    atom.config.set('core.languageParser', 'wasm-tree-sitter');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tokens.clj'), /;/)
  });

  it('tokenizes the editor using node tree-sitter parser (specific rules)', async () => {
    atom.config.set('core.languageParser', 'wasm-tree-sitter');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tree-sitter-tokens.clj'), /;/)
  });
});
