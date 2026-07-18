/** @babel */
/** @jsx etch.dom */

import { TextEditor, CompositeDisposable, Disposable } from "atom";
import etch from "etch";
import CollapsibleSectionPanel from "./collapsible-section-panel";
import SearchSettingView from "./search-setting-view";

const CORE_NAMESPACES = new Set(["core", "editor", "language", "git"]);
const MAX_RESULTS = 100;

export default class SearchSettingsPanel extends CollapsibleSectionPanel {
  constructor(settingsView) {
    super();
    this.settingsView = settingsView;
    this.searchResults = [];
    this.activeFilter = "all";
    this.settingsSchema = atom.config.schema.properties;

    etch.initialize(this);
    this.refs.searchEditor.element.setAttribute("aria-label", "Search settings");
    this.filterButtons = {
      all: this.refs.allFilter,
      core: this.refs.coreFilter,
      editor: this.refs.editorFilter,
      language: this.refs.languageFilter,
      packages: this.refs.packagesFilter,
    };
    for (const [filter, button] of Object.entries(this.filterButtons)) {
      button.dataset.searchFilter = filter;
    }
    this.updateFilterButtons();

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(this.handleEvents());
    this.subscriptions.add(this.handlePanelEvents());
    this.subscriptions.add(
      atom.commands.add(this.element, {
        "core:move-up": () => this.scrollUp(),
        "core:move-down": () => this.scrollDown(),
        "core:page-up": () => this.pageUp(),
        "core:page-down": () => this.pageDown(),
        "core:move-to-top": () => this.scrollToTop(),
        "core:move-to-bottom": () => this.scrollToBottom(),
        "core:cancel": () => this.clearSearch(),
      }),
    );

    this.subscriptions.add(
      this.refs.searchEditor.onDidStopChanging(() => {
        this.matchSettings();
      }),
    );
    this.updateSearchState("initial");
  }

  focus() {
    this.refs.searchEditor.element.focus();
  }

  show() {
    this.element.style.display = "";
  }

  destroy() {
    this.subscriptions.dispose();
    return etch.destroy(this);
  }

  update() {}

  render() {
    return (
      <div className="panels-item search-settings-panel" tabIndex="-1">
        <section className="section">
          <div className="section-container">
            <div className="section-heading icon icon-search">Search Settings</div>
            <p className="search-settings-help text-subtle">
              Find settings by name, description, or configuration key.
            </p>
            <div className="search-settings-input-row">
              <div className="editor-container">
                <TextEditor ref="searchEditor" mini placeholderText="Search settings" />
              </div>
              <button
                ref="clearButton"
                type="button"
                className="btn btn-default icon icon-x search-settings-clear"
                aria-label="Clear settings search"
                title="Clear search"
              />
            </div>

            <div
              ref="filterGroup"
              className="btn-group search-settings-filters"
              role="group"
              aria-label="Filter settings"
            >
              <button ref="allFilter" type="button" className="btn selected">
                All
              </button>
              <button ref="coreFilter" type="button" className="btn">
                Core
              </button>
              <button ref="editorFilter" type="button" className="btn">
                Editor
              </button>
              <button ref="languageFilter" type="button" className="btn">
                Languages
              </button>
              <button ref="packagesFilter" type="button" className="btn">
                Packages
              </button>
            </div>

            <div
              ref="searchStatus"
              className="search-settings-status text-subtle"
              role="status"
              aria-live="polite"
            />

            <section ref="resultsSection" className="sub-section search-results">
              <h3 ref="searchHeader" className="sub-section-heading icon icon-list-unordered">
                Results
              </h3>
              <div ref="searchResults" className="container package-container" role="list" />
            </section>
          </div>
        </section>
      </div>
    );
  }

  handlePanelEvents() {
    const clearHandler = () => this.clearSearch();
    this.refs.clearButton.addEventListener("click", clearHandler);

    const filterHandler = (event) => {
      const button = event.target.closest("[data-search-filter]");
      if (button) this.setFilter(button.dataset.searchFilter);
    };
    this.refs.filterGroup.addEventListener("click", filterHandler);

    return new CompositeDisposable(
      new Disposable(() => this.refs.clearButton.removeEventListener("click", clearHandler)),
      new Disposable(() => this.refs.filterGroup.removeEventListener("click", filterHandler)),
    );
  }

  clearSearch() {
    if (this.refs.searchEditor.getText()) {
      this.refs.searchEditor.setText("");
    }
    this.clearSearchResults();
    this.updateSearchState("initial");
    this.focus();
  }

  setFilter(filter) {
    this.activeFilter = filter;
    this.updateFilterButtons();
    this.matchSettings();
  }

  updateFilterButtons() {
    for (const [filter, button] of Object.entries(this.filterButtons)) {
      const selected = this.activeFilter === filter;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
  }

  matchSettings() {
    this.clearSearchResults();
    const query = this.refs.searchEditor.getText().trim();
    if (!query) {
      this.updateSearchState("initial");
      return;
    }
    this.filterSettings(query);
  }

  clearSearchResults() {
    for (const result of this.searchResults) result.destroy();
    this.searchResults = [];
  }

  filterSettings(text) {
    const { searchTerm, filter } = this.parseQuery(text);
    if (!searchTerm) {
      this.updateSearchState("initial");
      return [];
    }

    const rankedResults = this.collectSettings(this.settingsSchema).filter((setting) => {
      if (filter === "all") return true;
      if (filter === "packages") return !CORE_NAMESPACES.has(setting.namespace);
      return setting.namespace === filter;
    });

    for (const setting of rankedResults) {
      setting.rank = this.generateRanks(
        searchTerm,
        setting.title,
        setting.description,
        setting.namespace,
        setting.path.slice(setting.namespace.length + 1),
      );
    }

    return this.processRanks(rankedResults, searchTerm);
  }

  parseQuery(text) {
    const prefix = /^(core|editor|language|packages):\s*/i.exec(text);
    if (prefix) {
      return {
        searchTerm: text.slice(prefix[0].length).trim(),
        filter: prefix[1].toLowerCase(),
      };
    }
    return { searchTerm: text.trim(), filter: this.activeFilter };
  }

  collectSettings(schemaByNamespace) {
    const results = [];
    for (const namespace of Object.keys(schemaByNamespace || {})) {
      const namespaceSchema = schemaByNamespace[namespace];
      if (!namespaceSchema || namespaceSchema.type !== "object") continue;
      this.collectSchemaProperties(results, namespace, [], namespaceSchema.properties);
    }
    return results;
  }

  collectSchemaProperties(results, namespace, parentSegments, properties) {
    for (const name of Object.keys(properties || {})) {
      const schema = properties[name];
      if (!schema) continue;
      const segments = parentSegments.concat(name);
      const path = [namespace].concat(segments).join(".");

      // This configuration value has no editable representation in Settings.
      if (
        path !== "core.customFileTypes" &&
        !(path === "core.uriHandlerRegistration" && schema.type === "any")
      ) {
        results.push({
          namespace,
          path,
          title: schema.title,
          description: schema.description,
          schema,
        });
      }

      if (schema.type === "object" && schema.properties) {
        this.collectSchemaProperties(results, namespace, segments, schema.properties);
      }
    }
  }

  handleSettingsString(string) {
    return string?.toLowerCase() ?? "";
  }

  generateRanks(searchText, title, description, settingName, settingItem) {
    const candidate = [settingName, settingItem, title].filter(Boolean).join(" ");
    const result = this.getScore(candidate, searchText);
    const descriptionResult = this.getScore(description, searchText);
    const descriptionScore =
      result.score > 0 ? descriptionResult.score * 0.01 : descriptionResult.score * 0.35;

    return {
      totalScore: result.score + descriptionScore,
      matchIndexes: result.matchIndexes,
    };
  }

  processRanks(ranks, query) {
    const minimumScore = atom.config.get("settings-view.searchSettingsMinimumScore");
    const filteredRanks = ranks
      .filter((item) => item.rank.totalScore > minimumScore)
      .sort((a, b) => b.rank.totalScore - a.rank.totalScore);

    const visibleRanks = filteredRanks.slice(0, MAX_RESULTS);
    for (const setting of visibleRanks) {
      const searchView = new SearchSettingView(setting, this.settingsView, query);
      this.refs.searchResults.appendChild(searchView.element);
      this.searchResults.push(searchView);
    }

    if (filteredRanks.length === 0) {
      this.updateSearchState("empty", { query });
    } else {
      this.updateSearchState("results", {
        query,
        visibleCount: visibleRanks.length,
        totalCount: filteredRanks.length,
      });
    }
    return filteredRanks;
  }

  updateSearchState(state, { query = "", visibleCount = 0, totalCount = 0 } = {}) {
    this.refs.resultsSection.style.display = state === "results" ? "" : "none";
    this.refs.clearButton.style.visibility = this.refs.searchEditor.getText()
      ? "visible"
      : "hidden";

    if (state === "initial") {
      this.refs.searchStatus.textContent =
        "Type a setting name, description, or configuration key to begin.";
    } else if (state === "empty") {
      this.refs.searchStatus.textContent = `No settings found for “${query}”. Try fewer words or another category.`;
    } else if (visibleCount < totalCount) {
      this.refs.searchStatus.textContent = `Showing the first ${visibleCount} of ${totalCount} results for “${query}”.`;
    } else {
      this.refs.searchStatus.textContent = `${totalCount} ${totalCount === 1 ? "result" : "results"} for “${query}”.`;
    }
  }

  getScore(candidate, query) {
    if (!candidate || !query) return { score: 0, matchIndexes: [] };
    const result = atom.ui.fuzzyMatcher.match(candidate, query, { recordMatchIndexes: true });
    return result
      ? { score: result.score, matchIndexes: result.matchIndexes }
      : { score: 0, matchIndexes: [] };
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
