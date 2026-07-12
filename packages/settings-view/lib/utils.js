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

  let repo;

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

// Package identity, in one place.
//
// A package has two identities that must not be confused:
//   * its NAME is the install SLOT — the install directory, command prefix,
//     config namespace, and activation. Only one package per name can be
//     installed, so the name is unique *among installed packages* but NOT
//     globally: the same name may be published from many sources.
//   * its ORIGIN is the SOURCE PATH (the repository / install source). This is
//     the globally unique identity used to browse, deduplicate catalogs, match
//     update candidates, and decide whether an install would collide.
//
// `packageOrigin` resolves the origin from whatever shape it is handed (a
// catalog entry, a Pulsar entry, a Git-install card, or installed metadata),
// most authoritative first. The package.json `repository` field is the LAST
// resort because it is unreliable in forks — a fork usually still points its
// repository at the upstream, which would otherwise make an unrelated
// same-named package look like the installed one.
const packageOrigin = (pack) => {
  if (!pack) return "";
  const install = pack.apmInstallSource;
  const candidates = [
    // `apmInstallSource.origin` is the canonical origin recorded at install time
    // from the source actually cloned — authoritative, so it wins.
    install && install.origin,
    pack.installSource,
    install && install.source,
    install && install.repository,
    pack.repository,
  ];
  for (const candidate of candidates) {
    const key = packageOriginKey(candidate);
    if (key) return key;
  }
  return "";
};

// The full identity of a package: its install slot (name) and its unique origin.
const packageCoordinate = (pack) => ({
  name: pack ? pack.name : undefined,
  origin: packageOrigin(pack),
});

// The origin key(s) identifying where an installed package actually came from.
// Kept as an array for callers that match with `includes`; today this is the
// single canonical origin.
const installedOriginKeys = (metadata) => {
  const origin = packageOrigin(metadata);
  return origin ? [origin] : [];
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
  packageOrigin,
  packageCoordinate,
  installedOriginKeys,
  getInstalledPackageMetadata,
  packageComparatorAscending,
};
