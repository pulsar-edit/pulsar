const fs = require("fs");
const path = require("path");

function statSyncNoException(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    return false;
  }
}

function lstatSyncNoException(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (e) {
    return false;
  }
}

function isFileSync(filePath) {
  const stat = statSyncNoException(filePath);
  return stat ? stat.isFile() : false;
}

function isDirectorySync(filePath) {
  const stat = statSyncNoException(filePath);
  return stat ? stat.isDirectory() : false;
}

function isSymbolicLinkSync(filePath) {
  const stat = lstatSyncNoException(filePath);
  return stat ? stat.isSymbolicLink() : false;
}

let caseInsensitiveFs = null;
function isCaseInsensitive() {
  if (caseInsensitiveFs === null) {
    const lower = statSyncNoException(process.execPath.toLowerCase());
    const upper = statSyncNoException(process.execPath.toUpperCase());
    if (lower && upper) {
      caseInsensitiveFs = lower.dev === upper.dev && lower.ino === upper.ino;
    } else {
      caseInsensitiveFs = false;
    }
  }
  return caseInsensitiveFs;
}

function makeTreeSync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copySync(sourcePath, destinationPath) {
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

function copyAsync(sourcePath, destinationPath, callback) {
  fs.cp(sourcePath, destinationPath, { recursive: true }, callback);
}

function moveSync(source, target) {
  if (fs.existsSync(target)) {
    const sourceStat = statSyncNoException(source);
    const targetStat = statSyncNoException(target);
    if (
      !sourceStat ||
      !targetStat ||
      sourceStat.dev !== targetStat.dev ||
      sourceStat.ino !== targetStat.ino
    ) {
      const error = new Error(`'${target}' already exists.`);
      error.code = "EEXIST";
      throw error;
    }
  }
  const targetParent = path.dirname(target);
  if (!fs.existsSync(targetParent)) {
    makeTreeSync(targetParent);
  }
  fs.renameSync(source, target);
}

function listSync(rootPath) {
  if (!isDirectorySync(rootPath)) return [];
  return fs
    .readdirSync(rootPath)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((child) => path.join(rootPath, child));
}

const COMPRESSED_EXTENSIONS = new Set([
  ".bz2",
  ".egg",
  ".epub",
  ".gem",
  ".gz",
  ".jar",
  ".lz",
  ".lzma",
  ".lzo",
  ".rar",
  ".tar",
  ".tgz",
  ".war",
  ".whl",
  ".xpi",
  ".xz",
  ".z",
  ".zip",
]);

const IMAGE_EXTENSIONS = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
  ".webp",
]);

const BINARY_EXTENSIONS = new Set([
  ".ds_store",
  ".a",
  ".exe",
  ".o",
  ".pyc",
  ".pyo",
  ".so",
  ".woff",
]);

const MARKDOWN_EXTENSIONS = new Set([
  ".markdown",
  ".md",
  ".mdown",
  ".mkd",
  ".mkdown",
  ".rmd",
  ".ron",
]);

function isReadmePath(readmePath) {
  const ext = path.extname(readmePath);
  const base = path.basename(readmePath, ext).toLowerCase();
  return base === "readme" && (ext === "" || MARKDOWN_EXTENSIONS.has(ext.toLowerCase()));
}

function isCompressedExtension(ext) {
  return ext != null && COMPRESSED_EXTENSIONS.has(ext.toLowerCase());
}

function isImageExtension(ext) {
  return ext != null && IMAGE_EXTENSIONS.has(ext.toLowerCase());
}

function isPdfExtension(ext) {
  return ext != null && ext.toLowerCase() === ".pdf";
}

function isBinaryExtension(ext) {
  return ext != null && BINARY_EXTENSIONS.has(ext.toLowerCase());
}

function absolute(relativePath) {
  if (relativePath == null) return null;
  const homeDir = require("os").homedir();
  if (relativePath === "~") return homeDir;
  if (relativePath.startsWith("~" + path.sep) || relativePath.startsWith("~/")) {
    return path.join(homeDir, relativePath.slice(2));
  }
  return path.resolve(relativePath);
}

// Re-export native fs methods alongside our helpers
module.exports = Object.assign({}, fs, {
  absolute,
  statSyncNoException,
  lstatSyncNoException,
  isFileSync,
  isDirectorySync,
  isSymbolicLinkSync,
  isCaseInsensitive,
  makeTreeSync,
  copySync,
  copy: copyAsync,
  moveSync,
  listSync,
  isReadmePath,
  isCompressedExtension,
  isImageExtension,
  isPdfExtension,
  isBinaryExtension,
});
