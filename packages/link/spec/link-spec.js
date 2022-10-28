const { shell } = require('electron');

describe('link package', () => {
  beforeEach(async () => {
    await core.packages.activatePackage('language-gfm');
    await core.packages.activatePackage('language-hyperlink');

    const activationPromise = core.packages.activatePackage('link');
    core.commands.dispatch(core.views.getView(core.workspace), 'link:open');
    await activationPromise;
  });

  describe('when the cursor is on a link', () => {
    it("opens the link using the 'open' command", async () => {
      await core.workspace.open('sample.md');

      const editor = core.workspace.getActiveTextEditor();
      editor.setText('// "http://github.com"');

      spyOn(shell, 'openExternal');
      core.commands.dispatch(core.views.getView(editor), 'link:open');
      expect(shell.openExternal).not.toHaveBeenCalled();

      editor.setCursorBufferPosition([0, 4]);
      core.commands.dispatch(core.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');

      shell.openExternal.reset();
      editor.setCursorBufferPosition([0, 8]);
      core.commands.dispatch(core.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');

      shell.openExternal.reset();
      editor.setCursorBufferPosition([0, 21]);
      core.commands.dispatch(core.views.getView(editor), 'link:open');

      expect(shell.openExternal).toHaveBeenCalled();
      expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');
    });

    // only works in Atom >= 1.33.0
    // https://github.com/atom/link/pull/33#issuecomment-419643655
    const atomVersion = core.getVersion().split('.');
    console.error('atomVersion', atomVersion);
    if (+atomVersion[0] > 1 || +atomVersion[1] >= 33) {
      it("opens an 'atom:' link", async () => {
        await core.workspace.open('sample.md');

        const editor = core.workspace.getActiveTextEditor();
        editor.setText(
          '// "atom://core/open/file?filename=sample.js&line=1&column=2"'
        );

        spyOn(shell, 'openExternal');
        core.commands.dispatch(core.views.getView(editor), 'link:open');
        expect(shell.openExternal).not.toHaveBeenCalled();

        editor.setCursorBufferPosition([0, 4]);
        core.commands.dispatch(core.views.getView(editor), 'link:open');

        expect(shell.openExternal).toHaveBeenCalled();
        expect(shell.openExternal.argsForCall[0][0]).toBe(
          'atom://core/open/file?filename=sample.js&line=1&column=2'
        );

        shell.openExternal.reset();
        editor.setCursorBufferPosition([0, 8]);
        core.commands.dispatch(core.views.getView(editor), 'link:open');

        expect(shell.openExternal).toHaveBeenCalled();
        expect(shell.openExternal.argsForCall[0][0]).toBe(
          'atom://core/open/file?filename=sample.js&line=1&column=2'
        );

        shell.openExternal.reset();
        editor.setCursorBufferPosition([0, 60]);
        core.commands.dispatch(core.views.getView(editor), 'link:open');

        expect(shell.openExternal).toHaveBeenCalled();
        expect(shell.openExternal.argsForCall[0][0]).toBe(
          'atom://core/open/file?filename=sample.js&line=1&column=2'
        );
      });
    }

    describe('when the cursor is on a [name][url-name] style markdown link', () =>
      it('opens the named url', async () => {
        await core.workspace.open('README.md');

        const editor = core.workspace.getActiveTextEditor();
        editor.setText(`\
you should [click][here]
you should not [click][her]

[here]: http://github.com\
`);

        spyOn(shell, 'openExternal');
        editor.setCursorBufferPosition([0, 0]);
        core.commands.dispatch(core.views.getView(editor), 'link:open');
        expect(shell.openExternal).not.toHaveBeenCalled();

        editor.setCursorBufferPosition([0, 20]);
        core.commands.dispatch(core.views.getView(editor), 'link:open');

        expect(shell.openExternal).toHaveBeenCalled();
        expect(shell.openExternal.argsForCall[0][0]).toBe('http://github.com');

        shell.openExternal.reset();
        editor.setCursorBufferPosition([1, 24]);
        core.commands.dispatch(core.views.getView(editor), 'link:open');

        expect(shell.openExternal).not.toHaveBeenCalled();
      }));

    it('does not open non http/https/atom links', async () => {
      await core.workspace.open('sample.md');

      const editor = core.workspace.getActiveTextEditor();
      editor.setText('// ftp://github.com\n');

      spyOn(shell, 'openExternal');
      core.commands.dispatch(core.views.getView(editor), 'link:open');
      expect(shell.openExternal).not.toHaveBeenCalled();

      editor.setCursorBufferPosition([0, 5]);
      core.commands.dispatch(core.views.getView(editor), 'link:open');

      expect(shell.openExternal).not.toHaveBeenCalled();
    });
  });
});
