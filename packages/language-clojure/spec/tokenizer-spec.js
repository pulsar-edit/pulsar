/* global runGrammarTests, runFoldsTests */
const path = require('path');

function setConfigForLanguageMode(mode) {
  let useTreeSitterParsers = mode !== 'textmate';
  let useExperimentalModernTreeSitter = mode === 'wasm-tree-sitter';
  atom.config.set('core.useTreeSitterParsers', useTreeSitterParsers);
  atom.config.set('core.useExperimentalModernTreeSitter', useExperimentalModernTreeSitter);
}

describe('Clojure grammars', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-clojure');
  });

  it('tokenizes the editor using TextMate parser', async () => {
    setConfigForLanguageMode('textmate');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tokens.clj'), /;/)
  });

  it('tokenizes the editor using node tree-sitter parser the same as TextMate', async () => {
    setConfigForLanguageMode('wasm-tree-sitter');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tokens.clj'), /;/)
  });

  it('tokenizes the editor using node tree-sitter parser (specific rules)', async () => {
    setConfigForLanguageMode('wasm-tree-sitter');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tree-sitter-tokens.clj'), /;/)
  });

  it('folds Clojure code', async () => {
    setConfigForLanguageMode('wasm-tree-sitter');
    await runFoldsTests(path.join(__dirname, 'fixtures', 'tree-sitter-folds.clj'), /;/)
  });
});
