
describe('PulsarUpdater', () => {

  beforeEach(async () => {
    await atom.packages.activatePackage('pulsar-updater');
  });

  afterEach(async () => {
    await atom.packages.deactivatePackage('pulsar-updater');
  });

  describe('when pulsar-updater:check-for-updates is triggered', () => {
    it('triggers an update check', () => {
      //atom.commands.dispatch('application', 'pulsar-updater:check-for-updates');

      // TODO find how to check for this
    });
  });
});
