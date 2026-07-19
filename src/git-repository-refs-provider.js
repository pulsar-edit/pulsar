const GitRunner = require("./git-runner");

const FOR_EACH_REF_FORMAT = [
  "%(refname)",
  "%(refname:short)",
  "%(objectname)",
  "%(objecttype)",
  "%(*objectname)",
  "%(upstream)",
  "%(upstream:short)",
  "%(upstream:track,nobracket)",
  "%(push)",
  "%(push:short)",
  "%(push:track,nobracket)",
  "%(HEAD)",
  "%(symref)",
].join("%00");

// Collects the raw command outputs that repository-refs-snapshot.js parses.
// Field separators are NUL and records are newline-terminated: refnames can
// never contain newlines or NUL, so both delimiters are unambiguous.
module.exports = class GitRepositoryRefsProvider {
  constructor({ runner, execute } = {}) {
    this.runner = runner || new GitRunner({ execute });
  }

  async getRefs(workingDirectory, options = {}) {
    const [forEachRef, remotes, worktrees, symbolicHead, headOid] = await Promise.all([
      this.runner.run(
        [
          "for-each-ref",
          `--format=${FOR_EACH_REF_FORMAT}`,
          "refs/heads",
          "refs/remotes",
          "refs/tags",
        ],
        workingDirectory,
        options,
      ),
      this.runner.run(["remote", "-v"], workingDirectory, options),
      this.runner.run(["worktree", "list", "--porcelain", "-z"], workingDirectory, options),
      // Exit 1 means a detached HEAD; exit 128 an unborn branch elsewhere.
      this.runner.run(["symbolic-ref", "--quiet", "HEAD"], workingDirectory, {
        ...options,
        allowedExitCodes: [0, 1],
      }),
      this.runner.run(["rev-parse", "--verify", "--quiet", "HEAD"], workingDirectory, {
        ...options,
        allowedExitCodes: [0, 1],
      }),
    ]);

    return { forEachRef, remotes, worktrees, symbolicHead, headOid };
  }

  // Describe HEAD as a ref name (`git describe --contains --all --always`);
  // returns "" when there is no HEAD yet (unborn branch).
  async getDescription(workingDirectory, options = {}) {
    const result = await this.runner.runResult(
      ["describe", "--contains", "--all", "--always", "HEAD"],
      workingDirectory,
      { ...options, allowedExitCodes: [0, 128] },
    );
    return result.exitCode === 0 ? String(result.stdout).trim() : "";
  }

  // The fully-qualified refnames of branches that contain a commit
  // (`git branch --contains <commit>`).
  async getBranchesContaining(
    workingDirectory,
    commit,
    { showLocal = false, showRemote = false, pattern = null } = {},
    options = {},
  ) {
    const args = ["branch", "--format=%(refname)", "--contains", commit];
    if (showLocal && showRemote) args.splice(1, 0, "--all");
    else if (showRemote) args.splice(1, 0, "--remotes");
    if (pattern) args.push(pattern);
    const output = await this.runner.run(args, workingDirectory, options);
    return output.trim() === "" ? [] : output.trim().split("\n");
  }
};
