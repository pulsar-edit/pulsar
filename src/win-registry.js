// A minimal, dependency-free replacement for the `winreg` package, covering only
// the surface Lumine uses: reading a value, checking whether a key exists, and
// deleting a key.
//
// The upstream `winreg` spawns `reg.exe` with an argument array *and*
// `shell: true`, which Node deprecates (DEP0190) because the arguments are
// concatenated into the shell command instead of being escaped. Passing the same
// arguments through `execFile` (no shell) is both safe and warning-free: the OS
// receives the argv directly, so registry keys and values that contain spaces no
// longer need to be quoted for a shell to re-split.

const childProcess = require("child_process");
const path = require("path");

const HIVES = ["HKLM", "HKCU", "HKCR", "HKU", "HKCC"];

// Matches a single `reg query` result row, e.g. "    (Default)    REG_SZ    value".
const ITEM_PATTERN =
  /^(.*)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/;

function getRegExePath() {
  if (process.platform === "win32" && process.env.windir) {
    return path.join(process.env.windir, "system32", "reg.exe");
  }
  return "reg.exe";
}

// Runs reg.exe with the given arguments and no shell. Invokes `cb(err, stdout)`
// where `err.code` carries the process exit code, matching how the previous
// `winreg` errors were consumed (see `keyExists`).
function runReg(args, cb) {
  childProcess.execFile(
    getRegExePath(),
    args,
    { windowsHide: true, env: process.env },
    (err, stdout) => {
      if (err) {
        cb(err, stdout || "");
      } else {
        cb(null, stdout || "");
      }
    },
  );
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

  // The registry path passed to reg.exe. Unlike `winreg`, this is not quoted:
  // execFile forwards each argument verbatim, so quoting would corrupt the key.
  get path() {
    const prefix = this.host.length === 0 ? "" : `\\\\${this.host}\\`;
    return `${prefix}${this.hive}${this.key}`;
  }

  // Gets a named value from this key. `name` of "" reads the default value.
  // Calls back with a plain object exposing `.value` (and name/type), or `null`
  // when the value is absent, mirroring `winreg`'s `get`.
  get(name, cb) {
    if (typeof cb !== "function") throw new TypeError("must specify a callback");

    const args = ["QUERY", this.path];
    if (name === "") {
      args.push("/ve");
    } else {
      args.push("/v", name);
    }

    runReg(args, (err, stdout) => {
      if (err) return cb(err, null);

      const items = [];
      const lines = stdout.split("\n");
      let lineNumber = 0;
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.length > 0) {
          if (lineNumber !== 0) items.push(line);
          lineNumber++;
        }
      }

      // Use the last item so a header line on older reg.exe builds is ignored.
      const item = items[items.length - 1] || "";
      const match = ITEM_PATTERN.exec(item);
      if (match) {
        cb(null, {
          host: this.host,
          hive: this.hive,
          key: this.key,
          name: match[1].trim(),
          type: match[2].trim(),
          value: match[3],
        });
      } else {
        cb(null, null);
      }
    });
  }

  // Deletes this key and all its subkeys.
  destroy(cb) {
    if (typeof cb !== "function") throw new TypeError("must specify a callback");
    runReg(["DELETE", this.path, "/f"], (err) => cb(err || null));
  }

  // Reports whether this key exists. reg.exe exits 1 when the key is absent.
  keyExists(cb) {
    if (typeof cb !== "function") throw new TypeError("must specify a callback");
    runReg(["QUERY", this.path], (err) => {
      if (err) {
        if (err.code === 1) return cb(null, false);
        return cb(err);
      }
      cb(null, true);
    });
  }
}

for (const hive of HIVES) Registry[hive] = hive;
Registry.HIVES = HIVES;

module.exports = Registry;
