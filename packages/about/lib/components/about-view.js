const { Disposable } = require("atom");
const etch = require("etch");
const LumineLogo = require("./lumine-logo");
const EtchComponent = require("../etch-component");

const $ = etch.dom;

module.exports = class AboutView extends EtchComponent {
  handleAtomVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentAtomVersion);
  }

  handleElectronVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentElectronVersion);
  }

  handleChromeVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentChromeVersion);
  }

  handleNodeVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentNodeVersion);
  }

  handleReleaseNotesClick(e) {
    e.preventDefault();
    atom.openExternal(this.props.updateManager.getReleaseNotesURLForCurrentVersion());
  }

  handleLicenseClick(e) {
    e.preventDefault();
    atom.commands.dispatch(atom.views.getView(atom.workspace), "application:open-license");
  }

  handleDocumentationClick(e) {
    e.preventDefault();
    atom.commands.dispatch(atom.views.getView(atom.workspace), "application:open-documentation");
  }

  executeUpdateAction(e) {
    e.preventDefault();
    atom.commands.dispatch(atom.views.getView(atom.workspace), "lumine-updater:check-for-update");
  }

  handleShowOnStartupChange(e) {
    atom.config.set("about.showOnStartup", e.target.checked);
  }

  render() {
    return $.div(
      { className: "pane-item native-key-bindings about" },
      $.div(
        { className: "about-container min-width-min-content" },
        $.header(
          { className: "about-header" },
          $.a({ className: "about-atom-io", href: `${atom.branding.urlWeb}` }, $(LumineLogo)),
          $.h1({ className: "about-title" }, `${atom.branding.name}`),
          $.div(
            { className: "about-subtitle" },
            "A modern, extensible editor built on the Pulsar and Atom legacy.",
          ),
          $.div(
            { className: "about-header-info" },
            $.span(
              {
                className: "about-version-container atom",
                onclick: this.handleAtomVersionClick.bind(this),
              },
              $.span(
                { className: "about-version" },
                `Lumine: ${this.props.currentAtomVersion} ${process.arch}`,
              ),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
            $.span(
              {
                className: "about-version-container electron",
                onclick: this.handleElectronVersionClick.bind(this),
              },
              $.span(
                { className: "about-version" },
                `Electron: ${this.props.currentElectronVersion}`,
              ),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
            $.span(
              {
                className: "about-version-container chrome",
                onclick: this.handleChromeVersionClick.bind(this),
              },
              $.span({ className: "about-version" }, `Chrome: ${this.props.currentChromeVersion}`),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
            $.span(
              {
                className: "about-version-container node",
                onclick: this.handleNodeVersionClick.bind(this),
              },
              $.span({ className: "about-version" }, `Node: ${this.props.currentNodeVersion}`),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
          ),
        ),
      ),

      $.div(
        { className: "about-actions group-start min-width-min-content" },
        $.div(
          { className: "btn-group" },
          $.button(
            {
              className: "btn view-license",
              onclick: this.handleLicenseClick.bind(this),
            },
            "License",
          ),
          $.button(
            {
              className: "btn about-documentation-button",
              onclick: this.handleDocumentationClick.bind(this),
            },
            "Documentation",
          ),
          $.button(
            {
              className: "btn about-release-notes-button",
              onclick: this.handleReleaseNotesClick.bind(this),
            },
            "Release Notes",
          ),
          this.renderUpdateChecker(),
        ),
      ),

      $.div(
        { className: "about-love group-start" },
        $.a({ className: "icon icon-code" }),
        $.span({ className: "about-team-text" }, "Made by Lumine Team"),
        $.a({ className: "icon icon-code" }),
      ),

      $.div(
        { className: "about-startup" },
        $.label(
          { className: "about-startup-label" },
          $.input({
            className: "input-checkbox",
            type: "checkbox",
            checked: atom.config.get("about.showOnStartup"),
            onchange: this.handleShowOnStartupChange.bind(this),
          }),
          " Show when opening Lumine",
        ),
      ),
    );
  }

  renderUpdateChecker() {
    if (atom.packages.isPackageDisabled("lumine-updater")) {
      return $.div(
        { className: "about-updates-item app-unsupported" },
        $.span(
          { className: "about-updates-label is-strong" },
          "Enable `lumine-updater` to check for updates",
        ),
      );
    } else {
      return $.button(
        {
          className: "btn about-update-action-button",
          onclick: this.executeUpdateAction.bind(this),
        },
        "Check for updates",
      );
    }
  }

  serialize() {
    return {
      deserializer: this.constructor.name,
      uri: this.props.uri,
    };
  }

  getURI() {
    return this.props.uri;
  }

  destroy() {
    this.destroyed = true;
    super.destroy();
  }

  isDestroyed() {
    return this.destroyed === true;
  }

  onDidChangeTitle() {
    return new Disposable();
  }

  onDidChangeModified() {
    return new Disposable();
  }

  getTitle() {
    return "About";
  }

  getIconName() {
    return "info";
  }
};
