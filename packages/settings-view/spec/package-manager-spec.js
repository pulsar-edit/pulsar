const fs = require("@lumine-code/fs-plus");
const os = require("os");
const path = require("path");
const PackageManager = require("../lib/package-manager");

describe("PackageManager", function () {
  let [packageManager] = [];

  beforeEach(function () {
    packageManager = new PackageManager();
  });

  describe("::isPackageInstalled()", function () {
    it("returns false when a package is not installed", () =>
      expect(packageManager.isPackageInstalled("some-package")).toBe(false));

    it("returns true when a package is loaded", function () {
      spyOn(atom.packages, "isPackageLoaded").andReturn(true);
      expect(packageManager.isPackageInstalled("some-package")).toBe(true);
    });

    it("returns true when a package is disabled", function () {
      spyOn(atom.packages, "getAvailablePackageNames").andReturn(["some-package"]);
      expect(packageManager.isPackageInstalled("some-package")).toBe(true);
    });
  });

  describe("::getFeatured()", () =>
    it("does not query a package registry", function () {
      waitsForPromise(() =>
        packageManager.getFeatured().then((packages) => {
          expect(packages).toEqual([]);
        }),
      );
    }));

  describe("::install()", function () {
    it("fails for invalid repository names", function () {
      const installCallback = jasmine.createSpy("installCallback");
      packageManager.install({ name: "something" }, installCallback);

      waitsFor(() => installCallback.callCount === 1);

      runs(function () {
        const installError = installCallback.argsForCall[0][0];
        expect(installError.packageInstallError).toBe(true);
        expect(installError.message).toContain("owner/repo");
      });
    });

    it("installs and activates GitHub packages with names different from the repo name", function () {
      const installCallback = jasmine.createSpy("installCallback");
      spyOn(atom.packages, "activatePackage");
      spyOn(packageManager, "installGitHubPackage").andReturn(
        Promise.resolve({
          name: "real-package-name",
          version: "1.0.0",
          apmInstallSource: { type: "git", source: "user/repo", sha: "abc123" },
        }),
      );

      packageManager.install({ name: "user/repo" }, installCallback);

      waitsFor(() => installCallback.callCount === 1);

      runs(function () {
        expect(installCallback.argsForCall[0].length).toBe(0);
        expect(atom.packages.activatePackage).toHaveBeenCalledWith("real-package-name");
      });
    });

    it("emits an installed event with a copy of the pack including package metadata", function () {
      const installCallback = jasmine.createSpy("installCallback");
      const originalPackObject = { name: "user/repo", otherData: { will: "beCopied" } };
      spyOn(atom.packages, "activatePackage");
      spyOn(packageManager, "emitPackageEvent");
      spyOn(packageManager, "installGitHubPackage").andReturn(
        Promise.resolve({
          name: "real-package-name",
          moreInfo: "yep",
          apmInstallSource: { type: "git", source: "user/repo", sha: "abc123" },
        }),
      );

      packageManager.install(originalPackObject, installCallback);

      waitsFor(() => installCallback.callCount === 1);

      runs(function () {
        let installEmittedCount = 0;
        for (let call of packageManager.emitPackageEvent.calls.all()) {
          if (call.args[0] === "installed") {
            expect(call.args[1]).not.toEqual(originalPackObject);
            expect(call.args[1].moreInfo).toEqual("yep");
            expect(call.args[1].otherData).toBe(originalPackObject.otherData);
            installEmittedCount++;
          }
        }
        expect(installEmittedCount).toBe(1);
      });
    });
  });

  describe("::update()", function () {
    it("fails for non-GitHub packages", function () {
      const updateCallback = jasmine.createSpy("updateCallback");

      packageManager.update({ name: "foo" }, "1.0.0", updateCallback);

      waitsFor(() => updateCallback.callCount === 1);

      runs(function () {
        const updateError = updateCallback.argsForCall[0][0];
        expect(updateError.packageInstallError).toBe(true);
        expect(updateError.message).toContain("Only Git repository package updates");
      });
    });

    it("updates GitHub packages through the built-in installer", function () {
      const updateCallback = jasmine.createSpy("updateCallback");
      spyOn(packageManager, "installGitHubPackage").andReturn(
        Promise.resolve({
          name: "foo",
          apmInstallSource: { type: "git", source: "user/foo", sha: "def456" },
        }),
      );

      packageManager.update(
        {
          name: "foo",
          apmInstallSource: { type: "git", source: "user/foo", sha: "abc123" },
        },
        null,
        updateCallback,
      );

      waitsFor(() => updateCallback.callCount === 1);

      runs(function () {
        expect(updateCallback.argsForCall[0].length).toBe(0);
        expect(packageManager.installGitHubPackage).toHaveBeenCalledWith({
          name: "user/foo",
          apmInstallSource: { type: "git", source: "user/foo", sha: "abc123" },
        });
      });
    });
  });

  describe("::assertNoNameCollision()", function () {
    let packagesDir;

    const writeInstalledMetadata = (name, metadata) => {
      const packageDir = path.join(packagesDir, name);
      fs.makeTreeSync(packageDir);
      fs.writeFileSync(
        path.join(packageDir, "package.json"),
        JSON.stringify({ name, ...metadata }),
      );
    };

    beforeEach(function () {
      packagesDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lumine-spec-")));
      spyOn(packageManager, "getAtomPackagesDirectory").andReturn(packagesDir);
    });

    afterEach(function () {
      fs.removeSync(packagesDir);
    });

    it("throws for names of bundled packages", function () {
      expect(() =>
        packageManager.assertNoNameCollision("settings-view", { repository: "user/settings-view" }),
      ).toThrow();
    });

    it("throws when a package with the same name but another origin is installed", function () {
      writeInstalledMetadata("shared-name", {
        repository: "https://github.com/someone-else/shared-name.git",
      });
      expect(() =>
        packageManager.assertNoNameCollision("shared-name", {
          repository: "user/shared-name",
          source: "user/shared-name",
        }),
      ).toThrow();
    });

    it("allows reinstalling the same package", function () {
      writeInstalledMetadata("shared-name", {
        repository: "https://github.com/user/shared-name.git",
      });
      expect(() =>
        packageManager.assertNoNameCollision("shared-name", {
          repository: "user/shared-name",
          source: "user/shared-name@1.2.0",
        }),
      ).not.toThrow();
    });

    it("allows installing when nothing with that name is installed", function () {
      expect(() =>
        packageManager.assertNoNameCollision("free-name", { repository: "user/free-name" }),
      ).not.toThrow();
    });

    it("allows overwriting an installed package without origin information", function () {
      writeInstalledMetadata("shared-name", {});
      expect(() =>
        packageManager.assertNoNameCollision("shared-name", { repository: "user/shared-name" }),
      ).not.toThrow();
    });
  });

  describe("::uninstall()", function () {
    it("removes the package from the core.disabledPackages list", function () {
      const uninstallCallback = jasmine.createSpy("uninstallCallback");
      atom.config.set("core.disabledPackages", ["something"]);

      waitsForPromise(() => packageManager.uninstall({ name: "something" }, uninstallCallback));

      runs(() => {
        expect(uninstallCallback).toHaveBeenCalled();
        expect(atom.config.get("core.disabledPackages")).not.toContain("something");
      });
    });

    it("awaits async deactivation before unloading an active package", function () {
      // Reproduces the "Tried to unload active package" error: deactivation is
      // async, so unloading must wait for it to complete.
      let deactivated = false;
      spyOn(atom.packages, "isPackageActive").andCallFake(() => !deactivated);
      spyOn(atom.packages, "deactivatePackage").andCallFake(() =>
        Promise.resolve().then(() => {
          deactivated = true;
        }),
      );
      spyOn(atom.packages, "isPackageLoaded").andReturn(true);
      spyOn(atom.packages, "unloadPackage").andCallFake((name) => {
        if (atom.packages.isPackageActive(name)) {
          throw new Error(`Tried to unload active package '${name}'`);
        }
      });
      spyOn(atom.packages, "resolvePackagePath").andReturn(null);

      const uninstallCallback = jasmine.createSpy("uninstallCallback");
      waitsForPromise(() => packageManager.uninstall({ name: "active-pkg" }, uninstallCallback));

      runs(() => {
        expect(atom.packages.deactivatePackage).toHaveBeenCalledWith("active-pkg");
        expect(atom.packages.unloadPackage).toHaveBeenCalledWith("active-pkg");
        expect(uninstallCallback).toHaveBeenCalled();
        expect(uninstallCallback.mostRecentCall.args[0]).toBeUndefined();
      });
    });
  });

  describe("::pinSourceToVersion()", function () {
    it("pins an owner/repo shorthand with @version", function () {
      expect(packageManager.pinSourceToVersion({ repository: "owner/repo" }, "4.0.0")).toBe(
        "owner/repo@4.0.0",
      );
    });

    it("pins a Git URL with an explicit #tag: selector", function () {
      expect(
        packageManager.pinSourceToVersion({ repository: "https://github.com/owner/repo" }, "4.0.0"),
      ).toBe("https://github.com/owner/repo#tag:4.0.0");
    });
  });

  describe("::removePackageDir()", function () {
    it("removes a directory tree asynchronously, including nested folders", function () {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lumine-rm-")));
      fs.makeTreeSync(path.join(dir, "node_modules", "dep", "deep"));
      fs.writeFileSync(path.join(dir, "node_modules", "dep", "deep", "index.js"), "x");
      expect(fs.existsSync(dir)).toBe(true);

      waitsForPromise(() => packageManager.removePackageDir(dir));
      runs(() => expect(fs.existsSync(dir)).toBe(false));
    });

    it("resolves without error when the directory is already gone", function () {
      waitsForPromise(() =>
        packageManager.removePackageDir(path.join(os.tmpdir(), "lumine-not-there-xyz")),
      );
    });
  });

  describe("::copyPackageDir()", function () {
    it("copies a directory tree asynchronously", function () {
      const source = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lumine-src-")));
      const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lumine-dst-")));
      const target = path.join(parent, "copied");
      fs.makeTreeSync(path.join(source, "lib"));
      fs.writeFileSync(path.join(source, "lib", "main.js"), "module.exports = 1;");

      waitsForPromise(() => packageManager.copyPackageDir(source, target));
      runs(() => {
        expect(fs.existsSync(path.join(target, "lib", "main.js"))).toBe(true);
        fs.removeSync(source);
        fs.removeSync(parent);
      });
    });
  });

  describe("::installGitHubPackage()", function () {
    it("reinstalls an installed package from its recorded source, not the bare name", function () {
      spyOn(packageManager, "resolvePackageSource").andReturn(Promise.reject(new Error("stop")));
      const pack = {
        name: "hydrogen-next",
        apmInstallSource: { type: "git", source: "lumine-code/hydrogen-next" },
      };

      let rejected = false;
      waitsForPromise(() =>
        packageManager.installGitHubPackage(pack).catch(() => (rejected = true)),
      );

      runs(() => {
        expect(rejected).toBe(true);
        expect(packageManager.resolvePackageSource).toHaveBeenCalledWith(
          "lumine-code/hydrogen-next",
        );
      });
    });

    it("preserves an explicit version selector from installSource", function () {
      spyOn(packageManager, "resolvePackageSource").andReturn(Promise.reject(new Error("stop")));
      const pack = {
        name: "asiloisad/pulsar-invert-colors@0.4.0",
        installSource: "asiloisad/pulsar-invert-colors@0.4.0",
        repository: "asiloisad/pulsar-invert-colors",
      };

      let rejected = false;
      waitsForPromise(() =>
        packageManager.installGitHubPackage(pack).catch(() => (rejected = true)),
      );

      runs(() => {
        expect(rejected).toBe(true);
        // The pinned tag must survive; installing the bare repo would grab latest.
        expect(packageManager.resolvePackageSource).toHaveBeenCalledWith(
          "asiloisad/pulsar-invert-colors@0.4.0",
        );
      });
    });

    it("installs from the repository when no installSource is present, not the bare name", function () {
      spyOn(packageManager, "resolvePackageSource").andReturn(Promise.reject(new Error("stop")));
      // A catalog/registry pack that carries only name + repository (+ version).
      const pack = {
        name: "hydrogen-next",
        repository: "lumine-code/hydrogen-next",
        version: "4.14.1",
      };

      let rejected = false;
      waitsForPromise(() =>
        packageManager.installGitHubPackage(pack).catch(() => (rejected = true)),
      );

      runs(() => {
        expect(rejected).toBe(true);
        // The pinned-version attempt must target the repository, never "hydrogen-next".
        const source = packageManager.resolvePackageSource.mostRecentCall.args[0];
        expect(source).toContain("lumine-code/hydrogen-next");
      });
    });
  });

  describe("::packageHasSettings", function () {
    it("returns true when the package has config", function () {
      atom.packages.loadPackage(path.join(__dirname, "fixtures", "package-with-config"));
      expect(packageManager.packageHasSettings("package-with-config")).toBe(true);
    });

    it("returns false when the package does not have config and doesn't define language grammars", () =>
      expect(packageManager.packageHasSettings("random-package")).toBe(false));

    it("returns true when the package does not have config, but does define language grammars", function () {
      const packageName = "language-test";

      waitsForPromise(() =>
        atom.packages.activatePackage(path.join(__dirname, "fixtures", packageName)),
      );

      return runs(() => expect(packageManager.packageHasSettings(packageName)).toBe(true));
    });
  });

  describe("::loadOutdated", function () {
    it("caches results", function () {
      spyOn(packageManager, "getGitPackageUpdates").andReturn(Promise.resolve([{ name: "boop" }]));

      waitsForPromise(() => new Promise((resolve) => packageManager.loadOutdated(false, resolve)));

      runs(function () {
        expect(packageManager.apmCache.loadOutdated.value).toEqual([{ name: "boop" }]);
      });

      waitsForPromise(() => new Promise((resolve) => packageManager.loadOutdated(false, resolve)));

      runs(function () {
        expect(packageManager.getGitPackageUpdates.callCount).toBe(1);
      });
    });

    it("expires results if it is called with clearCache set to true", function () {
      packageManager.apmCache.loadOutdated = {
        value: ["hi"],
        expiry: Date.now() + 999999999,
      };
      spyOn(packageManager, "getGitPackageUpdates").andReturn(Promise.resolve([{ name: "boop" }]));

      waitsForPromise(() => new Promise((resolve) => packageManager.loadOutdated(true, resolve)));

      runs(function () {
        expect(packageManager.getGitPackageUpdates.callCount).toBe(1);
        expect(packageManager.apmCache.loadOutdated.value).toEqual([{ name: "boop" }]);
      });
    });
  });

  describe("::getGitPackageUpdates()", function () {
    it("finds a newer tag for packages installed with the default selector", function () {
      spyOn(packageManager, "getLocalPackages").andReturn({
        git: [
          {
            name: "sample",
            version: "1.0.0",
            apmInstallSource: {
              type: "git",
              source: "owner/sample",
              updatePolicy: "latest-tag",
              sha: "1111111111111111111111111111111111111111",
            },
          },
        ],
      });
      spyOn(packageManager, "resolvePackageSource").andReturn(
        Promise.resolve({
          sha: "2222222222222222222222222222222222222222",
          version: "2.0.0",
        }),
      );

      waitsForPromise(() =>
        packageManager.getGitPackageUpdates().then((updates) => {
          expect(updates.length).toBe(1);
          expect(updates[0].latestSha).toBe("2222222222222222222222222222222222222222");
          expect(updates[0].latestVersion).toBe("2.0.0");
        }),
      );
    });

    it("does not check explicitly pinned tags or commits", function () {
      spyOn(packageManager, "getLocalPackages").andReturn({
        git: [
          {
            name: "sample",
            apmInstallSource: {
              type: "git",
              source: "owner/sample#tag:v1.0.0",
              updatePolicy: "pinned",
              sha: "1111111111111111111111111111111111111111",
            },
          },
        ],
      });
      spyOn(packageManager, "resolvePackageSource");

      waitsForPromise(() =>
        packageManager.getGitPackageUpdates().then((updates) => {
          expect(updates).toEqual([]);
          expect(packageManager.resolvePackageSource).not.toHaveBeenCalled();
        }),
      );
    });
  });
});
