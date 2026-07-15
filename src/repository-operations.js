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

  stageFileModeChange(filePath, mode) {
    return this.execute("stageFileModeChange", filePath, mode);
  }

  stageFileSymlinkChange(filePath) {
    return this.execute("stageFileSymlinkChange", filePath);
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

  abortMerge() {
    return this.execute("abortMerge");
  }

  checkoutSide(side, paths) {
    return this.execute("checkoutSide", side, paths);
  }

  checkout(reference, options) {
    return this.execute("checkout", reference, options);
  }

  checkoutFiles(paths, reference) {
    return this.execute("checkoutFiles", paths, reference);
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

  reset(mode, reference) {
    return this.execute("reset", mode, reference);
  }

  deleteRef(reference) {
    return this.execute("deleteRef", reference);
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

  addRemote(name, url) {
    return this.execute("addRemote", name, url);
  }

  removeRemote(name) {
    return this.execute("removeRemote", name);
  }

  setRemoteUrl(name, url) {
    return this.execute("setRemoteUrl", name, url);
  }

  createBlob(options) {
    return this.execute("createBlob", options);
  }

  expandBlobToFile(filePath, sha) {
    return this.execute("expandBlobToFile", filePath, sha);
  }

  mergeFile(oursPath, basePath, theirsPath, resultPath) {
    return this.execute("mergeFile", oursPath, basePath, theirsPath, resultPath);
  }

  writeMergeConflictToIndex(filePath, baseSha, oursSha, theirsSha) {
    return this.execute("writeMergeConflictToIndex", filePath, baseSha, oursSha, theirsSha);
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
