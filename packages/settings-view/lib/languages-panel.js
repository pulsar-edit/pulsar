/** @babel */
/** @jsx etch.dom */

import { CompositeDisposable, Disposable } from "atom";
import etch from "etch";
import SettingsPanel from "./settings-panel";

const DEFAULTS_VALUE = "";

// Panel with a language picker and the `language` namespace settings for the
// chosen scope: the global defaults, or per-grammar overrides stored as
// scoped settings.
export default class LanguagesPanel {
  constructor() {
    etch.initialize(this);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
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

    this.selectedScopeName = DEFAULTS_VALUE;
    this.populateLanguageSelect();
    this.subscriptions.add(
      atom.grammars.onDidAddGrammar(() => this.populateLanguageSelect()),
      atom.grammars.onDidUpdateGrammar(() => this.populateLanguageSelect()),
    );

    const changeHandler = () => {
      this.selectedScopeName = this.refs.languageSelect.value;
      this.showSettingsForSelection();
    };
    this.refs.languageSelect.addEventListener("change", changeHandler);
    this.subscriptions.add(
      new Disposable(() => this.refs.languageSelect.removeEventListener("change", changeHandler)),
    );

    this.showSettingsForSelection();
  }

  destroy() {
    this.subscriptions.dispose();
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
    }
    return etch.destroy(this);
  }

  update() {}

  render() {
    return (
      <div tabIndex="0" className="panels-item languages-panel">
        <section className="section">
          <div className="section-container">
            <div className="block section-heading icon icon-globe">Languages</div>
            <div className="text icon icon-question" tabIndex="-1">
              Language-specific editor settings. Pick a language to override the defaults for files
              of that language; empty fields inherit the default value.
            </div>
            <div className="control-group languages-picker">
              <div className="controls">
                <label className="control-label">
                  <div className="setting-title">Language</div>
                </label>
                <select ref="languageSelect" className="form-control" />
              </div>
            </div>
            <div
              ref="grammarInfo"
              className="text native-key-bindings languages-grammar-info"
              tabIndex="-1"
            />
            <div ref="settingsContainer" />
          </div>
        </section>
      </div>
    );
  }

  getDisplayableGrammars() {
    const grammars = atom.grammars.getGrammars({ includeTreeSitter: true }).filter((grammar) => {
      return grammar !== atom.grammars.nullGrammar && grammar.name && grammar.scopeName;
    });
    grammars.sort((a, b) => a.name.localeCompare(b.name));

    const seenScopeNames = new Set();
    return grammars.filter((grammar) => {
      if (seenScopeNames.has(grammar.scopeName)) return false;
      seenScopeNames.add(grammar.scopeName);
      return true;
    });
  }

  grammarForScopeName(scopeName) {
    return this.getDisplayableGrammars().find((grammar) => grammar.scopeName === scopeName);
  }

  populateLanguageSelect() {
    const select = this.refs.languageSelect;
    select.innerHTML = "";

    const defaultsOption = document.createElement("option");
    defaultsOption.value = DEFAULTS_VALUE;
    defaultsOption.textContent = "All Languages (defaults)";
    select.appendChild(defaultsOption);

    for (const grammar of this.getDisplayableGrammars()) {
      const option = document.createElement("option");
      option.value = grammar.scopeName;
      option.textContent = grammar.name;
      select.appendChild(option);
    }

    if (
      this.selectedScopeName !== DEFAULTS_VALUE &&
      !this.grammarForScopeName(this.selectedScopeName)
    ) {
      this.selectedScopeName = DEFAULTS_VALUE;
      this.showSettingsForSelection();
    }
    select.value = this.selectedScopeName;
  }

  showSettingsForSelection() {
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
    }

    const grammar =
      this.selectedScopeName === DEFAULTS_VALUE
        ? null
        : this.grammarForScopeName(this.selectedScopeName);
    this.updateGrammarInfo(grammar);

    if (grammar) {
      this.settingsPanel = new SettingsPanel({
        title: grammar.name,
        scopeName: `.${grammar.scopeName}`,
        icon: "code",
      });
    } else {
      this.settingsPanel = new SettingsPanel({
        namespace: "language",
        title: "Defaults",
        icon: "gear",
      });
    }
    this.refs.settingsContainer.appendChild(this.settingsPanel.element);
  }

  updateGrammarInfo(grammar) {
    const info = this.refs.grammarInfo;
    info.innerHTML = "";
    if (!grammar) {
      info.style.display = "none";
      return;
    }
    info.style.display = "";

    const scopeDiv = document.createElement("div");
    const scopeStrong = document.createElement("strong");
    scopeStrong.textContent = "Scope: ";
    scopeDiv.appendChild(scopeStrong);
    scopeDiv.appendChild(document.createTextNode(grammar.scopeName));
    info.appendChild(scopeDiv);

    const fileTypes = grammar.fileTypes || [];
    if (fileTypes.length > 0) {
      const fileTypesDiv = document.createElement("div");
      const fileTypesStrong = document.createElement("strong");
      fileTypesStrong.textContent = "File Types: ";
      fileTypesDiv.appendChild(fileTypesStrong);
      fileTypesDiv.appendChild(document.createTextNode(fileTypes.join(", ")));
      info.appendChild(fileTypesDiv);
    }
  }

  focus() {
    this.element.focus();
  }

  show() {
    this.element.style.display = "";
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
