const path = require('path');

describe('WASM Tree-sitter CSS grammar', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('language-css');
  });

  it('passes grammar tests', async () => {
    await runGrammarTests(
      path.join(__dirname, 'fixtures', 'sample.css'),
      /\/\*/,
      /\*\//
    );
    await runGrammarTests(
      path.join(__dirname, 'fixtures', 'ends-in-tag-name.css'),
      /\/\*/,
      /\*\//
    );
  });
});
