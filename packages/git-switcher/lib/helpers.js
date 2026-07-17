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

function checkoutBranch(repository, branchName) {
  const operations = repository.getOperations?.();
  if (!operations) {
    atom.notifications.addError(`Cannot check out '${branchName}'`, {
      description: "This repository does not support write operations.",
      dismissable: true,
    });
    return Promise.resolve(null);
  }
  return operations.checkout(branchName).catch((error) => {
    atom.notifications.addError(`Checkout of '${branchName}' failed`, {
      detail: error.stderr || error.message,
      dismissable: true,
    });
    return null;
  });
}

module.exports = {
  checkoutBranch,
  headLabel,
  repositoryDisplayName,
  repositoryWorkingDirectory,
};
