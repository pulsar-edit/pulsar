const { TextEditor, CompositeDisposable } = require("atom");
const Util = require("./util");
const { pluralize } = require("./helpers");
const etch = require("etch");
const $ = etch.dom;

module.exports = class FindView {
  constructor(target, { findBuffer, replaceBuffer, findHistoryCycler, replaceHistoryCycler } = {}) {
    this.target = target;
    this.findBuffer = findBuffer;
    this.replaceBuffer = replaceBuffer;
    this.findHistoryCycler = findHistoryCycler;
    this.replaceHistoryCycler = replaceHistoryCycler;
    this.subscriptions = new CompositeDisposable();

    etch.initialize(this);

    this.subscriptions.add(
      atom.textEditors.add(this.refs.findEditor),
      atom.textEditors.add(this.refs.replaceEditor),
    );

    this.findHistoryCycler.addEditorElement(this.findEditor.getElement());
    this.replaceHistoryCycler.addEditorElement(this.replaceEditor.getElement());
    this.handleEvents();
    this.subscribeToTarget();
    this.clearMessage();
    this.updateOptionViews();
    this.updateSyntaxHighlighting();
    this.updateFindEnablement();
    this.updateReplaceEnablement();
    this.createWrapIcon();
  }

  update() {}

  render() {
    return $.div(
      { tabIndex: -1, className: "search-panel search-panel-editor" },
      $.header(
        { className: "header" },
        $.span(
          {
            ref: "closeButton",
            className: "header-item close-button pull-right",
          },
          $.i({ className: "icon icon-x clickable" }),
        ),

        $.span(
          { ref: "descriptionLabel", className: "header-item description" },
          "Find in Current Buffer",
        ),

        $.span(
          { className: "header-item options-label pull-right" },
          $.span({}, "Finding with Options: "),
          $.span({ ref: "optionsLabel", className: "options" }),
          $.span(
            { className: "btn-group btn-toggle btn-group-options" },
            $.button(
              { ref: "regexOptionButton", className: "btn" },
              $.svg({
                className: "icon",
                innerHTML: '<use href="#search-panel-icon-regex" />',
              }),
            ),

            $.button(
              { ref: "caseOptionButton", className: "btn" },
              $.svg({
                className: "icon",
                innerHTML: '<use href="#search-panel-icon-case" />',
              }),
            ),

            $.button(
              {
                ref: "selectionOptionButton",
                className: "btn option-selection",
              },
              $.svg({
                className: "icon",
                innerHTML: '<use href="#search-panel-icon-selection" />',
              }),
            ),

            $.button(
              {
                ref: "wholeWordOptionButton",
                className: "btn option-whole-word",
              },
              $.svg({
                className: "icon",
                innerHTML: '<use href="#search-panel-icon-word" />',
              }),
            ),
          ),
        ),
      ),

      $.section(
        { className: "input-block find-container" },
        $.div(
          {
            className: "input-block-item input-block-item--flex editor-container",
          },
          $(TextEditor, {
            ref: "findEditor",
            mini: true,
            placeholderText: "Find in current buffer",
            buffer: this.findBuffer,
          }),

          $.div(
            { className: "find-meta-container" },
            $.span({
              ref: "resultCounter",
              className: "text-subtle result-counter",
            }),
          ),
        ),

        $.div(
          { className: "input-block-item" },
          $.div(
            { className: "btn-group btn-group-find" },
            $.button({ ref: "nextButton", className: "btn btn-next" }, "Find"),
          ),

          $.div(
            { className: "btn-group btn-group-find-all" },
            $.button({ ref: "findAllButton", className: "btn btn-all" }, "Find All"),
          ),
        ),
      ),

      $.section(
        { className: "input-block replace-container" },
        $.div(
          {
            className: "input-block-item input-block-item--flex editor-container",
          },
          $(TextEditor, {
            ref: "replaceEditor",
            mini: true,
            placeholderText: "Replace in current buffer",
            buffer: this.replaceBuffer,
          }),
        ),

        $.div(
          { className: "input-block-item" },
          $.div(
            { className: "btn-group btn-group-replace" },
            $.button({ ref: "replaceNextButton", className: "btn btn-next" }, "Replace"),
          ),

          $.div(
            { className: "btn-group btn-group-replace-all" },
            $.button({ ref: "replaceAllButton", className: "btn btn-all" }, "Replace All"),
          ),
        ),
      ),

      $.svg({
        style: { display: "none" },
        innerHTML: `
          <symbol id="search-panel-icon-regex" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd">
            <rect x="3" y="10" width="3" height="3" rx="1"></rect>
            <rect x="12" y="3" width="2" height="9" rx="1"></rect>
            <rect transform="translate(13.000000, 7.500000) rotate(60.000000) translate(-13.000000, -7.500000) " x="12" y="3" width="2" height="9" rx="1"></rect>
            <rect transform="translate(13.000000, 7.500000) rotate(-60.000000) translate(-13.000000, -7.500000) " x="12" y="3" width="2" height="9" rx="1"></rect>
          </symbol>

          <symbol id="search-panel-icon-case" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd">
            <path d="M10.919,13 L9.463,13 C9.29966585,13 9.16550052,12.9591671 9.0605,12.8775 C8.95549947,12.7958329 8.8796669,12.6943339 8.833,12.573 L8.077,10.508 L3.884,10.508 L3.128,12.573 C3.09066648,12.6803339 3.01716722,12.7783329 2.9075,12.867 C2.79783279,12.9556671 2.66366746,13 2.505,13 L1.042,13 L5.018,2.878 L6.943,2.878 L10.919,13 Z M4.367,9.178 L7.594,9.178 L6.362,5.811 C6.30599972,5.66166592 6.24416701,5.48550102 6.1765,5.2825 C6.108833,5.07949898 6.04233366,4.85900119 5.977,4.621 C5.91166634,4.85900119 5.84750032,5.08066564 5.7845,5.286 C5.72149969,5.49133436 5.65966697,5.67099923 5.599,5.825 L4.367,9.178 Z M18.892,13 L18.115,13 C17.9516658,13 17.8233338,12.9755002 17.73,12.9265 C17.6366662,12.8774998 17.5666669,12.7783341 17.52,12.629 L17.366,12.118 C17.1839991,12.2813341 17.0055009,12.4248327 16.8305,12.5485 C16.6554991,12.6721673 16.4746676,12.7759996 16.288,12.86 C16.1013324,12.9440004 15.903001,13.0069998 15.693,13.049 C15.4829989,13.0910002 15.2496679,13.112 14.993,13.112 C14.6896651,13.112 14.4096679,13.0711671 14.153,12.9895 C13.896332,12.9078329 13.6758342,12.7853342 13.4915,12.622 C13.3071657,12.4586658 13.1636672,12.2556679 13.061,12.013 C12.9583328,11.7703321 12.907,11.4880016 12.907,11.166 C12.907,10.895332 12.9781659,10.628168 13.1205,10.3645 C13.262834,10.100832 13.499665,9.8628344 13.831,9.6505 C14.162335,9.43816561 14.6033306,9.2620007 15.154,9.122 C15.7046694,8.9819993 16.3883292,8.90266676 17.205,8.884 L17.205,8.464 C17.205,7.98333093 17.103501,7.62750116 16.9005,7.3965 C16.697499,7.16549885 16.4023352,7.05 16.015,7.05 C15.7349986,7.05 15.5016676,7.08266634 15.315,7.148 C15.1283324,7.21333366 14.9661673,7.28683292 14.8285,7.3685 C14.6908326,7.45016707 14.5636672,7.52366634 14.447,7.589 C14.3303327,7.65433366 14.2020007,7.687 14.062,7.687 C13.9453327,7.687 13.8450004,7.65666697 13.761,7.596 C13.6769996,7.53533303 13.6093336,7.46066711 13.558,7.372 L13.243,6.819 C14.0690041,6.06299622 15.0653275,5.685 16.232,5.685 C16.6520021,5.685 17.0264983,5.75383264 17.3555,5.8915 C17.6845016,6.02916736 17.9633322,6.22049877 18.192,6.4655 C18.4206678,6.71050122 18.5944994,7.00333163 18.7135,7.344 C18.8325006,7.68466837 18.892,8.05799797 18.892,8.464 L18.892,13 Z M15.532,11.922 C15.7093342,11.922 15.8726659,11.9056668 16.022,11.873 C16.1713341,11.8403332 16.3124993,11.7913337 16.4455,11.726 C16.5785006,11.6606663 16.7068327,11.5801671 16.8305,11.4845 C16.9541673,11.3888329 17.0789993,11.2756673 17.205,11.145 L17.205,9.934 C16.7009975,9.95733345 16.279835,10.0004997 15.9415,10.0635 C15.603165,10.1265003 15.3313343,10.2069995 15.126,10.305 C14.9206656,10.4030005 14.7748337,10.5173327 14.6885,10.648 C14.6021662,10.7786673 14.559,10.9209992 14.559,11.075 C14.559,11.3783349 14.6488324,11.5953327 14.8285,11.726 C15.0081675,11.8566673 15.2426652,11.922 15.532,11.922 L15.532,11.922 Z"></path>
          </symbol>

          <symbol id="search-panel-icon-selection" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd">
            <rect opacity="0.6" x="17" y="9" width="2" height="4"></rect>
            <rect opacity="0.6" x="14" y="9" width="2" height="4"></rect>
            <rect opacity="0.6" x="1" y="3" width="2" height="4"></rect>
            <rect x="1" y="9" width="11" height="4"></rect>
            <rect x="5" y="3" width="14" height="4"></rect>
          </symbol>

          <symbol id="search-panel-icon-word" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd">
            <rect opacity="0.6" x="1" y="3" width="2" height="6"></rect>
            <rect opacity="0.6" x="17" y="3" width="2" height="6"></rect>
            <rect x="6" y="3" width="2" height="6"></rect>
            <rect x="12" y="3" width="2" height="6"></rect>
            <rect x="9" y="3" width="2" height="6"></rect>
            <path d="M4.5,13 L15.5,13 L16,13 L16,12 L15.5,12 L4.5,12 L4,12 L4,13 L4.5,13 L4.5,13 Z"></path>
            <path d="M4,10.5 L4,12.5 L4,13 L5,13 L5,12.5 L5,10.5 L5,10 L4,10 L4,10.5 L4,10.5 Z"></path>
            <path d="M15,10.5 L15,12.5 L15,13 L16,13 L16,12.5 L16,10.5 L16,10 L15,10 L15,10.5 L15,10.5 Z"></path>
          </symbol>

          <symbol id="search-panel-context-lines-before" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd">
            <rect opacity="0.6" x="2" y="11" width="16" height="2"></rect>
            <rect x="2" y="7" width="10" height="2"></rect>
            <rect x="2" y="3" width="10" height="2"></rect>
          </symbol>

          <symbol id="search-panel-context-lines-after" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd">
            <rect x="2" y="11" width="10" height="2"></rect>
            <rect x="2" y="7" width="10" height="2"></rect>
            <rect opacity="0.6" x="2" y="3" width="16" height="2"></rect>
          </symbol>

          <symbol id="search-panel-icon-pcre2" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd">
            <circle cx="4" cy="10" r="1.5"></circle>
            <rect x="7" y="4" width="2" height="8" rx="1"></rect>
            <rect x="7" y="4" width="2" height="8" rx="1" transform="rotate(45 8 8)"></rect>
            <rect x="7" y="4" width="2" height="8" rx="1" transform="rotate(-45 8 8)"></rect>
            <text x="13" y="12" font-size="8" font-weight="bold" font-family="sans-serif">2</text>
          </symbol>
        `,
      }),
    );
  }

  get findEditor() {
    return this.refs.findEditor;
  }

  get replaceEditor() {
    return this.refs.replaceEditor;
  }

  destroy() {
    if (this.subscriptions) this.subscriptions.dispose();
    if (this.targetSubscriptions) this.targetSubscriptions.dispose();
    if (this.tooltipSubscriptions) this.tooltipSubscriptions.dispose();
  }

  // Subscribe to the active SearchTarget's result events. Kept separate from the
  // main subscriptions so the target can be swapped (e.g. when the active pane
  // item changes from a text editor to a search-adapter view) without tearing
  // down the rest of the view.
  subscribeToTarget() {
    if (this.targetSubscriptions) this.targetSubscriptions.dispose();
    this.targetSubscriptions = new CompositeDisposable(
      this.target.onDidUpdate(this.markersUpdated.bind(this)),
      this.target.onDidError(this.findError.bind(this)),
      this.target.onDidChangeCurrentResult(this.updateResultCounter.bind(this)),
    );
  }

  // Switch the view to a different SearchTarget and refresh the result UI.
  setTarget(target) {
    if (this.target === target) return;
    this.target = target;
    this.subscribeToTarget();
    this.updateResultsUi(this.target.getResultCount());
  }

  setPanel(panel) {
    this.panel = panel;
    this.subscriptions.add(
      this.panel.onDidChangeVisible((visible) => {
        if (visible) {
          this.didShow();
        } else {
          this.didHide();
        }
      }),
    );
  }

  didShow() {
    atom.views.getView(atom.workspace).classList.add("find-visible");
    if (this.tooltipSubscriptions) return;

    this.tooltipSubscriptions = new CompositeDisposable(
      atom.tooltips.add(this.refs.closeButton, {
        title: 'Close Panel <span class="keystroke">Esc</span>',
        html: true,
      }),
      atom.tooltips.add(this.refs.regexOptionButton, {
        title: "Use Regex",
        keyBindingCommand: "search-panel:toggle-regex-option",
        keyBindingTarget: this.findEditor.element,
      }),
      atom.tooltips.add(this.refs.caseOptionButton, {
        title: "Match Case",
        keyBindingCommand: "search-panel:toggle-case-option",
        keyBindingTarget: this.findEditor.element,
      }),
      atom.tooltips.add(this.refs.selectionOptionButton, {
        title: "Only In Selection",
        keyBindingCommand: "search-panel:toggle-selection-option",
        keyBindingTarget: this.findEditor.element,
      }),
      atom.tooltips.add(this.refs.wholeWordOptionButton, {
        title: "Whole Word",
        keyBindingCommand: "search-panel:toggle-whole-word-option",
        keyBindingTarget: this.findEditor.element,
      }),
    );
  }

  didHide() {
    this.hideAllTooltips();
    if (atom.config.get("search-panel.cleanOnHide")) {
      this.findEditor.setText("");
      this.replaceEditor.setText("");
    }
    let workspaceElement = atom.views.getView(atom.workspace);
    workspaceElement.focus();
    workspaceElement.classList.remove("find-visible");
  }

  hideAllTooltips() {
    this.tooltipSubscriptions.dispose();
    this.tooltipSubscriptions = null;
  }

  handleEvents() {
    this.findEditor.onDidStopChanging(() => this.liveSearch());
    this.refs.nextButton.addEventListener("click", (e) =>
      e.shiftKey
        ? this.findPrevious({ focusEditorAfter: true })
        : this.findNext({ focusEditorAfter: true }),
    );
    this.refs.findAllButton.addEventListener("click", this.findAll.bind(this));
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "search-panel:find-next": () => this.findNext({ focusEditorAfter: true }),
        "search-panel:find-previous": () => this.findPrevious({ focusEditorAfter: true }),
        "search-panel:find-all": () => this.findAll({ focusEditorAfter: true }),
        "search-panel:find-next-selected": this.findNextSelected.bind(this),
        "search-panel:find-previous-selected": this.findPreviousSelected.bind(this),
        "search-panel:use-selection-as-find-pattern": this.setSelectionAsFindPattern.bind(this),
        "search-panel:use-selection-as-replace-pattern":
          this.setSelectionAsReplacePattern.bind(this),
      }),
    );

    this.refs.replaceNextButton.addEventListener("click", (e) =>
      e.shiftKey ? this.replacePrevious() : this.replaceNext(),
    );
    this.refs.replaceAllButton.addEventListener("click", this.replaceAll.bind(this));
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "search-panel:replace-previous": this.replacePrevious.bind(this),
        "search-panel:replace-next": this.replaceNext.bind(this),
        "search-panel:replace-current": this.replaceCurrent.bind(this),
        "search-panel:replace-all": this.replaceAll.bind(this),
      }),
    );

    this.subscriptions.add(
      atom.commands.add(this.findEditor.element, {
        "core:confirm": () => this.confirm(),
        "search-panel:confirm": () => this.confirm(),
        "search-panel:show-previous": () => this.showPrevious(),
      }),
    );

    this.subscriptions.add(
      atom.commands.add(this.replaceEditor.element, {
        "core:confirm": () => this.replaceNext(),
      }),
    );

    this.subscriptions.add(
      atom.commands.add(this.element, {
        "core:close": () => this.panel && this.panel.hide(),
        "core:cancel": () => this.panel && this.panel.hide(),
        "search-panel:focus-next": this.toggleFocus.bind(this),
        "search-panel:focus-previous": this.toggleFocus.bind(this),
        "search-panel:toggle-regex-option": this.toggleRegexOption.bind(this),
        "search-panel:toggle-case-option": this.toggleCaseOption.bind(this),
        "search-panel:toggle-selection-option": this.toggleSelectionOption.bind(this),
        "search-panel:toggle-whole-word-option": this.toggleWholeWordOption.bind(this),
        "search-panel:clear": this.clear.bind(this),
      }),
    );

    // Result events are subscribed per-target in subscribeToTarget(). Option
    // changes live on the shared FindOptions, so they are wired once here.
    this.subscriptions.add(
      this.target.getFindOptions().onDidChange(this.updateOptionViews.bind(this)),
    );
    this.subscriptions.add(
      this.target.getFindOptions().onDidChangeUseRegex(this.updateSyntaxHighlighting.bind(this)),
    );

    this.refs.closeButton.addEventListener("mousedown", (e) => e.preventDefault());
    this.refs.closeButton.addEventListener("click", () => this.panel && this.panel.hide());
    this.refs.regexOptionButton.addEventListener("click", this.toggleRegexOption.bind(this));
    this.refs.caseOptionButton.addEventListener("click", this.toggleCaseOption.bind(this));
    this.refs.selectionOptionButton.addEventListener(
      "click",
      this.toggleSelectionOption.bind(this),
    );
    this.refs.wholeWordOptionButton.addEventListener(
      "click",
      this.toggleWholeWordOption.bind(this),
    );

    this.element.addEventListener("focus", () => this.findEditor.element.focus());
    this.element.addEventListener("click", (e) => {
      if (e.target.tagName === "button") {
        let workspaceElement = atom.views.getView(atom.workspace);
        workspaceElement.focus();
      }
    });
  }

  focusFindEditor() {
    const activeEditor = atom.workspace.getCenter().getActiveTextEditor();
    let selectedText = activeEditor && activeEditor.getSelectedText();
    if (selectedText && selectedText.indexOf("\n") < 0) {
      if (this.target.getFindOptions().useRegex) {
        selectedText = Util.escapeRegex(selectedText);
      }
      this.findEditor.setText(selectedText);
    }
    this.findEditor.element.focus();
    this.findEditor.selectAll();
  }

  focusReplaceEditor() {
    const activeEditor = atom.workspace.getCenter().getActiveTextEditor();
    const selectedText = activeEditor && activeEditor.getSelectedText();
    if (selectedText && selectedText.indexOf("\n") < 0) {
      this.replaceEditor.setText(selectedText);
    }
    this.replaceEditor.getElement().focus();
    this.replaceEditor.selectAll();
  }

  toggleFocus() {
    if (this.findEditor.element.hasFocus()) {
      this.replaceEditor.element.focus();
    } else {
      this.findEditor.element.focus();
    }
  }

  confirm() {
    this.findNext({
      focusEditorAfter: atom.config.get("search-panel.focusEditorAfterSearch"),
    });
  }

  showPrevious() {
    this.findPrevious({
      focusEditorAfter: atom.config.get("search-panel.focusEditorAfterSearch"),
    });
  }

  liveSearch() {
    let findPattern = this.findEditor.getText();
    if (
      findPattern.length === 0 ||
      (findPattern.length >= atom.config.get("search-panel.liveSearchMinimumCharacters") &&
        !this.target.patternMatchesEmptyString(findPattern))
    ) {
      return this.target.search(findPattern);
    }
  }

  search(findPattern, options) {
    if (arguments.length === 1 && typeof findPattern === "object") {
      options = findPattern;
      findPattern = null;
    }
    if (findPattern == null) {
      findPattern = this.findEditor.getText();
    }
    this.target.search(findPattern, options);
  }

  findAll(options = { focusEditorAfter: true }) {
    this.navigate("all", options);
  }

  findNext(options = { focusEditorAfter: false }) {
    this.navigate("next", options);
  }

  findPrevious(options = { focusEditorAfter: false }) {
    this.navigate("previous", options);
  }

  // Run the current query and move the target's selection. `kind` is one of
  // "next" | "previous" | "first" | "all"; the target owns the actual
  // scroll/select/reveal and reports whether the move wrapped around.
  navigate(kind, { focusEditorAfter, fieldToFocus } = {}) {
    this.search();
    this.findHistoryCycler.store();

    if (this.target.getResultCount() > 0) {
      let result;
      switch (kind) {
        case "all":
          result = this.target.selectAll();
          break;
        case "previous":
          result = this.target.selectPrevious();
          break;
        case "first":
          result = this.target.selectFirstFromCursor();
          break;
        default:
          result = this.target.selectNext();
      }
      if (result && result.wrapped) {
        this.showWrapIcon(result.wrapped === "up" ? "icon-move-up" : "icon-move-down");
      }
      if (fieldToFocus) {
        fieldToFocus.getElement().focus();
      } else if (focusEditorAfter) {
        atom.views.getView(atom.workspace).focus();
      } else {
        this.findEditor.getElement().focus();
      }
    } else {
      atom.beep();
    }
  }

  replaceNext() {
    this.replace("next");
  }

  replacePrevious() {
    this.replace("previous");
  }

  replaceCurrent() {
    this.search();
    this.findHistoryCycler.store();
    this.replaceHistoryCycler.store();

    if (this.target.canReplace() && this.target.getResultCount() > 0) {
      this.target.replaceCurrentMatch(this.replaceEditor.getText(), "next");
    } else {
      atom.beep();
    }
  }

  replace(direction) {
    this.search();
    this.findHistoryCycler.store();
    this.replaceHistoryCycler.store();

    if (this.target.canReplace() && this.target.getResultCount() > 0) {
      this.target.replaceCurrentMatch(this.replaceEditor.getText(), direction);
      this.navigate(direction, { fieldToFocus: this.replaceEditor });
    } else {
      atom.beep();
    }
  }

  replaceAll() {
    this.search();
    if (this.target.canReplace() && this.target.getResultCount() > 0) {
      this.findHistoryCycler.store();
      this.replaceHistoryCycler.store();
      this.target.replaceAll(this.replaceEditor.getText());
    } else {
      atom.beep();
    }
  }

  markersUpdated(markers) {
    this.updateResultsUi(markers.length, { scrollToLiveResult: true });
  }

  updateResultsUi(results, { scrollToLiveResult = false } = {}) {
    this.updateResultCounter();
    this.updateFindEnablement();
    this.updateReplaceEnablement();

    if (this.target.getFindOptions().findPattern) {
      let resultsStr = results ? `${results} ${pluralize(results, "result")}` : "No results";
      this.element.classList.remove("has-results", "has-no-results");
      this.element.classList.add(results ? "has-results" : "has-no-results");
      this.setInfoMessage(`${resultsStr} found for '${this.target.getFindOptions().findPattern}'`);
      if (
        scrollToLiveResult &&
        this.findEditor.getElement().hasFocus() &&
        results > 0 &&
        atom.config.get("search-panel.scrollToResultOnLiveSearch")
      ) {
        this.navigate("first", { focusEditorAfter: false });
      }
    } else {
      this.clearMessage();
    }
  }

  findError(error) {
    this.setErrorMessage(error.message);
  }

  updateResultCounter() {
    let text;

    const total = this.target.getResultCount();
    const index = this.target.getCurrentResultIndex();
    if (index > -1) {
      text = `${index + 1} of ${total}`;
    } else if (total === 0) {
      text = "no results";
    } else if (total === 1) {
      text = "1 found";
    } else {
      text = `${total} found`;
    }

    this.refs.resultCounter.textContent = text;
  }

  setInfoMessage(infoMessage) {
    this.refs.descriptionLabel.textContent = infoMessage;
    this.refs.descriptionLabel.classList.remove("text-error");
  }

  setErrorMessage(errorMessage) {
    this.refs.descriptionLabel.textContent = errorMessage;
    this.refs.descriptionLabel.classList.add("text-error");
  }

  clearMessage() {
    this.element.classList.remove("has-results", "has-no-results");
    this.refs.descriptionLabel.innerHTML = "Find in Current Buffer";
    this.refs.descriptionLabel.classList.remove("text-error");
  }

  setSelectionAsFindPattern() {
    let findPattern = this.target.getSelectedText() || this.target.getWordUnderCursor();
    if (this.target.getFindOptions().useRegex) {
      findPattern = Util.escapeRegex(findPattern);
    }

    if (findPattern) {
      this.findEditor.setText(findPattern);
      this.findEditor.getElement().focus();
      this.findEditor.selectAll();
      this.search();
    }
  }

  setSelectionAsReplacePattern() {
    let replacePattern = this.target.getSelectedText() || this.target.getWordUnderCursor();

    if (replacePattern) {
      this.replaceEditor.setText(replacePattern);
      this.replaceEditor.getElement().focus();
      this.replaceEditor.selectAll();
    }
  }

  findNextSelected() {
    this.setSelectionAsFindPattern();
    this.findNext({ focusEditorAfter: true });
  }

  findPreviousSelected() {
    this.setSelectionAsFindPattern();
    this.findPrevious({ focusEditorAfter: true });
  }

  updateOptionViews() {
    this.updateOptionButtons();
    this.updateOptionsLabel();
  }

  updateSyntaxHighlighting() {
    if (this.target.getFindOptions().useRegex) {
      this.findEditor.setGrammar(atom.grammars.grammarForScopeName("source.js.regexp"));
      this.replaceEditor.setGrammar(
        atom.grammars.grammarForScopeName("source.js.regexp.replacement"),
      );
    } else {
      this.findEditor.setGrammar(atom.grammars.nullGrammar);
      this.replaceEditor.setGrammar(atom.grammars.nullGrammar);
    }
  }

  updateOptionsLabel() {
    const label = [];

    if (this.target.getFindOptions().useRegex) {
      label.push("Regex");
    }

    if (this.target.getFindOptions().caseSensitive) {
      label.push("Case Sensitive");
    } else {
      label.push("Case Insensitive");
    }

    if (this.target.getFindOptions().inCurrentSelection) {
      label.push("Within Current Selection");
    }

    if (this.target.getFindOptions().wholeWord) {
      label.push("Whole Word");
    }

    this.refs.optionsLabel.textContent = label.join(", ");
  }

  updateOptionButtons() {
    this.setOptionButtonState(this.refs.regexOptionButton, this.target.getFindOptions().useRegex);
    this.setOptionButtonState(
      this.refs.caseOptionButton,
      this.target.getFindOptions().caseSensitive,
    );
    this.setOptionButtonState(
      this.refs.selectionOptionButton,
      this.target.getFindOptions().inCurrentSelection,
    );
    this.setOptionButtonState(
      this.refs.wholeWordOptionButton,
      this.target.getFindOptions().wholeWord,
    );
  }

  setOptionButtonState(optionButton, selected) {
    if (selected) {
      optionButton.classList.add("selected");
    } else {
      optionButton.classList.remove("selected");
    }
  }

  anyMarkersAreSelected() {
    return this.target.hasSelectionMatchingResult();
  }

  toggleRegexOption() {
    this.search({ useRegex: !this.target.getFindOptions().useRegex });
    if (!this.anyMarkersAreSelected()) {
      this.target.selectNext();
    }
  }

  toggleCaseOption() {
    this.search({ caseSensitive: !this.target.getFindOptions().caseSensitive });
    if (!this.anyMarkersAreSelected()) {
      this.target.selectNext();
    }
  }

  toggleSelectionOption() {
    this.search({
      inCurrentSelection: !this.target.getFindOptions().inCurrentSelection,
    });

    if (this.target.isSelectionEmpty()) {
      this.target.selectNext();
    }
  }

  toggleWholeWordOption() {
    this.search(this.findEditor.getText(), {
      wholeWord: !this.target.getFindOptions().wholeWord,
    });
    if (!this.anyMarkersAreSelected()) {
      this.target.selectNext();
    }
  }

  clear() {
    this.findEditor.setText("");
    this.replaceEditor.setText("");
    this.findEditor.element.focus();
  }

  updateFindEnablement() {
    let usable = this.target.isUsable();
    let isDisabled = this.refs.findAllButton.classList.contains("disabled");
    let hadFindTooltip = !!this.findTooltipSubscriptions;

    if (hadFindTooltip) this.findTooltipSubscriptions.dispose();
    this.findTooltipSubscriptions = new CompositeDisposable();

    if (usable && (!hadFindTooltip || isDisabled)) {
      this.refs.findAllButton.classList.remove("disabled");
      this.refs.nextButton.classList.remove("disabled");

      this.findTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.nextButton, {
          title: "Find Next",
          keyBindingCommand: "search-panel:find-next",
          keyBindingTarget: this.findEditor.element,
        }),
      );
      this.findTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.findAllButton, {
          title: "Find All",
          keyBindingCommand: "search-panel:find-all",
          keyBindingTarget: this.findEditor.element,
        }),
      );
    } else if (!usable && (!hadFindTooltip || !isDisabled)) {
      this.refs.findAllButton.classList.add("disabled");
      this.refs.nextButton.classList.add("disabled");

      this.findTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.nextButton, {
          title: "Find Next [when in a text document]",
        }),
      );
      this.findTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.findAllButton, {
          title: "Find All [when in a text document]",
        }),
      );
    }
  }

  updateReplaceEnablement() {
    let canReplace = this.target.canReplace() && this.target.getResultCount() > 0;
    if (canReplace && !this.refs.replaceAllButton.classList.contains("disabled")) return;

    if (this.replaceTooltipSubscriptions) this.replaceTooltipSubscriptions.dispose();
    this.replaceTooltipSubscriptions = new CompositeDisposable();

    if (canReplace) {
      this.refs.replaceAllButton.classList.remove("disabled");
      this.refs.replaceNextButton.classList.remove("disabled");

      this.replaceTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.replaceNextButton, {
          title: "Replace Next",
          keyBindingCommand: "search-panel:replace-next",
          keyBindingTarget: this.replaceEditor.element,
        }),
      );
      this.replaceTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.replaceAllButton, {
          title: "Replace All",
          keyBindingCommand: "search-panel:replace-all",
          keyBindingTarget: this.replaceEditor.element,
        }),
      );
    } else {
      this.refs.replaceAllButton.classList.add("disabled");
      this.refs.replaceNextButton.classList.add("disabled");

      this.replaceTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.replaceNextButton, {
          title: "Replace Next [when there are results]",
        }),
      );
      this.replaceTooltipSubscriptions.add(
        atom.tooltips.add(this.refs.replaceAllButton, {
          title: "Replace All [when there are results]",
        }),
      );
    }
  }

  createWrapIcon() {
    this.wrapIcon = document.createElement("div");
  }

  showWrapIcon(icon) {
    if (!atom.config.get("search-panel.showSearchWrapIcon")) return;
    let host = this.target.getWrapIconHost();
    if (!host) return;

    host.appendChild(this.wrapIcon);

    this.wrapIcon.className = `find-wrap-icon ${icon} visible`;
    clearTimeout(this.wrapTimeout);
    this.wrapTimeout = setTimeout(() => this.wrapIcon.classList.remove("visible"), 500);
  }
};
