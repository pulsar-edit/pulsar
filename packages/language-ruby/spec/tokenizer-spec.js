const dedent = require('dedent');
const path = require('path');
const { Point } = require('atom');

describe('Ruby grammars', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-ruby');
  });

  it('tokenizes the editor using TextMate parser', async () => {
    atom.config.set('core.useTreeSitterParsers', false);

    await runGrammarTests(path.join(__dirname, 'fixtures', 'textmate-grammar.rb'), /#/)
  });

  it('tokenizes the editor using modern tree-sitter parser', async () => {
    atom.config.set('core.useTreeSitterParsers', true);
    atom.config.set('core.useExperimentalModernTreeSitter', true);
    await runGrammarTests(path.join(__dirname, 'fixtures', 'tree-sitter-grammar.rb'), /#/)
  });
});
