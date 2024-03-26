const Registry = require('winreg');
const Path = require('path');
const ChildProcess = require('child_process');
const { getAppName } = require('../get-app-details.js');

const appName = getAppName();
const exeName = Path.basename(process.execPath);
const appPath = `"${process.execPath}"`;
const fileIconPath = `"${Path.join(
  process.execPath,
  '..',
  'resources',
  'pulsar.ico'
)}"`;

class ShellOption {
  constructor(key, parts) {
    this.isRegistered = this.isRegistered.bind(this);
    this.register = this.register.bind(this);
    this.deregister = this.deregister.bind(this);
    this.update = this.update.bind(this);
    this.key = key;
    this.parts = parts;
  }

  isRegistered(callback) {
    new Registry({
      hive: 'HKCU',
      key: `${this.key}\\${this.parts[0].key}`
    }).get(this.parts[0].name, (err, val) =>
      callback(err == null && val != null && val.value === this.parts[0].value)
    );
  }

  register(callback) {
    let doneCount = this.parts.length;
    this.parts.forEach(part => {
      let reg = new Registry({
        hive: 'HKCU',
        key: part.key != null ? `${this.key}\\${part.key}` : this.key
      });
      return reg.create(() =>
        reg.set(part.name, Registry.REG_SZ, part.value, () => {
          if (--doneCount === 0) return callback();
        })
      );
    });
  }

  deregister(callback) {
    this.isRegistered(isRegistered => {
      if (isRegistered) {
        new Registry({ hive: 'HKCU', key: this.key }).destroy(() =>
          callback(null, true)
        );
      } else {
        callback(null, false);
      }
    });
  }

  update(callback) {
    new Registry({
      hive: 'HKCU',
      key: `${this.key}\\${this.parts[0].key}`
    }).get(this.parts[0].name, (err, val) => {
      if (err != null || val == null) {
        callback(err);
      } else {
        this.register(callback);
      }
    });
  }
}

class PathOption {
  constructor() {
    this.HKPATH;
    this.hive;
    this.installReg = "\\SOFTWARE\\0949b555-c22c-56b7-873a-a960bdefa81f";

    // We no longer support an `installType`
    // Only managing the path of the current user
    this.HKPATH = "\\Environment";
    this.hive = "HKCU";

    this.isRegistered = this.isRegistered.bind(this);
    this.register = this.register.bind(this);
    this.deregister = this.deregister.bind(this);
    this.getPulsarPath = this.getPulsarPath.bind(this);
  }

  isRegistered(callback) {
    let installRegKey = new Registry({
      hive: this.hive,
      key: this.HKPATH
    });

    let isInstalled = false;

    installRegKey.values((err, items) => {
      if (err) {
        callback(err);
      } else {
        for (let i = 0; i < items.length; i++) {
          if (items[i].name === "Path") {
            let winPath = items[i].value;
            if (winPath.includes("Pulsar\\resources") || winPath.includes("Pulsar\\resources\\app\\ppm\\bin")) {
              isInstalled = true;
            }
          }
        }
        callback(isInstalled);
      }
    });
  }

  register(callback) {
    this.getPulsarPath().then((pulsarPath) => {
      const child = ChildProcess.execFile(
          `powershell.exe -File '${pulsarPath}\\resources\\modifyWindowsPath.ps1'`,
          ['-installdir', `'${pulsarPath}'`, '-remove', 'FALSE'],
          { shell: "powershell.exe" },
          (error, stdout, stderr) =>
          {
        if (error) {
          console.log(`Add Pulsar to PATH: ${error}`);
          atom.notifications.addError(`Error Running Script: ${error.toString()}`, { dismissable: true });
          callback(error);
        } else {
          console.log("Add Pulsar to PATH:");
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
          return callback();
        }
      });
    }).catch((err) => {
      console.error(`Add Pulsar to PATH error caught: ${err}`);
      return callback(err);
    });
  }

  deregister(callback) {
    this.isRegistered(isRegistered => {
      if (isRegistered) {
        this.getPulsarPath().then((pulsarPath) => {
          const child = ChildProcess.execFile(
              `powershell.exe -File '${pulsarPath}\\resources\\modifyWindowsPath.ps1'`,
              ['-installdir', `'${pulsarPath}'`, '-remove', 'TRUE'],
              { shell: "powershell.exe" },
              (error, stdout, stderr) =>
              {
            if (error) {
              console.error(`Remove Pulsar from PATH: ${error}`);
              atom.notifications.addError(`Error Running Script: ${error.toString()}`, { dismissable: true });
              callback(error);
            } else {
              console.log("Remove Pulsar from PATH:");
              console.log(`stdout: ${stdout}`);
              console.log(`stderr: ${stderr}`);
              return callback();
            }
          });
        }).catch((err) => {
          console.error(`Remove Pulsar from PATH error caught: ${err}`);
          return callback(err);
        });
      } else {
        callback(null, false);
      }
    });
  }

  getPulsarPath() {
    return new Promise((resolve, reject) => {
      let pulsarPath = "";
      let pulsarPathReg = new Registry({
        hive: this.hive,
        key: this.installReg
      }).get("InstallLocation", (err, val) => {
        if (err) {
          console.error(err);
          let location = process.resourcesPath;
          if (typeof location !== "string" || location.length < 1) {
            console.error(`Unable to locate Pulsar PATH via fallback methods: '${location}'`);
            reject(err);
          } else {
            resolve(Path.dirname(location));
          }
        } else {
          pulsarPath = val.value;

          if (pulsarPath.length === 0) {
            console.error("Unable to find Pulsar Install Path");
            let location = process.resourcesPath;
            if (typeof location !== "string" || location.length < 1) {
              console.error(`Unable to locate Pulsar PATH via fallback methods: '${location}'`);
              reject("Unable to find Pulsar Install Path");
            } else {
              resolve(Path.dirname(location));
            }
          }

          resolve(pulsarPath);
        }
      });
    });
  }
}

// Function that can inform is Pulsar is running as the administrator on Windows
exports.runningAsAdmin = (callback) => {
  const child = ChildProcess.exec("NET SESSION", (error, stdout, stderr) => {
    if (stderr.length === 0) {
      callback(true);
    } else {
      callback(false);
    }
  });
};

exports.appName = appName;

exports.fileHandler = new ShellOption(
  `\\Software\\Classes\\Applications\\${exeName}`,
  [
    { key: 'shell\\open\\command', name: '', value: `${appPath} "%1"` },
    { key: 'shell\\open', name: 'FriendlyAppName', value: `${appName}` },
    { key: 'DefaultIcon', name: '', value: `${fileIconPath}` }
  ]
);

let contextParts = [
  { key: 'command', name: '', value: `${appPath} "%1"` },
  { name: '', value: `Open with ${appName}` },
  { name: 'Icon', value: `${appPath}` }
];

exports.fileContextMenu = new ShellOption(
  `\\Software\\Classes\\*\\shell\\${appName}`,
  contextParts
);
exports.folderContextMenu = new ShellOption(
  `\\Software\\Classes\\Directory\\shell\\${appName}`,
  contextParts
);
exports.folderBackgroundContextMenu = new ShellOption(
  `\\Software\\Classes\\Directory\\background\\shell\\${appName}`,
  JSON.parse(JSON.stringify(contextParts).replace('%1', '%V'))
);
exports.pathUser = new PathOption("User");
