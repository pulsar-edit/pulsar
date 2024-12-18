const dedent = require('dedent');

fdescribe('Python indentation (modern Tree-sitter)', () => {
  let editor;
  let languageMode;
  let grammar;

  async function insertNewline() {
    editor.getLastSelection().insertText('\n', { autoIndent: true, autoIndentNewline: true })
    await languageMode.atTransactionEnd();
  }

  async function expectToAutoIndentAfter(text, assert = true) {
    editor.setText(text);
    await languageMode.atTransactionEnd();
    editor.setCursorBufferPosition([Infinity, Infinity]);
    let currentRow = editor.getLastCursor().getBufferPosition().row;
    insertNewline();
    if (assert) {
      expect(editor.lineTextForBufferRow(currentRow + 1)).toEqual('    ');
    } else {
      expect(editor.lineTextForBufferRow(currentRow + 1)).toEqual('');
    }
  }

  beforeEach(async () => {
    atom.config.set('core.useTreeSitterParsers', true);

    editor = await atom.workspace.open();
    await atom.packages.activatePackage('language-python');
    grammar = atom.grammars.grammarForScopeName('source.python');
    editor.setGrammar(grammar);
    languageMode = editor.languageMode;
    await languageMode.ready;
  });

  it('indents blocks properly', async () => {
    await expectToAutoIndentAfter(`if 1 > 2:`)
    await expectToAutoIndentAfter(`if 1 > 2: # test`)
    await expectToAutoIndentAfter(`if 1 > 2: pass`, false)

    await expectToAutoIndentAfter(`def f(x):`)
    await expectToAutoIndentAfter(`def f(x): # test`)
    await expectToAutoIndentAfter(`def f(x): pass`, false)

    await expectToAutoIndentAfter(`class Fx(object):`)
    await expectToAutoIndentAfter(`class Fx(object): # test`)
    await expectToAutoIndentAfter(`class Fx(object): pass`, false)

    await expectToAutoIndentAfter(`while True:`)
    await expectToAutoIndentAfter(`while True: # test`)
    await expectToAutoIndentAfter(`while True: pass`, false)

    await expectToAutoIndentAfter(`for _ in iter(x):`)
    await expectToAutoIndentAfter(`for _ in iter(x): # test`)
    await expectToAutoIndentAfter(`for _ in iter(x): pass`, false)

    await expectToAutoIndentAfter(dedent`
      if 1 > 2:
        pass
      elif 2 > 3:
    `)

    await expectToAutoIndentAfter(dedent`
      if 1 > 2:
        pass
      elif 2 > 3: # test
    `)

    await expectToAutoIndentAfter(dedent`
      if 1 > 2:
        pass
      elif 2 > 3: pass
    `, false)

    await expectToAutoIndentAfter(dedent`
      if 1 > 2:
        pass
      elif 2 > 3:
          pass
      else:
    `)

    await expectToAutoIndentAfter(dedent`
      if 1 > 2:
          pass
      elif 2 > 3:
          pass
      else: # test
    `)

    await expectToAutoIndentAfter(dedent`
      if 1 > 2:
          pass
      elif 2 > 3:
          pass
      else: pass
    `, false)

    await expectToAutoIndentAfter(`try:`)

    // The assertions below don't work because `tree-sitter-python` don't
    // parse them correctly unless they occur within an already intact
    // `try/except` block. This needs to be fixed upstream.
    // await expectToAutoIndentAfter(`try: # test`)
    // await expectToAutoIndentAfter(`try: pass`, false)

    await expectToAutoIndentAfter(dedent`
      try:
          do_something()
      except:
    `)
    await expectToAutoIndentAfter(dedent`
      try:
          do_something()
      except: # test
    `)
    await expectToAutoIndentAfter(dedent`
      try:
          do_something()
      except: pass
    `, false)
  });

  it('indents blocks properly (complex cases)', async () => {
    editor.setText(dedent`
      try: pass
      except: pass
    `);
    await languageMode.atTransactionEnd();
    editor.setCursorBufferPosition([0, Infinity]);
    await insertNewline();
    expect(editor.lineTextForBufferRow(1)).toBe('')

    editor.setText(dedent`
      try: #foo
      except: pass
    `)
    await languageMode.atTransactionEnd();
    editor.setCursorBufferPosition([0, Infinity]);
    await insertNewline();
    expect(editor.lineTextForBufferRow(1)).toBe('    ')
  })

  it(`does not indent for other usages of colons`, async () => {
    await expectToAutoIndentAfter(`x = lambda a : a + 10`, false)
    await expectToAutoIndentAfter(`x = list[:2]`, false)
    await expectToAutoIndentAfter(`x = { foo: 2 }`, false)
  });

  it('indents braces properly', async () => {
    let pairs = [
      ['[', ']'],
      ['{', '}'],
      ['(', ')']
    ];
    for (let [a, b] of pairs) {
      editor.setText(`x = ${a}

      ${b}`)
      await languageMode.atTransactionEnd();
      editor.setCursorBufferPosition([0, Infinity]);
      await insertNewline();
      expect(editor.lineTextForBufferRow(1)).toBe('    ')
    }

    editor.setText(`x = <

    >`)
    await languageMode.atTransactionEnd();
    editor.setCursorBufferPosition([0, Infinity]);
    await insertNewline();
    expect(editor.lineTextForBufferRow(1)).toBe('')
  });

  it('dedents properly', async () => {
    editor.setText(dedent`
      if 1 > 2:
        pass
        eli
    `);
    editor.setCursorBufferPosition([Infinity, Infinity]);
    await languageMode.atTransactionEnd();
    editor.getLastSelection().insertText('f', {
      autoIndent: true,
      autoDecreaseIndent: true
    });
    await languageMode.atTransactionEnd();
    expect(editor.lineTextForBufferRow(2)).toBe('elif');

    editor.setText(dedent`
      if 1 > 2:
        pass
        els
    `);
    editor.setCursorBufferPosition([Infinity, Infinity]);
    await languageMode.atTransactionEnd();
    editor.getLastSelection().insertText('e', {
      autoIndent: true,
      autoDecreaseIndent: true
    });
    await languageMode.atTransactionEnd();
    expect(editor.lineTextForBufferRow(2)).toBe('else');


    editor.setText(dedent`
      match x:
          case "a":
              pass
          cas
    `);
    editor.setCursorBufferPosition([Infinity, Infinity]);
    await languageMode.atTransactionEnd();
    editor.getLastSelection().insertText('e', {
      autoIndent: true,
      autoDecreaseIndent: true
    });
    await languageMode.atTransactionEnd();
    expect(editor.lineTextForBufferRow(3)).toBe('    case');
  });

});
