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

let PATH = path.resolve( path.join(__dirname, '..', 'packages') );
function resolve (modulePath) {
  return require.resolve(`${PATH}/${modulePath}`)
}

const jsGrammarPath = resolve(
  'language-javascript/grammars/tree-sitter-2-javascript.cson'
);
let jsConfig = CSON.readFileSync(jsGrammarPath);

async function getAllCaptures(grammar, languageMode) {
  let query = await grammar.getQuery('syntaxQuery');
  let rootLayer = languageMode.rootLanguageLayer;
  let scopeResolver = new ScopeResolver(
    rootLayer,
    (name) => languageMode.getOrCreateScopeId(name),
  );
  let { start, end } = languageMode.buffer.getRange();
  let { tree } = rootLayer;
  return {
    captures: query.captures(tree.rootNode, start, end),
    scopeResolver
  };
}

function stringForNodeRange (node) {
  return `${node.startIndex}-${node.endIndex}`;
}

function rangeFromDescriptor (rawRange) {
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
    atom.config.set('core.languageParser', 'wasm-tree-sitter');
  });

  it('resolves all scopes in absence of any tests or adjustments', async () => {
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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

  it('adjusts ranges with (#set! startAt)', async () => {
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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

  it('rejects scopes for ranges that have already been claimed by another capture with (#set! final true)', async () => {
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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

  it('rejects scopes for ranges that fail `onlyIfFirst` or `onlyIfLast`', async () => {
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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
    await grammar.setQueryForTest('syntaxQuery', `
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

    expect(matched.map(capture => capture.name))
      .toEqual(["hanging-logical-operator"]);
  });

  it('supports onlyIfDescendantOfType', async () => {
    await grammar.setQueryForTest('syntaxQuery', `
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

    let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

    let matched = [];
    for (let capture of captures) {
      let range = scopeResolver.store(capture);
      if (range) { matched.push(capture); }
    }

    expect(matched.length).toBe(2);
    expect(matched.every(cap => {
      return cap.node.startPosition.row === 1;
    })).toBe(true);
  });

  it('supports onlyIfAncestorOfType', async () => {
    await grammar.setQueryForTest('syntaxQuery', `
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

    let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

    let matched = [];
    for (let capture of captures) {
      let range = scopeResolver.store(capture);
      if (range) { matched.push(capture); }
    }

    expect(matched.length).toBe(1);
    expect(matched[0].node.text.includes("function bar")).toBe(true);
  });

  it('supports onlyIfDescendantOfNodeWithData', async () => {
    await grammar.setQueryForTest('syntaxQuery', `
      ((function_declaration) @_IGNORE_
        (#match? @_IGNORE_ "foo" )
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

    let { scopeResolver, captures } = await getAllCaptures(grammar, languageMode);

    let matched = [];
    for (let capture of captures) {
      let range = scopeResolver.store(capture);
      if (range) { matched.push(capture); }
    }

    expect(matched.length).toBe(2);
    expect(matched.every(cap => {
      return cap.node.startPosition.row === 0 &&
        cap.node.text === ",";
    })).toBe(true);
  });

});
