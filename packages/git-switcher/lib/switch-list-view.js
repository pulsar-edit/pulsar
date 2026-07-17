const { SelectListView, highlightMatches } = require("@lumine-code/select-list");

const { checkoutBranch, repositoryDisplayName, repositoryWorkingDirectory } = require("./helpers");

// Centered fuzzy finder over every repository × local branch pair in the
// window. Selecting a repository's current branch is a pure repository
// switch; selecting any other branch also checks it out.
module.exports = class SwitchListView {
  constructor() {
    this.selectListView = new SelectListView({
      className: "git-switcher-switch",
      itemsClassList: ["mark-active"],
      items: [],
      emptyMessage: "No repositories in this window",
      filterKeyForItem: (item) => `${item.repoName} ${item.branch}`,
      elementForItem: (item, { matchIndices }) => {
        const element = document.createElement("li");
        element.classList.add("git-switcher-item", "two-lines");
        if (item.active && item.current) {
          element.classList.add("active");
        }

        const primary = document.createElement("div");
        primary.classList.add("primary-line", "icon", "icon-git-branch");
        primary.appendChild(highlightMatches(`${item.repoName} ⎇ ${item.branch}`, matchIndices));
        if (item.current) {
          const badge = document.createElement("span");
          badge.classList.add("badge", "pull-right");
          badge.textContent = "current";
          primary.appendChild(badge);
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
          return;
        }
        if (!item.current) {
          checkoutBranch(item.repository, item.branch);
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

    await this.selectListView.update({ items: [], loadingMessage: "Loading repositories…" });
    this.selectListView.show();

    const repositories = atom.repositories.getRepositories();
    const active = atom.repositories.getActiveRepository();

    const groups = await Promise.all(
      repositories.map(async (repository) => {
        const refs = await repository.ensureRefsSnapshot?.().catch(() => null);
        const repoName = repositoryDisplayName(repository);
        const workingDirectory = repositoryWorkingDirectory(repository) || "";
        const isActive = repository === active;

        const rows = (refs?.branches || []).map((branch) => ({
          repository,
          repoName,
          workingDirectory,
          branch: branch.name,
          current: branch.isHead,
          active: isActive,
        }));
        // Unborn or detached repositories have no head row in `branches`;
        // still offer a pure-switch row so the repository stays reachable.
        if (!rows.some((row) => row.current)) {
          const head = refs?.head;
          const label = head?.name || (head?.oid ? head.oid.slice(0, 7) : "(no branch)");
          rows.unshift({
            repository,
            repoName,
            workingDirectory,
            branch: label,
            current: true,
            active: isActive,
          });
        }
        rows.sort((a, b) => {
          if (a.current !== b.current) return a.current ? -1 : 1;
          return a.branch.localeCompare(b.branch);
        });
        return rows;
      }),
    );

    if (!this.selectListView.isVisible()) {
      return;
    }

    const items = groups
      .sort((a, b) => {
        if (a[0].active !== b[0].active) return a[0].active ? -1 : 1;
        return a[0].repoName.localeCompare(b[0].repoName);
      })
      .flat();
    await this.selectListView.update({ items, loadingMessage: null });
  }

  hide() {
    this.selectListView.hide();
  }

  destroy() {
    this.selectListView.destroy();
  }
};
