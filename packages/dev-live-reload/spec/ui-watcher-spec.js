const path = require('path');

const UIWatcher = require('../lib/ui-watcher');

const { conditionPromise } = require('./async-spec-helpers');

describe('UIWatcher', () => {
  let uiWatcher = null;

  beforeEach(() =>
    core.packages.packageDirPaths.push(path.join(__dirname, 'fixtures'))
  );

  afterEach(() => uiWatcher && uiWatcher.destroy());

  describe("when a base theme's file changes", () => {
    beforeEach(() => {
      spyOn(core.themes, 'resolveStylesheet').andReturn(
        path.join(__dirname, 'fixtures', 'static', 'atom.less')
      );
      uiWatcher = new UIWatcher();
    });

    it('reloads all the base styles', () => {
      spyOn(core.themes, 'reloadBaseStylesheets');

      expect(uiWatcher.baseTheme.entities[0].getPath()).toContain(
        `${path.sep}static${path.sep}`
      );

      uiWatcher.baseTheme.entities[0].emitter.emit('did-change');
      expect(core.themes.reloadBaseStylesheets).toHaveBeenCalled();
    });
  });

  it("watches all the style sheets in the theme's styles folder", async () => {
    const packagePath = path.join(
      __dirname,
      'fixtures',
      'package-with-styles-folder'
    );

    await core.packages.activatePackage(packagePath);
    uiWatcher = new UIWatcher();

    const lastWatcher = uiWatcher.watchers[uiWatcher.watchers.length - 1];

    expect(lastWatcher.entities.length).toBe(4);
    expect(lastWatcher.entities[0].getPath()).toBe(
      path.join(packagePath, 'styles')
    );
    expect(lastWatcher.entities[1].getPath()).toBe(
      path.join(packagePath, 'styles', '3.css')
    );
    expect(lastWatcher.entities[2].getPath()).toBe(
      path.join(packagePath, 'styles', 'sub', '1.css')
    );
    expect(lastWatcher.entities[3].getPath()).toBe(
      path.join(packagePath, 'styles', 'sub', '2.less')
    );
  });

  describe('when a package stylesheet file changes', async () => {
    beforeEach(async () => {
      await core.packages.activatePackage(
        path.join(__dirname, 'fixtures', 'package-with-styles-manifest')
      );
      uiWatcher = new UIWatcher();
    });

    it('reloads all package styles', () => {
      const pack = core.packages.getActivePackages()[0];
      spyOn(pack, 'reloadStylesheets');

      uiWatcher.watchers[
        uiWatcher.watchers.length - 1
      ].entities[1].emitter.emit('did-change');

      expect(pack.reloadStylesheets).toHaveBeenCalled();
    });
  });

  describe('when a package does not have a stylesheet', () => {
    beforeEach(async () => {
      await core.packages.activatePackage('package-with-index');
      uiWatcher = new UIWatcher();
    });

    it('does not create a PackageWatcher', () => {
      expect(uiWatcher.watchedPackages['package-with-index']).toBeUndefined();
    });
  });

  describe('when a package global file changes', () => {
    beforeEach(async () => {
      core.config.set('core.themes', [
        'theme-with-ui-variables',
        'theme-with-multiple-imported-files'
      ]);

      await core.themes.activateThemes();
      uiWatcher = new UIWatcher();
    });

    afterEach(() => core.themes.deactivateThemes());

    it('reloads every package when the variables file changes', () => {
      let varEntity;
      for (const theme of core.themes.getActiveThemes()) {
        spyOn(theme, 'reloadStylesheets');
      }

      for (const entity of uiWatcher.watchedThemes.get(
        'theme-with-multiple-imported-files'
      ).entities) {
        if (entity.getPath().indexOf('variables') > -1) varEntity = entity;
      }
      varEntity.emitter.emit('did-change');

      for (const theme of core.themes.getActiveThemes()) {
        expect(theme.reloadStylesheets).toHaveBeenCalled();
      }
    });
  });

  describe('watcher lifecycle', () => {
    it('starts watching a package if it is activated after initial startup', async () => {
      uiWatcher = new UIWatcher();
      expect(uiWatcher.watchedPackages.size).toBe(0);

      await core.packages.activatePackage(
        path.join(__dirname, 'fixtures', 'package-with-styles-folder')
      );
      expect(
        uiWatcher.watchedPackages.get('package-with-styles-folder')
      ).not.toBeUndefined();
    });

    it('unwatches a package after it is deactivated', async () => {
      await core.packages.activatePackage(
        path.join(__dirname, 'fixtures', 'package-with-styles-folder')
      );
      uiWatcher = new UIWatcher();
      const watcher = uiWatcher.watchedPackages.get(
        'package-with-styles-folder'
      );
      expect(watcher).not.toBeUndefined();

      const watcherDestructionSpy = jasmine.createSpy('watcher-on-did-destroy');
      watcher.onDidDestroy(watcherDestructionSpy);

      await core.packages.deactivatePackage('package-with-styles-folder');
      expect(
        uiWatcher.watchedPackages.get('package-with-styles-folder')
      ).toBeUndefined();
      expect(uiWatcher.watchedPackages.size).toBe(0);
      expect(watcherDestructionSpy).toHaveBeenCalled();
    });

    it('does not watch activated packages after the UI watcher has been destroyed', async () => {
      uiWatcher = new UIWatcher();
      uiWatcher.destroy();

      await core.packages.activatePackage(
        path.join(__dirname, 'fixtures', 'package-with-styles-folder')
      );
      expect(uiWatcher.watchedPackages.size).toBe(0);
    });
  });

  describe('minimal theme packages', () => {
    let pack = null;
    beforeEach(async () => {
      core.config.set('core.themes', [
        'theme-with-syntax-variables',
        'theme-with-index-less'
      ]);
      await core.themes.activateThemes();
      uiWatcher = new UIWatcher();
      pack = core.themes.getActiveThemes()[0];
    });

    afterEach(() => core.themes.deactivateThemes());

    it('watches themes without a styles directory', () => {
      spyOn(pack, 'reloadStylesheets');
      spyOn(core.themes, 'reloadBaseStylesheets');

      const watcher = uiWatcher.watchedThemes.get('theme-with-index-less');

      expect(watcher.entities.length).toBe(1);

      watcher.entities[0].emitter.emit('did-change');
      expect(pack.reloadStylesheets).toHaveBeenCalled();
      expect(core.themes.reloadBaseStylesheets).not.toHaveBeenCalled();
    });
  });

  describe('theme packages', () => {
    let pack = null;
    beforeEach(async () => {
      core.config.set('core.themes', [
        'theme-with-syntax-variables',
        'theme-with-multiple-imported-files'
      ]);

      await core.themes.activateThemes();
      uiWatcher = new UIWatcher();
      pack = core.themes.getActiveThemes()[0];
    });

    afterEach(() => core.themes.deactivateThemes());

    it('reloads the theme when anything within the theme changes', () => {
      spyOn(pack, 'reloadStylesheets');
      spyOn(core.themes, 'reloadBaseStylesheets');

      const watcher = uiWatcher.watchedThemes.get(
        'theme-with-multiple-imported-files'
      );

      expect(watcher.entities.length).toBe(6);

      watcher.entities[2].emitter.emit('did-change');
      expect(pack.reloadStylesheets).toHaveBeenCalled();
      expect(core.themes.reloadBaseStylesheets).not.toHaveBeenCalled();

      watcher.entities[watcher.entities.length - 1].emitter.emit('did-change');
      expect(core.themes.reloadBaseStylesheets).toHaveBeenCalled();
    });

    it('unwatches when a theme is deactivated', async () => {
      jasmine.useRealClock();

      core.config.set('core.themes', []);
      await conditionPromise(
        () => !uiWatcher.watchedThemes['theme-with-multiple-imported-files']
      );
    });

    it('watches a new theme when it is deactivated', async () => {
      jasmine.useRealClock();

      core.config.set('core.themes', [
        'theme-with-syntax-variables',
        'theme-with-package-file'
      ]);
      await conditionPromise(() =>
        uiWatcher.watchedThemes.get('theme-with-package-file')
      );

      pack = core.themes.getActiveThemes()[0];
      spyOn(pack, 'reloadStylesheets');

      expect(pack.name).toBe('theme-with-package-file');

      const watcher = uiWatcher.watchedThemes.get('theme-with-package-file');
      watcher.entities[2].emitter.emit('did-change');
      expect(pack.reloadStylesheets).toHaveBeenCalled();
    });
  });
});
