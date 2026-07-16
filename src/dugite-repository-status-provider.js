const DugiteRunner = require("./dugite-runner");

module.exports = class DugiteRepositoryStatusProvider {
  constructor({ runner, execute } = {}) {
    this.runner = runner || new DugiteRunner({ execute });
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
};
