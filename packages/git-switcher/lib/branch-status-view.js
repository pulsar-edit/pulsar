const { CompositeDisposable, Disposable } = require("atom");

const { headLabel } = require("./helpers");

// Status bar tile showing the active repository's head. Subscribing to the
// status snapshot is what keeps it refreshed.
module.exports = class BranchStatusView {
  constructor({ onDidClick } = {}) {
    this.element = document.createElement("git-switcher-branch");
    this.element.classList.add("git-switcher-branch", "inline-block");

    this.branchArea = document.createElement("a");
    this.branchArea.classList.add("git-branch", "inline-block");
    this.element.appendChild(this.branchArea);

    const branchIcon = document.createElement("span");
    branchIcon.classList.add("icon", "icon-git-branch");
    this.branchArea.appendChild(branchIcon);

    this.branchLabel = document.createElement("span");
    this.branchLabel.classList.add("branch-label");
    this.branchArea.appendChild(this.branchLabel);

    const clickHandler = (event) => {
      event.preventDefault();
      onDidClick?.(this.element);
    };
    this.branchArea.addEventListener("click", clickHandler);

    this.activeRepository = null;
    this.snapshotSubscription = null;

    this.subscriptions = new CompositeDisposable(
      new Disposable(() => this.branchArea.removeEventListener("click", clickHandler)),
      atom.repositories.observeActiveRepository(() => this.update()),
    );
  }

  getAnchorElement() {
    return this.element.style.display === "none" ? null : this.element;
  }

  // Keep exactly one status snapshot subscription, targeting the active
  // repository. Subscribing declares interest, which makes the repository
  // load and refresh the snapshot on its own schedule.
  subscribeToActiveRepository(repository) {
    if (repository === this.activeRepository) {
      return;
    }
    this.snapshotSubscription?.dispose();
    this.activeRepository = repository;
    this.snapshotSubscription = repository?.onDidChangeStatusSnapshot(() => this.update());
  }

  update() {
    if (atom.isDestroying) {
      return;
    }

    const repository = atom.repositories.getActiveRepository();
    this.subscribeToActiveRepository(repository);

    if (!repository) {
      // The active context has no repository, so there is no branch to show or
      // switch; hide the tile entirely.
      this.element.style.display = "none";
      this.branchLabel.textContent = "";
      this.branchTooltipDisposable?.dispose();
      this.branchTooltipDisposable = null;
      return;
    }

    // A repository is active again; make sure the tile is visible.
    this.element.style.display = "";

    const snapshot = repository.getStatusSnapshot();
    const head = headLabel(repository);
    this.branchLabel.textContent = head;
    this.branchArea.style.display = head ? "" : "none";

    let tooltip = `On branch ${head}`;
    if (snapshot.initialized && snapshot.head.detached) {
      tooltip = `Detached at ${head}`;
    } else if (snapshot.initialized && snapshot.head.unborn) {
      tooltip = `On unborn branch ${head}`;
    }
    this.branchTooltipDisposable?.dispose();
    this.branchTooltipDisposable = atom.tooltips.add(this.branchArea, { title: tooltip });
  }

  destroy() {
    this.subscriptions.dispose();
    this.snapshotSubscription?.dispose();
    this.branchTooltipDisposable?.dispose();
    this.element.remove();
  }
};
