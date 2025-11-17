const fs = require('fs-plus');
const temp = require('temp');
const path = require('path');

const userHome = process.env.ATOM_HOME || path.join(fs.getHomeDirectory(), '.atom');
const atomHome = temp.mkdirSync({prefix: 'atom-test-home-'});
if (process.env.APM_TEST_PACKAGES) {
  const testPackages = process.env.APM_TEST_PACKAGES.split(/\s+/);
  fs.makeTreeSync(path.join(atomHome, 'packages'));
  for (let packName of Array.from(testPackages)) {
    const userPack = path.join(userHome, 'packages', packName);
    const loadablePack = path.join(atomHome, 'packages', packName);

    try {
      fs.symlinkSync(userPack, loadablePack, 'dir');
    } catch (error) {
      fs.copySync(userPack, loadablePack);
    }
  }
}

const ApplicationDelegate = require('../../src/application-delegate');
const applicationDelegate = new ApplicationDelegate();
applicationDelegate.setRepresentedFilename = function () {};
applicationDelegate.setWindowDocumentEdited = function () {};

exports.atomHome = atomHome
exports.applicationDelegate = applicationDelegate;
