
let UpdateManager = class UpdateManager {
  constructor() {
    this.currentVersion = atom.getVersion();
  }

  getReleaseNotesURLForCurrentVersion() {
    return this.getReleaseNotesURLForVersion(this.currentVersion);
  }

  getReleaseNotesURLForVersion(appVersion) {
    if (appVersion.startsWith('v')) {
      appVersion = appVersion.replace("v", "");
    }

    return `https://github.com/pulsar-edit/pulsar/blob/master/CHANGELOG.md#${appVersion.replace(/\./g, "")}`;
  }
};

module.exports = UpdateManager;
