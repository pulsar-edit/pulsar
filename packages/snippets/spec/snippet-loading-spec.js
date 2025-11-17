const path = require('path');
const fs = require('fs');
const temp = require('temp').track();

describe("Snippet Loading", () => {
  let configDirPath, snippetsService;

  beforeEach(() => {
    configDirPath = temp.mkdirSync('atom-config-dir-');
    spyOn(atom, 'getConfigDirPath').andReturn(configDirPath);

    spyOn(console, 'warn');
    if (atom.notifications != null) { spyOn(atom.notifications, 'addError'); }

    spyOn(atom.packages, 'getLoadedPackages').andReturn([
      atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-snippets')),
      atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-broken-snippets')),
    ]);
  });

  afterEach(() => {
    waitsForPromise(() => Promise.resolve(atom.packages.deactivatePackages('snippets')));
    runs(() => {
      jasmine.unspy(atom.packages, 'getLoadedPackages');
    });
  });

  const activateSnippetsPackage = () => {
    waitsForPromise(() => atom.packages.activatePackage("snippets").then(({mainModule}) => {
      snippetsService = mainModule.provideSnippets();
      mainModule.loaded = false;
    }));

    waitsFor("all snippets to load", 3000, () => snippetsService.bundledSnippetsLoaded());
  };

  it("loads the bundled snippet template snippets", () => {
    activateSnippetsPackage();

    runs(() => {
      const jsonSnippet = snippetsService.snippetsForScopes(['.source.json'])['snip'];
      expect(jsonSnippet.name).toBe('Atom Snippet');
      expect(jsonSnippet.prefix).toBe('snip');
      expect(jsonSnippet.body).toContain('"prefix":');
      expect(jsonSnippet.body).toContain('"body":');
      expect(jsonSnippet.tabStopList.length).toBeGreaterThan(0);

      const csonSnippet = snippetsService.snippetsForScopes(['.source.coffee'])['snip'];
      expect(csonSnippet.name).toBe('Atom Snippet');
      expect(csonSnippet.prefix).toBe('snip');
      expect(csonSnippet.body).toContain("'prefix':");
      expect(csonSnippet.body).toContain("'body':");
      expect(csonSnippet.tabStopList.length).toBeGreaterThan(0);
    });
  });

  it("loads non-hidden snippet files from atom packages with snippets directories", () => {
    activateSnippetsPackage();

    runs(() => {
      let snippet = snippetsService.snippetsForScopes(['.test'])['test'];
      expect(snippet.prefix).toBe('test');
      expect(snippet.body).toBe('testing 123');

      snippet = snippetsService.snippetsForScopes(['.test'])['testd'];
      expect(snippet.prefix).toBe('testd');
      expect(snippet.body).toBe('testing 456');
      expect(snippet.description).toBe('a description');
      expect(snippet.descriptionMoreURL).toBe('http://google.com');

      snippet = snippetsService.snippetsForScopes(['.test'])['testlabelleft'];
      expect(snippet.prefix).toBe('testlabelleft');
      expect(snippet.body).toBe('testing 456');
      expect(snippet.leftLabel).toBe('a label');

      snippet = snippetsService.snippetsForScopes(['.test'])['testhtmllabels'];
      expect(snippet.prefix).toBe('testhtmllabels');
      expect(snippet.body).toBe('testing 456');
      expect(snippet.leftLabelHTML).toBe('<span style=\"color:red\">Label</span>');
      expect(snippet.rightLabelHTML).toBe('<span style=\"color:white\">Label</span>');
    });
  });

  it("registers a command if a package snippet defines one", () => {
    waitsForPromise(() => {
      return atom.packages.activatePackage("snippets").then(
        ({mainModule}) => {
          return new Promise((resolve) => {
            mainModule.onDidLoadSnippets(resolve);
          });
        }
      );
    });

    runs(() => {
      expect(
        'package-with-snippets:test-command-name' in atom.commands.registeredCommands
      ).toBe(true);
    });
  });

  it("logs a warning if package snippets files cannot be parsed", () => {
    activateSnippetsPackage();

    runs(() => {
      // Warn about invalid-file, but don't even try to parse a hidden file
      expect(console.warn.calls.length).toBeGreaterThan(0);
      expect(console.warn.mostRecentCall.args[0]).toMatch(/Error reading.*package-with-broken-snippets/);
    });
  });

  describe("::loadPackageSnippets(callback)", () => {
    const jsPackage = () => {
      const pack = atom.packages.loadPackage('language-javascript')
      pack.path = path.join(
        atom.getLoadSettings().resourcePath,
        'node_modules', 'language-javascript'
      )
      return pack
    }

    beforeEach(() => { // simulate a list of packages where the javascript core package is returned at the end
      atom.packages.getLoadedPackages.andReturn([
        atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-snippets')),
        jsPackage()
      ]);
    });

    // NOTE: This spec will fail if you're hacking on the Pulsar source code
    // with `ATOM_DEV_RESOURCE_PATH`. Just make sure it passes in CI and you'll
    // be fine.
    it("allows other packages to override core packages' snippets", () => {
      waitsForPromise(() => atom.packages.activatePackage("language-javascript"));

      activateSnippetsPackage();

      runs(() => {
        const snippet = snippetsService.snippetsForScopes(['.source.js'])['log'];
        expect(snippet.body).toBe("from-a-community-package");
      });
    });
  });

  describe("::onDidLoadSnippets(callback)", () => {
    it("invokes listeners when all snippets are loaded", () => {
      let loadedCallback = null;

      waitsFor("package to activate", done => atom.packages.activatePackage("snippets").then(({mainModule}) => {
        mainModule.onDidLoadSnippets(loadedCallback = jasmine.createSpy('onDidLoadSnippets callback'));
        done();
      }));

      waitsFor("onDidLoad callback to be called", () => loadedCallback.callCount > 0);
    });
  });

  describe("when ~/.atom/snippets.json exists", () => {
    beforeEach(() => {
      fs.mkdirSync(configDirPath, {recursive: true});
      fs.writeFileSync(path.join(configDirPath, 'snippets.json'), `\
{
  ".foo": {
    "foo snippet": {
      "prefix": "foo",
      "body": "bar1"
    }
  }
}\
`
      );
      activateSnippetsPackage();
    });

    it("loads the snippets from that file", () => {
      let snippet = null;

      waitsFor(() => snippet = snippetsService.snippetsForScopes(['.foo'])['foo']);

      runs(() => {
        expect(snippet.name).toBe('foo snippet');
        expect(snippet.prefix).toBe("foo");
        expect(snippet.body).toBe("bar1");
      });
    });

    describe("when that file changes", () => {
      it("reloads the snippets", () => {
        fs.mkdirSync(configDirPath, {recursive: true});
        fs.writeFileSync(path.join(configDirPath, 'snippets.json'), `\
{
".foo": {
  "foo snippet": {
    "prefix": "foo",
    "body": "bar2"
  }
}
}\
`
        );

        waitsFor("snippets to be changed", () => {
          const snippet = snippetsService.snippetsForScopes(['.foo'])['foo'];
          return snippet && snippet.body === 'bar2';
        });

        runs(() => {
          fs.mkdirSync(configDirPath, {recursive: true});
          fs.writeFileSync(path.join(configDirPath, 'snippets.json'), "");
        });

        waitsFor("snippets to be removed", () => !snippetsService.snippetsForScopes(['.foo'])['foo']);
      });
    });
  });

  describe("when ~/.atom/snippets.cson exists", () => {
    beforeEach(() => {
      fs.mkdirSync(configDirPath, {recursive: true});
      fs.writeFileSync(path.join(configDirPath, 'snippets.cson'), `\
".foo":
  "foo snippet":
    "prefix": "foo"
    "body": "bar1"\
`
      );
      activateSnippetsPackage();
    });

    it("loads the snippets from that file", () => {
      let snippet = null;

      waitsFor(() => snippet = snippetsService.snippetsForScopes(['.foo'])['foo']);

      runs(() => {
        expect(snippet.name).toBe('foo snippet');
        expect(snippet.prefix).toBe("foo");
        expect(snippet.body).toBe("bar1");
      });
    });

    describe("when that file changes", () => {
      it("reloads the snippets", () => {
        fs.mkdirSync(configDirPath, {recursive: true});
        fs.writeFileSync(path.join(configDirPath, 'snippets.cson'), `\
".foo":
  "foo snippet":
    "prefix": "foo"
    "body": "bar2"\
`
        );

        waitsFor("snippets to be changed", () => {
          const snippet = snippetsService.snippetsForScopes(['.foo'])['foo'];
          return snippet && snippet.body === 'bar2';
        });

        runs(() => {
          fs.mkdirSync(configDirPath, {recursive: true});
          fs.writeFileSync(path.join(configDirPath, 'snippets.cson'), "");
        });

        waitsFor("snippets to be removed", () => {
          const snippet = snippetsService.snippetsForScopes(['.foo'])['foo'];
          return snippet == null;
        });
      });
    });
  });

  it("notifies the user when the user snippets file cannot be loaded", () => {
    fs.writeFileSync(path.join(configDirPath, 'snippets.cson'), '".junk":::');

    activateSnippetsPackage();

    runs(() => {
      expect(console.warn).toHaveBeenCalled();
      if (atom.notifications != null) {
        expect(atom.notifications.addError).toHaveBeenCalled();
      }
    });
  });

  describe("packages-with-snippets-disabled feature", () => {
    it("disables no snippets if the config option is empty", () => {
      const originalConfig = atom.config.get('core.packagesWithSnippetsDisabled');
      atom.config.set('core.packagesWithSnippetsDisabled', []);

      activateSnippetsPackage();
      runs(() => {
        const snippets = snippetsService.snippetsForScopes(['.package-with-snippets-unique-scope']);
        expect(Object.keys(snippets).length).toBe(1);
        atom.config.set('core.packagesWithSnippetsDisabled', originalConfig);
      });
    });

    it("still includes a disabled package's snippets in the list of unparsed snippets", () => {
      let originalConfig = atom.config.get('core.packagesWithSnippetsDisabled');
      atom.config.set('core.packagesWithSnippetsDisabled', []);

      activateSnippetsPackage();
      runs(() => {
        atom.config.set('core.packagesWithSnippetsDisabled', ['package-with-snippets']);
        const allSnippets = snippetsService.getUnparsedSnippets();
        const scopedSnippet = allSnippets.find(s => s.selectorString === '.package-with-snippets-unique-scope');
        expect(scopedSnippet).not.toBe(undefined);
        atom.config.set('core.packagesWithSnippetsDisabled', originalConfig);
      });
    });

    it("never loads a package's snippets when that package is disabled in config", () => {
      const originalConfig = atom.config.get('core.packagesWithSnippetsDisabled');
      atom.config.set('core.packagesWithSnippetsDisabled', ['package-with-snippets']);

      activateSnippetsPackage();
      runs(() => {
        const snippets = snippetsService.snippetsForScopes(['.package-with-snippets-unique-scope']);
        expect(Object.keys(snippets).length).toBe(0);
        atom.config.set('core.packagesWithSnippetsDisabled', originalConfig);
      });
    });

    it("unloads and/or reloads snippets from a package if the config option is changed after activation", () => {
      const originalConfig = atom.config.get('core.packagesWithSnippetsDisabled');
      atom.config.set('core.packagesWithSnippetsDisabled', []);

      activateSnippetsPackage();
      runs(() => {
        let snippets = snippetsService.snippetsForScopes(['.package-with-snippets-unique-scope']);
        expect(Object.keys(snippets).length).toBe(1);

        // Disable it.
        atom.config.set('core.packagesWithSnippetsDisabled', ['package-with-snippets']);
        snippets = snippetsService.snippetsForScopes(['.package-with-snippets-unique-scope']);
        expect(Object.keys(snippets).length).toBe(0);

        // Re-enable it.
        atom.config.set('core.packagesWithSnippetsDisabled', []);
        snippets = snippetsService.snippetsForScopes(['.package-with-snippets-unique-scope']);
        expect(Object.keys(snippets).length).toBe(1);

        atom.config.set('core.packagesWithSnippetsDisabled', originalConfig);
      });
    });
  });
});
