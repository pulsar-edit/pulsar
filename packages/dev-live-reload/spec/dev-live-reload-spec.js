describe('Dev Live Reload', () => {
  describe('package activation', () => {
    let [pack, mainModule] = [];

    beforeEach(() => {
      pack = core.packages.loadPackage('dev-live-reload');
      pack.requireMainModule();
      mainModule = pack.mainModule;
      spyOn(mainModule, 'startWatching');
    });

    describe('when the window is not in dev mode', () => {
      beforeEach(() => spyOn(core, 'inDevMode').andReturn(false));

      it('does not watch files', async () => {
        spyOn(core.packages, 'hasActivatedInitialPackages').andReturn(true);

        await core.packages.activatePackage('dev-live-reload');
        expect(mainModule.startWatching).not.toHaveBeenCalled();
      });
    });

    describe('when the window is in spec mode', () => {
      beforeEach(() => spyOn(core, 'inSpecMode').andReturn(true));

      it('does not watch files', async () => {
        spyOn(core.packages, 'hasActivatedInitialPackages').andReturn(true);

        await core.packages.activatePackage('dev-live-reload');
        expect(mainModule.startWatching).not.toHaveBeenCalled();
      });
    });

    describe('when the window is in dev mode', () => {
      beforeEach(() => {
        spyOn(core, 'inDevMode').andReturn(true);
        spyOn(core, 'inSpecMode').andReturn(false);
      });

      it('watches files', async () => {
        spyOn(core.packages, 'hasActivatedInitialPackages').andReturn(true);

        await core.packages.activatePackage('dev-live-reload');
        expect(mainModule.startWatching).toHaveBeenCalled();
      });
    });

    describe('when the window is in both dev mode and spec mode', () => {
      beforeEach(() => {
        spyOn(core, 'inDevMode').andReturn(true);
        spyOn(core, 'inSpecMode').andReturn(true);
      });

      it('does not watch files', async () => {
        spyOn(core.packages, 'hasActivatedInitialPackages').andReturn(true);

        await core.packages.activatePackage('dev-live-reload');
        expect(mainModule.startWatching).not.toHaveBeenCalled();
      });
    });

    describe('when the package is activated before initial packages have been activated', () => {
      beforeEach(() => {
        spyOn(core, 'inDevMode').andReturn(true);
        spyOn(core, 'inSpecMode').andReturn(false);
      });

      it('waits until all initial packages have been activated before watching files', async () => {
        await core.packages.activatePackage('dev-live-reload');
        expect(mainModule.startWatching).not.toHaveBeenCalled();

        core.packages.emitter.emit('did-activate-initial-packages');
        expect(mainModule.startWatching).toHaveBeenCalled();
      });
    });
  });

  describe('package deactivation', () => {
    beforeEach(() => {
      spyOn(core, 'inDevMode').andReturn(true);
      spyOn(core, 'inSpecMode').andReturn(false);
    });

    it('stops watching all files', async () => {
      spyOn(core.packages, 'hasActivatedInitialPackages').andReturn(true);
      const { mainModule } = await core.packages.activatePackage(
        'dev-live-reload'
      );
      expect(mainModule.uiWatcher).not.toBeNull();

      spyOn(mainModule.uiWatcher, 'destroy');

      await core.packages.deactivatePackage('dev-live-reload');
      expect(mainModule.uiWatcher.destroy).toHaveBeenCalled();
    });

    it('unsubscribes from the onDidActivateInitialPackages subscription if it is disabled before all initial packages are activated', async () => {
      const { mainModule } = await core.packages.activatePackage(
        'dev-live-reload'
      );
      expect(mainModule.activatedDisposable.disposed).toBe(false);

      await core.packages.deactivatePackage('dev-live-reload');
      expect(mainModule.activatedDisposable.disposed).toBe(true);

      spyOn(mainModule, 'startWatching');
      core.packages.emitter.emit('did-activate-initial-packages');
      expect(mainModule.startWatching).not.toHaveBeenCalled();
    });

    it('removes its commands', async () => {
      spyOn(core.packages, 'hasActivatedInitialPackages').andReturn(true);
      await core.packages.activatePackage('dev-live-reload');
      expect(
        core.commands
          .findCommands({ target: core.views.getView(core.workspace) })
          .filter(command => command.name.startsWith('dev-live-reload')).length
      ).toBeGreaterThan(0);

      await core.packages.deactivatePackage('dev-live-reload');
      expect(
        core.commands
          .findCommands({ target: core.views.getView(core.workspace) })
          .filter(command => command.name.startsWith('dev-live-reload')).length
      ).toBe(0);
    });
  });
});
