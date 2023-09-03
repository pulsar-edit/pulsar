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
        'pulsar-edit/pulsar/blob/master/CHANGELOG.md#11000'
      );
      expect(updateManager.getReleaseNotesURLForVersion('v1.100.0')).toContain(
        'pulsar-edit/pulsar/blob/master/CHANGELOG.md#11000'
      );
    });
  });
});
