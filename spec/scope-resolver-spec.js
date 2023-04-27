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
    it('adjusts ranges with (#set! startAt)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
      ((try_statement) @try.plus.brace
        (#set! endAt
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

    it('adjusts ranges with (#set! endAt)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((object) @object.interior
          (#set! startAt firstChild.endPosition)
          (#set! endAt lastChild.startPosition))
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

    it('adjusts ranges with (#set! offset(Start|End))', async () => {
      // Same result as the previous test, but with a different technique.
      await grammar.setQueryForTest('highlightsQuery', `
        ((object) @object.interior
          (#set! offsetStart 1)
          (#set! offsetEnd -1))
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
          (#set! startAt previousSibling.startPosition))
        ((comment) @too-late
          (#set! endAt nextSibling.endPosition))
        ((comment) @offset-too-early
          (#set! offsetStart -10))
        ((comment) @offset-too-late
          (#set! offsetEnd 10))
      `);

      const languageMode = new WASMTreeSitterLanguageMode({ grammar, buffer });
      buffer.setLanguageMode(languageMode);
      buffer.setText(dedent`
        let foo = "this is a line above a comment"
        // this is a comment that wants to fly too close to the sun
        let bar = "this is a line below a comment"
      `);
      // Prevent an exception from being thrown before we can even check the
      // scopeResovler.
      spyOn(languageMode, 'isRowCommented').andReturn(false);
      await languageMode.ready;

      let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

      for (let capture of captures) {
        expect(() => {
          scopeResolver.store(capture);
        }).toThrow();
      }
    });

    it("adjusts a range around a regex match with `startAndEndAroundFirstMatchOf`", async () => {
      await grammar.setQueryForTest('highlightsQuery', `
      ((comment) @todo
        (#set! startAndEndAroundFirstMatchOf "\\\\sTODO(?=:)"))
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

    it('rejects scopes for ranges that have already been claimed by another capture with (#set! final true)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string) @string0
        ((string) @string1
          (#set! final true))

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

    it('rejects scopes for ranges that have already been claimed if set with (#set! shy true)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (comment) @comment
        (string "\\"") @string.double
        ((string) @string.other (#set! shy true))
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

    it('rejects scopes for ranges that fail onlyIfFirst or onlyIfLast', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((string_fragment) @impossible.first
          (#set! onlyIfFirst true))
        ((string_fragment) @impossible.last
          (#set! onlyIfLast true))
        ((string) "'" @punctuation.first
          (#onlyIfFirst true))
        ((string) "'" @punctuation.last
          (#onlyIfLast true))
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

    it('supports onlyIfFirstOfType and onlyIfLastOfType', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (formal_parameters (identifier) @first-param
          (#set! onlyIfFirstOfType identifier))
        (formal_parameters (identifier) @last-param
          (#set! onlyIfLastOfType identifier))

        (formal_parameters "," @first-comma
          (#set! onlyIfFirstOfType ","))
        (formal_parameters "," @last-comma
          (#set! onlyIfLastOfType ","))
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

    it('supports onlyIfLastTextOnRow', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("||" @hanging-logical-operator
          (#set! onlyIfLastTextOnRow true))
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

    it('supports onlyIfFirstTextOnRow', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("||" @hanging-logical-operator
          (#set! onlyIfFirstTextOnRow true))
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

    it('supports onlyIfDescendantOfType', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("," @comma-inside-function
          (#set! onlyIfDescendantOfType function_declaration))
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

    it('supports onlyIfAncestorOfType', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @function-with-semicolons
          (#set! onlyIfAncestorOfType ";"))
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

    it('supports onlyIfDescendantOfNodeWithData (without value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @_IGNORE_
          (#match? @_IGNORE_ "foo")
          (#set! isSpecialFunction true))

        ("," @special-comma
          (#set! onlyIfDescendantOfNodeWithData isSpecialFunction))
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

    it('supports onlyIfDescendantOfNodeWithData (with right value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @_IGNORE_
          (#match? @_IGNORE_ "foo" )
          (#set! isSpecialFunction "troz"))

        ("," @special-comma
          (#set! onlyIfDescendantOfNodeWithData "isSpecialFunction troz"))
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

    it('supports onlyIfDescendantOfNodeWithData (with wrong value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((function_declaration) @_IGNORE_
          (#match? @_IGNORE_ "foo")
          (#set! isSpecialFunction "troz"))

        ("," @special-comma
          (#set! onlyIfDescendantOfNodeWithData "isSpecialFunction zort"))
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

    it('supports onlyIfType', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        (formal_parameters _ @function-comma
          (#set! onlyIfType ","))
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

    it('supports onlyIfHasError', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((statement_block) @messed-up-statement-block
          (#set! onlyIfHasError true))
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

    it('supports onlyIfRoot', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((_) @is-root
          (#set! onlyIfRoot true))
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

    it('supports onlyIfLastTextOnRow', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ("||" @orphaned-operator
          (#set! onlyIfLastTextOnRow true))
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

    it('supports onlyIfRangeWithData (without value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @_IGNORE_ (#set! isTrue true))
        ([ (true) (false) ] @optimistic-boolean
          (#set! onlyIfRangeWithData isTrue))
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

    it('supports onlyIfRangeWithData (with right value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @_IGNORE_ (#set! isTrue "exactly"))
        ([ (true) (false) ] @optimistic-boolean
          (#set! onlyIfRangeWithData "isTrue exactly"))
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

    it('supports onlyIfRangeWithData (with wrong value)', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @_IGNORE_ (#set! isTrue "perhaps"))
        ([ (true) (false) ] @optimistic-boolean
          (#set! onlyIfRangeWithData "isTrue exactly"))
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

    it('supports onlyIfStartsOnSameRowAs', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((false) @non-hanging-false
          (#set! onlyIfStartsOnSameRowAs parent.startPosition))
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

    it('supports onlyIfEndsOnSameRowAs', async () => {
      await grammar.setQueryForTest('highlightsQuery', `
        ((true) @non-hanging-true
          (#set! onlyIfEndsOnSameRowAs parent.endPosition))
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

    it('supports onlyIfConfig (with no arguments)', async () => {
      atom.config.set('core.careAboutBooleans', true);

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
          (#set! onlyIfConfig core.careAboutBooleans))
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

    it('supports onlyIfConfig (with boolean arguments)', async () => {
      atom.config.set('core.careAboutBooleans', true);

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
          (#set! onlyIfConfig "core.careAboutBooleans true"))
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

    it('supports onlyIfConfig (with number arguments)', async () => {
      atom.config.set('core.careAboutBooleans', 0);

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
        (#set! onlyIfConfig "core.careAboutBooleans 0"))
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

    it('supports onlyIfConfig (with string arguments)', async () => {
      atom.config.set('core.careAboutBooleans', "something");

      await grammar.setQueryForTest('highlightsQuery', `
        ([(true) (false)] @boolean
        (#set! onlyIfConfig "core.careAboutBooleans something"))
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

    it('supports onlyIfInjection', async () => {
      jasmine.useRealClock();
      await grammar.setQueryForTest('highlightsQuery', `
        ((escape_sequence) @regex-escape
          (#set! onlyIfInjection true))
      `);

      let regexGrammar = new WASMTreeSitterGrammar(atom.grammars, jsRegexGrammarPath, jsRegexConfig);
      await regexGrammar.setQueryForTest('highlightsQuery', `
        ((control_escape) @regex-escape
          (#set! onlyIfInjection true))
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
