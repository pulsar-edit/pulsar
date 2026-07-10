const path = require("path");
const {
  isSymbolicLinkSync,
  isReadmePath,
  isCompressedExtension,
  isImageExtension,
  isPdfExtension,
  isBinaryExtension,
} = require("./helpers");

class DefaultFileIcons {
  iconClassForPath(filePath) {
    const extension = path.extname(filePath);

    if (isSymbolicLinkSync(filePath)) {
      return "icon-file-symlink-file";
    } else if (isReadmePath(filePath)) {
      return "icon-book";
    } else if (isCompressedExtension(extension)) {
      return "icon-file-zip";
    } else if (isImageExtension(extension)) {
      return "icon-file-media";
    } else if (isPdfExtension(extension)) {
      return "icon-file-pdf";
    } else if (isBinaryExtension(extension)) {
      return "icon-file-binary";
    } else {
      return "icon-file-text";
    }
  }
}

module.exports = new DefaultFileIcons();
