module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
    // "plugin:jsdoc/recommended"
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest"
  },
  rules: {
    "space-before-function-paren": ["error", {
      anonymous: "always",
      asyncArrow: "always",
      named: "never"
    }],
    "no-constant-condition": "off",
    "no-unused-vars": [
      "warn",
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }
    ],
    "node/no-missing-require": [
      "error",
      {
        allowModules: ["atom"]
      }
    ],
    "node/no-unpublished-require": [
      "error",
      {
        allowModules: ["electron"]
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
