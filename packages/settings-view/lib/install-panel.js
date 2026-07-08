/** @babel */
/** @jsx etch.dom */

import path from "path";
import etch from "etch";
import hostedGitInfo from "hosted-git-info";

import { CompositeDisposable, TextEditor } from "atom";

import PackageCard from "./package-card";
import ErrorView from "./error-view";

const PackageNameRegex = /config\/install\/(package|theme):([a-z0-9-_]+)/i;

export default class InstallPanel {
  constructor(settingsView, packageManager) {
    this.settingsView = settingsView;
    this.packageManager = packageManager;
    this.disposables = new CompositeDisposable();
    this.client = this.packageManager.getClient();
    this.atomIoURL = "https://github.com";

    etch.initialize(this);

    this.refs.searchMessage.style.display = "none";

    this.refs.searchEditor.setPlaceholderText("GitHub repository");
    this.searchType = "packages";
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

        if (gitUrlInfo && gitUrlInfo === pack.gitUrlInfo) {
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

    this.loadFeaturedPackages();
  }

  destroy() {
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
              <span ref="publishedToText">Packages are installed from </span>
              <a className="link" onclick={this.didClickOpenAtomIo.bind(this)}>
                GitHub
              </a>
              <span> and are installed to {path.join(process.env.ATOM_HOME, "packages")}</span>
            </div>

            <div className="search-container clearfix">
              <div className="editor-container">
                <TextEditor mini ref="searchEditor" />
              </div>
              <div className="btn-group">
                <button
                  ref="searchPackagesButton"
                  className="btn btn-default selected"
                  onclick={this.didClickSearchPackagesButton.bind(this)}
                >
                  Packages
                </button>
                <button
                  ref="searchThemesButton"
                  className="btn btn-default"
                  onclick={this.didClickSearchThemesButton.bind(this)}
                >
                  Themes
                </button>
              </div>
            </div>

            <div ref="searchErrors" />
            <div ref="searchMessage" className="alert alert-info search-message icon icon-search" />
            <div ref="resultsContainer" className="container package-container" />
          </div>
        </div>

        <div className="section packages">
          <div className="section-container">
            <div ref="featuredHeading" className="section-heading icon icon-star" />
            <div ref="featuredErrors" />
            <div ref="loadingMessage" className="alert alert-info icon icon-hourglass" />
            <div ref="featuredContainer" className="container package-container" />
          </div>
        </div>
      </div>
    );
  }

  setSearchType(searchType) {
    if (searchType === "theme") {
      this.searchType = "themes";
      this.refs.searchThemesButton.classList.add("selected");
      this.refs.searchPackagesButton.classList.remove("selected");
      this.refs.searchEditor.setPlaceholderText("GitHub repository");
      this.refs.publishedToText.textContent = "Themes are installed from ";
      this.atomIoURL = "https://github.com";
      this.loadFeaturedPackages(true);
    } else if (searchType === "package") {
      this.searchType = "packages";
      this.refs.searchPackagesButton.classList.add("selected");
      this.refs.searchThemesButton.classList.remove("selected");
      this.refs.searchEditor.setPlaceholderText("GitHub repository");
      this.refs.publishedToText.textContent = "Packages are installed from ";
      this.atomIoURL = "https://github.com";
      this.loadFeaturedPackages();
    }
  }

  beforeShow(options) {
    if (options && options.uri) {
      const query = this.extractQueryFromURI(options.uri);
      if (query != null) {
        const { searchType, packageName } = query;
        this.setSearchType(searchType);
        this.refs.searchEditor.setText(packageName);
        this.performSearch();
      }
    }
  }

  extractQueryFromURI(uri) {
    const matches = PackageNameRegex.exec(uri);
    if (matches) {
      const [, searchType, packageName] = Array.from(matches);
      return { searchType, packageName };
    } else {
      return null;
    }
  }

  performSearch() {
    const query = this.refs.searchEditor.getText().trim().toLowerCase();
    if (query) {
      this.performSearchForQuery(query);
    }
  }

  performSearchForQuery(query) {
    const gitUrlInfo = hostedGitInfo.fromUrl(query);
    if (gitUrlInfo && gitUrlInfo.type === "github") {
      const type = gitUrlInfo.default;
      if (type === "sshurl" || type === "https" || type === "shortcut") {
        this.showGitInstallPackageCard({ name: query, gitUrlInfo });
      }
    } else {
      this.showGitHubOnlyMessage(query);
    }
  }

  showGitHubOnlyMessage(query) {
    if (this.currentGitPackageCard) {
      this.currentGitPackageCard.destroy();
      this.currentGitPackageCard = null;
    }

    this.refs.resultsContainer.innerHTML = "";
    this.refs.searchMessage.textContent = `Enter a GitHub repository such as owner/repo or https://github.com/owner/repo`;
    this.refs.searchMessage.style.display = "";
  }

  showGitInstallPackageCard(pack) {
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
    this.refs.resultsContainer.innerHTML = "";
    this.addPackageCardView(this.refs.resultsContainer, this.currentGitPackageCard);
  }

  async search(query) {
    this.refs.resultsContainer.innerHTML = "";
    this.refs.searchMessage.textContent = `Enter a GitHub repository such as owner/repo or https://github.com/owner/repo`;
    this.refs.searchMessage.style.display = "";
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

  filterPackages(packages, themes) {
    return packages.filter(({ theme }) => (themes ? theme : !theme));
  }

  // Load and display the featured packages that are available to install.
  loadFeaturedPackages(loadThemes) {
    if (loadThemes == null) {
      loadThemes = false;
    }
    this.refs.featuredContainer.innerHTML = "";

    if (loadThemes) {
      this.refs.installHeading.textContent = "Install Themes";
      this.refs.featuredHeading.textContent = "GitHub Themes";
      this.refs.loadingMessage.textContent = "Enter a GitHub repository above.";
    } else {
      this.refs.installHeading.textContent = "Install Packages";
      this.refs.featuredHeading.textContent = "GitHub Packages";
      this.refs.loadingMessage.textContent = "Enter a GitHub repository above.";
    }

    this.refs.loadingMessage.style.display = "";
  }

  didClickOpenAtomIo(event) {
    event.preventDefault();
    atom.openExternal(this.atomIoURL);
  }

  didClickSearchPackagesButton() {
    if (!this.refs.searchPackagesButton.classList.contains("selected")) {
      this.setSearchType("package");
    }

    this.performSearch();
  }

  didClickSearchThemesButton() {
    if (!this.refs.searchThemesButton.classList.contains("selected")) {
      this.setSearchType("theme");
    }

    this.performSearch();
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
