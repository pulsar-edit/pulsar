const UpdateManager = require('../lib/update-manager');

describe('UpdateManager', () => {
  let updateManager;

  beforeEach(() => {
    updateManager = new UpdateManager();
  });

  describe('::getReleaseNotesURLForVersion', () => {
    it('returns pulsar-edit download page when dev version', () => {
      expect(
        updateManager.getReleaseNotesURLForVersion('1.7.0-dev-e44b57d')
      ).toContain('pulsar-edit.dev/download');
    });

    it('returns the page for the release when not a dev version', () => {
      expect(updateManager.getReleaseNotesURLForVersion('1.100.0')).toContain(
        'pulsar-edit/pulsar/releases/tag/v1.100.0'
      );
      expect(updateManager.getReleaseNotesURLForVersion('v1.100.0')).toContain(
        'pulsar-edit/pulsar/releases/tag/v1.100.0'
      );
      // TODO: Since we no longer follow release channels, is it useful to continue testing their state?
      expect(
        updateManager.getReleaseNotesURLForVersion('1.100.0-beta10')
      ).toContain('pulsar-edit/pulsar/releases/tag/v1.100.0-beta10');
      expect(
        updateManager.getReleaseNotesURLForVersion('1.100.0-nightly10')
      ).toContain(
        'pulsar-edit/pulsar-nightly-releases/releases/tag/v1.100.0-nightly10'
      );
    });
  });
});
