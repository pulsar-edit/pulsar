
let UpdateManager = class UpdateManager {
  constructor() {
    this.currentVersion = atom.getVersion();
  }

  getReleaseNotesURLForCurrentVersion() {
    return this.getReleaseNotesURLForVersion(this.currentVersion);
  }

  getReleaseNotesURLForVersion(appVersion) {
    // Dev versions will not have a releases page
    if (appVersion.indexOf('dev') > -1) {
      return 'https://pulsar-edit.dev/download.html';
    }

    if (!appVersion.startsWith('v')) {
      appVersion = `v${appVersion}`;
    }

    const releaseRepo =
      appVersion.indexOf('nightly') > -1 ? 'pulsar-nightly-releases' : 'pulsar';
    return `https://github.com/pulsar-edit/${releaseRepo}/releases/tag/${appVersion}`;
  }
};

module.exports = UpdateManager;
