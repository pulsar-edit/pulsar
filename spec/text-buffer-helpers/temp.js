const fs = require("fs");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");

const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), "text-buffer-"));

process.on("exit", () => fs.rmSync(rootPath, { recursive: true, force: true }));

module.exports = {
  track() {},

  mkdirSync(prefix = "directory") {
    return fs.mkdtempSync(path.join(rootPath, `${prefix}-`));
  },

  openSync(prefix = "file") {
    const filePath = path.join(rootPath, `${prefix}-${randomUUID()}`);
    fs.closeSync(fs.openSync(filePath, "w"));
    return { path: filePath };
  },
};
