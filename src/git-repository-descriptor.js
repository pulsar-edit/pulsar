const fs = require("@lumine-code/fs-plus");
const path = require("path");
const { normalizePath, pathsAreEqual } = require("./repository-paths");

const IS_WINDOWS = process.platform === "win32";

// Pure-JS replacement for the libgit2-backed repository handle git-utils
// returned from `open()`. Given any path inside (or at) a Git repository it
// discovers the Git directory, the working directory, filesystem case
// sensitivity, and the configured submodule paths — everything GitRepository
// needs for identity and path routing, without a native module. It intentionally
// mirrors git-utils/libgit2 semantics (realpath resolution, Windows short names,
// worktree/submodule/bare working directories) and is covered by a parity spec
// that compares it against live git-utils.

function realpath(unrealPath) {
  try {
    return typeof fs.realpathSync.native === "function"
      ? fs.realpathSync.native(unrealPath)
      : fs.realpathSync(unrealPath);
  } catch {
    return unrealPath;
  }
}

function isRootPath(candidate) {
  return IS_WINDOWS ? /^[a-zA-Z]+:[\\/]$/.test(candidate) : candidate === path.sep;
}

function statOrNull(candidate) {
  try {
    return fs.statSync(candidate);
  } catch {
    return null;
  }
}

// libgit2's valid-repository heuristic (valid_repository_path): a directory is a
// Git directory when it has a HEAD file plus objects/ and refs/ directories,
// following the `commondir` pointer used by linked worktrees. Matching libgit2,
// objects/ and refs/ must be directories — a bare file of the same name (as in
// the "invalid repository" specs) does not qualify.
function isGitDirectory(directory) {
  let commonDir = directory;
  try {
    const commonDirValue = fs.readFileSync(path.join(directory, "commondir"), "utf8").trim();
    if (commonDirValue) {
      commonDir = path.resolve(directory, commonDirValue);
      if (!statOrNull(commonDir)) return false;
    }
  } catch {
    // No commondir file: the directory is its own common directory.
  }
  const objects = statOrNull(path.join(commonDir, "objects"));
  const refs = statOrNull(path.join(commonDir, "refs"));
  return (
    Boolean(statOrNull(path.join(directory, "HEAD"))) &&
    Boolean(objects && objects.isDirectory()) &&
    Boolean(refs && refs.isDirectory())
  );
}

const GIT_FILE_REGEX = /^gitdir:\s*(.+)$/m;

// Resolve a `.git` file (`gitdir: <path>`) to the directory it points at.
function resolveGitFile(gitFilePath, baseDirectory) {
  try {
    const match = fs.readFileSync(gitFilePath, "utf8").match(GIT_FILE_REGEX);
    if (!match) return null;
    return path.resolve(baseDirectory, match[1].trim());
  } catch {
    return null;
  }
}

// Shallow parse of the repository's own config for the handful of `core` keys
// that determine the working directory. These keys only ever live in the
// repository config (never global/system), so reading `<gitDir>/config`
// directly matches libgit2.
function readCoreConfig(gitDir) {
  const core = {};
  let text;
  try {
    text = fs.readFileSync(path.join(gitDir, "config"), "utf8");
  } catch {
    return core;
  }
  let inCore = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const section = /^\[([^\]]+)\]/.exec(line);
    if (section) {
      inCore = section[1].trim().toLowerCase() === "core";
      continue;
    }
    if (!inCore) continue;
    const kv = /^([A-Za-z0-9-]+)\s*=\s*(.*)$/.exec(line);
    if (kv) core[kv[1].toLowerCase()] = kv[2].trim();
  }
  return core;
}

function parseGitBoolean(value) {
  return value != null && /^(true|yes|on|1)$/i.test(String(value).trim());
}

// Compute libgit2's `git_repository_workdir` for a Git directory: null for a bare
// repository, `core.worktree` when set, the pointed-at working tree for a linked
// worktree, and otherwise the directory that contains the Git directory.
function computeWorkingDirectory(gitDir) {
  const core = readCoreConfig(gitDir);
  if (parseGitBoolean(core.bare)) return null;
  if (core.worktree) return path.resolve(gitDir, core.worktree);

  const gitdirPointer = path.join(gitDir, "gitdir");
  const pointerStat = statOrNull(gitdirPointer);
  if (pointerStat && pointerStat.isFile()) {
    try {
      const pointed = fs.readFileSync(gitdirPointer, "utf8").trim();
      if (pointed) return path.dirname(pointed);
    } catch {
      // Fall through to the containing directory.
    }
  }

  return path.dirname(gitDir);
}

// Walk up from a starting path to the nearest Git directory the way
// `git_repository_discover` (and git-utils `open(path, search=true)`) does.
function discoverGitDirectory(startPath) {
  if (!startPath) return null;
  let current = path.resolve(startPath);
  if (!statOrNull(current)) return null;

  while (true) {
    const dotGit = path.join(current, ".git");
    const dotGitStat = statOrNull(dotGit);
    if (dotGitStat) {
      if (dotGitStat.isDirectory() && isGitDirectory(dotGit)) return dotGit;
      if (dotGitStat.isFile()) {
        const resolved = resolveGitFile(dotGit, current);
        if (resolved && isGitDirectory(resolved)) return resolved;
      }
    }
    if (isGitDirectory(current)) return current;

    const parent = path.dirname(current);
    if (parent === current || isRootPath(current)) return null;
    current = parent;
  }
}

// Replicates git-utils openRepository's symlink handling: when the opened path is
// reached through a symlink, remember the un-resolved directory that maps to the
// working directory so paths arriving through that symlink still route.
function computeOpenedWorkingDirectory(startPath, workingDirectory, caseInsensitive) {
  if (!workingDirectory) return null;
  if (realpath(startPath) === startPath) return null;

  let candidate = normalizePath(startPath, false);
  while (!isRootPath(candidate)) {
    if (pathsAreEqual(candidate, workingDirectory, caseInsensitive)) return candidate;
    candidate = path.resolve(candidate, "..");
  }
  return null;
}

class GitRepositoryDescriptor {
  constructor(gitDir, startPath) {
    this.gitDir = realpath(gitDir);

    const rawWorkingDirectory = computeWorkingDirectory(this.gitDir);
    this.workingDirectory = rawWorkingDirectory
      ? normalizePath(rawWorkingDirectory, true).replace(/\/$/, "")
      : null;

    this.caseInsensitiveFs = fs.isCaseInsensitive();
    this.openedWorkingDirectory = computeOpenedWorkingDirectory(
      startPath ?? gitDir,
      this.workingDirectory,
      this.caseInsensitiveFs,
    );

    this._submodulePaths = null;
  }

  // The Git directory path, matching git-utils getPath().
  getPath() {
    return this.gitDir;
  }

  getWorkingDirectory() {
    return this.workingDirectory;
  }

  // Configured submodule working-tree paths (POSIX, relative to the working
  // directory), read from `.gitmodules`.
  getSubmodulePaths() {
    if (this._submodulePaths) return this._submodulePaths;

    const paths = [];
    if (this.workingDirectory) {
      try {
        const text = fs.readFileSync(path.join(this.workingDirectory, ".gitmodules"), "utf8");
        let inSubmodule = false;
        for (const rawLine of text.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (/^\[submodule\b/i.test(line)) {
            inSubmodule = true;
            continue;
          }
          if (line.startsWith("[")) {
            inSubmodule = false;
            continue;
          }
          if (!inSubmodule) continue;
          const match = /^path\s*=\s*(.+)$/.exec(line);
          if (match) paths.push(match[1].trim());
        }
      } catch {
        // No .gitmodules: no configured submodules.
      }
    }
    this._submodulePaths = paths;
    return paths;
  }

  // Whether a repository-relative path is a configured submodule.
  isSubmodule(relativePath) {
    if (!relativePath) return false;
    const normalized = relativePath.split(path.sep).join("/");
    return this.getSubmodulePaths().includes(normalized);
  }
}

// Discover the repository for a starting path and build its descriptor, or null
// when the path is not inside a repository.
function discoverRepositoryDescriptor(startPath) {
  const gitDir = discoverGitDirectory(startPath);
  if (!gitDir) return null;
  return new GitRepositoryDescriptor(gitDir, startPath);
}

module.exports = {
  GitRepositoryDescriptor,
  discoverRepositoryDescriptor,
  discoverGitDirectory,
  computeWorkingDirectory,
};
