const ChildProcess = require("child_process");
const Registry = require("../src/win-registry");

// Regression coverage for the winreg replacement. The whole point of this module
// is to talk to reg.exe *without* `shell: true`, which Node deprecates (DEP0190)
// when arguments are passed as an array. Most specs stub execFile so they run on
// every CI platform; one Windows-only smoke test exercises the real reg.exe.

describe("win-registry", function () {
  describe("constructor", function () {
    it("rejects an unknown hive", function () {
      expect(() => new Registry({ hive: "BOGUS", key: "\\x" })).toThrow();
    });

    it("builds an unquoted reg path from hive and key", function () {
      const reg = new Registry({ hive: "HKCU", key: "\\Software\\Lumine" });
      expect(reg.path).toBe("HKCU\\Software\\Lumine");
    });
  });

  describe("when talking to reg.exe", function () {
    let execFileSpy;

    beforeEach(function () {
      execFileSpy = spyOn(ChildProcess, "execFile");
    });

    function lastCall() {
      return execFileSpy.calls.mostRecent().args;
    }

    it("never spawns with a shell (avoids DEP0190)", function () {
      execFileSpy.and.callFake((file, args, options, cb) => cb(null, ""));

      new Registry({ hive: "HKCU", key: "\\Software\\Lumine" }).keyExists(() => {});

      const [file, args, options] = lastCall();
      expect(file).toContain("reg.exe");
      expect(Array.isArray(args)).toBe(true);
      expect(options.shell).not.toBe(true);
      expect(options.shell).toBeUndefined();
    });

    it("queries the default value and parses it", function () {
      execFileSpy.and.callFake((file, args, options, cb) =>
        cb(null, "\r\nHKEY_CLASSES_ROOT\\.txt\r\n    (Default)    REG_SZ    txtfilelegacy\r\n\r\n"),
      );

      let result;
      new Registry({ hive: "HKCR", key: "\\.txt" }).get("", (err, item) => {
        result = { err, item };
      });

      expect(lastCall()[1]).toEqual(["QUERY", "HKCR\\.txt", "/ve"]);
      expect(result.err).toBeNull();
      expect(result.item.type).toBe("REG_SZ");
      expect(result.item.value).toBe("txtfilelegacy");
    });

    it("queries a named value", function () {
      execFileSpy.and.callFake((file, args, options, cb) =>
        cb(null, "\r\nHKEY_CURRENT_USER\\X\r\n    Hidden    REG_DWORD    0x1\r\n\r\n"),
      );

      let result;
      new Registry({ hive: "HKCU", key: "\\X" }).get("Hidden", (err, item) => {
        result = { err, item };
      });

      expect(lastCall()[1]).toEqual(["QUERY", "HKCU\\X", "/v", "Hidden"]);
      expect(result.item.name).toBe("Hidden");
      expect(result.item.value).toBe("0x1");
    });

    it("reports a missing value as null with the error forwarded", function () {
      const err = new Error("not found");
      err.code = 1;
      execFileSpy.and.callFake((file, args, options, cb) => cb(err, ""));

      let result;
      new Registry({ hive: "HKCU", key: "\\Missing" }).get("", (e, item) => {
        result = { e, item };
      });

      expect(result.e).toBe(err);
      expect(result.item).toBeNull();
    });

    it("maps exit code 1 to keyExists=false", function () {
      const err = new Error("not found");
      err.code = 1;
      execFileSpy.and.callFake((file, args, options, cb) => cb(err));

      let result;
      new Registry({ hive: "HKCU", key: "\\Missing" }).keyExists((e, exists) => {
        result = { e, exists };
      });

      expect(result.e).toBeNull();
      expect(result.exists).toBe(false);
    });

    it("reports keyExists=true when reg.exe succeeds", function () {
      execFileSpy.and.callFake((file, args, options, cb) => cb(null, "some output"));

      let result;
      new Registry({ hive: "HKLM", key: "\\SOFTWARE" }).keyExists((e, exists) => {
        result = { e, exists };
      });

      expect(result.exists).toBe(true);
    });

    it("deletes a key with DELETE /f", function () {
      execFileSpy.and.callFake((file, args, options, cb) => cb(null, ""));

      let called = false;
      new Registry({ hive: "HKCU", key: "\\Gone" }).destroy(() => {
        called = true;
      });

      expect(lastCall()[1]).toEqual(["DELETE", "HKCU\\Gone", "/f"]);
      expect(called).toBe(true);
    });
  });

  if (process.platform === "win32") {
    describe("against the real registry (win32)", function () {
      it("reports a well-known key as existing and a bogus one as missing", async function () {
        const exists = await new Promise((resolve, reject) =>
          new Registry({ hive: "HKLM", key: "\\SOFTWARE\\Microsoft" }).keyExists((err, e) =>
            err ? reject(err) : resolve(e),
          ),
        );
        expect(exists).toBe(true);

        const missing = await new Promise((resolve, reject) =>
          new Registry({ hive: "HKCU", key: "\\Software\\LumineNoSuchKey_ZZZ" }).keyExists(
            (err, e) => (err ? reject(err) : resolve(e)),
          ),
        );
        expect(missing).toBe(false);
      });
    });
  }
});
