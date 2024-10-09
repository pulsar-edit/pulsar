const path = require('path');

describe('WASM Tree-sitter JavaScript grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-javascript');
  });

  it('passes grammar tests', async () => {
    await runGrammarTests(path.join(__dirname, 'fixtures', 'sample.js'), /\/\//)
  });

});
