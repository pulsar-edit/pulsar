const fs = require("fs");
const path = require("path");
const GitRepository = require("./git-repository");

const GIT_FILE_REGEX = RegExp("^gitdir: (.+)");

// Returns the .gitdir path in the agnostic Git symlink .git file given, or
// null if the path is not a valid gitfile.
//
// * `gitFile` {String} path of gitfile to parse
function pathFromGitFileSync(gitFile) {
  try {
    const gitFileBuff = fs.readFileSync(gitFile, "utf8");
    return gitFileBuff != null ? gitFileBuff.match(GIT_FILE_REGEX)[1] : null;
  } catch {
    /* ignore */
  }
}

// Returns a {Promise} that resolves to the .gitdir path in the agnostic
// Git symlink .git file given, or null if the path is not a valid gitfile.
//
// * `gitFile` {String} path of gitfile to parse
function pathFromGitFile(gitFile) {
  return new Promise((resolve) => {
    fs.readFile(gitFile, "utf8", (err, gitFileBuff) => {
      if (err == null && gitFileBuff != null) {
        const result = gitFileBuff.toString().match(GIT_FILE_REGEX);
        resolve(result != null ? result[1] : null);
      } else {
        resolve(null);
      }
    });
  });
}

// Resolve a `.git` reference (which may be relative) against the directory that
// contained it.
function resolveGitPath(basePath, referencePath) {
  return path.isAbsolute(referencePath)
    ? path.normalize(referencePath)
    : path.normalize(path.join(basePath, referencePath));
}

// True once `path.dirname` stops making progress — i.e. we've reached a
// filesystem root.
function isRootPath(directoryPath) {
  return path.dirname(directoryPath) === directoryPath;
}

// Checks whether a valid `.git` directory is contained within the given
// directory or one of its ancestors. If so, the absolute {String} path of the
// `.git` folder is returned. Otherwise, returns `null`.
//
// * `directoryPath` {String} to explore whether it is part of a Git repository.
function findGitDirectorySync(directoryPath) {
  let gitDir = path.join(directoryPath, ".git");
  const gitDirPath = pathFromGitFileSync(gitDir);
  if (gitDirPath) {
    gitDir = resolveGitPath(directoryPath, gitDirPath);
  }
  if (fs.existsSync(gitDir) && isValidGitDirectorySync(gitDir)) {
    return gitDir;
  } else if (isRootPath(directoryPath)) {
    return null;
  } else {
    return findGitDirectorySync(path.dirname(directoryPath));
  }
}

// Returns a {Promise} that resolves to the absolute {String} path of the `.git`
// folder contained within the given directory or one of its ancestors, or
// `null` if none is found.
//
// * `directoryPath` {String} to explore whether it is part of a Git repository.
async function findGitDirectory(directoryPath) {
  let gitDir = path.join(directoryPath, ".git");
  const gitDirPath = await pathFromGitFile(gitDir);
  if (gitDirPath) {
    gitDir = resolveGitPath(directoryPath, gitDirPath);
  }
  if ((await pathExists(gitDir)) && (await isValidGitDirectory(gitDir))) {
    return gitDir;
  } else if (isRootPath(directoryPath)) {
    return null;
  } else {
    return findGitDirectory(path.dirname(directoryPath));
  }
}

function pathExists(target) {
  return fs.promises.access(target).then(
    () => true,
    () => false,
  );
}

// Returns a boolean indicating whether the specified `.git` directory represents
// a Git repository. Uses the heuristic adopted by libgit2's
// `valid_repository_path()`.
//
// * `gitDirPath` {String} path whose base name is `.git`.
function isValidGitDirectorySync(gitDirPath) {
  const commonDirFile = path.join(gitDirPath, "commondir");
  let commonDir;
  if (fs.existsSync(commonDirFile)) {
    const commonDirPathString = fs.readFileSync(commonDirFile, "utf8").trim();
    commonDir = resolveGitPath(gitDirPath, commonDirPathString);
    if (!fs.existsSync(commonDir)) {
      return false;
    }
  } else {
    commonDir = gitDirPath;
  }
  return (
    fs.existsSync(path.join(gitDirPath, "HEAD")) &&
    fs.existsSync(path.join(commonDir, "objects")) &&
    fs.existsSync(path.join(commonDir, "refs"))
  );
}

// Returns a {Promise} that resolves to a {Boolean} indicating whether the
// specified `.git` directory represents a Git repository.
//
// * `gitDirPath` {String} path whose base name is `.git`.
async function isValidGitDirectory(gitDirPath) {
  const commonDirFile = path.join(gitDirPath, "commondir");
  let commonDir;
  if (await pathExists(commonDirFile)) {
    const commonDirPathString = (await fs.promises.readFile(commonDirFile, "utf8")).trim();
    commonDir = resolveGitPath(gitDirPath, commonDirPathString);
    if (!(await pathExists(commonDir))) {
      return false;
    }
  } else {
    commonDir = gitDirPath;
  }
  return (
    (await pathExists(path.join(gitDirPath, "HEAD"))) &&
    (await pathExists(path.join(commonDir, "objects"))) &&
    (await pathExists(path.join(commonDir, "refs")))
  );
}

// Extract an absolute directory path from either a directory value object (with
// `getPath`) or a plain {String}.
function toDirectoryPath(directory) {
  return typeof directory === "string" ? directory : directory.getPath();
}

// Provider that conforms to the atom.repository-provider@0.1.0 service.
class GitRepositoryProvider {
  constructor(project, config) {
    // Keys are real paths that end in `.git`.
    // Values are the corresponding GitRepository objects.
    this.project = project;
    this.config = config;
    this.pathToRepository = {};
  }

  // Returns a {Promise} that resolves with either:
  // * {GitRepository} if the given directory has a Git repository.
  // * `null` if the given directory does not have a Git repository.
  async repositoryForDirectory(directory) {
    // Only one GitRepository should be created for each .git folder. Therefore,
    // we must check directory and its parent directories to find the nearest
    // .git folder.
    const gitDir = await findGitDirectory(toDirectoryPath(directory));
    return this.repositoryForGitDirectory(gitDir);
  }

  // Returns either:
  // * {GitRepository} if the given directory has a Git repository.
  // * `null` if the given directory does not have a Git repository.
  repositoryForDirectorySync(directory) {
    // Only one GitRepository should be created for each .git folder. Therefore,
    // we must check directory and its parent directories to find the nearest
    // .git folder.
    const gitDir = findGitDirectorySync(toDirectoryPath(directory));
    return this.repositoryForGitDirectory(gitDir);
  }

  // Returns either:
  // * {GitRepository} if the given Git directory has a Git repository.
  // * `null` if the given directory does not have a Git repository.
  repositoryForGitDirectory(gitDirPath) {
    if (!gitDirPath) {
      return null;
    }

    let repo = this.pathToRepository[gitDirPath];
    if (!repo) {
      repo = GitRepository.open(gitDirPath, {
        project: this.project,
        config: this.config,
      });
      if (!repo) {
        return null;
      }
      repo.onDidDestroy(() => delete this.pathToRepository[gitDirPath]);
      this.pathToRepository[gitDirPath] = repo;
      // Do not eagerly refresh here. The render-path status summaries prefer the
      // Git snapshot, which loads lazily on its first subscriber and schedules
      // its own refresh. Refreshing synchronously at open time would repeat a
      // status pass for every discovered repository at startup.
    }
    return repo;
  }
}

module.exports = GitRepositoryProvider;
