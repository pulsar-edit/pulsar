/* eslint-disable no-template-curly-in-string */

const fs = require('fs');
const path = require('path');
const dedent = require('dedent');
const TextBuffer = require('text-buffer');
const { Point } = TextBuffer;
const CSON = require('season');
const TextEditor = require('../src/text-editor');
const WASMTreeSitterGrammar = require('../src/wasm-tree-sitter-grammar');
const WASMTreeSitterLanguageMode = require('../src/wasm-tree-sitter-language-mode');
const Random = require('random-seed');
const { getRandomBufferRange, buildRandomLines } = require('./helpers/random');

let PATH = path.resolve( path.join(__dirname, '..', 'packages') );
function resolve(modulePath) {
  return require.resolve(`${PATH}/${modulePath}`)
}

const cGrammarPath = resolve('language-c/grammars/modern-tree-sitter-c.cson');
const pythonGrammarPath = resolve(
  'language-python/grammars/modern-tree-sitter-python.cson'
);
const jsGrammarPath = resolve(
  'language-javascript/grammars/tree-sitter-2-javascript.cson'
);

const jsRegexGrammarPath = resolve(
  'language-javascript/grammars/tree-sitter-2-regex.cson'
);

const jsdocGrammarPath = resolve(
  'language-javascript/grammars/tree-sitter-2-jsdoc.cson'
);
const htmlGrammarPath = resolve(
  'language-html/grammars/modern-tree-sitter-html.cson'
);
const ejsGrammarPath = resolve(
  'language-html/grammars/modern-tree-sitter-ejs.cson'
);
const rubyGrammarPath = resolve(
  'language-ruby/grammars/tree-sitter-2-ruby.cson'
);
const rustGrammarPath = resolve(
  'language-rust-bundled/grammars/modern-tree-sitter-rust.cson'
);

let jsConfig = CSON.readFileSync(jsGrammarPath);
let jsRegexConfig = CSON.readFileSync(jsRegexGrammarPath);
let cConfig = CSON.readFileSync(cGrammarPath);
let rubyConfig = CSON.readFileSync(rubyGrammarPath);
let htmlConfig = CSON.readFileSync(htmlGrammarPath);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('WASMTreeSitterLanguageMode', () => {
  let editor, buffer, grammar;

  beforeEach(async () => {
    grammar = null;
    editor = await atom.workspace.open('');
    buffer = editor.getBuffer();
    editor.displayLayer.reset({ foldCharacter: '…' });
    atom.config.set('core.useTreeSitterParsers', true);
  });

  afterEach(() => {
    if (grammar) { grammar?.subscriptions?.dispose(); }
  });

  describe('highlighting', () => {
    it('applies the most specific scope mapping to each node in the syntax tree', async () => {
      jasmine.useRealClock();
      grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (member_expression object: (identifier) @support)

        (call_expression
          function: (identifier) @support)

        (assignment_expression
          left: (member_expression
            property: (property_identifier) @variable))

        ["="] @keyword

        ["." "(" ")" ";"] @punctuation
      `);

      buffer.setText('aa.bbb = cc(d.eee());');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      await wait(0);

      expectTokensToEqual(editor, [
        [
          { text: 'aa', scopes: ['support'] },
          { text: '.',  scopes: ['punctuation'] },
          { text: 'bbb', scopes: ['variable'] },
          { text: ' ', scopes: [] },
          { text: '=', scopes: ['keyword'] },
          { text: ' ', scopes: [] },
          { text: 'cc', scopes: ['support'] },
          { text: '(', scopes: ['punctuation'] },
          { text: 'd', scopes: ['support'] },
          { text: '.', scopes: ['punctuation'] },
          { text: 'eee', scopes: [] },
          { text: '(', scopes: ['punctuation'] },
          { text: ')', scopes: ['punctuation'] },
          { text: ')', scopes: ['punctuation'] },
          { text: ';', scopes: ['punctuation'] }
        ]
      ]);
    });

    it('can start or end multiple scopes at the same position', async () => {
      jasmine.useRealClock();
      grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (member_expression object: (identifier) @support)

        (call_expression
          function: (identifier) @call)

        (call_expression
          function: (member_expression
            property: (property_identifier) @call))

        (assignment_expression left: (identifier) @variable)
        (assignment_expression
          left: (member_expression
            property: (property_identifier) @variable))

        (member_expression object: (identifier) @object
          property: (_) @member)

        "(" @open-paren
        ")" @close-paren
      `)

      buffer.setText('a = bb.ccc();');

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar, buffer
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      expectTokensToEqual(editor, [
        [
          { text: 'a', scopes: ['variable'] },
          { text: ' = ', scopes: [] },
          { text: 'bb', scopes: ['support', 'object'] },
          { text: '.', scopes: [] },
          { text: 'ccc', scopes: ['call', 'member'] },
          { text: '(', scopes: ['open-paren'] },
          { text: ')', scopes: ['close-paren'] },
          { text: ';', scopes: [] }
        ]
      ]);
    });

    it('can resume highlighting on a line that starts with whitespace', async () => {
      jasmine.useRealClock();
      grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (member_expression object: (_) @variable)

        (call_expression
          (member_expression property: (_) @function))
      `);

      buffer.setText('a\n  .b();');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      expectTokensToEqual(editor, [
        [{ text: 'a', scopes: ['variable'] }],
        [
          { text: '  ', scopes: ['leading-whitespace'] },
          { text: '.', scopes: [] },
          { text: 'b', scopes: ['function'] },
          { text: '();', scopes: [] }
        ]
      ]);
    });

    it('correctly skips over tokens with zero size', async () => {
      jasmine.useRealClock();
      grammar = new WASMTreeSitterGrammar(atom.grammars, cGrammarPath, cConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (primitive_type) @storage
        (declaration declarator: (identifier) @variable)
        (function_declarator declarator: (identifier) @entity)
      `);
      buffer.setText('int main() {\n  int a\n  int b;\n}');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);
      // editor.displayLayer.getScreenLines(0, Infinity);

      expect(
        languageMode.tree.rootNode
          .descendantForPosition(Point(1, 2), Point(1, 6))
          .toString()
      ).toBe(
        '(declaration type: (primitive_type)' +
          ' declarator: (identifier) (MISSING ";"))'
      );

      languageMode.emitRangeUpdate(buffer.getRange());

      expectTokensToEqual(editor, [
        [
          { text: 'int', scopes: ['storage'] },
          { text: ' ', scopes: [] },
          { text: 'main', scopes: ['entity'] },
          { text: '() {', scopes: [] }
        ],
        [
          { text: '  ', scopes: ['leading-whitespace'] },
          { text: 'int', scopes: ['storage'] },
          { text: ' ', scopes: [] },
          { text: 'a', scopes: ['variable'] }
        ],
        [
          { text: '  ', scopes: ['leading-whitespace'] },
          { text: 'int', scopes: ['storage'] },
          { text: ' ', scopes: [] },
          { text: 'b', scopes: ['variable'] },
          { text: ';', scopes: [] }
        ],
        [{ text: '}', scopes: [] }]
      ]);
    });

    it("updates lines' highlighting when they are affected by distant changes", async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (call_expression (identifier) @function)
        (property_identifier) @member
      `);

      buffer.setText('a(\nb,\nc\n');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      // missing closing paren
      expectTokensToEqual(editor, [
        [{ text: 'a(', scopes: [] }],
        [{ text: 'b,', scopes: [] }],
        [{ text: 'c', scopes: [] }],
        [{ text: '', scopes: [] }]
      ]);

      buffer.append(')');

      // TODO: Any way around this?
      await languageMode.nextTransaction;

      expectTokensToEqual(editor, [
        [
          { text: 'a', scopes: ['function'] },
          { text: '(', scopes: [] }
        ],
        [{ text: 'b,', scopes: [] }],
        [{ text: 'c', scopes: [] }],
        [{ text: ')', scopes: [] }]
      ]);
    });

    it('updates the range of the current node in the tree when highlight.invalidateOnChange is set', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        ((template_string) @lorem
          (#match? @lorem "lorem")
          (#set! highlight.invalidateOnChange true))
        ((template_string) @ipsum
          (#not-match? @ipsum "lorem")
          (#set! highlight.invalidateOnChange true))
      `);

      buffer.setText(dedent`\`


        lore


      \``);



      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      expectTokensToEqual(editor, [
        [
          { text: '`', scopes: ['ipsum'] },
        ],
        [
          { text: '', scopes: [] }
        ],
        [
          { text: '', scopes: [] }
        ],
        [
          { text: '  ', scopes: ['ipsum', 'leading-whitespace'] },
          { text: 'lore', scopes: ['ipsum'] }
        ],
        [{ text: '', scopes: [] }],
        [{ text: '', scopes: [] }],
        [
          { text: '`', scopes: ['ipsum'] },
        ]
      ]);

      editor.setCursorBufferPosition([3, 6]);
      editor.insertText('m');

      // TODO: Any way around this?
      await languageMode.nextTransaction;
      await wait(0);

      expectTokensToEqual(editor, [
        [
          { text: '`', scopes: ['lorem'] },
        ],
        [
          { text: '', scopes: [] }
        ],
        [
          { text: '', scopes: [] }
        ],
        [
          { text: '  ', scopes: ['lorem', 'leading-whitespace'] },
          { text: 'lorem', scopes: ['lorem'] }
        ],
        [{ text: '', scopes: [] }],
        [{ text: '', scopes: [] }],
        [
          { text: '`', scopes: ['lorem'] },
        ]
      ]);
    })

    it('handles edits after tokens that end between CR and LF characters (regression)', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);


      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string) @string
        (property_identifier) @property
      `);

      buffer.setText(['// abc', '', 'a("b").c'].join('\r\n'));

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      expectTokensToEqual(editor, [
        [{ text: '// abc', scopes: ['comment'] }],
        [{ text: '', scopes: [] }],
        [
          { text: 'a(', scopes: [] },
          { text: '"b"', scopes: ['string'] },
          { text: ').', scopes: [] },
          { text: 'c', scopes: ['property'] }
        ]
      ]);

      buffer.insert([2, 0], '  ');

      await languageMode.nextTransaction;

      expectTokensToEqual(editor, [
        [{ text: '// abc', scopes: ['comment'] }],
        [{ text: '', scopes: [] }],
        [
          { text: '  ', scopes: ['leading-whitespace'] },
          { text: 'a(', scopes: [] },
          { text: '"b"', scopes: ['string'] },
          { text: ').', scopes: [] },
          { text: 'c', scopes: ['property'] }
        ]
      ]);
    });

    it('handles multi-line nodes with children on different lines (regression)', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (template_string) @string
        ["\${" "}"] @interpolation
      `);

      buffer.setText('`\na${1}\nb${2}\n`;');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      expectTokensToEqual(editor, [
        [{ text: '`', scopes: ['string'] }],
        [
          { text: 'a', scopes: ['string'] },
          { text: '${', scopes: ['string', 'interpolation'] },
          { text: '1', scopes: ['string'] },
          { text: '}', scopes: ['string', 'interpolation'] }
        ],
        [
          { text: 'b', scopes: ['string'] },
          { text: '${', scopes: ['string', 'interpolation'] },
          { text: '2', scopes: ['string'] },
          { text: '}', scopes: ['string', 'interpolation'] }
        ],
        [{ text: '`', scopes: ['string'] }, { text: ';', scopes: [] }]
      ]);
    });

    it('handles folds inside of highlighted tokens', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (call_expression (identifier) @function)
      `);

      buffer.setText(dedent`
        /*
         * Hello
         */

        hello();
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.foldBufferRange([[0, 2], [2, 0]]);

      expectTokensToEqual(editor, [
        [
          { text: '/*', scopes: ['comment'] },
          { text: '…', scopes: ['fold-marker'] },
          { text: ' */', scopes: ['comment'] }
        ],
        [{ text: '', scopes: [] }],
        [
          { text: 'hello', scopes: ['function'] },
          { text: '();', scopes: [] }
        ]
      ]);
    });

    it('applies regex match rules when specified', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        ((identifier) @global
          (#match? @global "^(exports|document|window|global)$"))

        ((identifier) @constant
          (#match? @constant "^[A-Z_]+$")
          (#set! capture.final true))

        ((identifier) @constructor
          (#match? @constructor "^[A-Z]"))

        ((identifier) @variable
          (#set! capture.shy true))
      `);
      buffer.setText(`exports.object = Class(SOME_CONSTANT, x)`);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      expectTokensToEqual(editor, [
        [
          { text: 'exports', scopes: ['global'] },
          { text: '.object = ', scopes: [] },
          { text: 'Class', scopes: ['constructor'] },
          { text: '(', scopes: [] },
          { text: 'SOME_CONSTANT', scopes: ['constant'] },
          { text: ', ', scopes: [] },
          { text: 'x', scopes: ['variable'] },
          { text: ')', scopes: [] }
        ]
      ]);
    });

    it('handles nodes that start before their first child and end after their last child', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, rubyGrammarPath, rubyConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (bare_string) @string
        (interpolation) @embedded
        ["#{" "}"] @punctuation
      `);

      // The bare string node `bc#{d}ef` has one child: the interpolation, and that child
      // starts later and ends earlier than the bare string.
      buffer.setText('a = %W( bc#{d}ef )');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      expectTokensToEqual(editor, [
        [
          { text: 'a = %W( ', scopes: [] },
          { text: 'bc', scopes: ['string'] },
          { text: '#{', scopes: ['string', 'embedded', 'punctuation'] },
          { text: 'd', scopes: ['string', 'embedded'] },
          { text: '}', scopes: ['string', 'embedded', 'punctuation'] },
          { text: 'ef', scopes: ['string'] },
          { text: ' )', scopes: [] }
        ]
      ]);
    });

    // TODO: Ignoring these specs because web-tree-sitter doesn't seem to do
    // async. We can rehabilitate them if we ever figure it out.
    xdescribe('when the buffer changes during a parse', () => {
      it('immediately parses again when the current parse completes', async () => {
        jasmine.useRealClock();
        const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        await grammar.setQueryForTest('highlightsQuery', `
          (identifier) @variable
        `);

        buffer.setText('abc;');

        const languageMode = new WASMTreeSitterLanguageMode({
          buffer,
          grammar,
          syncTimeoutMicros: 10
        });
        buffer.setLanguageMode(languageMode);
        // await languageMode.ready;
        await nextHighlightingUpdate(languageMode);
        await new Promise(process.nextTick);
        await wait(0);

        expectTokensToEqual(editor, [
          [
            { text: 'abc', scopes: ['variable'] },
            { text: ';', scopes: [] }
          ]
        ]);

        console.log('adding: ()');
        buffer.setTextInRange([[0, 3], [0, 3]], '()');
        console.log('done: ()');

        expectTokensToEqual(editor, [
          [
            { text: 'abc()', scopes: ['variable'] },
            { text: ';', scopes: [] }
          ]
        ]);

        console.log('adding: new');
        buffer.setTextInRange([[0, 0], [0, 0]], 'new ');
        console.log('done: new');

        expectTokensToEqual(editor, [
          [
            { text: 'new ', scopes: [] },
            { text: 'abc()', scopes: ['variable'] },
            { text: ';', scopes: [] }
          ]
        ]);

        await nextHighlightingUpdate(languageMode);
        // await wait(0);
        // await languageMode.atTransactionEnd();
        console.log('proceeding!');

        expectTokensToEqual(editor, [
          [
            { text: 'new ', scopes: [] },
            { text: 'abc', scopes: ['function'] },
            { text: '();', scopes: [] }
          ]
        ]);

        await nextHighlightingUpdate(languageMode);

        expectTokensToEqual(editor, [
          [
            { text: 'new ', scopes: [] },
            { text: 'abc', scopes: ['constructor'] },
            { text: '();', scopes: [] }
          ]
        ]);
        await languageMode.atTransactionEnd();

        // await wait(2000);
      });
    });

    describe('when changes are small enough to be re-parsed synchronously', () => {
      it('can incorporate multiple consecutive synchronous updates', async () => {
        jasmine.useRealClock();
        const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        await grammar.setQueryForTest('highlightsQuery', `
          (call_expression
            (member_expression
              (property_identifier) @method)
              (#set! capture.final true))

          ((property_identifier) @property
            (#set! capture.final true))

          (call_expression (identifier) @function)
        `);

        const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;
        await wait(0);

        buffer.setText('a');
        expectTokensToEqual(editor, [[{ text: 'a', scopes: [] }]]);

        buffer.append('.');
        expectTokensToEqual(editor, [[{ text: 'a.', scopes: [] }]]);

        buffer.append('b');

        // TODO: The need to defer injection layer highlighting while we load
        // those layers' language modules means that we can't actually do
        // synchronous highlighting in 100% of cases and sometimes have to
        // settle for incredibly-fast-but-technically-async highlighting.
        await languageMode.atTransactionEnd();
        expectTokensToEqual(editor, [
          [{ text: 'a.', scopes: [] }, { text: 'b', scopes: ['property'] }]
        ]);

        buffer.append('()');
        await languageMode.atTransactionEnd();

        expectTokensToEqual(editor, [
          [
            { text: 'a.', scopes: [] },
            { text: 'b', scopes: ['method'] },
            { text: '()', scopes: [] }
          ]
        ]);

        buffer.delete([[0, 1], [0, 2]]);
        await languageMode.atTransactionEnd();
        expectTokensToEqual(editor, [
          [{ text: 'ab', scopes: ['function'] }, { text: '()', scopes: [] }]
        ]);
      });
    });

    describe('injectionPoints and injectionPatterns', () => {
      let jsGrammar, htmlGrammar;

      beforeEach(async () => {
        let tempJsConfig = { ...jsConfig };
        jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, tempJsConfig);

        await jsGrammar.setQueryForTest('highlightsQuery', `
          (comment) @comment
          (property_identifier) @property
          (call_expression (identifier) @function)
          (template_string) @string
          (template_substitution
            ["\${" "}"] @interpolation)
        `);

        jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);
        jsGrammar.addInjectionPoint(JSDOC_INJECTION_POINT);

        let tempHtmlConfig = { ...htmlConfig };
        htmlGrammar = new WASMTreeSitterGrammar(atom.grammars, htmlGrammarPath, tempHtmlConfig);

        await htmlGrammar.setQueryForTest('highlightsQuery', `
          (fragment) @html
          (tag_name) @tag
          (attribute_name) @attr
        `);

        htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);
      });

      it('highlights code inside of injection points', async () => {
        jasmine.useRealClock();
        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);
        buffer.setText('node.innerHTML = html `\na ${b}<img src="d">\n`;');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: jsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });

        buffer.setLanguageMode(languageMode);
        await languageMode.ready;
        await new Promise(process.nextTick);

        expectTokensToEqual(editor, [
          [
            { text: 'node.', scopes: [] },
            { text: 'innerHTML', scopes: ['property'] },
            { text: ' = ', scopes: [] },
            { text: 'html', scopes: ['function'] },
            { text: ' ', scopes: [] },
            { text: '`', scopes: ['string'] },
            { text: '', scopes: ['string', 'html'] }
          ],
          [
            { text: 'a ', scopes: ['string', 'html'] },
            { text: '${', scopes: ['string', 'html', 'interpolation'] },
            { text: 'b', scopes: ['string', 'html'] },
            { text: '}', scopes: ['string', 'html', 'interpolation'] },
            { text: '<', scopes: ['string', 'html'] },
            { text: 'img', scopes: ['string', 'html', 'tag'] },
            { text: ' ', scopes: ['string', 'html'] },
            { text: 'src', scopes: ['string', 'html', 'attr'] },
            { text: '="d">', scopes: ['string', 'html'] }
          ],
          [{ text: '`', scopes: ['string'] }, { text: ';', scopes: [] }]
        ]);

        const range = buffer.findSync('html');
        buffer.setTextInRange(range, 'xml');
        // await nextHighlightingUpdate(languageMode);
        await new Promise(process.nextTick);

        expectTokensToEqual(editor, [
          [
            { text: 'node.', scopes: [] },
            { text: 'innerHTML', scopes: ['property'] },
            { text: ' = ', scopes: [] },
            { text: 'xml', scopes: ['function'] },
            { text: ' ', scopes: [] },
            { text: '`', scopes: ['string'] }
          ],
          [
            { text: 'a ', scopes: ['string'] },
            { text: '${', scopes: ['string', 'interpolation'] },
            { text: 'b', scopes: ['string'] },
            { text: '}', scopes: ['string', 'interpolation'] },
            { text: '<img src="d">', scopes: ['string'] }
          ],
          [{ text: '`', scopes: ['string'] }, { text: ';', scopes: [] }]
        ]);
      });

      it('highlights the content after injections', async () => {
        jasmine.useRealClock();
        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);
        buffer.setText('<script>\nhello();\n</script>\n<div>\n</div>');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: htmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expectTokensToEqual(editor, [
          [
            { text: '<', scopes: ['html'] },
            { text: 'script', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ],
          [
            { text: 'hello', scopes: ['html', 'function'] },
            { text: '();', scopes: ['html'] }
          ],
          [
            { text: '</', scopes: ['html'] },
            { text: 'script', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ],
          [
            { text: '<', scopes: ['html'] },
            { text: 'div', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ],
          [
            { text: '</', scopes: ['html'] },
            { text: 'div', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ]
        ]);
      });

      it('updates a buffer\'s highlighting when a grammar with injectionRegex is added', async () => {
        jasmine.useRealClock();
        atom.grammars.addGrammar(jsGrammar);

        buffer.setText('node.innerHTML = html `\na ${b}<img src="d">\n`;');
        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: jsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expectTokensToEqual(editor, [
          [
            { text: 'node.', scopes: [] },
            { text: 'innerHTML', scopes: ['property'] },
            { text: ' = ', scopes: [] },
            { text: 'html', scopes: ['function'] },
            { text: ' ', scopes: [] },
            { text: '`', scopes: ['string'] }
          ],
          [
            { text: 'a ', scopes: ['string'] },
            { text: '${', scopes: ['string', 'interpolation'] },
            { text: 'b', scopes: ['string'] },
            { text: '}', scopes: ['string', 'interpolation'] },
            { text: '<img src="d">', scopes: ['string'] }
          ],
          [{ text: '`', scopes: ['string'] }, { text: ';', scopes: [] }]
        ]);

        atom.grammars.addGrammar(htmlGrammar);
        await languageMode.nextTransaction;
        // TODO: Still need a `wait(0)` here and I'm not sure why.
        await wait(0);
        expectTokensToEqual(editor, [
          [
            { text: 'node.', scopes: [] },
            { text: 'innerHTML', scopes: ['property'] },
            { text: ' = ', scopes: [] },
            { text: 'html', scopes: ['function'] },
            { text: ' ', scopes: [] },
            { text: '`', scopes: ['string'] },
            { text: '', scopes: ['string', 'html'] }
          ],
          [
            { text: 'a ', scopes: ['string', 'html'] },
            { text: '${', scopes: ['string', 'html', 'interpolation'] },
            { text: 'b', scopes: ['string', 'html'] },
            { text: '}', scopes: ['string', 'html', 'interpolation'] },
            { text: '<', scopes: ['string', 'html'] },
            { text: 'img', scopes: ['string', 'html', 'tag'] },
            { text: ' ', scopes: ['string', 'html'] },
            { text: 'src', scopes: ['string', 'html', 'attr'] },
            { text: '="d">', scopes: ['string', 'html'] }
          ],
          [{ text: '`', scopes: ['string'] }, { text: ';', scopes: [] }]
        ]);
      });

      it('handles injections that intersect', async () => {

        const ejsGrammar = new WASMTreeSitterGrammar(
          atom.grammars,
          ejsGrammarPath,
          CSON.readFileSync(ejsGrammarPath)
        );

        await ejsGrammar.setQueryForTest('highlightsQuery', `
          ["<%=" "%>"] @directive
        `);

        ejsGrammar.addInjectionPoint({
          type: 'template',
          language: () => 'javascript',
          content: (node) => node.descendantsOfType('code')
        });

        ejsGrammar.addInjectionPoint({
          type: 'template',
          language: () => 'html',
          content: (node) => node.descendantsOfType('content')
        });

        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);

        buffer.setText('<body>\n<script>\nb(<%= c.d %>)\n</script>\n</body>');
        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: ejsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expectTokensToEqual(editor, [
          [
            { text: '<', scopes: ['html'] },
            { text: 'body', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ],
          [
            { text: '<', scopes: ['html'] },
            { text: 'script', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ],
          [
            { text: 'b', scopes: ['html', 'function'] },
            { text: '(', scopes: ['html'] },
            { text: '<%=', scopes: ['html', 'directive'] },
            { text: ' c.', scopes: ['html'] },
            { text: 'd', scopes: ['html', 'property'] },
            { text: ' ', scopes: ['html'] },
            { text: '%>', scopes: ['html', 'directive'] },
            { text: ')', scopes: ['html'] }
          ],
          [
            { text: '</', scopes: ['html'] },
            { text: 'script', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ],
          [
            { text: '</', scopes: ['html'] },
            { text: 'body', scopes: ['html', 'tag'] },
            { text: '>', scopes: ['html'] }
          ]
        ]);
      });

      it('handles injections that are empty', async () => {
        jasmine.useRealClock();
        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);
        buffer.setText('text = html');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: jsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expectTokensToEqual(editor, [[{ text: 'text = html', scopes: [] }]]);

        buffer.append(' ``;');
        // await nextHighlightingUpdate(languageMode);
        await languageMode.nextTransaction;
        expectTokensToEqual(editor, [
          [
            { text: 'text = ', scopes: [] },
            { text: 'html', scopes: ['function'] },
            { text: ' ', scopes: [] },
            { text: '``', scopes: ['string'] },
            { text: ';', scopes: [] }
          ]
        ]);

        buffer.insert(
          { row: 0, column: buffer.getText().lastIndexOf('`') },
          '<div>'
        );
        await languageMode.nextTransaction;
        expectTokensToEqual(editor, [
          [
            { text: 'text = ', scopes: [] },
            { text: 'html', scopes: ['function'] },
            { text: ' ', scopes: [] },
            { text: '`', scopes: ['string'] },
            { text: '<', scopes: ['string', 'html'] },
            { text: 'div', scopes: ['string', 'html', 'tag'] },
            { text: '>', scopes: ['string', 'html'] },
            { text: '`', scopes: ['string'] },
            { text: ';', scopes: [] }
          ]
        ]);

        buffer.undo();
        await languageMode.nextTransaction;
        expectTokensToEqual(editor, [
          [
            { text: 'text = ', scopes: [] },
            { text: 'html', scopes: ['function'] },
            { text: ' ', scopes: [] },
            { text: '``', scopes: ['string'] },
            { text: ';', scopes: [] }
          ]
        ]);
      });

      it('terminates comment token at the end of an injection, so that the next injection is NOT a continuation of the comment', async () => {
        jasmine.useRealClock();
        const ejsGrammar = new WASMTreeSitterGrammar(
          atom.grammars,
          ejsGrammarPath,
          CSON.readFileSync(ejsGrammarPath)
        );

        await ejsGrammar.setQueryForTest('highlightsQuery', `
          ["<%" "%>"] @directive
        `);

        ejsGrammar.addInjectionPoint({
          type: 'template',
          language: () => 'javascript',
          content: (node) => node.descendantsOfType('code'),
          newlinesBetween: true
        });

        ejsGrammar.addInjectionPoint({
          type: 'template',
          language: () => 'html',
          content: (node) => node.descendantsOfType('content')
        });

        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);

        buffer.setText('<% // js comment %> b\n<% b() %>');
        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: ejsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expectTokensToEqual(editor, [
          [
            { text: '<%', scopes: ['directive'] },
            { text: ' ', scopes: [] },
            { text: '// js comment ', scopes: ['comment'] },
            { text: '%>', scopes: ['directive'] },
            { text: ' ', scopes: [] },
            { text: 'b', scopes: ['html'] }
          ],
          [
            { text: '<%', scopes: ['directive'] },
            { text: ' ', scopes: [] },
            { text: 'b', scopes: ['function'] },
            { text: '() ', scopes: [] },
            { text: '%>', scopes: ['directive'] }
          ]
        ]);
      });

      it('only covers scope boundaries in parent layers if a nested layer has a boundary at the same position', async () => {
        const jsdocGrammar = new WASMTreeSitterGrammar(
          atom.grammars,
          jsdocGrammarPath,
          CSON.readFileSync(jsdocGrammarPath)
        );

        jsdocGrammar.setQueryForTest('highlightsQuery', '');

        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(jsdocGrammar);

        editor.setGrammar(jsGrammar);
        editor.setText('/**\n*/\n{\n}');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: jsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expectTokensToEqual(editor, [
          [{ text: '/**', scopes: ['comment'] }],
          [{ text: '*/', scopes: ['comment'] }],
          [{ text: '{', scopes: [] }],
          [{ text: '}', scopes: [] }]
        ]);
      });

      it('reports scopes from shallower layers when they are at the start or end of an injection', async () => {
        jasmine.useRealClock();
        await atom.packages.activatePackage('language-javascript');

        let jsdocGrammar = atom.grammars.grammarForScopeName('source.jsdoc');
        await jsdocGrammar.setQueryForTest('highlightsQuery', `
          ((ERROR) @comment.block.js
            (#is? test.root true))
          (document) @comment.block.js

          (tag_name) @storage.type.class.jsdoc
        `);

        let jsGrammar = atom.grammars.grammarForScopeName('source.js');
        await jsGrammar.setQueryForTest('highlightsQuery', `
          ["{" "}"] @punctuation.brace
        `);

        editor.setGrammar(jsGrammar);
        editor.setText('/** @babel */\n{\n}');
        let languageMode = buffer.getLanguageMode();
        if (languageMode.ready) {
          await languageMode.ready;
          await languageMode.nextTransaction;
        }
        expectTokensToEqual(editor, [
          [
            { text: '/** ', scopes: ['comment block js'] },
            {
              text: '@babel',
              scopes: ['comment block js', 'storage type class jsdoc']
            },
            {
              text: ' */',
              scopes: ['comment block js']
            }
          ],
          [
            {
              text: '{',
              scopes: [
                'punctuation brace'
              ]
            }
          ],
          [
            {
              text: '}',
              scopes: [
                'punctuation brace'
              ]
            }
          ]
        ]);
      });

      it('respects the `includeChildren` property of injection points', async () => {
        const rustGrammar = new WASMTreeSitterGrammar(
          atom.grammars,
          rustGrammarPath,
          CSON.readFileSync(rustGrammarPath)
        );

        for (const nodeType of ['macro_invocation', 'macro_rule']) {
          atom.grammars.addInjectionPoint('source.rust', {
            type: nodeType,
            language() {
              return 'rust';
            },
            content(node) {
              return node.lastChild;
            },
            includeChildren: true,
            languageScope: null,
            coverShallowerScopes: true
          });
        }

        await rustGrammar.setQueryForTest('highlightsQuery', `
          (macro_invocation
            macro: (identifier) @macro
            (#set! capture.final true))

          (call_expression
            (field_expression
              (field_identifier) @function)
              (#set! capture.final true))

          ((field_identifier) @property
            (#set! capture.final true))

          ((identifier) @variable
            (#set! capture.shy true))
        `);

        atom.grammars.addGrammar(rustGrammar);

        // Macro call within another macro call.
        buffer.setText('assert_eq!(a.b.c(), vec![d.e()]); f.g();');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: rustGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        // There should not be duplicate scopes due to the root layer
        // and for the injected rust layer.
        expectTokensToEqual(editor, [
          [
            { text: 'assert_eq', scopes: ['macro'] },
            { text: '!(', scopes: [] },
            { text: 'a', scopes: ['variable'] },
            { text: '.', scopes: [] },
            { text: 'b', scopes: ['property'] },
            { text: '.', scopes: [] },
            { text: 'c', scopes: ['function'] },
            { text: '(), ', scopes: [] },
            { text: 'vec', scopes: ['macro'] },
            { text: '![', scopes: [] },
            { text: 'd', scopes: ['variable'] },
            { text: '.', scopes: [] },
            { text: 'e', scopes: ['function'] },
            { text: '()]); ', scopes: [] },
            { text: 'f', scopes: ['variable'] },
            { text: '.', scopes: [] },
            { text: 'g', scopes: ['function'] },
            { text: '();', scopes: [] }
          ]
        ]);
      });

      it('omits the injected grammar\'s base scope when `languageScope` is `null`', async () => {

        let customJsConfig = { ...jsConfig };
        let customJsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, customJsConfig);

        await jsGrammar.setQueryForTest('highlightsQuery', `
          (comment) @comment
          (property_identifier) @property
          (call_expression (identifier) @function)
          (template_string) @string
          (template_substitution
            ["\${" "}"] @interpolation)
        `);

        let customHtmlConfig = { ...htmlConfig };
        let customHtmlGrammar = new WASMTreeSitterGrammar(atom.grammars, htmlGrammarPath, customHtmlConfig);

        await htmlGrammar.setQueryForTest('highlightsQuery', `
          (fragment) @html
          (tag_name) @tag
          (attribute_name) @attr
        `);

        customHtmlGrammar.addInjectionPoint({
          ...SCRIPT_TAG_INJECTION_POINT,
          languageScope: null
        });

        jasmine.useRealClock();
        atom.grammars.addGrammar(customJsGrammar);
        atom.grammars.addGrammar(customHtmlGrammar);
        buffer.setText('<script>\nhello();\n</script>\n<div>\n</div>');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: customHtmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        let descriptor = languageMode.scopeDescriptorForPosition([1, 1]);
        expect(
          descriptor.getScopesArray().includes('source.js')
        ).toBe(false);
      });

      it('uses a custom base scope on the injected layer when `languageScope` is a string', async () => {

        let customJsConfig = { ...jsConfig };
        let customJsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, customJsConfig);

        await jsGrammar.setQueryForTest('highlightsQuery', `
          (comment) @comment
          (property_identifier) @property
          (call_expression (identifier) @function)
          (template_string) @string
          (template_substitution
            ["\${" "}"] @interpolation)
        `);

        let customHtmlConfig = { ...htmlConfig };
        let customHtmlGrammar = new WASMTreeSitterGrammar(atom.grammars, htmlGrammarPath, customHtmlConfig);

        await htmlGrammar.setQueryForTest('highlightsQuery', `
          (fragment) @html
          (tag_name) @tag
          (attribute_name) @attr
        `);

        customHtmlGrammar.addInjectionPoint({
          ...SCRIPT_TAG_INJECTION_POINT,
          languageScope: 'source.js.embedded'
        });

        jasmine.useRealClock();
        atom.grammars.addGrammar(customJsGrammar);
        atom.grammars.addGrammar(customHtmlGrammar);
        buffer.setText('<script>\nhello();\n</script>\n<div>\n</div>');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: customHtmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        let descriptor = languageMode.scopeDescriptorForPosition([1, 1]);
        expect(
          descriptor.getScopesArray().includes('source.js')
        ).toBe(false);
        expect(
          descriptor.getScopesArray().includes('source.js.embedded')
        ).toBe(true);
      });

      it('uses a custom base scope on the injected layer when `languageScope` is a function', async () => {

        let customJsConfig = { ...jsConfig };
        let customJsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, customJsConfig);

        await jsGrammar.setQueryForTest('highlightsQuery', `
          (comment) @comment
          (property_identifier) @property
          (call_expression (identifier) @function)
          (template_string) @string
          (template_substitution
            ["\${" "}"] @interpolation)
        `);

        let customHtmlConfig = { ...htmlConfig };
        let customHtmlGrammar = new WASMTreeSitterGrammar(atom.grammars, htmlGrammarPath, customHtmlConfig);

        await htmlGrammar.setQueryForTest('highlightsQuery', `
          (fragment) @html
          (tag_name) @tag
          (attribute_name) @attr
        `);

        let timestamp = Date.now();

        customHtmlGrammar.addInjectionPoint({
          ...SCRIPT_TAG_INJECTION_POINT,
          languageScope: (grammar) => `${grammar.scopeName}.custom-${timestamp}`
        });

        jasmine.useRealClock();
        atom.grammars.addGrammar(customJsGrammar);
        atom.grammars.addGrammar(customHtmlGrammar);
        buffer.setText('<script>\nhello();\n</script>\n<div>\n</div>');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: customHtmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        let descriptor = languageMode.scopeDescriptorForPosition([1, 1]);
        expect(
          descriptor.getScopesArray().includes('source.js')
        ).toBe(false);
        expect(
          descriptor.getScopesArray().includes(`source.js.custom-${timestamp}`)
        ).toBe(true);
      });

      it('notifies onDidTokenize listeners the first time all syntax highlighting is done', async () => {
        const promise = new Promise(resolve => {
          editor.onDidTokenize(event => {
            expectTokensToEqual(editor, [
              [
                { text: '<', scopes: ['html'] },
                { text: 'script', scopes: ['html', 'tag'] },
                { text: '>', scopes: ['html'] }
              ],
              [
                { text: 'hello', scopes: ['html', 'function'] },
                { text: '();', scopes: ['html'] }
              ],
              [
                { text: '</', scopes: ['html'] },
                { text: 'script', scopes: ['html', 'tag'] },
                { text: '>', scopes: ['html'] }
              ]
            ]);
            resolve();
          });
        });

        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);
        buffer.setText('<script>\nhello();\n</script>');

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: htmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await promise;
      });
    });
  });

  describe('highlighting after random changes', () => {
    let originalTimeout;

    beforeEach(() => {
      originalTimeout = jasmine.getEnv().defaultTimeoutInterval;
      jasmine.getEnv().defaultTimeoutInterval = 60 * 1000;
    });

    afterEach(() => {
      jasmine.getEnv().defaultTimeoutInterval = originalTimeout;
    });

    it('matches the highlighting of a freshly-opened editor', async () => {
      jasmine.useRealClock();

      const text = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'sample.js'),
        'utf8'
      );
      atom.grammars.loadGrammarSync(jsGrammarPath);
      atom.grammars.assignLanguageMode(buffer, 'source.js');
      // buffer.getLanguageMode().syncTimeoutMicros = 0;

      const initialSeed = Date.now();
      for (let i = 0, trialCount = 10; i < trialCount; i++) {
        let seed = initialSeed + i;
        // seed = 1541201470759
        const random = Random(seed);

        // Parse the initial content and render all of the screen lines.
        buffer.setText(text);
        buffer.clearUndoStack();
        let languageModeA = buffer.getLanguageMode();
        // await buffer.getLanguageMode().parseCompletePromise();
        expect(languageModeA instanceof WASMTreeSitterLanguageMode).toBe(true);
        await languageModeA.ready;
        editor.displayLayer.getScreenLines();

        // Make several random edits.
        for (let j = 0, editCount = 1 + random(4); j < editCount; j++) {
          const editRoll = random(10);
          const range = getRandomBufferRange(random, buffer);

          if (editRoll < 2) {
            const linesToInsert = buildRandomLines(
              random,
              range.getExtent().row + 1
            );
            // console.log('replace', range.toString(), JSON.stringify(linesToInsert))
            buffer.setTextInRange(range, linesToInsert);
          } else if (editRoll < 5) {
            // console.log('delete', range.toString())
            buffer.delete(range);
          } else {
            const linesToInsert = buildRandomLines(random, 3);
            // console.log('insert', range.start.toString(), JSON.stringify(linesToInsert))
            buffer.insert(range.start, linesToInsert);
          }

          // console.log(buffer.getText())

          // Sometimes, let the parse complete before re-rendering.
          // Sometimes re-render and move on before the parse completes.
          // if (random(2)) await buffer.getLanguageMode().parseCompletePromise();
          await buffer.getLanguageMode().nextTransaction;
          editor.displayLayer.getScreenLines();
        }

        // Revert the edits, because Tree-sitter's error recovery is somewhat path-dependent,
        // and we want a state where the tree parse result is guaranteed.
        while (buffer.undo()) {}

        // Create a fresh buffer and editor with the same text.
        const buffer2 = new TextBuffer(buffer.getText());
        const editor2 = new TextEditor({ buffer: buffer2 });
        atom.grammars.assignLanguageMode(buffer2, 'source.js');

        // Verify that the the two buffers have the same syntax highlighting.
        let languageModeB = buffer.getLanguageMode();
        expect(languageModeB instanceof WASMTreeSitterLanguageMode).toBe(true);
        await languageModeB.ready;
        expect(languageModeA.tree.rootNode.toString()).toEqual(
          languageModeB.tree.rootNode.toString(),
          `Seed: ${seed}`
        );

        // TODO: `wait(0)` works here when awaiting the next transaction
        // doesn't. Not sure why.
        await wait(0);

        for (let j = 0, n = editor.getScreenLineCount(); j < n; j++) {
          const tokens1 = editor.tokensForScreenRow(j);
          const tokens2 = editor2.tokensForScreenRow(j);
          expect(tokens1).toEqual(tokens2, `Seed: ${seed}, screen line: ${j}`);
          if (jasmine.getEnv().currentSpec.results().failedCount > 0) {
            console.log(tokens1);
            console.log(tokens2);
            debugger; // eslint-disable-line no-debugger
            break;
          }
        }

        if (jasmine.getEnv().currentSpec.results().failedCount > 0) break;
      }
    });
  });

  describe('.suggestedIndentForBufferRow', () => {
    let editor;

    describe('javascript', () => {
      beforeEach(async () => {
        editor = await atom.workspace.open('sample.js', { autoIndent: false });
        await atom.packages.activatePackage('language-javascript');
        await editor.getBuffer().getLanguageMode().ready;
      });

      it('bases indentation off of the previous non-blank line', () => {
        expect(editor.suggestedIndentForBufferRow(0)).toBe(0);
        expect(editor.suggestedIndentForBufferRow(1)).toBe(1);
        expect(editor.suggestedIndentForBufferRow(2)).toBe(2);
        expect(editor.suggestedIndentForBufferRow(5)).toBe(3);
        expect(editor.suggestedIndentForBufferRow(7)).toBe(2);
        expect(editor.suggestedIndentForBufferRow(9)).toBe(1);
        expect(editor.suggestedIndentForBufferRow(11)).toBe(1);
      });

      it('does not take invisibles into account', () => {
        editor.update({ showInvisibles: true });
        expect(editor.suggestedIndentForBufferRow(0)).toBe(0);
        expect(editor.suggestedIndentForBufferRow(1)).toBe(1);
        expect(editor.suggestedIndentForBufferRow(2)).toBe(2);
        expect(editor.suggestedIndentForBufferRow(5)).toBe(3);
        expect(editor.suggestedIndentForBufferRow(7)).toBe(2);
        expect(editor.suggestedIndentForBufferRow(9)).toBe(1);
        expect(editor.suggestedIndentForBufferRow(11)).toBe(1);
      });
    });

    describe('css', () => {
      beforeEach(async () => {
        editor = await atom.workspace.open('css.css', { autoIndent: true });
        await atom.packages.activatePackage('language-source');
        await atom.packages.activatePackage('language-css');
        await editor.getBuffer().getLanguageMode().ready;
      });

      it('does not return negative values (regression)', async () => {
        jasmine.useRealClock();
        editor.setText('.test {\npadding: 0;\n}');
        await wait(0);
        expect(editor.suggestedIndentForBufferRow(2)).toBe(0);

        editor.setText('@media screen {\n  .test {\n    padding: 0;\n  }\n}');
        await wait(0);
        expect(editor.suggestedIndentForBufferRow(3)).toBe(1);
      });
    });
  });

  describe('.suggestedIndentForBufferRows', () => {
    it('works correctly when straddling an injection boundary', async () => {
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

      const htmlGrammar = new WASMTreeSitterGrammar(
        atom.grammars,
        htmlGrammarPath,
        htmlConfig
      );

      htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);

      atom.grammars.addGrammar(jsGrammar);
      atom.grammars.addGrammar(htmlGrammar);

      // `suggestedIndentForBufferRows` should use the HTML grammar to
      // determine the indent level of `let foo` rather than the JS grammar.
      buffer.setText(dedent`
        <script>
          let foo;
        </script>
      `);

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: htmlGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });

      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      let map = languageMode.suggestedIndentForBufferRows(1, 1, editor.getTabLength());

      expect(map.get(1)).toBe(1);
    });
  });

  describe('folding', () => {
    it('can fold nodes that start and end with specified tokens', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('foldsQuery', `
      [
        (statement_block)
        (switch_body)
        (class_body)
        (object)
        (formal_parameters)
      ] @fold
      `);

      // {
      //   parser: 'tree-sitter-javascript',
      //   folds: [
      //     {
      //       start: { type: '{', index: 0 },
      //       end: { type: '}', index: -1 }
      //     },
      //     {
      //       start: { type: '(', index: 0 },
      //       end: { type: ')', index: -1 }
      //     }
      //   ]
      // }

      buffer.setText(dedent`
        module.exports =
        class A {
          getB (c,
                d,
                e) {
            return this.f(g)
          }
        }
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(editor.isFoldableAtBufferRow(0)).toBe(false);
      expect(editor.isFoldableAtBufferRow(1)).toBe(true);
      expect(editor.isFoldableAtBufferRow(2)).toBe(true);
      expect(editor.isFoldableAtBufferRow(3)).toBe(false);
      expect(editor.isFoldableAtBufferRow(4)).toBe(true);
      expect(editor.isFoldableAtBufferRow(5)).toBe(false);

      editor.foldBufferRow(2);
      expect(getDisplayText(editor)).toBe(dedent`
        module.exports =
        class A {
          getB (c,…) {
            return this.f(g)
          }
        }
      `);

      editor.foldBufferRow(4);
      expect(getDisplayText(editor)).toBe(dedent`
        module.exports =
        class A {
          getB (c,…) {…}
        }
      `);
    });

    it('folds entire buffer rows when necessary to keep words on separate lines', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('foldsQuery', `
      [
        (switch_body)
        (class_body)
        (object)
        (formal_parameters)
      ] @fold

      ((if_statement
        consequence: (statement_block) @fold)
        (#set! fold.offsetEnd -1))

      (else_clause (statement_block) @fold)

      (statement_block) @fold
      `);

      buffer.setText(dedent`
        if (a) {
          b
        } else if (c) {
          d
        } else {
          e
        }
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      // NOTE: I had to decrement all the line numbers to get this test to
      // pass, but that matches up with my expectations just from experimenting
      // in the editor. I have no idea how the `TreeSitterLanguageMode` specs
      // get this to pass with the wrong line numbers.

      // Avoid bringing the `else if...` up onto the same screen line as the
      // preceding `if`.
      editor.foldBufferRow(0);
      editor.foldBufferRow(2);
      expect(getDisplayText(editor)).toBe(dedent`
        if (a) {…
        } else if (c) {…
        } else {
          e
        }
      `);

      // It's ok to bring the final `}` onto the same screen line as the
      // preceding `else`.
      editor.foldBufferRow(4);
      expect(getDisplayText(editor)).toBe(dedent`
        if (a) {…
        } else if (c) {…
        } else {…}
      `);
    });

    it('can fold nodes of specified types', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('foldsQuery', `
      (jsx_element
        (jsx_opening_element ">" @fold)
        (#set! fold.endAt parent.parent.lastChild.startPosition)
        (#set! fold.offsetEnd -1)
      )

      (jsx_element
        (jsx_opening_element) @fold
        (#set! fold.endAt lastChild.previousSibling.endPosition))

      ((jsx_self_closing_element) @fold
        (#set! fold.endAt lastChild.previousSibling.startPosition))
      `);

      buffer.setText(dedent`
        const element1 = <Element
          className='submit'
          id='something' />

        const element2 = <Element>
          <span>hello</span>
          <span>world</span>
        </Element>
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(editor.isFoldableAtBufferRow(0)).toBe(true);
      expect(editor.isFoldableAtBufferRow(1)).toBe(false);
      expect(editor.isFoldableAtBufferRow(2)).toBe(false);
      expect(editor.isFoldableAtBufferRow(3)).toBe(false);
      expect(editor.isFoldableAtBufferRow(4)).toBe(true);
      expect(editor.isFoldableAtBufferRow(5)).toBe(false);

      editor.foldBufferRow(0);
      expect(getDisplayText(editor)).toBe(dedent`
        const element1 = <Element…/>

        const element2 = <Element>
          <span>hello</span>
          <span>world</span>
        </Element>
      `);

      editor.foldBufferRow(4);
      expect(getDisplayText(editor)).toBe(dedent`
        const element1 = <Element…/>

        const element2 = <Element>…
        </Element>
      `);
    });

    it('can fold entire nodes when no start or end parameters are specified', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('foldsQuery', `
      ((comment) @fold
        (#set! fold.endAt endPosition)
        (#set! fold.adjustEndColumn 0))
      `);

      buffer.setText(dedent`
        /**
         * Important
         */
        const x = 1 /*
          Also important
        */
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(editor.isFoldableAtBufferRow(0)).toBe(true);
      expect(editor.isFoldableAtBufferRow(1)).toBe(false);
      expect(editor.isFoldableAtBufferRow(2)).toBe(false);
      expect(editor.isFoldableAtBufferRow(3)).toBe(true);
      expect(editor.isFoldableAtBufferRow(4)).toBe(false);

      editor.foldBufferRow(0);
      expect(getDisplayText(editor)).toBe(dedent`
        /**… */
        const x = 1 /*
          Also important
        */
      `);

      editor.foldBufferRow(3);
      expect(getDisplayText(editor)).toBe(dedent`
        /**… */
        const x = 1 /*…*/
      `);
    });

    it('folds between arbitrary points in the buffer with @fold.start and @fold.end markers', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, cGrammarPath, cConfig);

      await grammar.setQueryForTest('foldsQuery', `
      ["#ifndef" "#ifdef" "#elif" "#else"] @fold.start
      ["#elif" "#else" "#endif"] @fold.end
      `);

      buffer.setText(dedent`
        #ifndef FOO_H_
        #define FOO_H_

        #ifdef _WIN32

        #include <windows.h>
        const char *path_separator = "\\";

        #elif defined MACOS

        #include <carbon.h>
        const char *path_separator = "/";

        #else

        #include <dirent.h>
        const char *path_separator = "/";

        #endif

        #endif
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(editor.isFoldableAtBufferRow(0)).toBe(true);

      editor.foldBufferRow(3);
      expect(getDisplayText(editor)).toBe(dedent`
        #ifndef FOO_H_
        #define FOO_H_

        #ifdef _WIN32…
        #elif defined MACOS

        #include <carbon.h>
        const char *path_separator = "/";

        #else

        #include <dirent.h>
        const char *path_separator = "/";

        #endif

        #endif
      `);

      editor.foldBufferRow(8);
      expect(getDisplayText(editor)).toBe(dedent`
        #ifndef FOO_H_
        #define FOO_H_

        #ifdef _WIN32…
        #elif defined MACOS…
        #else

        #include <dirent.h>
        const char *path_separator = "/";

        #endif

        #endif
      `);

      editor.foldBufferRow(0);
      expect(getDisplayText(editor)).toBe(dedent`
        #ifndef FOO_H_…
        #endif
      `);

      console.time('folding all');
      editor.foldAllAtIndentLevel(1);
      console.timeEnd('folding all');
      expect(getDisplayText(editor)).toBe(dedent`
        #ifndef FOO_H_
        #define FOO_H_

        #ifdef _WIN32…
        #elif defined MACOS…
        #else…
        #endif

        #endif
      `);
    });

    it('does not fold when the start and end parameters match the same child', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, htmlGrammarPath, htmlConfig);

      await grammar.setQueryForTest('foldsQuery', `
        (element) @fold
      `);

      buffer.setText(dedent`
        <head>
        <meta name='key-1', content='value-1'>
        <meta name='key-2', content='value-2'>
        </head>
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      // Void elements have only one child
      expect(editor.isFoldableAtBufferRow(1)).toBe(false);
      expect(editor.isFoldableAtBufferRow(2)).toBe(false);

      editor.foldBufferRow(0);
      expect(getDisplayText(editor)).toBe(dedent`
        <head>…</head>
      `);
    });

    it('can target named vs anonymous nodes as fold boundaries', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, rubyGrammarPath, rubyConfig);

      await grammar.setQueryForTest('foldsQuery', `
        ((if
          alternative: [(elsif) (else)]) @fold
          (#set! fold.endAt firstNamedChild.nextNamedSibling.nextNamedSibling.startPosition)
          (#set! fold.offsetEnd -1))

        ((elsif
          consequence: [(then) (elsif)]) @fold
          (#set! fold.endAt firstNamedChild.nextNamedSibling.nextNamedSibling.startPosition)
          (#set! fold.offsetEnd -1))

        ((else) @fold
          (#set! fold.endAt endPosition))

        (if) @fold
      `);

      buffer.setText(dedent`
        if a
          b
        elsif c
          d
        else
          e
        end
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(languageMode.tree.rootNode.toString()).toBe(
        '(program (if condition: (identifier) consequence: (then ' +
          '(identifier)) ' +
          'alternative: (elsif condition: (identifier) consequence: (then ' +
          '(identifier)) ' +
          'alternative: (else ' +
          '(identifier)))))'
      );

      editor.foldBufferRow(2);
      expect(getDisplayText(editor)).toBe(dedent`
        if a
          b
        elsif c…
        else
          e
        end
      `);

      editor.foldBufferRow(4);
      expect(getDisplayText(editor)).toBe(dedent`
        if a
          b
        elsif c…
        else…
        end
      `);
    });

    it('updates fold locations when the buffer changes', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('foldsQuery', `
        [
          (switch_body)
          (class_body)
          (object)
          (formal_parameters)
          (statement_block) @fold
        ] @fold
      `);

      buffer.setText(dedent`
        class A {
          // a
          constructor (b) {
            this.b = b
          }
        }
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      languageMode.isFoldableCache = [];

      expect(languageMode.isFoldableAtRow(0)).toBe(true);
      expect(languageMode.isFoldableAtRow(1)).toBe(false);
      expect(languageMode.isFoldableAtRow(2)).toBe(true);
      expect(languageMode.isFoldableAtRow(3)).toBe(false);
      expect(languageMode.isFoldableAtRow(4)).toBe(false);

      buffer.insert([0, 0], '\n');

      expect(languageMode.isFoldableAtRow(0)).toBe(false);
      expect(languageMode.isFoldableAtRow(1)).toBe(true);
      expect(languageMode.isFoldableAtRow(2)).toBe(false);
      expect(languageMode.isFoldableAtRow(3)).toBe(true);
      expect(languageMode.isFoldableAtRow(4)).toBe(false);
    });

    describe('when folding a node that ends with a line break', () => {
      it('ends the fold at the end of the previous line', async () => {
        const grammar = new WASMTreeSitterGrammar(atom.grammars,
          pythonGrammarPath,
          CSON.readFileSync(pythonGrammarPath)
        );

        await grammar.setQueryForTest('foldsQuery', `
        ([
          (function_definition)
          (class_definition)

          (while_statement)
          (for_statement)
          (with_statement)
          (try_statement)
          (match_statement)

          (elif_clause)
          (else_clause)
          (case_clause)

          (import_from_statement)
          (parameters)
          (argument_list)

          (parenthesized_expression)
          (generator_expression)
          (list_comprehension)
          (set_comprehension)
          (dictionary_comprehension)

          (tuple)
          (list)
          (set)
          (dictionary)

          (string)
        ] @fold (#set! fold.endAt endPosition))

        `);

        buffer.setText(dedent`
          def ab():
            print 'a'
            print 'b'

          def cd():
            print 'c'
            print 'd'
        `);

        let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        editor.foldBufferRow(0);

        expect(getDisplayText(editor)).toBe(dedent`
          def ab():…

          def cd():
            print 'c'
            print 'd'
        `);
      });
    });

    it('folds code in injected languages', async () => {
      jasmine.useRealClock();
      const htmlGrammar = new WASMTreeSitterGrammar(
        atom.grammars,
        htmlGrammarPath,
        htmlConfig
      );

      await htmlGrammar.setQueryForTest('foldsQuery', `
        [(element) (script_element)] @fold
      `);

      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await jsGrammar.setQueryForTest('foldsQuery', `
        (template_string) @fold
        ((arguments) @fold
          (#set! fold.adjustEndColumn 0)
          (#set! fold.offsetEnd -1))
      `);

      jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

      atom.grammars.addGrammar(htmlGrammar);

      buffer.setText(
        `a = html \`
            <div>
              c\${def(
                1,
                2,
                3,
              )}e\${f}g
            </div>
          \`
        `
      );
      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: jsGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });

      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      editor.foldBufferRow(2);
      expect(getDisplayText(editor)).toBe(
        `a = html \`
            <div>
              c\${def(…
              )}e\${f}g
            </div>
          \`
        `
      );

      editor.foldBufferRow(1);
      expect(getDisplayText(editor)).toBe(
        `a = html \`
            <div>…</div>
          \`
        `
      );

      editor.foldBufferRow(0);
      expect(getDisplayText(editor)).toBe(
        `a = html \`…\`
        `
      );
    });
  });

  describe('.scopeDescriptorForPosition', () => {
    it('returns a scope descriptor representing the given position in the syntax tree', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (property_identifier) @property.name
        (comment) @comment.block
      `);

      buffer.setText('foo({bar: baz});');

      let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(
        editor
          .scopeDescriptorForBufferPosition([0, 'foo({b'.length])
          .getScopesArray()
      ).toEqual(['source.js', 'property.name']);
      expect(
        editor
          .scopeDescriptorForBufferPosition([0, 'foo({'.length])
          .getScopesArray()
      ).toEqual(['source.js', 'property.name']);

      // Drive-by test for .tokenForPosition()
      const token = editor.tokenForBufferPosition([0, 'foo({b'.length]);
      expect(token.value).toBe('bar');
      expect(token.scopes).toEqual(['source.js', 'property.name']);

      buffer.setText('// baz\n');

      // Adjust position when at end of line

      languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(
        editor
          .scopeDescriptorForBufferPosition([0, '// baz'.length])
          .getScopesArray()
      ).toEqual(['source.js', 'comment.block']);
    });

    it('includes nodes in injected syntax trees', async () => {
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await jsGrammar.setQueryForTest('highlightsQuery', `
        (template_string) @string.quoted
        (property_identifier) @property.name
      `);

      jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

      const htmlGrammar = new WASMTreeSitterGrammar(
        atom.grammars,
        htmlGrammarPath,
        htmlConfig
      );

      await htmlGrammar.setQueryForTest('highlightsQuery', `
        (script_element) @script.tag
      `);
      htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);

      atom.grammars.addGrammar(jsGrammar);
      atom.grammars.addGrammar(htmlGrammar);

      buffer.setText(`
        <div>
          <script>
            html \`
              <span>\${person.name}</span>
            \`
          </script>
        </div>
      `);

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: htmlGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      const position = buffer.findSync('name').start;
      expect(
        languageMode
          .scopeDescriptorForPosition(position)
          .getScopesArray()
      ).toEqual([
        'text.html.basic',
        'script.tag',
        'source.js',
        'string.quoted',
        'property.name'
      ]);
    });

    it('reports scopes correctly at boundaries where more than one layer adds a scope', async () => {
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await jsGrammar.setQueryForTest('highlightsQuery', `
        (template_string) @string.quoted
        ((template_string) @string-insides
          (#set! adjust.startAfterFirstMatchOf "^\`")
          (#set! adjust.endBeforeFirstMatchOf "\`$"))
        "\`" @punctuation
        (property_identifier) @property.name
      `);

      jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

      const htmlGrammar = new WASMTreeSitterGrammar(
        atom.grammars,
        htmlGrammarPath,
        htmlConfig
      );

      await htmlGrammar.setQueryForTest('highlightsQuery', `
        (start_tag) @tag
      `);
      htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);

      atom.grammars.addGrammar(jsGrammar);
      atom.grammars.addGrammar(htmlGrammar);

      buffer.setText(dedent`
        html\`<span>\${person.name}</span>\`
      `);

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: jsGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      const position = buffer.findSync('html`').end;
      expect(
        languageMode
          .scopeDescriptorForPosition(position)
          .getScopesArray()
      ).toEqual([
        'source.js',
        'string.quoted',
        'string-insides',
        'text.html.basic',
        'tag'
      ]);
    });

    it('includes the root scope name even when the given position is in trailing whitespace at EOF', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (property_identifier) @property.name
      `);

      buffer.setText('a; ');

      let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(
        editor.scopeDescriptorForBufferPosition([0, 3]).getScopesArray()
      ).toEqual(['source.js']);
    });

    it('works when the given position is between tokens', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment.block
      `);

      buffer.setText('a  // b');

      let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(
        editor.scopeDescriptorForBufferPosition([0, 2]).getScopesArray()
      ).toEqual(['source.js']);
      expect(
        editor.scopeDescriptorForBufferPosition([0, 3]).getScopesArray()
      ).toEqual(['source.js', 'comment.block']);
    });

    it('works when a scope range has been adjusted', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment.block
        ((comment) @punctuation.definition.comment.begin
          (#set! adjust.startAndEndAroundFirstMatchOf "^/\\\\*"))
      `);

      buffer.setText('\n/* lorem ipsum dolor sit amet */');

      let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(
        editor.scopeDescriptorForBufferPosition([1, 0]).getScopesArray()
      ).toEqual(['source.js', 'comment.block', 'punctuation.definition.comment.begin']);
      expect(
        editor.scopeDescriptorForBufferPosition([1, 1]).getScopesArray()
      ).toEqual(['source.js', 'comment.block', 'punctuation.definition.comment.begin']);
      expect(
        editor.scopeDescriptorForBufferPosition([1, 2]).getScopesArray()
      ).toEqual(['source.js', 'comment.block']);
    });

    it('ignores a parent\'s scopes if an injection layer sets `coverShallowerScopes`', async () => {
      jasmine.useRealClock();
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      let tempJsRegexConfig = {
        ...jsRegexConfig,
        injectionRegex: '^(js-regex-for-test)$'
      };

      const regexGrammar = new WASMTreeSitterGrammar(atom.grammars, jsRegexGrammarPath, tempJsRegexConfig);

      await regexGrammar.setQueryForTest('highlightsQuery', `
        (pattern) @string.regexp
        (optional "?" @keyword.operator.optional)
      `);

      jsGrammar.addInjectionPoint({
        type: 'regex_pattern',
        language(regex) {
          return 'js-regex-for-test';
        },
        content(regex) {
          return regex;
        },
        includeChildren: true,
        languageScope: null,
        coverShallowerScopes: true
      });

      await jsGrammar.setQueryForTest('highlightsQuery', `
        ((regex) @gadfly
          (#set! adjust.startAndEndAroundFirstMatchOf "lor\\\\?em"))
        (regex) @regex-outer
        (regex_pattern) @regex-inner
      `);

      atom.grammars.addGrammar(regexGrammar);
      atom.grammars.addGrammar(jsGrammar);

      buffer.setText(dedent`
        let foo = /patt.lor?em.ern/;
      `);

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: jsGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      // Wait for injections.
      await wait(100);

      let injectionLayers = languageMode.getAllInjectionLayers();
      expect(injectionLayers.length).toBe(1);

      let descriptor = languageMode.scopeDescriptorForPosition(new Point(0, 19));
      let scopes = descriptor.getScopesArray();
      expect(scopes.includes('gadfly')).toBe(false);
      expect(scopes.includes('regex-outer')).toBe(true);
      expect(scopes.includes('regex-inner')).toBe(false);
    });

    it('arranges scopes in the proper order when scopes from several layers were already open at a given point', async () => {
      jasmine.useRealClock();
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      let tempJsRegexConfig = {
        ...jsRegexConfig,
        injectionRegex: '^(js-regex-for-test)$'
      };

      const regexGrammar = new WASMTreeSitterGrammar(atom.grammars, jsRegexGrammarPath, tempJsRegexConfig);

      await regexGrammar.setQueryForTest('highlightsQuery', `
        (pattern) @string.regexp
      `);

      jsGrammar.addInjectionPoint({
        type: 'regex_pattern',
        language(regex) {
          return 'js-regex-for-test';
        },
        content(regex) {
          return regex;
        },
        includeChildren: true,
        languageScope: null
      });

      await jsGrammar.setQueryForTest('highlightsQuery', `
        ((regex_pattern) @gadfly
          (#set! adjust.startAndEndAroundFirstMatchOf "lor\\\\?em"))
        (regex) @regex-outer
        (regex_pattern) @regex-inner
      `);

      atom.grammars.addGrammar(regexGrammar);
      atom.grammars.addGrammar(jsGrammar);

      buffer.setText(dedent`
        let foo = /patt.lor?em.ern/;
      `);

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: jsGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      // Wait for injections.
      await wait(100);

      let injectionLayers = languageMode.getAllInjectionLayers();
      expect(injectionLayers.length).toBe(1);

      let descriptor = languageMode.scopeDescriptorForPosition(new Point(0, 19));
      let scopes = descriptor.getScopesArray();
      expect(scopes).toEqual([
        "source.js",
        "regex-outer",
        "regex-inner",
        "string.regexp",
        "gadfly"
      ]);
    });

  });

  describe('.syntaxTreeScopeDescriptorForPosition', () => {
    it('returns a scope descriptor representing the given position in the syntax tree', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      buffer.setText('foo({bar: baz});');

      let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(
        editor
          .syntaxTreeScopeDescriptorForBufferPosition([0, 6])
          .getScopesArray()
      ).toEqual([
        'source.js',
        'program',
        'expression_statement',
        'call_expression',
        'arguments',
        'object',
        'pair',
        'property_identifier'
      ]);

      languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setText('//bar\n');
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await languageMode.nextTransaction;

      expect(
        editor
          .syntaxTreeScopeDescriptorForBufferPosition([0, 5])
          .getScopesArray()
      ).toEqual(['source.js', 'program', 'comment']);
    });

    it('includes nodes in injected syntax trees', async () => {
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

      const htmlGrammar = new WASMTreeSitterGrammar(
        atom.grammars,
        htmlGrammarPath,
        htmlConfig
      );

      htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);

      atom.grammars.addGrammar(jsGrammar);
      atom.grammars.addGrammar(htmlGrammar);

      buffer.setText(`
        <div>
          <script>
            html \`
              <span>\${person.name}</span>
            \`
          </script>
        </div>
      `);

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: htmlGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      const position = buffer.findSync('name').start;
      expect(
        editor
          .syntaxTreeScopeDescriptorForBufferPosition(position)
          .getScopesArray()
      ).toEqual([
        'text.html.basic',
        'fragment',
        'element',
        'script_element',
        'raw_text',
        'program',
        'expression_statement',
        'call_expression',
        'template_string',
        'fragment',
        'element',
        'template_substitution',
        'member_expression',
        'property_identifier'
      ]);
    });
  });

  describe('.bufferRangeForScopeAtPosition(selector?, position)', () => {
    describe('when selector = null', () => {
      it('returns the range of the smallest node at position', async () => {
        const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        buffer.setText('foo({bar: baz});');

        let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expect(editor.bufferRangeForScopeAtPosition(null, [0, 6])).toEqual([
          [0, 5],
          [0, 8]
        ]);
        expect(editor.bufferRangeForScopeAtPosition(null, [0, 8])).toEqual([
          [0, 8],
          [0, 9]
        ]);
      });

      it('includes nodes in injected syntax trees', async () => {
        const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

        await jsGrammar.setQueryForTest('highlightsQuery', `
          (property_identifier) @property
        `);

        const htmlGrammar = new WASMTreeSitterGrammar(
          atom.grammars,
          htmlGrammarPath,
          htmlConfig
        );

        htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);

        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);

        buffer.setText(`
          <div>
            <script>
              html \`
                <span>\${person.name}</span>
              \`
            </script>
          </div>
        `);

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: htmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        const nameProperty = buffer.findSync('name');
        const { start } = nameProperty;
        const position = {
          ...start,
          column: start.column + 2
        };
        expect(
          languageMode.bufferRangeForScopeAtPosition(null, position)
        ).toEqual(nameProperty);
      });
    });

    describe('with a selector', () => {
      it('returns the range of the smallest matching node at position', async () => {
        const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        await grammar.setQueryForTest('highlightsQuery', `
          (property_identifier) @variable.other.object.property
          (template_string) @string.quoted.template
        `);

        buffer.setText('a(`${b({ccc: ddd})} eee`);');

        let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        expect(
          editor.bufferRangeForScopeAtPosition('.variable.property', [0, 9])
        ).toEqual([[0, 8], [0, 11]]);
        expect(
          editor.bufferRangeForScopeAtPosition('.string.quoted', [0, 6])
        ).toEqual([[0, 2], [0, 24]]);
      });

      it('includes nodes in injected syntax trees', async () => {
        const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);
        jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);
        await jsGrammar.setQueryForTest('highlightsQuery', `
          (property_identifier) @variable.other.object.property
        `);

        const htmlGrammar = new WASMTreeSitterGrammar(
          atom.grammars,
          htmlGrammarPath,
          htmlConfig
        );

        htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);
        await htmlGrammar.setQueryForTest('highlightsQuery', `
          (element) @meta.element.html
        `);

        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);

        buffer.setText(`
          <div>
            <script>
              html \`
                <span>\${person.name}</span>
              \`
            </script>
          </div>
        `);

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: htmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        const nameProperty = buffer.findSync('name');
        const { start } = nameProperty;
        const position = Object.assign({}, start, { column: start.column + 2 });
        expect(
          languageMode.bufferRangeForScopeAtPosition(
            '.object.property',
            position
          )
        ).toEqual(nameProperty);
        expect(
          languageMode.bufferRangeForScopeAtPosition(
            '.meta.element.html',
            position
          )
        ).toEqual(buffer.findSync('<span>\\${person\\.name}</span>'));
      });

      it('reports results correctly when scope ranges have been adjusted', async () => {
        jasmine.useRealClock();
        const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        await jsGrammar.setQueryForTest('highlightsQuery', `
          ((regex) @keyword.operator.optional
            (#set! adjust.startAndEndAroundFirstMatchOf "\\\\?"))
          (regex) @string.regexp.js
          ((comment) @comment.block.js)
          ((comment) @punctuation.definition.comment.begin.js
            (#set! adjust.endAfterFirstMatchOf "^/\\\\*"))
        `);

        atom.grammars.addGrammar(jsGrammar);

        buffer.setText(dedent`
          let foo = /patt?ern/;
          /* this is a block comment */
        `);

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: jsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        let range = languageMode.bufferRangeForScopeAtPosition('keyword', new Point(0, 15));
        expect(range.toString()).toBe(`[(0, 15) - (0, 16)]`);

        range = languageMode.bufferRangeForScopeAtPosition('punctuation', new Point(1, 0));
        expect(range.toString()).toBe(`[(1, 0) - (1, 2)]`);

        range = languageMode.bufferRangeForScopeAtPosition('comment.block', new Point(1, 0));
        expect(range.toString()).toBe(`[(1, 0) - (1, 29)]`);
      });

      it('ignores scopes that are not present because they are covered by a deeper layer', async () => {
        // A similar test to the one above, except now we expect not to see the
        // scope because it's being covered by the injection layer.
        jasmine.useRealClock();
        const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        let tempJsRegexConfig = {
          ...jsRegexConfig,
          injectionRegex: '^(js-regex-for-test)$'
        };

        const regexGrammar = new WASMTreeSitterGrammar(atom.grammars, jsRegexGrammarPath, tempJsRegexConfig);

        await regexGrammar.setQueryForTest('highlightsQuery', `
          (pattern) @string.regexp
        `);

        jsGrammar.addInjectionPoint({
          type: 'regex_pattern',
          language(regex) {
            return 'js-regex-for-test';
          },
          content(regex) {
            return regex;
          },
          languageScope: null,
          coverShallowerScopes: true
        });

        await jsGrammar.setQueryForTest('highlightsQuery', `
          ((regex) @keyword.operator.optional
            (#set! adjust.startAndEndAroundFirstMatchOf "\\\\?"))
          ((regex_pattern) @string.regexp.js)
        `);

        atom.grammars.addGrammar(regexGrammar);
        atom.grammars.addGrammar(jsGrammar);

        buffer.setText(dedent`
          let foo = /patt?ern/;
        `);

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: jsGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);

        await languageMode.ready;
        await wait(100);

        let point = new Point(0, 15);
        let range = languageMode.bufferRangeForScopeAtPosition('keyword', point);
        expect(range).toBe(undefined);
      });

      it('accepts node-matching functions as selectors', async () => {
        const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

        jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

        await jsGrammar.setQueryForTest('highlightsQuery', ';');

        const htmlGrammar = new WASMTreeSitterGrammar(
          atom.grammars,
          htmlGrammarPath,
          htmlConfig
        );

        htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);
        await htmlGrammar.setQueryForTest('highlightsQuery', ';');

        atom.grammars.addGrammar(jsGrammar);
        atom.grammars.addGrammar(htmlGrammar);

        buffer.setText(`
          <div>
            <script>
              html \`
                <span>\${person.name}</span>
              \`
            </script>
          </div>
        `);

        const languageMode = new WASMTreeSitterLanguageMode({
          grammar: htmlGrammar,
          buffer,
          config: atom.config,
          grammars: atom.grammars
        });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        const nameProperty = buffer.findSync('name');
        const { start } = nameProperty;
        const position = Object.assign({}, start, { column: start.column + 2 });
        const templateStringInCallExpression = node =>
          node.type === 'template_string' &&
          node.parent.type === 'call_expression';
        expect(
          languageMode.bufferRangeForScopeAtPosition(
            templateStringInCallExpression,
            position
          )
        ).toEqual([[3, 19], [5, 15]]);
      });
    });
  });

  describe('.getSyntaxNodeAtPosition(position, where?)', () => {
    it('returns the range of the smallest matching node at position', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      buffer.setText('foo(bar({x: 2}));');
      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      expect(
        languageMode.getSyntaxNodeAtPosition([0, 6]).range
      ).toEqual(
        buffer.findSync('bar')
      );

      const findFoo = node => (
        node.type === 'call_expression' &&
        node.firstChild.text === 'foo'
      );

      expect(
        languageMode.getSyntaxNodeAtPosition([0, 6], findFoo).range
      ).toEqual([[0, 0], [0, buffer.getText().length - 1]]);
    });
  });

  describe('.commentStringsForPosition(position)', () => {
    it('returns the correct comment strings for nested languages', async () => {
      jasmine.useRealClock();
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

      const htmlGrammar = new WASMTreeSitterGrammar(
        atom.grammars,
        htmlGrammarPath,
        htmlConfig
      );

      htmlGrammar.addInjectionPoint(SCRIPT_TAG_INJECTION_POINT);

      atom.grammars.addGrammar(jsGrammar);
      atom.grammars.addGrammar(htmlGrammar);

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: htmlGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      buffer.setText(
        `
<div>hi</div>
<script>
  const node = document.getElementById('some-id');
  node.innerHTML = html \`
    <span>bye</span>
  \`
</script>
      `.trim()
      );

      const htmlCommentStrings = {
        commentStartString: '<!-- ',
        commentEndString: ' -->'
      };
      const jsCommentStrings = {
        commentStartString: '// ',
        commentEndString: undefined
      };

      // Needs a short delay to allow injection grammars to be loaded.
      await languageMode.nextTransaction;

      expect(languageMode.commentStringsForPosition(new Point(0, 0))).toEqual(
        htmlCommentStrings
      );
      expect(languageMode.commentStringsForPosition(new Point(1, 0))).toEqual(
        htmlCommentStrings
      );
      expect(languageMode.commentStringsForPosition(new Point(2, 0))).toEqual(
        jsCommentStrings
      );
      expect(languageMode.commentStringsForPosition(new Point(3, 0))).toEqual(
        jsCommentStrings
      );
      expect(languageMode.commentStringsForPosition(new Point(4, 0))).toEqual(
        htmlCommentStrings
      );
      expect(languageMode.commentStringsForPosition(new Point(5, 0))).toEqual(
        jsCommentStrings
      );
      expect(languageMode.commentStringsForPosition(new Point(6, 0))).toEqual(
        htmlCommentStrings
      );
    });
  });

  describe('TextEditor.selectLargerSyntaxNode and .selectSmallerSyntaxNode', () => {
    it('expands and contracts the selection based on the syntax tree', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (program) @source
      `);

      // {
      //   parser: 'tree-sitter-javascript',
      //   scopes: { program: 'source' }
      // });

      buffer.setText(dedent`
        function a (b, c, d) {
          eee.f()
          g()
        }
      `);

      let languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      editor.setCursorBufferPosition([1, 3]);
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('eee');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('eee.f');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('eee.f()');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('{\n  eee.f()\n  g()\n}');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe(
        'function a (b, c, d) {\n  eee.f()\n  g()\n}'
      );

      editor.selectSmallerSyntaxNode();
      expect(editor.getSelectedText()).toBe('{\n  eee.f()\n  g()\n}');
      editor.selectSmallerSyntaxNode();
      expect(editor.getSelectedText()).toBe('eee.f()');
      editor.selectSmallerSyntaxNode();
      expect(editor.getSelectedText()).toBe('eee.f');
      editor.selectSmallerSyntaxNode();
      expect(editor.getSelectedText()).toBe('eee');
      editor.selectSmallerSyntaxNode();
      expect(editor.getSelectedBufferRange()).toEqual([[1, 3], [1, 3]]);
    });

    it('handles injected languages', async () => {
      const jsGrammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await jsGrammar.setQueryForTest('highlightsQuery', `
        (property_identifier) @property
        (call_expression (identifier) @function)
        (template_string) @string
        (template_substitution
          ["\${" "}"] @interpolation)
      `);

      jsGrammar.addInjectionPoint(HTML_TEMPLATE_LITERAL_INJECTION_POINT);

      const htmlGrammar = new WASMTreeSitterGrammar(
        atom.grammars,
        htmlGrammarPath,
        htmlConfig
      );
      await htmlGrammar.setQueryForTest('highlightsQuery', `
        (fragment) @html
        (tag_name) @tag
        (attribute_name) @attr
      `);

      atom.grammars.addGrammar(htmlGrammar);

      buffer.setText('a = html ` <b>c${def()}e${f}g</b> `');
      const languageMode = new WASMTreeSitterLanguageMode({
        grammar: jsGrammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      editor.setCursorBufferPosition({
        row: 0,
        column: buffer.getText().indexOf('ef()')
      });
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('def');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('def()');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('${def()}');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('c${def()}e${f}g');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('<b>c${def()}e${f}g</b>');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('<b>c${def()}e${f}g</b> ');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('` <b>c${def()}e${f}g</b> `');
      editor.selectLargerSyntaxNode();
      expect(editor.getSelectedText()).toBe('html ` <b>c${def()}e${f}g</b> `');
    });
  });

  describe('.tokenizedLineForRow(row)', () => {
    it('returns a shimmed TokenizedLine with tokens', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('highlightsQuery', `
        (program) @source

        (call_expression
          (member_expression
            (property_identifier) @method)
            (#set! capture.final true))

        (call_expression
            (identifier) @function
            (#set! capture.final true))

        ((property_identifier) @property
          (#set! capture.final true))
        (identifier) @variable
      `);

      buffer.setText('aa.bbb = cc(d.eee());\n\n    \n  b');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      let streamlinedTokenizedRows = [];
      for (let i = 0; i < 4; i++) {
        let tokenizedRow = languageMode.tokenizedLineForRow(i).tokens;
        for (let { scopes } of tokenizedRow) {
          if (scopes[0] === 'source.js') {
            scopes.shift();
          }
        }
        streamlinedTokenizedRows.push(tokenizedRow);
      }

      expect(streamlinedTokenizedRows[0]).toEqual([
        { value: 'aa', scopes: ['source', 'variable'] },
        { value: '.', scopes: ['source'] },
        { value: 'bbb', scopes: ['source', 'property'] },
        { value: ' = ', scopes: ['source'] },
        { value: 'cc', scopes: ['source', 'function'] },
        { value: '(', scopes: ['source'] },
        { value: 'd', scopes: ['source', 'variable'] },
        { value: '.', scopes: ['source'] },
        { value: 'eee', scopes: ['source', 'method'] },
        { value: '());', scopes: ['source'] }
      ]);
      expect(streamlinedTokenizedRows[1]).toEqual([]);
      expect(streamlinedTokenizedRows[2]).toEqual([
        { value: '    ', scopes: ['source'] }
      ]);
      expect(streamlinedTokenizedRows[3]).toEqual([
        { value: '  ', scopes: ['source'] },
        { value: 'b', scopes: ['source', 'variable'] }
      ]);
    });
  });

  describe('indentation', () => {
    beforeEach(async () => {
      await atom.packages.activatePackage('whitespace');
      atom.config.set('whitespace.removeTrailingWhitespace', false);
    });

    it('interprets @indent and @dedent captures', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('indentsQuery', `
        "if" @indent
        "else" @dedent
      `);

      const originalText = 'if (foo)';
      buffer.setText(originalText);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      editor.setCursorBufferPosition([0, 8]);
      editor.insertText('\n', { autoIndent: true, autoIndentNewline: true });
      await new Promise(process.nextTick);

      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(1, 2)');

      editor.insertText(
        'console.log("bar");\n',
        { autoIndent: true, autoIndentNewline: true }
      );

      editor.insertText('else', { autoIndent: true });
      await new Promise(process.nextTick);

      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(2, 4)');

      editor.undo();
      editor.undo();
      editor.undo();

      expect(buffer.getText()).toEqual(originalText);
    });

    it('allows @dedents to cancel out @indents when appropriate', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('indentsQuery', `
        "{" @indent
        "}" @dedent
      `);

      buffer.setText('if (foo) { bar(); }');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      // await wait(0);

      editor.setCursorBufferPosition([0, 19]);
      editor.insertText('\n', { autoIndentNewline: true });
      await wait(0);
      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(1, 0)');

      // a } that comes before a { should not cancel it out.
      buffer.setText('} else if (foo) {');
      editor.setCursorBufferPosition([0, 17]);
      await wait(0);
      editor.insertText('\n', { autoIndent: true, autoIndentNewline: true });
      await wait(0);

      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(1, 2)');
    });

    it('allows @dedent.next to decrease the indent of the next line before any typing takes place', async () => {
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      // Pretend we're in a universe where lines after comments should be
      // dedented.
      await grammar.setQueryForTest('indentsQuery', `
        (comment) @dedent.next
      `);

      buffer.setText('  // lorem ipsum');

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      editor.setCursorBufferPosition([0, 14]);
      editor.insertText('\n', { autoIndentNewline: true });
      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(1, 0)');
    });

    it('resolves @match captures', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('indentsQuery', `
        (template_string
          "\`" @match
          (#is? test.last true)
          (#set! indent.matchIndentOf parent.firstChild.startPosition))
      `);

      buffer.setText(dedent`
        \`
                  this is a ridiculous amount of indentation
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.setCursorBufferPosition([1, 52]);
      editor.getLastCursor().moveToEndOfLine();
      editor.insertText('\n', { autoDecreaseIndent: true, autoIndentNewline: true });
      await wait(0);
      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(2, 10)');

      editor.insertText('`', { autoIndent: true, autoDecreaseIndent: true });
      await wait(0);
      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(2, 1)');
    });

    it('prefers a @match capture even if a @dedent matches first', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('indentsQuery', `
        (template_string
          "\`" @dedent @match
          (#is? test.last true)
          (#set! indent.matchIndentOf parent.firstChild.startPosition))
      `);

      buffer.setText(dedent`
        \`
                  this is a ridiculous amount of indentation
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.setCursorBufferPosition([1, 52]);
      editor.getLastCursor().moveToEndOfLine();
      editor.insertText('\n', { autoDecreaseIndent: true, autoIndentNewline: true });
      await wait(0);
      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(2, 10)');

      editor.insertText('`', { autoIndent: true, autoDecreaseIndent: true });
      await wait(0);
      expect(
        editor.getLastCursor().getBufferPosition().toString()
      ).toEqual('(2, 1)');
    });

    it('adjusts correctly when text is pasted', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      expect(editor.getUndoGroupingInterval()).toBe(300);

      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
      `);

      let textToPaste = `// this is a comment\n// and this is another`;
      buffer.setText(textToPaste);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });

      // Don't rely on this method to give us an accurate answer.
      spyOn(
        languageMode,
        'suggestedIndentForLineAtBufferRow'
      ).andReturn(9);

      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.selectAll();
      editor.cutSelectedText();

      let emptyClassText = dedent`
        class Example {

        }
      `;

      buffer.setText(emptyClassText);
      await wait(0);

      editor.setCursorBufferPosition([1, 2]);
      editor.pasteText({ autoIndent: true });
      await wait(0);

      expect(editor.lineTextForBufferRow(1)).toEqual(
        `  // this is a comment`
      );

      expect(editor.lineTextForBufferRow(2)).toEqual(
        `  // and this is another`
      );

      editor.undo();
      await wait(0);

      expect(editor.getText()).toEqual(emptyClassText);
    });

    it('skips trying to insert at the correct indentation level when "paste without formatting" is invoked', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      expect(editor.getUndoGroupingInterval()).toBe(300);

      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
      `);

      let textToPaste = `// this is a comment\n  // and this is another`;
      buffer.setText(textToPaste);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });

      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.selectAll();
      editor.cutSelectedText();

      let emptyClassText = dedent`
        class Example {

        }
      `;

      buffer.setText(emptyClassText);
      await wait(0);

      editor.setCursorBufferPosition([1, 0]);
      // These are the same options used by the
      // `editor:paste-without-reformatting` command.
      editor.pasteText({
        normalizeLineEndings: false,
        autoIndent: false,
        preserveTrailingLineIndentation: true
      });
      await wait(0);

      expect(editor.lineTextForBufferRow(1)).toEqual(
        `// this is a comment`
      );

      expect(editor.lineTextForBufferRow(2)).toEqual(
        `  // and this is another`
      );

      editor.undo();
      await wait(0);

      expect(editor.getText()).toEqual(emptyClassText);
    });


    it('preserves relative indentation across pasted text', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      expect(editor.getUndoGroupingInterval()).toBe(300);

      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
      `);

      let textToPaste = `// this is a comment\n  // and this is another`;
      buffer.setText(textToPaste);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });

      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.selectAll();
      editor.cutSelectedText();

      let emptyClassText = dedent`
        class Example {

        }
      `;

      buffer.setText(emptyClassText);
      await wait(0);

      editor.setCursorBufferPosition([1, 0]);
      editor.pasteText({ autoIndent: true });
      await wait(0);

      expect(editor.lineTextForBufferRow(1)).toEqual(
        `  // this is a comment`
      );

      expect(editor.lineTextForBufferRow(2)).toEqual(
        `    // and this is another`
      );

      expect(editor.lineTextForBufferRow(3)).toEqual(
        `}`
      );

      editor.undo();
      await wait(0);

      expect(editor.getText()).toEqual(emptyClassText);
    });

    it('preserves relative indentation across pasted text (when the pasted text ends in a newline)', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      expect(editor.getUndoGroupingInterval()).toBe(300);

      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
      `);

      let textToPaste = `// this is a comment\n  // and this is another\n`;
      buffer.setText(textToPaste);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });

      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.selectAll();
      editor.cutSelectedText();

      let emptyClassText = dedent`
        class Example {
        }
      `;

      buffer.setText(emptyClassText);
      await wait(0);

      editor.setCursorBufferPosition([1, 0]);
      editor.pasteText({ autoIndent: true });
      await wait(0);

      expect(editor.lineTextForBufferRow(1)).toEqual(
        `  // this is a comment`
      );

      expect(editor.lineTextForBufferRow(2)).toEqual(
        `    // and this is another`
      );

      expect(editor.lineTextForBufferRow(3)).toEqual(
        `}`
      );

      editor.undo();
      await wait(0);

      expect(editor.getText()).toEqual(emptyClassText);
    });

    // This test is known to fail (and expected to fail) without async-indent enabled.
    it('auto-indents correctly if any change in a transaction wants auto-indentation', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);
      editor.updateAutoIndent(true);

      // Pretend we're in a universe where a line comment should cause the next
      // line to be indented, but only in a class body.
      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
        ((comment) @indent
          (#is? test.descendantOfType class_body))
      `);

      let emptyClassText = dedent`
        class Example {

        }
      `;

      buffer.setText(emptyClassText);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.setCursorBufferPosition([1, 0]);
      editor.transact(() => {
        editor.insertText('// this is a comment', { autoIndent: true });
        editor.insertNewline();
        editor.insertText('// and this is another', { autoIndent: true });
        editor.insertNewline();
      });

      await wait(0);

      expect(editor.lineTextForBufferRow(1)).toEqual(
        `  // this is a comment`
      );

      expect(editor.lineTextForBufferRow(2)).toEqual(
        `    // and this is another`
      );

      editor.undo();
      await wait(0);

      expect(editor.getText()).toEqual(emptyClassText);
    });

    it('does not auto-indent if no change in a transaction wants auto-indentation', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      // Pretend we're in a universe where a line comment should cause the next
      // line to be indented, but only in a class body.
      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
        ((comment) @indent
          (#is? test.descendantOfType class_body))
      `);

      let emptyClassText = dedent`
        class Example {

        }
      `;

      buffer.setText(emptyClassText);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.setCursorBufferPosition([1, 0]);
      editor.transact(() => {
        editor.insertText('// this is a comment', { autoIndent: false });
        editor.insertNewline();
        editor.insertText('// and this is another', { autoIndent: false });
        editor.insertNewline();
      });
      await wait(0);

      expect(editor.lineTextForBufferRow(1)).toEqual(
        `// this is a comment`
      );

      expect(editor.lineTextForBufferRow(2)).toEqual(
        `// and this is another`
      );

      editor.undo();
      await wait(0);

      expect(editor.getText()).toEqual(emptyClassText);
    });

    it('auto-dedents exactly once and not after each new insertion on a line', async () => {
      jasmine.useRealClock();
      editor.updateAutoIndent(true);
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);
      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
      `);

      let emptyClassText = dedent`
        class Example {
          if (foo) {

        }
      `;

      buffer.setText(emptyClassText);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);
      editor.setCursorBufferPosition([2, 0]);
      editor.insertText('    ');
      await wait(0);
      editor.insertText('}', { autoIndent: true });

      await languageMode.atTransactionEnd();
      await wait(0);
      expect(editor.lineTextForBufferRow(2)).toEqual(`  }`);

      editor.indentSelectedRows();
      editor.insertText(' ', { autoIndent: true });
      await languageMode.atTransactionEnd();
      expect(editor.lineTextForBufferRow(2)).toEqual(`    } `);
    });

    it('maintains indent level through multiple newlines (removeTrailingWhitespace: true)', async () => {
      jasmine.useRealClock();
      editor.updateAutoIndent(true);
      atom.config.set('whitespace.removeTrailingWhitespace', true);
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
      `);

        let emptyClassText = dedent`
          class Example {

          }
        `;

        buffer.setText(emptyClassText);

        const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        editor.setCursorBufferPosition([1, 0]);
        editor.indent();
        await languageMode.atTransactionEnd();
        editor.insertText('// this is a comment', { autoIndent: true });
        await languageMode.atTransactionEnd();
        expect(editor.lineTextForBufferRow(1)).toEqual('  // this is a comment');

        editor.insertNewline();
        await languageMode.atTransactionEnd();
        await wait(0);
        expect(editor.lineTextForBufferRow(2)).toEqual('  ');

        editor.insertNewline();
        await languageMode.atTransactionEnd();
        await wait(0);
        expect(editor.lineTextForBufferRow(3)).toEqual('  ');

        editor.insertNewline();
        await languageMode.atTransactionEnd();
        await wait(0);
        expect(editor.lineTextForBufferRow(4)).toEqual('  ');
    });

    it('does not attempt to adjust indent on pasted text without a newline', async () => {
      jasmine.useRealClock();
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      expect(editor.getUndoGroupingInterval()).toBe(300);

      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
      `);

      // let textToPaste = `// this is a comment\n  // and this is another`;
      let textToPaste = `a comment`;
      buffer.setText(textToPaste);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });

      buffer.setLanguageMode(languageMode);
      await languageMode.ready;
      await wait(0);

      editor.selectAll();
      editor.cutSelectedText();

      let emptyClassText = dedent`
        class Example {
              // this is…
        }
      `;

      buffer.setText(emptyClassText);
      await wait(0);

      editor.setCursorBufferPosition([1, 18]);
      editor.pasteText({ autoIndent: true });
      await wait(0);

      expect(editor.lineTextForBufferRow(1)).toEqual(
        `      // this is…a comment`
      );

      editor.undo();
      await wait(0);

      expect(editor.getText()).toEqual(emptyClassText);
    });

    it('maintains indent level through multiple newlines (removeTrailingWhitespace: false)', async () => {
      jasmine.useRealClock();
      editor.updateAutoIndent(true);
      atom.config.set('whitespace.removeTrailingWhitespace', false);
      const grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);

      await grammar.setQueryForTest('indentsQuery', `
        ["{"] @indent
        ["}"] @dedent
        `);

        let emptyClassText = dedent`
        class Example {

        }
        `;

        buffer.setText(emptyClassText);

        const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
        buffer.setLanguageMode(languageMode);
        await languageMode.ready;

        editor.setCursorBufferPosition([1, 0]);
        editor.indent();
        await languageMode.atTransactionEnd();
        editor.insertText('// this is a comment', { autoIndent: true });
        await languageMode.atTransactionEnd();
        expect(editor.lineTextForBufferRow(1)).toEqual('  // this is a comment');

        editor.insertNewline();
        await languageMode.atTransactionEnd();
        await wait(0);
        expect(editor.lineTextForBufferRow(2)).toEqual('  ');

        editor.insertNewline();
        await languageMode.atTransactionEnd();
        await wait(0);
        expect(editor.lineTextForBufferRow(3)).toEqual('  ');

        editor.insertNewline();
        await languageMode.atTransactionEnd();
        await wait(0);
        expect(editor.lineTextForBufferRow(4)).toEqual('  ');
    });

  });
});

async function nextHighlightingUpdate(languageMode) {
  return await languageMode.atTransactionEnd();
}

// function nextHighlightingUpdate(languageMode) {
//   return new Promise(resolve => {
//     const subscription = languageMode.onDidChangeHighlighting(() => {
//       subscription.dispose();
//       resolve();
//     });
//   });
// }

function getDisplayText(editor) {
  return editor.displayLayer.getText();
}

function expectTokensToEqual(editor, expectedTokenLines) {
  const lastRow = editor.getLastScreenRow();

  let baseScope = editor.getBuffer().getLanguageMode().grammar.scopeName;
  let languageMode = editor.getBuffer().getLanguageMode();
  let layers = languageMode.getAllLanguageLayers();
  let baseScopeClasses = new Set();

  // Ignore the base scope applied within each language layer.
  for (let layer of layers) {
    let grammar = layer.grammar;
    if (!grammar) { continue; }
    let scopeClass = layer.grammar.scopeName
      .split('.')
      .map(p => `syntax--${p}`)
      .join(' ');
    baseScopeClasses.add(scopeClass);
  }

  // Assert that the correct tokens are returned regardless of which row
  // the highlighting iterator starts on.
  for (let startRow = 0; startRow <= lastRow; startRow++) {
    // Clear the screen line cache between iterations, but not on the first
    // iteration, so that the first iteration tests that the cache has been
    // correctly invalidated by any changes.
    if (startRow > 0) {
      editor.displayLayer.clearSpatialIndex();
    }

    editor.displayLayer.getScreenLines(startRow, Infinity);

    const tokenLines = [];
    for (let row = startRow; row <= lastRow; row++) {
      let lineTokens = editor.tokensForScreenRow(row);
      let result = [];

      for (let token of lineTokens) {
        let { text, scopes: rawScopes } = token;
        let scopes = [];
        for (let scope of rawScopes) {
          if (baseScopeClasses.has(scope)) { continue; }
          scopes.push(
            scope
              .split(' ')
              .map(c => c.replace('syntax--', ''))
              .join(' ')
          );
        }
        result.push({ text, scopes });
      }
      tokenLines[row] = result;
    }

    // console.log('EXPECTED:', expectedTokenLines);
    // console.log('ACTUAL:', tokenLines);

    for (let row = startRow; row <= lastRow; row++) {
      const tokenLine = tokenLines[row];
      const expectedTokenLine = expectedTokenLines[row];

      for (let i = 0; i < tokenLine.length; i++) {
        let line = tokenLine[i], expectedLine = expectedTokenLine[i];
        expect(tokenLine[i]).toEqual(
          expectedTokenLine[i],
          `Token ${i}, row: ${row}, startRow: ${startRow}`
        );
      }
    }
  }

  // Fully populate the screen line cache again so that cache invalidation
  // due to subsequent edits can be tested.
  editor.displayLayer.getScreenLines(0, Infinity);
}

const HTML_TEMPLATE_LITERAL_INJECTION_POINT = {
  type: 'call_expression',
  language(node) {
    if (
      node.lastChild?.type === 'template_string' &&
      node.firstChild?.type === 'identifier'
    ) {
      return node.firstChild?.text;
    }
  },
  content(node) {
    return node?.lastChild;
  }
};

const SCRIPT_TAG_INJECTION_POINT = {
  type: 'script_element',
  language() {
    return 'javascript';
  },
  content(node) {
    return node?.child(1);
  }
};

const JSDOC_INJECTION_POINT = {
  type: 'comment',
  language(comment) {
    if (comment.text?.startsWith('/**')) return 'jsdoc';
  },
  content(comment) {
    return comment;
  }
};
