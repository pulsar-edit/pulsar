const UpdateManager = require('../lib/update-manager');

describe('UpdateManager', () => {
  let updateManager;

  beforeEach(() => {
    updateManager = new UpdateManager();
  });

  describe('::getReleaseNotesURLForVersion', () => {
    it('returns the page for the release even when a dev version', () => {
      expect(updateManager.getReleaseNotesURLForVersion('1.100.0-dev')).toContain(
        'pulsar-edit/pulsar/blob/master/CHANGELOG.md#11000-dev'
      );
    });

    it('returns the page for the release when a rolling ("nightly") release version', () => {
      expect(updateManager.getReleaseNotesURLForVersion('1.108.2023090322')).toContain(
        'pulsar-edit/pulsar/blob/master/CHANGELOG.md#11082023090322'
      );
    });

    it('returns the page for the release when not a dev version', () => {
      expect(updateManager.getReleaseNotesURLForVersion('1.129.0')).toContain(
        'pulsar-edit/pulsar/blob/master/CHANGELOG.md#11290'
      );
      expect(updateManager.getReleaseNotesURLForVersion('v1.100.0')).toContain(
        'pulsar-edit/pulsar/blob/master/CHANGELOG.md#11000'
      );
    });
  });
});
