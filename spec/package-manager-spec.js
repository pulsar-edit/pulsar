const path = require('path');
const url = require('url');
const Package = require('../src/package');
const PackageManager = require('../src/package-manager');
const temp = require('temp').track();
const fs = require('fs-plus');
const { Disposable } = require('atom');
const { buildKeydownEvent } = require('../src/keymap-extensions');
const { mockLocalStorage } = require('./spec-helper');
const ModuleCache = require('../src/module-cache');

describe('PackageManager', () => {
  function createTestElement(className) {
    const element = document.createElement('div');
    element.className = className;
    return element;
  }

  beforeEach(() => {
    spyOn(ModuleCache, 'add');
  });

  describe('initialize', () => {
    it('adds regular package path', () => {
      const packageManger = new PackageManager({});
      const configDirPath = path.join('~', 'someConfig');
      packageManger.initialize({ configDirPath });
      expect(packageManger.packageDirPaths.length).toBe(1);
      expect(packageManger.packageDirPaths[0]).toBe(
        path.join(configDirPath, 'packages')
      );
    });

    it('adds regular package path, dev package path, and Atom repo package path in dev mode and dev resource path is set', () => {
      const packageManger = new PackageManager({});
      const configDirPath = path.join('~', 'someConfig');
      const resourcePath = path.join('~', '/atom');
      packageManger.initialize({ configDirPath, resourcePath, devMode: true });
      expect(packageManger.packageDirPaths.length).toBe(3);
      expect(packageManger.packageDirPaths).toContain(
        path.join(configDirPath, 'packages')
      );
      expect(packageManger.packageDirPaths).toContain(
        path.join(configDirPath, 'dev', 'packages')
      );
      expect(packageManger.packageDirPaths).toContain(
        path.join(resourcePath, 'packages')
      );
    });
  });

  describe('::getApmPath()', () => {
    /**
    * TODO: FAILING TEST - This test fails with the following output:
    * Expected '/home/runner/work/pulsar/pulsar/apm/node_modules/ppm/bin/apm' to be
    * '/home/runner/work/pulsar/pulsar/node_modules/electron/dist/resources/app/apm/bin/apm'
    */
    xit('returns the path to the apm command', () => {
      let apmPath = path.join(
        process.resourcesPath,
        'app',
        'apm',
        'bin',
        'apm'
      );
      if (process.platform === 'win32') {
        apmPath += '.cmd';
      }
      expect(core.packages.getApmPath()).toBe(apmPath);
    });

    describe('when the core.apmPath setting is set', () => {
      beforeEach(() => core.config.set('core.apmPath', '/path/to/apm'));

      it('returns the value of the core.apmPath config setting', () => {
        expect(core.packages.getApmPath()).toBe('/path/to/apm');
      });
    });
  });

  describe('::loadPackages()', () => {
    beforeEach(() => spyOn(core.packages, 'loadAvailablePackage'));

    afterEach(async () => {
      await core.packages.deactivatePackages();
      core.packages.unloadPackages();
    });

    it('sets hasLoadedInitialPackages', () => {
      expect(core.packages.hasLoadedInitialPackages()).toBe(false);
      core.packages.loadPackages();
      expect(core.packages.hasLoadedInitialPackages()).toBe(true);
    });
  });

  describe('::loadPackage(name)', () => {
    beforeEach(() => core.config.set('core.disabledPackages', []));

    it('returns the package', () => {
      const pack = core.packages.loadPackage('package-with-index');
      expect(pack instanceof Package).toBe(true);
      expect(pack.metadata.name).toBe('package-with-index');
    });

    it('returns the package if it has an invalid keymap', () => {
      spyOn(core, 'inSpecMode').andReturn(false);
      const pack = core.packages.loadPackage('package-with-broken-keymap');
      expect(pack instanceof Package).toBe(true);
      expect(pack.metadata.name).toBe('package-with-broken-keymap');
    });

    it('returns the package if it has an invalid stylesheet', () => {
      spyOn(core, 'inSpecMode').andReturn(false);
      const pack = core.packages.loadPackage('package-with-invalid-styles');
      expect(pack instanceof Package).toBe(true);
      expect(pack.metadata.name).toBe('package-with-invalid-styles');
      expect(pack.stylesheets.length).toBe(0);

      const addErrorHandler = jasmine.createSpy();
      core.notifications.onDidAddNotification(addErrorHandler);
      expect(() => pack.reloadStylesheets()).not.toThrow();
      expect(addErrorHandler.callCount).toBe(2);
      expect(addErrorHandler.argsForCall[1][0].message).toContain(
        'Failed to reload the package-with-invalid-styles package stylesheets'
      );
      expect(addErrorHandler.argsForCall[1][0].options.packageName).toEqual(
        'package-with-invalid-styles'
      );
    });

    it('returns null if the package has an invalid package.json', () => {
      spyOn(core, 'inSpecMode').andReturn(false);
      const addErrorHandler = jasmine.createSpy();
      core.notifications.onDidAddNotification(addErrorHandler);
      expect(
        core.packages.loadPackage('package-with-broken-package-json')
      ).toBeNull();
      expect(addErrorHandler.callCount).toBe(1);
      expect(addErrorHandler.argsForCall[0][0].message).toContain(
        'Failed to load the package-with-broken-package-json package'
      );
      expect(addErrorHandler.argsForCall[0][0].options.packageName).toEqual(
        'package-with-broken-package-json'
      );
    });

    it('returns null if the package name or path starts with a dot', () => {
      expect(
        core.packages.loadPackage('/Users/user/.atom/packages/.git')
      ).toBeNull();
    });

    it('normalizes short repository urls in package.json', () => {
      let { metadata } = core.packages.loadPackage(
        'package-with-short-url-package-json'
      );
      expect(metadata.repository.type).toBe('git');
      expect(metadata.repository.url).toBe('https://github.com/example/repo');
      ({ metadata } = core.packages.loadPackage(
        'package-with-invalid-url-package-json'
      ));
      expect(metadata.repository.type).toBe('git');
      expect(metadata.repository.url).toBe('foo');
    });

    it('trims git+ from the beginning and .git from the end of repository URLs, even if npm already normalized them ', () => {
      const { metadata } = core.packages.loadPackage(
        'package-with-prefixed-and-suffixed-repo-url'
      );
      expect(metadata.repository.type).toBe('git');
      expect(metadata.repository.url).toBe('https://github.com/example/repo');
    });

    it('returns null if the package is not found in any package directory', () => {
      spyOn(console, 'warn');
      expect(
        core.packages.loadPackage('this-package-cannot-be-found')
      ).toBeNull();
      expect(console.warn.callCount).toBe(1);
      expect(console.warn.argsForCall[0][0]).toContain('Could not resolve');
    });

    describe('when the package is deprecated', () => {
      it('returns null', () => {
        spyOn(console, 'warn');
        expect(
          core.packages.loadPackage(
            path.join(__dirname, 'fixtures', 'packages', 'wordcount')
          )
        ).toBeNull();
        expect(core.packages.isDeprecatedPackage('wordcount', '2.1.9')).toBe(
          true
        );
        expect(core.packages.isDeprecatedPackage('wordcount', '2.2.0')).toBe(
          true
        );
        expect(core.packages.isDeprecatedPackage('wordcount', '2.2.1')).toBe(
          false
        );
        expect(
          core.packages.getDeprecatedPackageMetadata('wordcount').version
        ).toBe('<=2.2.0');
      });
    });

    it('invokes ::onDidLoadPackage listeners with the loaded package', () => {
      let loadedPackage = null;

      core.packages.onDidLoadPackage(pack => {
        loadedPackage = pack;
      });

      core.packages.loadPackage('package-with-main');

      expect(loadedPackage.name).toBe('package-with-main');
    });

    it("registers any deserializers specified in the package's package.json", () => {
      core.packages.loadPackage('package-with-deserializers');

      const state1 = { deserializer: 'Deserializer1', a: 'b' };
      expect(core.deserializers.deserialize(state1)).toEqual({
        wasDeserializedBy: 'deserializeMethod1',
        state: state1
      });

      const state2 = { deserializer: 'Deserializer2', c: 'd' };
      expect(core.deserializers.deserialize(state2)).toEqual({
        wasDeserializedBy: 'deserializeMethod2',
        state: state2
      });
    });

    it('early-activates any atom.directory-provider or atom.repository-provider services that the package provide', () => {
      jasmine.useRealClock();

      const providers = [];
      core.packages.serviceHub.consume(
        'atom.directory-provider',
        '^0.1.0',
        provider => providers.push(provider)
      );

      core.packages.loadPackage('package-with-directory-provider');
      expect(providers.map(p => p.name)).toEqual([
        'directory provider from package-with-directory-provider'
      ]);
    });

    describe("when there are view providers specified in the package's package.json", () => {
      const model1 = { worksWithViewProvider1: true };
      const model2 = { worksWithViewProvider2: true };

      afterEach(async () => {
        await core.packages.deactivatePackage('package-with-view-providers');
        core.packages.unloadPackage('package-with-view-providers');
      });

      it('does not load the view providers immediately', () => {
        const pack = core.packages.loadPackage('package-with-view-providers');
        expect(pack.mainModule).toBeNull();

        expect(() => core.views.getView(model1)).toThrow();
        expect(() => core.views.getView(model2)).toThrow();
      });

      it('registers the view providers when the package is activated', async () => {
        core.packages.loadPackage('package-with-view-providers');

        await core.packages.activatePackage('package-with-view-providers');

        const element1 = core.views.getView(model1);
        expect(element1 instanceof HTMLDivElement).toBe(true);
        expect(element1.dataset.createdBy).toBe('view-provider-1');

        const element2 = core.views.getView(model2);
        expect(element2 instanceof HTMLDivElement).toBe(true);
        expect(element2.dataset.createdBy).toBe('view-provider-2');
      });

      it("registers the view providers when any of the package's deserializers are used", () => {
        core.packages.loadPackage('package-with-view-providers');

        spyOn(core.views, 'addViewProvider').andCallThrough();
        core.deserializers.deserialize({
          deserializer: 'DeserializerFromPackageWithViewProviders',
          a: 'b'
        });
        expect(core.views.addViewProvider.callCount).toBe(2);

        core.deserializers.deserialize({
          deserializer: 'DeserializerFromPackageWithViewProviders',
          a: 'b'
        });
        expect(core.views.addViewProvider.callCount).toBe(2);

        const element1 = core.views.getView(model1);
        expect(element1 instanceof HTMLDivElement).toBe(true);
        expect(element1.dataset.createdBy).toBe('view-provider-1');

        const element2 = core.views.getView(model2);
        expect(element2 instanceof HTMLDivElement).toBe(true);
        expect(element2.dataset.createdBy).toBe('view-provider-2');
      });
    });

    it("registers the config schema in the package's metadata, if present", () => {
      let pack = core.packages.loadPackage('package-with-json-config-schema');
      expect(core.config.getSchema('package-with-json-config-schema')).toEqual({
        type: 'object',
        properties: {
          a: { type: 'number', default: 5 },
          b: { type: 'string', default: 'five' }
        }
      });

      expect(pack.mainModule).toBeNull();

      core.packages.unloadPackage('package-with-json-config-schema');
      core.config.clear();

      pack = core.packages.loadPackage('package-with-json-config-schema');
      expect(core.config.getSchema('package-with-json-config-schema')).toEqual({
        type: 'object',
        properties: {
          a: { type: 'number', default: 5 },
          b: { type: 'string', default: 'five' }
        }
      });
    });

    describe('when a package does not have deserializers, view providers or a config schema in its package.json', () => {
      beforeEach(() => mockLocalStorage());

      it("defers loading the package's main module if the package previously used no Atom APIs when its main module was required", () => {
        const pack1 = core.packages.loadPackage('package-with-main');
        expect(pack1.mainModule).toBeDefined();

        core.packages.unloadPackage('package-with-main');

        const pack2 = core.packages.loadPackage('package-with-main');
        expect(pack2.mainModule).toBeNull();
      });

      it("does not defer loading the package's main module if the package previously used Atom APIs when its main module was required", () => {
        const pack1 = core.packages.loadPackage(
          'package-with-eval-time-api-calls'
        );
        expect(pack1.mainModule).toBeDefined();

        core.packages.unloadPackage('package-with-eval-time-api-calls');

        const pack2 = core.packages.loadPackage(
          'package-with-eval-time-api-calls'
        );
        expect(pack2.mainModule).not.toBeNull();
      });
    });
  });

  describe('::loadAvailablePackage(availablePackage)', () => {
    describe('if the package was preloaded', () => {
      it('adds the package path to the module cache', () => {
        const availablePackage = core.packages
          .getAvailablePackages()
          .find(p => p.name === 'spell-check');
        availablePackage.isBundled = true;
        expect(
          core.packages.preloadedPackages[availablePackage.name]
        ).toBeUndefined();
        expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(
          false
        );

        const metadata = core.packages.loadPackageMetadata(availablePackage);
        core.packages.preloadPackage(availablePackage.name, {
          rootDirPath: path.relative(
            core.packages.resourcePath,
            availablePackage.path
          ),
          metadata
        });
        core.packages.loadAvailablePackage(availablePackage);
        expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(true);
        expect(ModuleCache.add).toHaveBeenCalledWith(
          availablePackage.path,
          metadata
        );
      });

      it('deactivates it if it had been disabled', () => {
        const availablePackage = core.packages
          .getAvailablePackages()
          .find(p => p.name === 'spell-check');
        availablePackage.isBundled = true;
        expect(
          core.packages.preloadedPackages[availablePackage.name]
        ).toBeUndefined();
        expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(
          false
        );

        const metadata = core.packages.loadPackageMetadata(availablePackage);
        const preloadedPackage = core.packages.preloadPackage(
          availablePackage.name,
          {
            rootDirPath: path.relative(
              core.packages.resourcePath,
              availablePackage.path
            ),
            metadata
          }
        );
        expect(preloadedPackage.keymapActivated).toBe(true);
        expect(preloadedPackage.settingsActivated).toBe(true);
        expect(preloadedPackage.menusActivated).toBe(true);

        core.packages.loadAvailablePackage(
          availablePackage,
          new Set([availablePackage.name])
        );
        expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(
          false
        );
        expect(preloadedPackage.keymapActivated).toBe(false);
        expect(preloadedPackage.settingsActivated).toBe(false);
        expect(preloadedPackage.menusActivated).toBe(false);
      });

      it('deactivates it and reloads the new one if trying to load the same package outside of the bundle', () => {
        const availablePackage = core.packages
          .getAvailablePackages()
          .find(p => p.name === 'spell-check');
        availablePackage.isBundled = true;
        expect(
          core.packages.preloadedPackages[availablePackage.name]
        ).toBeUndefined();
        expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(
          false
        );

        const metadata = core.packages.loadPackageMetadata(availablePackage);
        const preloadedPackage = core.packages.preloadPackage(
          availablePackage.name,
          {
            rootDirPath: path.relative(
              core.packages.resourcePath,
              availablePackage.path
            ),
            metadata
          }
        );
        expect(preloadedPackage.keymapActivated).toBe(true);
        expect(preloadedPackage.settingsActivated).toBe(true);
        expect(preloadedPackage.menusActivated).toBe(true);

        availablePackage.isBundled = false;
        core.packages.loadAvailablePackage(availablePackage);
        expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(true);
        expect(preloadedPackage.keymapActivated).toBe(false);
        expect(preloadedPackage.settingsActivated).toBe(false);
        expect(preloadedPackage.menusActivated).toBe(false);
      });
    });

    describe('if the package was not preloaded', () => {
      it('adds the package path to the module cache', () => {
        const availablePackage = core.packages
          .getAvailablePackages()
          .find(p => p.name === 'spell-check');
        availablePackage.isBundled = true;
        const metadata = core.packages.loadPackageMetadata(availablePackage);
        core.packages.loadAvailablePackage(availablePackage);
        expect(ModuleCache.add).toHaveBeenCalledWith(
          availablePackage.path,
          metadata
        );
      });
    });
  });

  describe('preloading', () => {
    it('requires the main module, loads the config schema and activates keymaps, menus and settings without reactivating them during package activation', () => {
      const availablePackage = core.packages
        .getAvailablePackages()
        .find(p => p.name === 'spell-check');
      availablePackage.isBundled = true;
      const metadata = core.packages.loadPackageMetadata(availablePackage);
      expect(
        core.packages.preloadedPackages[availablePackage.name]
      ).toBeUndefined();
      expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(false);

      core.packages.packagesCache = {};
      core.packages.packagesCache[availablePackage.name] = {
        main: path.join(availablePackage.path, metadata.main),
        grammarPaths: []
      };
      const preloadedPackage = core.packages.preloadPackage(
        availablePackage.name,
        {
          rootDirPath: path.relative(
            core.packages.resourcePath,
            availablePackage.path
          ),
          metadata
        }
      );
      expect(preloadedPackage.keymapActivated).toBe(true);
      expect(preloadedPackage.settingsActivated).toBe(true);
      expect(preloadedPackage.menusActivated).toBe(true);
      expect(preloadedPackage.mainModule).toBeTruthy();
      expect(preloadedPackage.configSchemaRegisteredOnLoad).toBeTruthy();

      spyOn(core.keymaps, 'add');
      spyOn(core.menu, 'add');
      spyOn(core.contextMenu, 'add');
      spyOn(core.config, 'setSchema');

      core.packages.loadAvailablePackage(availablePackage);
      expect(preloadedPackage.getMainModulePath()).toBe(
        path.join(availablePackage.path, metadata.main)
      );

      core.packages.activatePackage(availablePackage.name);
      expect(core.keymaps.add).not.toHaveBeenCalled();
      expect(core.menu.add).not.toHaveBeenCalled();
      expect(core.contextMenu.add).not.toHaveBeenCalled();
      expect(core.config.setSchema).not.toHaveBeenCalled();
      expect(preloadedPackage.keymapActivated).toBe(true);
      expect(preloadedPackage.settingsActivated).toBe(true);
      expect(preloadedPackage.menusActivated).toBe(true);
      expect(preloadedPackage.mainModule).toBeTruthy();
      expect(preloadedPackage.configSchemaRegisteredOnLoad).toBeTruthy();
    });

    it('deactivates disabled keymaps during package activation', () => {
      const availablePackage = core.packages
        .getAvailablePackages()
        .find(p => p.name === 'spell-check');
      availablePackage.isBundled = true;
      const metadata = core.packages.loadPackageMetadata(availablePackage);
      expect(
        core.packages.preloadedPackages[availablePackage.name]
      ).toBeUndefined();
      expect(core.packages.isPackageLoaded(availablePackage.name)).toBe(false);

      core.packages.packagesCache = {};
      core.packages.packagesCache[availablePackage.name] = {
        main: path.join(availablePackage.path, metadata.main),
        grammarPaths: []
      };
      const preloadedPackage = core.packages.preloadPackage(
        availablePackage.name,
        {
          rootDirPath: path.relative(
            core.packages.resourcePath,
            availablePackage.path
          ),
          metadata
        }
      );
      expect(preloadedPackage.keymapActivated).toBe(true);
      expect(preloadedPackage.settingsActivated).toBe(true);
      expect(preloadedPackage.menusActivated).toBe(true);

      core.packages.loadAvailablePackage(availablePackage);
      core.config.set('core.packagesWithKeymapsDisabled', [
        availablePackage.name
      ]);
      core.packages.activatePackage(availablePackage.name);

      expect(preloadedPackage.keymapActivated).toBe(false);
      expect(preloadedPackage.settingsActivated).toBe(true);
      expect(preloadedPackage.menusActivated).toBe(true);
    });
  });

  describe('::unloadPackage(name)', () => {
    describe('when the package is active', () => {
      it('throws an error', async () => {
        const pack = await core.packages.activatePackage('package-with-main');
        expect(core.packages.isPackageLoaded(pack.name)).toBeTruthy();
        expect(core.packages.isPackageActive(pack.name)).toBeTruthy();

        expect(() => core.packages.unloadPackage(pack.name)).toThrow();
        expect(core.packages.isPackageLoaded(pack.name)).toBeTruthy();
        expect(core.packages.isPackageActive(pack.name)).toBeTruthy();
      });
    });

    describe('when the package is not loaded', () => {
      it('throws an error', () => {
        expect(core.packages.isPackageLoaded('unloaded')).toBeFalsy();
        expect(() => core.packages.unloadPackage('unloaded')).toThrow();
        expect(core.packages.isPackageLoaded('unloaded')).toBeFalsy();
      });
    });

    describe('when the package is loaded', () => {
      it('no longers reports it as being loaded', () => {
        const pack = core.packages.loadPackage('package-with-main');
        expect(core.packages.isPackageLoaded(pack.name)).toBeTruthy();
        core.packages.unloadPackage(pack.name);
        expect(core.packages.isPackageLoaded(pack.name)).toBeFalsy();
      });
    });

    it('invokes ::onDidUnloadPackage listeners with the unloaded package', () => {
      core.packages.loadPackage('package-with-main');
      let unloadedPackage;
      core.packages.onDidUnloadPackage(pack => {
        unloadedPackage = pack;
      });
      core.packages.unloadPackage('package-with-main');
      expect(unloadedPackage.name).toBe('package-with-main');
    });
  });

  describe('::activatePackage(id)', () => {
    describe('when called multiple times', () => {
      it('it only calls activate on the package once', async () => {
        spyOn(Package.prototype, 'activateNow').andCallThrough();
        await core.packages.activatePackage('package-with-index');
        await core.packages.activatePackage('package-with-index');
        await core.packages.activatePackage('package-with-index');

        expect(Package.prototype.activateNow.callCount).toBe(1);
      });
    });

    describe('when the package has a main module', () => {
      beforeEach(() => {
        spyOn(Package.prototype, 'requireMainModule').andCallThrough();
      });

      describe('when the metadata specifies a main module path˜', () => {
        it('requires the module at the specified path', async () => {
          const mainModule = require('./fixtures/packages/package-with-main/main-module');
          spyOn(mainModule, 'activate');

          const pack = await core.packages.activatePackage('package-with-main');
          expect(mainModule.activate).toHaveBeenCalled();
          expect(pack.mainModule).toBe(mainModule);
        });
      });

      describe('when the metadata does not specify a main module', () => {
        it('requires index.coffee', async () => {
          const indexModule = require('./fixtures/packages/package-with-index/index');
          spyOn(indexModule, 'activate');

          const pack = await core.packages.activatePackage(
            'package-with-index'
          );
          expect(indexModule.activate).toHaveBeenCalled();
          expect(pack.mainModule).toBe(indexModule);
        });
      });

      it('assigns config schema, including defaults when package contains a schema', async () => {
        expect(
          core.config.get('package-with-config-schema.numbers.one')
        ).toBeUndefined();

        await core.packages.activatePackage('package-with-config-schema');
        expect(core.config.get('package-with-config-schema.numbers.one')).toBe(
          1
        );
        expect(core.config.get('package-with-config-schema.numbers.two')).toBe(
          2
        );
        expect(
          core.config.set('package-with-config-schema.numbers.one', 'nope')
        ).toBe(false);
        expect(
          core.config.set('package-with-config-schema.numbers.one', '10')
        ).toBe(true);
        expect(core.config.get('package-with-config-schema.numbers.one')).toBe(
          10
        );
      });

      describe('when the package metadata includes `activationCommands`', () => {
        let mainModule, promise, workspaceCommandListener, registration;

        beforeEach(() => {
          jasmine.attachToDOM(core.workspace.getElement());
          mainModule = require('./fixtures/packages/package-with-activation-commands/index');
          mainModule.activationCommandCallCount = 0;
          spyOn(mainModule, 'activate').andCallThrough();

          workspaceCommandListener = jasmine.createSpy(
            'workspaceCommandListener'
          );
          registration = core.commands.add(
            'atom-workspace',
            'activation-command',
            workspaceCommandListener
          );

          promise = core.packages.activatePackage(
            'package-with-activation-commands'
          );
        });

        afterEach(() => {
          if (registration) {
            registration.dispose();
          }
          mainModule = null;
        });

        it('defers requiring/activating the main module until an activation event bubbles to the root view', async () => {
          expect(Package.prototype.requireMainModule.callCount).toBe(0);

          core.workspace
            .getElement()
            .dispatchEvent(
              new CustomEvent('activation-command', { bubbles: true })
            );

          await promise;
          expect(Package.prototype.requireMainModule.callCount).toBe(1);
        });

        it('triggers the activation event on all handlers registered during activation', async () => {
          await core.workspace.open();

          const editorElement = core.workspace
            .getActiveTextEditor()
            .getElement();
          const editorCommandListener = jasmine.createSpy(
            'editorCommandListener'
          );
          core.commands.add(
            'atom-text-editor',
            'activation-command',
            editorCommandListener
          );

          core.commands.dispatch(editorElement, 'activation-command');
          expect(mainModule.activate.callCount).toBe(1);
          expect(mainModule.activationCommandCallCount).toBe(1);
          expect(editorCommandListener.callCount).toBe(1);
          expect(workspaceCommandListener.callCount).toBe(1);

          core.commands.dispatch(editorElement, 'activation-command');
          expect(mainModule.activationCommandCallCount).toBe(2);
          expect(editorCommandListener.callCount).toBe(2);
          expect(workspaceCommandListener.callCount).toBe(2);
          expect(mainModule.activate.callCount).toBe(1);
        });

        it('activates the package immediately when the events are empty', async () => {
          mainModule = require('./fixtures/packages/package-with-empty-activation-commands/index');
          spyOn(mainModule, 'activate').andCallThrough();

          core.packages.activatePackage(
            'package-with-empty-activation-commands'
          );

          expect(mainModule.activate.callCount).toBe(1);
        });

        it('adds a notification when the activation commands are invalid', () => {
          spyOn(core, 'inSpecMode').andReturn(false);
          const addErrorHandler = jasmine.createSpy();
          core.notifications.onDidAddNotification(addErrorHandler);
          expect(() =>
            core.packages.activatePackage(
              'package-with-invalid-activation-commands'
            )
          ).not.toThrow();
          expect(addErrorHandler.callCount).toBe(1);
          expect(addErrorHandler.argsForCall[0][0].message).toContain(
            'Failed to activate the package-with-invalid-activation-commands package'
          );
          expect(addErrorHandler.argsForCall[0][0].options.packageName).toEqual(
            'package-with-invalid-activation-commands'
          );
        });

        it('adds a notification when the context menu is invalid', () => {
          spyOn(core, 'inSpecMode').andReturn(false);
          const addErrorHandler = jasmine.createSpy();
          core.notifications.onDidAddNotification(addErrorHandler);
          expect(() =>
            core.packages.activatePackage('package-with-invalid-context-menu')
          ).not.toThrow();
          expect(addErrorHandler.callCount).toBe(1);
          expect(addErrorHandler.argsForCall[0][0].message).toContain(
            'Failed to activate the package-with-invalid-context-menu package'
          );
          expect(addErrorHandler.argsForCall[0][0].options.packageName).toEqual(
            'package-with-invalid-context-menu'
          );
        });

        it('adds a notification when the grammar is invalid', async () => {
          let notificationEvent;

          await new Promise(resolve => {
            const subscription = core.notifications.onDidAddNotification(
              event => {
                notificationEvent = event;
                subscription.dispose();
                resolve();
              }
            );

            core.packages.activatePackage('package-with-invalid-grammar');
          });

          expect(notificationEvent.message).toContain(
            'Failed to load a package-with-invalid-grammar package grammar'
          );
          expect(notificationEvent.options.packageName).toEqual(
            'package-with-invalid-grammar'
          );
        });

        it('adds a notification when the settings are invalid', async () => {
          let notificationEvent;

          await new Promise(resolve => {
            const subscription = core.notifications.onDidAddNotification(
              event => {
                notificationEvent = event;
                subscription.dispose();
                resolve();
              }
            );

            core.packages.activatePackage('package-with-invalid-settings');
          });

          expect(notificationEvent.message).toContain(
            'Failed to load the package-with-invalid-settings package settings'
          );
          expect(notificationEvent.options.packageName).toEqual(
            'package-with-invalid-settings'
          );
        });
      });

      describe('when the package metadata includes both activation commands and deserializers', () => {
        let mainModule, promise, workspaceCommandListener, registration;

        beforeEach(() => {
          jasmine.attachToDOM(core.workspace.getElement());
          spyOn(core.packages, 'hasActivatedInitialPackages').andReturn(true);
          mainModule = require('./fixtures/packages/package-with-activation-commands-and-deserializers/index');
          mainModule.activationCommandCallCount = 0;
          spyOn(mainModule, 'activate').andCallThrough();
          workspaceCommandListener = jasmine.createSpy(
            'workspaceCommandListener'
          );
          registration = core.commands.add(
            '.workspace',
            'activation-command-2',
            workspaceCommandListener
          );

          promise = core.packages.activatePackage(
            'package-with-activation-commands-and-deserializers'
          );
        });

        afterEach(() => {
          if (registration) {
            registration.dispose();
          }
          mainModule = null;
        });

        it('activates the package when a deserializer is called', async () => {
          expect(Package.prototype.requireMainModule.callCount).toBe(0);

          const state1 = { deserializer: 'Deserializer1', a: 'b' };
          expect(core.deserializers.deserialize(state1, core)).toEqual({
            wasDeserializedBy: 'deserializeMethod1',
            state: state1
          });

          await promise;
          expect(Package.prototype.requireMainModule.callCount).toBe(1);
        });

        it('defers requiring/activating the main module until an activation event bubbles to the root view', async () => {
          expect(Package.prototype.requireMainModule.callCount).toBe(0);

          core.workspace
            .getElement()
            .dispatchEvent(
              new CustomEvent('activation-command-2', { bubbles: true })
            );

          await promise;
          expect(mainModule.activate.callCount).toBe(1);
          expect(mainModule.activationCommandCallCount).toBe(1);
          expect(Package.prototype.requireMainModule.callCount).toBe(1);
        });
      });

      describe('when the package metadata includes `activationHooks`', () => {
        let mainModule, promise;

        beforeEach(() => {
          mainModule = require('./fixtures/packages/package-with-activation-hooks/index');
          spyOn(mainModule, 'activate').andCallThrough();
        });

        it('defers requiring/activating the main module until an triggering of an activation hook occurs', async () => {
          promise = core.packages.activatePackage(
            'package-with-activation-hooks'
          );
          expect(Package.prototype.requireMainModule.callCount).toBe(0);
          core.packages.triggerActivationHook(
            'language-fictitious:grammar-used'
          );
          core.packages.triggerDeferredActivationHooks();

          await promise;
          expect(Package.prototype.requireMainModule.callCount).toBe(1);
        });

        it('does not double register activation hooks when deactivating and reactivating', async () => {
          promise = core.packages.activatePackage(
            'package-with-activation-hooks'
          );
          expect(mainModule.activate.callCount).toBe(0);
          core.packages.triggerActivationHook(
            'language-fictitious:grammar-used'
          );
          core.packages.triggerDeferredActivationHooks();

          await promise;
          expect(mainModule.activate.callCount).toBe(1);

          await core.packages.deactivatePackage(
            'package-with-activation-hooks'
          );

          promise = core.packages.activatePackage(
            'package-with-activation-hooks'
          );
          core.packages.triggerActivationHook(
            'language-fictitious:grammar-used'
          );
          core.packages.triggerDeferredActivationHooks();

          await promise;
          expect(mainModule.activate.callCount).toBe(2);
        });

        it('activates the package immediately when activationHooks is empty', async () => {
          mainModule = require('./fixtures/packages/package-with-empty-activation-hooks/index');
          spyOn(mainModule, 'activate').andCallThrough();

          expect(Package.prototype.requireMainModule.callCount).toBe(0);

          await core.packages.activatePackage(
            'package-with-empty-activation-hooks'
          );
          expect(mainModule.activate.callCount).toBe(1);
          expect(Package.prototype.requireMainModule.callCount).toBe(1);
        });

        it('activates the package immediately if the activation hook had already been triggered', async () => {
          core.packages.triggerActivationHook(
            'language-fictitious:grammar-used'
          );
          core.packages.triggerDeferredActivationHooks();
          expect(Package.prototype.requireMainModule.callCount).toBe(0);

          await core.packages.activatePackage('package-with-activation-hooks');
          expect(mainModule.activate.callCount).toBe(1);
          expect(Package.prototype.requireMainModule.callCount).toBe(1);
        });
      });

      describe('when the package metadata includes `workspaceOpeners`', () => {
        let mainModule, promise;

        beforeEach(() => {
          mainModule = require('./fixtures/packages/package-with-workspace-openers/index');
          spyOn(mainModule, 'activate').andCallThrough();
        });

        it('defers requiring/activating the main module until a registered opener is called', async () => {
          promise = core.packages.activatePackage(
            'package-with-workspace-openers'
          );
          expect(Package.prototype.requireMainModule.callCount).toBe(0);
          core.workspace.open('atom://fictitious');

          await promise;
          expect(Package.prototype.requireMainModule.callCount).toBe(1);
          expect(mainModule.openerCount).toBe(1);
        });

        it('activates the package immediately when the events are empty', async () => {
          mainModule = require('./fixtures/packages/package-with-empty-workspace-openers/index');
          spyOn(mainModule, 'activate').andCallThrough();

          core.packages.activatePackage('package-with-empty-workspace-openers');

          expect(mainModule.activate.callCount).toBe(1);
        });
      });
    });

    describe('when the package has no main module', () => {
      it('does not throw an exception', () => {
        spyOn(console, 'error');
        spyOn(console, 'warn').andCallThrough();
        expect(() =>
          core.packages.activatePackage('package-without-module')
        ).not.toThrow();
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
      });
    });

    describe('when the package does not export an activate function', () => {
      it('activates the package and does not throw an exception or log a warning', async () => {
        spyOn(console, 'warn');
        await core.packages.activatePackage('package-with-no-activate');
        expect(console.warn).not.toHaveBeenCalled();
      });
    });

    it("passes the activate method the package's previously serialized state if it exists", async () => {
      const pack = await core.packages.activatePackage(
        'package-with-serialization'
      );
      expect(pack.mainModule.someNumber).not.toBe(77);
      pack.mainModule.someNumber = 77;
      core.packages.serializePackage('package-with-serialization');
      await core.packages.deactivatePackage('package-with-serialization');

      spyOn(pack.mainModule, 'activate').andCallThrough();
      await core.packages.activatePackage('package-with-serialization');
      expect(pack.mainModule.activate).toHaveBeenCalledWith({ someNumber: 77 });
    });

    it('invokes ::onDidActivatePackage listeners with the activated package', async () => {
      let activatedPackage;
      core.packages.onDidActivatePackage(pack => {
        activatedPackage = pack;
      });

      await core.packages.activatePackage('package-with-main');
      expect(activatedPackage.name).toBe('package-with-main');
    });

    describe("when the package's main module throws an error on load", () => {
      it('adds a notification instead of throwing an exception', () => {
        spyOn(core, 'inSpecMode').andReturn(false);
        core.config.set('core.disabledPackages', []);
        const addErrorHandler = jasmine.createSpy();
        core.notifications.onDidAddNotification(addErrorHandler);
        expect(() =>
          core.packages.activatePackage('package-that-throws-an-exception')
        ).not.toThrow();
        expect(addErrorHandler.callCount).toBe(1);
        expect(addErrorHandler.argsForCall[0][0].message).toContain(
          'Failed to load the package-that-throws-an-exception package'
        );
        expect(addErrorHandler.argsForCall[0][0].options.packageName).toEqual(
          'package-that-throws-an-exception'
        );
      });

      it('re-throws the exception in test mode', () => {
        core.config.set('core.disabledPackages', []);
        expect(() =>
          core.packages.activatePackage('package-that-throws-an-exception')
        ).toThrow('This package throws an exception');
      });
    });

    describe('when the package is not found', () => {
      it('rejects the promise', async () => {
        spyOn(console, 'warn');
        core.config.set('core.disabledPackages', []);

        try {
          await core.packages.activatePackage('this-doesnt-exist');
          expect('Error to be thrown').toBe('');
        } catch (error) {
          expect(console.warn.callCount).toBe(1);
          expect(error.message).toContain(
            "Failed to load package 'this-doesnt-exist'"
          );
        }
      });
    });

    describe('keymap loading', () => {
      describe("when the metadata does not contain a 'keymaps' manifest", () => {
        it('loads all the .cson/.json files in the keymaps directory', async () => {
          const element1 = createTestElement('test-1');
          const element2 = createTestElement('test-2');
          const element3 = createTestElement('test-3');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })
          ).toHaveLength(0);
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element2
            })
          ).toHaveLength(0);
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element3
            })
          ).toHaveLength(0);

          await core.packages.activatePackage('package-with-keymaps');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })[0].command
          ).toBe('test-1');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element2
            })[0].command
          ).toBe('test-2');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element3
            })
          ).toHaveLength(0);
        });
      });

      describe("when the metadata contains a 'keymaps' manifest", () => {
        it('loads only the keymaps specified by the manifest, in the specified order', async () => {
          const element1 = createTestElement('test-1');
          const element3 = createTestElement('test-3');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })
          ).toHaveLength(0);

          await core.packages.activatePackage('package-with-keymaps-manifest');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })[0].command
          ).toBe('keymap-1');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-n',
              target: element1
            })[0].command
          ).toBe('keymap-2');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-y',
              target: element3
            })
          ).toHaveLength(0);
        });
      });

      describe('when the keymap file is empty', () => {
        it('does not throw an error on activation', async () => {
          await core.packages.activatePackage('package-with-empty-keymap');
          expect(
            core.packages.isPackageActive('package-with-empty-keymap')
          ).toBe(true);
        });
      });

      describe("when the package's keymaps have been disabled", () => {
        it('does not add the keymaps', async () => {
          const element1 = createTestElement('test-1');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })
          ).toHaveLength(0);

          core.config.set('core.packagesWithKeymapsDisabled', [
            'package-with-keymaps-manifest'
          ]);
          await core.packages.activatePackage('package-with-keymaps-manifest');
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })
          ).toHaveLength(0);
        });
      });

      describe('when setting core.packagesWithKeymapsDisabled', () => {
        it("ignores package names in the array that aren't loaded", () => {
          core.packages.observePackagesWithKeymapsDisabled();

          expect(() =>
            core.config.set('core.packagesWithKeymapsDisabled', [
              'package-does-not-exist'
            ])
          ).not.toThrow();
          expect(() =>
            core.config.set('core.packagesWithKeymapsDisabled', [])
          ).not.toThrow();
        });
      });

      describe("when the package's keymaps are disabled and re-enabled after it is activated", () => {
        it('removes and re-adds the keymaps', async () => {
          const element1 = createTestElement('test-1');
          core.packages.observePackagesWithKeymapsDisabled();

          await core.packages.activatePackage('package-with-keymaps-manifest');

          core.config.set('core.packagesWithKeymapsDisabled', [
            'package-with-keymaps-manifest'
          ]);
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })
          ).toHaveLength(0);

          core.config.set('core.packagesWithKeymapsDisabled', []);
          expect(
            core.keymaps.findKeyBindings({
              keystrokes: 'ctrl-z',
              target: element1
            })[0].command
          ).toBe('keymap-1');
        });
      });

      describe('when the package is de-activated and re-activated', () => {
        let element, events, userKeymapPath;

        beforeEach(() => {
          userKeymapPath = path.join(temp.mkdirSync(), 'user-keymaps.cson');
          spyOn(core.keymaps, 'getUserKeymapPath').andReturn(userKeymapPath);

          element = createTestElement('test-1');
          jasmine.attachToDOM(element);

          events = [];
          element.addEventListener('user-command', e => events.push(e));
          element.addEventListener('test-1', e => events.push(e));
        });

        afterEach(() => {
          element.remove();

          // Avoid leaking user keymap subscription
          core.keymaps.watchSubscriptions[userKeymapPath].dispose();
          delete core.keymaps.watchSubscriptions[userKeymapPath];

          temp.cleanupSync();
        });

        it("doesn't override user-defined keymaps", async () => {
          fs.writeFileSync(
            userKeymapPath,
            `".test-1": {"ctrl-z": "user-command"}`
          );
          core.keymaps.loadUserKeymap();

          await core.packages.activatePackage('package-with-keymaps');
          core.keymaps.handleKeyboardEvent(
            buildKeydownEvent('z', { ctrl: true, target: element })
          );
          expect(events.length).toBe(1);
          expect(events[0].type).toBe('user-command');

          await core.packages.deactivatePackage('package-with-keymaps');
          await core.packages.activatePackage('package-with-keymaps');
          core.keymaps.handleKeyboardEvent(
            buildKeydownEvent('z', { ctrl: true, target: element })
          );
          expect(events.length).toBe(2);
          expect(events[1].type).toBe('user-command');
        });
      });
    });

    describe('menu loading', () => {
      beforeEach(() => {
        core.contextMenu.definitions = [];
        core.menu.template = [];
      });

      describe("when the metadata does not contain a 'menus' manifest", () => {
        it('loads all the .cson/.json files in the menus directory', async () => {
          const element = createTestElement('test-1');
          expect(core.contextMenu.templateForElement(element)).toEqual([]);

          await core.packages.activatePackage('package-with-menus');
          expect(core.menu.template.length).toBe(2);
          expect(core.menu.template[0].label).toBe('Second to Last');
          expect(core.menu.template[1].label).toBe('Last');
          expect(core.contextMenu.templateForElement(element)[0].label).toBe(
            'Menu item 1'
          );
          expect(core.contextMenu.templateForElement(element)[1].label).toBe(
            'Menu item 2'
          );
          expect(core.contextMenu.templateForElement(element)[2].label).toBe(
            'Menu item 3'
          );
        });
      });

      describe("when the metadata contains a 'menus' manifest", () => {
        it('loads only the menus specified by the manifest, in the specified order', async () => {
          const element = createTestElement('test-1');
          expect(core.contextMenu.templateForElement(element)).toEqual([]);

          await core.packages.activatePackage('package-with-menus-manifest');
          expect(core.menu.template[0].label).toBe('Second to Last');
          expect(core.menu.template[1].label).toBe('Last');
          expect(core.contextMenu.templateForElement(element)[0].label).toBe(
            'Menu item 2'
          );
          expect(core.contextMenu.templateForElement(element)[1].label).toBe(
            'Menu item 1'
          );
          expect(
            core.contextMenu.templateForElement(element)[2]
          ).toBeUndefined();
        });
      });

      describe('when the menu file is empty', () => {
        it('does not throw an error on activation', async () => {
          await core.packages.activatePackage('package-with-empty-menu');
          expect(core.packages.isPackageActive('package-with-empty-menu')).toBe(
            true
          );
        });
      });
    });

    describe('stylesheet loading', () => {
      describe("when the metadata contains a 'styleSheets' manifest", () => {
        it('loads style sheets from the styles directory as specified by the manifest', async () => {
          const one = require.resolve(
            './fixtures/packages/package-with-style-sheets-manifest/styles/1.css'
          );
          const two = require.resolve(
            './fixtures/packages/package-with-style-sheets-manifest/styles/2.less'
          );
          const three = require.resolve(
            './fixtures/packages/package-with-style-sheets-manifest/styles/3.css'
          );

          expect(core.themes.stylesheetElementForId(one)).toBeNull();
          expect(core.themes.stylesheetElementForId(two)).toBeNull();
          expect(core.themes.stylesheetElementForId(three)).toBeNull();

          await core.packages.activatePackage(
            'package-with-style-sheets-manifest'
          );
          expect(core.themes.stylesheetElementForId(one)).not.toBeNull();
          expect(core.themes.stylesheetElementForId(two)).not.toBeNull();
          expect(core.themes.stylesheetElementForId(three)).toBeNull();
          expect(
            getComputedStyle(document.querySelector('#jasmine-content'))
              .fontSize
          ).toBe('1px');
        });
      });

      describe("when the metadata does not contain a 'styleSheets' manifest", () => {
        it('loads all style sheets from the styles directory', async () => {
          const one = require.resolve(
            './fixtures/packages/package-with-styles/styles/1.css'
          );
          const two = require.resolve(
            './fixtures/packages/package-with-styles/styles/2.less'
          );
          const three = require.resolve(
            './fixtures/packages/package-with-styles/styles/3.test-context.css'
          );
          const four = require.resolve(
            './fixtures/packages/package-with-styles/styles/4.css'
          );

          expect(core.themes.stylesheetElementForId(one)).toBeNull();
          expect(core.themes.stylesheetElementForId(two)).toBeNull();
          expect(core.themes.stylesheetElementForId(three)).toBeNull();
          expect(core.themes.stylesheetElementForId(four)).toBeNull();

          await core.packages.activatePackage('package-with-styles');
          expect(core.themes.stylesheetElementForId(one)).not.toBeNull();
          expect(core.themes.stylesheetElementForId(two)).not.toBeNull();
          expect(core.themes.stylesheetElementForId(three)).not.toBeNull();
          expect(core.themes.stylesheetElementForId(four)).not.toBeNull();
          expect(
            getComputedStyle(document.querySelector('#jasmine-content'))
              .fontSize
          ).toBe('3px');
        });
      });

      it("assigns the stylesheet's context based on the filename", async () => {
        await core.packages.activatePackage('package-with-styles');

        let count = 0;
        for (let styleElement of core.styles.getStyleElements()) {
          if (styleElement.sourcePath.match(/1.css/)) {
            expect(styleElement.context).toBe(undefined);
            count++;
          }

          if (styleElement.sourcePath.match(/2.less/)) {
            expect(styleElement.context).toBe(undefined);
            count++;
          }

          if (styleElement.sourcePath.match(/3.test-context.css/)) {
            expect(styleElement.context).toBe('test-context');
            count++;
          }

          if (styleElement.sourcePath.match(/4.css/)) {
            expect(styleElement.context).toBe(undefined);
            count++;
          }
        }

        expect(count).toBe(4);
      });
    });

    describe('grammar loading', () => {
      it("loads the package's grammars", async () => {
        await core.packages.activatePackage('package-with-grammars');
        expect(core.grammars.selectGrammar('a.alot').name).toBe('Alot');
        expect(core.grammars.selectGrammar('a.alittle').name).toBe('Alittle');
      });

      it('loads any tree-sitter grammars defined in the package', async () => {
        core.config.set('core.useTreeSitterParsers', true);
        await core.packages.activatePackage('package-with-tree-sitter-grammar');
        const grammar = core.grammars.selectGrammar('test.somelang');
        expect(grammar.name).toBe('Some Language');
        expect(grammar.languageModule.isFakeTreeSitterParser).toBe(true);
      });
    });

    describe('scoped-property loading', () => {
      it('loads the scoped properties', async () => {
        await core.packages.activatePackage('package-with-settings');
        expect(
          core.config.get('editor.increaseIndentPattern', {
            scope: ['.source.omg']
          })
        ).toBe('^a');
      });
    });

    describe('URI handler registration', () => {
      it("registers the package's specified URI handler", async () => {
        const uri = 'atom://package-with-uri-handler/some/url?with=args';
        const mod = require('./fixtures/packages/package-with-uri-handler');
        spyOn(mod, 'handleURI');
        spyOn(core.packages, 'hasLoadedInitialPackages').andReturn(true);
        const activationPromise = core.packages.activatePackage(
          'package-with-uri-handler'
        );
        core.dispatchURIMessage(uri);
        await activationPromise;
        expect(mod.handleURI).toHaveBeenCalledWith(url.parse(uri, true), uri);
      });
    });

    describe('service registration', () => {
      it("registers the package's provided and consumed services", async () => {
        const consumerModule = require('./fixtures/packages/package-with-consumed-services');

        let firstServiceV3Disposed = false;
        let firstServiceV4Disposed = false;
        let secondServiceDisposed = false;
        spyOn(consumerModule, 'consumeFirstServiceV3').andReturn(
          new Disposable(() => {
            firstServiceV3Disposed = true;
          })
        );
        spyOn(consumerModule, 'consumeFirstServiceV4').andReturn(
          new Disposable(() => {
            firstServiceV4Disposed = true;
          })
        );
        spyOn(consumerModule, 'consumeSecondService').andReturn(
          new Disposable(() => {
            secondServiceDisposed = true;
          })
        );

        await core.packages.activatePackage('package-with-consumed-services');
        await core.packages.activatePackage('package-with-provided-services');
        expect(consumerModule.consumeFirstServiceV3.callCount).toBe(1);
        expect(consumerModule.consumeFirstServiceV3).toHaveBeenCalledWith(
          'first-service-v3'
        );
        expect(consumerModule.consumeFirstServiceV4).toHaveBeenCalledWith(
          'first-service-v4'
        );
        expect(consumerModule.consumeSecondService).toHaveBeenCalledWith(
          'second-service'
        );

        consumerModule.consumeFirstServiceV3.reset();
        consumerModule.consumeFirstServiceV4.reset();
        consumerModule.consumeSecondService.reset();

        await core.packages.deactivatePackage('package-with-provided-services');
        expect(firstServiceV3Disposed).toBe(true);
        expect(firstServiceV4Disposed).toBe(true);
        expect(secondServiceDisposed).toBe(true);

        await core.packages.deactivatePackage('package-with-consumed-services');
        await core.packages.activatePackage('package-with-provided-services');
        expect(consumerModule.consumeFirstServiceV3).not.toHaveBeenCalled();
        expect(consumerModule.consumeFirstServiceV4).not.toHaveBeenCalled();
        expect(consumerModule.consumeSecondService).not.toHaveBeenCalled();
      });

      it('ignores provided and consumed services that do not exist', async () => {
        const addErrorHandler = jasmine.createSpy();
        core.notifications.onDidAddNotification(addErrorHandler);

        await core.packages.activatePackage(
          'package-with-missing-consumed-services'
        );
        await core.packages.activatePackage(
          'package-with-missing-provided-services'
        );
        expect(
          core.packages.isPackageActive(
            'package-with-missing-consumed-services'
          )
        ).toBe(true);
        expect(
          core.packages.isPackageActive(
            'package-with-missing-provided-services'
          )
        ).toBe(true);
        expect(addErrorHandler.callCount).toBe(0);
      });
    });
  });

  describe('::serialize', () => {
    it('does not serialize packages that threw an error during activation', async () => {
      spyOn(core, 'inSpecMode').andReturn(false);
      spyOn(console, 'warn');

      const badPack = await core.packages.activatePackage(
        'package-that-throws-on-activate'
      );
      spyOn(badPack.mainModule, 'serialize').andCallThrough();

      core.packages.serialize();
      expect(badPack.mainModule.serialize).not.toHaveBeenCalled();
    });

    it("absorbs exceptions that are thrown by the package module's serialize method", async () => {
      spyOn(console, 'error');

      await core.packages.activatePackage('package-with-serialize-error');
      await core.packages.activatePackage('package-with-serialization');
      core.packages.serialize();
      expect(
        core.packages.packageStates['package-with-serialize-error']
      ).toBeUndefined();
      expect(core.packages.packageStates['package-with-serialization']).toEqual(
        { someNumber: 1 }
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('::deactivatePackages()', () => {
    it('deactivates all packages but does not serialize them', async () => {
      const pack1 = await core.packages.activatePackage(
        'package-with-deactivate'
      );
      const pack2 = await core.packages.activatePackage(
        'package-with-serialization'
      );

      spyOn(pack1.mainModule, 'deactivate');
      spyOn(pack2.mainModule, 'serialize');
      await core.packages.deactivatePackages();
      expect(pack1.mainModule.deactivate).toHaveBeenCalled();
      expect(pack2.mainModule.serialize).not.toHaveBeenCalled();
    });
  });

  describe('::deactivatePackage(id)', () => {
    afterEach(() => core.packages.unloadPackages());

    it("calls `deactivate` on the package's main module if activate was successful", async () => {
      spyOn(core, 'inSpecMode').andReturn(false);

      const pack = await core.packages.activatePackage(
        'package-with-deactivate'
      );
      expect(
        core.packages.isPackageActive('package-with-deactivate')
      ).toBeTruthy();
      spyOn(pack.mainModule, 'deactivate').andCallThrough();

      await core.packages.deactivatePackage('package-with-deactivate');
      expect(pack.mainModule.deactivate).toHaveBeenCalled();
      expect(core.packages.isPackageActive('package-with-module')).toBeFalsy();

      spyOn(console, 'warn');
      const badPack = await core.packages.activatePackage(
        'package-that-throws-on-activate'
      );
      expect(
        core.packages.isPackageActive('package-that-throws-on-activate')
      ).toBeTruthy();
      spyOn(badPack.mainModule, 'deactivate').andCallThrough();

      await core.packages.deactivatePackage('package-that-throws-on-activate');
      expect(badPack.mainModule.deactivate).not.toHaveBeenCalled();
      expect(
        core.packages.isPackageActive('package-that-throws-on-activate')
      ).toBeFalsy();
    });

    it("absorbs exceptions that are thrown by the package module's deactivate method", async () => {
      spyOn(console, 'error');
      await core.packages.activatePackage('package-that-throws-on-deactivate');
      await core.packages.deactivatePackage(
        'package-that-throws-on-deactivate'
      );
      expect(console.error).toHaveBeenCalled();
    });

    it("removes the package's grammars", async () => {
      await core.packages.activatePackage('package-with-grammars');
      await core.packages.deactivatePackage('package-with-grammars');
      expect(core.grammars.selectGrammar('a.alot').name).toBe('Null Grammar');
      expect(core.grammars.selectGrammar('a.alittle').name).toBe(
        'Null Grammar'
      );
    });

    it("removes the package's keymaps", async () => {
      await core.packages.activatePackage('package-with-keymaps');
      await core.packages.deactivatePackage('package-with-keymaps');
      expect(
        core.keymaps.findKeyBindings({
          keystrokes: 'ctrl-z',
          target: createTestElement('test-1')
        })
      ).toHaveLength(0);
      expect(
        core.keymaps.findKeyBindings({
          keystrokes: 'ctrl-z',
          target: createTestElement('test-2')
        })
      ).toHaveLength(0);
    });

    it("removes the package's stylesheets", async () => {
      await core.packages.activatePackage('package-with-styles');
      await core.packages.deactivatePackage('package-with-styles');

      const one = require.resolve(
        './fixtures/packages/package-with-style-sheets-manifest/styles/1.css'
      );
      const two = require.resolve(
        './fixtures/packages/package-with-style-sheets-manifest/styles/2.less'
      );
      const three = require.resolve(
        './fixtures/packages/package-with-style-sheets-manifest/styles/3.css'
      );
      expect(core.themes.stylesheetElementForId(one)).not.toExist();
      expect(core.themes.stylesheetElementForId(two)).not.toExist();
      expect(core.themes.stylesheetElementForId(three)).not.toExist();
    });

    it("removes the package's scoped-properties", async () => {
      await core.packages.activatePackage('package-with-settings');
      expect(
        core.config.get('editor.increaseIndentPattern', {
          scope: ['.source.omg']
        })
      ).toBe('^a');

      await core.packages.deactivatePackage('package-with-settings');
      expect(
        core.config.get('editor.increaseIndentPattern', {
          scope: ['.source.omg']
        })
      ).toBeUndefined();
    });

    it('invokes ::onDidDeactivatePackage listeners with the deactivated package', async () => {
      await core.packages.activatePackage('package-with-main');

      let deactivatedPackage;
      core.packages.onDidDeactivatePackage(pack => {
        deactivatedPackage = pack;
      });

      await core.packages.deactivatePackage('package-with-main');
      expect(deactivatedPackage.name).toBe('package-with-main');
    });
  });

  describe('::activate()', () => {
    beforeEach(() => {
      spyOn(core, 'inSpecMode').andReturn(false);
      jasmine.snapshotDeprecations();
      spyOn(console, 'warn');
      core.packages.loadPackages();

      const loadedPackages = core.packages.getLoadedPackages();
      expect(loadedPackages.length).toBeGreaterThan(0);
    });

    afterEach(async () => {
      await core.packages.deactivatePackages();
      core.packages.unloadPackages();
      jasmine.restoreDeprecationsSnapshot();
    });

    it('sets hasActivatedInitialPackages', async () => {
      spyOn(core.styles, 'getUserStyleSheetPath').andReturn(null);
      spyOn(core.packages, 'activatePackages');
      expect(core.packages.hasActivatedInitialPackages()).toBe(false);

      await core.packages.activate();
      expect(core.packages.hasActivatedInitialPackages()).toBe(true);
    });

    it('activates all the packages, and none of the themes', () => {
      const packageActivator = spyOn(core.packages, 'activatePackages');
      const themeActivator = spyOn(core.themes, 'activatePackages');

      core.packages.activate();

      expect(packageActivator).toHaveBeenCalled();
      expect(themeActivator).toHaveBeenCalled();

      const packages = packageActivator.mostRecentCall.args[0];
      for (let pack of packages) {
        expect(['atom', 'textmate']).toContain(pack.getType());
      }

      const themes = themeActivator.mostRecentCall.args[0];
      themes.map(theme => expect(['theme']).toContain(theme.getType()));
    });

    it('calls callbacks registered with ::onDidActivateInitialPackages', async () => {
      const package1 = core.packages.loadPackage('package-with-main');
      const package2 = core.packages.loadPackage('package-with-index');
      const package3 = core.packages.loadPackage(
        'package-with-activation-commands'
      );
      spyOn(core.packages, 'getLoadedPackages').andReturn([
        package1,
        package2,
        package3
      ]);
      spyOn(core.themes, 'activatePackages');

      core.packages.activate();
      await new Promise(resolve =>
        core.packages.onDidActivateInitialPackages(resolve)
      );

      jasmine.unspy(core.packages, 'getLoadedPackages');
      expect(core.packages.getActivePackages().includes(package1)).toBe(true);
      expect(core.packages.getActivePackages().includes(package2)).toBe(true);
      expect(core.packages.getActivePackages().includes(package3)).toBe(false);
    });
  });

  describe('::enablePackage(id) and ::disablePackage(id)', () => {
    describe('with packages', () => {
      it('enables a disabled package', async () => {
        const packageName = 'package-with-main';
        core.config.pushAtKeyPath('core.disabledPackages', packageName);
        core.packages.observeDisabledPackages();
        expect(core.config.get('core.disabledPackages')).toContain(packageName);

        const pack = core.packages.enablePackage(packageName);
        await new Promise(resolve =>
          core.packages.onDidActivatePackage(resolve)
        );

        expect(core.packages.getLoadedPackages()).toContain(pack);
        expect(core.packages.getActivePackages()).toContain(pack);
        expect(core.config.get('core.disabledPackages')).not.toContain(
          packageName
        );
      });

      it('disables an enabled package', async () => {
        const packageName = 'package-with-main';
        const pack = await core.packages.activatePackage(packageName);

        core.packages.observeDisabledPackages();
        expect(core.config.get('core.disabledPackages')).not.toContain(
          packageName
        );
        await new Promise(resolve => {
          core.packages.onDidDeactivatePackage(resolve);
          core.packages.disablePackage(packageName);
        });

        expect(core.packages.getActivePackages()).not.toContain(pack);
        expect(core.config.get('core.disabledPackages')).toContain(packageName);
      });

      it('returns null if the package cannot be loaded', () => {
        spyOn(console, 'warn');
        expect(core.packages.enablePackage('this-doesnt-exist')).toBeNull();
        expect(console.warn.callCount).toBe(1);
      });

      it('does not disable an already disabled package', () => {
        const packageName = 'package-with-main';
        core.config.pushAtKeyPath('core.disabledPackages', packageName);
        core.packages.observeDisabledPackages();
        expect(core.config.get('core.disabledPackages')).toContain(packageName);

        core.packages.disablePackage(packageName);
        const packagesDisabled = core.config
          .get('core.disabledPackages')
          .filter(pack => pack === packageName);
        expect(packagesDisabled.length).toEqual(1);
      });
    });

    describe('with themes', () => {
      beforeEach(() => core.themes.activateThemes());
      afterEach(() => core.themes.deactivateThemes());

      it('enables and disables a theme', async () => {
        const packageName = 'theme-with-package-file';
        expect(core.config.get('core.themes')).not.toContain(packageName);
        expect(core.config.get('core.disabledPackages')).not.toContain(
          packageName
        );

        // enabling of theme
        const pack = core.packages.enablePackage(packageName);
        await new Promise(resolve =>
          core.packages.onDidActivatePackage(resolve)
        );
        expect(core.packages.isPackageActive(packageName)).toBe(true);
        expect(core.config.get('core.themes')).toContain(packageName);
        expect(core.config.get('core.disabledPackages')).not.toContain(
          packageName
        );

        await new Promise(resolve => {
          core.themes.onDidChangeActiveThemes(resolve);
          core.packages.disablePackage(packageName);
        });

        expect(core.packages.getActivePackages()).not.toContain(pack);
        expect(core.config.get('core.themes')).not.toContain(packageName);
        expect(core.config.get('core.themes')).not.toContain(packageName);
        expect(core.config.get('core.disabledPackages')).not.toContain(
          packageName
        );
      });
    });
  });

  describe('::getAvailablePackageNames', () => {
    it('detects a symlinked package', () => {
      const packageSymLinkedSource = path.join(
        __dirname,
        'fixtures',
        'packages',
        'folder',
        'package-symlinked'
      );
      const destination = path.join(
        core.packages.getPackageDirPaths()[0],
        'package-symlinked'
      );
      if (!fs.isDirectorySync(destination)) {
        fs.symlinkSync(packageSymLinkedSource, destination, 'junction');
      }
      const availablePackages = core.packages.getAvailablePackageNames();
      expect(availablePackages.includes('package-symlinked')).toBe(true);
      fs.removeSync(destination);
    });
  });
});
