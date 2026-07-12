const fs = require("fs");
const path = require("path");

const ownerFromRepository = (repository) => {
  if (!repository) return "";

  const loginRegex = /github\.com\/([\w-]+)\/.+/;
  let repo = repository;
  if (typeof repository !== "string") {
    repo = repository.url;
    if (repo.match("git@github")) {
      const repoName = repo.split(":")[1];
      repo = `https://github.com/${repoName}`;
    }
  }

  if (!repo.match("github.com/")) {
    repo = `https://github.com/${repo}`;
  }

  const match = repo.match(loginRegex);
  return match ? match[1] : "";
};

const repoUrlFromRepository = (repository) => {
  if (!repository) return "";

  let repo = repository;

  if (typeof repository === "string") {
    repo = repository;
  } else if (typeof repository === "object" && typeof repository.url === "string") {
    repo = repository.url;
  } else {
    repo = "";
  }

  if (repo.endsWith(".git")) {
    repo = repo.replace(".git", "");
  }

  return repo;
};

// Reduces any supported repository notation (owner/repo shorthand with
// optional @tag/#commit/~branch pin, https/ssh/git URLs, package.json
// repository objects) to a bare "owner/repo" reference.
const normalizeRepository = (repository, { lowercase = false } = {}) => {
  let repo = "";
  if (typeof repository === "string") {
    repo = repository;
  } else if (repository && typeof repository.url === "string") {
    repo = repository.url;
  }
  repo = repo.trim();
  if (lowercase) repo = repo.toLowerCase();
  repo = repo
    .replace(/^git\+/i, "")
    .replace(/\.git$/i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/^(?:https?|ssh|git):\/\/(?:[^@/]+@)?(?:www\.)?github\.com\//i, "")
    .replace(/\/+$/, "");
  const match = repo.match(/^([\w.-]+\/[\w.-]+?)([@#~].*)?$/);
  return match ? match[1] : repo;
};

// A comparable identity for a package: the lowercased "owner/repo" origin.
const packageOriginKey = (repository) => normalizeRepository(repository, { lowercase: true });

// A human-facing "owner/repo" reference for display, preserving case.
const repoReferenceFromRepository = (repository) => normalizeRepository(repository);

// The origin key(s) identifying where an installed package actually came from.
// Prefers apmInstallSource (the source it was fetched from) over the package.json
// "repository" field, which is unreliable in forks — a fork usually still points
// its repository at the upstream, which would otherwise make an unrelated
// same-named package look like the installed one.
const installedOriginKeys = (metadata) => {
  if (!metadata) return [];
  const install = metadata.apmInstallSource;
  const refs =
    install && (install.source || install.repository)
      ? [install.source, install.repository]
      : [metadata.repository];
  return refs.map(packageOriginKey).filter(Boolean);
};

// Returns the metadata of the installed package with the given name, whether
// it is loaded or merely present in a package directory, or null.
const getInstalledPackageMetadata = (name) => {
  const loadedPackage = atom.packages.getLoadedPackage(name);
  if (loadedPackage && loadedPackage.metadata) return loadedPackage.metadata;
  for (const dirPath of atom.packages.getPackageDirPaths()) {
    try {
      return JSON.parse(fs.readFileSync(path.join(dirPath, name, "package.json"), "utf8"));
    } catch {
      // not installed in this directory; keep looking
    }
  }
  return null;
};

const packageComparatorAscending = (left, right) => {
  const leftStatus = atom.packages.isPackageDisabled(left.name);
  const rightStatus = atom.packages.isPackageDisabled(right.name);
  if (leftStatus === rightStatus) {
    if (left.name > right.name) {
      return -1;
    } else if (left.name < right.name) {
      return 1;
    } else {
      return 0;
    }
  } else if (leftStatus > rightStatus) {
    return -1;
  } else {
    return 1;
  }
};

module.exports = {
  ownerFromRepository,
  repoUrlFromRepository,
  packageOriginKey,
  repoReferenceFromRepository,
  installedOriginKeys,
  getInstalledPackageMetadata,
  packageComparatorAscending,
};
