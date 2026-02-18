/* global runGrammarTests, runFoldsTests */
const path = require('path');

describe('YAML Tree-Sitter Grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-yaml');
    atom.config.set('core.useTreeSitterParsers', true);
    atom.config.set('core.useExperimentalModernTreeSitter', true);
  });

  it('tokenizes the editor using modern tree-sitter parser', async () => {
    await runGrammarTests(path.join(__dirname, 'fixtures', 'highlights.yaml'), /#/)
  });
});
