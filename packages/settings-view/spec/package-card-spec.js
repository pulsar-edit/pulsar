const path = require("path");
const PackageCard = require("../lib/package-card");
const PackageManager = require("../lib/package-manager");
const SettingsView = require("../lib/settings-view");

describe("PackageCard", function () {
  const setPackageStatusSpies = function (opts) {
    spyOn(PackageCard.prototype, "isInstalled").andReturn(opts.installed);
    spyOn(PackageCard.prototype, "isDisabled").andReturn(opts.disabled);
    spyOn(PackageCard.prototype, "hasSettings").andReturn(opts.hasSettings);
  };

  let [card, packageManager] = [];

  beforeEach(function () {
    packageManager = new PackageManager();
  });

  it("doesn't show the disable control for a theme", function () {
    setPackageStatusSpies({ installed: true, disabled: false });
    card = new PackageCard(
      { theme: "syntax", name: "test-theme" },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.refs.enablementButton).not.toBeVisible();
  });

  it("doesn't show the status indicator for a theme", function () {
    setPackageStatusSpies({ installed: true, disabled: false });
    card = new PackageCard(
      { theme: "syntax", name: "test-theme" },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.refs.statusIndicatorButton).not.toBeVisible();
  });

  it("doesn't show the settings button for a theme", function () {
    setPackageStatusSpies({ installed: true, disabled: false });
    card = new PackageCard(
      { theme: "syntax", name: "test-theme" },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.refs.settingsButton).not.toBeVisible();
  });

  it("doesn't show the settings button on the settings view", function () {
    setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
    card = new PackageCard({ name: "test-package" }, new SettingsView(), packageManager, {
      onSettingsView: true,
    });
    jasmine.attachToDOM(card.element);
    expect(card.refs.settingsButton).not.toBeVisible();
  });

  it("removes the settings button if a package has no settings", function () {
    setPackageStatusSpies({ installed: true, disabled: false, hasSettings: false });
    card = new PackageCard({ name: "test-package" }, new SettingsView(), packageManager);
    jasmine.attachToDOM(card.element);
    expect(card.refs.settingsButton).not.toBeVisible();
  });

  it("removes the uninstall button if a package has is a bundled package", function () {
    setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
    card = new PackageCard({ name: "search-panel" }, new SettingsView(), packageManager);
    jasmine.attachToDOM(card.element);
    expect(card.refs.uninstallButton).not.toBeVisible();
  });

  describe("display name for Git packages", function () {
    const gitUrlInfo = { project: "pulsar-invert-colors", type: "github" };

    it("labels a pre-install Git card with the repository project name", function () {
      setPackageStatusSpies({ installed: false, disabled: false });
      card = new PackageCard(
        {
          name: "asiloisad/pulsar-invert-colors@0.4.0",
          repository: "asiloisad/pulsar-invert-colors",
          gitUrlInfo,
        },
        new SettingsView(),
        packageManager,
      );
      expect(card.refs.packageName.textContent).toBe("pulsar-invert-colors");
    });

    it("labels an installed package with its real package.json name", function () {
      setPackageStatusSpies({ installed: true, disabled: false });
      card = new PackageCard(
        {
          name: "invert-colors",
          repository: "asiloisad/pulsar-invert-colors",
          gitUrlInfo,
          apmInstallSource: { type: "git", source: "asiloisad/pulsar-invert-colors" },
        },
        new SettingsView(),
        packageManager,
      );
      expect(card.refs.packageName.textContent).toBe("invert-colors");
    });
  });

  it("marks Pulsar-sourced packages with a purple install action", function () {
    setPackageStatusSpies({ installed: false, disabled: false });
    card = new PackageCard(
      { name: "hydrogen", repository: "nteract/hydrogen", source: "pulsar" },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.element).toHaveClass("pulsar-source");
  });

  it("shows the owner/repo reference so same-named packages are distinguishable", function () {
    setPackageStatusSpies({ installed: false, disabled: false });
    card = new PackageCard(
      { name: "twin", repository: "https://github.com/author-two/twin.git" },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.refs.repoLink.textContent).toBe("author-two/twin");
  });

  it("disables install with a hover note when no compatible version exists", function () {
    setPackageStatusSpies({ installed: false, disabled: false });
    spyOn(packageManager, "loadCompatiblePackageVersion").andCallFake((name, cb) => cb(null, {}));
    card = new PackageCard(
      {
        name: "test-engines-package",
        repository: "owner/test-engines-package",
        engines: { atom: ">=100.0.0" },
      },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.refs.installButton).toBeVisible();
    expect(card.refs.installButton).toHaveClass("disabled");
    expect(card.installBlocked).toBe(true);
    expect(card.installNoteTooltip).toBeTruthy();
    expect(card.refs.packageMessage.textContent).toBe("");
  });

  describe("the Git install indicator", function () {
    const gitCard = (apmInstallSource) => {
      setPackageStatusSpies({ installed: true, disabled: false });
      const built = new PackageCard(
        {
          name: "git-package",
          version: "6.0.0",
          repository: "owner/git-package",
          apmInstallSource,
        },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(built.element);
      return built;
    };

    it("shows the version and hides the commit sha when installed from a tag", function () {
      card = gitCard({
        type: "git",
        selector: { type: "tag", value: "6.0.0" },
        version: "6.0.0",
        sha: "abcdef1234567890",
      });
      expect(card.refs.versionValue.textContent).toBe("6.0.0");
      expect(card.refs.packageSha.style.display).toBe("none");
    });

    it("hides the commit sha when installed from the latest tag", function () {
      card = gitCard({
        type: "git",
        selector: { type: "latest", value: "6.0.0" },
        version: "6.0.0",
        sha: "abcdef1234567890",
      });
      expect(card.refs.packageSha.style.display).toBe("none");
    });

    it("shows the branch name when installed from a branch", function () {
      card = gitCard({
        type: "git",
        selector: { type: "branch", value: "develop" },
        sha: "abcdef1234567890",
      });
      expect(card.refs.packageSha.style.display).not.toBe("none");
      expect(card.refs.shaValue.textContent).toBe("develop");
    });

    it("shows the short commit when installed from a commit", function () {
      card = gitCard({
        type: "git",
        selector: { type: "commit", value: "abcdef1234567890" },
        sha: "abcdef1234567890",
      });
      expect(card.refs.shaValue.textContent).toBe("abcdef12");
    });

    it("falls back to the sha for legacy installs without a selector", function () {
      card = gitCard({ type: "git", sha: "abcdef1234567890" });
      expect(card.refs.packageSha.style.display).not.toBe("none");
      expect(card.refs.shaValue.textContent).toBe("abcdef12");
    });

    it("hides the git ref when the package is not installed", function () {
      // e.g. an Install card, or after uninstalling — the adopted install
      // source lingers on the pack but must not be shown.
      setPackageStatusSpies({ installed: false, disabled: false });
      card = new PackageCard(
        {
          name: "git-package",
          version: "6.0.0",
          repository: "owner/git-package",
          apmInstallSource: {
            type: "git",
            selector: { type: "commit", value: "2f2d51cc" },
            sha: "2f2d51cc0000",
          },
        },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.packageSha.style.display).toBe("none");
    });
  });

  describe("when a different package with the same name is being installed", function () {
    const emitFor = (event) =>
      packageManager.emitter.emit(event, {
        pack: { name: "hydrogen-next", installSource: "lumine-code/hydrogen-next" },
      });

    beforeEach(function () {
      setPackageStatusSpies({ installed: false, disabled: false });
      card = new PackageCard(
        { name: "hydrogen-next", version: "4.14.1", repository: "asiloisad/pulsar-hydrogen-next" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
    });

    it("disables this card's install button instead of showing the spinner", function () {
      emitFor("package-installing");
      expect(card.refs.installButton).toHaveClass("disabled");
      expect(card.refs.installButton).not.toHaveClass("is-installing");
      expect(card.installBlocked).toBe(true);
    });

    it("reverts to installable if that install fails", function () {
      emitFor("package-installing");
      expect(card.refs.installButton).toHaveClass("disabled");

      emitFor("package-install-failed");
      expect(card.refs.installButton).not.toHaveClass("disabled");
      expect(card.installBlocked).toBe(false);
    });

    it("moves to the conflict state if that install succeeds", function () {
      emitFor("package-installing");
      jasmine.unspy(PackageCard.prototype, "isInstalled");
      spyOn(PackageCard.prototype, "isInstalled").andReturn(true);
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "hydrogen-next",
        apmInstallSource: { type: "git", source: "lumine-code/hydrogen-next" },
      });

      emitFor("package-installed");
      expect(card.refs.installButton).toHaveClass("disabled");
      expect(card.refs.uninstallButton).not.toBeVisible();
      expect(card.installNoteTooltip).toBeTruthy();
    });
  });

  describe("when an installed package only shares its name with the card's package", function () {
    it("identifies the install by apmInstallSource, not the package.json repository", function () {
      // A fork installed from lumine-code/hydrogen-next whose package.json still
      // points repository at the upstream it was forked from. A card for that
      // upstream must still be treated as a *different* package (conflict), and
      // only the card matching the real install source is "installed".
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "hydrogen-next",
        repository: "https://github.com/asiloisad/pulsar-hydrogen-next",
        apmInstallSource: {
          type: "git",
          source: "lumine-code/hydrogen-next",
          repository: "lumine-code/hydrogen-next",
        },
      });

      const upstreamCard = new PackageCard(
        { name: "hydrogen-next", repository: "asiloisad/pulsar-hydrogen-next" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(upstreamCard.element);
      expect(upstreamCard.refs.installButton).toHaveClass("disabled");
      expect(upstreamCard.installNoteTooltip).toBeTruthy();

      card = new PackageCard(
        { name: "hydrogen-next", repository: "lumine-code/hydrogen-next" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.uninstallButton).toBeVisible();
      expect(card.refs.installButton).not.toHaveClass("disabled");

      upstreamCard.destroy();
    });

    it("disables the install button with an explanatory tooltip", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "shared-name",
        repository: "https://github.com/someone-else/shared-name.git",
      });
      card = new PackageCard(
        { name: "shared-name", repository: "catalog-owner/shared-name" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.installButton).toBeVisible();
      expect(card.refs.installButton).toHaveClass("disabled");
      expect(card.refs.uninstallButton).not.toBeVisible();
      expect(card.refs.settingsButton).not.toBeVisible();
      expect(card.installNoteTooltip).toBeTruthy();
    });

    it("does not install while in the conflict state", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "shared-name",
        repository: "https://github.com/someone-else/shared-name.git",
      });
      spyOn(packageManager, "install");
      card = new PackageCard(
        { name: "shared-name", repository: "catalog-owner/shared-name" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      card.refs.installButton.click();
      expect(packageManager.install).not.toHaveBeenCalled();
    });

    it("re-enables the install button once the origin no longer conflicts", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
      const metadataSpy = spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "shared-name",
        repository: "https://github.com/someone-else/shared-name.git",
      });
      card = new PackageCard(
        { name: "shared-name", repository: "catalog-owner/shared-name" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.installButton).toHaveClass("disabled");

      // The conflicting package is uninstalled; the origin no longer clashes.
      metadataSpy.andReturn({
        name: "shared-name",
        repository: "https://github.com/catalog-owner/shared-name.git",
      });
      card.updateInterfaceState();
      expect(card.refs.installButton).not.toHaveClass("disabled");
      expect(card.installNoteTooltip).toBe(null);
    });

    it("shows the regular installed state when the origins match", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: false });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "shared-name",
        repository: "https://github.com/catalog-owner/shared-name.git",
      });
      card = new PackageCard(
        { name: "shared-name", repository: "catalog-owner/shared-name@1.2.0" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.uninstallButton).toBeVisible();
      expect(card.refs.packageMessage.textContent).toBe("");
    });

    it("keeps a disabled install button when the name matches a bundled package from another origin", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: false });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "search-panel",
        repository: "https://github.com/lumine-code/lumine.git",
      });
      card = new PackageCard(
        { name: "search-panel", repository: "impostor-dev/search-panel" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.installButton).toBeVisible();
      expect(card.refs.installButton).toHaveClass("disabled");
      expect(card.installNoteTooltip).toBeTruthy();
    });

    it("does not open the installed package's settings from a conflicting card", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "shared-name",
        repository: "https://github.com/someone-else/shared-name.git",
      });
      const settingsView = new SettingsView();
      spyOn(settingsView, "showPanel");
      card = new PackageCard(
        { name: "shared-name", repository: "catalog-owner/shared-name" },
        settingsView,
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      card.element.click();
      expect(settingsView.showPanel).not.toHaveBeenCalled();
    });

    it("offers an update when the same package is installed with an older version", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: false });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "shared-name",
        version: "1.0.0",
        repository: "https://github.com/user/shared-name.git",
        apmInstallSource: { type: "git", source: "user/shared-name", sha: "abc123def456" },
      });
      card = new PackageCard(
        { name: "shared-name", version: "1.2.0", repository: "user/shared-name" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.updateButton).toBeVisible();
      expect(card.refs.updateButton.textContent).toContain("Update to 1.2.0");
      expect(card.refs.installButton).not.toBeVisible();
      expect(card.pack.apmInstallSource.source).toBe("user/shared-name");
    });

    it("shows no update when the installed version matches the catalog version", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: false });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({
        name: "shared-name",
        version: "1.2.0",
        repository: "https://github.com/user/shared-name.git",
        apmInstallSource: { type: "git", source: "user/shared-name", sha: "abc123def456" },
      });
      card = new PackageCard(
        { name: "shared-name", version: "1.2.0", repository: "user/shared-name" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.updateButton).not.toBeVisible();
      expect(card.refs.uninstallButton).toBeVisible();
    });

    it("treats an installed package without origin information as the same package", function () {
      setPackageStatusSpies({ installed: true, disabled: false, hasSettings: false });
      spyOn(PackageCard.prototype, "getInstalledMetadata").andReturn({ name: "shared-name" });
      card = new PackageCard(
        { name: "shared-name", repository: "catalog-owner/shared-name" },
        new SettingsView(),
        packageManager,
      );
      jasmine.attachToDOM(card.element);
      expect(card.refs.uninstallButton).toBeVisible();
      expect(card.refs.packageMessage.textContent).toBe("");
    });
  });

  it("displays the new version in the update button", function () {
    setPackageStatusSpies({ installed: true, disabled: false, hasSettings: true });
    card = new PackageCard(
      { name: "search-panel", version: "1.0.0", latestVersion: "1.2.0" },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.refs.updateButton).toBeVisible();
    expect(card.refs.updateButton.textContent).toContain("Update to 1.2.0");
  });

  it("displays the new version in the update button when the package is disabled", function () {
    setPackageStatusSpies({ installed: true, disabled: true, hasSettings: true });
    card = new PackageCard(
      { name: "search-panel", version: "1.0.0", latestVersion: "1.2.0" },
      new SettingsView(),
      packageManager,
    );
    jasmine.attachToDOM(card.element);
    expect(card.refs.updateButton).toBeVisible();
    expect(card.refs.updateButton.textContent).toContain("Update to 1.2.0");
  });

  it("shows a badge", function () {
    const pack = {
      badges: [
        {
          link: "https://example.com",
          title: "Archived",
          text: "Source code has been archived",
          type: "warn",
        },
      ],
      name: "something",
      version: "1.0.0",
      latestVersion: "1.0.0",
    };
    card = new PackageCard(pack, new SettingsView(), packageManager);

    spyOn(atom, "openExternal");
    jasmine.attachToDOM(card.element);
    const badge = card.element.querySelector(".package-badge-dot");
    expect(badge).toExist();
    expect(badge).toHaveClass("badge-dot-warn");
    badge?.click();
    expect(atom.openExternal).toHaveBeenCalledWith("https://example.com");
  });

  it("shows the author details", function () {
    const authorName = "authorName";
    const pack = {
      name: "some-package",
      version: "0.1.0",
      repository: `https://github.com/${authorName}/some-package`,
    };
    card = new PackageCard(pack, new SettingsView(), packageManager);

    jasmine.attachToDOM(card.element);

    expect(card.refs.loginLink.textContent).toBe(authorName);
  });

  describe("when the package is not installed", function () {
    it("shows the settings, uninstall, and disable buttons", function () {
      const pack = {
        name: "some-package",
        version: "0.1.0",
        repository: "http://github.com/omgwow/some-package",
      };
      card = new PackageCard(pack, new SettingsView(), packageManager);

      jasmine.attachToDOM(card.element);

      expect(card.refs.installButtonGroup).toBeVisible();
      expect(card.refs.updateButtonGroup).not.toBeVisible();
      expect(card.refs.packageActionButtonGroup).not.toBeVisible();
    });

    it("can be installed if currently not installed", function () {
      setPackageStatusSpies({ installed: false, disabled: false });
      spyOn(packageManager, "install");

      card = new PackageCard({ name: "test-package" }, new SettingsView(), packageManager);
      expect(card.refs.installButton.style.display).not.toBe("none");
      expect(card.refs.uninstallButton.style.display).toBe("none");
      card.refs.installButton.click();
      expect(packageManager.install).toHaveBeenCalled();
    });

    it("can be installed if currently not installed and package latest release engine match atom version", function () {
      spyOn(packageManager, "install");
      spyOn(packageManager, "loadCompatiblePackageVersion").andCallFake(
        function (packageName, callback) {
          const pack = {
            name: packageName,
            version: "0.1.0",
            engines: {
              atom: ">0.50.0",
            },
          };

          return callback(null, pack);
        },
      );

      setPackageStatusSpies({ installed: false, disabled: false });

      card = new PackageCard(
        {
          name: "test-package",
          version: "0.1.0",
          engines: {
            atom: ">0.50.0",
          },
        },
        new SettingsView(),
        packageManager,
      );

      // In that case there's no need to make a request to get all the versions
      expect(packageManager.loadCompatiblePackageVersion).not.toHaveBeenCalled();

      expect(card.refs.installButton.style.display).not.toBe("none");
      expect(card.refs.uninstallButton.style.display).toBe("none");
      card.refs.installButton.click();
      expect(packageManager.install).toHaveBeenCalled();
      expect(packageManager.install.mostRecentCall.args[0]).toEqual({
        name: "test-package",
        version: "0.1.0",
        engines: {
          atom: ">0.50.0",
        },
      });
    });

    it("can be installed with a previous version whose engine match the current atom version", function () {
      spyOn(packageManager, "install");
      spyOn(packageManager, "loadCompatiblePackageVersion").andCallFake(
        function (packageName, callback) {
          const pack = {
            name: packageName,
            version: "0.0.1",
            engines: {
              atom: ">0.50.0",
            },
          };

          return callback(null, pack);
        },
      );

      setPackageStatusSpies({ installed: false, disabled: false });

      card = new PackageCard(
        {
          name: "test-package",
          version: "0.1.0",
          engines: {
            atom: ">99.0.0",
          },
        },
        new SettingsView(),
        packageManager,
      );

      expect(card.refs.installButton.style.display).not.toBe("none");
      expect(card.refs.installButton).not.toHaveClass("disabled");
      expect(card.refs.uninstallButton.style.display).toBe("none");
      expect(card.refs.versionValue.textContent).toBe("0.0.1");
      expect(card.refs.versionValue).toHaveClass("text-warning");
      // The compatibility note is shown as a hover tooltip, not inline text.
      expect(card.installBlocked).toBe(false);
      expect(card.installNoteTooltip).toBeTruthy();
      card.refs.installButton.click();
      expect(packageManager.install).toHaveBeenCalled();
      expect(packageManager.install.mostRecentCall.args[0]).toEqual({
        name: "test-package",
        version: "0.0.1",
        engines: {
          atom: ">0.50.0",
        },
      });
    });

    it("can't be installed if there is no version compatible with the current atom version", function () {
      spyOn(packageManager, "loadCompatiblePackageVersion").andCallFake(
        function (packageName, callback) {
          const pack = { name: packageName };

          return callback(null, pack);
        },
      );

      setPackageStatusSpies({ installed: false, disabled: false });

      const pack = {
        name: "test-package",
        engines: {
          atom: ">=99.0.0",
        },
      };
      card = new PackageCard(pack, new SettingsView(), packageManager);
      jasmine.attachToDOM(card.element);

      // Install stays visible but disabled, with the reason shown on hover.
      expect(card.refs.installButton).toBeVisible();
      expect(card.refs.installButton).toHaveClass("disabled");
      expect(card.installBlocked).toBe(true);
      expect(card.installNoteTooltip).toBeTruthy();
      expect(card.refs.packageActionButtonGroup).not.toBeVisible();
      expect(card.refs.versionValue).toHaveClass("text-error");
    });
  });

  describe("when the package is installed", function () {
    beforeEach(function () {
      atom.packages.loadPackage(path.join(__dirname, "fixtures", "package-with-config"));
      return waitsFor(() => atom.packages.isPackageLoaded("package-with-config") === true);
    });

    it("can be disabled if installed", function () {
      setPackageStatusSpies({ installed: true, disabled: false });
      spyOn(atom.packages, "disablePackage").andReturn(true);

      card = new PackageCard({ name: "test-package" }, new SettingsView(), packageManager);
      expect(card.refs.enablementButton.querySelector(".disable-text").textContent).toBe("Disable");
      card.refs.enablementButton.click();
      expect(atom.packages.disablePackage).toHaveBeenCalled();
    });

    it("can be updated", function () {
      const pack = atom.packages.getLoadedPackage("package-with-config");
      pack.latestVersion = "1.1.0";
      pack.latestSha = "abcdef1234567890";
      pack.apmInstallSource = {
        type: "git",
        source: "example/package-with-config",
        sha: pack.latestSha,
      };
      let packageUpdated = false;

      packageManager.on("package-updated", () => (packageUpdated = true));
      spyOn(packageManager, "installGitHubPackage").andReturn(
        Promise.resolve({ name: "package-with-config" }),
      );

      const originalLoadPackage = atom.packages.loadPackage;
      spyOn(atom.packages, "loadPackage").andCallFake(() =>
        originalLoadPackage.call(
          atom.packages,
          path.join(__dirname, "fixtures", "package-with-config"),
        ),
      );

      card = new PackageCard(pack, new SettingsView(), packageManager);
      jasmine.attachToDOM(card.element);
      expect(card.refs.updateButton).toBeVisible();

      card.update().catch(() => {});

      waitsFor(() => packageUpdated);

      runs(() => expect(card.refs.updateButton).not.toBeVisible());
    });

    it("keeps the update button visible if the update failed", function () {
      const pack = atom.packages.getLoadedPackage("package-with-config");
      pack.latestVersion = "1.1.0";
      pack.latestSha = "abcdef1234567890";
      pack.apmInstallSource = {
        type: "git",
        source: "example/package-with-config",
        sha: pack.latestSha,
      };
      let updateFailed = false;

      packageManager.on("package-update-failed", () => (updateFailed = true));
      spyOn(packageManager, "installGitHubPackage").andReturn(Promise.reject(new Error("boom")));

      const originalLoadPackage = atom.packages.loadPackage;
      spyOn(atom.packages, "loadPackage").andCallFake(() =>
        originalLoadPackage.call(
          atom.packages,
          path.join(__dirname, "fixtures", "package-with-config"),
        ),
      );

      card = new PackageCard(pack, new SettingsView(), packageManager);
      jasmine.attachToDOM(card.element);
      expect(card.refs.updateButton).toBeVisible();

      card.update();

      waitsFor(() => updateFailed);

      runs(() => expect(card.refs.updateButton).toBeVisible());
    });

    it("does not error when attempting to update without any update available", function () {
      // While this cannot be done through the package card UI,
      // updates can still be triggered through the Updates panel's Update All button
      // https://github.com/atom/settings-view/issues/879

      const pack = atom.packages.getLoadedPackage("package-with-config");

      const originalLoadPackage = atom.packages.loadPackage;
      spyOn(atom.packages, "loadPackage").andCallFake(() =>
        originalLoadPackage.call(
          atom.packages,
          path.join(__dirname, "fixtures", "package-with-config"),
        ),
      );

      card = new PackageCard(pack, new SettingsView(), packageManager);
      jasmine.attachToDOM(card.element);
      expect(card.refs.updateButton).not.toBeVisible();

      waitsForPromise(() => card.update());

      runs(() => expect(card.refs.updateButton).not.toBeVisible());
    });

    it("will stay disabled after an update", function () {
      const pack = atom.packages.getLoadedPackage("package-with-config");
      pack.latestVersion = "1.1.0";
      pack.latestSha = "abcdef1234567890";
      pack.apmInstallSource = {
        type: "git",
        source: "example/package-with-config",
        sha: pack.latestSha,
      };
      let packageUpdated = false;

      packageManager.on("package-updated", () => (packageUpdated = true));
      spyOn(packageManager, "installGitHubPackage").andReturn(
        Promise.resolve({ name: "package-with-config" }),
      );

      const originalLoadPackage = atom.packages.loadPackage;
      spyOn(atom.packages, "loadPackage").andCallFake(() =>
        originalLoadPackage.call(
          atom.packages,
          path.join(__dirname, "fixtures", "package-with-config"),
        ),
      );

      pack.disable();
      card = new PackageCard(pack, new SettingsView(), packageManager);
      expect(atom.packages.isPackageDisabled("package-with-config")).toBe(true);
      card.update();

      waitsFor(() => packageUpdated);

      runs(() => expect(atom.packages.isPackageDisabled("package-with-config")).toBe(true));
    });

    it("is uninstalled when the uninstallButton is clicked", function () {
      setPackageStatusSpies({ installed: true, disabled: false });

      let [uninstallCallback] = [];
      spyOn(packageManager, "install").andCallThrough();
      spyOn(packageManager, "uninstall").andCallFake(function (pack, callback) {
        packageManager.emitPackageEvent("uninstalling", pack);
        uninstallCallback = function () {
          if (typeof callback === "function") {
            callback();
          }
          packageManager.emitPackageEvent("uninstalled", pack);
        };
      });

      const pack = atom.packages.getLoadedPackage("package-with-config");
      card = new PackageCard(pack, new SettingsView(), packageManager);
      jasmine.attachToDOM(card.element);

      expect(card.refs.uninstallButton).toBeVisible();
      expect(card.refs.enablementButton).toBeVisible();
      card.refs.uninstallButton.click();

      expect(card.refs.uninstallButton.disabled).toBe(true);
      expect(card.refs.enablementButton.disabled).toBe(true);
      expect(card.refs.uninstallButton).toHaveClass("is-uninstalling");

      expect(packageManager.uninstall).toHaveBeenCalled();
      expect(packageManager.uninstall.mostRecentCall.args[0].name).toEqual("package-with-config");

      jasmine.unspy(PackageCard.prototype, "isInstalled");
      spyOn(PackageCard.prototype, "isInstalled").andReturn(false);
      uninstallCallback(0, "", "");

      waits(1);
      runs(function () {
        expect(card.refs.uninstallButton.disabled).toBe(false);
        expect(card.refs.uninstallButton).not.toHaveClass("is-uninstalling");
        expect(card.refs.installButtonGroup).toBeVisible();
        expect(card.refs.updateButtonGroup).not.toBeVisible();
        expect(card.refs.packageActionButtonGroup).not.toBeVisible();
      });
    });

    it("shows the settings, uninstall, and enable buttons when disabled", function () {
      atom.config.set("package-with-config.setting", "something");
      const pack = atom.packages.getLoadedPackage("package-with-config");
      spyOn(atom.packages, "isPackageDisabled").andReturn(true);
      card = new PackageCard(pack, new SettingsView(), packageManager);
      jasmine.attachToDOM(card.element);

      expect(card.refs.updateButtonGroup).not.toBeVisible();
      expect(card.refs.installButtonGroup).not.toBeVisible();

      expect(card.refs.settingsButton).toBeVisible();
      expect(card.refs.uninstallButton).toBeVisible();
      expect(card.refs.enablementButton).toBeVisible();
      expect(card.refs.enablementButton.textContent).toBe("Enable");
    });

    it("shows the settings, uninstall, and disable buttons", function () {
      atom.config.set("package-with-config.setting", "something");
      const pack = atom.packages.getLoadedPackage("package-with-config");
      card = new PackageCard(pack, new SettingsView(), packageManager);

      jasmine.attachToDOM(card.element);

      expect(card.refs.updateButtonGroup).not.toBeVisible();
      expect(card.refs.installButtonGroup).not.toBeVisible();

      expect(card.refs.settingsButton).toBeVisible();
      expect(card.refs.uninstallButton).toBeVisible();
      expect(card.refs.enablementButton).toBeVisible();
      expect(card.refs.enablementButton.textContent).toBe("Disable");
    });

    it("does not show the settings button when there are no settings", function () {
      const pack = atom.packages.getLoadedPackage("package-with-config");
      spyOn(PackageCard.prototype, "hasSettings").andReturn(false);
      card = new PackageCard(pack, new SettingsView(), packageManager);

      jasmine.attachToDOM(card.element);

      expect(card.refs.settingsButton).not.toBeVisible();
      expect(card.refs.uninstallButton).toBeVisible();
      expect(card.refs.enablementButton).toBeVisible();
      expect(card.refs.enablementButton.textContent).toBe("Disable");
    });
  });
});
