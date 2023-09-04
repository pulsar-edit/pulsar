/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let GitView;
const _ = require("underscore-plus");
const {CompositeDisposable, GitRepositoryAsync} = require("atom");

module.exports =
(GitView = class GitView {
  constructor() {
    this.element = document.createElement('status-bar-git');
    this.element.classList.add('git-view');

    this.createBranchArea();
    this.createCommitsArea();
    this.createStatusArea();

    this.activeItemSubscription = atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
      return this.subscribeToActiveItem();
    });
    this.projectPathSubscription = atom.project.onDidChangePaths(() => {
      return this.subscribeToRepositories();
    });
    this.subscribeToRepositories();
    this.subscribeToActiveItem();
  }

  createBranchArea() {
    this.branchArea = document.createElement('div');
    this.branchArea.classList.add('git-branch', 'inline-block');
    this.element.appendChild(this.branchArea);
    this.element.branchArea = this.branchArea;

    const branchIcon = document.createElement('span');
    branchIcon.classList.add('icon', 'icon-git-branch');
    this.branchArea.appendChild(branchIcon);

    this.branchLabel = document.createElement('span');
    this.branchLabel.classList.add('branch-label');
    this.branchArea.appendChild(this.branchLabel);
    return this.element.branchLabel = this.branchLabel;
  }

  createCommitsArea() {
    this.commitsArea = document.createElement('div');
    this.commitsArea.classList.add('git-commits', 'inline-block');
    this.element.appendChild(this.commitsArea);

    this.commitsAhead = document.createElement('span');
    this.commitsAhead.classList.add('icon', 'icon-arrow-up', 'commits-ahead-label');
    this.commitsArea.appendChild(this.commitsAhead);

    this.commitsBehind = document.createElement('span');
    this.commitsBehind.classList.add('icon', 'icon-arrow-down', 'commits-behind-label');
    return this.commitsArea.appendChild(this.commitsBehind);
  }

  createStatusArea() {
    this.gitStatus = document.createElement('div');
    this.gitStatus.classList.add('git-status', 'inline-block');
    this.element.appendChild(this.gitStatus);

    this.gitStatusIcon = document.createElement('span');
    this.gitStatusIcon.classList.add('icon');
    this.gitStatus.appendChild(this.gitStatusIcon);
    return this.element.gitStatusIcon = this.gitStatusIcon;
  }

  subscribeToActiveItem() {
    const activeItem = this.getActiveItem();

    this.savedSubscription?.dispose();
    this.savedSubscription = activeItem?.onDidSave?.(() => this.update());

    return this.update();
  }

  subscribeToRepositories() {
    this.repositorySubscriptions?.dispose();
    this.repositorySubscriptions = new CompositeDisposable;

    return (() => {
      const result = [];
      for (let repo of Array.from(atom.project.getRepositories())) {
        if (repo != null) {
          this.repositorySubscriptions.add(repo.onDidChangeStatus(({path, status}) => {
            if (path === this.getActiveItemPath()) { return this.update(); }
          })
          );
          result.push(this.repositorySubscriptions.add(repo.onDidChangeStatuses(() => {
            return this.update();
          })
          ));
        }
      }
      return result;
    })();
  }

  destroy() {
    this.activeItemSubscription?.dispose();
    this.projectPathSubscription?.dispose();
    this.savedSubscription?.dispose();
    this.repositorySubscriptions?.dispose();
    this.branchTooltipDisposable?.dispose();
    this.commitsAheadTooltipDisposable?.dispose();
    this.commitsBehindTooltipDisposable?.dispose();
    return this.statusTooltipDisposable?.dispose();
  }

  getActiveItemPath() {
    return this.getActiveItem()?.getPath?.();
  }

  getRepositoryForActiveItem() {
    const [rootDir] = atom.project.relativizePath(this.getActiveItemPath());
    const rootDirIndex = atom.project.getPaths().indexOf(rootDir);
    if (rootDirIndex >= 0) {
      return atom.project.getRepositories()[rootDirIndex];
    } else {
      for (let repo of Array.from(atom.project.getRepositories())) {
        if (repo) {
          return repo;
        }
      }
    }
  }

  getActiveItem() {
    return atom.workspace.getCenter().getActivePaneItem();
  }

  update() {
    const repo = this.getRepositoryForActiveItem();
    this.updateBranchText(repo);
    this.updateAheadBehindCount(repo);
    return this.updateStatusText(repo);
  }

  updateBranchText(repo) {
    if (this.showGitInformation(repo)) {
      const head = repo.getShortHead(this.getActiveItemPath());
      this.branchLabel.textContent = head;
      if (head) { this.branchArea.style.display = ''; }
      this.branchTooltipDisposable?.dispose();
      return this.branchTooltipDisposable = atom.tooltips.add(this.branchArea, {title: `On branch ${head}`});
    } else {
      return this.branchArea.style.display = 'none';
    }
  }

  showGitInformation(repo) {
    let itemPath;
    if (repo == null) { return false; }

    if ((itemPath = this.getActiveItemPath())) {
      return atom.project.contains(itemPath);
    } else {
      return (this.getActiveItem() == null);
    }
  }

  updateAheadBehindCount(repo) {
    if (!this.showGitInformation(repo)) {
      this.commitsArea.style.display = 'none';
      return;
    }

    const itemPath = this.getActiveItemPath();
    const {ahead, behind} = repo.getCachedUpstreamAheadBehindCount(itemPath);
    if (ahead > 0) {
      this.commitsAhead.textContent = ahead;
      this.commitsAhead.style.display = '';
      this.commitsAheadTooltipDisposable?.dispose();
      this.commitsAheadTooltipDisposable = atom.tooltips.add(this.commitsAhead, {title: `${_.pluralize(ahead, 'commit')} ahead of upstream`});
    } else {
      this.commitsAhead.style.display = 'none';
    }

    if (behind > 0) {
      this.commitsBehind.textContent = behind;
      this.commitsBehind.style.display = '';
      this.commitsBehindTooltipDisposable?.dispose();
      this.commitsBehindTooltipDisposable = atom.tooltips.add(this.commitsBehind, {title: `${_.pluralize(behind, 'commit')} behind upstream`});
    } else {
      this.commitsBehind.style.display = 'none';
    }

    if ((ahead > 0) || (behind > 0)) {
      return this.commitsArea.style.display = '';
    } else {
      return this.commitsArea.style.display = 'none';
    }
  }

  clearStatus() {
    return this.gitStatusIcon.classList.remove('icon-diff-modified', 'status-modified', 'icon-diff-added', 'status-added', 'icon-diff-ignored', 'status-ignored');
  }

  updateAsNewFile() {
    let textEditor;
    this.clearStatus();

    this.gitStatusIcon.classList.add('icon-diff-added', 'status-added');
    if (textEditor = atom.workspace.getActiveTextEditor()) {
      this.gitStatusIcon.textContent = `+${textEditor.getLineCount()}`;
      this.updateTooltipText(`${_.pluralize(textEditor.getLineCount(), 'line')} in this new file not yet committed`);
    } else {
      this.gitStatusIcon.textContent = '';
      this.updateTooltipText();
    }

    return this.gitStatus.style.display = '';
  }

  updateAsModifiedFile(repo, path) {
    const stats = repo.getDiffStats(path);
    this.clearStatus();

    this.gitStatusIcon.classList.add('icon-diff-modified', 'status-modified');
    if (stats.added && stats.deleted) {
      this.gitStatusIcon.textContent = `+${stats.added}, -${stats.deleted}`;
      this.updateTooltipText(`${_.pluralize(stats.added, 'line')} added and ${_.pluralize(stats.deleted, 'line')} deleted in this file not yet committed`);
    } else if (stats.added) {
      this.gitStatusIcon.textContent = `+${stats.added}`;
      this.updateTooltipText(`${_.pluralize(stats.added, 'line')} added to this file not yet committed`);
    } else if (stats.deleted) {
      this.gitStatusIcon.textContent = `-${stats.deleted}`;
      this.updateTooltipText(`${_.pluralize(stats.deleted, 'line')} deleted from this file not yet committed`);
    } else {
      this.gitStatusIcon.textContent = '';
      this.updateTooltipText();
    }

    return this.gitStatus.style.display = '';
  }

  updateAsIgnoredFile() {
    this.clearStatus();

    this.gitStatusIcon.classList.add('icon-diff-ignored',  'status-ignored');
    this.gitStatusIcon.textContent = '';
    this.gitStatus.style.display = '';
    return this.updateTooltipText("File is ignored by git");
  }

  updateTooltipText(text) {
    this.statusTooltipDisposable?.dispose();
    if (text) {
      return this.statusTooltipDisposable = atom.tooltips.add(this.gitStatusIcon, {title: text});
    }
  }

  updateStatusText(repo) {
    const hideStatus = () => {
      this.clearStatus();
      return this.gitStatus.style.display = 'none';
    };

    const itemPath = this.getActiveItemPath();
    if (this.showGitInformation(repo) && (itemPath != null)) {
      let left;
      const status = (left = repo.getCachedPathStatus(itemPath)) != null ? left : 0;
      if (repo.isStatusNew(status)) {
        return this.updateAsNewFile();
      }

      if (repo.isStatusModified(status)) {
        return this.updateAsModifiedFile(repo, itemPath);
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
});
