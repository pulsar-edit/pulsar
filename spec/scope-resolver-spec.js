const fs = require('fs');
const path = require('path');
const dedent = require('dedent');
const TextBuffer = require('text-buffer');
const { Point, Range } = TextBuffer;
const CSON = require('season');
const TextEditor = require('../src/text-editor');
const ScopeResolver = require('../src/scope-resolver.js');
const WASMTreeSitterGrammar = require('../src/wasm-tree-sitter-grammar');
const WASMTreeSitterLanguageMode = require('../src/wasm-tree-sitter-language-mode');
const Random = require('random-seed');
const { getRandomBufferRange, buildRandomLines } = require('./helpers/random');

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let PATH = path.resolve( path.join(__dirname, '..', 'packages') );
function resolve(modulePath) {
  return require.resolve(`${PATH}/${modulePath}`)
}

const jsGrammarPath = resolve(
  'language-javascript/grammars/tree-sitter-2-javascript.cson'
);
let jsConfig = CSON.readFileSync(jsGrammarPath);

const jsRegexGrammarPath = resolve(
  'language-javascript/grammars/tree-sitter-2-regex.cson'
);
let jsRegexConfig = CSON.readFileSync(jsRegexGrammarPath);

async function getAllCaptures(grammar, languageMode, layer = null) {
  let query = await grammar.getQuery('highlightsQuery');
  layer = layer ?? languageMode.rootLanguageLayer;
  let scopeResolver = new ScopeResolver(
    layer,
    (name) => languageMode.idForScope(name),
  );
  let { start, end } = languageMode.buffer.getRange();
  let { tree } = layer;
  return {
    captures: query.captures(tree.rootNode, start, end),
    scopeResolver
  };
}

async function getAllMatches(...args) {
  let { captures, scopeResolver } = await getAllCaptures(...args);
  let matches = [];
  for (let capture of captures) {
    let range = scopeResolver.store(capture);
    if (range) {
      matches.push(capture);
    }
  }
  return matches;
}

function stringForNodeRange(node) {
  return `${node.startIndex}-${node.endIndex}`;
}

function rangeFromDescriptor(rawRange) {
  let { startPosition, endPosition } = rawRange;
  let start = Point.fromObject(startPosition, true);
  let end = Point.fromObject(endPosition, true);
  return new Range(start, end);
}

describe('ScopeResolver', () => {
  let editor, buffer, grammar, scopeResolver;

  beforeEach(async () => {
    grammar = new WASMTreeSitterGrammar(atom.grammars, jsGrammarPath, jsConfig);
    editor = await atom.workspace.open('');
    buffer = editor.getBuffer();
    atom.grammars.addGrammar(grammar);
    atom.config.set('core.useTreeSitterParsers', true);
    atom.config.set('core.useExperimentalModernTreeSitter', true);
  });

  it('resolves all scopes in absence of any tests or adjustments', async () => {
    await grammar.setQueryForTest('highlightsQuery', `
      (comment) @comment
      (string) @string
      "=" @operator
    `);

    const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
    buffer.setLanguageMode(languageMode);
    buffer.setText(dedent`
      // this is a comment
      const foo = "ahaha";
    `);
    await languageMode.ready;

    let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

    for (let capture of captures) {
      let { node, name } = capture;
      let range = scopeResolver.store(capture);
      expect(stringForNodeRange(range))
        .toBe(stringForNodeRange(node));
    }
  });

  it('interpolates magic tokens in scope names', async () => {
    await grammar.setQueryForTest('highlightsQuery', `
      (lexical_declaration kind: _ @declaration._TYPE_)
    `);

    const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
    buffer.setLanguageMode(languageMode);
    buffer.setText(dedent`
      // this is a comment
      const foo = "ahaha";
      let bar = 'troz'
    `);
    await languageMode.ready;

    let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

    let names = captures.map(({ name, node }) => {
      return ScopeResolver.interpolateName(name, node)
    });
    names.sort();

    expect(names).toEqual([
      'declaration.const',
      'declaration.let'
    ]);
  });

  describe('adjustments', () => {
    it('adjusts ranges with (#set! adjust.startAt)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
      ((try_statement) @try.plus.brace
        (#set! adjust.endAt
          firstChild.nextSibling.firstChild.endPosition))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        try { x++ } catch (e) {}
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let capture = captures[0];
      let range = scopeResolver.store(capture);

      expect(buffer.getTextInRange(rangeFromDescriptor(range)))
        .toBe('try {');
    });

    it('adjusts ranges with (#set! adjust.endAt)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((object) @object.interior
          (#set! adjust.startAt firstChild.endPosition)
          (#set! adjust.endAt lastChild.startPosition))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        {from: 'x', to: 'y'}
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);


      let capture = captures[0];
      let range = scopeResolver.store(capture);

      expect(
        buffer.getTextInRange(rangeFromDescriptor(range))
      ).toBe(`from: 'x', to: 'y'`);
    });

    it('adjusts ranges with (#set! adjust.offset(Start|End))', async () => {
      // Same result as the previous test, but with a different technique.
      await grammar.setQueryForTest('highlightsQuery', `
        ((object) @object.interior
          (#set! adjust.offsetStart 1)
          (#set! adjust.offsetEnd -1))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        {from: 'x', to: 'y'}
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let capture = captures[0];
      let range = scopeResolver.store(capture);

      expect(
        buffer.getTextInRange(rangeFromDescriptor(range))
      ).toBe(`from: 'x', to: 'y'`);
    });

    it('prevents adjustments outside the original capture', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((comment) @too-early
          (#set! adjust.startAt previousSibling.startPosition))
        ((comment) @too-late
          (#set! adjust.endAt nextSibling.endPosition))
        ((comment) @offset-too-early
          (#set! adjust.offsetStart -10))
        ((comment) @offset-too-late
          (#set! adjust.offsetEnd 10))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        let foo = "this is a line above a comment"
        // this is a comment that wants to fly too close to the sun
        let bar = "this is a line below a comment"
      `);
      // Prevent an exception from being thrown before we can even check the
      // scopeResolver.
      spyOn(languageMode, 'isRowCommented').andReturn(false);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      for (let capture of captures) {
        expect(() => {
          scopeResolver.store(capture);
        }).toThrow();
      }
    });

    it("adjusts a range around a regex match with `adjust.startAndEndAroundFirstMatchOf`", async () => {
      await grammar.setQueryForTest('highlightsQuery', `
      ((comment) @todo
        (#set! adjust.startAndEndAroundFirstMatchOf "\\\\sTODO(?=:)"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // TODO: Do something
        // TODO (don't actually do it)
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let capture = captures[0];
      let range = scopeResolver.store(capture);

      let matched = [];
      for (let capture of captures) {
        range = scopeResolver.store(capture);
        if (range) { matched.push(range); }
      }

      expect(matched.length).toBe(1);

      expect(
        buffer.getTextInRange(rangeFromDescriptor(matched[0]))
      ).toBe(` TODO`);
    });
  });

  describe('tests', () => {

    it('rejects scopes for ranges that have already been claimed by another capture with (#set! capture.final true)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string) @string0
        ((string) @string1
          (#set! capture.final true))

        (string) @string2
        "=" @operator
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // this is a comment
        const foo = "ahaha";
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      for (let capture of captures) {
        let { node, name } = capture;
        let result = scopeResolver.store(capture);
        if (name === 'string0') {
          expect(!!result).toBe(true);
        }
        if (name === 'string1') {
          expect(!!result).toBe(true);
        }
        if (name === 'string2') {
          expect(!!result).toBe(false);
        }
      }
    });

    it('temporarily supports the deprecated (#set! test.final true)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string) @string0
        ((string) @string1
          (#set! test.final true))

        (string) @string2
        "=" @operator
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // this is a comment
        const foo = "ahaha";
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      for (let capture of captures) {
        let { node, name } = capture;
        let result = scopeResolver.store(capture);
        if (name === 'string0') {
          expect(!!result).toBe(true);
        }
        if (name === 'string1') {
          expect(!!result).toBe(true);
        }
        if (name === 'string2') {
          expect(!!result).toBe(false);
        }
      }
    });

    it('rejects scopes for ranges that have already been claimed by another capture with (#set! capture.final true)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string) @string0
        ((string) @string1
        (#set! capture.final true))

        (string) @string2
        "=" @operator
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // this is a comment
        const foo = "ahaha";
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      for (let capture of captures) {
        let { node, name } = capture;
        let result = scopeResolver.store(capture);
        if (name === 'string0') {
          expect(!!result).toBe(true);
        }
        if (name === 'string1') {
          expect(!!result).toBe(true);
        }
        if (name === 'string2') {
          expect(!!result).toBe(false);
        }
      }
    });

    it('rejects scopes for ranges that have already been claimed if set with (#set! capture.shy true)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string "\\"") @string.double
        ((string) @string.other (#set! capture.shy true))
        "=" @operator
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // this is a comment
        const foo = "ahaha";
        const bar = 'troz'
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let first = true;
      for (let capture of captures) {
        let { node, name } = capture;
        let result = scopeResolver.store(capture);
        // First string.other should fail; second should succeed.
        if (name === 'string.other') {
          let expected = first ? false : true;
          first = false;
          expect(!!result).toBe(expected);
        }
      }
    });

    it('temporarily supports the deprecated (#set! test.shy true)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string "\\"") @string.double
        ((string) @string.other (#set! test.shy true))
        "=" @operator
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // this is a comment
        const foo = "ahaha";
        const bar = 'troz'
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let first = true;
      for (let capture of captures) {
        let { node, name } = capture;
        let result = scopeResolver.store(capture);
        // First string.other should fail; second should succeed.
        if (name === 'string.other') {
          let expected = first ? false : true;
          first = false;
          expect(!!result).toBe(expected);
        }
      }
    });

    it('rejects scopes for ranges that fail test.first or test.last', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((string_fragment) @impossible.first
          (#is? test.first true))
        ((string_fragment) @impossible.last
          (#is? test.last true))
        ((string) "'" @punctuation.first
          (#is? test.first true))
        ((string) "'" @punctuation.last
          (#is? test.last true))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // this is a comment
        const foo = "ahaha";
        const bar = 'troz'
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      for (let capture of captures) {
        let { node, name } = capture;
        let result = scopeResolver.store(capture);
        // Impossible for string_fragment to be the first or last child.
        if (name.startsWith('impossible')) {
          expect(!!result).toBe(false);
        }

        if (name === 'punctuation.first') {
          expect(node.id).toBe(node.parent.lastChild.id);
        } else if (name === 'punctuation.last') {
          expect(node.id).toBe(node.parent.firstChild.id);
        }
      }
    });

    it('temporarily supports the deprecated (#set! test.onlyIfFirst) and (#set! test.onlyIfLast)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((string_fragment) @impossible.first
          (#is? test.onlyIfFirst true))
        ((string_fragment) @impossible.last
          (#is? test.onlyIfLast true))
        ((string) "'" @punctuation.first
          (#is? test.onlyIfFirst true))
        ((string) "'" @punctuation.last
          (#is? test.onlyIfLast true))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        // this is a comment
        const foo = "ahaha";
        const bar = 'troz'
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      for (let capture of captures) {
        let { node, name } = capture;
        let result = scopeResolver.store(capture);
        // Impossible for string_fragment to be the first or last child.
        if (name.startsWith('impossible')) {
          expect(!!result).toBe(false);
        }

        if (name === 'punctuation.first') {
          expect(node.id).toBe(node.parent.lastChild.id);
        } else if (name === 'punctuation.last') {
          expect(node.id).toBe(node.parent.firstChild.id);
        }
      }
    });

    it('supports test.firstOfType and test.lastOfType', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (formal_parameters (identifier) @first-param
          (#is? test.firstOfType identifier))
        (formal_parameters (identifier) @last-param
          (#is? test.lastOfType identifier))

        (formal_parameters "," @first-comma
          (#is? test.firstOfType ","))
        (formal_parameters "," @last-comma
          (#is? test.lastOfType ","))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud, troz) {}
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let matched = [];
      for (let capture of captures) {
        let range = scopeResolver.store(capture);
        if (range) { matched.push([capture, range]); }
      }

      expect(matched.length).toBe(4);

      expect(matched.map(pair => {
        return pair[0].name;
      })).toEqual(["first-param", "first-comma", "last-comma", "last-param"]);
    });

    it('supports test.lastTextOnRow', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("||" @hanging-logical-operator
          (#is? test.lastTextOnRow true))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        let x = foo ||
          bar;

        let y = foo || bar;
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let matched = [];
      for (let capture of captures) {
        let range = scopeResolver.store(capture);
        if (range) { matched.push(capture); }
      }

      expect(matched.length).toBe(1);
      expect(matched[0].node.startPosition.row).toBe(0);

      expect(matched.map(capture => capture.name)).toEqual(
        ["hanging-logical-operator"]);
    });

    it('supports test.firstTextOnRow', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("||" @hanging-logical-operator
          (#is? test.firstTextOnRow true))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        let x = foo
          || bar;

        let y = foo || bar;
      `);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      let matched = [];
      for (let capture of captures) {
        let range = scopeResolver.store(capture);
        if (range) { matched.push(capture); }
      }

      expect(matched.length).toBe(1);
      expect(matched[0].node.startPosition.row).toBe(1);

      expect(matched.map(capture => capture.name)).toEqual(
        ["hanging-logical-operator"]);
    });

    it('supports test.descendantOfType', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("," @comma-inside-function
          (#is? test.descendantOfType function_declaration))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        let foo, bar, baz;
        function foo (one, two, three) {}
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(2);
      expect(matched.every(cap => {
        return cap.node.startPosition.row === 1;
      })).toBe(true);
    });

    it('supports test.descendantOfType (multiple values)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("," @comma-inside-function
          (#is? test.descendantOfType "function_declaration generator_function_declaration"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        let foo, bar, baz;
        function foo (one, two, three) {}
        function* bar(one, two, three) {}
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(4);
      expect(matched.every((cap, index) => {
        let expectedRow = index >= 2 ? 2 : 1;
        return cap.node.startPosition.row === expectedRow;
      })).toBe(true);
    });


    it('supports test.ancestorOfType', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @function-with-semicolons
          (#is? test.ancestorOfType ";"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo () {}
        function bar () {
          console.log(false);
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(1);
      expect(matched[0].node.text.includes("function bar")).toBe(true);
    });

    it('supports test.ancestorOfType (multiple values)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @function-with-semicolons-or-booleans
          (#is? test.ancestorOfType "; false"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo () {}
        function bar () {
          console.log(false);
        }
        function baz () {
          console.log(false)
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(2);
      expect(matched[0].node.text.includes("function ba")).toBe(true);
      expect(matched[1].node.text.includes("function ba")).toBe(true);
    });

    it('supports test.descendantOfNodeWithData (without value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @_IGNORE_
          (#match? @_IGNORE_ "foo")
          (#set! isSpecialFunction true))

        ("," @special-comma
          (#is? test.descendantOfNodeWithData isSpecialFunction))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {}
        function bar (lorem, ipsum, dolor) {}
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(2);
      expect(matched.every(cap => {
        return cap.node.startPosition.row === 0 &&
          cap.node.text === ",";
      })).toBe(true);
    });

    it('supports test.descendantOfNodeWithData (with right value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @_IGNORE_
          (#match? @_IGNORE_ "foo" )
          (#set! isSpecialFunction "troz"))

        ("," @special-comma
          (#is? test.descendantOfNodeWithData "isSpecialFunction troz"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {}
        function bar (lorem, ipsum, dolor) {}
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(2);
      expect(matched.every(cap => {
        return cap.node.startPosition.row === 0 &&
          cap.node.text === ",";
      })).toBe(true);
    });

    it('supports test.descendantOfNodeWithData (with wrong value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @_IGNORE_
          (#match? @_IGNORE_ "foo")
          (#set! isSpecialFunction "troz"))

        ("," @special-comma
          (#is? test.descendantOfNodeWithData "isSpecialFunction zort"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {}
        function bar (lorem, ipsum, dolor) {}
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      // Wrong value, so test shouldn't pass.
      expect(matched.length).toBe(0);
    });

    it('supports test.type', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (formal_parameters _ @function-comma
          (#is? test.type ","))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {}
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(2);
      expect(matched.every(cap => {
        return cap.node.text === ",";
      })).toBe(true);
    });

    it('supports test.type with multiple types', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (formal_parameters _ @thing
          (#is? test.type ", identifier"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {}
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(5);
    });

    it('supports test.hasError', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((statement_block) @messed-up-statement-block
          (#is? test.hasError true))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if !troz zort();
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(1);
      expect(matched.every(cap => {
        return cap.name === 'messed-up-statement-block' && cap.node.hasError();
      })).toBe(true);
    });

    it('supports test.root', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((_) @is-root
          (#is? test.root true))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (!troz) { zort(); }
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(1);
      expect(matched.every(cap => {
        return cap.name === 'is-root' && cap.node.type === 'program' &&
          !cap.node.parent;
      })).toBe(true);
    });

    it('supports test.lastTextOnRow', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("||" @orphaned-operator
          (#is? test.lastTextOnRow true))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true ||
            false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(1);
      for (let cap of matched) {
        expect(cap.name).toBe('orphaned-operator');
        expect(cap.node.type).toBe('||');
        expect(cap.node.startPosition.row).toBe(2);
      }
    });

    it('supports test.rangeWithData (without value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @_IGNORE_ (#set! isTrue true))
        ([ (true) (false) ] @optimistic-boolean
          (#is? test.rangeWithData isTrue))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true || false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(2);
      for (let cap of matched) {
        expect(cap.name).toBe('optimistic-boolean');
        expect(cap.node.text).toBe('true');
      }
    });

    it('supports test.rangeWithData (with right value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @_IGNORE_ (#set! isTrue "exactly"))
        ([ (true) (false) ] @optimistic-boolean
          (#is? test.rangeWithData "isTrue exactly"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true || false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(2);
      for (let cap of matched) {
        expect(cap.name).toBe('optimistic-boolean');
        expect(cap.node.text).toBe('true');
      }
    });

    it('supports test.rangeWithData (with wrong value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @_IGNORE_ (#set! isTrue "perhaps"))
        ([ (true) (false) ] @optimistic-boolean
          (#is? test.rangeWithData "isTrue exactly"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true || false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      // Values don't match, so the test shouldn't pass.
      expect(matched.length).toBe(0);
    });

    it('supports test.startsOnSameRowAs', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((false) @non-hanging-false
          (#is? test.startsOnSameRowAs parent.startPosition))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true ||
            false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(1);
      for (let cap of matched) {
        expect(cap.name).toBe('non-hanging-false');
        expect(cap.node.text).toBe('false');
        expect(cap.node.startPosition.row).toBe(1);
      }
    });

    it('supports test.endsOnSameRowAs', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @non-hanging-true
          (#is? test.endsOnSameRowAs parent.endPosition))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true ||
            false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);

      expect(matched.length).toBe(1);
      for (let cap of matched) {
        expect(cap.name).toBe('non-hanging-true');
        expect(cap.node.text).toBe('true');
        expect(cap.node.startPosition.row).toBe(1);
      }
    });

    it('supports test.config (with no arguments)', async () => {
      atom.config.set('core.careAboutBooleans', true);

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
          (#is? test.config core.careAboutBooleans))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer, config: atom.config });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true || false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(4);

      atom.config.set('core.careAboutBooleans', false);

      matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(0);
    });

    it('supports test.config (with boolean arguments)', async () => {
      atom.config.set('core.careAboutBooleans', true);

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
          (#is? test.config "core.careAboutBooleans true"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer, config: atom.config });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true || false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(4);

      atom.config.set('core.careAboutBooleans', false);

      matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(0);
    });

    it('supports test.config (with number arguments)', async () => {
      atom.config.set('core.careAboutBooleans', 0);

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
        (#is? test.config "core.careAboutBooleans 0"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer, config: atom.config });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
        if (true || false) { console.log('logic!'); }
        return true || false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(4);

      atom.config.set('core.careAboutBooleans', 1);

      matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(0);
    });

    it('supports test.config (with string arguments)', async () => {
      atom.config.set('core.careAboutBooleans', "something");

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
        (#is? test.config "core.careAboutBooleans something"))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer, config: atom.config });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        function foo (bar, baz, thud) {
          if (true || false) { console.log('logic!'); }
          return true || false;
        }
      `);
      await languageMode.ready;

      let matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(4);

      atom.config.set('core.careAboutBooleans', "something-else");

      matched = await getAllMatches(grammar, languageMode);
      expect(matched.length).toBe(0);
    });

    it('supports test.injection', async () => {
      jasmine.useRealClock();
      await grammar.setQueryForTest('highlightsQuery', `
        ((escape_sequence) @regex-escape
          (#is? test.injection true))
      `);

      let regexGrammar = new WASMTreeSitterGrammar(atom.grammars, jsRegexGrammarPath, jsRegexConfig);
      await regexGrammar.setQueryForTest('highlightsQuery', `
        ((control_escape) @regex-escape
          (#is? test.injection true))
      `);

      atom.grammars.addGrammar(regexGrammar);

      grammar.addInjectionPoint({
        type: 'regex_pattern',
        language: () => 'js-regex',
        content: (node) => node,
        languageScope: null
      });

      const languageMode = new WASMTreeSitterLanguageMode({
        grammar,
        buffer,
        config: atom.config,
        grammars: atom.grammars
      });
      buffer.setText(String.raw`
        function foo (bar, baz, thud) {
          let newline = "\n";
          let newlineRegex = /lor\nem/;
        }
      `);
      buffer.setLanguageMode(languageMode);
      await languageMode.ready;

      let layers = languageMode.getAllLanguageLayers();
      expect(layers.length).toBe(2);
      let matched = [];
      for (let layer of layers) {
        let results = await getAllMatches(layer.grammar, languageMode, layer);
        matched.push(...results);
      }

      expect(matched.length).toBe(1);
      for (let cap of matched) {
        expect(cap.node.startPosition.row).toBe(3);
      }
    });

  });

});
