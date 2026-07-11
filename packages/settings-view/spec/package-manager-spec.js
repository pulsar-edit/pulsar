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

  describe("::uninstall()", function () {
    it("removes the package from the core.disabledPackages list", function () {
      const uninstallCallback = jasmine.createSpy("uninstallCallback");
      atom.config.set("core.disabledPackages", ["something"]);

      packageManager.uninstall({ name: "something" }, uninstallCallback);

      expect(uninstallCallback).toHaveBeenCalled();
      expect(atom.config.get("core.disabledPackages")).not.toContain("something");
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
