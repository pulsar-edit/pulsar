const GitRunner = require("./git-runner");

const NULL_DEVICE = process.platform === "win32" ? "NUL" : "/dev/null";

function endpointDescription(endpoint) {
  return endpoint?.type || String(endpoint);
}

function validateEndpoint(endpoint) {
  const type = endpoint?.type;
  if (!["commit", "index", "worktree", "file", "empty"].includes(type)) {
    throw new TypeError(`Unsupported diff endpoint: ${endpointDescription(endpoint)}`);
  }
  if (type === "commit" && typeof endpoint.revision !== "string") {
    throw new TypeError("Commit diff endpoints require a revision string");
  }
  if (type === "file" && typeof endpoint.path !== "string") {
    throw new TypeError("File diff endpoints require a path string");
  }
  return endpoint;
}

function unsupportedPair(from, to) {
  return new TypeError(
    `Unsupported diff endpoint pair: ${endpointDescription(from)} -> ${endpointDescription(to)}. ` +
      "Supported pairs: index->worktree, commit->index, commit->worktree, " +
      "commit->commit, file->file, empty->file, file->empty.",
  );
}

// Maps endpoint pairs onto git diff invocations and returns the raw patch.
module.exports = class GitRepositoryDiffProvider {
  constructor({ runner, execute } = {}) {
    this.runner = runner || new GitRunner({ execute });
  }

  getDiffPatch(workingDirectory, request, options = {}) {
    const from = validateEndpoint(request.from);
    const to = validateEndpoint(request.to);

    const args = [
      "-c",
      "core.quotePath=false",
      "diff",
      "--patch",
      "--no-ext-diff",
      "--no-color",
      "--find-renames",
      "--src-prefix=a/",
      "--dst-prefix=b/",
      `--unified=${request.context ?? 3}`,
    ];
    if (request.ignoreWhitespace) args.push("--ignore-all-space");

    let allowedExitCodes = [0];
    if (from.type === "index" && to.type === "worktree") {
      // No endpoint arguments.
    } else if (from.type === "commit" && to.type === "index") {
      args.push("--cached", from.revision);
    } else if (from.type === "commit" && to.type === "worktree") {
      args.push(from.revision);
    } else if (from.type === "commit" && to.type === "commit") {
      args.push(from.revision, to.revision);
    } else if (
      (from.type === "file" || from.type === "empty") &&
      (to.type === "file" || to.type === "empty") &&
      (from.type === "file" || to.type === "file")
    ) {
      // git diff --no-index exits 1 when the files differ.
      allowedExitCodes = [0, 1];
      args.push(
        "--no-index",
        "--",
        from.type === "empty" ? NULL_DEVICE : from.path,
        to.type === "empty" ? NULL_DEVICE : to.path,
      );
      return this.runner.run(args, workingDirectory, { ...options, allowedExitCodes });
    } else {
      return Promise.reject(unsupportedPair(from, to));
    }

    if (request.paths?.length) args.push("--", ...request.paths);
    return this.runner.run(args, workingDirectory, { ...options, allowedExitCodes });
  }
};
