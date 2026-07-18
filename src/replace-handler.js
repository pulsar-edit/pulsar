/* global emit */ // injected by Lumine's task runner
const fs = require("fs");

// Replace regex matches with replacement text across a fixed list of files, off
// the renderer in a Task. Reimplements the scandal PathReplacer contract this
// handler used to wrap: it emits `replace:path-replaced` with
// `{filePath, replacements}` for every changed file and `replace:file-error`
// with `{code, path, message}` when a file cannot be read or written.
module.exports = function (filePaths, regexSource, regexFlags, replacementText) {
  const callback = this.async();
  // The caller always requests a global replace; guard in case it does not so a
  // single-match regex still replaces every occurrence.
  const flags = regexFlags.includes("g") ? regexFlags : `${regexFlags}g`;

  const replaceInFile = async (filePath) => {
    let contents;
    try {
      contents = await fs.promises.readFile(filePath, "utf8");
    } catch (error) {
      emit("replace:file-error", { code: error.code, path: filePath, message: error.message });
      return;
    }

    // A fresh regex per file keeps `lastIndex` from leaking between files.
    const regex = new RegExp(regexSource, flags);
    const matches = contents.match(regex);
    const replacements = matches ? matches.length : 0;
    if (replacements === 0) return;

    const updated = contents.replace(regex, replacementText);
    try {
      await fs.promises.writeFile(filePath, updated);
    } catch (error) {
      emit("replace:file-error", { code: error.code, path: filePath, message: error.message });
      return;
    }
    emit("replace:path-replaced", { filePath, replacements });
  };

  (async () => {
    for (const filePath of filePaths) {
      await replaceInFile(filePath);
    }
    callback();
  })();
};
