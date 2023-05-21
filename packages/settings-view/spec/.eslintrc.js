module.exports = {
  env: {
    es2021: true,
    jasmine: true,
    node: true
  },
  globals: {
    waitsForPromise: true
  },
  rules: {
    "node/no-missing-require": "off",
    "semi": ["error", "always"]
  }
};
