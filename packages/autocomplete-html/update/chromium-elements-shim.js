/* eslint-disable n/no-extraneous-require, n/no-unpublished-require --
   maintenance-only script that compiles chrome-devtools-frontend's TypeScript
   data using the repo's Babel toolchain. */

const fs = require("fs");
const babel = require("@babel/core");

/**
Provides the `DOMPinnedProperties` dataset from `chrome-devtools-frontend`, used
by `update.js` to map each HTML element interface to its attributes.

That data ships as TypeScript (`DOMPinnedProperties.ts`), so we compile it to
CommonJS with Babel — stripping the type annotations — and evaluate the result.
`chrome-devtools-frontend` is pinned to an exact version in `package.json` because
newer releases removed this file.

This replaces an older `esm` + `ts-import` shim (and its `.mjs` companion) that no
longer runs on current Node. Node's built-in type stripping can't be used here
because it is disabled for files under `node_modules`.
*/

const SOURCE_PATH =
  require.resolve("chrome-devtools-frontend/front_end/models/javascript_metadata/DOMPinnedProperties.ts");

const bootstrap = async () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  const { code } = await babel.transformAsync(source, {
    filename: SOURCE_PATH,
    presets: ["@babel/preset-typescript"],
    plugins: ["@babel/plugin-transform-modules-commonjs"],
    babelrc: false,
    configFile: false,
  });

  const module = { exports: {} };
  new Function("module", "exports", "require", code)(module, module.exports, require);
  return module.exports;
};

module.exports = { bootstrap };
