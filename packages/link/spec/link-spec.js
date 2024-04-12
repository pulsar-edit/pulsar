const { shell } = require('electron');

describe('link package', () => {
  beforeEach(async () => {
    await atom.packages.activatePackage('language-hyperlink');
    await atom.packages.activatePackage('language-gfm');

    const activationPromise = atom.packages.activatePackage('link');
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'link:open');
    await activationPromise;
  });

  describe('when the cursor is on a link', () => {
    it("opens the link using the 'open' command", async () => {
      await atom.workspace.open('sample.md');

      const editor = atom.workspace.getActiveTextEditor();
      let languageMode = editor.getBuffer().getLanguageMode();
      await languageMode.ready;
      editor.setText('// http://github.com ');
      await languageMode.atTransactionEnd();

      spyOn(shell, 'openExternal');
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');
      expect(shell.openExternal).not.toHaveBeenCalled();

      editor.setCursorBufferPosition([0, 4]);
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');

      shell.openExternal.reset();
      editor.setCursorBufferPosition([0, 8]);
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');

      shell.openExternal.reset();
      editor.setCursorBufferPosition([0, 20]);
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');
    });

    // NOTE: I don't think anyone realized that this was a feature. Our
    // `tree-sitter-markdown` parser doesn't recognize these as URLs. We'd need
    // our custom `tree-sitter-hyperlink` to support this, and it doesn't right
    // now, but I'll keep it in mind for the future.
    xit("opens an 'atom:' link", async () => {
      await atom.workspace.open('sample.md');

      const editor = atom.workspace.getActiveTextEditor();
      editor.setText(
        '// atom://core/open/file?filename=sample.js&line=1&column=2 '
      );

      spyOn(shell, 'openExternal');
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');
      expect(shell.openExternal).not.toHaveBeenCalled();

      editor.setCursorBufferPosition([0, 4]);
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe(
        'atom://core/open/file?filename=sample.js&line=1&column=2'
      );

      shell.openExternal.reset();
      editor.setCursorBufferPosition([0, 8]);
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe(
        'atom://core/open/file?filename=sample.js&line=1&column=2'
      );

      shell.openExternal.reset();
      editor.setCursorBufferPosition([0, 59]);
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe(
        'atom://core/open/file?filename=sample.js&line=1&column=2'
      );
    });

    describe('when the cursor is on a [name][url-name] style markdown link', () =>
      it('opens the named url', async () => {
        jasmine.useRealClock();
        await atom.workspace.open('README.md');

        const editor = atom.workspace.getActiveTextEditor();
        let languageMode = editor.getBuffer().getLanguageMode();
        await languageMode.ready;

        editor.setText(`\
you should [click][here]
you should not [click][her]

[here]: http://github.com\
`);
        // Allow for time for injections to populate
        await languageMode.atTransactionEnd();

        spyOn(shell, 'openExternal');
        editor.setCursorBufferPosition([0, 0]);
        atom.commands.dispatch(atom.views.getView(editor), 'link:open');
        expect(shell.openExternal).not.toHaveBeenCalled();

        editor.setCursorBufferPosition([0, 19]);
        atom.commands.dispatch(atom.views.getView(editor), 'link:open');

        expect(shell.openExternal).toHaveBeenCalled();
        expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');

        shell.openExternal.reset();
        editor.setCursorBufferPosition([1, 24]);
        atom.commands.dispatch(atom.views.getView(editor), 'link:open');

        expect(shell.openExternal).not.toHaveBeenCalled();
      }));

    it('does not open non http/https/atom links', async () => {
      await atom.workspace.open('sample.md');

      const editor = atom.workspace.getActiveTextEditor();
      editor.setText('// ftp://github.com\n');

      spyOn(shell, 'openExternal');
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');
      expect(shell.openExternal).not.toHaveBeenCalled();

      editor.setCursorBufferPosition([0, 5]);
      atom.commands.dispatch(atom.views.getView(editor), 'link:open');

      expect(shell.openExternal).not.toHaveBeenCalled();
    });
  });
});
