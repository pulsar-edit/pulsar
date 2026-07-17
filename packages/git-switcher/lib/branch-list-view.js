const { SelectListView, highlightMatches } = require("@lumine-code/select-list");

const BranchNameDialog = require("./branch-name-dialog");
const { applySwitchItem, buildSwitchItems, checkoutBranch } = require("./helpers");

const ACTIONS = [
  { action: "create", branch: "Create new branch...", icon: "icon-plus" },
  { action: "create-from", branch: "Create new branch from...", icon: "icon-plus" },
  { action: "detach", branch: "Checkout detached...", icon: "icon-git-commit" },
];

// Branch picker for the active repository. Selecting a non-current branch
// checks it out through the repository's operations facade.
module.exports = class BranchListView {
  constructor() {
    this.branchNameDialog = new BranchNameDialog();
    this.selectListView = new SelectListView({
      className: "git-switcher-branch-list",
      items: [],
      emptyMessage: "No branches yet",
      filterKeyForItem: (item) => item.branch,
      elementForItem: (item, { matchIndices }) => {
        const element = document.createElement("li");
        element.classList.add("git-switcher-item");
        if (item.action) {
          element.classList.add("git-switcher-branch-action");
          if (item.action === "detach") element.classList.add("git-switcher-branch-action-last");
        }
        const line = document.createElement("div");
        line.classList.add("primary-line", "icon", item.icon || "icon-git-branch");
        line.appendChild(highlightMatches(item.branch, matchIndices));
        if (item.current) {
          const badge = document.createElement("span");
          badge.classList.add("badge", "pull-right");
          badge.textContent = "current";
          line.appendChild(badge);
        }
        element.appendChild(line);
        return element;
      },
      didConfirmSelection: (item) => {
        if (item.action) this.performAction(item.action);
        else {
          this.hide();
          applySwitchItem(item);
        }
      },
      didCancelSelection: () => this.hide(),
    });

    this.referenceListView = new SelectListView({
      className: "git-switcher-reference-list",
      items: [],
      emptyMessage: "No references yet",
      filterKeyForItem: (item) => `${item.label} ${item.detail}`,
      elementForItem: (item, { matchIndices }) => {
        const element = document.createElement("li");
        element.classList.add("git-switcher-item");
        if (item.detail) element.classList.add("two-lines");

        const primary = document.createElement("div");
        primary.classList.add("primary-line", "icon", item.icon);
        primary.appendChild(highlightMatches(item.label, matchIndices));
        element.appendChild(primary);

        if (item.detail) {
          const secondary = document.createElement("div");
          secondary.classList.add("secondary-line");
          secondary.textContent = item.detail;
          element.appendChild(secondary);
        }
        return element;
      },
      didConfirmSelection: (item) => this.confirmReference(item),
      didCancelSelection: () => this.referenceListView.hide(),
    });
  }

  performAction(action) {
    const repository = atom.repositories.getActiveRepository();
    if (!repository) return;
    this.hide();

    if (action === "create") {
      this.branchNameDialog.show({
        prompt: "Please provide a new branch name",
        onConfirm: (name) => checkoutBranch(repository, name, { createNew: true }),
      });
    } else {
      this.showReferenceList(action, repository);
    }
  }

  async showReferenceList(action, repository) {
    this.referenceAction = action;
    this.referenceRepository = repository;
    this.referenceListView.reset();
    await this.referenceListView.update({ items: [], loadingMessage: "Loading references…" });
    this.referenceListView.show();

    const refs = await repository.ensureRefsSnapshot?.().catch(() => null);
    if (!this.referenceListView.isVisible() || repository !== this.referenceRepository) return;
    await this.referenceListView.update({
      items: this.buildReferenceItems(refs),
      loadingMessage: null,
    });
  }

  buildReferenceItems(refs) {
    const items = [];
    if (refs?.head?.oid) {
      items.push({
        reference: "HEAD",
        label: "HEAD",
        detail: refs.head.name || refs.head.oid.slice(0, 7),
        icon: "icon-git-commit",
      });
    }
    for (const branch of refs?.branches || []) {
      items.push({
        reference: branch.name,
        label: branch.name,
        detail: "Local branch",
        icon: "icon-git-branch",
      });
    }
    for (const branch of refs?.remoteBranches || []) {
      if (branch.symrefTarget) continue;
      items.push({
        reference: branch.name,
        label: branch.name,
        detail: "Remote branch",
        icon: "icon-cloud-download",
      });
    }
    for (const tag of refs?.tags || []) {
      items.push({
        reference: tag.name,
        label: tag.name,
        detail: "Tag",
        icon: "icon-tag",
      });
    }
    return items;
  }

  confirmReference(item) {
    const action = this.referenceAction;
    const repository = this.referenceRepository;
    this.referenceListView.hide();
    if (!repository) return;

    if (action === "detach") {
      checkoutBranch(repository, item.reference, { detach: true });
    } else if (action === "create-from") {
      this.branchNameDialog.show({
        prompt: "Please provide a new branch name",
        onConfirm: (name) =>
          checkoutBranch(repository, name, { createNew: true, startPoint: item.reference }),
      });
    }
  }

  async toggle() {
    if (this.selectListView.isVisible()) {
      this.hide();
      return;
    }
    const repository = atom.repositories.getActiveRepository();
    if (!repository) {
      return;
    }

    this.selectListView.reset();
    await this.selectListView.update({ items: [], loadingMessage: "Loading branches…" });
    this.selectListView.show();

    const items = [...ACTIONS, ...(await buildSwitchItems()).filter((item) => item.active)];
    if (
      !this.selectListView.isVisible() ||
      atom.repositories.getActiveRepository() !== repository
    ) {
      return;
    }
    await this.selectListView.update({ items, loadingMessage: null });
  }

  hide() {
    this.selectListView.hide();
  }

  destroy() {
    this.selectListView.destroy();
    this.referenceListView.destroy();
    this.branchNameDialog.destroy();
  }
};
