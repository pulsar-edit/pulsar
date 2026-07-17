const { CompositeDisposable, Disposable } = require("atom");

const { headLabel } = require("./helpers");

// Status bar tile showing the active repository's head and its ahead/behind
// counts. Subscribing to the status snapshot is what keeps it refreshed.
module.exports = class BranchStatusView {
  constructor() {
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

    this.commitsArea = document.createElement("div");
    this.commitsArea.classList.add("git-commits", "inline-block");
    this.element.appendChild(this.commitsArea);

    this.commitsAhead = document.createElement("span");
    this.commitsAhead.classList.add("icon", "icon-arrow-up", "commits-ahead-label");
    this.commitsArea.appendChild(this.commitsAhead);

    this.commitsBehind = document.createElement("span");
    this.commitsBehind.classList.add("icon", "icon-arrow-down", "commits-behind-label");
    this.commitsArea.appendChild(this.commitsBehind);

    const clickHandler = (event) => {
      event.preventDefault();
      atom.commands.dispatch(atom.views.getView(atom.workspace), "git-switcher:select-branch");
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
      this.element.style.display = "none";
      return;
    }
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

    const { ahead = 0, behind = 0 } = snapshot.initialized
      ? snapshot.upstream || {}
      : repository.getCachedUpstreamAheadBehindCount?.() || {};
    this.commitsAhead.textContent = ahead > 0 ? String(ahead) : "";
    this.commitsAhead.style.display = ahead > 0 ? "" : "none";
    this.commitsBehind.textContent = behind > 0 ? String(behind) : "";
    this.commitsBehind.style.display = behind > 0 ? "" : "none";
    this.commitsArea.style.display = ahead > 0 || behind > 0 ? "" : "none";
  }

  destroy() {
    this.subscriptions.dispose();
    this.snapshotSubscription?.dispose();
    this.branchTooltipDisposable?.dispose();
    this.element.remove();
  }
};
