const fs = require("fs");
const path = require("path");

const IS_WINDOWS = process.platform === "win32";

// Pure-JS reimplementation of the path helpers libgit2's git-utils exposed, so
// GitRepository can relativize paths and answer working-directory queries
// without a native call. Kept byte-for-byte compatible with git-utils
// (realpath resolution, Windows 8.3 short-name handling, case-insensitive
// filesystems, symlinked working directories) and gated by a parity spec.

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

function trimPath(filePath) {
  if (!filePath.endsWith("/")) return filePath;
  return filePath.replace(/\/$/, "");
}

function normalizePath(filePath, useRealpath = true) {
  if (typeof filePath !== "string") return filePath;
  // On Windows always resolve realpath so 8.3 short names normalize to their
  // long form; off Windows only when asked.
  if (useRealpath || IS_WINDOWS) filePath = realpath(filePath);
  if (!IS_WINDOWS) return filePath;
  return filePath.replace(/\\/g, "/");
}

// Resolve a (possibly non-existent) path to its real path by walking up to the
// first existing ancestor and reattaching the remainder.
function realpathRecursive(unrealPath) {
  let currentPath = unrealPath;
  let result = unrealPath;
  let remainder = "";
  if (!path.isAbsolute(unrealPath)) return realpath(unrealPath);
  while (!isRootPath(currentPath)) {
    try {
      result =
        typeof fs.realpathSync.native === "function"
          ? fs.realpathSync.native(currentPath)
          : fs.realpathSync(currentPath);
      break;
    } catch (error) {
      if (error.code === "ENOENT") {
        currentPath = path.resolve(currentPath, "..");
        remainder = path.relative(currentPath, unrealPath);
      } else {
        return unrealPath;
      }
    }
  }
  if (isRootPath(currentPath)) return unrealPath;
  return normalizePath(trimPath(`${result}/${remainder}`));
}

function pathStartsWith(pathA, pathB, caseInsensitive = false, useRealpath = true) {
  if (IS_WINDOWS) {
    pathA = normalizePath(pathA, useRealpath);
    pathB = normalizePath(pathB, useRealpath);
  }
  if (caseInsensitive) {
    pathA = pathA.toLowerCase();
    pathB = pathB.toLowerCase();
  }
  if (!pathB.endsWith("/")) pathB = `${pathB}/`;
  return pathA.startsWith(pathB);
}

function pathsAreEqual(pathA, pathB, caseInsensitive = false, useRealpath = true) {
  if (typeof pathA !== "string" || typeof pathB !== "string") return false;

  pathA = normalizePath(pathA, useRealpath);
  pathB = normalizePath(pathB, useRealpath);

  if (IS_WINDOWS || caseInsensitive) {
    pathA = pathA.toLowerCase();
    pathB = pathB.toLowerCase();
  }

  const result = pathA === pathB;
  if (result || !IS_WINDOWS) return result;
  if (!pathA.includes("~") && !pathB.includes("~")) return result;

  // One side is an 8.3 short name; compare filesystem identity.
  if (!fs.existsSync(pathA) || !fs.existsSync(pathB)) return result;
  const statA = fs.statSync(pathA);
  const statB = fs.statSync(pathB);
  return statA.ino === statB.ino && statA.dev === statB.dev;
}

// Make `filePath` relative to the repository working directory. Mirrors
// git-utils Repository.prototype.relativize: returns "" for the working
// directory itself and passes through paths outside it unchanged.
function relativize(filePath, workingDirectory, openedWorkingDirectory, caseInsensitive) {
  if (!filePath) return filePath;
  filePath = realpathRecursive(filePath);

  if (!IS_WINDOWS && filePath[0] !== "/") return filePath;

  for (const directory of [workingDirectory, openedWorkingDirectory]) {
    if (!directory) continue;
    if (pathStartsWith(filePath, directory, caseInsensitive, false)) {
      return filePath.substring(directory.length + 1);
    } else if (pathsAreEqual(filePath, directory, caseInsensitive, false)) {
      return "";
    }
  }

  return filePath;
}

module.exports = {
  relativize,
  normalizePath,
  pathStartsWith,
  pathsAreEqual,
  realpathRecursive,
};
