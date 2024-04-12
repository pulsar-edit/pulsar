
const path = require('path');
const fs = require('fs-plus');
const temp = require('temp');
const CTagsProvider = require('../lib/ctags-provider');

function getEditor() {
  return atom.workspace.getActiveTextEditor();
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getProjectSymbols(provider, editor) {
  let symbols = await provider.getSymbols({
    type: 'project',
    editor,
    paths: atom.project.getPaths()
  });
  return symbols;
}

async function findDeclarationInProject(provider, editor) {
  let symbols = await provider.getSymbols({
    type: 'project-find',
    editor,
    paths: atom.project.getPaths(),
    word: editor.getWordUnderCursor()
  });
  return symbols;
}

describe('CTagsProvider', () => {
  let provider, directory, editor;

  beforeEach(() => {
    jasmine.unspy(global, 'setTimeout');
    jasmine.unspy(Date, 'now');

    provider = new CTagsProvider();

    atom.project.setPaths([
      temp.mkdirSync('other-dir-'),
      temp.mkdirSync('atom-symbols-view-')
    ]);

    directory = atom.project.getDirectories()[1];
    fs.copySync(
      path.join(__dirname, 'fixtures', 'js'),
      atom.project.getPaths()[1]
    );
  });

  it('identifies its project root correctly', () => {
    let root = provider.getPackageRoot();
    expect(root).toContain("symbol-provider-ctags");
    expect(
      fs.existsSync(path.join(root, "vendor", "ctags-darwin"))
    ).toBe(true);
  });

  describe('when tags can be generated for a file', () => {
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = getEditor();
    });

    it('provides all JavaScript functions', async () => {
      let symbols = await provider.getSymbols({
        type: 'file',
        editor
      });

      expect(symbols[0].name).toBe('quicksort');
      expect(symbols[0].position.row).toEqual(0);

      expect(symbols[1].name).toBe('quicksort.sort');
      expect(symbols[1].position.row).toEqual(1);
    });
  });

  describe('when the buffer is new and unsaved', () => {
    beforeEach(async () => {
      await atom.workspace.open();
      editor = getEditor();
    });

    it('does not try to provide symbols', () => {
      let meta = { type: 'file', editor };
      expect(provider.canProvideSymbols(meta)).toBe(0);
    });
  });

  describe('when the buffer is modified', () => {
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = getEditor();
    });

    it('returns a lower match score', () => {
      editor.insertText("\n");
      let meta = { type: 'file', editor };
      expect(provider.canProvideSymbols(meta)).toBe(0.89);
    });
  });

  describe('when no tags can be generated for a file', () => {
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('no-symbols.js'));
      editor = getEditor();
    });

    it('returns an empty array', async () => {
      let symbols = await provider.getSymbols({ type: 'file', editor });
      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols.length).toBe(0);
    });
  });

  describe('go to declaration', () => {
    it("returns nothing when no declaration is found", async () => {
      await atom.workspace.open(directory.resolve('tagged.js'));
      editor = getEditor();
      editor.setCursorBufferPosition([0, 2]);

      let symbols = await provider.getSymbols({
        type: 'project-find',
        editor,
        paths: atom.project.getPaths(),
        word: editor.getWordUnderCursor()
      });

      expect(symbols.length).toBe(0);
    });

    it("returns one result when there is a single matching declaration", async () => {
      await atom.workspace.open(directory.resolve('tagged.js'));
      editor = getEditor();

      editor.setCursorBufferPosition([6, 24]);
      let symbols = await provider.getSymbols({
        type: 'project-find',
        editor,
        paths: atom.project.getPaths(),
        word: editor.getWordUnderCursor()
      });

      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([2, 0]);
    });

    it("correctly identifies the tag for a C preprocessor macro", async () => {
      atom.project.setPaths([temp.mkdirSync('atom-symbols-view-c-')]);
      fs.copySync(
        path.join(__dirname, 'fixtures', 'c'),
        atom.project.getPaths()[0]
      );

      await atom.packages.activatePackage('language-c');
      await atom.workspace.open('sample.c');

      editor = getEditor();
      editor.setCursorBufferPosition([4, 4]);

      let symbols = await findDeclarationInProject(provider, editor);

      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([0, 0]);
    });

    it('ignores results that reference nonexistent files', async () => {
      await atom.workspace.open(directory.resolve('tagged.js'));
      editor = getEditor();
      editor.setCursorBufferPosition([8, 14]);

      let symbols = await findDeclarationInProject(provider, editor);

      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([8, 0]);
    });

    it('includes ? and ! characters in ruby symbols', async () => {
      atom.project.setPaths([temp.mkdirSync('atom-symbols-view-ruby-')]);
      fs.copySync(
        path.join(__dirname, 'fixtures', 'ruby'),
        atom.project.getPaths()[0]
      );

      await atom.packages.activatePackage('language-ruby');
      await atom.workspace.open('file1.rb');
      let symbols;

      editor = getEditor();

      editor.setCursorBufferPosition([18, 4]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([7, 0]);

      editor.setCursorBufferPosition([19, 2]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([11, 0]);

      editor.setCursorBufferPosition([20, 5]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([3, 0]);

      editor.setCursorBufferPosition([21, 7]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([3, 0]);
    });

    it('understands assignment ruby method definitions', async () => {
      atom.project.setPaths([temp.mkdirSync('atom-symbols-view-ruby-')]);
      fs.copySync(
        path.join(__dirname, 'fixtures', 'ruby'),
        atom.project.getPaths()[0]
      );

      await atom.packages.activatePackage('language-ruby');
      await atom.workspace.open('file1.rb');
      let symbols;

      editor = getEditor();

      editor.setCursorBufferPosition([22, 5]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([14, 0]);

      editor.setCursorBufferPosition([23, 5]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(2);
      expect(symbols[0].position).toEqual([14, 0]);

      editor.setCursorBufferPosition([24, 5]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([0, 0]);

      editor.setCursorBufferPosition([25, 5]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([11, 0]);
    });

    it('understands fully qualified ruby constant definitions', async () => {
      atom.project.setPaths([temp.mkdirSync('atom-symbols-view-ruby-')]);
      fs.copySync(
        path.join(__dirname, 'fixtures', 'ruby'),
        atom.project.getPaths()[0]
      );

      await atom.packages.activatePackage('language-ruby');
      await atom.workspace.open('file1.rb');
      let symbols;

      editor = getEditor();

      editor.setCursorBufferPosition([26, 10]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(2);
      expect(symbols[0].position).toEqual([1, 0]);

      editor.setCursorBufferPosition([27, 5]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(1);
      expect(symbols[0].position).toEqual([0, 0]);

      editor.setCursorBufferPosition([28, 5]);
      symbols = await findDeclarationInProject(provider, editor);
      expect(symbols.length).toBe(2);
      expect(symbols[0].position).toEqual([31, 0]);
    });
  });

  describe('project symbols', () => {
    it('displays all tags', async () => {
      await atom.workspace.open(directory.resolve('tagged.js'));
      editor = getEditor();

      let symbols = await getProjectSymbols(provider, editor);

      expect(symbols.length).toBe(4);

      expect(symbols[0].name).toBe('callMeMaybe');
      expect(symbols[0].directory).toBe(directory.getPath());
      expect(symbols[0].file).toBe('tagged.js');

      expect(symbols[3].name).toBe('thisIsCrazy');
      expect(symbols[3].directory).toBe(directory.getPath());
      expect(symbols[3].file).toBe('tagged.js');

      fs.removeSync(directory.resolve('tags'));
      await wait(50);

      symbols = await getProjectSymbols(provider, editor);
      expect(symbols.length).toBe(0);
    });
  });
});
