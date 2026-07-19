const js = require("@eslint/js");
const n = require("eslint-plugin-n");
const jsdoc = require("eslint-plugin-jsdoc");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    // `**/fixtures/**` are intentional test fixtures (deliberately broken syntax,
    // asserted-exact content); `.dev/**` is a local developer sandbox (LSP
    // experiments) with deps that aren't installed in the workspace.
    ignores: ["**/*.ts", "vendor/**", "dist/**", "**/fixtures/**", ".dev/**"],
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
      // `atom` and `electron` are provided by the Lumine/Electron runtime, and
      // `season` by the editor's root dependencies — none resolvable from a
      // bundled package's own manifest, so allow them across resolution rules.
      "n/no-missing-require": ["error", { allowModules: ["atom", "electron", "@lumine-code/season"] }],
      "n/no-missing-import": ["error", { allowModules: ["atom", "electron", "@lumine-code/season"] }],
      "n/no-unpublished-require": ["error", { allowModules: ["atom", "electron", "@lumine-code/season"] }],
      "n/no-unpublished-import": ["error", { allowModules: ["atom", "electron", "@lumine-code/season"] }],
      "n/no-extraneous-require": ["error", { allowModules: ["atom", "electron", "@lumine-code/season"] }],
      "n/no-extraneous-import": ["error", { allowModules: ["atom", "electron", "@lumine-code/season"] }],
      // `localStorage`/`navigator` here are Chromium (renderer) globals, not
      // Node's newer experimental builtins of the same name.
      "n/no-unsupported-features/node-builtins": [
        "error",
        // `module.enableCompileCache` is stable enough to use on the bundled
        // Node 24 runtime; `localStorage`/`navigator` are Chromium (renderer)
        // globals, not Node's newer experimental builtins of the same name.
        { ignores: ["localStorage", "navigator", "module.enableCompileCache"] },
      ],
    },
  },
  {
    // process.exit() is legitimate in build scripts, the Electron main process,
    // and standalone helper processes/CLIs (CLI flag handling, forced quit,
    // askpass/worker entry points, the mocha runner) — not the anti-pattern
    // this rule targets in long-running library code.
    files: [
      "script/**",
      "resources/**",
      "spec/main-process/**",
      "src/main.js",
      "src/atom-application.js",
      "src/parse-command-line.js",
      "src/askpass.js",
      "src/start.js",
      "src/git-host-worker.js",
    ],
    rules: { "n/no-process-exit": "off" },
  },
  {
    // Completion-data build scripts (run manually via `yarn update`) require
    // update-time-only devDependencies that are not installed in the workspace,
    // and legitimately call process.exit(). Don't flag their resolution here.
    files: ["**/update/**"],
    rules: {
      "n/no-process-exit": "off",
      "n/no-missing-require": "off",
      "n/no-unpublished-require": "off",
      "n/no-extraneous-require": "off",
    },
  },
  {
    // Test files — jasmine (Atom test runner) plus a few mocha/jest-style
    // suites (dalek's `test/`, the completion-update `*.test.js`) and Atom's
    // async helpers. Also relax dependency-resolution rules: specs require
    // devDependencies and load fixture modules by path the resolver can't follow.
    files: [
      "spec/**",
      "**/spec/**",
      "**/*-spec.js",
      "**/*.test.js",
      "packages/*/test/**",
    ],
    languageOptions: {
      globals: {
        ...globals.jasmine,
        ...globals.mocha,
        test: "readonly",
        runGrammarTests: "readonly",
        advanceClock: "readonly",
        waitsForPromise: "readonly",
        waitsFor: "readonly",
        waits: "readonly",
        runs: "readonly",
      },
    },
    rules: {
      "n/no-missing-require": "off",
      "n/no-unpublished-require": "off",
      "n/no-unpublished-import": "off",
      "n/no-extraneous-require": "off",
      "n/no-extraneous-import": "off",
    },
  },
  // Must be last: turns off any lint rules that would conflict with Prettier.
  prettier,
];
