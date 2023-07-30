
describe('PulsarUpdater', () => {

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activatePackage("pulsar-updater"));
  });

  afterEach(() => {
    waitsForPromise(() => atom.packages.deactivatePackage("pulsar-updater"));
  });

  describe('when pulsar-updater:check-for-updates is triggered', () => {
    it('triggers an update check', () => {
      //atom.commands.dispatch('application', 'pulsar-updater:check-for-updates');

      // TODO find how to check for this
    });
  });

  it("when the version is greater than", () => {
    // WARNING: This is known to not work. But hopefully some assistance and example code can get this straightened out

    spnOn(atom, "getVersion").andReturn("1.0.0");

    let updater = atom.packages.getActivePackage("pulsar-updater");

    updater.mainModule.findNewestRelease = async () => {
      return "2.0.0";
    };

    let cbCalled = false;
    let cbVersion;

    updater.emitter.on("pulsar-updater:update-triggered", ({version}) => {
      cbCalled = true;
      cbVersion = version;
    });

    atom.commands.dispatch("application", "pulsar-updater:check-for-updates");

    expect(cbCalled).toBe(true);
    expect(cbVersion).toBe("2.0.0");
  });

});
