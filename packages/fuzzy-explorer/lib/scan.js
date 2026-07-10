/* global emit */

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const { rgPath } = require("@vscode/ripgrep");

const realRgPath = rgPath.replace(/\bapp\.asar\b/, "app.asar.unpacked");
const globMagicPattern = /[*?[\]{}]/;

module.exports = function (pattern, ignoredNames, followSymlinks, excludeVcsIgnoredPaths) {
  const done = this.async();
  let finished = false;
  const finish = (entries) => {
    if (finished) return;
    finished = true;
    emit("fuzzy-explorer:entries", entries);
    done();
  };

  const search = searchForPattern(pattern);
  if (!search) {
    finish([]);
    return;
  }

  const args = ["--files", "--hidden", "-g", search.include];
  if (followSymlinks) args.push("--follow");
  if (!excludeVcsIgnoredPaths) args.push("--no-ignore");

  for (const ignoredName of ignoredNames || []) {
    args.push("-g", `!${ignoredName}`);
  }

  let output = "";
  const entries = [];
  const result = childProcess.spawn(realRgPath, args, { cwd: search.root });

  result.stdout.on("data", (chunk) => {
    const files = (output + chunk).split(/\r?\n/);
    output = files.pop();
    for (const file of files) {
      if (file) entries.push(path.join(search.root, file));
    }
  });

  result.stderr.on("data", () => {
    // Ignore ripgrep diagnostics for unreadable paths and invalid excludes.
  });

  result.on("error", () => {
    finish(entries);
  });

  result.on("close", () => {
    if (output) entries.push(path.join(search.root, output));
    finish(entries);
  });
};

function searchForPattern(rawPattern) {
  const normalizedPattern = rawPattern.replace(/\\/g, "/");
  const parts = normalizedPattern.split("/");
  const rootParts = [];
  const includeParts = [];
  let foundGlob = false;

  for (const part of parts) {
    if (!foundGlob && !globMagicPattern.test(part)) {
      rootParts.push(part);
    } else {
      foundGlob = true;
      includeParts.push(part);
    }
  }

  if (!foundGlob) {
    const resolvedPath = path.resolve(rawPattern);
    if (isDirectory(resolvedPath)) {
      return { root: resolvedPath, include: "**" };
    }
    return {
      root: directoryOrNull(path.dirname(resolvedPath)),
      include: path.basename(resolvedPath),
    };
  }

  const root = directoryOrNull(path.resolve(rootParts.join("/") || "."));
  if (!root) return null;

  const include = includeParts.join("/") || "**";
  return { root, include };
}

function directoryOrNull(candidate) {
  try {
    return fs.statSync(candidate).isDirectory() ? candidate : null;
  } catch {
    return null;
  }
}

function isDirectory(candidate) {
  return directoryOrNull(candidate) != null;
}
