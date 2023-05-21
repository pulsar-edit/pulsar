/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */


const path = require('path');
const PackageDetailView = require('../lib/package-detail-view');
const PackageManager = require('../lib/package-manager');
const SettingsView = require('../lib/settings-view');
const PackageKeymapView = require('../lib/package-keymap-view');
const PackageSnippetsView = require('../lib/package-snippets-view');
const _ = require('underscore-plus');

let SnippetsProvider = {
  getSnippets() {
    return atom.config.scopedSettingsStore.propertySets;
  }
};

describe("InstalledPackageView", function() {
  beforeEach(() => {
    spyOn(PackageManager.prototype, 'loadCompatiblePackageVersion')
      .andCallFake(() => {});
  });

  it("displays the grammars registered by the package", () => {
    let settingsPanels = null;

    waitsForPromise(() => {
      return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
    });

    runs(() => {
      const pack = atom.packages.getActivePackage('language-test');
      const view = new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);
      settingsPanels = view.element.querySelectorAll('.package-grammars .settings-panel');

      waitsFor(() => {
        const children = Array.from(settingsPanels).map(s => s.children.length);
        const childrenCount = children.reduce(((a, b) => a + b), 0);
        return childrenCount === 2;
      });

      expect(
        settingsPanels[0].querySelector('.grammar-scope').textContent
      ).toBe('Scope: source.a');
      expect(
        settingsPanels[0].querySelector('.grammar-filetypes'
      ).textContent).toBe('File Types: .a, .aa, a');

      expect(
        settingsPanels[1].querySelector('.grammar-scope').textContent
      ).toBe('Scope: source.b');
      expect(
        settingsPanels[1].querySelector('.grammar-filetypes').textContent
      ).toBe('File Types: ');

      expect(settingsPanels[2]).toBeUndefined();
    });
  });

  it("displays the snippets registered by the package", () => {
    let snippetsTable = null;
    let snippetsModule = null;

    // Relies on behavior not present in the snippets package before 1.103.
    const shouldRunScopeTest = parseFloat(atom.getVersion()) >= 1.103;

    waitsForPromise(() => {
      return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
    });

    waitsForPromise(() => {
      return atom.packages.activatePackage('snippets').then((p) => {
        snippetsModule = p.mainModule;
        if (snippetsModule.provideSnippets().getUnparsedSnippets == null) {
          return;
        }

        SnippetsProvider = {
          getSnippets() {
            return snippetsModule.provideSnippets().getUnparsedSnippets();
          }
        };
      });
    });

    waitsFor('snippets to load', () => {
      return snippetsModule.provideSnippets().bundledSnippetsLoaded();
    });

    runs(() => {
      const pack = atom.packages.getActivePackage('language-test');
      const view = new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);
      snippetsTable = view.element.querySelector('.package-snippets-table tbody');
    });

    waitsFor('snippets table children to contain 2 items', () => {
      return snippetsTable.children.length >= 2;
    });

    runs(() => {
      expect(
        snippetsTable.querySelector('tr:nth-child(1) td:nth-child(1)').textContent
      ).toBe('b');
      if (shouldRunScopeTest) {
        expect(
          snippetsTable.querySelector('tr:nth-child(1) td:nth-child(2)').textContent
        ).toBe('language-test:sample-command');
      }
      expect(
        snippetsTable.querySelector('tr:nth-child(1) td:nth-child(3)'
      ).textContent).toBe('BAR');

      if (shouldRunScopeTest) {
        expect(
          snippetsTable.querySelector('tr:nth-child(1) td.snippet-scope-name').textContent
        ).toBe('.source.b');
      }

      expect(
        snippetsTable.querySelector('tr:nth-child(2) td:nth-child(1)').textContent
      ).toBe('f');

      //if (shouldRunScopeTest) { # TODO FIX
      //  expect(
      //    snippetsTable.querySelector('tr:nth-child(1) td:nth-child(2)').textContent
      //  ).toBe('');
      //}
      expect(
        snippetsTable.querySelector('tr:nth-child(2) td:nth-child(3)').textContent
      ).toBe('FOO');

      if (shouldRunScopeTest) {
        expect(
          snippetsTable.querySelector('tr:nth-child(2) td.snippet-scope-name').textContent
        ).toBe('.source.a, .source.aa');
      }
    });
  });

  describe("when a snippet body is viewed", () =>
    it("shows a tooltip", () => {
      let view = null;
      let snippetsTable = null;
      let snippetsModule = null;

      waitsForPromise(() => {
        return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
      });

      waitsForPromise(() =>
        atom.packages.activatePackage('snippets').then((p) => {
          snippetsModule = p.mainModule;
          if (snippetsModule.provideSnippets().getUnparsedSnippets == null) {
            return;
          }

          SnippetsProvider = {
            getSnippets() {
              return snippetsModule.provideSnippets().getUnparsedSnippets();
            }
          };
        })
      );

      waitsFor('snippets to load', () => {
        return snippetsModule.provideSnippets().bundledSnippetsLoaded();
      });

      runs(() => {
        const pack = atom.packages.getActivePackage('language-test');
        view = new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);
        snippetsTable = view.element.querySelector('.package-snippets-table tbody');
      });

      waitsFor('snippets table children to contain 2 items', () => snippetsTable.children.length >= 2);

      runs(() => {
        expect(
          view.element.ownerDocument.querySelector('.snippet-body-tooltip')
        ).not.toExist();

        view.element.querySelector(
          '.package-snippets-table tbody tr:nth-child(1) td.snippet-body .snippet-view-btn'
        ).click();

        expect(
          view.element.ownerDocument.querySelector('.snippet-body-tooltip')
        ).toExist();
      });
    })
  );


  // Relies on behavior not present in the snippets package before 1.33.
  // TODO: These tests should always run once 1.33 is released.
  if (parseFloat(atom.getVersion()) >= 1.33) {
    describe("when a snippet is copied", () => {
      let pack, card;
      let snippetsTable = null;
      let snippetsModule = null;

      beforeEach(() => {
        waitsForPromise(() => {
          return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
        });

        waitsForPromise(() => {
          return atom.packages.activatePackage('snippets').then((p) => {
            snippetsModule = p.mainModule;
            if (snippetsModule.provideSnippets().getUnparsedSnippets == null) {
              return;
            }

            SnippetsProvider = {
              getSnippets() {
                return snippetsModule.provideSnippets().getUnparsedSnippets();
              },
              getUserSnippetsPath: () => snippetsModule.getUserSnippetsPath()
            };
          });
        });

        waitsFor('snippets to load', () => {
          return snippetsModule.provideSnippets().bundledSnippetsLoaded();
        });

        runs(() => {
          pack = atom.packages.getActivePackage('language-test');
          card = new PackageSnippetsView(pack, SnippetsProvider);
          snippetsTable = card.element.querySelector('.package-snippets-table tbody');
        });

        waitsFor('snippets table children to contain 2 items', () => snippetsTable.children.length >= 2);
      });

      describe("when the snippets file ends in .cson", () =>
        it("writes a CSON snippet to the clipboard", () => {
          spyOn(SnippetsProvider, 'getUserSnippetsPath').andReturn('snippets.cson');
          card.element.querySelector(
            '.package-snippets-table tbody tr:nth-child(1) td.snippet-body .snippet-copy-btn'
          ).click();
          expect(atom.clipboard.read()).toBe(`\
\n'.b.source':
  'BAR':
    'prefix': 'b'
    'body': 'bar?\\nline two'\n\
`
          );
        })
      );

      describe("when the snippets file ends in .json", () =>
        it("writes a JSON snippet to the clipboard", () => {
          spyOn(SnippetsProvider, 'getUserSnippetsPath').andReturn('snippets.json');
          card.element.querySelector(
            '.package-snippets-table tbody tr:nth-child(1) td.snippet-body .btn:nth-child(2)'
          ).click();
          expect(atom.clipboard.read()).toBe(`\
\n  ".b.source": {
    "BAR": {
      "prefix": "b",
      "body": "bar?\\nline two"
    }
  }\n\
`
          );
        })
      );
    });
  }


  describe("when the snippets toggle is clicked", () =>
    it("sets the packagesWithSnippetsDisabled config to include the package name", function() {
      let pack, card;
      let snippetsModule = null;

      waitsForPromise(() => {
        return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
      });

      waitsForPromise(() =>
        atom.packages.activatePackage('snippets').then((p) => {
          snippetsModule = p.mainModule;
          if (snippetsModule.provideSnippets().getUnparsedSnippets == null) {
            return;
          }

          return SnippetsProvider = {
            getSnippets() {
              return snippetsModule.provideSnippets().getUnparsedSnippets();
            }
          };
        })
      );

      waitsFor('snippets to load', () => {
        return snippetsModule.provideSnippets().bundledSnippetsLoaded();
      });

      runs(() => {
        pack = atom.packages.getActivePackage('language-test');
        card = new PackageSnippetsView(pack, SnippetsProvider);
        jasmine.attachToDOM(card.element);

        card.refs.snippetToggle.click();
        expect(card.refs.snippetToggle.checked).toBe(false);
        let disabledSnippetsPackages = atom.config.get('core.packagesWithSnippetsDisabled') || [];
        expect(
          _.include(disabledSnippetsPackages, 'language-test')
        ).toBe(true);
      });

      waitsFor('snippets table to update', () => {
        return card.refs.snippets.classList.contains('text-subtle');
      });

      runs(() => {
        card.refs.snippetToggle.click();
        expect(card.refs.snippetToggle.checked).toBe(true);
        let disabledSnippetsPackages = atom.config.get('core.packagesWithSnippetsDisabled') || [];
        expect(
          _.include(disabledSnippetsPackages, 'language-test')
        ).toBe(false);
      });

      waitsFor('snippets table to update', () => {
        return !card.refs.snippets.classList.contains('text-subtle');
      });
    })
  );

  it("does not display keybindings from other platforms", () => {
    let keybindingsTable = null;

    waitsForPromise(() => {
      return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
    });

    runs(() => {
      const pack = atom.packages.getActivePackage('language-test');
      const view = new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);
      keybindingsTable = view.element.querySelector('.package-keymap-table tbody');
      expect(keybindingsTable.children.length).toBe(1);
    });
  });

  describe("when the keybindings toggle is clicked", () =>
    it("sets the packagesWithKeymapsDisabled config to include the package name", () => {
      waitsForPromise(() => {
        return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
      });

      runs(() => {
        let keybindingRows;
        const pack = atom.packages.getActivePackage('language-test');
        const card = new PackageKeymapView(pack);
        jasmine.attachToDOM(card.element);

        card.refs.keybindingToggle.click();
        expect(card.refs.keybindingToggle.checked).toBe(false);
        let disabledKeymapsPackages = atom.config.get('core.packagesWithKeymapsDisabled') || [];
        expect(
          _.include(disabledKeymapsPackages, 'language-test')
        ).toBe(true);

        if (atom.keymaps.build) {
          keybindingRows = card.element.querySelectorAll('.package-keymap-table tbody.text-subtle tr');
          expect(keybindingRows.length).toBe(1);
        }

        card.refs.keybindingToggle.click();
        expect(card.refs.keybindingToggle.checked).toBe(true);
        disabledKeymapsPackages = atom.config.get('core.packagesWithKeymapsDisabled') || [];

        expect(
          _.include(disabledKeymapsPackages, 'language-test')
        ).toBe(false);

        if (atom.keymaps.build) {
          keybindingRows = card.element.querySelectorAll('.package-keymap-table tbody tr');
          expect(keybindingRows.length).toBe(1);
        }
      });
    })
  );

  describe("when a keybinding is copied", () => {
    let [pack, card] = Array.from([]);

    beforeEach(() => {
      waitsForPromise(() => {
        return atom.packages.activatePackage(path.join(__dirname, 'fixtures', 'language-test'));
      });

      runs(() => {
        pack = atom.packages.getActivePackage('language-test');
        card = new PackageKeymapView(pack);
      });
    });

    describe("when the keybinding file ends in .cson", () =>
      it("writes a CSON snippet to the clipboard", () => {
        spyOn(atom.keymaps, 'getUserKeymapPath').andReturn('keymap.cson');
        card.element.querySelector('.copy-icon').click();
        expect(atom.clipboard.read()).toBe(`\
'test':
  'cmd-g': 'language-test:run'\
`
        );
      })
    );

    describe("when the keybinding file ends in .json", () => {
      it("writes a JSON snippet to the clipboard", () => {
        spyOn(atom.keymaps, 'getUserKeymapPath').andReturn('keymap.json');
        card.element.querySelector('.copy-icon').click();
        expect(atom.clipboard.read()).toBe(`\
"test": {
  "cmd-g": "language-test:run"
}\
`
        );
      });
    });
  });

  describe("when the package is active", () =>
    it("displays the correct enablement state", () => {
      let packageCard = null;

      waitsForPromise(() => {
        return atom.packages.activatePackage('status-bar');
      });

      runs(() => {
        expect(atom.packages.isPackageActive('status-bar')).toBe(true);
        const pack = atom.packages.getLoadedPackage('status-bar');
        const view = new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);
        packageCard = view.element.querySelector('.package-card');
      });

      runs(() => {
        // Trigger observeDisabledPackages() here
        // because it is not default in specs
        atom.packages.observeDisabledPackages();
        atom.packages.disablePackage('status-bar');
        expect(atom.packages.isPackageDisabled('status-bar')).toBe(true);
        expect(packageCard.classList.contains('disabled')).toBe(true);
      });
    })
  );

  describe("when the package is not active", () => {
    it("displays the correct enablement state", () => {
      atom.packages.loadPackage('status-bar');
      expect(atom.packages.isPackageActive('status-bar')).toBe(false);
      const pack = atom.packages.getLoadedPackage('status-bar');
      const view = new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);
      const packageCard = view.element.querySelector('.package-card');

      // Trigger observeDisabledPackages() here
      // because it is not default in specs
      atom.packages.observeDisabledPackages();
      atom.packages.disablePackage('status-bar');
      expect(atom.packages.isPackageDisabled('status-bar')).toBe(true);
      expect(packageCard.classList.contains('disabled')).toBe(true);
    });

    it("still loads the config schema for the package", () => {
      atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-config'));

      waitsFor(() => atom.packages.isPackageLoaded('package-with-config') === true);

      runs(() => {
        expect(atom.config.get('package-with-config.setting')).toBe(undefined);

        const pack = atom.packages.getLoadedPackage('package-with-config');
        new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);

        expect(atom.config.get('package-with-config.setting')).toBe('something');
      });
    });
  });

  describe("when the package was not installed from atom.io", () => {
    const normalizePackageDataReadmeError = 'ERROR: No README data found!';

    it("still displays the Readme", () => {
      atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-readme'));

      waitsFor(() => {
        return atom.packages.isPackageLoaded('package-with-readme') === true;
      });

      runs(() => {
        const pack = atom.packages.getLoadedPackage('package-with-readme');
        expect(pack.metadata.readme).toBe(normalizePackageDataReadmeError);

        const view = new PackageDetailView(pack, new SettingsView(), new PackageManager(), SnippetsProvider);
        expect(
          view.refs.sections.querySelector('.package-readme').textContent
        ).not.toBe(normalizePackageDataReadmeError);
        expect(
          view.refs.sections.querySelector('.package-readme').textContent.trim()
        ).toContain('I am a Readme!');
      });
    });
  });
});
