const Registry = require('winreg');
const { execFile } = require('child_process');
const Path = require('path');
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

// The `reg.exe` that ships with Windows — the same one `winreg` uses — rather
// than whichever `reg.exe` comes first on the `PATH`. Windows sets
// `SystemRoot` and `windir` for every process; if neither is present, fall
// back to a `PATH` lookup instead of failing.
function getRegExePath() {
  const systemRoot = process.env.SystemRoot ?? process.env.windir;
  return systemRoot ? Path.join(systemRoot, 'System32', 'reg.exe') : 'reg.exe';
}

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
      const keyPath = `HKCU${part.key != null ? `${this.key}\\${part.key}` : this.key}`;
      const args = ['ADD', keyPath];
      if (part.name === '') {
        args.push('/ve');
      } else {
        args.push('/v', part.name);
      }
      args.push('/t', 'REG_SZ', '/d', part.value, '/f');
      // Run `reg.exe` directly instead of through `cmd.exe` (as `winreg`
      // does), so that our values — which contain quotes, spaces, and `%1` —
      // reach it intact. `windowsHide` keeps a console window from flashing
      // up for each call.
      execFile(getRegExePath(), args, { shell: false, windowsHide: true }, (error) => {
        if (error) {
          console.error(`Failed to write registry value in ${keyPath}:`, error);
        }
        if (--doneCount === 0) return callback();
      });
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

exports.appName = appName;

// NOTE: The uninstaller (`resources/win/installer.nsh`) removes these entries
// by key name, but only after confirming that each entry's `command` value
// launches the installation being removed (or is empty, as it is for entries
// written by versions that used `winreg` to write these values). It does so by
// reconstructing the exact value written below (`"<path to exe>" "%1"`, or
// `"%V"` for the folder background entry). If you change the key names or the
// format of the command values, update the uninstaller to match — otherwise
// it will silently stop removing these entries.
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
