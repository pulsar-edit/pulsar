const GitRunner = require("./git-runner");
const { GitOperationError } = GitRunner;

const LOG_FORMAT = "%H%x00%P%x00%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%s%x00%b";

function isUnbornOrEmptyHistory(stderr) {
  return /does not have any commits yet|bad default revision|unknown revision/.test(String(stderr));
}

// Read-side history commands. Every format is machine-stable: NUL-delimited
// log fields, -z name-status records, and blame porcelain — never
// human-formatted output.
module.exports = class GitRepositoryHistoryProvider {
  constructor({ runner, execute } = {}) {
    this.runner = runner || new GitRunner({ execute });
  }

  async getLog(
    workingDirectory,
    { revision = "HEAD", path = null, limit, skip = 0 },
    options = {},
  ) {
    const args = ["log", "-z", `--format=${LOG_FORMAT}`];
    if (limit != null) args.push(`--max-count=${limit}`);
    if (skip > 0) args.push(`--skip=${skip}`);
    args.push(revision);
    if (path) args.push("--follow", "--", path);

    const result = await this.runner.runResult(args, workingDirectory, {
      ...options,
      allowedExitCodes: [0, 128],
    });
    if (result.exitCode === 0) return result.stdout;
    if (isUnbornOrEmptyHistory(result.stderr)) return "";
    throw new GitOperationError("log", result);
  }

  getNameStatus(workingDirectory, sha, options = {}) {
    return this.runner.run(
      ["diff-tree", "--root", "--no-commit-id", "--name-status", "-z", "-r", "--find-renames", sha],
      workingDirectory,
      options,
    );
  }

  async getFileAtRevision(workingDirectory, relativePosixPath, revision, options = {}) {
    const result = await this.runner.runResult(
      ["show", `${revision}:${relativePosixPath}`],
      workingDirectory,
      { ...options, allowedExitCodes: [0, 128] },
    );
    if (result.exitCode === 0) return result.stdout;
    const stderr = String(result.stderr);
    if (
      /does not exist in|exists on disk, but not in|invalid object name|bad revision|but not in the working tree/.test(
        stderr,
      )
    ) {
      return null;
    }
    throw new GitOperationError("show", result);
  }

  // Read a blob's contents by object id (`git cat-file -p <oid>`). Returns the
  // contents, or null when the oid does not name an object.
  async getBlob(workingDirectory, oid, options = {}) {
    const result = await this.runner.runResult(["cat-file", "-p", oid], workingDirectory, {
      ...options,
      allowedExitCodes: [0, 128],
    });
    if (result.exitCode === 0) return result.stdout;
    if (/Not a valid object name|bad file|could not get object info/.test(String(result.stderr))) {
      return null;
    }
    throw new GitOperationError("cat-file", result);
  }

  getBlame(workingDirectory, relativePosixPath, { revision = null } = {}, options = {}) {
    const args = ["blame", "--porcelain"];
    if (revision) args.push(revision);
    args.push("--", relativePosixPath);
    return this.runner.run(args, workingDirectory, options);
  }
};
