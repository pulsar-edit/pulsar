const path = require('path');

describe('WASM Tree-sitter C grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-c');
  });

  it('passes grammar tests', async () => {
    await runGrammarTests(path.join(__dirname, 'fixtures', 'sample.c'), /\/\//)
    await runGrammarTests(path.join(__dirname, 'fixtures', 'sample.cpp'), /\/\//)
  });

});
