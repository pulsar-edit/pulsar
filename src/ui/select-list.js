"use strict";

const { Disposable, CompositeDisposable, TextEditor } = require("atom");
const etch = require("etch");
const { removeDiacritics } = require("./helpers");
const $ = etch.dom;

/**
 * Fuzzy-searchable select list component exported as `atom.ui.selectList`.
 *
 * Consumers should access this through `atom.ui.selectList`, not by requiring
 * this file directly.
 *
 * @module ui/select-list
 */

/**
 * Options passed to `elementForItem`.
 *
 * @typedef {Object} SelectListItemOptions
 * @property {boolean} selected Whether the item is currently selected.
 * @property {number} index The item's visible index.
 * @property {string|null} filterKey Text used for filtering, when available.
 * @property {number[]|null} matchIndices Lazily computed matched character indices.
 */

/**
 * @callback SelectListElementForItem
 * @param {*} item
 * @param {SelectListItemOptions} options
 * @returns {HTMLElement|Object} An `<li>` element, or data accepted by `createTwoLineItem`.
 */

/**
 * @typedef {Object} SelectListProps
 * @property {*[]} [items=[]] Items displayed by the select list.
 * @property {SelectListElementForItem} elementForItem Creates the visible element for an item.
 * @property {string} [className] Space-separated class names added to the root element.
 * @property {number} [maxResults] Maximum number of visible results.
 * @property {Function} [filter] Custom `(items, query) => items` filter.
 * @property {Function} [filterKeyForItem] Returns the string used to filter an item.
 * @property {Function} [filterQuery] Transforms the query before filtering.
 * @property {boolean} [removeDiacritics] Removes accents from query and item text before matching.
 * @property {Function} [filterScoreModifier] Custom `(score, item) => score` ranking adjustment.
 * @property {string} [algorithm] Fuzzy algorithm, usually `"fuzzaldrin"` or `"command-t"`.
 * @property {number} [numThreads] Worker thread count passed to the fuzzy matcher.
 * @property {number} [maxGap] Maximum character gap for `"command-t"` matching.
 * @property {string} [query] Query text to set during update.
 * @property {boolean} [selectQuery] Whether to select the query editor contents during update.
 * @property {Function} [order] Custom result sort function.
 * @property {string} [emptyMessage] Message shown when there are no items.
 * @property {string} [errorMessage] Error message shown above results.
 * @property {string} [infoMessage] Informational message shown above results.
 * @property {string} [helpMessage] HTML help content toggled by `select-list:help`.
 * @property {string} [helpMarkdown] Markdown help content toggled by `select-list:help`.
 * @property {string} [loadingMessage] Loading message shown instead of empty state.
 * @property {boolean} [loadingSpinner] Whether to show a tiny loading spinner.
 * @property {string|number} [loadingBadge] Badge displayed next to the loading message.
 * @property {string[]} [itemsClassList] Additional class names for the list element.
 * @property {number} [initialSelectionIndex=0] Initially selected visible item index.
 * @property {string} [placeholderText] Query editor placeholder text.
 * @property {boolean} [skipCommandsRegistration] Skips built-in keyboard commands.
 * @property {Function} [didChangeQuery] Called after query changes.
 * @property {Function} [didChangeSelection] Called after selection changes.
 * @property {Function} [didConfirmSelection] Called when the selected item is confirmed.
 * @property {Function} [didConfirmEmptySelection] Called when confirm occurs with no selection.
 * @property {Function} [didCancelSelection] Called on cancel or focus loss.
 * @property {Function} [willShow] Called before the internal panel is shown.
 */

/**
 * Fuzzy-searchable select list view.
 */
class SelectListView {
  static schedulerInitialized = false;

  static setScheduler(scheduler) {
    etch.setScheduler(scheduler);
    SelectListView.schedulerInitialized = true;
  }

  static getScheduler() {
    return etch.getScheduler();
  }

  static initializeScheduler() {
    if (!SelectListView.schedulerInitialized && typeof atom !== "undefined" && atom.views) {
      etch.setScheduler(atom.views);
      SelectListView.schedulerInitialized = true;
    }
  }

  /**
   * @param {SelectListProps} props
   */
  constructor(props) {
    SelectListView.initializeScheduler();
    this.props = props;
    if (!Object.prototype.hasOwnProperty.call(this.props, "initialSelectionIndex")) {
      this.props.initialSelectionIndex = 0;
    }
    if (!this.props.items) {
      this.props.items = [];
    } else {
      this.buildCandidates();
      this.filterItems(false);
    }
    this.showHelp = false;
    this.computeHelp();
    this.disposables = new CompositeDisposable();
    etch.initialize(this);
    this.disposables.add(atom.textEditors.add(this.refs.queryEditor));
    this.element.classList.add("select-list");
    if (props.className) {
      this.element.classList.add(...props.className.split(/\s+/).filter(Boolean));
    }
    this.disposables.add(
      this.refs.queryEditor.onDidChange(() => {
        this.didChangeQuery();
      }),
    );
    if (props.placeholderText) {
      this.refs.queryEditor.setPlaceholderText(props.placeholderText);
    }
    if (!props.skipCommandsRegistration) {
      this.disposables.add(this.registerAtomCommands());
    }
    const editorElement = this.refs.queryEditor.element;
    const didLoseFocus = this.didLoseFocus.bind(this);
    const didMouseDownOnElement = this.didMouseDownOnElement.bind(this);
    editorElement.addEventListener("blur", didLoseFocus);
    this.element.addEventListener("mousedown", didMouseDownOnElement);
    const didKeyDown = (event) => {
      if (event.key === "`") {
        event.stopImmediatePropagation();
        event.preventDefault();
        this.toggleHelp();
      }
    };
    editorElement.addEventListener("keydown", didKeyDown, true);
    this.disposables.add(
      new Disposable(() => {
        editorElement.removeEventListener("blur", didLoseFocus);
        this.element.removeEventListener("mousedown", didMouseDownOnElement);
        editorElement.removeEventListener("keydown", didKeyDown, true);
      }),
    );
  }

  /**
   * Focuses the query editor input.
   */
  focus() {
    this.refs.queryEditor.element.focus();
  }

  /**
   * Handles blur events from the query editor.
   * If focus moves within the select-list, refocuses the editor.
   * If focus moves outside, cancels selection after a frame delay.
   * @param {FocusEvent} event - The blur event
   */
  didLoseFocus(event) {
    // Keep focus on editor when clicking inside the select-list
    if (this.element.contains(event.relatedTarget)) {
      this.refs.queryEditor.element.focus();
      return;
    }
    // Wait for click to complete before canceling
    requestAnimationFrame(() => {
      if (!document.hasFocus() || !this.isVisible()) return;
      if (this.element.contains(document.activeElement)) return;
      this.cancelSelection();
    });
  }

  /**
   * Keeps clicks on the select-list's own surface from moving focus away.
   * CSS pseudo-elements dispatch events as their owning element.
   * @param {MouseEvent} event - The mousedown event
   */
  didMouseDownOnElement(event) {
    // Let the query editor handle its own mousedown (cursor placement, selection)
    if (this.refs.queryEditor.element.contains(event.target)) return;
    // Anywhere else inside the panel (messages, list, surface): keep focus on editor
    event.preventDefault();
    this.refs.queryEditor.element.focus();
  }

  /**
   * Clears the query editor text.
   */
  reset() {
    this.refs.queryEditor.setText("");
  }

  /**
   * Destroys the select list and cleans up resources.
   * @returns {Promise} Resolves when destruction is complete
   */
  destroy() {
    this.disposables.dispose();
    this.filterMatcher = null;
    this.indexMatcher = null;
    this.cachedCandidates = null;
    this.cachedItemByIndex = null;
    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
    }
    return etch.destroy(this);
  }

  /**
   * Shows the select list as a modal panel.
   * Stores the previously focused element to restore focus on hide.
   * Calls the willShow callback if provided.
   */
  show() {
    if (this.isVisible()) {
      return;
    }

    if (this.showHelp) {
      this.toggleHelp();
    }

    if (this.props.willShow) {
      this.props.willShow();
    }

    const active = document.activeElement;
    if (active && !active.closest(".modal")) {
      document.priorFocus = active;
    }

    this.refs.queryEditor.selectAll();

    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this, visible: false });
    }

    this.panel.show();
    this.focus();
  }

  /**
   * Hides the select list and restores focus to the previously focused element.
   */
  hide() {
    if (!this.isVisible()) {
      return;
    }

    if (this.panel) {
      this.panel.hide();
    }

    if (document.priorFocus) {
      document.priorFocus.focus();
      delete document.priorFocus;
    }
  }

  /**
   * Toggles the visibility of the select list.
   */
  toggle() {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Returns whether the select list is currently visible.
   * @returns {boolean} True if the panel exists and is visible
   */
  isVisible() {
    return this.panel && this.panel.isVisible();
  }

  registerAtomCommands() {
    return atom.commands.add(this.element, {
      "core:move-up": (event) => {
        if (this.isHelpMode()) return;
        this.selectPrevious();
        event.stopPropagation();
      },
      "core:move-down": (event) => {
        if (this.isHelpMode()) return;
        this.selectNext();
        event.stopPropagation();
      },
      "core:move-to-top": (event) => {
        if (this.isHelpMode()) return;
        this.selectFirst();
        event.stopPropagation();
      },
      "core:move-to-bottom": (event) => {
        if (this.isHelpMode()) return;
        this.selectLast();
        event.stopPropagation();
      },
      "core:confirm": (event) => {
        this.confirmSelection();
        event.stopPropagation();
      },
      "core:cancel": (event) => {
        this.cancelSelection();
        event.stopPropagation();
      },
      "select-list:help": (event) => {
        this.toggleHelp();
        event.stopPropagation();
      },
    });
  }

  update(props = {}) {
    let shouldBuildCandidates = false;
    let shouldFilterItems = false;
    let shouldComputeHelp = false;

    // Props that require rebuilding candidates
    if ("items" in props) {
      this.props.items = props.items;
      shouldBuildCandidates = true;
    }

    if ("filterKeyForItem" in props) {
      this.props.filterKeyForItem = props.filterKeyForItem;
      shouldBuildCandidates = true;
    }

    if ("removeDiacritics" in props) {
      this.props.removeDiacritics = props.removeDiacritics;
      shouldBuildCandidates = true;
    }

    // Props that only require re-filtering
    if ("maxResults" in props) {
      this.props.maxResults = props.maxResults;
      shouldFilterItems = true;
    }

    if ("filter" in props) {
      this.props.filter = props.filter;
      shouldFilterItems = true;
    }

    if ("filterQuery" in props) {
      this.props.filterQuery = props.filterQuery;
      shouldFilterItems = true;
    }

    if ("filterScoreModifier" in props) {
      this.props.filterScoreModifier = props.filterScoreModifier;
      shouldFilterItems = true;
    }

    if ("algorithm" in props) {
      this.props.algorithm = props.algorithm;
      shouldFilterItems = true;
    }

    if ("numThreads" in props) {
      this.props.numThreads = props.numThreads;
      shouldFilterItems = true;
    }

    if ("maxGap" in props) {
      this.props.maxGap = props.maxGap;
      shouldFilterItems = true;
    }

    if ("order" in props) {
      this.props.order = props.order;
      shouldFilterItems = true;
    }

    if ("query" in props) {
      this.refs.queryEditor.setText(props.query);
      // setText triggers didChangeQuery -> filterItems, so skip explicit filter
    }

    if ("selectQuery" in props) {
      if (props.selectQuery) {
        this.refs.queryEditor.selectAll();
      } else {
        this.refs.queryEditor.clearSelections();
      }
    }

    if ("emptyMessage" in props) {
      this.props.emptyMessage = props.emptyMessage;
    }

    if ("errorMessage" in props) {
      this.props.errorMessage = props.errorMessage;
    }

    if ("infoMessage" in props) {
      this.props.infoMessage = props.infoMessage;
    }

    if ("helpMessage" in props) {
      this.props.helpMessage = props.helpMessage;
      shouldComputeHelp = true;
    }

    if ("helpMarkdown" in props) {
      this.props.helpMarkdown = props.helpMarkdown;
      shouldComputeHelp = true;
    }

    if ("loadingMessage" in props) {
      this.props.loadingMessage = props.loadingMessage;
    }

    if ("loadingSpinner" in props) {
      this.props.loadingSpinner = props.loadingSpinner;
    }

    if ("loadingBadge" in props) {
      this.props.loadingBadge = props.loadingBadge;
    }

    if ("itemsClassList" in props) {
      this.props.itemsClassList = props.itemsClassList;
    }

    if ("initialSelectionIndex" in props) {
      this.props.initialSelectionIndex = props.initialSelectionIndex;
    }

    if ("placeholderText" in props) {
      this.props.placeholderText = props.placeholderText;
      this.refs.queryEditor.setPlaceholderText(props.placeholderText || "");
    }

    if (shouldBuildCandidates) {
      this.buildCandidates();
      this.filterItems();
    } else if (shouldFilterItems) {
      this.filterItems();
    }

    if (shouldComputeHelp) {
      this.computeHelp();
    }

    return etch.update(this);
  }

  render() {
    if (this.isHelpMode()) {
      return $.div({}, this.renderQueryRow(), this.renderHelpMessage());
    } else {
      return $.div(
        {},
        this.renderQueryRow(),
        this.renderLoadingMessage(),
        this.renderInfoMessage(),
        this.renderErrorMessage(),
        this.renderItems(),
      );
    }
  }

  renderQueryRow() {
    const helpToggle = this.helpMessage
      ? $.span({
          className: "icon-question",
          style: {
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            opacity: "0.5",
            zIndex: "1",
          },
          on: {
            mousedown: (e) => e.preventDefault(),
            click: () => this.toggleHelp(),
            mouseenter: (e) => (e.target.style.opacity = "1"),
            mouseleave: (e) => (e.target.style.opacity = "0.5"),
          },
        })
      : "";
    return $.div(
      { style: { position: "relative" } },
      $(TextEditor, { ref: "queryEditor", mini: true }),
      helpToggle,
    );
  }

  renderItems() {
    if (this.items && this.items.length > 0) {
      const className = ["list-group"].concat(this.props.itemsClassList || []).join(" ");

      this.listItems = this.items.map((item, index) => {
        const selected = this.getSelectedItem() === item;
        const filterKey = this.getFilterKey(item);
        const opts = { selected, index, filterKey };
        // Lazy getter - matchIndices only computed when accessed
        Object.defineProperty(opts, "matchIndices", {
          get: () => this.getMatchIndices(item, filterKey),
          enumerable: true,
        });
        return $(ListItemView, {
          element: this.resolveElement(item, opts),
          selected: selected,
          onclick: () => this.didClickItem(index),
          oncontextmenu: () => this.selectIndex(index),
        });
      });

      return $.ol({ className, ref: "items" }, ...this.listItems);
    } else if (!this.props.loadingMessage && this.props.emptyMessage) {
      return $.div({ ref: "emptyMessage", className: "empty-message" }, this.props.emptyMessage);
    } else {
      return "";
    }
  }

  renderErrorMessage() {
    if (this.props.errorMessage) {
      return $.div({ ref: "errorMessage", className: "error-message" }, this.props.errorMessage);
    } else {
      return "";
    }
  }

  renderInfoMessage() {
    if (this.props.infoMessage) {
      return $.div({ ref: "infoMessage", className: "info-message" }, this.props.infoMessage);
    } else {
      return "";
    }
  }

  renderLoadingMessage() {
    if (this.props.loadingMessage) {
      return $.div(
        { className: "loading", style: "display: flex; align-items: center;" },
        $.div({ ref: "loadingMessage", className: "loading-message" }, this.props.loadingMessage),
        this.props.loadingSpinner
          ? $.span({
              className: "loading-spinner-tiny inline-block",
              style: { marginLeft: "0.5em" },
            })
          : "",
        this.props.loadingBadge
          ? $.span({ ref: "loadingBadge", className: "badge" }, this.props.loadingBadge)
          : "",
      );
    } else {
      return "";
    }
  }

  renderHelpMessage() {
    if (!this.showHelp || !this.helpMessage) {
      return "";
    }
    const isMarkdown = !this.props.helpMessage && this.props.helpMarkdown;
    return $.div({
      key: "help",
      ref: "helpMessage",
      className: "help-message" + (isMarkdown ? " markdown" : ""),
      innerHTML: this.helpMessage,
    });
  }

  computeHelp() {
    if (this.props.helpMessage) {
      this.helpMessage = this.props.helpMessage;
    } else if (this.props.helpMarkdown) {
      if (atom.ui && atom.ui.markdown && atom.ui.markdown.render) {
        this.helpMessage = atom.ui.markdown.render(this.props.helpMarkdown);
      } else {
        // Fallback: escape and wrap as text
        const escaped = this.props.helpMarkdown.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        this.helpMessage = `<p>${escaped}</p>`;
      }
    } else {
      this.helpMessage = false;
    }
  }

  isHelpMode() {
    return this.helpMessage && this.showHelp;
  }

  toggleHelp() {
    if (!this.helpMessage) {
      return;
    }
    this.showHelp = !this.showHelp;
    return etch.update(this);
  }

  hideHelp() {
    if (this.showHelp) {
      this.showHelp = false;
      return etch.update(this);
    }
    return Promise.resolve();
  }

  getQuery() {
    if (this.refs && this.refs.queryEditor) {
      return this.refs.queryEditor.getText();
    } else {
      return "";
    }
  }

  getFilterQuery() {
    return this.props.filterQuery ? this.props.filterQuery(this.getQuery()) : this.getQuery();
  }

  setQueryFromSelection() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return false;
    const text = editor.getSelectedText();
    if (!text || /\n/.test(text)) return false;
    this.refs.queryEditor.setText(text);
    this.refs.queryEditor.selectAll();
    return true;
  }

  didChangeQuery() {
    if (this.props.didChangeQuery) {
      this.props.didChangeQuery(this.getFilterQuery());
    }

    this.hideHelp();
    this.filterItems();
  }

  didClickItem(itemIndex) {
    this.selectIndex(itemIndex);
    this.confirmSelection();
  }

  /**
   * Filters items based on current query.
   * Called on query change (uses existing candidates).
   */
  filterItems(updateComponent) {
    this.listItems = null;
    this.matchIndicesMap = new Map();
    this.filterKeyMap = new Map();

    const filterFn = this.props.filter || this.fuzzyFilter.bind(this);
    this.processedQuery = this.getFilterQuery();
    this.items = filterFn(this.props.items.slice(), this.processedQuery);
    if (this.props.order) {
      this.items.sort(this.props.order);
    }
    if (this.props.maxResults) {
      this.items = this.items.slice(0, this.props.maxResults);
    }

    this.selectIndex(this.props.initialSelectionIndex, updateComponent);
  }

  /**
   * Builds candidates array and initializes the matcher.
   * Called when items or filter settings change.
   */
  buildCandidates() {
    this.candidates = [];
    this.itemByIndex = [];
    for (const item of this.props.items) {
      let filterKey = this.props.filterKeyForItem ? this.props.filterKeyForItem(item) : item;
      if (this.props.removeDiacritics) {
        filterKey = removeDiacritics(filterKey);
      }
      this.candidates.push(filterKey);
      this.itemByIndex.push(item);
    }
    if (this.filterMatcher) {
      atom.ui.fuzzyMatcher.setCandidates(this.filterMatcher, this.candidates);
    } else {
      this.filterMatcher = atom.ui.fuzzyMatcher.setCandidates(this.candidates);
    }
  }

  fuzzyFilter(items, query) {
    if (query.length === 0) {
      return items;
    }
    if (this.props.removeDiacritics) {
      query = removeDiacritics(query);
      this.processedQuery = query;
    }
    const matchOptions = {
      recordMatchIndexes: false,
    };
    if (this.props.algorithm) matchOptions.algorithm = this.props.algorithm;
    if (this.props.numThreads) matchOptions.numThreads = this.props.numThreads;
    if (this.props.maxGap !== undefined) matchOptions.maxGap = this.props.maxGap;
    if (!this.filterMatcher) return [];
    const results = this.filterMatcher.match(query, matchOptions);
    const modifyScore = this.props.filterScoreModifier;
    const scoredItems = [];
    for (const result of results) {
      const item = this.itemByIndex[result.id];
      let score = result.score;
      if (modifyScore) {
        score = modifyScore(score, item);
      }
      if (score > 0) {
        scoredItems.push({
          item,
          score,
          filterKey: this.candidates[result.id],
        });
      }
    }
    if (modifyScore) {
      scoredItems.sort((a, b) => b.score - a.score);
    }
    for (const { item, filterKey } of scoredItems) {
      this.filterKeyMap.set(item, filterKey);
    }
    return scoredItems.map((i) => i.item);
  }

  /**
   * Returns the filter key for an item.
   * @param {*} item - The item to get the filter key for
   * @returns {string|null} The filter key string, or null
   */
  getFilterKey(item) {
    // Check stored filterKey from fuzzyFilter
    let filterKey = this.filterKeyMap?.get(item);
    if (filterKey) return filterKey;

    // Compute from filterKeyForItem
    if (this.props.filterKeyForItem) {
      filterKey = this.props.filterKeyForItem(item);
      if (this.props.removeDiacritics) {
        filterKey = removeDiacritics(filterKey);
      }
      return filterKey;
    }

    // Fall back to item itself if string
    return typeof item === "string" ? item : null;
  }

  /**
   * Returns the match indices for an item, computing lazily if needed.
   * Match indices indicate which characters in the filter key matched the query.
   * @param {*} item - The item to get match indices for
   * @param {string} [filterKey] - Optional filter key override. If not provided,
   *   uses the stored filterKey from fuzzyFilter or computes from filterKeyForItem.
   * @returns {number[]|null} Array of character indices that matched, or null
   */
  getMatchIndices(item, filterKey) {
    // Check cache first
    const cached = this.matchIndicesMap?.get(item);
    if (cached !== undefined) return cached;

    // Use provided filterKey or get from item
    if (!filterKey) {
      filterKey = this.getFilterKey(item);
    }

    if (!filterKey || !this.processedQuery) {
      return null;
    }

    // Use reusable matcher for index computation (like fuzzy-finder)
    if (!this.indexMatcher) {
      this.indexMatcher = atom.ui.fuzzyMatcher.setCandidates([filterKey]);
    } else {
      atom.ui.fuzzyMatcher.setCandidates(this.indexMatcher, [filterKey]);
    }

    const indexMatchOptions = {
      maxResults: 1,
      recordMatchIndexes: true,
    };
    if (this.props.algorithm) indexMatchOptions.algorithm = this.props.algorithm;
    if (this.props.maxGap !== undefined) indexMatchOptions.maxGap = this.props.maxGap;

    const results = this.indexMatcher.match(this.processedQuery, indexMatchOptions);

    const indexes = results.length > 0 ? results[0].matchIndexes : null;
    this.matchIndicesMap?.set(item, indexes);
    return indexes;
  }

  getSelectedItem() {
    if (this.selectionIndex === undefined) return null;
    return this.items[this.selectionIndex];
  }

  /**
   * Resolves the element for an item.
   * If elementForItem returns an HTML element, uses it directly.
   * If it returns an object, passes it to createTwoLineItem.
   * @param {*} item - The item to get an element for
   * @param {Object} opts - Options passed to elementForItem
   * @returns {HTMLElement} The resolved element
   */
  resolveElement(item, opts) {
    const result = this.props.elementForItem(item, opts);
    if (result instanceof HTMLElement) {
      return result;
    }
    return createTwoLineItem(result);
  }

  renderItemAtIndex(index) {
    if (!this.listItems || index < 0 || index >= this.listItems.length) return;
    const item = this.items[index];
    const selected = this.getSelectedItem() === item;
    const filterKey = this.getFilterKey(item);
    const opts = { selected, index, filterKey };
    // Lazy getter - matchIndices only computed when accessed
    Object.defineProperty(opts, "matchIndices", {
      get: () => this.getMatchIndices(item, filterKey),
      enumerable: true,
    });
    const component = this.listItems[index].component;
    component.update({
      element: this.resolveElement(item, opts),
      selected: selected,
      onclick: () => this.didClickItem(index),
      oncontextmenu: () => this.selectIndex(index),
    });
  }

  selectPrevious() {
    if (this.selectionIndex === undefined) return this.selectLast();
    return this.selectIndex(this.selectionIndex - 1);
  }

  selectNext() {
    if (this.selectionIndex === undefined) return this.selectFirst();
    return this.selectIndex(this.selectionIndex + 1);
  }

  selectFirst() {
    return this.selectIndex(0);
  }

  selectLast() {
    return this.selectIndex(this.items.length - 1);
  }

  selectNone() {
    return this.selectIndex(undefined);
  }

  selectIndex(index, updateComponent = true) {
    if (index >= this.items.length) {
      index = 0;
    } else if (index < 0) {
      index = this.items.length - 1;
    }

    const oldIndex = this.selectionIndex;

    this.selectionIndex = index;
    if (index !== undefined && this.props.didChangeSelection) {
      this.props.didChangeSelection(this.getSelectedItem());
    }

    if (updateComponent) {
      if (this.listItems) {
        if (oldIndex >= 0) this.renderItemAtIndex(oldIndex);
        if (index >= 0) this.renderItemAtIndex(index);
        return etch.getScheduler().getNextUpdatePromise();
      } else {
        return etch.update(this);
      }
    } else {
      return Promise.resolve();
    }
  }

  selectItem(item) {
    const index = this.items.indexOf(item);
    if (index === -1) {
      throw new Error("Cannot select the specified item because it does not exist.");
    } else {
      return this.selectIndex(index);
    }
  }

  /**
   * Confirms the current selection.
   * Calls didConfirmSelection with the selected item, or didConfirmEmptySelection if none.
   */
  confirmSelection() {
    const selectedItem = this.getSelectedItem();
    if (selectedItem != null) {
      if (this.props.didConfirmSelection) {
        this.props.didConfirmSelection(selectedItem);
      }
    } else {
      if (this.props.didConfirmEmptySelection) {
        this.props.didConfirmEmptySelection();
      }
    }
  }

  /**
   * Cancels the selection and calls the didCancelSelection callback if provided.
   */
  cancelSelection() {
    if (this.props.didCancelSelection) {
      this.props.didCancelSelection();
    }
  }
}

class ListItemView {
  constructor(props) {
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.didClick = this.didClick.bind(this);
    this.didContextMenu = this.didContextMenu.bind(this);
    this.selected = props.selected;
    this.onclick = props.onclick;
    this.oncontextmenu = props.oncontextmenu;
    this.element = props.element;
    this.element.addEventListener("mousedown", this.mouseDown);
    this.element.addEventListener("mouseup", this.mouseUp);
    this.element.addEventListener("click", this.didClick);
    this.element.addEventListener("contextmenu", this.didContextMenu);
    if (this.selected) {
      this.element.classList.add("selected");
    }
    this.domEventsDisposable = new Disposable(() => {
      this.element.removeEventListener("mousedown", this.mouseDown);
      this.element.removeEventListener("mouseup", this.mouseUp);
      this.element.removeEventListener("click", this.didClick);
      this.element.removeEventListener("contextmenu", this.didContextMenu);
    });
    etch.getScheduler().updateDocument(this.scrollIntoViewIfNeeded.bind(this));
  }

  mouseDown(event) {
    event.preventDefault();
  }

  mouseUp(event) {
    event.preventDefault();
  }

  didClick(event) {
    event.preventDefault();
    this.onclick();
  }

  didContextMenu() {
    this.oncontextmenu();
  }

  destroy() {
    this.element.remove();
    this.domEventsDisposable.dispose();
  }

  update(props) {
    this.element.removeEventListener("mousedown", this.mouseDown);
    this.element.removeEventListener("mouseup", this.mouseUp);
    this.element.removeEventListener("click", this.didClick);
    this.element.removeEventListener("contextmenu", this.didContextMenu);

    if (this.element.parentNode) {
      this.element.parentNode.replaceChild(props.element, this.element);
    }
    this.element = props.element;
    this.element.addEventListener("mousedown", this.mouseDown);
    this.element.addEventListener("mouseup", this.mouseUp);
    this.element.addEventListener("click", this.didClick);
    this.element.addEventListener("contextmenu", this.didContextMenu);
    if (props.selected) {
      this.element.classList.add("selected");
    } else {
      this.element.classList.remove("selected");
    }

    this.selected = props.selected;
    this.onclick = props.onclick;
    this.oncontextmenu = props.oncontextmenu;
    etch.getScheduler().updateDocument(this.scrollIntoViewIfNeeded.bind(this));
  }

  scrollIntoViewIfNeeded() {
    if (this.selected) {
      this.element.scrollIntoViewIfNeeded(false);
    }
  }
}

/**
 * Computes fuzzy match indices for text against a query.
 * @param {string} text - The text to match against
 * @param {string} query - The query to match
 * @param {Object} [options] - Optional settings
 * @param {boolean} [options.removeDiacritics=false] - Whether to remove diacritics before matching
 * @returns {number[]|null} Array of character indices that matched, or null if no match
 */
function getMatchIndices(text, query, options = {}) {
  if (!text || !query) return null;

  let processedText = text;
  let processedQuery = query;

  if (options.removeDiacritics) {
    processedText = removeDiacritics(processedText);
    processedQuery = removeDiacritics(processedQuery);
  }

  const result = atom.ui.fuzzyMatcher.match(processedText, processedQuery, {
    recordMatchIndexes: true,
  });

  return result?.matchIndexes ?? null;
}

/**
 * Creates a document fragment with matched characters wrapped in spans.
 *
 * @param {string} text
 * @param {number[]|null} matchIndices
 * @param {Object} [options]
 * @param {string} [options.className="character-match"]
 * @returns {DocumentFragment}
 */
function highlightMatches(text, matchIndices, options = {}) {
  const { className = "character-match" } = options;
  const fragment = document.createDocumentFragment();

  if (!matchIndices || matchIndices.length === 0) {
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }

  // Filter out invalid indices (negative or out of range)
  const validIndices = matchIndices.filter((i) => i >= 0 && i < text.length);

  if (validIndices.length === 0) {
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }

  let lastIndex = 0;
  let matchChars = "";

  for (const index of validIndices) {
    if (index > lastIndex) {
      if (matchChars) {
        const span = document.createElement("span");
        span.className = className;
        span.textContent = matchChars;
        fragment.appendChild(span);
        matchChars = "";
      }
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
    }
    matchChars += text[index];
    lastIndex = index + 1;
  }

  if (matchChars) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = matchChars;
    fragment.appendChild(span);
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  return fragment;
}

/**
 * Creates a two-line list item element with primary and optional secondary lines.
 * @param {Object} options - Configuration options
 * @param {string|Node} options.primary - Primary line content (text or DOM node)
 * @param {string|Node} [options.secondary] - Secondary line content (optional)
 * @param {string[]} [options.icon] - Icon class names to add to primary line
 * @returns {HTMLLIElement} The created list item element
 */
function createTwoLineItem({ primary, secondary, icon }) {
  const li = document.createElement("li");
  li.classList.add("two-lines");

  const priLine = document.createElement("div");
  priLine.classList.add("primary-line");
  if (icon && icon.length > 0) {
    priLine.classList.add("icon", ...icon);
  }

  const wrapper = document.createElement("span");
  wrapper.classList.add("primary-text");
  if (typeof primary === "string") {
    wrapper.textContent = primary;
  } else if (primary) {
    wrapper.appendChild(primary);
  }
  priLine.appendChild(wrapper);
  li.appendChild(priLine);

  if (secondary !== undefined && secondary !== null) {
    const secLine = document.createElement("div");
    secLine.classList.add("secondary-line");
    if (typeof secondary === "string") {
      secLine.textContent = secondary;
    } else {
      secLine.appendChild(secondary);
    }
    li.appendChild(secLine);
  }

  return li;
}

module.exports ={
  SelectListView,
  getMatchIndices,
  highlightMatches,
  createTwoLineItem,
}
