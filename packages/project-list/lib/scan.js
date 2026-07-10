/* global emit */

// glob >=9 exports named functions; older hoisted versions expose the callable module
const globPkg = require("glob");
const globSync = typeof globPkg === "function" ? globPkg.sync : globPkg.globSync;

module.exports = function (dirPath, scanList) {
  const entries = globSync(scanList, {
    cwd: dirPath,
    absolute: false,
  });
  emit(
    "project-list:entries",
    // older glob versions return directory entries with a trailing slash
    entries.map((entry) => entry.replace(/[\\/]+$/, "")),
  );
};
