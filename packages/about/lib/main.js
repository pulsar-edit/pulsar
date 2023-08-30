
const UpdateManager = require('./update-manager');
const About = require('./about');
let updateManager;

// The local storage key for the available update version.
const AboutURI = 'atom://about';

module.exports = {
  activate() {
    this.createModel();
  },

  deactivate() {
    this.model.destroy();

    if (updateManager) {
      updateManager = undefined;
    }
  },

  deserializeAboutView(state) {
    if (!this.model) {
      this.createModel();
    }

    return this.model.deserialize(state);
  },

  createModel() {
    updateManager = updateManager || new UpdateManager();

    this.model = new About({
      uri: AboutURI,
      currentAtomVersion: atom.getVersion(),
      currentElectronVersion: process.versions.electron,
      currentChromeVersion: process.versions.chrome,
      currentNodeVersion: process.version,
      updateManager: updateManager
    });
  }

};
