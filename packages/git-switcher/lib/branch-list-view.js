const { SelectListView, highlightMatches } = require("@lumine-code/select-list");

const AnchoredPanel = require("./anchored-panel");
const { checkoutBranch } = require("./helpers");

// Compact branch picker for the active repository, anchored to the branch
// status bar tile. Selecting a non-current branch checks it out through the
// repository's operations facade.
module.exports = class BranchListView {
  constructor() {
    this.panel = new AnchoredPanel({ className: "git-switcher-branch-list" });
    this.selectListView = new SelectListView({
      className: "git-switcher-list",
      itemsClassList: ["mark-active"],
      items: [],
      emptyMessage: "No branches yet",
      filterKeyForItem: (item) => item.name,
      elementForItem: (item, { matchIndices }) => {
        const element = document.createElement("li");
        element.classList.add("git-switcher-item");
        if (item.isHead) {
          element.classList.add("active");
        }
        const line = document.createElement("div");
        line.classList.add("primary-line", "icon", "icon-git-branch");
        line.appendChild(highlightMatches(item.name, matchIndices));
        if (item.isHead) {
          const badge = document.createElement("span");
          badge.classList.add("badge", "pull-right");
          badge.textContent = "current";
          line.appendChild(badge);
        }
        element.appendChild(line);
        return element;
      },
      didConfirmSelection: (item) => {
        this.hide();
        if (!item.isHead && this.repository) {
          checkoutBranch(this.repository, item.name);
        }
      },
      didCancelSelection: () => this.hide(),
    });
    this.panel.setItem(this.selectListView.element);
    this.panel.onDidDismiss = () => this.hide();
    // The select list reads `this.panel` directly (getPanel only creates it
    // lazily), so assign the anchored panel as the pre-created panel.
    this.selectListView.panel = this.panel;
  }

  async toggle(anchor) {
    if (this.selectListView.isVisible()) {
      this.hide();
      return;
    }

    const repository = atom.repositories.getActiveRepository();
    if (!repository) {
      return;
    }
    this.repository = repository;
    this.panel.setAnchor(anchor);

    await this.selectListView.update({ items: [], loadingMessage: "Loading branches…" });
    this.selectListView.show();

    const refs = await repository.ensureRefsSnapshot?.().catch(() => null);
    if (!this.selectListView.isVisible() || repository !== this.repository) {
      return;
    }

    const items = (refs?.branches || [])
      .map((branch) => ({ name: branch.name, isHead: branch.isHead }))
      .sort((a, b) => {
        if (a.isHead !== b.isHead) return a.isHead ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    await this.selectListView.update({ items, loadingMessage: null });
    this.panel.position();
  }

  hide() {
    this.selectListView.hide();
  }

  destroy() {
    this.selectListView.destroy();
    this.panel.destroy();
  }
};
