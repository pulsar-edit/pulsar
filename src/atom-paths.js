const fs = require('fs-plus');
const path = require('path');

const hasWriteAccess = dir => {
  const testFilePath = path.join(dir, 'write.test');
  try {
    fs.writeFileSync(testFilePath, new Date().toISOString(), { flag: 'w+' });
    fs.unlinkSync(testFilePath);
    return true;
  } catch (err) {
    return false;
  }
};

const getAppDirectory = () => {
  switch (process.platform) {
    case 'darwin':
      return process.execPath.substring(
        0,
        process.execPath.indexOf('.app') + 4
      );
    case 'linux':
    case 'win32':
      return path.join(process.execPath, '..');
  }
};

module.exports = {
  setAtomHome: homePath => {
    // When a read-writeable `.pulsar` folder exists above the app directory,
    // use that. The portability means that we don't have to use a different
    // name to distinguish the release channel.
    const portableHomePath = path.join(getAppDirectory(), '..', '.pulsar');
    if (fs.existsSync(portableHomePath)) {
      if (hasWriteAccess(portableHomePath)) {
        process.env.ATOM_HOME = portableHomePath;
      } else {
        // A path exists so it was intended to be used but we didn't have rights, so warn.
        console.log(
          `Insufficient permission to portable Pulsar home "${portableHomePath}".`
        );
      }
    }

    // Check the `ATOM_HOME` environment variable next.
    if (process.env.ATOM_HOME !== undefined) {
      return;
    }

    // We fall back to a `.pulsar` folder in the user's home folder — or a
    // different folder name if we're not on the stable release channel.
    //
    // On macOS and Linux, `ATOM_HOME` gets set in `pulsar(-next).sh`, so we'd
    // only get this far if the user launched via a non-shell method.
    //
    // On Windows, we don’t try to set `ATOM_HOME` in `pulsar.cmd`, so we'll
    // always get this far.
    //
    // In these cases, we rely on `ATOM_CHANNEL`, which is defined either by
    // the launcher script or by the main process shortly after launch
    // (inferred via the version number).
    //
    let folderName = '.pulsar';
    if (process.env.ATOM_CHANNEL === 'next') {
      folderName = '.pulsar-next';
    }

    process.env.ATOM_HOME = path.join(homePath, folderName);
  },

  setUserData: app => {
    const electronUserDataPath = path.join(
      process.env.ATOM_HOME,
      'electronUserData'
    );
    if (fs.existsSync(electronUserDataPath)) {
      if (hasWriteAccess(electronUserDataPath)) {
        app.setPath('userData', electronUserDataPath);
      } else {
        // A path exists so it was intended to be used but we didn't have rights, so warn.
        console.log(
          `Insufficient permission to Electron user data "${electronUserDataPath}".`
        );
      }
    }
  },

  getAppDirectory
};
