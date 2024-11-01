const path = require('path');
const fs = require('fs-plus');

module.exports = class CommandInstaller {
  constructor(applicationDelegate) {
    this.applicationDelegate = applicationDelegate;
  }

  initialize(appVersion) {
    this.appVersion = appVersion;
  }

  getInstallDirectory() {
    return '/usr/local/bin';
  }

  getResourcesDirectory() {
    return process.resourcesPath;
  }

  getScriptBaseName() {
    if (this.scriptBaseName) {
      return this.scriptBaseName;
    } else if (process.env.ATOM_BASE_NAME) {
      // If we launched via shell script, this environment variable will tell
      // us the right name.
      return process.env.ATOM_BASE_NAME;
    }
    // TODO: For now we can infer it from the presence of a file in the
    // resources directory, but a better way would be to bake in the right
    // metadata at build time.
    for (let name in ['pulsar', 'pulsar-next']) {
      for (let ext in ['sh', 'cmd']) {
        let candidate = path.join(
          this.getResourcesDirectory(),
          `${name}.${ext}`
        );
        if (fs.existsSync(candidate)) {
          this.scriptBaseName = name;
          return name;
        }
      }
    }
    return 'pulsar';
  }

  async installShellCommandsInteractively() {
    const showErrorDialog = error => {
      this.applicationDelegate.confirm(
        {
          message: 'Failed to install shell commands',
          detail: error.message
        },
        () => {}
      );
    };

    this.installAtomCommand(true, (error, atomCommandName) => {
      if (error) return showErrorDialog(error);
      this.installApmCommand(true, (error, apmCommandName) => {
        if (error) return showErrorDialog(error);
        this.applicationDelegate.confirm(
          {
            message: 'Commands installed.',
            detail: `The shell commands \`${atomCommandName}\` and \`${apmCommandName}\` are installed.`
          },
          () => {}
        );
      });
    });
  }

  getCommandNameForChannel(commandName) {
    let channelMatch = this.appVersion.match(/beta|nightly/);
    let channel = channelMatch ? channelMatch[0] : '';

    switch (channel) {
      case 'beta':
        return `${commandName}-beta`;
      case 'nightly':
        return `${commandName}-nightly`;
      default:
        return commandName;
    }
  }

  installAtomCommand(askForPrivilege, callback) {
    let scriptName = this.getScriptBaseName();
    this.installCommand(
      path.join(this.getResourcesDirectory(), `${scriptName}.sh`),
      scriptName,
      askForPrivilege,
      callback
    );
  }

  installApmCommand(askForPrivilege, callback) {
    let isNextReleaseChannel = this.getScriptBaseName().endsWith('-next');
    let ppmName = isNextReleaseChannel ? 'ppm-next' : 'ppm';
    this.installCommand(
      path.join(
        this.getResourcesDirectory(),
        'app',
        'ppm',
        'bin',
        ppmName
      ),
      ppmName,
      askForPrivilege,
      callback
    );
  }

  installCommand(commandPath, commandName, askForPrivilege, callback) {
    if (process.platform !== 'darwin') return callback();

    const destinationPath = path.join(this.getInstallDirectory(), commandName);

    fs.readlink(destinationPath, (error, realpath) => {
      if (error && error.code !== 'ENOENT') return callback(error);
      if (realpath === commandPath) return callback(null, commandName);
      this.createSymlink(fs, commandPath, destinationPath, error => {
        if (error && error.code === 'EACCES' && askForPrivilege) {
          const fsAdmin = require('fs-admin');
          this.createSymlink(fsAdmin, commandPath, destinationPath, error => {
            callback(error, commandName);
          });
        } else {
          callback(error);
        }
      });
    });
  }

  createSymlink(fs, sourcePath, destinationPath, callback) {
    fs.unlink(destinationPath, error => {
      if (error && error.code !== 'ENOENT') return callback(error);
      fs.makeTree(path.dirname(destinationPath), error => {
        if (error) return callback(error);
        fs.symlink(sourcePath, destinationPath, callback);
      });
    });
  }
};
