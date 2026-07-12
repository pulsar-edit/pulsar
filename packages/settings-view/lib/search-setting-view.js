/** @babel */
/** @jsx etch.dom */

import etch from "etch";
import _ from "underscore-plus";
import { Disposable, CompositeDisposable } from "atom";
import { getSettingDescription } from "./rich-description";
import { getSettingTitle } from "./rich-title";

export default class SearchSettingView {
  constructor(setting, settingsView, query = "") {
    this.settingsView = settingsView;
    this.setting = setting;
    this.query = query;
    this.disposables = new CompositeDisposable();

    etch.initialize(this);
    this.handleButtonEvents();
  }

  render() {
    const pathSegments = this.setting.path.split(".");
    const settingName = pathSegments[pathSegments.length - 1];
    const title = getSettingTitle(this.setting.path, settingName);
    const namespace = pathSegments[0];
    const namespaceLabel = this.getNamespaceLabel(namespace);
    const icon = this.getIcon(namespace);
    const description = getSettingDescription(this.setting.path);
    const metadata = atom.config.get("settings-view.searchSettingsMetadata")
      ? `${this.setting.rank.totalScore.toFixed(2)} search score`
      : "";

    return (
      <div className="search-result" role="listitem">
        <a ref="settingLink" className="search-result-link" href={this.getDestinationURI()}>
          <span className="search-result-heading">
            <span className="search-result-title">{this.highlightText(title)}</span>
            <span className="search-package-name">
              <span className={icon} />
              {namespaceLabel}
            </span>
          </span>
          <span className="search-id">
            {this.highlightText(this.setting.path)}
            {metadata ? ` · ${metadata}` : ""}
          </span>
        </a>
        {description ? <span className="search-description" innerHTML={description} /> : null}
      </div>
    );
  }

  update() {}

  destroy() {
    this.disposables.dispose();
    return etch.destroy(this);
  }

  getNamespaceLabel(namespace) {
    switch (namespace) {
      case "core":
        return "Core";
      case "editor":
        return "Editor";
      case "language":
        return "Languages";
      default:
        return _.undasherize(_.uncamelcase(namespace));
    }
  }

  getDestinationURI() {
    const path = this.setting.path;
    if (path === "core.themes") return "atom://config/themes";
    if (path === "core.disabledPackages") return "atom://config/packages";
    if (path === "core.uriHandlerRegistration") return "atom://config/uri-handling";

    const namespace = path.split(".")[0];
    if (namespace === "core") return "atom://config/core";
    if (namespace === "editor") return "atom://config/editor";
    if (namespace === "language") return "atom://config/languages";
    return `atom://config/packages/${namespace}`;
  }

  highlightText(text) {
    if (!text || !this.query) return text || "";
    const terms = this.query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    if (terms.length === 0) return text;

    const expression = new RegExp(`(${terms.map(this.escapeRegExp).join("|")})`, "ig");
    return text.split(expression).map((part, index) => {
      const matched = terms.some((term) => term.toLowerCase() === part.toLowerCase());
      return matched ? <mark key={index}>{part}</mark> : part;
    });
  }

  escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  getIcon(namespace) {
    switch (namespace) {
      case "core":
        return "icon icon-settings search-result-icon";
      case "editor":
        return "icon icon-code search-result-icon";
      case "language":
        return "icon icon-globe search-result-icon";
      default:
        return "icon icon-package search-result-icon";
    }
  }

  handleButtonEvents() {
    const settingsClickHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.settingsView && typeof this.settingsView.openSetting === "function") {
        this.settingsView.openSetting(this.setting.path);
      } else {
        atom.workspace.open(this.getDestinationURI());
      }
    };

    this.refs.settingLink.addEventListener("click", settingsClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.settingLink.removeEventListener("click", settingsClickHandler);
      }),
    );
  }
}
