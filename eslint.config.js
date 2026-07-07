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
    settings: {
      // This is an Electron app bundling its own Node 24 runtime, so lint
      // syntax/builtins support against that — not each package's stale engines.
      n: { version: ">=24.0.0" },
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
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
      // `atom` and `electron` are provided by the Lumine/Electron runtime,
      // not resolvable via npm — allow them across all resolution rules.
      "n/no-missing-require": ["error", { allowModules: ["atom", "electron"] }],
      "n/no-missing-import": ["error", { allowModules: ["atom", "electron"] }],
      "n/no-unpublished-require": ["error", { allowModules: ["atom", "electron"] }],
      "n/no-unpublished-import": ["error", { allowModules: ["atom", "electron"] }],
      "n/no-extraneous-require": ["error", { allowModules: ["atom", "electron"] }],
      "n/no-extraneous-import": ["error", { allowModules: ["atom", "electron"] }],
      // `localStorage`/`navigator` here are Chromium (renderer) globals, not
      // Node's newer experimental builtins of the same name.
      "n/no-unsupported-features/node-builtins": [
        "error",
        { ignores: ["localStorage", "navigator"] },
      ],
    },
  },
  {
    // process.exit() is legitimate in build scripts and the Electron main
    // process (CLI flag handling, forced quit) — not the anti-pattern this
    // rule targets in long-running library code.
    files: ["script/**", "src/main-process/**"],
    rules: { "n/no-process-exit": "off" },
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
