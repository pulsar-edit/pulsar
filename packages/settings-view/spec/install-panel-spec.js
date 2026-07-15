const InstallPanel = require("../lib/install-panel");
const PackageManager = require("../lib/package-manager");
const SettingsView = require("../lib/settings-view");

let packageManager;
let panel;
let gitUrlInfo;
let catalogClient;
let pulsarClient;

describe("InstallPanel", function () {
  beforeEach(function () {
    const settingsView = new SettingsView();
    packageManager = new PackageManager();
    atom.config.set("settings-view.communityPackageCatalogs", ["official/catalog"]);
    atom.config.set("settings-view.includePulsarPackageResults", false);
    catalogClient = {
      load: jasmine
        .createSpy("load")
        .andReturn(Promise.resolve({ schemaVersion: 1, packages: [] })),
    };
    pulsarClient = {
      search: jasmine.createSpy("search").andReturn(Promise.resolve([])),
      getPackage: jasmine.createSpy("getPackage").andReturn(Promise.resolve(null)),
    };
    spyOn(packageManager, "getCatalogClient").andReturn({
      load: catalogClient.load,
    });
    spyOn(packageManager, "getPulsarClient").andReturn(pulsarClient);
    panel = new InstallPanel(settingsView, packageManager);
  });

  it("uses one repository input for packages and themes", function () {
    expect(panel.refs.searchPackagesButton).toBeUndefined();
    expect(panel.refs.searchThemesButton).toBeUndefined();
    expect(panel.refs.installHeading.textContent).toContain("Install Packages");
    expect(panel.refs.browseHeading.textContent).toContain("Community Packages");
  });

  it("keeps legacy package and theme install URIs as source aliases", function () {
    expect(panel.extractQueryFromURI("atom://config/install/package:sample-package")).toBe(
      "sample-package",
    );
    expect(panel.extractQueryFromURI("atom://config/install/theme:sample-theme")).toBe(
      "sample-theme",
    );
  });

  it("adds and removes catalog repository sources", function () {
    expect(panel.refs.catalogSourcesList.children.length).toBe(1);
    expect(panel.sourceEditors.length).toBe(1);
    expect(panel.sourceEditors[0].getText()).toBe("official/catalog");
    expect(panel.refs.catalogSourcesList.querySelector("atom-text-editor")).toBeTruthy();
    expect(panel.refs.catalogSourcesList.querySelector("button")).toHaveClass("icon-x");
    expect(
      panel.refs.catalogSourcesList.compareDocumentPosition(panel.refs.catalogEditor.element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    panel.refs.catalogEditor.setText("extra/catalog");
    panel.refs.addCatalogButton.click();

    expect(atom.config.get("settings-view.communityPackageCatalogs")).toEqual([
      "official/catalog",
      "extra/catalog",
    ]);
    expect(panel.refs.catalogSourcesList.children.length).toBe(2);

    panel.refs.catalogSourcesList.querySelector("button").click();
    expect(atom.config.get("settings-view.communityPackageCatalogs")).toEqual(["extra/catalog"]);
  });

  it("adds a catalog source when the add editor confirms with enter", function () {
    panel.refs.catalogEditor.setText("extra/catalog");
    atom.commands.dispatch(panel.refs.catalogEditor.element, "core:confirm");

    expect(atom.config.get("settings-view.communityPackageCatalogs")).toEqual([
      "official/catalog",
      "extra/catalog",
    ]);
    expect(panel.refs.catalogEditor.getText()).toBe("");
  });

  it("saves edits to configured catalog sources", function () {
    const editor = panel.sourceEditors[0];
    editor.setText("updated/catalog");
    atom.commands.dispatch(editor.element, "core:confirm");

    expect(atom.config.get("settings-view.communityPackageCatalogs")).toEqual(["updated/catalog"]);
  });

  it("rejects duplicate catalog sources after URL normalization", function () {
    panel.refs.catalogEditor.setText("https://github.com/official/catalog");
    panel.refs.addCatalogButton.click();

    expect(panel.refs.catalogSourceError.style.display).not.toBe("none");
    expect(panel.refs.catalogSourceErrorMessage.textContent).toContain("already configured");
    expect(atom.config.get("settings-view.communityPackageCatalogs")).toEqual(["official/catalog"]);
  });

  it("dismisses the catalog source error when its close button is clicked", function () {
    panel.refs.catalogEditor.setText("https://github.com/official/catalog");
    panel.refs.addCatalogButton.click();
    expect(panel.refs.catalogSourceError.style.display).not.toBe("none");

    panel.refs.catalogSourceErrorClose.click();
    expect(panel.refs.catalogSourceError.style.display).toBe("none");
  });

  it("shows catalog fetch failures in the catalog sources zone", function () {
    catalogClient.load.andReturn(Promise.reject(new Error("boom")));
    panel.refs.fetchButton.click();

    waitsForPromise(() =>
      panel.catalogPromise.then(() => {
        expect(panel.refs.catalogFetchErrors.querySelector(".error-message")).toBeTruthy();
      }),
    );
  });

  it("restores the default catalog sources", function () {
    panel.refs.restoreDefaultsButton.click();

    expect(atom.config.get("settings-view.communityPackageCatalogs")).toEqual(
      atom.config.getSchema("settings-view.communityPackageCatalogs").default,
    );
  });

  it("does not load any catalogs just from constructing the panel", function () {
    expect(catalogClient.load).not.toHaveBeenCalled();
    expect(panel.catalogFetched).toBe(false);
  });

  it("fetches the catalogs the first time the tab is shown", function () {
    catalogClient.load.reset();
    panel.beforeShow();

    expect(panel.catalogFetched).toBe(true);
    expect(catalogClient.load).toHaveBeenCalledWith("official/catalog", {
      refresh: false,
      cacheOnly: false,
    });
  });

  it("does not re-fetch on later shows", function () {
    panel.beforeShow();
    expect(panel.catalogFetched).toBe(true);
    catalogClient.load.reset();

    panel.beforeShow();
    expect(catalogClient.load).not.toHaveBeenCalled();
  });

  it("downloads the catalogs without the cache when fetch is clicked", function () {
    catalogClient.load.reset();
    panel.refs.fetchButton.click();

    expect(catalogClient.load).toHaveBeenCalledWith("official/catalog", {
      refresh: true,
      cacheOnly: false,
    });
  });

  it("auto-downloads the catalogs on the first search if never fetched", function () {
    expect(panel.catalogFetched).toBe(false);
    catalogClient.load.reset();

    panel.refs.searchEditor.setText("something");
    panel.performSearch();

    expect(panel.catalogFetched).toBe(true);
    expect(catalogClient.load).toHaveBeenCalledWith("official/catalog", {
      refresh: false,
      cacheOnly: false,
    });
  });

  it("does not auto-download again once the catalogs have been fetched", function () {
    panel.refs.fetchButton.click();
    expect(panel.catalogFetched).toBe(true);
    catalogClient.load.reset();

    panel.refs.searchEditor.setText("something");
    panel.performSearch();

    expect(catalogClient.load).not.toHaveBeenCalled();
  });

  it("aggregates catalogs in order and dedupes packages by repository", function () {
    catalogClient.load.andCallFake((source) =>
      Promise.resolve({
        schemaVersion: 1,
        packages: [
          {
            name: "shared",
            description: source,
            repository: "owner/shared",
            installSource: "owner/shared",
          },
          ...(source === "second/catalog"
            ? [
                {
                  name: "second-only",
                  repository: "owner/second-only",
                  installSource: "owner/second-only",
                },
              ]
            : []),
        ],
      }),
    );
    atom.config.set("settings-view.communityPackageCatalogs", ["first/catalog", "second/catalog"]);
    panel.refs.fetchButton.click();

    waitsForPromise(() =>
      panel.catalogPromise.then(() => {
        // The same repository from both catalogs is deduped; the first wins.
        expect(panel.catalogPackages.map(({ name }) => name)).toEqual(["shared", "second-only"]);
        expect(panel.catalogPackages[0].description).toBe("first/catalog");
      }),
    );
  });

  it("keeps same-named packages from different repositories", function () {
    catalogClient.load.andReturn(
      Promise.resolve({
        schemaVersion: 1,
        packages: [
          { name: "twin", repository: "author-one/twin", installSource: "author-one/twin" },
          { name: "twin", repository: "author-two/twin", installSource: "author-two/twin" },
        ],
      }),
    );
    panel.refs.fetchButton.click();

    waitsForPromise(() =>
      panel.catalogPromise.then(() => {
        expect(panel.catalogPackages.map(({ repository }) => repository)).toEqual([
          "author-one/twin",
          "author-two/twin",
        ]);
      }),
    );
  });

  describe("Pulsar registry results", function () {
    beforeEach(function () {
      panel.catalogPackages = [
        { name: "shared", repository: "owner/shared", installSource: "owner/shared" },
      ];
      panel.catalogPromise = Promise.resolve({ schemaVersion: 1, packages: panel.catalogPackages });
    });

    it("does not query Pulsar when the toggle is off", function () {
      atom.config.set("settings-view.includePulsarPackageResults", false);
      waitsForPromise(() =>
        panel.search("shared").then(() => {
          expect(pulsarClient.search).not.toHaveBeenCalled();
        }),
      );
    });

    it("appends Pulsar results, deduped by repository, when the toggle is on", function () {
      atom.config.set("settings-view.includePulsarPackageResults", true);
      pulsarClient.search.andReturn(
        Promise.resolve([
          // Same repo as the catalog result — must be deduped out.
          { name: "shared", repository: "owner/shared", source: "pulsar" },
          { name: "pulsar-only", repository: "owner/pulsar-only", source: "pulsar" },
        ]),
      );

      waitsForPromise(() =>
        panel.search("shared").then((results) => {
          expect(pulsarClient.search).toHaveBeenCalledWith("shared");
          expect(results.map(({ name }) => name)).toEqual(["shared", "pulsar-only"]);
          expect(results[1].source).toBe("pulsar");
          expect(panel.refs.resultsContainer.querySelectorAll(".package-card").length).toBe(2);
        }),
      );
    });

    it("surfaces a Pulsar search failure without dropping catalog results", function () {
      atom.config.set("settings-view.includePulsarPackageResults", true);
      pulsarClient.search.andReturn(Promise.reject(new Error("offline")));

      waitsForPromise(() =>
        panel.search("shared").then((results) => {
          expect(results.map(({ name }) => name)).toEqual(["shared"]);
          expect(panel.refs.searchErrors.textContent).toContain("Pulsar registry");
        }),
      );
    });
  });

  describe("searching packages", () =>
    it("does not query the package registry", function () {
      waitsForPromise(() =>
        panel.search("first").then(() => {
          expect(panel.refs.searchMessage.textContent).toContain("owner/repo");
        }),
      );
    }));

  it("searches catalog metadata and preserves the repository install source", function () {
    panel.catalogPackages = [
      {
        name: "sample-package",
        description: "Useful sample tools",
        keywords: ["example"],
        repository: "owner/sample-package",
        installSource: "owner/sample-package@2.1.0",
      },
    ];
    panel.catalogPromise = Promise.resolve({ schemaVersion: 1, packages: panel.catalogPackages });

    waitsForPromise(() =>
      panel.search("sample").then((results) => {
        expect(results.length).toBe(1);
        expect(results[0].installSource).toBe("owner/sample-package@2.1.0");
        expect(panel.refs.resultsContainer.querySelectorAll(".package-card").length).toBe(1);
      }),
    );
  });

  it("matches by name and keywords but not by description text", function () {
    panel.catalogPackages = [
      {
        name: "seti-ui",
        description: "An icon-rich UI theme",
        keywords: ["ui", "dark"],
        repository: "owner/seti-ui",
        installSource: "owner/seti-ui",
        theme: "ui",
      },
      {
        name: "seti-syntax",
        description: "A dark syntax theme to pair with Seti UI",
        keywords: ["syntax", "dark"],
        repository: "owner/seti-syntax",
        installSource: "owner/seti-syntax",
        theme: "syntax",
      },
    ];
    panel.catalogPromise = Promise.resolve({ schemaVersion: 1, packages: panel.catalogPackages });

    waitsForPromise(() =>
      panel.search("ui").then((results) => {
        // seti-syntax only mentions "UI" in its description and must not match.
        expect(results.map(({ name }) => name)).toEqual(["seti-ui"]);
      }),
    );
  });

  it("filters search results by package and theme", function () {
    panel.catalogPackages = [
      {
        name: "sample-package",
        description: "Useful sample tools",
        repository: "owner/sample-package",
        installSource: "owner/sample-package",
      },
      {
        name: "sample-theme",
        description: "A colorful sample",
        repository: "owner/sample-theme",
        installSource: "owner/sample-theme",
        theme: "ui",
      },
    ];
    panel.catalogPromise = Promise.resolve({ schemaVersion: 1, packages: panel.catalogPackages });

    panel.filterType = "themes";
    waitsForPromise(() =>
      panel.search("sample").then((results) => {
        expect(results.map(({ name }) => name)).toEqual(["sample-theme"]);
      }),
    );

    runs(() => {
      panel.filterType = "packages";
    });
    waitsForPromise(() =>
      panel.search("sample").then((results) => {
        expect(results.map(({ name }) => name)).toEqual(["sample-package"]);
      }),
    );
  });

  it("filters to installed packages with newer catalog versions", function () {
    spyOn(packageManager, "isPackageInstalled").andCallFake((name) => name !== "not-installed");
    spyOn(panel, "getInstalledMetadata").andCallFake((name) => ({
      name,
      version: name === "updatable" ? "1.0.0" : "2.0.0",
      repository: `https://github.com/owner/${name}.git`,
    }));
    panel.catalogPackages = [
      { name: "updatable", version: "2.0.0", repository: "owner/updatable" },
      { name: "current", version: "2.0.0", repository: "owner/current" },
      { name: "not-installed", version: "2.0.0", repository: "owner/not-installed" },
    ];

    panel.setFilterType("updates");
    expect(panel.refs.filterUpdatesButton).toHaveClass("selected");
    expect(panel.browsePackageCards.map(({ pack }) => pack.name)).toEqual(["updatable"]);
  });

  describe("checking for updates", function () {
    beforeEach(function () {
      atom.config.set("settings-view.includePulsarPackageResults", true);
      spyOn(packageManager, "isPackageInstalled").andReturn(true);
      spyOn(panel, "getInstalledMetadata").andCallFake((name) => ({
        name,
        version: "1.0.0",
        repository: `https://github.com/owner/${name}.git`,
      }));
      spyOn(packageManager, "getLocalPackages").andReturn({
        dev: [],
        user: [],
        core: [],
        git: [{ name: "pulsar-only" }],
      });
    });

    it("triggers an update check when shown via the check-updates URI", function () {
      spyOn(panel, "checkForUpdates");
      panel.beforeShow({ uri: "atom://config/install/check-updates" });
      expect(panel.checkForUpdates).toHaveBeenCalled();
    });

    it("refreshes the catalogs and shows the Updates filter", function () {
      catalogClient.load.andReturn(
        Promise.resolve({
          schemaVersion: 1,
          packages: [{ name: "updatable", version: "2.0.0", repository: "owner/updatable" }],
        }),
      );

      waitsForPromise(() => panel.checkForUpdates());
      runs(() => {
        expect(catalogClient.load).toHaveBeenCalledWith("official/catalog", {
          refresh: true,
          cacheOnly: false,
        });
        expect(panel.refs.filterUpdatesButton).toHaveClass("selected");
        expect(panel.browsePackageCards.map(({ pack }) => pack.name)).toEqual(["updatable"]);
      });
    });

    it("merges Pulsar registry updates into the Updates list", function () {
      catalogClient.load.andReturn(Promise.resolve({ schemaVersion: 1, packages: [] }));
      pulsarClient.getPackage.andCallFake((name) =>
        Promise.resolve({
          name,
          version: "3.0.0",
          repository: `https://github.com/owner/${name}`,
          source: "pulsar",
        }),
      );

      waitsForPromise(() => panel.checkForUpdates());
      runs(() => {
        expect(pulsarClient.getPackage).toHaveBeenCalledWith("pulsar-only");
        expect(panel.browsePackageCards.map(({ pack }) => pack.name)).toEqual(["pulsar-only"]);
      });
    });

    it("ignores Pulsar packages without a newer version", function () {
      catalogClient.load.andReturn(Promise.resolve({ schemaVersion: 1, packages: [] }));
      pulsarClient.getPackage.andCallFake((name) =>
        Promise.resolve({
          name,
          version: "1.0.0",
          repository: `https://github.com/owner/${name}`,
          source: "pulsar",
        }),
      );

      waitsForPromise(() => panel.checkForUpdates());
      runs(() => {
        expect(panel.pulsarUpdatePackages).toEqual([]);
        expect(panel.browsePackageCards.length).toBe(0);
      });
    });

    it("does not query Pulsar for updates when the toggle is off", function () {
      atom.config.set("settings-view.includePulsarPackageResults", false);
      catalogClient.load.andReturn(Promise.resolve({ schemaVersion: 1, packages: [] }));

      waitsForPromise(() => panel.checkForUpdates());
      runs(() => {
        expect(pulsarClient.getPackage).not.toHaveBeenCalled();
        expect(panel.pulsarUpdatePackages).toEqual([]);
      });
    });
  });

  it("browses all catalog packages matching the active filter", function () {
    panel.catalogPackages = [
      {
        name: "browse-package",
        repository: "owner/browse-package",
        installSource: "owner/browse-package",
      },
      {
        name: "browse-theme",
        repository: "owner/browse-theme",
        installSource: "owner/browse-theme",
        theme: "ui",
      },
    ];

    panel.renderBrowseList();
    expect(panel.browsePackageCards.length).toBe(2);

    panel.setFilterType("themes");
    expect(panel.refs.filterThemesButton).toHaveClass("selected");
    expect(panel.refs.filterAllButton).not.toHaveClass("selected");
    expect(panel.browsePackageCards.length).toBe(1);
    expect(panel.browsePackageCards[0].pack.name).toBe("browse-theme");
  });

  it("hides the browse area while a search query is active", function () {
    panel.catalogPromise = Promise.resolve({ schemaVersion: 1, packages: [] });
    panel.refs.searchEditor.setText("sample");
    panel.performSearch();
    expect(panel.refs.browseArea.style.display).toBe("none");

    panel.refs.searchEditor.setText("");
    panel.performSearch();
    expect(panel.refs.browseArea.style.display).toBe("");
  });

  describe("searching git packages", function () {
    beforeEach(() => {
      return spyOn(panel, "showGitInstallPackageCard").andCallThrough();
    });

    it("shows a git installation card with git specific info for ssh URLs", function () {
      const query = "git@github.com:user/repo.git";
      panel.performSearchForQuery(query);
      const args = panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      expect(args.gitUrlInfo).toBeTruthy();
    });

    it("shows a git installation card with git specific info for https URLs", function () {
      const query = "https://github.com/user/repo.git";
      panel.performSearchForQuery(query);
      const args = panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      expect(args.gitUrlInfo).toBeTruthy();
    });

    it("shows a git installation card with git specific info for shortcut URLs", function () {
      const query = "user/repo";
      panel.performSearchForQuery(query);
      const args = panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      expect(args.gitUrlInfo).toBeTruthy();
    });

    it("keeps a version selector in the install source, not just the repository", function () {
      const query = "asiloisad/pulsar-invert-colors@0.4.0";
      panel.performSearchForQuery(query);
      const args = panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      expect(args.installSource).toEqual(query);
      expect(args.repository).toEqual("asiloisad/pulsar-invert-colors");
    });

    it("doesn't show a git installation card for normal packages", function () {
      const query = "this-package-is-so-normal";
      waitsForPromise(() =>
        panel.performSearchForQuery(query).then(() => {
          expect(panel.showGitInstallPackageCard).not.toHaveBeenCalled();
          expect(panel.refs.searchMessage.textContent).toContain("owner/repo");
        }),
      );
    });

    describe("when a package with the same gitUrlInfo property is installed", function () {
      beforeEach(function () {
        gitUrlInfo = jasmine.createSpy("gitUrlInfo");
        return panel.showGitInstallPackageCard({ gitUrlInfo: gitUrlInfo });
      });

      it("replaces the package card with the newly installed pack object", function () {
        const newPack = { gitUrlInfo: gitUrlInfo };
        spyOn(panel, "updateGitPackageCard");
        packageManager.emitter.emit("package-installed", { pack: newPack });
        expect(panel.updateGitPackageCard).toHaveBeenCalledWith(newPack);
      });
    });
  });
});
