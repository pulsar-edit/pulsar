const path = require('path');

const GRAMMAR_TEST_FILES = [
  'test.scss'
];

describe('Grammar tests', () => {
  beforeEach(async () => {
    atom.config.set('core.useTreeSitterParsers', true);
    await atom.packages.activatePackage("language-sass");
  });

  it('passes grammar tests', async () => {
    for (let file of GRAMMAR_TEST_FILES) {
      await runGrammarTests(path.join(__dirname, 'fixtures', 'grammar', file), /\/\//)
    }
  });
});
