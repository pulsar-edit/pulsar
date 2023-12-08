
const path = require('path');
const fs = require('fs-plus');
const temp = require('temp');
const TreeSitterProvider = require('../lib/tree-sitter-provider');

// Just for syntax highlighting.
function scm (strings) {
  return strings.join('');
}

function getEditor () {
  return atom.workspace.getActiveTextEditor();
}

async function wait (ms) {
  return new Promise(r => setTimeout(r, ms));
}

let provider;

async function getSymbols (editor, type = 'file') {
  let controller = new AbortController();
  let symbols = await provider.getSymbols({
    type,
    editor,
    signal: controller.signal
  });

  return symbols;
}

describe('TreeSitterProvider', () => {
  let directory, editor;

  beforeEach(async () => {
    jasmine.unspy(global, 'setTimeout');
    jasmine.unspy(Date, 'now');

    atom.config.set('core.useTreeSitterParsers', true);
    atom.config.set('core.useExperimentalModernTreeSitter', true);
    await atom.packages.activatePackage('language-javascript');

    atom.config.set('symbol-provider-tree-sitter.includeReferences', false);

    provider = new TreeSitterProvider();

    atom.project.setPaths([
      temp.mkdirSync('other-dir-'),
      temp.mkdirSync('atom-symbols-view-')
    ]);

    directory = atom.project.getDirectories()[1];
    fs.copySync(
      path.join(__dirname, 'fixtures', 'js'),
      atom.project.getPaths()[1]
    );

    fs.copySync(
      path.join(__dirname, 'fixtures', 'ruby'),
      atom.project.getPaths()[1]
    );
  });

  describe('when a tree-sitter grammar is used for a file', () => {
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = getEditor();
      let languageMode = editor.getBuffer().getLanguageMode();
      await languageMode.ready;
    });

    it('is willing to provide symbols for the current file', () => {
      let meta = { type: 'file', editor };
      expect(provider.canProvideSymbols(meta)).toBe(true);
    });

    it('is not willing to provide symbols for an entire project', () => {
      let meta = { type: 'project', editor };
      expect(provider.canProvideSymbols(meta)).toBe(false);
    });

    it('provides all JavaScript functions', async () => {
      let symbols = await getSymbols(editor, 'file');

      expect(symbols[0].name).toBe('quicksort');
      expect(symbols[0].position.row).toEqual(0);

      expect(symbols[1].name).toBe('sort');
      expect(symbols[1].position.row).toEqual(1);
    });
  });

  describe('when a non-tree-sitter grammar is used for a file', () => {
    beforeEach(async () => {
      atom.config.set('core.useTreeSitterParsers', false);
      atom.config.set('core.useExperimentalModernTreeSitter', false);
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = getEditor();
    });

    it('is not willing to provide symbols for the current file', () => {
      expect(editor.getGrammar().rootLanguageLayer).toBe(undefined);
      let meta = { type: 'file', editor };
      expect(provider.canProvideSymbols(meta)).toBe(false);
    });
  });

  // TODO: Test that `canProvideSymbols` returns `false` when no layer has a
  // tags query.

  describe('when the buffer is new and unsaved', () => {
    let grammar;
    beforeEach(async () => {
      await atom.workspace.open();
      editor = getEditor();
      grammar = atom.grammars.grammarForId('source.js');
      editor.setGrammar(grammar);
      await editor.getBuffer().getLanguageMode().ready;
    });

    it('is willing to provide symbols', () => {
      let meta = { type: 'file', editor };
      expect(provider.canProvideSymbols(meta)).toBe(true);
    });

    describe('and has content', () => {
      beforeEach(async () => {
        let text = fs.readFileSync(
          path.join(__dirname, 'fixtures', 'js', 'sample.js')
        );
        editor.setText(text);
        await editor.getBuffer().getLanguageMode().atTransactionEnd();
      });

      it('provides symbols just as if the file were saved on disk', async () => {
        let symbols = await getSymbols(editor, 'file');

        expect(symbols[0].name).toBe('quicksort');
        expect(symbols[0].position.row).toEqual(0);

        expect(symbols[1].name).toBe('sort');
        expect(symbols[1].position.row).toEqual(1);
      });
    });
  });

  describe('when the file has multiple language layers', () => {
    beforeEach(async () => {
      await atom.packages.activatePackage('language-ruby');
      await atom.workspace.open(directory.resolve('embed.rb'));
      editor = getEditor();
      await editor.getBuffer().getLanguageMode().ready;
    });

    it('detects symbols across several layers', async () => {
      let symbols = await getSymbols(editor, 'file');

      expect(symbols[0].name).toBe('foo');
      expect(symbols[0].position.row).toEqual(1);

      expect(symbols[1].name).toBe('bar');
      expect(symbols[1].position.row).toEqual(4);
    });
  });

  describe('when the tags query contains @definition captures', () => {
    let grammar;
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = getEditor();
      let languageMode = editor.getBuffer().getLanguageMode();
      await languageMode.ready;
      grammar = editor.getGrammar();
      await grammar.setQueryForTest(
        'tagsQuery',
        scm`
        (
          (variable_declaration
            (variable_declarator
              name: (identifier) @name
              value: [(arrow_function) (function)]))
        ) @definition.function
        `
      );
    });

    it('can infer tag names from those captures', async () => {
      let symbols = await getSymbols(editor, 'file');

      expect(symbols[0].name).toBe('quicksort');
      expect(symbols[0].tag).toBe('function');

      expect(symbols[1].name).toBe('sort');
      expect(symbols[1].tag).toBe('function');
    });
  });

  describe('when the tags query contains @reference captures', () => {
    let grammar;
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = getEditor();
      let languageMode = editor.getBuffer().getLanguageMode();
      await languageMode.ready;
      grammar = editor.getGrammar();
      await grammar.setQueryForTest(
        'tagsQuery',
        scm`
        (
          (variable_declaration
            (variable_declarator
              name: (identifier) @name
              value: [(arrow_function) (function)]))
        ) @definition.function

        (
          (call_expression
            function: (identifier) @name) @reference.call
            (#not-match? @name "^(require)$"))
        `
      );
    });

    it('skips references when they are disabled in settings', async () => {
      let symbols = await getSymbols(editor, 'file');
      expect(symbols.length).toBe(2);
    });

    it('includes references when they are enabled in settings', async () => {
      atom.config.set('symbol-provider-tree-sitter.includeReferences', true);
      let symbols = await getSymbols(editor, 'file');
      expect(symbols.length).toBe(5);
      expect(symbols.map(s => s.tag)).toEqual(
        ['function', 'function', 'call', 'call', 'call']
      );
    });

  });

  describe('when the tags query uses the predicate', () => {
    let grammar;
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = getEditor();
      let languageMode = editor.getBuffer().getLanguageMode();
      await languageMode.ready;
      grammar = editor.getGrammar();
    });

    describe('symbol.strip', () => {
      beforeEach(async () => {
        await grammar.setQueryForTest('tagsQuery', scm`
          (
            (variable_declaration
              (variable_declarator
                name: (identifier) @name
                value: [(arrow_function) (function)]))
                (#set! symbol.strip "ort$")
          )
        `);
      });
      it('strips the given text from each symbol', async () => {
        let symbols = await getSymbols(editor, 'file');

        expect(symbols[0].name).toBe('quicks');
        expect(symbols[0].position.row).toEqual(0);

        expect(symbols[1].name).toBe('s');
        expect(symbols[1].position.row).toEqual(1);
      });
    });

    describe('symbol.prepend', () => {
      beforeEach(async () => {
        await grammar.setQueryForTest('tagsQuery', scm`
          (
            (variable_declaration
              (variable_declarator
                name: (identifier) @name
                value: [(arrow_function) (function)]))
                (#set! symbol.prepend "Foo: ")
          )
        `);
      });
      it('prepends the given text to each symbol', async () => {
        let symbols = await getSymbols(editor, 'file');

        expect(symbols[0].name).toBe('Foo: quicksort');
        expect(symbols[0].position.row).toEqual(0);

        expect(symbols[1].name).toBe('Foo: sort');
        expect(symbols[1].position.row).toEqual(1);
      });
    });

    describe('symbol.append', () => {
      beforeEach(async () => {
        await grammar.setQueryForTest('tagsQuery', scm`
          (
            (variable_declaration
              (variable_declarator
                name: (identifier) @name
                value: [(arrow_function) (function)]))
                (#set! symbol.append " (foo)")
          )

        `);
      });
      it('appends the given text to each symbol', async () => {
        let symbols = await getSymbols(editor, 'file');

        expect(symbols[0].name).toBe('quicksort (foo)');
        expect(symbols[0].position.row).toEqual(0);

        expect(symbols[1].name).toBe('sort (foo)');
        expect(symbols[1].position.row).toEqual(1);
      });
    });

    describe('symbol.prependTextForNode', () => {
      beforeEach(async () => {
        await grammar.setQueryForTest('tagsQuery', scm`
          (
            (variable_declaration
              (variable_declarator
                name: (identifier) @name
                value: [(arrow_function) (function)]))
                (#set! test.onlyIfDescendantOfType function)
                (#set! symbol.prependTextForNode "parent.parent.parent.parent.parent.firstNamedChild")
                (#set! symbol.joiner ".")
                (#set! test.final true)
          )
          (
            (variable_declaration
              (variable_declarator
                name: (identifier) @name
                value: [(arrow_function) (function)]))
          )
        `);
      });
      it(`prepends the associated node's text to each symbol`, async () => {
        let symbols = await getSymbols(editor, 'file');

        expect(symbols[0].name).toBe('quicksort');
        expect(symbols[0].position.row).toEqual(0);

        expect(symbols[1].name).toBe('quicksort.sort');
        expect(symbols[1].position.row).toEqual(1);
      });
    });

    describe('symbol.prependSymbolForNode', () => {
      beforeEach(async () => {
        await grammar.setQueryForTest('tagsQuery', scm`
          ; Outer function has prepended text...
          (
            (variable_declaration
              (variable_declarator
                name: (identifier) @name
                value: [(arrow_function) (function)]))
                (#set! test.onlyIfNotDescendantOfType function)
                (#set! symbol.prepend "ROOT: ")
                (#set! test.final true)
          )
          ; …which the inner function picks up on.
          (
            (variable_declaration
              (variable_declarator
                name: (identifier) @name
                value: [(arrow_function) (function)]))
                (#set! test.onlyIfDescendantOfType function)
                (#set! symbol.prependSymbolForNode "parent.parent.parent.parent.parent.firstNamedChild")
                (#set! symbol.joiner ".")
                (#set! test.final true)
          )
        `);
      });
      it(`prepends the associated node's symbol name to each symbol`, async () => {
        let symbols = await getSymbols(editor, 'file');

        expect(symbols[0].name).toBe('ROOT: quicksort');
        expect(symbols[0].position.row).toEqual(0);

        expect(symbols[1].name).toBe('ROOT: quicksort.sort');
        expect(symbols[1].position.row).toEqual(1);
      });
    });

  });
});
