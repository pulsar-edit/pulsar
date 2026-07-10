const { CompositeDisposable } = require("atom");
const ResultsView = require("./results-view");
const ResultsModel = require("./results-model");
const { showIf, getSearchResultsMessage, escapeHtml } = require("./util");
const etch = require("etch");
const $ = etch.dom;

module.exports = class ResultsPaneView {
  constructor() {
    this.model = ResultsPaneView.projectFindView.model;
    this.model.setActive(true);
    this.isLoading = false;
    this.searchErrors = [];
    this.searchResults = null;
    this.searchingIsSlow = false;
    this.numberOfPathsSearched = 0;
    this.searchContextLineCountBefore = 0;
    this.searchContextLineCountAfter = 0;
    this.collapseNewResults = false;
    this.uri = ResultsPaneView.URI;

    etch.initialize(this);

    this.onFinishedSearching(this.model.getResultsSummary());
    this.element.addEventListener("focus", this.focused.bind(this));
    this.element.addEventListener("click", (event) => {
      switch (event.target) {
        case this.refs.collapseAll:
          this.collapseAllResults();
          break;
        case this.refs.expandAll:
          this.expandAllResults();
          break;
        case this.refs.decrementLeadingContextLines:
          this.decrementLeadingContextLines();
          break;
        case this.refs.toggleLeadingContextLines:
          this.toggleLeadingContextLines();
          break;
        case this.refs.incrementLeadingContextLines:
          this.incrementLeadingContextLines();
          break;
        case this.refs.decrementTrailingContextLines:
          this.decrementTrailingContextLines();
          break;
        case this.refs.toggleTrailingContextLines:
          this.toggleTrailingContextLines();
          break;
        case this.refs.incrementTrailingContextLines:
          this.incrementTrailingContextLines();
          break;
        case this.refs.sortByFile:
          this.sortByFile();
          break;
        case this.refs.dontOverrideTab:
          this.dontOverrideTab();
          break;
      }
    });

    this.subscriptions = new CompositeDisposable(
      this.model.onDidStartSearching(this.onSearch.bind(this)),
      this.model.onDidFinishSearching(this.onFinishedSearching.bind(this)),
      this.model.onDidClear(this.onCleared.bind(this)),
      this.model.onDidClearReplacementState(this.onReplacementStateCleared.bind(this)),
      this.model.onDidSearchPaths(this.onPathsSearched.bind(this)),
      this.model.onDidErrorForPath((error) => this.appendError(error.message)),
      atom.config.observe(
        "search-panel.searchContextLineCountBefore",
        this.searchContextLineCountChanged.bind(this),
      ),
      atom.config.observe(
        "search-panel.searchContextLineCountAfter",
        this.searchContextLineCountChanged.bind(this),
      ),
    );
  }

  update() {}

  destroy() {
    if (this.searchingSlowTimeout) {
      clearTimeout(this.searchingSlowTimeout);
      this.searchingSlowTimeout = null;
    }
    this.model.setActive(false);
    this.subscriptions.dispose();
    if (this.separatePane) {
      this.model = null;
    }
  }

  render() {
    const matchCount = this.searchResults && this.searchResults.matchCount;

    return $.div(
      {
        tabIndex: -1,
        className: `preview-pane pane-item ${matchCount === 0 ? "no-results" : ""}`,
      },

      $.div(
        { className: "preview-header" },
        $.span({
          ref: "previewCount",
          className: "preview-count inline-block",
          innerHTML: this.isLoading
            ? "Searching..."
            : getSearchResultsMessage(this.searchResults) || "Project search results",
        }),

        $.div(
          { className: "preview-controls" },

          $.div(
            {
              ref: "contextControls",
              className: "context-controls",
              style: { display: this.isLoading || matchCount > 0 ? "" : "none" },
            },

            this.searchContextLineCountBefore > 0
              ? $.div(
                  { className: "btn-group" },
                  $.button(
                    {
                      ref: "decrementLeadingContextLines",
                      className:
                        "btn" +
                        (this.model && this.model.getFindOptions().leadingContextLineCount === 0
                          ? " disabled"
                          : ""),
                    },
                    "-",
                  ),
                  $.button(
                    {
                      ref: "toggleLeadingContextLines",
                      className: "btn",
                    },
                    $.svg({
                      className: "icon",
                      innerHTML: '<use xlink:href="#search-panel-context-lines-before" />',
                    }),
                  ),
                  $.button(
                    {
                      ref: "incrementLeadingContextLines",
                      className:
                        "btn" +
                        (this.model &&
                        this.model.getFindOptions().leadingContextLineCount >=
                          this.searchContextLineCountBefore
                          ? " disabled"
                          : ""),
                    },
                    "+",
                  ),
                )
              : null,

            this.searchContextLineCountAfter > 0
              ? $.div(
                  { className: "btn-group" },
                  $.button(
                    {
                      ref: "decrementTrailingContextLines",
                      className:
                        "btn" +
                        (this.model && this.model.getFindOptions().trailingContextLineCount === 0
                          ? " disabled"
                          : ""),
                    },
                    "-",
                  ),
                  $.button(
                    {
                      ref: "toggleTrailingContextLines",
                      className: "btn",
                    },
                    $.svg({
                      className: "icon",
                      innerHTML: '<use xlink:href="#search-panel-context-lines-after" />',
                    }),
                  ),
                  $.button(
                    {
                      ref: "incrementTrailingContextLines",
                      className:
                        "btn" +
                        (this.model.getFindOptions().trailingContextLineCount >=
                        this.searchContextLineCountAfter
                          ? " disabled"
                          : ""),
                    },
                    "+",
                  ),
                )
              : null,
          ),

          $.div(
            { className: "btn-group" },
            $.button(
              {
                ref: "collapseAll",
                className: "btn" + (this.collapseNewResults ? " selected" : ""),
              },
              "Collapse All",
            ),
            $.button(
              {
                ref: "expandAll",
                className: "btn" + (!this.collapseNewResults ? " selected" : ""),
              },
              "Expand All",
            ),
          ),
          $.div(
            { className: "block" },
            $.button(
              {
                ref: "sortByFile",
                className: "btn",
              },
              "Sort by File",
            ),
          ),
          $.div(
            { className: "block" },
            $.button(
              {
                ref: "dontOverrideTab",
                className: "btn",
              },
              "Don't override this tab",
            ),
          ),
        ),

        $.div(
          { className: "inline-block", style: showIf(this.isLoading) },
          $.div({ className: "loading loading-spinner-tiny inline-block" }),

          $.div(
            {
              className: "inline-block",
              style: showIf(this.isLoading && this.searchingIsSlow),
            },

            $.span({}, this.getSearchProgressText()),
          ),
        ),
      ),

      $.ul(
        {
          ref: "errorList",
          className: "error-list list-group padded",
          style: showIf(this.searchErrors.length > 0),
        },

        ...this.searchErrors.map((message) =>
          $.li({ className: "text-error" }, escapeHtml(message)),
        ),
      ),

      etch.dom(ResultsView, {
        ref: "resultsView",
        model: this.model,
        collapseNewResults: this.collapseNewResults,
      }),

      $.ul(
        {
          className: "centered background-message no-results-overlay",
          style: showIf(matchCount === 0),
        },
        $.li({}, "No Results"),
      ),
    );
  }

  copy() {
    return new ResultsPaneView();
  }

  getTitle() {
    return "Project Find Results";
  }

  getIconName() {
    return "search";
  }

  getURI() {
    return this.uri;
  }

  focused() {
    this.refs.resultsView.element.focus();
  }

  appendError(message) {
    this.searchErrors.push(message);
    etch.update(this);
  }

  onSearch(searchPromise) {
    this.isLoading = true;
    this.searchingIsSlow = false;
    this.numberOfPathsSearched = 0;

    // Track current search to ignore stopLoading from cancelled searches
    const searchId = (this.currentSearchId = (this.currentSearchId || 0) + 1);

    // Clear any existing timeout from previous search
    if (this.searchingSlowTimeout) {
      clearTimeout(this.searchingSlowTimeout);
    }

    this.searchingSlowTimeout = setTimeout(() => {
      if (this.currentSearchId === searchId) {
        this.searchingIsSlow = true;
        etch.update(this);
      }
    }, 500);

    etch.update(this);

    let stopLoading = () => {
      // Only stop loading if this is still the current search
      if (this.currentSearchId !== searchId) {
        return;
      }
      this.isLoading = false;
      if (this.searchingSlowTimeout) {
        clearTimeout(this.searchingSlowTimeout);
        this.searchingSlowTimeout = null;
      }
      etch.update(this);
    };
    return searchPromise.then(stopLoading, stopLoading);
  }

  onPathsSearched(numberOfPathsSearched) {
    this.numberOfPathsSearched = numberOfPathsSearched;
    etch.update(this);
  }

  getSearchProgressText() {
    const fileCount = this.model.getPathCount();
    const matchCount = this.model.getMatchCount();
    const useRipgrep = atom.config.get("search-panel.useRipgrep");

    if (useRipgrep) {
      // Ripgrep: "X files with Y matches"
      return `${fileCount} files with ${matchCount} matches`;
    } else {
      // Scandal: "X files with Y matches of Z files"
      return `${fileCount} files with ${matchCount} matches of ${this.numberOfPathsSearched} files`;
    }
  }

  onFinishedSearching(results) {
    this.searchResults = results;
    if (results.searchErrors || results.replacementErrors) {
      this.searchErrors = (results.replacementErrors || [])
        .map((e) => e.message)
        .concat((results.searchErrors || []).map((e) => e.message));
    } else {
      this.searchErrors = [];
    }
    etch.update(this);
  }

  onReplacementStateCleared(results) {
    this.searchResults = results;
    this.searchErrors = [];
    etch.update(this);
  }

  onCleared() {
    this.isLoading = false;
    this.searchErrors = [];
    this.searchResults = {};
    this.searchingIsSlow = false;
    this.numberOfPathsSearched = 0;
    etch.update(this);
  }

  collapseAllResults() {
    this.collapseNewResults = true;
    this.refs.resultsView.setCollapseNewResults(true);
    this.refs.resultsView.collapseAllResults();
    this.refs.resultsView.element.focus();
    etch.update(this);
  }

  expandAllResults() {
    this.collapseNewResults = false;
    this.refs.resultsView.setCollapseNewResults(false);
    this.refs.resultsView.expandAllResults();
    this.refs.resultsView.element.focus();
    etch.update(this);
  }

  decrementLeadingContextLines() {
    this.refs.resultsView.decrementLeadingContextLines();
    etch.update(this);
  }

  toggleLeadingContextLines() {
    this.refs.resultsView.toggleLeadingContextLines();
    etch.update(this);
  }

  incrementLeadingContextLines() {
    this.refs.resultsView.incrementLeadingContextLines();
    etch.update(this);
  }

  decrementTrailingContextLines() {
    this.refs.resultsView.decrementTrailingContextLines();
    etch.update(this);
  }

  toggleTrailingContextLines() {
    this.refs.resultsView.toggleTrailingContextLines();
    etch.update(this);
  }

  incrementTrailingContextLines() {
    this.refs.resultsView.incrementTrailingContextLines();
    etch.update(this);
  }

  searchContextLineCountChanged() {
    this.searchContextLineCountBefore = atom.config.get(
      "search-panel.searchContextLineCountBefore",
    );
    this.searchContextLineCountAfter = atom.config.get("search-panel.searchContextLineCountAfter");
    // update the visible line count in the find options to not exceed the maximum available lines
    let findOptionsChanged = false;
    if (this.searchContextLineCountBefore < this.model.getFindOptions().leadingContextLineCount) {
      this.model.getFindOptions().leadingContextLineCount = this.searchContextLineCountBefore;
      findOptionsChanged = true;
    }
    if (this.searchContextLineCountAfter < this.model.getFindOptions().trailingContextLineCount) {
      this.model.getFindOptions().trailingContextLineCount = this.searchContextLineCountAfter;
      findOptionsChanged = true;
    }
    etch.update(this);
    if (findOptionsChanged) {
      etch.update(this.refs.resultsView);
    }
  }

  sortByFile() {
    this.refs.resultsView.sortByFile();
    this.refs.resultsView.element.focus();
  }

  dontOverrideTab() {
    let view = ResultsPaneView.projectFindView;

    if (this.separatePane) {
      // Re-attach to the shared model
      this.model = view.model;
      this.uri = ResultsPaneView.URI;
      this.refs.dontOverrideTab.classList.remove("selected");
      this.separatePane = false;
    } else {
      // Detach from shared model
      view.handleEvents.resetInterface();
      view.model = new ResultsModel(view.model.findOptions);
      this.uri = ResultsPaneView.URI + "/" + this.model.getLastFindPattern();
      this.refs.dontOverrideTab.classList.add("selected");

      view.modelSubscriptions.dispose();
      view.handleEvents.addModelHandlers();
      view.handleEventsForReplace.addReplaceModelHandlers();
      this.separatePane = true;
    }
  }
};

module.exports.URI = "atom://search-panel/project-results";
