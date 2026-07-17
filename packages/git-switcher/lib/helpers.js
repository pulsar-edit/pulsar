const path = require("path");

function repositoryWorkingDirectory(repository) {
  try {
    return repository?.getWorkingDirectory?.() || null;
  } catch {
    return null;
  }
}

function repositoryDisplayName(repository) {
  const workingDirectory = repositoryWorkingDirectory(repository);
  return workingDirectory ? path.basename(workingDirectory) : "repository";
}

// Human-readable label for a repository's current head: the branch name, a
// short commit id when detached, or the unborn branch's name before the first
// commit. Falls back to the synchronous cache until the snapshot loads.
function headLabel(repository) {
  const snapshot = repository?.getStatusSnapshot?.();
  if (snapshot?.initialized) {
    if (snapshot.head.detached) {
      return snapshot.head.oid ? snapshot.head.oid.slice(0, 7) : "";
    }
    return snapshot.head.name || "";
  }
  return repository?.getShortHead?.() || "";
}

function checkoutBranch(repository, branchName, options = {}) {
  const operations = repository.getOperations?.();
  if (!operations) {
    atom.notifications.addError(`Cannot check out '${branchName}'`, {
      description: "This repository does not support write operations.",
      dismissable: true,
    });
    return Promise.resolve(null);
  }
  return operations
    .checkout(branchName, options)
    .then(() => true)
    .catch((error) => {
      atom.notifications.addError(`Checkout of '${branchName}' failed`, {
        detail: error.stderr || error.message,
        dismissable: true,
      });
      return false;
    });
}

// The single item source shared by the switch list and both tile menus: one
// row per repository × local branch, ordered with the active repository first
// and each repository's current branch first. Unborn or detached repositories
// get a synthetic current row so they stay reachable.
async function buildSwitchItems() {
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

  return groups
    .sort((a, b) => {
      if (a[0].active !== b[0].active) return a[0].active ? -1 : 1;
      return a[0].repoName.localeCompare(b[0].repoName);
    })
    .flat();
}

// Selecting a row makes its repository active; selecting a non-current branch
// also checks it out. Switch first so a failed checkout still lands in the
// target repository.
function applySwitchItem(item, { pin = false } = {}) {
  try {
    atom.repositories.setActiveRepository(item.repository, { pin });
  } catch {
    // The repository was destroyed while the picker was open.
    return;
  }
  if (!item.current) {
    checkoutBranch(item.repository, item.branch);
  }
}

module.exports = {
  applySwitchItem,
  buildSwitchItems,
  checkoutBranch,
  headLabel,
  repositoryDisplayName,
  repositoryWorkingDirectory,
};
