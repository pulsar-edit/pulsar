const fs = require("fs");
const path = require("path");

// Walk up from `currentFullPath`, returning the first ancestor directory that
// contains `clue` (or null if none up to the filesystem root). Replaces the
// `find-parent-dir` package; only its synchronous `.sync()` API was used.
function sync(currentFullPath, clue) {
  let dir = path.resolve(currentFullPath);
  while (true) {
    if (fs.existsSync(path.join(dir, clue))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null; // reached the root
    dir = parent;
  }
}

module.exports = { sync };
