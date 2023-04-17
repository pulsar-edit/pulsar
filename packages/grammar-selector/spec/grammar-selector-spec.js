const path = require('path');
const SelectListView = require('atom-select-list');

describe('GrammarSelector', () => {
  let [editor, textGrammar, jsGrammar] = [];

  beforeEach(async () => {
    jasmine.attachToDOM(atom.views.getView(atom.workspace));
    atom.config.set('grammar-selector.showOnRightSideOfStatusBar', false);
    atom.config.set('grammar-selector.hideDuplicateTextMateGrammars', false);

    await atom.packages.activatePackage('status-bar');
    await atom.packages.activatePackage('grammar-selector');
    await atom.packages.activatePackage('language-text');
    await atom.packages.activatePackage('language-javascript');
    await atom.packages.activatePackage(
      path.join(__dirname, 'fixtures', 'language-with-no-name')
    );

    editor = await atom.workspace.open(path.join(__dirname, 'fixtures', 'sample.js'));

    textGrammar = atom.grammars.grammarForScopeName('text.plain');
    expect(textGrammar).toBeTruthy();
    jsGrammar = atom.grammars.grammarForScopeName('source.js');
    expect(jsGrammar).toBeTruthy();
    expect(editor.getGrammar()).toBe(jsGrammar);

    atom.config.set('core.languageParser', 'textmate');
  });

  describe('when grammar-selector:show is triggered', () =>
    it('displays a list of all the available grammars', async () => {
      const grammarView = (await getGrammarView(editor)).element;

      // -1 for removing nullGrammar, +1 for adding "Auto Detect"
      // Tree-sitter names the regex and JSDoc grammars
      expect(grammarView.querySelectorAll('li').length).toBe(
        atom.grammars
          .getGrammars({ includeTreeSitter: true })
          .filter(g => g.name).length
      );
      expect(grammarView.querySelectorAll('li')[0].textContent).toBe(
        'Auto Detect'
      );
      expect(grammarView.textContent.includes('source.a')).toBe(false);
      grammarView
        .querySelectorAll('li')
        .forEach(li =>
          expect(li.textContent).not.toBe(atom.grammars.nullGrammar.name)
        );
      expect(grammarView.textContent.includes('Tree-sitter')).toBe(true); // check we are showing and labelling Tree-sitter grammars
    }));

  describe('when a grammar is selected', () =>
    it('sets the new grammar on the editor', async () => {
      const grammarView = await getGrammarView(editor);
      grammarView.props.didConfirmSelection(textGrammar);
      expect(editor.getGrammar()).toBe(textGrammar);
    }));

  describe('when auto-detect is selected', () => {
    it('restores the auto-detected grammar on the editor (when core.languageParser is textmate)', async () => {
      let grammarView = await getGrammarView(editor);
      grammarView.props.didConfirmSelection(textGrammar);
      expect(editor.getGrammar()).toBe(textGrammar);
      grammarView = await getGrammarView(editor);
      grammarView.props.didConfirmSelection(grammarView.items[0]);
      let currentGrammar = editor.getGrammar();
      expect(currentGrammar.scopeName).toBe('source.js');
      expect(currentGrammar.constructor.name).toBe('Grammar');
    });

    it('restores the auto-detected grammar on the editor (when core.languageParser is node-tree-sitter)', async () => {
      atom.config.set('core.languageParser', 'node-tree-sitter');
      let grammarView = await getGrammarView(editor);
      grammarView.props.didConfirmSelection(textGrammar);
      expect(editor.getGrammar()).toBe(textGrammar);
      grammarView = await getGrammarView(editor);
      grammarView.props.didConfirmSelection(grammarView.items[0]);
      let currentGrammar = editor.getGrammar();
      expect(currentGrammar.scopeName).toBe('source.js');
      expect(currentGrammar.constructor.name).toBe('TreeSitterGrammar');
    });
  });

  describe("when the editor's current grammar is the null grammar", () =>
    it('displays Auto Detect as the selected grammar', async () => {
      editor.setGrammar(atom.grammars.nullGrammar);
      const grammarView = (await getGrammarView(editor)).element;
      expect(grammarView.querySelector('li.active').textContent).toBe(
        'Auto Detect'
      );
    }));

  describe('when editor is untitled', () =>
    it('sets the new grammar on the editor', async () => {
      editor = await atom.workspace.open();
      expect(editor.getGrammar()).not.toBe(jsGrammar);

      const grammarView = await getGrammarView(editor);
      grammarView.props.didConfirmSelection(jsGrammar);
      expect(editor.getGrammar()).toBe(jsGrammar);
    }));

  describe('Status bar grammar label', () => {
    let [grammarStatus, grammarTile, statusBar] = [];

    beforeEach(async () => {
      statusBar = document.querySelector('status-bar');
      [grammarTile] = statusBar.getLeftTiles().slice(-1);
      grammarStatus = grammarTile.getItem();

      // Wait for status bar service hook to fire
      while (!grammarStatus || !grammarStatus.textContent) {
        await atom.views.getNextUpdatePromise();
        grammarStatus = document.querySelector('.grammar-status');
      }
    });

    it('displays the name of the current grammar', () => {
      expect(grammarStatus.querySelector('a').textContent).toBe('JavaScript');
      expect(getTooltipText(grammarStatus)).toBe(
        'File uses the JavaScript grammar'
      );
    });

    it('displays Plain Text when the current grammar is the null grammar', async () => {
      editor.setGrammar(atom.grammars.nullGrammar);
      await atom.views.getNextUpdatePromise();

      expect(grammarStatus.querySelector('a').textContent).toBe('Plain Text');
      expect(grammarStatus).toBeVisible();
      expect(getTooltipText(grammarStatus)).toBe(
        'File uses the Plain Text grammar'
      );

      editor.setGrammar(atom.grammars.grammarForScopeName('source.js'));
      await atom.views.getNextUpdatePromise();

      expect(grammarStatus.querySelector('a').textContent).toBe('JavaScript');
      expect(grammarStatus).toBeVisible();
    });

    it('hides the label when the current grammar is null', async () => {
      jasmine.attachToDOM(editor.getElement());
      spyOn(editor, 'getGrammar').andReturn(null);
      editor.setGrammar(atom.grammars.nullGrammar);
      await atom.views.getNextUpdatePromise();
      expect(grammarStatus.offsetHeight).toBe(0);
    });

    describe('when the grammar-selector.showOnRightSideOfStatusBar setting changes', () =>
      it('moves the item to the preferred side of the status bar', () => {
        expect(statusBar.getLeftTiles().map(tile => tile.getItem())).toContain(
          grammarStatus
        );
        expect(
          statusBar.getRightTiles().map(tile => tile.getItem())
        ).not.toContain(grammarStatus);

        atom.config.set('grammar-selector.showOnRightSideOfStatusBar', true);

        expect(
          statusBar.getLeftTiles().map(tile => tile.getItem())
        ).not.toContain(grammarStatus);
        expect(statusBar.getRightTiles().map(tile => tile.getItem())).toContain(
          grammarStatus
        );

        atom.config.set('grammar-selector.showOnRightSideOfStatusBar', false);

        expect(statusBar.getLeftTiles().map(tile => tile.getItem())).toContain(
          grammarStatus
        );
        expect(
          statusBar.getRightTiles().map(tile => tile.getItem())
        ).not.toContain(grammarStatus);
      }));

    describe("when the editor's grammar changes", () =>
      it('displays the new grammar of the editor', async () => {
        editor.setGrammar(atom.grammars.grammarForScopeName('text.plain'));
        await atom.views.getNextUpdatePromise();

        expect(grammarStatus.querySelector('a').textContent).toBe('Plain Text');
        expect(getTooltipText(grammarStatus)).toBe(
          'File uses the Plain Text grammar'
        );

        editor.setGrammar(atom.grammars.grammarForScopeName('source.a'));
        await atom.views.getNextUpdatePromise();

        expect(grammarStatus.querySelector('a').textContent).toBe('source.a');
        expect(getTooltipText(grammarStatus)).toBe(
          'File uses the source.a grammar'
        );
      }));

    describe('when toggling hideDuplicateTextMateGrammars', () => {
      it('shows only the Tree-sitter if true and both exist', async () => {
        // the main JS grammar has both a TextMate and Tree-sitter implementation
        atom.config.set('grammar-selector.hideDuplicateTextMateGrammars', true);
        const grammarView = await getGrammarView(editor);
        const observedNames = new Set();
        grammarView.element.querySelectorAll('li').forEach(li => {
          const name = li.getAttribute('data-grammar');
          expect(observedNames.has(name)).toBe(false);
          observedNames.add(name);
        });

        // check the seen JS is actually the Tree-sitter one
        const list = atom.workspace.getModalPanels()[0].item;
        for (const item of list.items) {
          if (item.name === 'JavaScript') {
            expect(item.constructor.name === 'TreeSitterGrammar');
          }
        }
      });

      it('shows both if false (in proper order when core.languageParser is node-tree-sitter)', async () => {
        await atom.packages.activatePackage('language-c'); // punctuation making it sort wrong
        atom.config.set('core.languageParser', 'node-tree-sitter');
        atom.config.set(
          'grammar-selector.hideDuplicateTextMateGrammars',
          false
        );
        await getGrammarView(editor);
        let cppCount = 0;

        const listItems = atom.workspace.getModalPanels()[0].item.items;
        for (let i = 0; i < listItems.length; i++) {
          const grammar = listItems[i];
          const name = grammar.name;
          if (cppCount === 0 && name === 'C++') {
            // first C++ entry should be Tree-sitter
            expect(grammar.constructor.name).toBe('TreeSitterGrammar');
            cppCount++;
          } else if (cppCount === 1) {
            // immediate next grammar should be the TextMate version
            expect(name).toBe('C++');
            expect(grammar.constructor.name).toBe('Grammar');
            cppCount++;
          } else {
            expect(name).not.toBe('C++'); // there should not be any other C++ grammars
          }
        }

        expect(cppCount).toBe(2); // ensure we actually saw both grammars
      });

      it('shows both if false (in proper order when core.languageParser is textmate)', async () => {
        await atom.packages.activatePackage('language-c'); // punctuation making it sort wrong
        atom.config.set(
          'grammar-selector.hideDuplicateTextMateGrammars',
          false
        );
        await getGrammarView(editor);
        let cppCount = 0;

        const listItems = atom.workspace.getModalPanels()[0].item.items;
        for (let i = 0; i < listItems.length; i++) {
          const grammar = listItems[i];
          const name = grammar.name;
          if (cppCount === 0 && name === 'C++') {
            // first C++ entry should be TextMate
            expect(grammar.constructor.name).toBe('Grammar');
            cppCount++;
          } else if (cppCount === 1) {
            // immediate next grammar should be the Tree-sitter version
            expect(name).toBe('C++');
            expect(grammar.constructor.name).toBe('TreeSitterGrammar');
            cppCount++;
          } else {
            expect(name).not.toBe('C++'); // there should not be any other C++ grammars
          }
        }

        expect(cppCount).toBe(2); // ensure we actually saw both grammars
      });

    });


    describe('for every Tree-sitter grammar', () => {
      it('adds a label to identify it as Tree-sitter', async () => {
        const grammarView = await getGrammarView(editor);
        const elements = grammarView.element.querySelectorAll('li');
        const listItems = atom.workspace.getModalPanels()[0].item.items;
        for (let i = 0; i < listItems.length; i++) {
          if (listItems[i].constructor.name === 'TreeSitterGrammar') {
            expect(
              elements[i].childNodes[1].childNodes[0].className.startsWith(
                'grammar-selector-parser'
              )
            ).toBe(true);
          }
        }
      });
    });

    describe('when clicked', () =>
      it('shows the grammar selector modal', () => {
        const eventHandler = jasmine.createSpy('eventHandler');
        atom.commands.add(
          editor.getElement(),
          'grammar-selector:show',
          eventHandler
        );
        grammarStatus.click();
        expect(eventHandler).toHaveBeenCalled();
      }));

    describe('when the package is deactivated', () =>
      it('removes the view', () => {
        spyOn(grammarTile, 'destroy');
        atom.packages.deactivatePackage('grammar-selector');
        expect(grammarTile.destroy).toHaveBeenCalled();
      }));
  });

  // TODO: These tests will need to be altered when we remove legacy
  // tree-sitter altogether.
  describe('when core.languageParser is "wasm-tree-sitter"', () => {
    beforeEach(() => {
      atom.config.set('core.languageParser', 'wasm-tree-sitter');
    });

    describe('when grammar-selector:show is triggered', () => {
      it('displays a list of all the available grammars', async () => {
        const grammarView = (await getGrammarView(editor)).element;

        // -1 for removing nullGrammar, +1 for adding "Auto Detect"
        // Tree-sitter names the regex and JSDoc grammars
        expect(grammarView.querySelectorAll('li').length).toBe(
          atom.grammars
            .getGrammars({ includeTreeSitter: true })
            .filter(g => g.name).length
        );
        expect(grammarView.querySelectorAll('li')[0].textContent).toBe(
          'Auto Detect'
        );
        expect(grammarView.textContent.includes('source.a')).toBe(false);
        grammarView
          .querySelectorAll('li')
          .forEach(li =>
            expect(li.textContent).not.toBe(atom.grammars.nullGrammar.name)
          );
          // Ensure we're showing and labelling tree-sitter grammars…
          expect(grammarView.textContent.includes('Tree-sitter')).toBe(true);
          // …and old tree-sitter grammars.
          expect(grammarView.textContent.includes('Legacy Tree-sitter')).toBe(true);
      });
    });

    describe('when toggling hideDuplicateTextMateGrammars', () => {
      it('shows only the Tree-sitter if true and both exist', async () => {
        // the main JS grammar has both a TextMate and Tree-sitter implementation
        atom.config.set('grammar-selector.hideDuplicateTextMateGrammars', true);
        const grammarView = await getGrammarView(editor);
        const observedNames = new Map();
        // Show a maximum of two different kinds of grammar (both tree-sitter
        // variants).
        grammarView.element.querySelectorAll('li').forEach(li => {
          const name = li.getAttribute('data-grammar');
          if (!observedNames.has(name)) {
            observedNames.set(name, 0);
          }
          observedNames.set(name, observedNames.get(name) + 1);
          expect(observedNames.get(name) < 3).toBe(true, `found ${observedNames.get(name)} of ${name}`);
        });

        // check the seen JS is actually the Tree-sitter one
        const list = atom.workspace.getModalPanels()[0].item;
        for (const item of list.items) {
          if (item.name === 'JavaScript') {
            expect(item.constructor.name.includes('TreeSitterGrammar'));
          }
        }
      });

      it('shows both if false', async () => {
        await atom.packages.activatePackage('language-c'); // punctuation making it sort wrong
        atom.config.set(
          'grammar-selector.hideDuplicateTextMateGrammars',
          false
        );
        await getGrammarView(editor);
        let cppCount = 0;

        const listItems = atom.workspace.getModalPanels()[0].item.items;
        for (let i = 0; i < listItems.length; i++) {
          const grammar = listItems[i];
          const name = grammar.name;
          if (cppCount === 0 && name === 'C++') {
            expect(grammar.constructor.name).toBe('WASMTreeSitterGrammar'); // first C++ entry should be Modern Tree-sitter
            cppCount++;
          } else if (cppCount === 1) {
            expect(name).toBe('C++');
            expect(grammar.constructor.name).toBe('TreeSitterGrammar'); // second C++ entry should be Legacy Tree-sitter
            cppCount++;
          } else if (cppCount === 2) {
            expect(name).toBe('C++');
            expect(grammar.constructor.name).toBe('Grammar'); // immediate next grammar should be the TextMate version
            cppCount++;
          } else {
            expect(name).not.toBe('C++'); // there should not be any other C++ grammars
          }
        }

        expect(cppCount).toBe(3); // ensure we actually saw three grammars
      });
    });

    describe('for every Tree-sitter grammar', () => {
      it('adds a label to identify it as Tree-sitter', async () => {
        const grammarView = await getGrammarView(editor);
        const elements = grammarView.element.querySelectorAll('li');
        const listItems = atom.workspace.getModalPanels()[0].item.items;
        for (let i = 0; i < listItems.length; i++) {
          let item = listItems[i];
          let element = elements[i];
          if (item.constructor.name.includes('TreeSitterGrammar')) {
            expect(
              element.childNodes[1].childNodes[0].className.startsWith(
                'grammar-selector-parser'
              )
            ).toBe(true);
          }
          if (item.constructor.name === 'TreeSitterGrammar') {
            expect(
              element.childNodes[1].childNodes[0].classList.contains('badge-warning')
            ).toBe(true);
          } else if (item.constructor.name === 'WASMTreeSitterGrammar') {
            expect(
              element.childNodes[1].childNodes[0].classList.contains('badge-success')
            ).toBe(true);
          }
        }
      });
    });

  });

});

function getTooltipText(element) {
  const [tooltip] = atom.tooltips.findTooltips(element);
  return tooltip.getTitle();
}

async function getGrammarView(editor) {
  let timeout = setTimeout(() => {
    throw new Error('Timeout');
  }, 5000);
  console.log('dispatching…');
  atom.commands.dispatch(editor.getElement(), 'grammar-selector:show');
  await SelectListView.getScheduler().getNextUpdatePromise();
  console.log('…done.');
  clearTimeout(timeout);
  return atom.workspace.getModalPanels()[0].getItem();
}
