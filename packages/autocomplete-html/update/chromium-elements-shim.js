require = require("esm")(module)
module.exports = require("./chromium-elements-shim.mjs")

/**
Used to aid in the automatic updating of our `completions.json`

So while this, coupled with `chromium-elements-shim.mjs` is a rather ugly solution
heres why this exists:

Essentially, we need the values declared within `DOMPinnedProperties.ts`.
Those values will be essential in creating our final `completions.json`

But the problems with using this file in the regular JavaScript the `update.js`
file is created in are three fold:

1) This file, obviously, is TypeScript
2) This file is an ECMAScript Module
3) While this is a TypeScript file there's no `./dist` folder or compiled version
    readily available, instead relying on custom built tooling to transpile.

So while this solution is ugly, essentially we make it so we can simply
`require()` this file within our JavaScript.

We literally use `const chromiumElementsShim = require("./chromium-elements-shim.js");`
Then just have to call `chromiumElementsShim.bootstrap()` to transpile the file.

We require this file, which then loads `esm` which allows us to import a ESM
module in a CommonJS module by making a small shim. Exporting it as CommonJS.

But the file is still TypeScript. So we use `ts-import` in `chromium-elements-shim.mjs`
to read the file from disk, and transpile it, finally exporting the async function
that actually does the transpiling.

So from here we import that module, and shim it.

A word of caution, we are specifically using the older version of `ts-import`
because this was the version that was used before the developer upgraded the Node
version supported. Which beyond this they use `node:fs` to import the FS Module,
which isn't supported on the version of Pulsar we are currently using.

So once we upgrade our version of NodeJS we will also be able to upgrade `ts-import`
to it's latest version. That will also mean we have to rewrite `chromium-elements-shim.mjs`
as the API has completely changed since the specific version we are using.
*/
