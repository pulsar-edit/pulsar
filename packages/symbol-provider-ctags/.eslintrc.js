module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest"
  },
  rules: {
    "no-fallthrough": "off",
    "no-case-declarations": "off",
    "space-before-function-paren": ["error", {
      anonymous: "always",
      asyncArrow: "always",
      named: "never"
    }],
    "node/no-unpublished-require": [
      "error",
      {
        allowModules: ["electron"]
      }
    ],
    "node/no-missing-require": [
      "error",
      {
        allowModules: ["atom"]
      }
    ]
  },
  plugins: [
    "jsdoc"
  ],
  globals: {
    atom: "writeable"
  }
};
