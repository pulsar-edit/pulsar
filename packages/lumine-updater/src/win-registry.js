// A minimal, dependency-free replacement for the `winreg` package, covering only
// the surface this package uses: checking whether a registry key exists.
//
// The upstream `winreg` spawns `reg.exe` with an argument array *and*
// `shell: true`, which Node deprecates (DEP0190) because the arguments are
// concatenated into the shell command instead of being escaped. `execFile`
// (no shell) forwards the argv directly and avoids the warning.

const childProcess = require("child_process");
const path = require("path");

const HIVES = ["HKLM", "HKCU", "HKCR", "HKU", "HKCC"];

function getRegExePath() {
  if (process.platform === "win32" && process.env.windir) {
    return path.join(process.env.windir, "system32", "reg.exe");
  }
  return "reg.exe";
}

class Registry {
  constructor(options = {}) {
    this.host = "" + (options.host || "");
    this.hive = "" + (options.hive || "HKLM");
    this.key = "" + (options.key || "");

    if (HIVES.indexOf(this.hive) === -1) {
      throw new Error("illegal hive specified.");
    }
  }

  get path() {
    const prefix = this.host.length === 0 ? "" : `\\\\${this.host}\\`;
    return `${prefix}${this.hive}${this.key}`;
  }

  // Reports whether this key exists. reg.exe exits 1 when the key is absent.
  keyExists(cb) {
    if (typeof cb !== "function") throw new TypeError("must specify a callback");
    childProcess.execFile(
      getRegExePath(),
      ["QUERY", this.path],
      { windowsHide: true, env: process.env },
      (err) => {
        if (err) {
          if (err.code === 1) return cb(null, false);
          return cb(err);
        }
        cb(null, true);
      },
    );
  }
}

for (const hive of HIVES) Registry[hive] = hive;
Registry.HIVES = HIVES;

module.exports = Registry;
