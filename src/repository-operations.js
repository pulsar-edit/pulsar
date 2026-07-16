// Stable write facade for a repository. Implementations are supplied by
// atom.repository-operation-provider services, so core does not need to own a
// Git executable or a specific process library.
class RepositoryOperations {
  constructor(registry, repository) {
    this.registry = registry;
    this.repository = repository;
  }

  isAvailable(operationName) {
    return operationName
      ? this.registry.canPerformOperation(this.repository, operationName)
      : this.getCapabilities().length > 0;
  }

  getCapabilities() {
    return this.registry.getOperationCapabilities(this.repository);
  }

  getPendingOperations() {
    return this.registry.getPendingOperations(this.repository);
  }

  onDidQueueOperation(callback) {
    return this.registry.onDidQueueOperation((event) => {
      if (event.repository === this.repository) callback(event);
    });
  }

  onDidStartOperation(callback) {
    return this.registry.onDidStartOperation((event) => {
      if (event.repository === this.repository) callback(event);
    });
  }

  onDidFinishOperation(callback) {
    return this.registry.onDidFinishOperation((event) => {
      if (event.repository === this.repository) callback(event);
    });
  }

  execute(operationName, ...args) {
    return this.registry.performOperation(this.repository, operationName, args);
  }

  stageFiles(paths, options) {
    return this.execute("stageFiles", paths, options);
  }

  unstageFiles(paths, options) {
    return this.execute("unstageFiles", paths, options);
  }

  stageFileModeChange(filePath, mode, options) {
    return this.execute("stageFileModeChange", filePath, mode, options);
  }

  stageFileSymlinkChange(filePath, options) {
    return this.execute("stageFileSymlinkChange", filePath, options);
  }

  applyPatch(patch, options) {
    return this.execute("applyPatch", patch, options);
  }

  commit(message, options) {
    return this.execute("commit", message, options);
  }

  merge(reference, options) {
    return this.execute("merge", reference, options);
  }

  abortMerge(options) {
    return this.execute("abortMerge", options);
  }

  checkoutSide(side, paths, options) {
    return this.execute("checkoutSide", side, paths, options);
  }

  checkout(reference, options) {
    return this.execute("checkout", reference, options);
  }

  checkoutFiles(paths, reference, options) {
    return this.execute("checkoutFiles", paths, reference, options);
  }

  fetch(remote, reference, options) {
    return this.execute("fetch", remote, reference, options);
  }

  pull(remote, reference, options) {
    return this.execute("pull", remote, reference, options);
  }

  push(remote, reference, options) {
    return this.execute("push", remote, reference, options);
  }

  reset(mode, reference, options) {
    return this.execute("reset", mode, reference, options);
  }

  deleteRef(reference, options) {
    return this.execute("deleteRef", reference, options);
  }

  updateSubmodules(paths, options) {
    return this.execute("updateSubmodules", paths, options);
  }

  setConfig(key, value, options) {
    return this.execute("setConfig", key, value, options);
  }

  unsetConfig(key, options) {
    return this.execute("unsetConfig", key, options);
  }

  addRemote(name, url, options) {
    return this.execute("addRemote", name, url, options);
  }

  removeRemote(name, options) {
    return this.execute("removeRemote", name, options);
  }

  setRemoteUrl(name, url, options) {
    return this.execute("setRemoteUrl", name, url, options);
  }

  createBlob(options) {
    return this.execute("createBlob", options);
  }

  expandBlobToFile(filePath, sha, options) {
    return this.execute("expandBlobToFile", filePath, sha, options);
  }

  mergeFile(oursPath, basePath, theirsPath, resultPath, options) {
    return this.execute("mergeFile", oursPath, basePath, theirsPath, resultPath, options);
  }

  writeMergeConflictToIndex(filePath, baseSha, oursSha, theirsSha, options) {
    return this.execute(
      "writeMergeConflictToIndex",
      filePath,
      baseSha,
      oursSha,
      theirsSha,
      options,
    );
  }
}

RepositoryOperations.standardCapabilities = Object.freeze(
  Object.getOwnPropertyNames(RepositoryOperations.prototype).filter(
    (name) =>
      name !== "constructor" &&
      name !== "isAvailable" &&
      name !== "getCapabilities" &&
      name !== "getPendingOperations" &&
      name !== "onDidQueueOperation" &&
      name !== "onDidStartOperation" &&
      name !== "onDidFinishOperation" &&
      name !== "execute",
  ),
);

module.exports = RepositoryOperations;
