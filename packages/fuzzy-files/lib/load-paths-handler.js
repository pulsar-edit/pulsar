/* global emit */

const async = require("async");
const os = require("os");
const path = require("path");
const { Minimatch } = require("minimatch");
const childProcess = require("child_process");
const { rgPath } = require("@vscode/ripgrep");

const PathsChunkSize = 100;

// Use the unpacked path if the ripgrep binary is in an asar archive.
const realRgPath = rgPath.replace(/\bapp\.asar\b/, "app.asar.unpacked");

// Cap concurrent crawls at one per CPU (minus one), between 1 and 8.
const MaxConcurrentCrawls = Math.min(Math.max(os.cpus().length - 1, 1), 8);

// Crawls a single project root with ripgrep. ripgrep honors `.gitignore`
// natively (unless `--no-ignore` is passed), so no VCS integration is needed.
class PathLoader {
  constructor(rootPath, ignoreVcsIgnores, traverseSymlinkDirectories, ignoredNames, emittedPaths) {
    this.rootPath = rootPath;
    this.ignoreVcsIgnores = ignoreVcsIgnores;
    this.traverseSymlinkDirectories = traverseSymlinkDirectories;
    this.ignoredNames = ignoredNames;
    this.emittedPaths = emittedPaths;
    this.paths = [];
  }

  load(done) {
    return new Promise((resolve) => {
      const args = ["--files", "--hidden", "--sort", "path"];

      if (!this.ignoreVcsIgnores) {
        args.push("--no-ignore");
      }

      if (this.traverseSymlinkDirectories) {
        args.push("--follow");
      }

      for (const ignoredName of this.ignoredNames) {
        args.push("-g", "!" + ignoredName.pattern);
      }

      if (this.ignoreVcsIgnores) {
        args.push("-g", "!.git");
        args.push("-g", "!.hg");
      }

      let output = "";
      const result = childProcess.spawn(realRgPath, args, { cwd: this.rootPath });

      result.stdout.on("data", (chunk) => {
        const files = (output + chunk).split("\n");
        output = files.pop();

        for (const file of files) {
          this.pathLoaded(path.join(this.rootPath, file));
        }
      });
      result.stderr.on("data", () => {
        // intentionally ignoring errors for now
      });
      result.on("close", () => {
        this.flushPaths();
        resolve();
      });
    }).then(done);
  }

  pathLoaded(loadedPath) {
    if (!this.emittedPaths.has(loadedPath)) {
      this.paths.push(loadedPath);
      this.emittedPaths.add(loadedPath);
    }

    if (this.paths.length === PathsChunkSize) {
      this.flushPaths();
    }
  }

  flushPaths() {
    emit("load-paths:paths-found", this.paths);
    this.paths = [];
  }
}

module.exports = function (rootPaths, followSymlinks, ignoreVcsIgnores, ignores) {
  const emittedPaths = new Set();
  const ignoredNames = [];
  for (let ignore of ignores) {
    if (ignore) {
      try {
        ignoredNames.push(new Minimatch(ignore, { matchBase: true, dot: true }));
      } catch (error) {
        console.warn(`Error parsing ignore pattern (${ignore}): ${error.message}`);
      }
    }
  }

  async.eachLimit(
    rootPaths,
    MaxConcurrentCrawls,
    (rootPath, next) =>
      new PathLoader(rootPath, ignoreVcsIgnores, followSymlinks, ignoredNames, emittedPaths).load(
        next,
      ),
    this.async(),
  );
};
