const fs = require("fs");
const path = require("path");

class LRUCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const iconCache = new LRUCache();

function iconClassForPath(filePath) {
  const cached = iconCache.get(filePath);
  if (cached) return cached;

  const extension = path.extname(filePath);
  let result;

  try {
    const lstat = fs.lstatSync(filePath);
    if (lstat.isDirectory()) {
      result = lstat.isSymbolicLink() ? ["icon-file-symlink-directory"] : ["icon-file-directory"];
    } else if (lstat.isSymbolicLink()) {
      result = ["icon-file-symlink-file"];
    } else if (isReadmePath(extension, filePath)) {
      result = ["icon-book"];
    } else if (isCompressedExtension(extension)) {
      result = ["icon-file-zip"];
    } else if (isImageExtension(extension)) {
      result = ["icon-file-media"];
    } else if (isPdfExtension(extension)) {
      result = ["icon-file-pdf"];
    } else if (isBinaryExtension(extension)) {
      result = ["icon-file-binary"];
    } else {
      result = ["icon-file-text"];
    }
  } catch {
    result = ["icon-file-text"];
  }

  iconCache.set(filePath, result);
  return result;
}

iconClassForPath.invalidate = function (filePath) {
  iconCache.delete(filePath);
};

iconClassForPath.invalidateAll = function () {
  iconCache.clear();
};

module.exports = iconClassForPath;

const MARKDOWN_EXTENSIONS = {
  ".markdown": true,
  ".md": true,
  ".mdown": true,
  ".mkd": true,
  ".mkdown": true,
  ".rmd": true,
  ".ron": true,
};

const COMPRESSED_EXTENSIONS = {
  ".bz2": true,
  ".egg": true,
  ".epub": true,
  ".gem": true,
  ".gz": true,
  ".jar": true,
  ".lz": true,
  ".lzma": true,
  ".lzo": true,
  ".rar": true,
  ".tar": true,
  ".tgz": true,
  ".war": true,
  ".whl": true,
  ".xpi": true,
  ".xz": true,
  ".z": true,
  ".zip": true,
};

const IMAGE_EXTENSIONS = {
  ".gif": true,
  ".ico": true,
  ".jpeg": true,
  ".jpg": true,
  ".png": true,
  ".tif": true,
  ".tiff": true,
  ".webp": true,
};

const BINARY_EXTENSIONS = {
  ".ds_store": true,
  ".a": true,
  ".exe": true,
  ".o": true,
  ".pyc": true,
  ".pyo": true,
  ".so": true,
  ".woff": true,
};

function isReadmePath(ext, readmePath) {
  const base = path.basename(readmePath, ext).toLowerCase();
  return base === "readme" && (ext === "" || isMarkdownExtension(ext));
}

function isMarkdownExtension(ext) {
  return ext != null && MARKDOWN_EXTENSIONS[ext.toLowerCase()] !== undefined;
}

function isCompressedExtension(ext) {
  return ext != null && COMPRESSED_EXTENSIONS[ext.toLowerCase()] !== undefined;
}

function isImageExtension(ext) {
  return ext != null && IMAGE_EXTENSIONS[ext.toLowerCase()] !== undefined;
}

function isPdfExtension(ext) {
  return ext?.toLowerCase() === ".pdf";
}

function isBinaryExtension(ext) {
  return ext != null && BINARY_EXTENSIONS[ext.toLowerCase()] !== undefined;
}
