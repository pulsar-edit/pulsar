const { CompositeDisposable, Disposable } = require("atom");

const { repositoryDisplayName, repositoryWorkingDirectory } = require("./helpers");

// Status bar tile showing the window's active repository. Hidden when the
// window knows fewer than two repositories, since there is nothing to switch.
module.exports = class RepositoryStatusView {
  constructor({ onDidClick } = {}) {
    this.element = document.createElement("git-switcher-repository");
    this.element.classList.add("git-switcher-repository", "inline-block");

    this.link = document.createElement("a");
    this.link.classList.add("inline-block");
    this.element.appendChild(this.link);

    this.icon = document.createElement("span");
    this.icon.classList.add("icon", "icon-repo");
    this.link.appendChild(this.icon);

    this.nameLabel = document.createElement("span");
    this.nameLabel.classList.add("repository-label");
    this.link.appendChild(this.nameLabel);

    const clickHandler = (event) => {
      event.preventDefault();
      onDidClick?.(this.element);
    };
    this.element.addEventListener("click", clickHandler);

    // Middle click toggles the pin ("lock") of the active repository.
    const auxClickHandler = (event) => {
      if (event.button !== 1) {
        return;
      }
      event.preventDefault();
      this.togglePin();
    };
    this.element.addEventListener("auxclick", auxClickHandler);

    // Wheeling over the tile cycles through the window's repositories.
    // Accumulate deltas so trackpads don't skip several repositories at once.
    this.wheelAccumulator = 0;
    const wheelHandler = (event) => {
      event.preventDefault();
      this.wheelAccumulator += event.deltaY;
      if (Math.abs(this.wheelAccumulator) < 60) {
        return;
      }
      const direction = this.wheelAccumulator > 0 ? 1 : -1;
      this.wheelAccumulator = 0;
      this.cycleRepository(direction);
    };
    this.element.addEventListener("wheel", wheelHandler, { passive: false });

    this.subscriptions = new CompositeDisposable(
      new Disposable(() => {
        this.element.removeEventListener("click", clickHandler);
        this.element.removeEventListener("auxclick", auxClickHandler);
        this.element.removeEventListener("wheel", wheelHandler);
      }),
      atom.repositories.observeActiveRepository(() => this.update()),
      atom.repositories.onDidChange(() => this.update()),
    );
  }

  cycleRepository(direction) {
    const repositories = atom.repositories
      .getRepositories()
      .slice()
      .sort((a, b) => repositoryDisplayName(a).localeCompare(repositoryDisplayName(b)));
    if (repositories.length < 2) {
      return;
    }

    const active = atom.repositories.getActiveRepository();
    const index = repositories.indexOf(active);
    const next =
      repositories[(index + direction + repositories.length) % repositories.length] ||
      repositories[0];
    try {
      // A locked selection stays locked, retargeted to the new repository.
      atom.repositories.setActiveRepository(next, {
        pin: atom.repositories.isActiveRepositoryPinned(),
      });
    } catch {
      // The repository was destroyed mid-cycle.
    }
  }

  togglePin() {
    const active = atom.repositories.getActiveRepository();
    if (!active) {
      return;
    }
    try {
      atom.repositories.setActiveRepository(active, {
        pin: !atom.repositories.isActiveRepositoryPinned(),
      });
    } catch {
      // The repository was destroyed while toggling.
    }
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
    this.icon.classList.toggle("icon-repo", !pinned);
    this.icon.classList.toggle("icon-lock", pinned);

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
