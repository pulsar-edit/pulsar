
// Any Tree-sitter parser can write an external C scanner, and that scanner can
// use any functions in the C/C++ stdlib.
//
// This presents a problem for `web-tree-sitter` — it includes implementations
// for some of those functions, but not all, and there's currently no way for
// the grammar itself to fill that gap.
//
// If a tree-sitter parser is known to fail in a browser when running
// `tree-sitter playground`, it'll fail in Pulsar — _unless_ we build our own
// copy of `web-tree-sitter`.
//
// For now, that's what we're doing, along with an `exports.json` file that
// includes references to any C/C++ stdlib functions that are needed to make a
// tree-sitter parser work. This includes, but is not limited to, the parsers
// in the built-in language packages that ship with Pulsar. If a user wants to
// write a third-party package with a tree-sitter parser, and it won't work on
// vanilla `web-tree-sitter`, it (temporarily) falls on us to bridge that gap.
//
// The ultimate solution to this is to give `tree-sitter build-wasm` a way to
// build the symbols that it needs but which `web-tree-sitter` doesn't give it.
// Once that happens, we can go back to the NPM version.
//
// See https://github.com/tree-sitter/tree-sitter/issues/949.
//
// Our custom build also (a) skips minification, (b) beautifies a bit (so that
// the source code spans multiple lines and is easier to debug), and (c) adds
// a more helpful error message when a parser tries to use an external function
// that has not been defined — so that users can report it to us and we can add
// it to our custom build.
//
// Custom build prompted by parsers:
//
// * tree-sitter-ruby
// * tree-sitter-html
// * tree-sitter-svelte
//
const USE_CUSTOM_WEB_TREE_SITTER = true;

let Parser;
if (USE_CUSTOM_WEB_TREE_SITTER) {
  Parser = require('../vendor/web-tree-sitter/tree-sitter');
} else {
  Parser = require('web-tree-sitter');
}

module.exports = Parser;
