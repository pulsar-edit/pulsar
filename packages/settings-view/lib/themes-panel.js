/** @babel */
/** @jsx etch.dom */

import etch from "etch";
import _ from "underscore-plus";
import { CompositeDisposable, TextEditor } from "atom";

import CollapsibleSectionPanel from "./collapsible-section-panel";
import PackageCard from "./package-card";
import ErrorView from "./error-view";

import List from "./list";
import ListView from "./list-view";
import { ownerFromRepository, packageComparatorAscending } from "./utils";

export default class ThemesPanel extends CollapsibleSectionPanel {
  static loadPackagesDelay() {
    return 300;
  }

  constructor(settingsView, packageManager) {
    super();

    this.settingsView = settingsView;
    this.packageManager = packageManager;
    etch.initialize(this);
    this.items = {
      dev: new List("name"),
      core: new List("name"),
      community: new List("name"),
    };
    this.itemViews = {
      dev: new ListView(this.items.dev, this.refs.devPackages, this.createPackageCard.bind(this)),
      core: new ListView(
        this.items.core,
        this.refs.corePackages,
        this.createPackageCard.bind(this),
      ),
      community: new ListView(
        this.items.community,
        this.refs.communityPackages,
        this.createPackageCard.bind(this),
      ),
    };

    this.disposables = new CompositeDisposable();
    this.disposables.add(
      this.packageManager.on("theme-install-failed theme-uninstall-failed", ({ error }) => {
        this.refs.themeErrors.appendChild(new ErrorView(this.packageManager, error).element);
      }),
    );
    this.disposables.add(this.handleEvents());
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
    this.loadPackages();

    let loadPackagesTimeout;
    this.disposables.add(
      this.packageManager.on("theme-installed theme-uninstalled", () => {
        clearTimeout(loadPackagesTimeout);
        loadPackagesTimeout = setTimeout(() => {
          this.populateThemeMenus();
          this.loadPackages();
        }, ThemesPanel.loadPackagesDelay());
      }),
    );

    this.disposables.add(atom.themes.onDidChangeActiveThemes(() => this.updateActiveThemes()));
    for (const ref of [
      "lightUiThemeSettings",
      "lightSyntaxThemeSettings",
      "darkUiThemeSettings",
      "darkSyntaxThemeSettings",
    ]) {
      this.disposables.add(atom.tooltips.add(this.refs[ref], { title: "Settings" }));
    }
    this.updateActiveThemes();
    this.disposables.add(
      atom.config.onDidChange("core.themeMode", () => this.updateThemeSelections()),
      atom.config.onDidChange("core.themesLight", () => this.updateThemeSelections()),
      atom.config.onDidChange("core.themesDark", () => this.updateThemeSelections()),
    );

    this.disposables.add(
      this.refs.filterEditor.onDidStopChanging(() => {
        this.matchPackages();
      }),
    );
  }

  update() {}

  focus() {
    this.refs.filterEditor.element.focus();
  }

  show() {
    this.element.style.display = "";
  }

  destroy() {
    this.disposables.dispose();
    return etch.destroy(this);
  }

  render() {
    return (
      <div className="panels-item" tabIndex="-1">
        <div className="section packages themes-panel">
          <div className="section-container">
            <div className="section-heading icon icon-paintcan">Choose a Theme</div>

            <div className="text native-key-bindings" tabIndex="-1">
              <span className="icon icon-question">You can also style Lumine by editing </span>
              <a className="link" onclick={this.didClickOpenUserStyleSheet}>
                your stylesheet
              </a>
            </div>

            <div className="themes-picker">
              <div className="themes-picker-item theme-mode-item control-group">
                <div className="controls">
                  <label className="control-label">
                    <div className="setting-title themes-label text">Theme Mode</div>
                    <div className="setting-description text theme-description">
                      Follow the system light/dark preference or force one
                    </div>
                  </label>
                  <div className="select-container">
                    <select
                      ref="modeMenu"
                      className="form-control"
                      onchange={this.didChangeModeMenu.bind(this)}
                    >
                      <option value="system">Follow System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="themes-picker-item theme-pair control-group">
                <div className="controls">
                  <label className="control-label">
                    <div className="setting-title themes-label text">
                      Light Themes
                      <span
                        ref="lightActiveBadge"
                        className="badge badge-flexible theme-active-badge"
                      >
                        active
                      </span>
                    </div>
                    <div className="setting-description text theme-description">
                      UI and syntax themes used when the light mode is in effect
                    </div>
                  </label>
                  <div className="theme-pair-select">
                    <div className="setting-description text theme-description">UI Theme</div>
                    <div className="select-container">
                      <select
                        ref="lightUiMenu"
                        className="form-control"
                        onchange={this.didChangeThemeMenu.bind(this)}
                      />
                      <button
                        ref="lightUiThemeSettings"
                        className="btn icon icon-gear active-theme-settings light-ui-theme-settings"
                        onclick={this.didClickThemeSettings.bind(this, "lightUiMenu")}
                      />
                    </div>
                  </div>
                  <div className="theme-pair-select">
                    <div className="setting-description text theme-description">Syntax Theme</div>
                    <div className="select-container">
                      <select
                        ref="lightSyntaxMenu"
                        className="form-control"
                        onchange={this.didChangeThemeMenu.bind(this)}
                      />
                      <button
                        ref="lightSyntaxThemeSettings"
                        className="btn icon icon-gear active-theme-settings light-syntax-theme-settings"
                        onclick={this.didClickThemeSettings.bind(this, "lightSyntaxMenu")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="themes-picker-item theme-pair control-group">
                <div className="controls">
                  <label className="control-label">
                    <div className="setting-title themes-label text">
                      Dark Themes
                      <span
                        ref="darkActiveBadge"
                        className="badge badge-flexible theme-active-badge"
                      >
                        active
                      </span>
                    </div>
                    <div className="setting-description text theme-description">
                      UI and syntax themes used when the dark mode is in effect
                    </div>
                  </label>
                  <div className="theme-pair-select">
                    <div className="setting-description text theme-description">UI Theme</div>
                    <div className="select-container">
                      <select
                        ref="darkUiMenu"
                        className="form-control"
                        onchange={this.didChangeThemeMenu.bind(this)}
                      />
                      <button
                        ref="darkUiThemeSettings"
                        className="btn icon icon-gear active-theme-settings dark-ui-theme-settings"
                        onclick={this.didClickThemeSettings.bind(this, "darkUiMenu")}
                      />
                    </div>
                  </div>
                  <div className="theme-pair-select">
                    <div className="setting-description text theme-description">Syntax Theme</div>
                    <div className="select-container">
                      <select
                        ref="darkSyntaxMenu"
                        className="form-control"
                        onchange={this.didChangeThemeMenu.bind(this)}
                      />
                      <button
                        ref="darkSyntaxThemeSettings"
                        className="btn icon icon-gear active-theme-settings dark-syntax-theme-settings"
                        onclick={this.didClickThemeSettings.bind(this, "darkSyntaxMenu")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="section">
          <div className="section-container">
            <div className="section-heading icon icon-paintcan">
              Installed Themes
              <span ref="totalPackages" className="section-heading-count badge badge-flexible">
                â€¦
              </span>
            </div>
            <div className="editor-container">
              <TextEditor ref="filterEditor" mini placeholderText="Filter themes by name" />
            </div>

            <div ref="themeErrors" />

            <section className="sub-section installed-packages">
              <h3 ref="communityThemesHeader" className="sub-section-heading icon icon-paintcan">
                Community Themes
                <span ref="communityCount" className="section-heading-count badge badge-flexible">
                  â€¦
                </span>
              </h3>
              <div ref="communityPackages" className="container package-container">
                <div
                  ref="communityLoadingArea"
                  className="alert alert-info loading-area icon icon-hourglass"
                >
                  Loading themesâ€¦
                </div>
              </div>
            </section>

            <section className="sub-section core-packages">
              <h3 ref="coreThemesHeader" className="sub-section-heading icon icon-paintcan">
                Bundled Themes
                <span ref="coreCount" className="section-heading-count badge badge-flexible">
                  â€¦
                </span>
              </h3>
              <div ref="corePackages" className="container package-container">
                <div
                  ref="coreLoadingArea"
                  className="alert alert-info loading-area icon icon-hourglass"
                >
                  Loading themesâ€¦
                </div>
              </div>
            </section>

            <section className="sub-section dev-packages">
              <h3 ref="developmentThemesHeader" className="sub-section-heading icon icon-paintcan">
                Development Themes
                <span ref="devCount" className="section-heading-count badge badge-flexible">
                  â€¦
                </span>
              </h3>
              <div ref="devPackages" className="container package-container">
                <div
                  ref="devLoadingArea"
                  className="alert alert-info loading-area icon icon-hourglass"
                >
                  Loading themesâ€¦
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    );
  }

  filterThemes(packages) {
    packages.dev = packages.dev.filter(({ theme }) => theme);
    packages.user = packages.user.filter(({ theme }) => theme);
    packages.core = packages.core.filter(({ theme }) => theme);
    packages.git = (packages.git || []).filter(({ theme }) => theme);
    packages.community = packages.user.concat(packages.git);

    for (let packageType of ["dev", "core", "community"]) {
      for (let pack of packages[packageType]) {
        pack.owner = ownerFromRepository(pack.repository);
      }
    }
    return packages;
  }

  sortThemes(packages) {
    packages.dev.sort(packageComparatorAscending);
    packages.core.sort(packageComparatorAscending);
    packages.community.sort(packageComparatorAscending);
    return packages;
  }

  loadPackages() {
    this.packageViews = [];
    this.packageManager
      .getInstalled()
      .then((packages) => {
        this.packages = this.sortThemes(this.filterThemes(packages));

        this.refs.devLoadingArea.remove();
        this.items.dev.setItems(this.packages.dev);

        this.refs.coreLoadingArea.remove();
        this.items.core.setItems(this.packages.core);

        this.refs.communityLoadingArea.remove();
        this.items.community.setItems(this.packages.community);

        // TODO show empty mesage per section

        this.updateSectionCounts();
      })
      .catch((error) => {
        this.refs.themeErrors.appendChild(new ErrorView(this.packageManager, error).element);
      });
  }

  // Repopulate the theme menus and reflect the configured selections.
  updateActiveThemes() {
    this.populateThemeMenus();
  }

  hasSettings(packageName) {
    return this.packageManager.packageHasSettings(packageName);
  }

  // Populate the theme menus from the loaded themes.
  populateThemeMenus() {
    const uiMenus = [this.refs.lightUiMenu, this.refs.darkUiMenu];
    const syntaxMenus = [this.refs.lightSyntaxMenu, this.refs.darkSyntaxMenu];
    for (const menu of uiMenus.concat(syntaxMenus)) {
      menu.innerHTML = "";
    }

    const availableThemes = _.sortBy(atom.themes.getLoadedThemes(), "name");
    for (let { name, metadata } of availableThemes) {
      const menus =
        metadata.theme === "ui" ? uiMenus : metadata.theme === "syntax" ? syntaxMenus : [];
      for (const menu of menus) {
        menu.appendChild(this.createThemeMenuItem(name));
      }
    }

    this.updateThemeSelections();
  }

  // Reflect the mode and theme pair settings in the pickers.
  updateThemeSelections() {
    this.refs.modeMenu.value = atom.config.get("core.themeMode");

    const lightPair = atom.config.get("core.themesLight") || [];
    const darkPair = atom.config.get("core.themesDark") || [];
    this.refs.lightUiMenu.value = this.themeOfTypeFromPair(lightPair, "ui") || "";
    this.refs.lightSyntaxMenu.value = this.themeOfTypeFromPair(lightPair, "syntax") || "";
    this.refs.darkUiMenu.value = this.themeOfTypeFromPair(darkPair, "ui") || "";
    this.refs.darkSyntaxMenu.value = this.themeOfTypeFromPair(darkPair, "syntax") || "";

    const dark = atom.themes.isDarkThemeMode();
    this.refs.lightActiveBadge.style.display = dark ? "none" : "";
    this.refs.darkActiveBadge.style.display = dark ? "" : "none";

    this.updateThemeSettingsButtons();
  }

  // Pick the theme of the given type ("ui" or "syntax") out of a pair array.
  themeOfTypeFromPair(pair, type) {
    for (const name of pair) {
      const pack = atom.packages.getLoadedPackage(name);
      if (pack && pack.metadata && pack.metadata.theme === type) {
        return name;
      }
    }
    return type === "ui" ? pair[0] : pair[1];
  }

  updateThemeSettingsButtons() {
    const buttonsByMenu = [
      ["lightUiMenu", "lightUiThemeSettings"],
      ["lightSyntaxMenu", "lightSyntaxThemeSettings"],
      ["darkUiMenu", "darkUiThemeSettings"],
      ["darkSyntaxMenu", "darkSyntaxThemeSettings"],
    ];
    for (const [menuRef, buttonRef] of buttonsByMenu) {
      const themeName = this.refs[menuRef].value;
      this.refs[buttonRef].style.display = themeName && this.hasSettings(themeName) ? "" : "none";
    }
  }

  // Update the config with the selected theme pairs.
  updateThemeConfig() {
    const lightPair = [this.refs.lightUiMenu.value, this.refs.lightSyntaxMenu.value].filter(
      Boolean,
    );
    const darkPair = [this.refs.darkUiMenu.value, this.refs.darkSyntaxMenu.value].filter(Boolean);
    if (lightPair.length > 0) {
      atom.config.set("core.themesLight", lightPair);
    }
    if (darkPair.length > 0) {
      atom.config.set("core.themesDark", darkPair);
    }
  }

  scheduleUpdateThemeConfig() {
    setTimeout(() => {
      this.updateThemeConfig();
    }, 100);
  }

  // Create a menu item for the given theme name.
  createThemeMenuItem(themeName) {
    const title = _.undasherize(
      _.uncamelcase(themeName.replace(/-(ui|syntax)/g, "").replace(/-theme$/g, "")),
    );
    const option = document.createElement("option");
    option.value = themeName;
    option.textContent = title;
    return option;
  }

  createPackageCard(pack) {
    return new PackageCard(pack, this.settingsView, this.packageManager, { back: "Themes" });
  }

  filterPackageListByText(text) {
    if (!this.packages) {
      return;
    }

    for (let packageType of ["dev", "core", "community"]) {
      const allViews = this.itemViews[packageType].getViews();
      const activeViews = this.itemViews[packageType].filterViews((pack) => {
        if (text === "") {
          return true;
        } else {
          const owner = pack.owner != null ? pack.owner : ownerFromRepository(pack.repository);
          const filterText = `${pack.name} ${owner}`;
          return atom.ui.fuzzyMatcher.score(filterText, text) > 0;
        }
      });

      for (const view of allViews) {
        if (view) {
          view.element.style.display = "none";
          view.element.classList.add("hidden");
        }
      }

      for (const view of activeViews) {
        if (view) {
          view.element.style.display = "";
          view.element.classList.remove("hidden");
        }
      }
    }

    this.updateSectionCounts();
  }

  updateUnfilteredSectionCounts() {
    this.updateSectionCount(
      this.refs.communityThemesHeader,
      this.refs.communityCount,
      this.packages.community.length,
    );
    this.updateSectionCount(
      this.refs.coreThemesHeader,
      this.refs.coreCount,
      this.packages.core.length,
    );
    this.updateSectionCount(
      this.refs.developmentThemesHeader,
      this.refs.devCount,
      this.packages.dev.length,
    );
    this.refs.totalPackages.textContent = `${this.packages.community.length + this.packages.core.length + this.packages.dev.length}`;
  }

  updateFilteredSectionCounts() {
    const community = this.notHiddenCardsLength(this.refs.communityPackages);
    this.updateSectionCount(
      this.refs.communityThemesHeader,
      this.refs.communityCount,
      community,
      this.packages.community.length,
    );

    const dev = this.notHiddenCardsLength(this.refs.devPackages);
    this.updateSectionCount(
      this.refs.developmentThemesHeader,
      this.refs.devCount,
      dev,
      this.packages.dev.length,
    );

    const core = this.notHiddenCardsLength(this.refs.corePackages);
    this.updateSectionCount(
      this.refs.coreThemesHeader,
      this.refs.coreCount,
      core,
      this.packages.core.length,
    );

    const shownThemes = dev + core + community;
    const totalThemes =
      this.packages.community.length + this.packages.core.length + this.packages.dev.length;
    this.refs.totalPackages.textContent = `${shownThemes}/${totalThemes}`;
  }

  resetSectionHasItems() {
    this.resetCollapsibleSections([
      this.refs.communityThemesHeader,
      this.refs.coreThemesHeader,
      this.refs.developmentThemesHeader,
    ]);
  }

  matchPackages() {
    this.filterPackageListByText(this.refs.filterEditor.getText());
  }

  didClickOpenUserStyleSheet(e) {
    e.preventDefault();
    atom.commands.dispatch(atom.views.getView(atom.workspace), "application:open-your-stylesheet");
  }

  didChangeModeMenu() {
    atom.config.set("core.themeMode", this.refs.modeMenu.value);
  }

  didChangeThemeMenu() {
    this.updateThemeSettingsButtons();
    this.scheduleUpdateThemeConfig();
  }

  didClickThemeSettings(menuRef, event) {
    event.stopPropagation();
    const themeName = this.refs[menuRef].value;
    const pack = atom.packages.getLoadedPackage(themeName);
    if (pack != null) {
      this.settingsView.showPanel(themeName, {
        back: "Themes",
        pack: pack.metadata,
      });
    }
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
