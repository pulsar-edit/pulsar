module.exports = {
  env: { jasmine: true },
  globals: {
    waitsForPromise: true,
    runGrammarTests: true,
    runFoldsTests: true
  },
  rules: {
    "node/no-unpublished-require": "off",
    "node/no-extraneous-require": "off",
    "no-unused-vars": "off",
    "no-empty": "off"
  }
};
