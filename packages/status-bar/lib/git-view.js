const _ = require("@lumine-code/underscore-plus");
const { CompositeDisposable } = require("atom");

module.exports = class GitView {
  constructor() {
    this.element = document.createElement("status-bar-git");
    this.element.classList.add("git-view");

    this.createBranchArea();
    this.createCommitsArea();
    this.createStatusArea();

    this.activeItemSubscription = atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
      this.subscribeToActiveItem();
    });
    this.projectPathSubscription = atom.project.onDidChangePaths(() => {
      this.subscribeToRepositories();
    });
    this.repositoryRegistrySubscription = atom.repositories.onDidChange(() => {
      if (atom.isDestroying) return;
      this.subscribeToRepositories();
      this.update();
    });
    this.activeSnapshotRepository = null;
    this.snapshotSubscription = null;
    this.subscribeToRepositories();
    this.subscribeToActiveItem();
  }

  createBranchArea() {
    this.branchArea = document.createElement("div");
    this.branchArea.classList.add("git-branch", "inline-block");
    this.element.appendChild(this.branchArea);
    this.element.branchArea = this.branchArea;

    const branchIcon = document.createElement("span");
    branchIcon.classList.add("icon", "icon-git-branch");
    this.branchArea.appendChild(branchIcon);

    this.branchLabel = document.createElement("span");
    this.branchLabel.classList.add("branch-label");
    this.branchArea.appendChild(this.branchLabel);
    this.element.branchLabel = this.branchLabel;
  }

  createCommitsArea() {
    this.commitsArea = document.createElement("div");
    this.commitsArea.classList.add("git-commits", "inline-block");
    this.element.appendChild(this.commitsArea);

    this.commitsAhead = document.createElement("span");
    this.commitsAhead.classList.add("icon", "icon-arrow-up", "commits-ahead-label");
    this.commitsArea.appendChild(this.commitsAhead);

    this.commitsBehind = document.createElement("span");
    this.commitsBehind.classList.add("icon", "icon-arrow-down", "commits-behind-label");
    this.commitsArea.appendChild(this.commitsBehind);
  }

  createStatusArea() {
    this.gitStatus = document.createElement("div");
    this.gitStatus.classList.add("git-status", "inline-block");
    this.element.appendChild(this.gitStatus);

    this.gitStatusIcon = document.createElement("span");
    this.gitStatusIcon.classList.add("icon");
    this.gitStatus.appendChild(this.gitStatusIcon);
    this.element.gitStatusIcon = this.gitStatusIcon;
  }

  subscribeToActiveItem() {
    const activeItem = this.getActiveItem();

    this.savedSubscription?.dispose();
    this.savedSubscription = activeItem?.onDidSave?.(() => this.update());

    this.update();
  }

  subscribeToRepositories() {
    this.repositorySubscriptions?.dispose();
    this.repositorySubscriptions = new CompositeDisposable();

    const result = [];

    for (let repo of atom.repositories.getRepositories()) {
      if (repo != null) {
        this.repositorySubscriptions.add(
          repo.onDidChangeStatus(({ path }) => {
            if (path === this.getActiveItemPath()) {
              this.update();
            }
          }),
        );

        result.push(
          this.repositorySubscriptions.add(
            repo.onDidChangeStatuses(() => {
              this.update();
            }),
          ),
        );
      }
    }

    return result;
  }

  destroy() {
    this.activeItemSubscription?.dispose();
    this.projectPathSubscription?.dispose();
    this.repositoryRegistrySubscription?.dispose();
    this.savedSubscription?.dispose();
    this.repositorySubscriptions?.dispose();
    this.snapshotSubscription?.dispose();
    this.activeSnapshotRepository = null;
    this.branchTooltipDisposable?.dispose();
    this.commitsAheadTooltipDisposable?.dispose();
    this.commitsBehindTooltipDisposable?.dispose();
    this.statusTooltipDisposable?.dispose();
  }

  getActiveItemPath() {
    return this.getActiveItem()?.getPath?.();
  }

  getRepositoryForActiveItem() {
    const itemPath = this.getActiveItemPath();
    if (itemPath) return atom.repositories.getForPath(itemPath);

    for (const projectPath of atom.project.getPaths()) {
      const repository = atom.repositories.getForPath(projectPath);
      if (repository) return repository;
    }

    return atom.repositories.getRepositories()[0] || null;
  }

  getActiveItem() {
    return atom.workspace?.getCenter?.()?.getActivePaneItem?.();
  }

  update() {
    if (atom.isDestroying) return;

    const repo = this.getRepositoryForActiveItem();
    this.subscribeToActiveRepository(repo);
    this.updateBranchText(repo);
    this.updateAheadBehindCount(repo);
    this.updateStatusText(repo);
  }

  // Keep exactly one status snapshot subscription, targeting the repository of
  // the active item. Subscribing is what makes the repository load and refresh
  // its snapshot; this view never triggers refreshes itself.
  subscribeToActiveRepository(repo) {
    if (repo === this.activeSnapshotRepository) return;

    this.snapshotSubscription?.dispose();
    this.activeSnapshotRepository = repo;
    this.snapshotSubscription = repo?.onDidChangeStatusSnapshot(() => this.update());
  }

  // The status snapshot describes the root repository, so it does not apply to
  // paths inside a submodule; those stay on the synchronous per-path API.
  getSnapshotForActiveItem(repo) {
    const snapshot = repo.getStatusSnapshot();
    if (!snapshot.initialized) return null;
    const itemPath = this.getActiveItemPath();
    if (itemPath && repo.isSubmodule(itemPath)) return null;
    return snapshot;
  }

  updateBranchText(repo) {
    if (this.showGitInformation(repo)) {
      const snapshot = this.getSnapshotForActiveItem(repo);
      let head, tooltip;
      if (snapshot) {
        if (snapshot.head.detached) {
          head = snapshot.head.oid ? snapshot.head.oid.slice(0, 7) : "";
          tooltip = `Detached at ${head}`;
        } else if (snapshot.head.unborn) {
          head = snapshot.head.name;
          tooltip = `On unborn branch ${head}`;
        } else {
          head = snapshot.head.name;
          tooltip = `On branch ${head}`;
        }
      } else {
        head = repo.getShortHead(this.getActiveItemPath());
        tooltip = `On branch ${head}`;
      }
      this.branchLabel.textContent = head;
      if (head) {
        this.branchArea.style.display = "";
      }
      this.branchTooltipDisposable?.dispose();
      this.branchTooltipDisposable = atom.tooltips.add(this.branchArea, {
        title: tooltip,
      });
    } else {
      this.branchArea.style.display = "none";
    }
  }

  showGitInformation(repo) {
    if (repo == null) {
      return false;
    }

    const itemPath = this.getActiveItemPath();
    if (itemPath) {
      return atom.repositories.getForPath(itemPath) === repo;
    } else {
      return this.getActiveItem() == null;
    }
  }

  updateAheadBehindCount(repo) {
    if (!this.showGitInformation(repo)) {
      this.commitsArea.style.display = "none";
      return;
    }

    const itemPath = this.getActiveItemPath();
    const snapshot = this.getSnapshotForActiveItem(repo);
    const { ahead = 0, behind = 0 } = snapshot
      ? snapshot.upstream || {}
      : repo.getCachedUpstreamAheadBehindCount(itemPath);
    if (ahead > 0) {
      this.commitsAhead.textContent = ahead;
      this.commitsAhead.style.display = "";
      this.commitsAheadTooltipDisposable?.dispose();
      this.commitsAheadTooltipDisposable = atom.tooltips.add(this.commitsAhead, {
        title: `${_.pluralize(ahead, "commit")} ahead of upstream`,
      });
    } else {
      this.commitsAhead.style.display = "none";
    }

    if (behind > 0) {
      this.commitsBehind.textContent = behind;
      this.commitsBehind.style.display = "";
      this.commitsBehindTooltipDisposable?.dispose();
      this.commitsBehindTooltipDisposable = atom.tooltips.add(this.commitsBehind, {
        title: `${_.pluralize(behind, "commit")} behind upstream`,
      });
    } else {
      this.commitsBehind.style.display = "none";
    }

    if (ahead > 0 || behind > 0) {
      this.commitsArea.style.display = "";
    } else {
      this.commitsArea.style.display = "none";
    }
  }

  clearStatus() {
    this.gitStatusIcon.classList.remove(
      "icon-diff-modified",
      "status-modified",
      "icon-diff-added",
      "status-added",
      "icon-diff-ignored",
      "status-ignored",
      "icon-alert",
      "status-conflicted",
    );
  }

  updateAsNewFile() {
    this.clearStatus();

    const textEditor = atom.workspace.getActiveTextEditor();

    this.gitStatusIcon.classList.add("icon-diff-added", "status-added");
    if (textEditor) {
      this.gitStatusIcon.textContent = `+${textEditor.getLineCount()}`;
      this.updateTooltipText(
        `${_.pluralize(textEditor.getLineCount(), "line")} in this new file not yet committed`,
      );
    } else {
      this.gitStatusIcon.textContent = "";
      this.updateTooltipText();
    }

    this.gitStatus.style.display = "";
  }

  updateAsModifiedFile(repo, path) {
    const stats = repo.getDiffStats(path);
    this.clearStatus();

    this.gitStatusIcon.classList.add("icon-diff-modified", "status-modified");
    if (stats.added && stats.deleted) {
      this.gitStatusIcon.textContent = `+${stats.added}, -${stats.deleted}`;
      this.updateTooltipText(
        `${_.pluralize(stats.added, "line")} added and ${_.pluralize(stats.deleted, "line")} deleted in this file not yet committed`,
      );
    } else if (stats.added) {
      this.gitStatusIcon.textContent = `+${stats.added}`;
      this.updateTooltipText(
        `${_.pluralize(stats.added, "line")} added to this file not yet committed`,
      );
    } else if (stats.deleted) {
      this.gitStatusIcon.textContent = `-${stats.deleted}`;
      this.updateTooltipText(
        `${_.pluralize(stats.deleted, "line")} deleted from this file not yet committed`,
      );
    } else {
      this.gitStatusIcon.textContent = "";
      this.updateTooltipText();
    }

    this.gitStatus.style.display = "";
  }

  updateAsIgnoredFile() {
    this.clearStatus();

    this.gitStatusIcon.classList.add("icon-diff-ignored", "status-ignored");
    this.gitStatusIcon.textContent = "";
    this.gitStatus.style.display = "";
    this.updateTooltipText("File is ignored by git");
  }

  updateAsConflictedFile() {
    this.clearStatus();

    this.gitStatusIcon.classList.add("icon-alert", "status-conflicted");
    this.gitStatusIcon.textContent = "";
    this.gitStatus.style.display = "";
    this.updateTooltipText("File has merge conflicts");
  }

  updateTooltipText(text) {
    this.statusTooltipDisposable?.dispose();
    if (text) {
      this.statusTooltipDisposable = atom.tooltips.add(this.gitStatusIcon, { title: text });
    }
  }

  updateStatusText(repo) {
    const hideStatus = () => {
      this.clearStatus();
      this.gitStatus.style.display = "none";
    };

    const itemPath = this.getActiveItemPath();
    if (this.showGitInformation(repo) && itemPath != null) {
      const summary = repo.getPathStatusSummary(itemPath);
      if (summary?.conflicted) {
        return this.updateAsConflictedFile();
      }

      if (summary?.modified) {
        return this.updateAsModifiedFile(repo, itemPath);
      }

      if (summary?.added) {
        return this.updateAsNewFile();
      }

      if (repo.isPathIgnored(itemPath)) {
        return this.updateAsIgnoredFile();
      } else {
        return hideStatus();
      }
    } else {
      return hideStatus();
    }
  }
};
