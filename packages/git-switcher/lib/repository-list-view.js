const { SelectListView, highlightMatches } = require("@lumine-code/select-list");

const AnchoredPanel = require("./anchored-panel");
const { headLabel, repositoryDisplayName, repositoryWorkingDirectory } = require("./helpers");

// Compact repository picker, anchored to the repository status bar tile.
// Selecting a repository makes it the window's active repository (unpinned).
module.exports = class RepositoryListView {
  constructor() {
    this.panel = new AnchoredPanel({ className: "git-switcher-repository-list" });
    this.selectListView = new SelectListView({
      className: "git-switcher-list",
      itemsClassList: ["mark-active"],
      items: [],
      emptyMessage: "No repositories in this window",
      filterKeyForItem: (item) => item.name,
      elementForItem: (item, { matchIndices }) => {
        const element = document.createElement("li");
        element.classList.add("git-switcher-item", "two-lines");
        if (item.current) {
          element.classList.add("active");
        }

        const primary = document.createElement("div");
        primary.classList.add("primary-line", "icon", "icon-repo");
        primary.appendChild(highlightMatches(item.name, matchIndices));
        if (item.head) {
          const head = document.createElement("span");
          head.classList.add("badge", "badge-info", "pull-right");
          head.textContent = item.head;
          primary.appendChild(head);
        }
        element.appendChild(primary);

        const secondary = document.createElement("div");
        secondary.classList.add("secondary-line");
        secondary.textContent = item.workingDirectory;
        element.appendChild(secondary);

        return element;
      },
      didConfirmSelection: (item) => {
        this.hide();
        try {
          atom.repositories.setActiveRepository(item.repository);
        } catch {
          // The repository was destroyed while the picker was open.
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
    this.panel.setAnchor(anchor);

    const active = atom.repositories.getActiveRepository();
    const items = atom.repositories
      .getRepositories()
      .map((repository) => ({
        repository,
        name: repositoryDisplayName(repository),
        workingDirectory: repositoryWorkingDirectory(repository) || "",
        head: headLabel(repository),
        current: repository === active,
      }))
      .sort((a, b) => {
        if (a.current !== b.current) return a.current ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    await this.selectListView.update({ items });
    this.selectListView.show();
  }

  hide() {
    this.selectListView.hide();
  }

  destroy() {
    this.selectListView.destroy();
    this.panel.destroy();
  }
};
