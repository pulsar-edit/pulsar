const path = require('path');

describe('WASM Tree-sitter JavaScript grammar', () => {

  beforeEach(async () => {
    // We need the HTML package because Markdown has no comment syntax; we've
    // got to borrow HTML's. Without activation, there won't be a `comment`
    // scope name for the grammar tester to pick up on.
    await atom.packages.activatePackage('language-html');
    await atom.packages.activatePackage('language-gfm');
  });

  it('passes grammar tests', async () => {
    await runGrammarTests(path.join(__dirname, 'fixtures', 'sample.md'), /<!--/, /-->/)
  });

});
