
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms, true));
}

describe('PulsarUpdater', () => {

  let pack, workspaceElement;
  beforeEach(async () => {
    atom.config.set("pulsar-updater.checkForUpdatesOnLaunch", false);
    workspaceElement = atom.views.getView(atom.workspace);
    pack = await atom.packages.activatePackage('pulsar-updater');
    pack.mainModule.cache?.empty("last-update-check");
  });

  afterEach(async () => {
    pack.mainModule.cache?.empty("last-update-check");
    await atom.packages.deactivatePackage('pulsar-updater');
  });

  describe('when pulsar-updater:check-for-updates is triggered', () => {
    beforeEach(async () => {
      spyOn(pack.mainModule, 'checkForUpdates');
    })
    it('triggers an update check', () => {
      atom.commands.dispatch(workspaceElement, 'pulsar-updater:check-for-update');
      expect(pack.mainModule.checkForUpdates).toHaveBeenCalled();
    });
  });

  describe("when the remote version is greater than ours", () => {
    beforeEach(() => {
      spyOn(atom, "getVersion").andReturn("1.0.0");
      spyOn(pack.mainModule, 'findNewestRelease').andCallFake(() => {
        return "2.0.0";
      })
      spyOn(pack.mainModule, 'notifyAboutUpdate').andCallThrough();
      spyOn(pack.mainModule, 'notifyAboutCurrent').andCallThrough();
    });

    afterEach(() => {
      pack.mainModule.notifyAboutUpdate.reset();
      pack.mainModule.notifyAboutCurrent.reset();
    })

    it("signals that the user should update", async () => {
      jasmine.useRealClock();
      atom.commands.dispatch(workspaceElement, 'pulsar-updater:check-for-update');
      await wait(200);
      expect(pack.mainModule.notifyAboutUpdate).toHaveBeenCalledWith("2.0.0");
      expect(pack.mainModule.notifyAboutCurrent).not.toHaveBeenCalled();
    });
  });

  describe("when the remote version is equal to ours", () => {
    beforeEach(() => {
      spyOn(atom, "getVersion").andReturn("1.0.5");
      spyOn(pack.mainModule, 'findNewestRelease').andCallFake(() => {
        return "1.0.5";
      })
      spyOn(pack.mainModule, 'notifyAboutUpdate');
      spyOn(pack.mainModule, 'notifyAboutCurrent');
    });

    it("takes no action", async () => {
      jasmine.useRealClock();
      atom.commands.dispatch(workspaceElement, 'pulsar-updater:check-for-update');
      await wait(200);
      expect(pack.mainModule.notifyAboutUpdate).not.toHaveBeenCalled();
      expect(pack.mainModule.notifyAboutCurrent).toHaveBeenCalledWith("1.0.5", true);
    });
  });

  describe("when the user tells us to ignore until the next version", () => {
    let latestVersion = "1.0.6";
    beforeEach(() => {
      spyOn(atom, "getVersion").andReturn("1.0.5");
      spyOn(pack.mainModule, 'findNewestRelease').andCallFake(() => {
        return latestVersion;
      });
      spyOn(pack.mainModule, 'notifyAboutUpdate').andCallThrough();
      spyOn(pack.mainModule, 'notifyAboutCurrent').andCallThrough();
    });

    it("subsequent checks do not result in notifications", async () => {
      jasmine.useRealClock();
      atom.commands.dispatch(workspaceElement, 'pulsar-updater:check-for-update');
      await wait(200);

      expect(pack.mainModule.notifyAboutUpdate).toHaveBeenCalledWith("1.0.6");
      expect(pack.mainModule.notifyAboutCurrent).not.toHaveBeenCalled();

      pack.mainModule.ignoreForThisVersion("1.0.6");
      // Calling the method directly here because eventually we'll want a
      // user-initiated check for updates to ignore this cache.
      pack.mainModule.checkForUpdates();
      await wait(200);

      expect(pack.mainModule.notifyAboutUpdate.callCount).toBe(1);
      expect(pack.mainModule.notifyAboutCurrent).not.toHaveBeenCalled();

      latestVersion = "1.0.7";

      pack.mainModule.checkForUpdates();
      await wait(200);
      expect(pack.mainModule.notifyAboutUpdate).toHaveBeenCalledWith("1.0.7");
      expect(pack.mainModule.notifyAboutCurrent).not.toHaveBeenCalled();
    });
  });

});
