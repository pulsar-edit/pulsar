const ff = require("finden-filum");
const fs = require("fs-plus");

class DefaultFileIcons {

  iconClassForPath(filePath) {
    let ext = ff(filePath);
    let extString = ff(filePath, { extension: true });

    if (fs.isSymbolicLinkSync(filePath)) {
      return "icon-file-symlink-file";
    } else if (typeof ext === "undefined") {
      // If `ff` is unable to match the extension undefined is returned
      return "icon-file-text";
    } else if (ext.contains("archive")) {
      return "icon-file-zip";
    } else if (ext.contains("media")) {
      return "icon-file-media";
    } else if (ext.contains("office")) {
      return "icon-file-pdf";
    } else if (ext.contains("binary") || ext.contains("executable")) {
      return "icon-file-binary";
    } else if (this.isReadmePath(filePath, ext, extString)) {
      return "icon-book";
    } else if (this.isCodeOfConductPath(filePath, ext, extString)) {
      return "icon-code-of-conduct";
    } else {
      return "icon-file-text";
    }
  }

  isReadmePath(filePath, ext, extString) {
    if ((extString === "" || ext.contains("text")) && filePath.toLowerCase().includes("readme")) {
      return true;
    } else {
      return false;
    }
  }

  isCodeOfConductPath(filePath, ext, extString) {
    if (
      (extString === "" || ext.contains("text")) &&
      filePath.toLowerCase().replace(/_|\s/g, "-").includes("code-of-conduct")
      // Above we replace all '_' and spaces in the path with '-' to make comparison easy
    ) {
      return true;
    } else {
      return false;
    }
  }

}

module.exports = new DefaultFileIcons();
