const dedent = require('dedent');

function getDisplayText(editor) {
  return editor.displayLayer.getText();
}

describe('Python folding (modern Tree-sitter)', () => {
  let editor;
  let languageMode;
  let grammar;

  async function setTextAndWaitForUpdate(text) {
    editor.setText(text);
    await languageMode.atTransactionEnd();
  }

  async function expectToFoldInto(unfoldedText, foldedText, { rowNumberToFold = 0 } = {}) {
    editor.setText(unfoldedText);
    await languageMode.atTransactionEnd();
    editor.foldBufferRow(rowNumberToFold);
    expect(getDisplayText(editor)).toBe(foldedText);
  }


  beforeEach(async () => {
    atom.config.set('core.useTreeSitterParsers', true);

    editor = await atom.workspace.open();
    editor.displayLayer.reset({ foldCharacter: '…' });
    await atom.packages.activatePackage('language-python');
    grammar = atom.grammars.grammarForScopeName('source.python');
    editor.setGrammar(grammar);
    languageMode = editor.languageMode;
    await languageMode.ready;
  });

  it('folds blocks properly', async () => {
    await expectToFoldInto(
      dedent`
        def foo(arg):
            pass
      `,
      dedent`
        def foo(arg):…
      `
    );

    await expectToFoldInto(
      dedent`
        foo(
          1,
          2,
          3
        )
      `,
      dedent`
        foo(…)
      `
    );

    await setTextAndWaitForUpdate(dedent`
      if 1 > 2:
          print "ok"
      elif 2 > 1: # aha!
          print "whatever"
      elif 3 > 2: print "whatever"
      else: # aha!
          print "not ok"
    `);

    editor.foldBufferRow(0);
    expect(getDisplayText(editor)).toEqual(dedent`
      if 1 > 2:…
      elif 2 > 1: # aha!
          print "whatever"
      elif 3 > 2: print "whatever"
      else: # aha!
          print "not ok"
    `);

    editor.foldBufferRow(2);
    expect(getDisplayText(editor)).toEqual(dedent`
      if 1 > 2:…
      elif 2 > 1: # aha!…
      elif 3 > 2: print "whatever"
      else: # aha!
          print "not ok"
    `);

    expect(editor.isFoldableAtBufferRow(4)).toBe(false);

    editor.foldBufferRow(5);
    expect(getDisplayText(editor)).toEqual(dedent`
      if 1 > 2:…
      elif 2 > 1: # aha!…
      elif 3 > 2: print "whatever"
      else: # aha!…
    `);

    await setTextAndWaitForUpdate(dedent`
      try: # Foo
          do_something()
      except NameError:
          whatever()
      except: # Foo
          whatever()
    `);

    editor.foldBufferRow(0);
    expect(getDisplayText(editor)).toEqual(dedent`
      try: # Foo…
      except NameError:
          whatever()
      except: # Foo
          whatever()
    `);

    editor.foldBufferRow(2);
    expect(getDisplayText(editor)).toEqual(dedent`
      try: # Foo…
      except NameError:…
      except: # Foo
          whatever()
    `);

    editor.foldBufferRow(4);
    expect(getDisplayText(editor)).toEqual(dedent`
      try: # Foo…
      except NameError:…
      except: # Foo…
    `);

    await setTextAndWaitForUpdate(dedent`
      if(True):
        # This comment should disappear
        pass # And this one
        # And even this one
      elif(False):
        pass
    `);

    editor.foldBufferRow(0);
    expect(getDisplayText(editor)).toEqual(dedent`
      if(True):…
      elif(False):
        pass
    `);
  });

});
