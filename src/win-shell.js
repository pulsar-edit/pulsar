const Registry = require("./win-registry.js");
const { execFile } = require("child_process");
const Path = require("path");
const { getAppName } = require("./get-app-details.js");
const packageMetadata = require("../package.json");

const appName =
  packageMetadata.productName || packageMetadata.branding?.name || packageMetadata.name;
const runtimeAppName = getAppName();
const obsoleteAppNames = runtimeAppName !== appName ? [runtimeAppName] : [];
const exeName = Path.basename(process.execPath);
const appPath = `"${process.execPath}"`;
const fileIconPath = Path.join(process.execPath, "..", "resources", "lumine.ico");

class ShellOption {
  constructor(key, parts, obsoleteKeys = []) {
    this.isRegistered = this.isRegistered.bind(this);
    this.register = this.register.bind(this);
    this.deregister = this.deregister.bind(this);
    this.update = this.update.bind(this);
    this.key = key;
    this.parts = parts;
    this.obsoleteKeys = obsoleteKeys;
  }

  isRegistered(callback) {
    new Registry({
      hive: "HKCU",
      key: `${this.key}\\${this.parts[0].key}`,
    }).get(this.parts[0].name, (err, val) =>
      callback(err == null && val != null && val.value === this.parts[0].value),
    );
  }

  register(callback) {
    let doneCount = this.parts.length;
    this.parts.forEach((part) => {
      const keyPath = `HKCU${part.key != null ? `${this.key}\\${part.key}` : this.key}`;
      const args = ["ADD", keyPath];
      if (part.name === "") {
        args.push("/ve");
      } else {
        args.push("/v", part.name);
      }
      args.push("/t", "REG_SZ", "/d", part.value, "/f");
      execFile("reg.exe", args, { shell: false }, () => {
        if (--doneCount === 0) return this.destroyObsoleteKeys(callback);
      });
    });
  }

  deregister(callback) {
    this.isRegistered((isRegistered) => {
      if (isRegistered) {
        new Registry({ hive: "HKCU", key: this.key }).destroy(() =>
          this.destroyObsoleteKeys(() => callback(null, true)),
        );
      } else {
        this.destroyObsoleteKeys(() => callback(null, false));
      }
    });
  }

  update(callback) {
    new Registry({
      hive: "HKCU",
      key: `${this.key}\\${this.parts[0].key}`,
    }).get(this.parts[0].name, (err, val) => {
      if (err != null || val == null) {
        callback(err);
      } else {
        this.register(callback);
      }
    });
  }

  destroyObsoleteKeys(callback) {
    let doneCount = this.obsoleteKeys.length;
    if (doneCount === 0) return callback();

    this.obsoleteKeys.forEach((key) => {
      new Registry({ hive: "HKCU", key }).destroy(() => {
        if (--doneCount === 0) return callback();
      });
    });
  }
}

exports.appName = appName;

exports.fileHandler = new ShellOption(`\\Software\\Classes\\Applications\\${exeName}`, [
  { key: "shell\\open\\command", name: "", value: `${appPath} "%1"` },
  { key: "shell\\open", name: "FriendlyAppName", value: `${appName}` },
  { key: "DefaultIcon", name: "", value: `${fileIconPath}` },
]);

let contextParts = [
  { key: "command", name: "", value: `${appPath} "%1"` },
  { name: "", value: `Open with ${appName}` },
  { name: "Icon", value: process.execPath },
];

const obsoleteFileContextMenuKeys = obsoleteAppNames.map(
  (name) => `\\Software\\Classes\\*\\shell\\${name}`,
);
const obsoleteFolderContextMenuKeys = obsoleteAppNames.map(
  (name) => `\\Software\\Classes\\Directory\\shell\\${name}`,
);
const obsoleteFolderBackgroundContextMenuKeys = obsoleteAppNames.map(
  (name) => `\\Software\\Classes\\Directory\\background\\shell\\${name}`,
);

exports.fileContextMenu = new ShellOption(
  `\\Software\\Classes\\*\\shell\\${appName}`,
  contextParts,
  obsoleteFileContextMenuKeys,
);
exports.folderContextMenu = new ShellOption(
  `\\Software\\Classes\\Directory\\shell\\${appName}`,
  contextParts,
  obsoleteFolderContextMenuKeys,
);
exports.folderBackgroundContextMenu = new ShellOption(
  `\\Software\\Classes\\Directory\\background\\shell\\${appName}`,
  JSON.parse(JSON.stringify(contextParts).replace("%1", "%V")),
  obsoleteFolderBackgroundContextMenuKeys,
);
