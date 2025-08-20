const path = require('path');

describe('WASM Tree-sitter TypeScript grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-typescript');
  });

  it('passes grammar tests', async () => {
    await runGrammarTests(path.join(__dirname, 'fixtures', 'sample.ts'), /\/\//)
  });

});
