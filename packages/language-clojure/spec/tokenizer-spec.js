/* global runGrammarTests, runFoldsTests */
const path = require('path');

function setConfigForLanguageMode(mode) {
  let useTreeSitterParsers = mode !== 'textmate';
  atom.config.set('core.useTreeSitterParsers', useTreeSitterParsers);
}

describe('Clojure grammars', () => {
  beforeEach(async () => {
    await atom.packages.activatePackage('language-c');
    await atom.packages.activatePackage('language-javascript');
    await atom.packages.activatePackage('language-clojure');
  });

  it('tokenizes the editor using TextMate parser', async () => {
    setConfigForLanguageMode('textmate');
    await runGrammarTests(path.join(__dirname, 'fixtures', 'textmate-tokens.clj'), /;/)
  });

  it('tokenizes the editor using modern tree-sitter parser', async () => {
    setConfigForLanguageMode('modern-tree-sitter');
    atom.config.set('language-clojure.dismissTag', true);
    atom.config.set('language-clojure.commentTag', false);
    atom.config.set('language-clojure.markDeprecations', true);
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tokens.clj'), /;/)
  });

  it('tokenizes EDN using modern tree-sitter parser', async () => {
    setConfigForLanguageMode('modern-tree-sitter');
    atom.config.set('language-clojure.dismissTag', true);
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tokens.edn'), /;/)
  });

  it('tokenizes the editor using modern tree-sitter, but with all default configs toggled', async () => {
    setConfigForLanguageMode('modern-tree-sitter');
    atom.config.set('language-clojure.dismissTag', false);
    atom.config.set('language-clojure.commentTag', true);
    atom.config.set('language-clojure.markDeprecations', false);
    await runGrammarTests(path.join(__dirname, 'fixtures', 'config-toggle.clj'), /;/)
  });

  it('folds Clojure code', async () => {
    setConfigForLanguageMode('modern-tree-sitter');
    await runFoldsTests(path.join(__dirname, 'fixtures', 'tree-sitter-folds.clj'), /;/)
  });
});
