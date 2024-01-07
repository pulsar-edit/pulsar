module.exports = {
  env: { jasmine: true },
  globals: {
    waitsForPromise: true
  },
  rules: {
    "node/no-unpublished-require": "off",
    "node/no-extraneous-require": "off",
    "no-unused-vars": "off",
    "no-empty": "off",
    "no-constant-condition": "off"
  }
};
