const js = require("@eslint/js");
const n = require("eslint-plugin-n");
const jsdoc = require("eslint-plugin-jsdoc");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["**/*.ts", "vendor/**", "dist/**"],
  },
  js.configs.recommended,
  n.configs["flat/recommended-script"],
  {
    plugins: { jsdoc },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.node,
        atom: "writable",
      },
    },
    rules: {
      "no-constant-condition": "off",
      "no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
      "n/no-missing-require": ["error", { allowModules: ["atom"] }],
      "n/no-unpublished-require": ["error", { allowModules: ["electron"] }],
    },
  },
  {
    // Jasmine specs (Atom test runner) — test globals + Atom's async helpers.
    files: ["spec/**", "**/spec/**", "**/*-spec.js"],
    languageOptions: {
      globals: {
        ...globals.jasmine,
        advanceClock: "readonly",
        waitsForPromise: "readonly",
        waitsFor: "readonly",
        waits: "readonly",
        runs: "readonly",
      },
    },
  },
  // Must be last: turns off any lint rules that would conflict with Prettier.
  prettier,
];
