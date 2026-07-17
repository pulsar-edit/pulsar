const { SelectListView, highlightMatches } = require("@lumine-code/select-list");

const { applySwitchItem, buildSwitchItems } = require("./helpers");

// Repository picker. Selecting a repository makes it the window's active
// repository (unpinned).
module.exports = class RepositoryListView {
  constructor() {
    this.selectListView = new SelectListView({
      className: "git-switcher-repository-list",
      items: [],
      emptyMessage: "No repositories in this window",
      filterKeyForItem: (item) => item.repoName,
      elementForItem: (item, { matchIndices }) => {
        const element = document.createElement("li");
        if (item.auto) {
          element.classList.add("git-switcher-item", "two-lines");
          const line = document.createElement("div");
          line.classList.add("primary-line", "icon", "icon-sync");
          line.appendChild(highlightMatches(item.repoName, matchIndices));
          element.appendChild(line);

          const secondary = document.createElement("div");
          secondary.classList.add("secondary-line");
          secondary.textContent = "The active repository is updated based on the active editor.";
          element.appendChild(secondary);
          return element;
        }

        element.classList.add("git-switcher-item", "two-lines");
        const primary = document.createElement("div");
        primary.classList.add("primary-line", "icon", "icon-repo");
        primary.appendChild(highlightMatches(item.repoName, matchIndices));
        const badge = document.createElement("span");
        badge.classList.add("badge", "badge-info", "pull-right");
        badge.textContent = item.branch;
        primary.appendChild(badge);
        element.appendChild(primary);

        const secondary = document.createElement("div");
        secondary.classList.add("secondary-line");
        secondary.textContent = item.workingDirectory;
        element.appendChild(secondary);

        return element;
      },
      didConfirmSelection: (item) => {
        this.hide();
        if (item.auto) {
          atom.repositories.setActiveRepository(null);
        } else {
          applySwitchItem(item, { pin: true });
        }
      },
      didCancelSelection: () => this.hide(),
    });
  }

  async toggle() {
    if (this.selectListView.isVisible()) {
      this.hide();
      return;
    }

    this.selectListView.reset();
    await this.selectListView.update({ items: [], loadingMessage: "Loading repositories…" });
    this.selectListView.show();

    const items = [
      { auto: true, repoName: "Auto" },
      ...(await buildSwitchItems()).filter((item) => item.current),
    ];
    if (!this.selectListView.isVisible()) {
      return;
    }
    await this.selectListView.update({ items, loadingMessage: null });
  }

  hide() {
    this.selectListView.hide();
  }

  destroy() {
    this.selectListView.destroy();
  }
};
