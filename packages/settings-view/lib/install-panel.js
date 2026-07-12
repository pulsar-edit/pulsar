/** @babel */
/** @jsx etch.dom */

import path from "path";
import etch from "etch";
import hostedGitInfo from "hosted-git-info";
import semver from "semver";

// eslint-disable-next-line n/no-unpublished-require
const { cloneUrlForRepository, parsePackageSource } = require("../../../src/package-source");

import { CompositeDisposable, Disposable, TextEditor } from "atom";

import PackageCard from "./package-card";
import ErrorView from "./error-view";
import { packageOrigin, getInstalledPackageMetadata } from "./utils";
const { normalizeCatalogSource } = require("./community-package-catalog-client");

const PackageNameRegex = /config\/install\/(?:package|theme):([a-z0-9-_]+)/i;

export default class InstallPanel {
  constructor(settingsView, packageManager) {
    this.settingsView = settingsView;
    this.packageManager = packageManager;
    this.disposables = new CompositeDisposable();
    this.sourceDisposables = new CompositeDisposable();
    this.client = this.packageManager.getClient();
    this.catalogClient = this.packageManager.getCatalogClient();
    this.pulsarClient = this.packageManager.getPulsarClient();
    this.catalogPackages = [];
    this.pulsarUpdatePackages = [];
    this.catalogPackageCards = [];
    this.browsePackageCards = [];
    this.catalogFetched = false;
    this.sourceEditors = [];
    this.filterType = "all";
    this.atomIoURL = "https://github.com";

    etch.initialize(this);

    this.refs.searchMessage.style.display = "none";

    this.refs.searchEditor.setPlaceholderText("Search community packages or enter owner/repo");
    this.refs.catalogEditor.setPlaceholderText("owner/catalog, index URL, or local catalog path");

    this.disposables.add(atom.tooltips.add(this.refs.addCatalogButton, { title: "Add catalog" }));
    this.disposables.add(
      atom.tooltips.add(this.refs.checkUpdatesButton, { title: "Check for Updates" }),
    );
    this.disposables.add(
      this.packageManager.on("package-install-failed", ({ error }) => {
        this.refs.searchErrors.appendChild(new ErrorView(this.packageManager, error).element);
      }),
    );
    this.disposables.add(
      this.packageManager.on("package-installed theme-installed", ({ pack }) => {
        const gitUrlInfo =
          this.currentGitPackageCard &&
          this.currentGitPackageCard.pack &&
          this.currentGitPackageCard.pack.gitUrlInfo
            ? this.currentGitPackageCard.pack.gitUrlInfo
            : null;

        const sourceMatches =
          this.currentGitPackageCard &&
          this.currentGitPackageCard.pack &&
          (this.currentGitPackageCard.pack.name ===
            (pack.apmInstallSource && pack.apmInstallSource.source) ||
            this.currentGitPackageCard.pack.repository ===
              (pack.apmInstallSource && pack.apmInstallSource.repository));
        if ((gitUrlInfo && gitUrlInfo === pack.gitUrlInfo) || sourceMatches) {
          this.updateGitPackageCard(pack);
        }
      }),
    );
    const searchBuffer = this.refs.searchEditor.getBuffer();
    searchBuffer.debouncedEmitDidStopChangingEvent = ((timer) => () => {
      clearTimeout(timer);
      timer = setTimeout(searchBuffer.emitDidStopChangingEvent.bind(searchBuffer), 700);
    })();
    // TODO remove hack to extend stop changing delay
    this.disposables.add(
      this.refs.searchEditor.onDidStopChanging(() => {
        this.performSearch();
      }),
    );
    this.disposables.add(
      atom.commands.add(this.refs.searchEditor.element, "core:confirm", () => {
        this.performSearch();
      }),
    );
    this.disposables.add(
      atom.commands.add(this.refs.catalogEditor.element, "core:confirm", () => {
        this.didClickAddCatalog();
      }),
    );
    this.disposables.add(
      atom.commands.add(this.element, {
        "core:move-up": () => {
          this.scrollUp();
        },
        "core:move-down": () => {
          this.scrollDown();
        },
        "core:page-up": () => {
          this.pageUp();
        },
        "core:page-down": () => {
          this.pageDown();
        },
        "core:move-to-top": () => {
          this.scrollToTop();
        },
        "core:move-to-bottom": () => {
          this.scrollToBottom();
        },
      }),
    );
    this.disposables.add(
      atom.config.onDidChange("settings-view.communityPackageCatalogs", () => {
        this.renderCatalogSources();
        // Sources changed — re-fetch on the next search instead of reusing the
        // data fetched from the old source list.
        this.catalogFetched = false;
      }),
    );
    this.disposables.add(
      atom.config.observe("settings-view.includePulsarPackageResults", (include) => {
        this.refs.includePulsarCheckbox.checked = !!include;
      }),
    );

    this.renderCatalogSources();
    // Nothing is loaded on open: the catalogs are fetched on the first search
    // (or when the user clicks Fetch), never just from opening the tab.
    this.catalogPromise = Promise.resolve({ schemaVersion: 1, packages: [] });
  }

  didToggleIncludePulsar() {
    atom.config.set(
      "settings-view.includePulsarPackageResults",
      this.refs.includePulsarCheckbox.checked,
    );
    this.performSearch();
  }

  destroy() {
    this.clearSourceEditors();
    this.sourceDisposables.dispose();
    this.clearPackageCards(this.catalogPackageCards);
    this.clearPackageCards(this.browsePackageCards);
    if (this.currentGitPackageCard) this.currentGitPackageCard.destroy();
    this.disposables.dispose();
    return etch.destroy(this);
  }

  update() {}

  focus() {
    this.refs.searchEditor.element.focus();
  }

  show() {
    this.element.style.display = "";
  }

  render() {
    return (
      <div className="panels-item" tabIndex="-1">
        <div className="section packages">
          <div className="section-container">
            <h1 ref="installHeading" className="section-heading icon icon-plus">
              Install Packages
            </h1>

            <div className="text native-key-bindings" tabIndex="-1">
              <span className="icon icon-question" />
              <span ref="publishedToText">
                Packages are installed from Git repositories such as{" "}
              </span>
              <a className="link" onclick={this.didClickOpenAtomIo.bind(this)}>
                GitHub
              </a>
              <span> and are installed to {path.join(process.env.ATOM_HOME, "packages")}</span>
            </div>

            <div className="sub-section catalog-sources">
              <h3 className="sub-section-heading icon icon-repo">Catalog Sources</h3>
              <div ref="catalogSourcesList" className="catalog-sources-list" />
              <div className="catalog-source catalog-source-add">
                <div className="editor-container">
                  <TextEditor mini ref="catalogEditor" />
                </div>
                <button
                  ref="addCatalogButton"
                  className="btn icon icon-plus catalog-source-button"
                  aria-label="Add catalog"
                  onclick={this.didClickAddCatalog.bind(this)}
                />
              </div>
              <div className="catalog-source-actions">
                <div className="btn-group">
                  <button
                    ref="fetchButton"
                    className="btn icon icon-sync"
                    onclick={this.didClickFetch.bind(this)}
                  >
                    Fetch
                  </button>
                  <button
                    ref="restoreDefaultsButton"
                    className="btn icon icon-history"
                    onclick={this.didClickRestoreDefaults.bind(this)}
                  >
                    Restore Defaults
                  </button>
                </div>
                <label className="pulsar-toggle">
                  <input
                    ref="includePulsarCheckbox"
                    className="input-checkbox"
                    type="checkbox"
                    onchange={this.didToggleIncludePulsar.bind(this)}
                  />
                  <span>Include results from the Pulsar package registry</span>
                </label>
              </div>
              <div ref="catalogFetchErrors" />
              <div
                ref="catalogSourceError"
                className="alert alert-danger alert-dismissable"
                style={{ display: "none" }}
              >
                <button
                  ref="catalogSourceErrorClose"
                  className="close icon icon-x"
                  onclick={() => this.hideCatalogSourceError()}
                />
                <span ref="catalogSourceErrorMessage" />
              </div>
            </div>
          </div>
        </div>

        <div className="section packages">
          <div className="section-container">
            <h1 ref="browseHeading" className="section-heading icon icon-star">
              Community Packages
            </h1>

            <div className="search-container clearfix">
              <div className="editor-container">
                <TextEditor mini ref="searchEditor" />
              </div>
              <div className="btn-group">
                <button
                  ref="filterAllButton"
                  className="btn btn-default selected"
                  onclick={() => this.setFilterType("all")}
                >
                  All
                </button>
                <button
                  ref="filterPackagesButton"
                  className="btn btn-default"
                  onclick={() => this.setFilterType("packages")}
                >
                  Packages
                </button>
                <button
                  ref="filterThemesButton"
                  className="btn btn-default"
                  onclick={() => this.setFilterType("themes")}
                >
                  Themes
                </button>
                <button
                  ref="filterUpdatesButton"
                  className="btn btn-default"
                  onclick={() => this.setFilterType("updates")}
                >
                  Updates
                </button>
              </div>
              <button
                ref="checkUpdatesButton"
                className="btn icon icon-squirrel check-updates-button"
                aria-label="Check for Updates"
                onclick={this.checkForUpdates.bind(this)}
              />
            </div>

            <div ref="searchErrors" />
            <div ref="searchMessage" className="alert alert-info search-message icon icon-search" />
            <div ref="resultsContainer" className="container package-container" />

            <div ref="browseArea" className="browse-area">
              <div ref="browseContainer" className="container package-container" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  beforeShow(options) {
    if (options && options.uri) {
      if (/config\/install\/check-updates\b/.test(options.uri)) {
        this.checkForUpdates();
        return;
      }
      const query = this.extractQueryFromURI(options.uri);
      if (query != null) {
        this.refs.searchEditor.setText(query);
        this.performSearch();
      }
    }
  }

  extractQueryFromURI(uri) {
    const matches = PackageNameRegex.exec(uri);
    if (matches) {
      return matches[1];
    } else {
      return null;
    }
  }

  setFilterType(filterType) {
    this.filterType = filterType;
    const buttons = {
      all: this.refs.filterAllButton,
      packages: this.refs.filterPackagesButton,
      themes: this.refs.filterThemesButton,
      updates: this.refs.filterUpdatesButton,
    };
    for (const [type, button] of Object.entries(buttons)) {
      button.classList.toggle("selected", type === filterType);
    }
    this.renderBrowseList();
    this.performSearch();
  }

  matchesFilter(pack) {
    if (this.filterType === "themes") return !!pack.theme;
    if (this.filterType === "packages") return !pack.theme;
    if (this.filterType === "updates") return this.hasNewerVersionInstalled(pack);
    return true;
  }

  getInstalledMetadata(name) {
    return getInstalledPackageMetadata(name);
  }

  // True when the same package (by origin) is installed and the catalog
  // describes a newer version.
  hasNewerVersionInstalled(pack) {
    if (!pack.version || !pack.repository) return false;
    if (!this.packageManager.isPackageInstalled(pack.name)) return false;
    const metadata = this.getInstalledMetadata(pack.name);
    if (!metadata) return false;
    const origin = packageOrigin(pack);
    const installedOrigin = packageOrigin(metadata);
    if (!origin || origin !== installedOrigin) return false;
    return (
      semver.valid(metadata.version) &&
      semver.valid(pack.version) &&
      semver.gt(pack.version, metadata.version)
    );
  }

  performSearch() {
    // Git refs, and paths on some Git servers, are case-sensitive.
    const query = this.refs.searchEditor.getText().trim();
    if (query) {
      // Download the catalogs on the first search if the user never clicked
      // Fetch — otherwise a search would only surface live Pulsar results and
      // silently miss the community catalogs.
      if (!this.catalogFetched && this.getCatalogSources().length) {
        this.catalogPromise = this.loadCatalog();
      }
      this.refs.browseArea.style.display = "none";
      this.performSearchForQuery(query);
    } else {
      this.clearSearchResults();
      this.refs.browseArea.style.display = "";
    }
  }

  performSearchForQuery(query) {
    try {
      const parsed = parsePackageSource(query);
      cloneUrlForRepository(parsed.repository);
      const gitUrlInfo = hostedGitInfo.fromUrl(parsed.repository);
      return this.showGitInstallPackageCard({
        name: query,
        // The typed query is the exact source to install — it may carry a
        // selector (e.g. "owner/repo@0.4.0"), which the bare `repository` drops.
        installSource: parsed.source,
        repository: parsed.repository,
        gitUrlInfo: gitUrlInfo && gitUrlInfo.type === "github" ? gitUrlInfo : null,
      });
    } catch {
      return this.searchCatalog(query);
    }
  }

  clearSearchResults() {
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy();
      this.currentGitPackageCard = null;
    }
    this.clearPackageCards(this.catalogPackageCards);
    this.refs.resultsContainer.innerHTML = "";
    this.refs.searchMessage.style.display = "none";
  }

  showGitHubOnlyMessage(_query) {
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy();
      this.currentGitPackageCard = null;
    }

    this.refs.resultsContainer.innerHTML = "";
    this.clearPackageCards(this.catalogPackageCards);
    this.refs.searchMessage.textContent = `No community packages match “${_query}”. You can also enter owner/repo directly.`;
    this.refs.searchMessage.style.display = "";
  }

  showGitInstallPackageCard(pack) {
    this.clearPackageCards(this.catalogPackageCards);
    this.refs.searchMessage.style.display = "none";
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy();
    }

    this.currentGitPackageCard = this.getPackageCardView(pack);
    this.currentGitPackageCard.displayGitPackageInstallInformation();
    this.replaceCurrentGitPackageCardView();
  }

  updateGitPackageCard(pack) {
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy();
    }

    this.currentGitPackageCard = this.getPackageCardView(pack);
    this.replaceCurrentGitPackageCardView();
  }

  replaceCurrentGitPackageCardView() {
    this.clearPackageCards(this.catalogPackageCards);
    this.refs.resultsContainer.innerHTML = "";
    this.addPackageCardView(this.refs.resultsContainer, this.currentGitPackageCard);
  }

  async search(query) {
    return this.searchCatalog(query);
  }

  addPackageViews(container, packages) {
    for (const pack of packages) {
      this.addPackageCardView(container, this.getPackageCardView(pack));
    }
  }

  addPackageCardView(container, packageCard) {
    const packageRow = document.createElement("div");
    packageRow.classList.add("row");
    packageRow.appendChild(packageCard.element);
    container.appendChild(packageRow);
  }

  getPackageCardView(pack) {
    return new PackageCard(pack, this.settingsView, this.packageManager, { back: "Install" });
  }

  async loadCatalog({ refresh = false, cacheOnly = false } = {}) {
    // A non-cache load hits the network — mark the catalogs as fetched so the
    // first search doesn't trigger a redundant auto-fetch.
    if (!cacheOnly) this.catalogFetched = true;
    const generation = (this.catalogGeneration = (this.catalogGeneration || 0) + 1);
    const sources = this.getCatalogSources();
    this.clearPackageCards(this.browsePackageCards);
    this.refs.browseContainer.innerHTML = "";
    this.refs.catalogFetchErrors.innerHTML = "";

    const loaded = await Promise.all(
      sources.map(async (source) => {
        try {
          return {
            source,
            catalog: await this.catalogClient.load(source, { refresh, cacheOnly }),
          };
        } catch (error) {
          return { source, error };
        }
      }),
    );
    if (generation !== this.catalogGeneration) return { packages: this.catalogPackages };

    // Packages are deduplicated by repository, so the same name published from
    // different repositories is kept; earlier catalogs win on identical repos.
    const origins = new Set();
    this.catalogPackages = [];
    for (const result of loaded) {
      if (result.error) {
        const error = new Error(`${result.source}: ${result.error.message}`);
        error.stderr = result.error.stderr;
        this.refs.catalogFetchErrors.appendChild(new ErrorView(this.packageManager, error).element);
        continue;
      }
      if (!result.catalog) continue;
      for (const pack of result.catalog.packages) {
        const key = packageOrigin(pack);
        if (key && origins.has(key)) continue;
        if (key) origins.add(key);
        this.catalogPackages.push(pack);
      }
    }

    this.renderBrowseList();
    return { schemaVersion: 1, packages: this.catalogPackages };
  }

  renderBrowseList() {
    this.clearPackageCards(this.browsePackageCards);
    this.refs.browseContainer.innerHTML = "";

    // Pulsar update results (gathered by the Check for Updates action) are
    // merged into the Updates list, deduplicated against the catalogs by repo.
    const extra = this.filterType === "updates" ? this.pulsarUpdatePackages : [];
    const origins = new Set();
    const packages = [...this.catalogPackages, ...extra]
      .filter((pack) => this.matchesFilter(pack))
      .filter((pack) => {
        const key = packageOrigin(pack);
        if (key && origins.has(key)) return false;
        if (key) origins.add(key);
        return true;
      })
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name) ||
          packageOrigin(left).localeCompare(packageOrigin(right)),
      );
    for (const pack of packages) {
      const card = this.getPackageCardView(pack);
      this.browsePackageCards.push(card);
      this.addPackageCardView(this.refs.browseContainer, card);
    }
  }

  isPulsarSearchEnabled() {
    return atom.config.get("settings-view.includePulsarPackageResults") === true;
  }

  // Scores a package against the query by name and keywords only. Descriptions
  // are deliberately excluded: fuzzy-matching prose produced noisy hits (e.g.
  // "ui" matching a syntax theme whose description mentions "Seti UI").
  scorePackage(pack, query) {
    const name = pack.name.toLowerCase();
    if (name === query) return 1000;
    if (name.startsWith(query)) return 800;
    if (name.includes(query)) return 600;

    const keywords = (pack.keywords || []).map((keyword) => keyword.toLowerCase());
    if (keywords.includes(query)) return 400;
    if (keywords.some((keyword) => keyword.includes(query))) return 300;

    // Typo-tolerant fallback on the name only.
    return (atom.ui.fuzzyMatcher.score(name, query) || 0) > 0 ? 100 : 0;
  }

  scoreCatalog(query) {
    const normalizedQuery = query.trim().toLowerCase();
    return this.catalogPackages
      .filter((pack) => this.matchesFilter(pack))
      .map((pack) => ({ pack, score: this.scorePackage(pack, normalizedQuery) }))
      .filter(({ score }) => score > 0)
      .sort(
        (left, right) => right.score - left.score || left.pack.name.localeCompare(right.pack.name),
      )
      .slice(0, 25)
      .map(({ pack }) => pack);
  }

  addResultCard(pack, origins, results) {
    const key = packageOrigin(pack);
    if (key && origins.has(key)) return;
    if (key) origins.add(key);
    results.push(pack);
    const card = this.getPackageCardView(pack);
    this.catalogPackageCards.push(card);
    this.addPackageCardView(this.refs.resultsContainer, card);
  }

  clearPulsarError() {
    if (this.pulsarErrorElement) {
      this.pulsarErrorElement.remove();
      this.pulsarErrorElement = null;
    }
  }

  async searchCatalog(query) {
    const generation = (this.searchGeneration = (this.searchGeneration || 0) + 1);
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy();
      this.currentGitPackageCard = null;
    }
    this.clearPackageCards(this.catalogPackageCards);
    this.refs.resultsContainer.innerHTML = "";
    this.refs.searchMessage.style.display = "none";
    this.clearPulsarError();

    await this.catalogPromise;
    if (generation !== this.searchGeneration) return [];

    // Local community catalog results first, deduplicated by repository.
    const origins = new Set();
    const results = [];
    for (const pack of this.scoreCatalog(query)) {
      this.addResultCard(pack, origins, results);
    }

    // Opt-in live search of the Pulsar registry, appended and deduped by repo.
    if (this.isPulsarSearchEnabled()) {
      let pulsarResults = [];
      try {
        pulsarResults = await this.pulsarClient.search(query);
      } catch (error) {
        if (generation === this.searchGeneration) {
          this.pulsarErrorElement = new ErrorView(
            this.packageManager,
            new Error(`Pulsar registry: ${error.message}`),
          ).element;
          this.refs.searchErrors.appendChild(this.pulsarErrorElement);
        }
      }
      if (generation !== this.searchGeneration) return results;
      for (const pack of pulsarResults) {
        if (this.matchesFilter(pack)) this.addResultCard(pack, origins, results);
      }
    }

    if (results.length === 0) {
      this.showGitHubOnlyMessage(query);
      return [];
    }
    return results;
  }

  clearPackageCards(cards) {
    while (cards.length) cards.pop().destroy();
  }

  getCatalogSources() {
    const sources = atom.config.get("settings-view.communityPackageCatalogs");
    return Array.isArray(sources)
      ? sources.filter((source) => typeof source === "string" && source.trim())
      : [];
  }

  clearSourceEditors() {
    this.sourceDisposables.dispose();
    this.sourceDisposables = new CompositeDisposable();
    while (this.sourceEditors.length) this.sourceEditors.pop().destroy();
  }

  showCatalogSourceError(message) {
    this.refs.catalogSourceErrorMessage.textContent = message;
    this.refs.catalogSourceError.style.display = "";
  }

  hideCatalogSourceError() {
    this.refs.catalogSourceError.style.display = "none";
  }

  renderCatalogSources() {
    this.clearSourceEditors();
    this.refs.catalogSourcesList.innerHTML = "";
    this.hideCatalogSourceError();
    this.getCatalogSources().forEach((source, index) => {
      const row = document.createElement("div");
      row.className = "catalog-source";

      const editorContainer = document.createElement("div");
      editorContainer.className = "editor-container";
      const editor = new TextEditor({ mini: true });
      editor.setText(source);
      editorContainer.appendChild(editor.element);
      this.sourceEditors.push(editor);

      const commit = () => {
        const value = editor.getText().trim();
        if (value !== source) this.updateCatalogSource(index, value);
      };
      this.sourceDisposables.add(atom.commands.add(editor.element, "core:confirm", commit));
      editor.element.addEventListener("blur", commit);
      this.sourceDisposables.add(
        new Disposable(() => editor.element.removeEventListener("blur", commit)),
      );

      const removeButton = document.createElement("button");
      removeButton.className = "btn icon icon-x catalog-source-button";
      removeButton.setAttribute("aria-label", "Remove catalog");
      removeButton.onclick = () => this.removeCatalogSource(index);
      this.sourceDisposables.add(atom.tooltips.add(removeButton, { title: "Remove catalog" }));

      row.appendChild(editorContainer);
      row.appendChild(removeButton);
      this.refs.catalogSourcesList.appendChild(row);
    });
  }

  didClickAddCatalog() {
    const source = this.refs.catalogEditor.getText().trim();
    try {
      const normalized = normalizeCatalogSource(source);
      const sources = this.getCatalogSources();
      if (sources.some((existing) => normalizeCatalogSource(existing) === normalized)) {
        throw new Error("That catalog is already configured.");
      }
      atom.config.set("settings-view.communityPackageCatalogs", [...sources, source]);
      this.refs.catalogEditor.setText("");
    } catch (error) {
      this.showCatalogSourceError(error.message);
    }
  }

  didClickFetch() {
    this.catalogPromise = this.loadCatalog({ refresh: true });
  }

  // Looks for updates to installed packages: refreshes the community catalogs
  // and, independently, asks the Pulsar registry for the latest version of each
  // installed package. Results are shown under the Updates filter.
  async checkForUpdates() {
    const button = this.refs.checkUpdatesButton;
    // A re-entrancy flag rather than button.disabled: disabling the just-clicked
    // button blurs it, which yanks focus out of the settings panel to <body>.
    if (this.checkingForUpdates) return;
    this.checkingForUpdates = true;
    button.classList.add("is-checking");

    // Clear any active query so the Updates browse list is what's shown.
    this.refs.searchEditor.setText("");
    this.setFilterType("updates");

    try {
      if (this.getCatalogSources().length) {
        this.catalogPromise = this.loadCatalog({ refresh: true });
        await this.catalogPromise;
      }
      await this.loadPulsarUpdates();
      this.renderBrowseList();
    } finally {
      this.checkingForUpdates = false;
      button.classList.remove("is-checking");
    }
  }

  // Queries the Pulsar registry for the latest version of each installed
  // package and keeps those whose installed origin matches and has a newer
  // release. Gated on the "Include Pulsar results" toggle, so the tick fully
  // controls whether the registry is consulted.
  async loadPulsarUpdates() {
    const generation = (this.pulsarUpdateGeneration = (this.pulsarUpdateGeneration || 0) + 1);
    this.pulsarUpdatePackages = [];
    if (!this.isPulsarSearchEnabled()) return;
    const installed = this.packageManager.getLocalPackages().git;
    const packs = await Promise.all(
      installed.map((pack) => this.pulsarClient.getPackage(pack.name).catch(() => null)),
    );
    if (generation !== this.pulsarUpdateGeneration) return;
    this.pulsarUpdatePackages = packs.filter((pack) => pack && this.hasNewerVersionInstalled(pack));
  }

  didClickRestoreDefaults() {
    atom.config.unset("settings-view.communityPackageCatalogs");
    this.renderCatalogSources();
  }

  removeCatalogSource(index) {
    const sources = this.getCatalogSources();
    atom.config.set(
      "settings-view.communityPackageCatalogs",
      sources.filter((_source, sourceIndex) => sourceIndex !== index),
    );
  }

  updateCatalogSource(index, source) {
    const value = source.trim();
    try {
      const normalized = normalizeCatalogSource(value);
      const sources = this.getCatalogSources();
      if (
        sources.some(
          (existing, sourceIndex) =>
            sourceIndex !== index && normalizeCatalogSource(existing) === normalized,
        )
      ) {
        throw new Error("That catalog is already configured.");
      }
      const updated = [...sources];
      updated[index] = value;
      atom.config.set("settings-view.communityPackageCatalogs", updated);
    } catch (error) {
      this.renderCatalogSources();
      this.showCatalogSourceError(error.message);
    }
  }

  didClickOpenAtomIo(event) {
    event.preventDefault();
    atom.openExternal(this.atomIoURL);
  }

  scrollUp() {
    this.element.scrollTop -= document.body.offsetHeight / 20;
  }

  scrollDown() {
    this.element.scrollTop += document.body.offsetHeight / 20;
  }

  pageUp() {
    this.element.scrollTop -= this.element.offsetHeight;
  }

  pageDown() {
    this.element.scrollTop += this.element.offsetHeight;
  }

  scrollToTop() {
    this.element.scrollTop = 0;
  }

  scrollToBottom() {
    this.element.scrollTop = this.element.scrollHeight;
  }
}
