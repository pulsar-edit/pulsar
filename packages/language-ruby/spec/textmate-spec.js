const dedent = require('dedent');
const path = require('path');
const { Point } = require('atom');

describe('WASM Tree-sitter Ruby grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-ruby');
    atom.config.set('core.languageParser', 'textmate');
  });

  it('tokenizes symbols', async () => {
    await runGrammarTests(path.join(__dirname, 'fixtures', 'textmate-grammar.rb'), /#/)
  });
});
