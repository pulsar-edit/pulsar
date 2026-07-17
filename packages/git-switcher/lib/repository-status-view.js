const { CompositeDisposable, Disposable } = require("atom");

const { repositoryDisplayName, repositoryWorkingDirectory } = require("./helpers");

// Status bar tile showing the window's active repository. Hidden when the
// window knows fewer than two repositories, since there is nothing to switch.
module.exports = class RepositoryStatusView {
  constructor() {
    this.element = document.createElement("git-switcher-repository");
    this.element.classList.add("git-switcher-repository", "inline-block");

    this.link = document.createElement("a");
    this.link.classList.add("inline-block");
    this.element.appendChild(this.link);

    const icon = document.createElement("span");
    icon.classList.add("icon", "icon-repo");
    this.link.appendChild(icon);

    this.nameLabel = document.createElement("span");
    this.nameLabel.classList.add("repository-label");
    this.link.appendChild(this.nameLabel);

    this.pinIcon = document.createElement("span");
    this.pinIcon.classList.add("icon", "icon-lock", "pinned-indicator");
    this.pinIcon.style.display = "none";
    this.link.appendChild(this.pinIcon);

    const clickHandler = (event) => {
      event.preventDefault();
      atom.commands.dispatch(atom.views.getView(atom.workspace), "git-switcher:select-repository");
    };
    this.element.addEventListener("click", clickHandler);

    this.subscriptions = new CompositeDisposable(
      new Disposable(() => this.element.removeEventListener("click", clickHandler)),
      atom.repositories.observeActiveRepository(() => this.update()),
      atom.repositories.onDidChange(() => this.update()),
    );
  }

  getAnchorElement() {
    return this.element.style.display === "none" ? null : this.element;
  }

  update() {
    if (atom.isDestroying) {
      return;
    }

    const repositories = atom.repositories.getRepositories();
    const active = atom.repositories.getActiveRepository();
    if (!active || repositories.length < 2) {
      this.element.style.display = "none";
      return;
    }

    this.element.style.display = "";
    this.nameLabel.textContent = repositoryDisplayName(active);

    const pinned = atom.repositories.isActiveRepositoryPinned();
    this.pinIcon.style.display = pinned ? "" : "none";

    this.tooltipDisposable?.dispose();
    const workingDirectory = repositoryWorkingDirectory(active) || "";
    this.tooltipDisposable = atom.tooltips.add(this.element, {
      title: pinned ? `${workingDirectory} (pinned)` : workingDirectory,
    });
  }

  destroy() {
    this.subscriptions.dispose();
    this.tooltipDisposable?.dispose();
    this.element.remove();
  }
};
