const GitRunner = require("./git-runner");

module.exports = class GitRepositoryStatusProvider {
  constructor({ runner, execute } = {}) {
    this.runner = runner || new GitRunner({ execute });
  }

  getStatus(workingDirectory, options = {}) {
    const args = [
      "status",
      "--porcelain=v2",
      "--branch",
      "-z",
      "--untracked-files=all",
      "--ignore-submodules=none",
      "--renames",
    ];
    if (options.includeIgnored) args.push("--ignored=matching");
    return this.runner.run(args, workingDirectory, options);
  }

  // The index mode of a path (`git ls-files --stage`); returns the first stage's
  // mode, or null when the path is not tracked. Callers fall back to the
  // working-tree mode for untracked paths.
  async getFileMode(workingDirectory, relativePosixPath, options = {}) {
    const output = await this.runner.run(
      ["ls-files", "--stage", "--", relativePosixPath],
      workingDirectory,
      options,
    );
    if (!output) return null;
    const space = output.indexOf(" ");
    return space === -1 ? null : output.slice(0, space);
  }

  // The paths of the repository's submodules (`git submodule status`).
  async getSubmodulePaths(workingDirectory, options = {}) {
    const output = await this.runner.run(["submodule", "status"], workingDirectory, options);
    if (output.trim() === "") return [];
    return output
      .trim()
      .split("\n")
      .map((line) => line.trim().split(/\s+/)[1])
      .filter(Boolean);
  }
};
