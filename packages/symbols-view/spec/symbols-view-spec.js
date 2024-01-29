const path = require('path');
const etch = require('etch');
const fs = require('fs-plus');
const temp = require('temp');
const SymbolsView = require('../lib/symbols-view');

const { migrateOldConfigIfNeeded } = require('../lib/util');

const DummyProvider = require('./fixtures/providers/dummy-provider');
const AsyncDummyProvider = require('./fixtures/providers/async-provider');
const ProgressiveProjectProvider = require('./fixtures/providers/progressive-project-provider.js');
const QuicksortProvider = require('./fixtures/providers/quicksort-provider.js');
const VerySlowProvider = require('./fixtures/providers/very-slow-provider');
const UselessProvider = require('./fixtures/providers/useless-provider.js');
const EmptyProvider = require('./fixtures/providers/empty-provider.js');
const TaggedProvider = require('./fixtures/providers/tagged-provider.js');
const CacheClearingProvider = require('./fixtures/providers/cache-clearing-provider.js');
const CompetingExclusiveProvider = require('./fixtures/providers/competing-exclusive-provider.js');

const { it, fit, ffit, fffit, beforeEach, afterEach, conditionPromise } = require('./async-spec-helpers');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getOrScheduleUpdatePromise() {
  return new Promise((resolve) => etch.getScheduler().updateDocument(resolve));
}

function choiceCount(symbolsView) {
  return symbolsView.element.querySelectorAll('li').length;
}

function getWorkspaceView() {
  return atom.views.getView(atom.workspace);
}

function getEditor() {
  return atom.workspace.getActiveTextEditor();
}

function getEditorView() {
  return atom.views.getView(atom.workspace.getActiveTextEditor());
}

function getSymbolsView() {
  return atom.workspace.getModalPanels()[0]?.item;
}

async function dispatchAndWaitForChoices(commandName) {
  atom.commands.dispatch(getEditorView(), commandName);
  let symbolsView = atom.workspace.getModalPanels()[0].item;
  await conditionPromise(() => {
    let count = symbolsView.element.querySelectorAll('li').length;
    return count > 0;
  });
}

function registerProvider(...args) {
  let pkg = atom.packages.getActivePackage('symbols-view');
  let main = pkg?.mainModule;
  if (!main) {
    let disposable = atom.packages.onDidActivatePackage(pack => {
      if (pack.name !== 'symbols-view') return;
      for (let provider of args) {
        pack.mainModule.consumeSymbolProvider(provider);
      }
      disposable.dispose();
    });
    // If we let the package lazy-activate the first time a command is invoked,
    // we lose an opportunity to add mock providers. So we should activate it
    // manually.
    atom.packages.getLoadedPackage('symbols-view').activateNow();
  } else {
    for (let provider of args) {
      main.consumeSymbolProvider(provider);
    }
  }
}

describe('SymbolsView', () => {
  let symbolsView, activationPromise, editor, directory, mainModule, languageMode;

  beforeEach(async () => {
    jasmine.unspy(Date, 'now');
    jasmine.unspy(global, 'setTimeout');

    atom.project.setPaths([
      temp.mkdirSync('other-dir-'),
      temp.mkdirSync('atom-symbols-view-')
    ]);

    directory = atom.project.getDirectories()[1];

    fs.copySync(
      path.join(__dirname, 'fixtures', 'js'),
      atom.project.getPaths()[1]
    );

    atom.config.set('symbols-view.showProviderNamesInSymbolsView', false);
    atom.config.set('symbols-view.showIconsInSymbolsView', false);

    activationPromise = atom.packages.activatePackage('symbols-view');
    await activationPromise.then(() => {
      mainModule = atom.packages.getActivePackage('symbols-view').mainModule;
    });
    await atom.packages.activatePackage('language-javascript');
    jasmine.attachToDOM(getWorkspaceView());
  });

  afterEach(async () => {
    await atom.packages.deactivatePackage('symbols-view');
  });

  describe('when toggling file symbols', () => {
    beforeEach(async () => {
      atom.config.set('symbols-view.providerTimeout', 500);
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = atom.workspace.getActiveTextEditor();
      languageMode = editor.getBuffer().getLanguageMode();
      if (languageMode.ready) await languageMode.ready;
    });

    it('displays all symbols with line numbers', async () => {
      registerProvider(DummyProvider);
      await activationPromise;
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      symbolsView = getSymbolsView();

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(symbolsView.element.querySelectorAll('li').length).toBe(5);

      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Symbol on Row 1');
      expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText('Line 1');
      expect(symbolsView.element.querySelector('li:last-child .primary-line')).toHaveText('Symbol on Row 13');
      expect(symbolsView.element.querySelector('li:last-child .secondary-line')).toHaveText('Line 13');

      // No icon-related classes should be added when `showIconsInSymbolsView`
      // is false.
      expect(symbolsView.element.querySelector('li:first-child .primary-line').classList.contains('icon')).toBe(false);
      expect(symbolsView.element.querySelector('li:first-child .primary-line').classList.contains('no-icon')).toBe(false);

    });

    it('prefills the query field if `prefillSelectedText` is `true`', async () => {
      atom.config.set('symbols-view.prefillSelectedText', true);
      registerProvider(DummyProvider);
      await activationPromise;
      spyOn(editor, 'getSelectedText').andReturn('Symbol on Row 13');
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      symbolsView = getSymbolsView();

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(symbolsView.element.querySelectorAll('li').length).toBe(1);

      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Symbol on Row 13');
      expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText('Line 13');
    });

    it('does not prefill the query field if `prefillSelectedText` is `false`', async () => {
      atom.config.set('symbols-view.prefillSelectedText', false);
      registerProvider(DummyProvider);
      await activationPromise;
      spyOn(editor, 'getSelectedText').andReturn('Symbol on Row 13');
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      symbolsView = getSymbolsView();

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(symbolsView.element.querySelectorAll('li').length).toBe(5);

      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Symbol on Row 1');
      expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText('Line 1');
      expect(symbolsView.element.querySelector('li:last-child .primary-line')).toHaveText('Symbol on Row 13');
      expect(symbolsView.element.querySelector('li:last-child .secondary-line')).toHaveText('Line 13');
    });

    it('does not wait for providers that take too long', async () => {
      registerProvider(DummyProvider, VerySlowProvider);
      await activationPromise;
      expect(mainModule.broker.providers.length).toBe(2);
      atom.commands.dispatch(getEditorView(), 'symbols-view:toggle-file-symbols');

      symbolsView = atom.workspace.getModalPanels()[0].item;
      await conditionPromise(async () => {
        await getOrScheduleUpdatePromise();
        let count = symbolsView.element.querySelectorAll('li').length;
        return count > 0;
      });

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(symbolsView.element.querySelectorAll('li').length).toBe(5);

      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Symbol on Row 1');
      expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText('Line 1');
      expect(symbolsView.element.querySelector('li:last-child .primary-line')).toHaveText('Symbol on Row 13');
      expect(symbolsView.element.querySelector('li:last-child .secondary-line')).toHaveText('Line 13');
    });

    it('allows the exclusive provider to control certain UI aspects', async () => {
      registerProvider(AsyncDummyProvider);
      await activationPromise;
      expect(mainModule.broker.providers.length).toBe(1);
      atom.commands.dispatch(getEditorView(), 'symbols-view:toggle-file-symbols');
      symbolsView = getSymbolsView();
      spyOn(symbolsView.selectListView, 'update').andCallThrough();
      await conditionPromise(async () => {
        await getOrScheduleUpdatePromise();
        let count = symbolsView.element.querySelectorAll('li').length;
        return count > 0;
      });

      expect(symbolsView.selectListView.update).toHaveBeenCalledWith(
        { loadingMessage: 'Loading…' }
      );
    });

    it('caches tags until the editor changes', async () => {
      registerProvider(DummyProvider);
      await activationPromise;
      editor = atom.workspace.getActiveTextEditor();
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      symbolsView = atom.workspace.getModalPanels()[0].item;
      await symbolsView.cancel();

      spyOn(DummyProvider, 'getSymbols').andCallThrough();

      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      expect(choiceCount(symbolsView)).toBe(5);
      expect(DummyProvider.getSymbols).not.toHaveBeenCalled();
      await symbolsView.cancel();

      await editor.save();
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(choiceCount(symbolsView)).toBe(5);
      expect(DummyProvider.getSymbols).toHaveBeenCalled();
      editor.destroy();
      expect(symbolsView.cachedResults.get(editor)).toBeUndefined();
    });

    it("invalidates a single provider's tags if the provider asks it to", async () => {
      registerProvider(DummyProvider, CacheClearingProvider);
      await activationPromise;
      editor = atom.workspace.getActiveTextEditor();
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      symbolsView = atom.workspace.getModalPanels()[0].item;
      expect(choiceCount(symbolsView)).toBe(6);
      await symbolsView.cancel();
      await wait(100);

      spyOn(DummyProvider, 'getSymbols').andCallThrough();
      spyOn(CacheClearingProvider, 'getSymbols').andCallThrough();

      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      expect(choiceCount(symbolsView)).toBe(6);
      expect(DummyProvider.getSymbols).not.toHaveBeenCalled();
      expect(CacheClearingProvider.getSymbols).toHaveBeenCalled();
      await symbolsView.cancel();
      await editor.save();

      expect(symbolsView.cachedResults.get(editor)).toBeUndefined();

      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(choiceCount(symbolsView)).toBe(6);
      expect(DummyProvider.getSymbols).toHaveBeenCalled();
      expect(CacheClearingProvider.getSymbols).toHaveBeenCalled();
      editor.destroy();
      expect(symbolsView.cachedResults.get(editor)).toBeUndefined();
    });

    it('displays a message when no tags match text in mini-editor', async () => {
      registerProvider(DummyProvider);
      await activationPromise;
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');

      symbolsView = getSymbolsView();
      symbolsView.selectListView.refs.queryEditor.setText('nothing will match this');

      await conditionPromise(() => symbolsView.selectListView.refs.emptyMessage);
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(choiceCount(symbolsView)).toBe(0);

      expect(symbolsView.selectListView.refs.emptyMessage.textContent.length).toBeGreaterThan(0);

      symbolsView.selectListView.refs.queryEditor.setText('');
      await conditionPromise(() => choiceCount(symbolsView) > 0);
      expect( choiceCount(symbolsView) ).toBe(5);
      expect(symbolsView.selectListView.refs.emptyMessage).toBeUndefined();
    });

    it('moves the cursor to the selected function', async () => {
      registerProvider(DummyProvider);
      await activationPromise;
      editor = atom.workspace.getActiveTextEditor();
      expect(editor.getCursorBufferPosition()).toEqual([0, 0]);
      await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
      symbolsView = getSymbolsView();

      symbolsView.element.querySelectorAll('li')[1].click();
      // It'll move to the first non-whitespace character on the line.
      expect(editor.getCursorBufferPosition()).toEqual([3, 4]);
    });

    describe('when there are multiple exclusive providers', () => {
      describe("and none have priority in the user's settings", () => {
        it('prefers the one with the highest score', async () => {
          registerProvider(DummyProvider, CompetingExclusiveProvider);
          spyOn(CompetingExclusiveProvider, 'getSymbols').andCallThrough();
          spyOn(DummyProvider, 'getSymbols').andCallThrough();
          await activationPromise;
          await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
          symbolsView = getSymbolsView();
          expect(choiceCount(symbolsView)).toBe(5);
          expect(DummyProvider.getSymbols).toHaveBeenCalled();
          expect(CompetingExclusiveProvider.getSymbols).not.toHaveBeenCalled();
        });
      });

      describe('and one is listed in `preferCertainProviders`', () => {
        beforeEach(() => {
          atom.config.set('symbols-view.preferCertainProviders', ['symbol-provider-competing-exclusive']);
        });

        it('prefers the one with the highest score (providers listed beating those not listed)', async () => {
          registerProvider(DummyProvider, CompetingExclusiveProvider);
          spyOn(CompetingExclusiveProvider, 'getSymbols').andCallThrough();
          spyOn(DummyProvider, 'getSymbols').andCallThrough();
          await activationPromise;
          await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
          symbolsView = getSymbolsView();
          expect(choiceCount(symbolsView)).toBe(5);
          expect(DummyProvider.getSymbols).not.toHaveBeenCalled();
          expect(CompetingExclusiveProvider.getSymbols).toHaveBeenCalled();
        });
      });

      describe('and more than one is listed in `preferCertainProviders`', () => {
        beforeEach(() => {
          // Last time we referred to this one by its package name; now we use
          // its human-friendly name. They should be interchangeable.
          atom.config.set(
            'symbols-view.preferCertainProviders',
            ['Competing Exclusive', 'symbol-provider-dummy']
          );
        });

        it('prefers the one with the highest score (providers listed earlier beating those listed later)', async () => {
          registerProvider(DummyProvider, CompetingExclusiveProvider);
          spyOn(CompetingExclusiveProvider, 'getSymbols').andCallThrough();
          spyOn(DummyProvider, 'getSymbols').andCallThrough();
          await activationPromise;
          await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
          symbolsView = getSymbolsView();
          expect(choiceCount(symbolsView)).toBe(5);
          expect(DummyProvider.getSymbols).not.toHaveBeenCalled();
          expect(CompetingExclusiveProvider.getSymbols).toHaveBeenCalled();
        });
      });

      describe('and one has a scope-specific `preferCertainProviders` setting', () => {
        beforeEach(() => {
          // Last time we referred to this one by its package name; now we use
          // its human-friendly name. They should be interchangeable.
          atom.config.set(
            'symbols-view.preferCertainProviders',
            ['Competing Exclusive', 'symbol-provider-dummy'],
            { scopeSelector: '.source.js' }
          );

          atom.config.set(
            'symbols-view.preferCertainProviders',
            ['symbol-provider-dummy']
          );
        });

        it('prefers the one with the highest score (providers listed earlier beating those listed later)', async () => {
          registerProvider(DummyProvider, CompetingExclusiveProvider);
          spyOn(CompetingExclusiveProvider, 'getSymbols').andCallThrough();
          spyOn(DummyProvider, 'getSymbols').andCallThrough();
          await activationPromise;
          await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
          symbolsView = getSymbolsView();
          expect(choiceCount(symbolsView)).toBe(5);
          expect(DummyProvider.getSymbols).not.toHaveBeenCalled();
          expect(CompetingExclusiveProvider.getSymbols).toHaveBeenCalled();
        });
      });
    });

    describe('when no symbols are found', () => {
      it('shows the list view with an error message', async () => {
        registerProvider(EmptyProvider);
        await activationPromise;
        atom.commands.dispatch(getEditorView(), 'symbols-view:toggle-file-symbols');
        await conditionPromise(() => getSymbolsView()?.selectListView.refs.emptyMessage);
        symbolsView = getSymbolsView();

        expect(document.body.contains(symbolsView.element));
        expect(choiceCount(symbolsView)).toBe(0);
        let refs = symbolsView.selectListView.refs;
        expect(refs.emptyMessage).toBeVisible();
        expect(refs.emptyMessage.textContent.length).toBeGreaterThan(0);
        expect(refs.loadingMessage).not.toBeVisible();
      });
    });

    describe("when symbols can't be generated for a file", () => {
      it('does not show the list view', async () => {
        registerProvider(UselessProvider);
        await activationPromise;
        expect(mainModule.broker.providers.length).toBe(1);
        atom.commands.dispatch(getEditorView(), 'symbols-view:toggle-file-symbols');

        await wait(1000);
        symbolsView = atom.workspace.getModalPanels()[0].item;

        // List view should not be visible, nor should it have any options.
        expect(
          symbolsView.element.querySelectorAll('li').length
        ).toBe(0);
        expect(symbolsView.element).not.toBeVisible();
      });
    });

    describe("when the user has enabled icons in the symbols list", () => {
      beforeEach(() => {
        atom.config.set('symbols-view.showIconsInSymbolsView', true);
      });

      it('shows icons in the symbols list', async () => {
        registerProvider(DummyProvider);
        await activationPromise;
        await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
        symbolsView = getSymbolsView();

        expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
        expect(document.body.contains(symbolsView.element)).toBe(true);
        expect(symbolsView.element.querySelectorAll('li').length).toBe(5);

        expect(symbolsView.element.querySelector('li:first-child .primary-line').classList.contains('icon-package')).toBe(true);
        expect(symbolsView.element.querySelector('li:first-child .secondary-line').classList.contains('no-icon')).toBe(true);

        expect(symbolsView.element.querySelector('li:nth-child(2) .primary-line').classList.contains('icon-key')).toBe(true);
        expect(symbolsView.element.querySelector('li:nth-child(3) .primary-line').classList.contains('icon-gear')).toBe(true);
        expect(symbolsView.element.querySelector('li:nth-child(4) .primary-line').classList.contains('icon-tag')).toBe(true);

        // Simulate lack of icon on a random element.
        expect(symbolsView.element.querySelector('li:nth-child(5) .primary-line').classList.contains('no-icon')).toBe(true);
      });
    });
  });

  describe('when going to declaration', () => {
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
    });

    describe('when no declaration is found', () => {
      beforeEach(async () => {
        registerProvider(EmptyProvider);
        editor = atom.workspace.getActiveTextEditor();
      });

      it("doesn't move the cursor", async () => {
        await activationPromise;
        editor.setCursorBufferPosition([0, 2]);
        atom.commands.dispatch(getEditorView(), 'symbols-view:toggle-project-symbols');
        await wait(100);

        expect(editor.getCursorBufferPosition()).toEqual([0, 2]);
      });
    });

    describe('when there is a single matching declaration', () => {
      beforeEach(async () => {
        registerProvider(TaggedProvider);
        await atom.workspace.open(directory.resolve('tagged.js'));
        editor = atom.workspace.getActiveTextEditor();
      });

      it('moves the cursor to the declaration', async () => {
        editor.setCursorBufferPosition([6, 24]);
        spyOn(SymbolsView.prototype, 'moveToPosition').andCallThrough();

        atom.commands.dispatch(getEditorView(), 'symbols-view:go-to-declaration');

        await conditionPromise(() => {
          return SymbolsView.prototype.moveToPosition.callCount === 1;
        });
        expect(editor.getCursorBufferPosition()).toEqual([2, 0]);
      });
    });

    describe('when there is more than one matching declaration', () => {
      beforeEach(async () => {
        registerProvider(TaggedProvider);
        TaggedProvider.mockResultCount = 2;
        TaggedProvider.mockFileName = 'other-file.js';
        await atom.workspace.open(directory.resolve('tagged.js'));
        editor = atom.workspace.getActiveTextEditor();
        await activationPromise;
      });

      afterEach(() => {
        TaggedProvider.reset();
      });

      it('displays matches and opens the selected match', async () => {
        editor.setCursorBufferPosition([8, 14]);
        atom.commands.dispatch(getEditorView(), 'symbols-view:go-to-declaration');
        symbolsView = getSymbolsView();

        await conditionPromise(() => {
          return symbolsView.element.querySelectorAll('li').length > 0;
        });

        expect(choiceCount(symbolsView)).toBe(2);
        expect(symbolsView.element).toBeVisible();
        spyOn(SymbolsView.prototype, 'moveToPosition').andCallThrough();
        symbolsView.selectListView.confirmSelection();

        await conditionPromise(() => {
          return SymbolsView.prototype.moveToPosition.callCount === 1;
        });

        editor = atom.workspace.getActiveTextEditor();

        expect(
          atom.workspace.getActiveTextEditor().getPath()
        ).toBe(directory.resolve('other-file.js'));

        expect(
          atom.workspace.getActiveTextEditor().getCursorBufferPosition()
        ).toEqual([2, 0]);
      });
    });
  });

  describe('when returning from declaration', () => {
    describe('in the same file', () => {
      beforeEach(async () => {
        registerProvider(TaggedProvider);
        await atom.workspace.open(directory.resolve('tagged.js'));
        await activationPromise;
        editor = atom.workspace.getActiveTextEditor();
      });

      it("doesn't do anything when no go-tos have been triggered", async () => {
        editor.setCursorBufferPosition([6, 0]);
        atom.commands.dispatch(getEditorView(), 'symbols-view:return-from-declaration');

        expect(editor.getCursorBufferPosition()).toEqual([6, 0]);
      });

      it('returns to the previous row and column', async () => {
        editor.setCursorBufferPosition([6, 24]);
        editor = atom.workspace.getActiveTextEditor();
        spyOn(SymbolsView.prototype, 'moveToPosition').andCallThrough();
        atom.commands.dispatch(getEditorView(), 'symbols-view:go-to-declaration');

        await conditionPromise(() => {
          return SymbolsView.prototype.moveToPosition.callCount === 1;
        });

        expect(getEditor()).toBe(editor);

        expect(getEditor().getCursorBufferPosition()).toEqual([2, 0]);
        atom.commands.dispatch(getEditorView(), 'symbols-view:return-from-declaration');

        await conditionPromise(() => SymbolsView.prototype.moveToPosition.callCount === 2);
        expect(getEditor().getCursorBufferPosition()).toEqual([6, 24]);
      });
    });

    describe('in a different file', () => {
      beforeEach(async () => {
        registerProvider(TaggedProvider);
        await atom.workspace.open(directory.resolve('sample.js'));
        await activationPromise;
        editor = atom.workspace.getActiveTextEditor();
      });

      it("doesn't do anything when no go-tos have been triggered", async () => {
        editor.setCursorBufferPosition([6, 0]);
        atom.commands.dispatch(getEditorView(), 'symbols-view:return-from-declaration');

        expect(editor.getCursorBufferPosition()).toEqual([6, 0]);
      });

      it('returns to the previous row and column', async () => {
        editor.setCursorBufferPosition([6, 24]);
        editor = atom.workspace.getActiveTextEditor();
        spyOn(SymbolsView.prototype, 'moveToPosition').andCallThrough();
        atom.commands.dispatch(getEditorView(), 'symbols-view:go-to-declaration');

        await conditionPromise(() => {
          return SymbolsView.prototype.moveToPosition.callCount === 1;
        });

        expect(getEditor()).not.toBe(editor);

        expect(getEditor().getCursorBufferPosition()).toEqual([2, 0]);
        atom.commands.dispatch(getEditorView(), 'symbols-view:return-from-declaration');

        await conditionPromise(() => SymbolsView.prototype.moveToPosition.callCount === 2);

        expect(getEditor()).toBe(editor);
        expect(getEditor().getCursorBufferPosition()).toEqual([6, 24]);
      });

      it('returns to a different file when the file was already open', async () => {
        editor.setCursorBufferPosition([6, 24]);
        editor = atom.workspace.getActiveTextEditor();
        spyOn(SymbolsView.prototype, 'moveToPosition').andCallThrough();
        atom.commands.dispatch(getEditorView(), 'symbols-view:go-to-declaration');

        await conditionPromise(() => {
          return SymbolsView.prototype.moveToPosition.callCount === 1;
        });

        expect(getEditor()).not.toBe(editor);
        let editorPath = editor.getPath();
        let editorId = editor.id;
        atom.workspace.getActivePane().destroyItem(editor);

        expect(getEditor().getCursorBufferPosition()).toEqual([2, 0]);
        atom.commands.dispatch(getEditorView(), 'symbols-view:return-from-declaration');

        await conditionPromise(() => SymbolsView.prototype.moveToPosition.callCount === 2);

        // Make sure this is a different instance of TextEditor for the same
        // path.
        expect(getEditor().getPath()).toBe(editorPath);
        expect(getEditor().id).not.toBe(editorId);
        expect(getEditor().getCursorBufferPosition()).toEqual([6, 24]);
      });
    });
  });

  describe('when toggling project symbols', () => {
    beforeEach(async () => {
      await atom.workspace.open(directory.resolve('sample.js'));
      editor = atom.workspace.getActiveTextEditor();
    });

    it('displays all symbols', async () => {
      registerProvider(DummyProvider);
      await activationPromise;
      await dispatchAndWaitForChoices('symbols-view:toggle-project-symbols');
      symbolsView = atom.workspace.getModalPanels()[0].item;

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(symbolsView.element.querySelectorAll('li').length).toBe(5);

      let root = atom.project.getPaths()[1];
      let resolved = directory.resolve('other-file.js');
      let relative = `${path.basename(root)}${resolved.replace(root, '')}`;

      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Symbol on Row 1');
      expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText(`${relative}:1`);
      expect(symbolsView.element.querySelector('li:last-child .primary-line')).toHaveText('Symbol on Row 13');
      expect(symbolsView.element.querySelector('li:last-child .secondary-line')).toHaveText(`${relative}:13`);
    });

    it('prefills the query field if `prefillSelectedText` is `true`', async () => {
      atom.config.set('symbols-view.prefillSelectedText', true);
      registerProvider(DummyProvider);
      await activationPromise;
      spyOn(editor, 'getSelectedText').andReturn('Symbol on Row 13');
      await dispatchAndWaitForChoices('symbols-view:toggle-project-symbols');
      symbolsView = getSymbolsView();

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(symbolsView.element.querySelectorAll('li').length).toBe(1);

      let root = atom.project.getPaths()[1];
      let resolved = directory.resolve('other-file.js');
      let relative = `${path.basename(root)}${resolved.replace(root, '')}`;

      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Symbol on Row 13');
      expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText(`${relative}:13`);
    });

    it('does not prefill the query field if `prefillSelectedText` is `false`', async () => {
      atom.config.set('symbols-view.prefillSelectedText', false);
      registerProvider(DummyProvider);
      await activationPromise;
      spyOn(editor, 'getSelectedText').andReturn('Symbol on Row 13');
      await dispatchAndWaitForChoices('symbols-view:toggle-project-symbols');
      symbolsView = atom.workspace.getModalPanels()[0].item;

      expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
      expect(document.body.contains(symbolsView.element)).toBe(true);
      expect(symbolsView.element.querySelectorAll('li').length).toBe(5);

      let root = atom.project.getPaths()[1];
      let resolved = directory.resolve('other-file.js');
      let relative = `${path.basename(root)}${resolved.replace(root, '')}`;

      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Symbol on Row 1');
      expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText(`${relative}:1`);
      expect(symbolsView.element.querySelector('li:last-child .primary-line')).toHaveText('Symbol on Row 13');
      expect(symbolsView.element.querySelector('li:last-child .secondary-line')).toHaveText(`${relative}:13`);
    });

    it('asks for new symbols when the user starts typing', async () => {
      registerProvider(ProgressiveProjectProvider);
      spyOn(ProgressiveProjectProvider, 'getSymbols').andCallThrough();
      await activationPromise;
      atom.commands.dispatch(getEditorView(), 'symbols-view:toggle-project-symbols');
      symbolsView = atom.workspace.getModalPanels()[0].item;
      await wait(2000);

      expect(symbolsView.element.querySelectorAll('li .primary-line').length).toBe(0);
      expect(ProgressiveProjectProvider.getSymbols.callCount).toBe(1);

      expect(symbolsView.selectListView.props.emptyMessage).toBe('Query must be at least 3 characters long.');

      await symbolsView.updateView({ query: 'lor' });
      await wait(2000);

      expect(symbolsView.selectListView.props.emptyMessage).toBeNull();

      expect(symbolsView.element.querySelectorAll('li .primary-line').length).toBe(1);
      expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('Lorem ipsum');
      expect(ProgressiveProjectProvider.getSymbols.callCount).toBe(2);
    });

    describe('when there is only one project', () => {
      beforeEach(() => {
        atom.project.setPaths([directory.getPath()]);
      });

      it("does not include the root directory's name when displaying the symbol's filename", async () => {
        registerProvider(TaggedProvider);
        await atom.workspace.open(directory.resolve('tagged.js'));
        await activationPromise;
        expect(getWorkspaceView().querySelector('.symbols-view')).toBeNull();
        await dispatchAndWaitForChoices('symbols-view:toggle-project-symbols');
        symbolsView = getSymbolsView();

        expect(choiceCount(symbolsView)).toBe(1);

        expect(symbolsView.element.querySelector('li:first-child .primary-line')).toHaveText('callMeMaybe');
        expect(symbolsView.element.querySelector('li:first-child .secondary-line')).toHaveText('tagged.js:3');
      });
    });

    describe('when selecting a tag', () => {
      describe("when the file doesn't exist", () => {
        beforeEach(async () => fs.removeSync(directory.resolve('tagged.js')));

        it("doesn't open the editor", async () => {
          registerProvider(TaggedProvider);
          await activationPromise;
          await dispatchAndWaitForChoices('symbols-view:toggle-project-symbols');
          symbolsView = getSymbolsView();

          spyOn(atom.workspace, 'open').andCallThrough();

          symbolsView.element.querySelector('li:first-child').click();

          await conditionPromise(() => symbolsView.selectListView.refs.errorMessage);

          expect(atom.workspace.open).not.toHaveBeenCalled();
          expect(
            symbolsView.selectListView.refs.errorMessage.textContent.length
          ).toBeGreaterThan(0);
        });
      });
    });

    describe('match highlighting', () => {
      beforeEach(async () => {
        await atom.workspace.open(directory.resolve('sample.js'));
        editor = atom.workspace.getActiveTextEditor();
        registerProvider(QuicksortProvider);
      });

      it('highlights an exact match', async () => {
        await activationPromise;
        await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');

        symbolsView = getSymbolsView();
        symbolsView.selectListView.refs.queryEditor.setText('quicksort');
        await getOrScheduleUpdatePromise();
        let resultView = symbolsView.element.querySelector('.selected');
        let matches = resultView.querySelectorAll('.character-match');
        expect(matches.length).toBe(1);
        expect(matches[0].textContent).toBe('quicksort');
      });

      it('highlights a partial match', async () => {
        await activationPromise;
        await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
        symbolsView = getSymbolsView();

        symbolsView.selectListView.refs.queryEditor.setText('quick');
        await getOrScheduleUpdatePromise();

        let resultView = symbolsView.element.querySelector('.selected');
        let matches = resultView.querySelectorAll('.character-match');
        expect(matches.length).toBe(1);
        expect(matches[0].textContent).toBe('quick');
      });

      it('highlights multiple matches in the symbol name', async () => {
        await activationPromise;
        await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
        symbolsView = getSymbolsView();

        symbolsView.selectListView.refs.queryEditor.setText('quicort');
        await getOrScheduleUpdatePromise();

        let resultView = symbolsView.element.querySelector('.selected');
        let matches = resultView.querySelectorAll('.character-match');
        expect(matches.length).toBe(2);
        expect(matches[0].textContent).toBe('quic');
        expect(matches[1].textContent).toBe('ort');
      });
    });

    describe('when quickJumpToSymbol is true', () => {
      beforeEach(async () => {
        await atom.workspace.open(directory.resolve('sample.js'));
        editor = atom.workspace.getActiveTextEditor();
        languageMode = editor.getBuffer().getLanguageMode();
        if (languageMode.ready) await languageMode.ready;
      });

      it('jumps to the selected function', async () => {
        registerProvider(DummyProvider);
        await activationPromise;
        editor = atom.workspace.getActiveTextEditor();
        expect(editor.getCursorBufferPosition()).toEqual([0, 0]);
        await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
        symbolsView = getSymbolsView();

        symbolsView.selectListView.selectNext();

        expect(editor.getCursorBufferPosition()).toEqual([3, 4]);
      });

      // NOTE: If this test fails, could it have been because you opened the
      // dev tools console? That seems to break it on a reliable basis. Not
      // sure why yet.
      it('restores previous editor state on cancel', async () => {
        atom.config.set('symbols-view.prefillSelectedText', false);
        registerProvider(DummyProvider);
        await activationPromise;
        const bufferRanges = [{start: {row: 0, column: 0}, end: {row: 0, column: 3}}];
        editor = atom.workspace.getActiveTextEditor();
        editor.setSelectedBufferRanges(bufferRanges);

        await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
        symbolsView = getSymbolsView();

        symbolsView.selectListView.selectNext();
        expect(editor.getCursorBufferPosition()).toEqual([3, 4]);

        await symbolsView.cancel();
        expect(editor.getSelectedBufferRanges()).toEqual(bufferRanges);
      });
    });

    describe('when quickJumpToSymbol is false', () => {
      beforeEach(async () => {
        atom.config.set('symbols-view.quickJumpToFileSymbol', false);
        await atom.workspace.open(directory.resolve('sample.js'));
      });

      it("won't jump to the selected function", async () => {
        registerProvider(DummyProvider);
        await activationPromise;
        editor = atom.workspace.getActiveTextEditor();
        expect(editor.getCursorBufferPosition()).toEqual([0, 0]);

        await dispatchAndWaitForChoices('symbols-view:toggle-file-symbols');
        symbolsView = getSymbolsView();
        symbolsView.selectListView.selectNext();
        expect(editor.getCursorBufferPosition()).toEqual([0, 0]);
      });
    });
  });

  describe('when migrating legacy setting', () => {
    beforeEach(async () => {
      atom.config.set(
        'symbols-view.useEditorGrammarAsCtagsLanguage',
        false,
        { source: atom.config.getUserConfigPath() }
      );
      spyOn(atom.notifications, 'addInfo');
    });

    afterEach(async () => {
      atom.config.unset(
        'symbols-view.useEditorGrammarAsCtagsLanguage',
        { source: atom.config.getUserConfigPath() }
      );
    });

    it('migrates the setting as expected', () => {
      expect(
        atom.config.get('symbols-view.useEditorGrammarAsCtagsLanguage')
      ).toBe(false);

      migrateOldConfigIfNeeded({ force: true });

      expect(
        atom.config.get(
          'symbols-view.useEditorGrammarAsCtagsLanguage',
          { source: atom.config.getUserConfigPath() }
        )
      ).toBeUndefined();

      expect(
        atom.config.get(
          'symbol-provider-ctags.useEditorGrammarAsCtagsLanguage',
          { source: atom.config.getUserConfigPath() }
        )
      ).toBe(false);

      expect(atom.notifications.addInfo).not.toHaveBeenCalled();
    });

    describe('and a scope-specific override has been made for that setting', () => {
      beforeEach(() => {
        atom.config.set(
          'symbols-view.useEditorGrammarAsCtagsLanguage',
          true,
          {
            source: 'baz',
            scopeSelector: ['.source.ts']
          }
        );
      });

      afterEach(() => {
        atom.config.unset(
          'symbols-view.useEditorGrammarAsCtagsLanguage',
          {
            source: 'baz',
            scopeSelector: ['.source.ts']
          }
        );
      });

      it('alerts the user', () => {
        migrateOldConfigIfNeeded({ force: true });

        expect(atom.notifications.addInfo).toHaveBeenCalled();

        expect(
          atom.notifications.addInfo.mostRecentCall?.args[1].description
        ).toBe("The `symbols-view` package has migrated the setting `symbols-view.useEditorGrammarAsCtagsLanguage` to its new location inside the core package `symbol-provider-ctags`. If you have defined any scope-specific overrides for this setting, you’ll need to change those overrides manually.\n\nDetected overrides in the following locations:\n\n* `baz`");
      });
    });

  });
});
