const path = require('path');

const GRAMMAR_TEST_FILES = [
  'syntax_test_python.py',
  'syntax_test_python_functions.py',
  'syntax_test_python_lambdas.py',
  'syntax_test_python_typing.py'
];

describe('Grammar tests', () => {
  beforeEach(async () => {
    atom.config.set('core.useTreeSitterParsers', true);
    await atom.packages.activatePackage("language-python");
  });

  it('passes grammar tests', async () => {
    for (let file of GRAMMAR_TEST_FILES) {
      await runGrammarTests(path.join(__dirname, 'fixtures', 'grammar', file), /#/)
    }
  });
});
