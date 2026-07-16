const fs = require("fs");
const path = require("path");

const DugiteRunner = require("./dugite-runner");
const { DugiteOperationError } = DugiteRunner;

function pathsFrom(value) {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}

function addBooleanFlag(args, value, flag) {
  if (value) args.push(flag);
}

function coAuthorTrailer(author) {
  if (typeof author === "string") return `Co-authored-by: ${author}`;
  if (!author || !author.name || !author.email) return null;
  return `Co-authored-by: ${author.name} <${author.email}>`;
}

class DugiteRepositoryOperations {
  constructor(provider, workingDirectory) {
    this.provider = provider;
    this.workingDirectory = workingDirectory;
  }

  run(args, options) {
    return this.provider.run(args, this.workingDirectory, options);
  }

  stageFiles(paths, options = {}) {
    const filePaths = pathsFrom(paths);
    if (filePaths.length === 0) return Promise.resolve("");
    return this.run(["add", "--", ...filePaths], options);
  }

  async unstageFiles(paths, options = {}) {
    const filePaths = pathsFrom(paths);
    if (filePaths.length === 0) return "";
    if (options.reference) {
      return this.run(["reset", options.reference, "--", ...filePaths], options);
    }

    const head = await this.provider.runResult(
      ["rev-parse", "--verify", "HEAD"],
      this.workingDirectory,
      { ...options, allowedExitCodes: [0, 128] },
    );
    if (head.exitCode === 0) {
      return this.run(["reset", "HEAD", "--", ...filePaths], options);
    }

    // An unborn repository has no HEAD to reset against. Removing entries
    // from the index leaves their working-tree files untouched.
    return this.run(["rm", "--cached", "--ignore-unmatch", "--", ...filePaths], options);
  }

  async stageFileModeChange(filePath, mode, options = {}) {
    const indexEntry = await this.run(["ls-files", "-s", "--", filePath], options);
    const match = /^(\d+)\s+([0-9a-f]+)\s+\d+\t/.exec(indexEntry);
    if (!match) throw new Error(`No index entry found for: ${filePath}`);
    return this.run(["update-index", "--cacheinfo", `${mode},${match[2]},${filePath}`], options);
  }

  stageFileSymlinkChange(filePath, options = {}) {
    return this.run(["rm", "--cached", "--", filePath], options);
  }

  applyPatch(patch, options = {}) {
    const args = ["apply"];
    addBooleanFlag(args, options.index, "--cached");
    addBooleanFlag(args, options.reverse, "--reverse");
    addBooleanFlag(args, options.threeWay, "--3way");
    args.push("-");
    return this.run(args, { ...options, stdin: String(patch) });
  }

  commit(message, options = {}) {
    const reuseExistingMessage = message == null && options.amend;
    const args = ["commit", reuseExistingMessage ? "--no-edit" : "--file=-"];
    addBooleanFlag(args, options.allowEmpty, "--allow-empty");
    addBooleanFlag(args, options.allowEmptyMessage, "--allow-empty-message");
    addBooleanFlag(args, options.amend, "--amend");
    addBooleanFlag(args, options.noVerify, "--no-verify");
    addBooleanFlag(args, options.signoff, "--signoff");
    if (options.verbatim) args.push("--cleanup=verbatim");
    if (options.gpgSign === true) args.push("--gpg-sign");
    else if (typeof options.gpgSign === "string") args.push(`--gpg-sign=${options.gpgSign}`);

    const coAuthors = Array.isArray(options.coAuthors)
      ? options.coAuthors
      : options.coAuthors
        ? [options.coAuthors]
        : [];
    const trailers = coAuthors.map(coAuthorTrailer).filter(Boolean);
    const rawMessage = message == null ? "" : String(message);
    const commitMessage = trailers.length
      ? `${rawMessage.replace(/\s+$/, "")}\n\n${trailers.join("\n")}`
      : rawMessage;
    return this.run(args, reuseExistingMessage ? options : { ...options, stdin: commitMessage });
  }

  merge(reference, options = {}) {
    const args = ["merge"];
    addBooleanFlag(args, options.noFastForward, "--no-ff");
    addBooleanFlag(args, options.fastForwardOnly, "--ff-only");
    addBooleanFlag(args, options.squash, "--squash");
    addBooleanFlag(args, options.noCommit, "--no-commit");
    args.push(reference);
    return this.run(args, options);
  }

  abortMerge(options = {}) {
    return this.run(["merge", "--abort"], options);
  }

  checkoutSide(side, paths, options = {}) {
    if (side !== "ours" && side !== "theirs") {
      return Promise.reject(new Error('Checkout side must be either "ours" or "theirs"'));
    }
    const filePaths = pathsFrom(paths);
    if (filePaths.length === 0) return Promise.resolve("");
    return this.run(["checkout", `--${side}`, "--", ...filePaths], options);
  }

  checkout(reference, options = {}) {
    const args = ["checkout"];
    addBooleanFlag(args, options.force, "--force");
    addBooleanFlag(args, options.detach, "--detach");
    if (options.createNew || options.createNewBranch) args.push("-b");
    if (options.track) args.push("--track");
    args.push(reference);
    if (options.startPoint) args.push(options.startPoint);
    return this.run(args, options);
  }

  checkoutFiles(paths, reference, options = {}) {
    const filePaths = pathsFrom(paths);
    if (filePaths.length === 0) return Promise.resolve("");
    return this.run(["checkout", ...(reference ? [reference] : []), "--", ...filePaths], options);
  }

  fetch(remote, reference, options = {}) {
    const args = ["fetch"];
    addBooleanFlag(args, options.prune, "--prune");
    addBooleanFlag(args, options.tags, "--tags");
    addBooleanFlag(args, options.force, "--force");
    if (options.depth != null) args.push(`--depth=${options.depth}`);
    if (remote) args.push(remote);
    if (reference) args.push(reference);
    return this.run(args, options);
  }

  pull(remote, reference, options = {}) {
    const args = ["pull"];
    addBooleanFlag(args, options.rebase, "--rebase");
    addBooleanFlag(args, options.ffOnly, "--ff-only");
    addBooleanFlag(args, options.noCommit, "--no-commit");
    if (remote) args.push(remote);
    if (options.refSpec || reference) args.push(options.refSpec || reference);
    return this.run(args, options);
  }

  push(remote = "origin", reference, options = {}) {
    const args = ["push"];
    addBooleanFlag(args, options.setUpstream, "--set-upstream");
    addBooleanFlag(args, options.force, "--force");
    addBooleanFlag(args, options.forceWithLease, "--force-with-lease");
    addBooleanFlag(args, options.tags, "--tags");
    addBooleanFlag(args, options.delete, "--delete");
    args.push(remote || "origin");
    if (options.refSpec || reference) args.push(options.refSpec || reference);
    return this.run(args, options);
  }

  reset(mode = "mixed", reference = "HEAD", options = {}) {
    const validModes = new Set(["soft", "mixed", "hard", "merge", "keep"]);
    if (!validModes.has(mode)) {
      return Promise.reject(new Error(`Invalid reset mode: ${mode}`));
    }
    return this.run(["reset", `--${mode}`, reference], options);
  }

  deleteRef(reference, options = {}) {
    return this.run(["update-ref", "-d", reference], options);
  }

  updateSubmodules(paths, options = {}) {
    const args = ["submodule", "update"];
    addBooleanFlag(args, options.init, "--init");
    addBooleanFlag(args, options.recursive, "--recursive");
    addBooleanFlag(args, options.remote, "--remote");
    const filePaths = pathsFrom(paths);
    if (filePaths.length > 0) args.push("--", ...filePaths);
    return this.run(args, options);
  }

  setConfig(key, value, options = {}) {
    const args = ["config"];
    if (options.global) args.push("--global");
    else if (options.local !== false) args.push("--local");
    if (options.add) args.push("--add");
    else if (options.replaceAll) args.push("--replace-all");
    args.push(key, String(value));
    return this.run(args, options);
  }

  unsetConfig(key, options = {}) {
    const args = ["config"];
    if (options.global) args.push("--global");
    else if (options.local !== false) args.push("--local");
    args.push(options.all ? "--unset-all" : "--unset", key);
    return this.run(args, options);
  }

  addRemote(name, url, options = {}) {
    return this.run(["remote", "add", name, url], options);
  }

  removeRemote(name, options = {}) {
    return this.run(["remote", "remove", name], options);
  }

  setRemoteUrl(name, url, options = {}) {
    return this.run(["remote", "set-url", name, url], options);
  }

  createBlob(options = {}) {
    const args = ["hash-object", "-w"];
    const executionOptions = { ...options };
    if (options.filePath) args.push("--", options.filePath);
    else {
      args.push("--stdin");
      executionOptions.stdin = options.stdin || "";
    }
    return this.run(args, executionOptions).then((stdout) => stdout.trim());
  }

  async expandBlobToFile(filePath, sha, options = {}) {
    const contents = await this.provider.runResult(
      ["cat-file", "blob", sha],
      this.workingDirectory,
      { ...options, encoding: "buffer" },
    );
    await fs.promises.writeFile(filePath, contents.stdout);
    return filePath;
  }

  async mergeFile(oursPath, basePath, theirsPath, resultPath, options = {}) {
    const result = await this.provider.runResult(
      ["merge-file", "--stdout", oursPath, basePath, theirsPath],
      this.workingDirectory,
      { ...options, allowedExitCodes: [0, 1] },
    );
    await fs.promises.writeFile(resultPath, result.stdout);
    return result.exitCode;
  }

  async writeMergeConflictToIndex(filePath, baseSha, oursSha, theirsSha, options = {}) {
    const entries = await this.run(["ls-files", "-s", "--", filePath], options);
    const modes = new Map();
    for (const line of entries.split(/\r?\n/)) {
      const match = /^(\d+)\s+[0-9a-f]+\s+(\d)\t/.exec(line);
      if (match) modes.set(Number(match[2]), match[1]);
    }
    const fallbackMode = modes.get(2) || modes.get(3) || modes.get(1) || "100644";
    const input = [
      `${modes.get(1) || fallbackMode} ${baseSha} 1\t${filePath}`,
      `${modes.get(2) || fallbackMode} ${oursSha} 2\t${filePath}`,
      `${modes.get(3) || fallbackMode} ${theirsSha} 3\t${filePath}`,
      "",
    ].join("\n");
    return this.run(["update-index", "--index-info"], { ...options, stdin: input });
  }
}

module.exports = class DugiteRepositoryOperationProvider extends DugiteRunner {
  createRepositoryOperations({ workingDirectory }) {
    return new DugiteRepositoryOperations(this, workingDirectory);
  }

  async initializeRepository(directoryPath, options = {}) {
    await fs.promises.mkdir(directoryPath, { recursive: true });
    const args = ["init"];
    if (options.initialBranch) args.push(`--initial-branch=${options.initialBranch}`);
    if (options.bare) args.push("--bare");
    args.push(".");
    return this.run(args, directoryPath, options);
  }

  async cloneRepository(remoteUrl, destinationPath, options = {}) {
    await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
    const args = ["clone"];
    addBooleanFlag(args, options.noLocal, "--no-local");
    addBooleanFlag(args, options.bare, "--bare");
    addBooleanFlag(args, options.recursive, "--recursive");
    addBooleanFlag(args, options.depth != null, `--depth=${options.depth}`);
    if (options.branch) args.push("--branch", options.branch);
    if (options.sourceRemoteName) args.push("--origin", options.sourceRemoteName);
    args.push("--", remoteUrl, destinationPath);
    return this.run(args, path.dirname(destinationPath), options);
  }
};

module.exports.DugiteOperationError = DugiteOperationError;
module.exports.DugiteRepositoryOperations = DugiteRepositoryOperations;
