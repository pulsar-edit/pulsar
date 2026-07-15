const fs = require("fs");
const path = require("path");

const { CompositeDisposable, Disposable, Emitter } = require("event-kit");
const RepositoryOperations = require("./repository-operations");

const DEFAULT_EXCLUDED_DIRECTORIES = new Set([".git", "node_modules"]);

function normalizePath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function canonicalPath(filePath) {
  let resolved = path.resolve(filePath);
  try {
    resolved = fs.realpathSync.native(resolved);
  } catch {
    // Deleted and not-yet-created paths still need lexical routing.
  }
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function pathAliases(filePath) {
  return Array.from(new Set([normalizePath(filePath), canonicalPath(filePath)]));
}

function pathContains(parentPath, childPath) {
  return pathAliases(parentPath).some((parent) =>
    pathAliases(childPath).some((child) => pathContainsNormalized(parent, child)),
  );
}

function pathContainsNormalized(parent, child) {
  return child === parent || child.startsWith(`${parent}${path.sep}`);
}

function pathDepth(relativePath) {
  if (!relativePath || relativePath === ".") return 0;
  return relativePath.split(/[\\/]+/).filter(Boolean).length;
}

// Owns every Git repository known to this window. Project roots are discovery
// seeds and lifetime owners, but repository identity is independent of roots.
module.exports = class RepositoryRegistry {
  constructor({ project, config, notificationManager, packageManager }) {
    this.project = null;
    this.config = config;
    this.notificationManager = notificationManager;
    this.emitter = new Emitter();
    this.subscriptions = new CompositeDisposable();
    this.projectSubscriptions = new CompositeDisposable();

    this.entriesById = new Map();
    this.entryByRepository = new WeakMap();
    this.operationProviders = [];
    this.workspaceOperationTails = new Map();
    this.pendingWorkspaceOperations = new Map();
    this.bufferOwners = new Map();
    this.rootPaths = [];
    this.scanGeneration = 0;
    this.version = 0;
    this.nextOperationId = 1;
    this.destroyed = false;
    this.didNotifyRepositoryLimit = false;

    if (this.config?.onDidChange) {
      this.subscriptions.add(
        this.config.onDidChange("core.repositoryScanDepth", () => this.rescan()),
        this.config.onDidChange("core.repositoryExcludedDirectories", () => this.rescan()),
      );
    }

    if (packageManager?.serviceHub) {
      this.subscriptions.add(
        packageManager.serviceHub.consume(
          "atom.repository-operation-provider",
          "^1.0.0",
          (provider) => this.addOperationProvider(provider),
        ),
      );
    }

    if (project) this.attachProject(project);
  }

  attachProject(project) {
    if (this.destroyed) throw new Error("Cannot attach a destroyed RepositoryRegistry");
    if (this.project && this.project !== project) {
      throw new Error("RepositoryRegistry is already attached to another Project");
    }
    this.project = project;
    this.resetProjectSubscriptions();
    for (const buffer of this.project.getBuffers()) this.trackBuffer(buffer);
  }

  detachProject(project) {
    if (this.project !== project) return;

    this.scanGeneration++;
    this.projectSubscriptions.dispose();
    this.projectSubscriptions = new CompositeDisposable();

    for (const [buffer, owner] of this.bufferOwners) {
      owner.subscriptions.dispose();
      if (owner.entry) owner.entry.bufferOwners.delete(buffer);
    }
    this.bufferOwners.clear();
    this.rootPaths = [];

    for (const entry of Array.from(this.entriesById.values())) {
      entry.rootOwners.clear();
      this.prune(entry);
    }
    this.project = null;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scanGeneration++;
    this.subscriptions.dispose();
    this.projectSubscriptions.dispose();

    for (const owner of this.bufferOwners.values()) owner.subscriptions.dispose();
    this.bufferOwners.clear();

    const entries = Array.from(this.entriesById.values());
    this.entriesById.clear();
    for (const entry of entries) {
      entry.destroySubscription.dispose();
      this.disposeOperationImplementations(entry, { force: true });
      entry.repository.setOperations?.(null);
      if (!entry.repository.isDestroyed?.()) entry.repository.destroy();
    }
    this.operationProviders = [];

    this.emitter.dispose();
  }

  resetProjectSubscriptions() {
    if (!this.project || this.destroyed) return;
    this.projectSubscriptions.dispose();
    this.projectSubscriptions = new CompositeDisposable(
      this.project.onDidAddBuffer((buffer) => this.trackBuffer(buffer)),
      this.project.onDidChangeFiles((events) => this.handleProjectFileChanges(events)),
    );
  }

  getSnapshot() {
    return Object.freeze({
      version: this.version,
      repositories: Object.freeze(this.getRepositories()),
    });
  }

  getRepositories() {
    return Array.from(this.entriesById.values(), (entry) => entry.repository);
  }

  getById(id) {
    return this.entriesById.get(id)?.repository || null;
  }

  observeRepositories(callback) {
    for (const repository of this.getRepositories()) callback(repository);
    return this.onDidAddRepository(callback);
  }

  onDidAddRepository(callback) {
    return this.emitter.on("did-add-repository", callback);
  }

  onDidRemoveRepository(callback) {
    return this.emitter.on("did-remove-repository", callback);
  }

  onDidChange(callback) {
    return this.emitter.on("did-change", callback);
  }

  onDidQueueOperation(callback) {
    return this.emitter.on("did-queue-operation", callback);
  }

  onDidStartOperation(callback) {
    return this.emitter.on("did-start-operation", callback);
  }

  onDidFinishOperation(callback) {
    return this.emitter.on("did-finish-operation", callback);
  }

  getForPath(filePath) {
    if (!filePath) return null;

    let bestEntry = null;
    let bestLength = -1;
    const normalizedFilePath = normalizePath(filePath);
    for (const entry of this.entriesById.values()) {
      if (entry.missing || entry.repository.isDestroyed?.()) continue;
      const matchingDirectory = entry.routingDirectories.find((workingDirectory) =>
        pathContainsNormalized(workingDirectory, normalizedFilePath),
      );
      if (matchingDirectory) {
        const candidateLength = matchingDirectory.length;
        if (candidateLength > bestLength) {
          bestEntry = entry;
          bestLength = candidateLength;
        }
      }
    }

    if (!bestEntry && process.platform === "win32" && /~\d/.test(normalizedFilePath)) {
      const canonicalFilePath = canonicalPath(filePath);
      for (const entry of this.entriesById.values()) {
        if (entry.missing || entry.repository.isDestroyed?.()) continue;
        const matchingDirectory = entry.routingDirectories.find((workingDirectory) =>
          pathContainsNormalized(workingDirectory, canonicalFilePath),
        );
        if (matchingDirectory && matchingDirectory.length > bestLength) {
          bestEntry = entry;
          bestLength = matchingDirectory.length;
        }
      }
    }

    // Routing aliases are canonicalized once, when a repository is registered.
    // Normal paths perform no filesystem I/O; only an unresolved Windows 8.3
    // alias needs a realpath fallback. New discovery uses resolveForPath(Sync).
    return bestEntry?.repository || null;
  }

  async resolveForPath(filePath) {
    if (!filePath) return null;
    if (!this.project) return this.getForPath(filePath);
    const directory = this.project.getDirectoryForProjectPath(filePath);
    const repository = await this.project.repositoryForDirectoryFromProviders(directory);
    return this.register(repository)?.repository || this.getForPath(filePath);
  }

  repositoryForPath(filePath) {
    return this.resolveForPath(filePath);
  }

  resolveForPathSync(filePath) {
    if (!filePath) return null;
    if (!this.project) return this.getForPath(filePath);
    const directory = this.project.getDirectoryForProjectPath(filePath);
    const repository = this.project.repositoryForDirectoryFromProvidersSync(directory);
    return this.register(repository)?.repository || this.getForPath(filePath);
  }

  repositoryForPathSync(filePath) {
    return this.resolveForPathSync(filePath);
  }

  async resolveDirectory(directory) {
    const repository = await this.project.repositoryForDirectoryFromProviders(directory);
    return this.register(repository)?.repository || null;
  }

  resolveDirectorySync(directory) {
    const repository = this.project.repositoryForDirectoryFromProvidersSync(directory);
    return this.register(repository)?.repository || null;
  }

  retain(repository, source = "pin") {
    const entry = this.entryByRepository.get(repository) || this.register(repository);
    if (!entry) return new Disposable();

    const token = Symbol(source);
    entry.pins.add(token);
    return new Disposable(() => {
      entry.pins.delete(token);
      this.prune(entry);
    });
  }

  async runOperation(repository, operation) {
    const entry = this.entryByRepository.get(repository) || this.register(repository);
    if (!entry) throw new Error("Cannot run an operation without a live repository");

    const token = Symbol("operation");
    entry.operationOwners.add(token);
    try {
      return await operation(entry.repository);
    } finally {
      entry.operationOwners.delete(token);
      this.prune(entry);
    }
  }

  addOperationProvider(provider) {
    if (this.destroyed) throw new Error("Cannot add a provider to a destroyed RepositoryRegistry");
    if (
      !provider ||
      (typeof provider.createRepositoryOperations !== "function" &&
        typeof provider.initializeRepository !== "function" &&
        typeof provider.cloneRepository !== "function")
    ) {
      throw new TypeError(
        "Repository operation providers must implement repository, initialize, or clone operations",
      );
    }

    this.operationProviders.unshift(provider);
    this.emitOperationProviderChange();

    return new Disposable(() => {
      const index = this.operationProviders.indexOf(provider);
      if (index < 0) return;
      this.operationProviders.splice(index, 1);
      for (const entry of this.entriesById.values()) {
        if (entry.operationImplementations.has(provider)) {
          const record = entry.operationImplementations.get(provider);
          entry.operationImplementations.delete(provider);
          this.disposeOperationImplementation(record);
        }
      }
      this.emitOperationProviderChange();
    });
  }

  getOperations(repository) {
    return this.entryByRepository.get(repository)?.operations || null;
  }

  canPerformOperation(repository, operationName) {
    return this.findOperationImplementation(repository, operationName) != null;
  }

  getOperationCapabilities(repository) {
    const capabilities = new Set();
    for (const provider of this.operationProviders) {
      const record = this.getOperationImplementation(repository, provider);
      if (!record) continue;

      for (const operationName of RepositoryOperations.standardCapabilities) {
        if (this.operationImplementationSupports(record, operationName)) {
          capabilities.add(operationName);
        }
      }
      const customCapabilities = record.implementation.getCapabilities?.() || [];
      for (const operationName of customCapabilities) {
        if (this.operationImplementationSupports(record, operationName)) {
          capabilities.add(operationName);
        }
      }
    }
    return Object.freeze(Array.from(capabilities));
  }

  getPendingOperations(repository) {
    const entries = repository
      ? [this.entryByRepository.get(repository)].filter(Boolean)
      : Array.from(this.entriesById.values());
    const operations = entries.flatMap((entry) =>
      Array.from(entry.pendingOperations.values(), (operation) =>
        this.operationSnapshot(operation),
      ),
    );
    if (!repository) {
      operations.push(
        ...Array.from(this.pendingWorkspaceOperations.values(), (operation) =>
          this.operationSnapshot(operation),
        ),
      );
    }
    return Object.freeze(operations);
  }

  getWorkspaceOperationCapabilities() {
    const capabilities = [];
    if (this.findWorkspaceOperationProvider("initialize")) capabilities.push("initialize");
    if (this.findWorkspaceOperationProvider("clone")) capabilities.push("clone");
    return Object.freeze(capabilities);
  }

  canPerformWorkspaceOperation(operationName) {
    return this.findWorkspaceOperationProvider(operationName) != null;
  }

  initialize(directoryPath, options) {
    return this.performWorkspaceOperation("initialize", directoryPath, [directoryPath, options]);
  }

  clone(remoteUrl, destinationPath, options) {
    return this.performWorkspaceOperation("clone", destinationPath, [
      remoteUrl,
      destinationPath,
      options,
    ]);
  }

  async registerCreatedRepository(directoryPath, operationName) {
    const registration = await this.add(directoryPath);
    if (registration) return registration.repository;

    const error = new Error(
      `Git ${operationName} completed, but no repository was found at: ${directoryPath}`,
    );
    error.code = "ERR_REPOSITORY_DISCOVERY_FAILED";
    error.operation = operationName;
    error.directoryPath = directoryPath;
    throw error;
  }

  performWorkspaceOperation(operationName, workingDirectory, args) {
    if (this.destroyed) {
      return Promise.reject(new Error("Cannot run an operation on a destroyed RepositoryRegistry"));
    }
    const queueKey = normalizePath(workingDirectory);
    const operation = {
      id: this.nextOperationId++,
      repository: null,
      workingDirectory,
      name: operationName,
      status: "queued",
      queuedAt: Date.now(),
      startedAt: null,
    };
    this.pendingWorkspaceOperations.set(operation.id, operation);
    if (!this.destroyed) {
      this.emitter.emit("did-queue-operation", this.operationSnapshot(operation));
    }

    const execute = async () => {
      operation.status = "running";
      operation.startedAt = Date.now();
      if (!this.destroyed) {
        this.emitter.emit("did-start-operation", this.operationSnapshot(operation));
      }

      let operationError = null;
      try {
        const provider = this.findWorkspaceOperationProvider(operationName);
        if (!provider) {
          const error = new Error(`No provider implements repository operation: ${operationName}`);
          error.code = "ERR_REPOSITORY_OPERATION_UNAVAILABLE";
          error.operation = operationName;
          throw error;
        }
        const methodName =
          operationName === "initialize" ? "initializeRepository" : "cloneRepository";
        await provider[methodName](...args);
        return await this.registerCreatedRepository(workingDirectory, operationName);
      } catch (error) {
        operationError = error;
        throw error;
      } finally {
        this.pendingWorkspaceOperations.delete(operation.id);
        if (!this.destroyed) {
          this.emitter.emit(
            "did-finish-operation",
            Object.freeze({
              ...this.operationSnapshot(operation),
              status: operationError ? "failed" : "succeeded",
              finishedAt: Date.now(),
              error: operationError,
            }),
          );
        }
      }
    };

    const previous = this.workspaceOperationTails.get(queueKey) || Promise.resolve();
    const result = previous.then(execute);
    const tail = result.catch(() => {});
    this.workspaceOperationTails.set(queueKey, tail);
    tail.then(() => {
      if (this.workspaceOperationTails.get(queueKey) === tail) {
        this.workspaceOperationTails.delete(queueKey);
      }
    });
    return result;
  }

  findWorkspaceOperationProvider(operationName) {
    const methodName =
      operationName === "initialize"
        ? "initializeRepository"
        : operationName === "clone"
          ? "cloneRepository"
          : null;
    if (!methodName) return null;
    return (
      this.operationProviders.find((provider) => typeof provider[methodName] === "function") || null
    );
  }

  performOperation(repository, operationName, args = []) {
    if (typeof operationName !== "string" || operationName.length === 0) {
      return Promise.reject(new TypeError("Repository operation name must be a non-empty string"));
    }

    return this.runOperation(repository, () => {
      const entry = this.entryByRepository.get(repository);
      const operation = {
        id: this.nextOperationId++,
        repository,
        name: operationName,
        status: "queued",
        queuedAt: Date.now(),
        startedAt: null,
      };
      entry.pendingOperations.set(operation.id, operation);
      if (!this.destroyed) {
        this.emitter.emit("did-queue-operation", this.operationSnapshot(operation));
      }

      const execute = async () => {
        operation.status = "running";
        operation.startedAt = Date.now();
        if (!this.destroyed) {
          this.emitter.emit("did-start-operation", this.operationSnapshot(operation));
        }

        let operationError = null;
        try {
          const record = this.findOperationImplementation(repository, operationName);
          if (!record) {
            const error = new Error(
              `No provider implements repository operation: ${operationName}`,
            );
            error.code = "ERR_REPOSITORY_OPERATION_UNAVAILABLE";
            error.operation = operationName;
            throw error;
          }

          record.activeOperations++;
          try {
            const result = await record.implementation[operationName](...args);
            await this.refreshRepositoryAfterOperation(repository);
            return result;
          } finally {
            record.activeOperations--;
            if (record.pendingDisposal && record.activeOperations === 0) {
              record.implementation.destroy?.();
            }
          }
        } catch (error) {
          operationError = error;
          throw error;
        } finally {
          entry.pendingOperations.delete(operation.id);
          if (!this.destroyed) {
            this.emitter.emit(
              "did-finish-operation",
              Object.freeze({
                ...this.operationSnapshot(operation),
                status: operationError ? "failed" : "succeeded",
                finishedAt: Date.now(),
                error: operationError,
              }),
            );
          }
        }
      };

      const result = entry.operationTail.then(execute);
      entry.operationTail = result.catch(() => {});
      return result;
    });
  }

  operationSnapshot(operation) {
    return Object.freeze({
      id: operation.id,
      repository: operation.repository,
      name: operation.name,
      status: operation.status,
      workingDirectory: operation.workingDirectory || null,
      queuedAt: operation.queuedAt,
      startedAt: operation.startedAt,
    });
  }

  findOperationImplementation(repository, operationName) {
    for (const provider of this.operationProviders) {
      const record = this.getOperationImplementation(repository, provider);
      if (record && this.operationImplementationSupports(record, operationName)) return record;
    }
    return null;
  }

  operationImplementationSupports(record, operationName) {
    if (typeof record.implementation[operationName] !== "function") return false;
    if (RepositoryOperations.standardCapabilities.includes(operationName)) return true;
    return (record.implementation.getCapabilities?.() || []).includes(operationName);
  }

  getOperationImplementation(repository, provider) {
    const entry = this.entryByRepository.get(repository);
    if (!entry || !this.operationProviders.includes(provider)) return null;
    if (entry.operationImplementations.has(provider)) {
      return entry.operationImplementations.get(provider);
    }
    if (typeof provider.createRepositoryOperations !== "function") {
      entry.operationImplementations.set(provider, null);
      return null;
    }

    const implementation = provider.createRepositoryOperations({
      repository,
      workingDirectory: entry.workingDirectory,
      gitDirectory: repository.getPath?.() || null,
    });
    const record = implementation
      ? { implementation, activeOperations: 0, pendingDisposal: false }
      : null;
    entry.operationImplementations.set(provider, record);
    return record;
  }

  disposeOperationImplementation(record, { force = false } = {}) {
    if (!record) return;
    if (!force && record.activeOperations > 0) {
      record.pendingDisposal = true;
    } else {
      record.implementation.destroy?.();
    }
  }

  disposeOperationImplementations(entry, options) {
    for (const record of entry.operationImplementations.values()) {
      this.disposeOperationImplementation(record, options);
    }
    entry.operationImplementations.clear();
  }

  async refreshRepositoryAfterOperation(repository) {
    if (repository.isDestroyed?.()) return;
    try {
      repository.refreshIndex?.();
      await repository.refreshStatus?.();
    } catch (error) {
      // The Git command has already succeeded. Never report it as failed (and
      // invite a dangerous retry) merely because the read cache did not refresh.
      this.notificationManager?.addWarning("Repository refresh failed after Git operation", {
        detail: error.message,
        dismissable: true,
      });
    }
  }

  emitOperationProviderChange() {
    if (this.destroyed || this.entriesById.size === 0) return;
    const repositories = this.getRepositories();
    this.emitChange({
      added: [],
      removed: [],
      updated: repositories,
      rootsAdded: [],
      rootsRemoved: [],
      routingChangedPrefixes: [],
    });
  }

  async add(filePath, { persist = true } = {}) {
    const repository = await this.resolveForPath(filePath);
    if (!repository) return null;

    const entry = this.entryByRepository.get(repository);
    const token = Symbol("manual");
    if (persist) entry.manualOwners.add(token);
    else entry.pins.add(token);

    return {
      repository,
      dispose: () => {
        entry.manualOwners.delete(token);
        entry.pins.delete(token);
        this.prune(entry);
      },
    };
  }

  forget(repository) {
    const entry = this.entryByRepository.get(repository);
    if (!entry) return false;
    entry.manualOwners.clear();
    this.prune(entry);
    return true;
  }

  setProjectRoots(directories, { scan = true } = {}) {
    if (this.destroyed) return;

    // Buffer events may be delivered while project roots are changing or the
    // project emitter is being reset. Revalidate these leases before pruning
    // repositories so an open editor can never be left with a destroyed repo.
    this.synchronizeBufferOwners();

    const oldRoots = this.rootPaths;
    const newRoots = directories.map((directory) => directory.getPath());
    const rootsAdded = newRoots.filter(
      (rootPath) => !oldRoots.some((oldRoot) => normalizePath(oldRoot) === normalizePath(rootPath)),
    );
    const rootsRemoved = oldRoots.filter(
      (rootPath) => !newRoots.some((newRoot) => normalizePath(newRoot) === normalizePath(rootPath)),
    );

    this.scanGeneration++;
    this.rootPaths = newRoots;

    // Recompute root ownership for existing repositories first. This transfers
    // ownership between overlapping/replaced roots without remove/add churn.
    const updated = [];
    for (const entry of this.entriesById.values()) {
      const wasMissing = entry.missing;
      entry.missing = !this.repositoryExists(entry);
      if (entry.missing !== wasMissing) updated.push(entry.repository);
      entry.rootOwners.clear();
      if (!entry.missing) {
        for (const rootPath of newRoots) {
          if (this.repositoryRelatesToRoot(entry, rootPath)) entry.rootOwners.add(rootPath);
        }
      }
    }

    const added = [];
    for (const directory of directories) {
      const repository = this.project.repositoryForDirectoryFromProvidersSync(directory);
      const entry = this.register(repository, { emit: false });
      if (entry && this.repositoryExists(entry)) {
        const wasMissing = entry.missing;
        entry.missing = false;
        if (wasMissing && !updated.includes(entry.repository)) updated.push(entry.repository);
        entry.rootOwners.add(directory.getPath());
        if (entry.newlyRegistered) added.push(entry.repository);
        entry.newlyRegistered = false;
      }
    }

    const removed = [];
    for (const entry of Array.from(this.entriesById.values())) {
      if (!this.hasOwners(entry)) {
        const updatedIndex = updated.indexOf(entry.repository);
        if (updatedIndex >= 0) updated.splice(updatedIndex, 1);
        removed.push(entry.repository);
        this.removeEntry(entry, { emit: false, destroy: true });
      }
    }

    if (
      added.length ||
      removed.length ||
      updated.length ||
      rootsAdded.length ||
      rootsRemoved.length
    ) {
      this.emitChange({
        added,
        removed,
        updated,
        rootsAdded,
        rootsRemoved,
        routingChangedPrefixes: [
          ...rootsAdded,
          ...rootsRemoved,
          ...updated.map((repository) => repository.getWorkingDirectory()),
        ],
      });
    }

    if (scan) {
      const generation = this.scanGeneration;
      queueMicrotask(() => {
        if (!this.destroyed && generation === this.scanGeneration) {
          this.scanProjectRoots({ generation }).catch((error) => {
            this.notificationManager?.addWarning("Repository scan failed", {
              detail: error.message,
              dismissable: true,
            });
          });
        }
      });
    }
  }

  async rescan() {
    if (!this.project) return [];
    this.setProjectRoots(this.project.getDirectories(), { scan: false });
    return this.scanProjectRoots({ generation: this.scanGeneration });
  }

  async scanProjectRoots({ generation = this.scanGeneration, depth } = {}) {
    const scanDepth = depth ?? this.config?.get("core.repositoryScanDepth") ?? 1;
    if (scanDepth < 1) return [];

    const discovered = [];
    for (const rootPath of this.rootPaths) {
      const results = await this.scanRoot(rootPath, scanDepth, generation);
      discovered.push(...results);
    }
    return discovered;
  }

  async scanRoot(rootPath, maxDepth, generation) {
    const discovered = [];
    const excluded = this.getExcludedDirectoryNames();
    const queue = [{ directoryPath: rootPath, depth: 0 }];

    while (queue.length > 0) {
      if (this.destroyed || generation !== this.scanGeneration) return discovered;
      if (
        !this.rootPaths.some((candidate) => normalizePath(candidate) === normalizePath(rootPath))
      ) {
        return discovered;
      }

      const current = queue.shift();
      let children;
      try {
        children = await fs.promises.readdir(current.directoryPath, { withFileTypes: true });
      } catch {
        continue;
      }

      if (current.depth > 0 && children.some((child) => child.name === ".git")) {
        if (this.automaticRepositoryLimitReached()) return discovered;

        const directory = this.project.getDirectoryForProjectPath(current.directoryPath);
        const repository = this.project.repositoryForDirectoryFromProvidersSync(directory);
        const entry = this.register(repository);
        if (entry && this.repositoryExists(entry)) {
          entry.missing = false;
          entry.rootOwners.add(rootPath);
          if (!discovered.includes(entry.repository)) discovered.push(entry.repository);
        }
      }

      if (current.depth >= maxDepth) continue;
      for (const child of children) {
        if (!child.isDirectory() || child.isSymbolicLink() || excluded.has(child.name)) continue;
        queue.push({
          directoryPath: path.join(current.directoryPath, child.name),
          depth: current.depth + 1,
        });
      }

      // Yield between directories so large scans do not monopolize startup.
      await new Promise((resolve) => setImmediate(resolve));
    }

    return discovered;
  }

  getExcludedDirectoryNames() {
    const excluded = new Set(DEFAULT_EXCLUDED_DIRECTORIES);
    const configured = this.config?.get("core.repositoryExcludedDirectories") || [];
    for (const name of configured) excluded.add(name);
    return excluded;
  }

  automaticRepositoryLimitReached() {
    const maximum = this.config?.get("core.repositoryMaxCount") ?? 100;
    if (this.entriesById.size < maximum) return false;

    if (!this.didNotifyRepositoryLimit) {
      this.didNotifyRepositoryLimit = true;
      this.notificationManager?.addInfo("Repository discovery limit reached", {
        detail: `Lumine stopped automatic discovery after finding ${maximum} repositories. You can raise core.repositoryMaxCount or add another repository manually.`,
        dismissable: true,
      });
    }
    return true;
  }

  handleProjectFileChanges(events) {
    if (!this.config?.get("core.repositoryWatchDiscovery")) return;

    const watchDepth = this.config.get("core.repositoryWatchDepth") ?? 1;
    for (const event of events) {
      for (const candidatePath of [event.path, event.oldPath]) {
        if (!candidatePath || path.basename(candidatePath) !== ".git") continue;

        const workingDirectory = path.dirname(candidatePath);
        const rootPath = this.rootPaths.find((root) => {
          if (!pathContains(root, workingDirectory)) return false;
          return pathDepth(path.relative(root, workingDirectory)) <= watchDepth;
        });
        if (!rootPath) continue;

        if (fs.existsSync(candidatePath)) {
          if (this.automaticRepositoryLimitReached()) continue;
          const directory = this.project.getDirectoryForProjectPath(workingDirectory);
          const repository = this.project.repositoryForDirectoryFromProvidersSync(directory);
          const entry = this.register(repository);
          if (entry) {
            const wasMissing = entry.missing;
            entry.missing = false;
            entry.rootOwners.add(rootPath);
            if (wasMissing) {
              this.emitChange({
                added: [],
                removed: [],
                updated: [entry.repository],
                rootsAdded: [],
                rootsRemoved: [],
                routingChangedPrefixes: [entry.workingDirectory],
              });
            }
          }
        } else {
          const entry = Array.from(this.entriesById.values()).find(
            (candidate) =>
              normalizePath(candidate.workingDirectory) === normalizePath(workingDirectory),
          );
          if (entry) {
            entry.missing = true;
            entry.rootOwners.clear();
            if (this.hasOwners(entry)) {
              this.emitChange({
                added: [],
                removed: [],
                updated: [entry.repository],
                rootsAdded: [],
                rootsRemoved: [],
                routingChangedPrefixes: [entry.workingDirectory],
              });
            } else {
              this.prune(entry);
            }
          }
        }
      }
    }
  }

  trackBuffer(buffer) {
    if (!buffer || this.bufferOwners.has(buffer)) return;

    const owner = {
      entry: null,
      subscriptions: new CompositeDisposable(),
    };
    this.bufferOwners.set(buffer, owner);

    const update = () => {
      const bufferPath = buffer.getPath?.();
      const repository = bufferPath ? this.resolveForPathSync(bufferPath) : null;
      const nextEntry = this.entryByRepository.get(repository) || null;
      const previousEntry = owner.entry;

      if (nextEntry === previousEntry) return;

      // Acquire the new lease before releasing the old one. Moving a buffer
      // between paths in the same repository must not cause destroy/add churn.
      if (nextEntry) nextEntry.bufferOwners.add(buffer);
      owner.entry = nextEntry;
      if (previousEntry) {
        previousEntry.bufferOwners.delete(buffer);
        // A repository also listens to buffer path changes. Let every listener
        // finish before releasing the old native handle.
        queueMicrotask(() => this.prune(previousEntry));
      }
    };
    owner.update = update;

    owner.subscriptions.add(
      buffer.onDidChangePath?.(update) || new Disposable(),
      buffer.onDidDestroy?.(() => {
        const entry = owner.entry;
        if (entry) entry.bufferOwners.delete(buffer);
        owner.subscriptions.dispose();
        this.bufferOwners.delete(buffer);

        // Other buffer-destroy listeners (including GitRepository itself) must
        // finish before releasing the repository's native handle.
        if (entry) queueMicrotask(() => this.prune(entry));
      }) || new Disposable(),
    );
    update();
  }

  synchronizeBufferOwners() {
    for (const buffer of this.project.getBuffers()) {
      const owner = this.bufferOwners.get(buffer);
      if (owner) owner.update();
      else this.trackBuffer(buffer);
    }
  }

  register(repository, { emit = true } = {}) {
    if (this.destroyed || !repository || repository.isDestroyed?.()) return null;

    const known = this.entryByRepository.get(repository);
    if (known) return known;

    const workingDirectory = repository.getWorkingDirectory();
    const openedWorkingDirectory = repository.repo?.openedWorkingDirectory;
    const id = this.repositoryId(repository, workingDirectory);
    const existing = this.entriesById.get(id);
    if (existing) return existing;

    const entry = {
      id,
      repository,
      workingDirectory,
      workingDirectories: Array.from(
        new Set([workingDirectory, openedWorkingDirectory].filter(Boolean)),
      ),
      routingDirectories: Array.from(
        new Set([workingDirectory, openedWorkingDirectory].filter(Boolean).flatMap(pathAliases)),
      ),
      rootOwners: new Set(),
      bufferOwners: new Set(),
      manualOwners: new Set(),
      pins: new Set(),
      operationOwners: new Set(),
      operationTail: Promise.resolve(),
      pendingOperations: new Map(),
      operationImplementations: new Map(),
      operations: null,
      missing: false,
      newlyRegistered: true,
      removing: false,
      destroySubscription: null,
    };

    for (const rootPath of this.rootPaths) {
      if (this.repositoryRelatesToRoot(entry, rootPath)) entry.rootOwners.add(rootPath);
    }

    entry.destroySubscription = repository.onDidDestroy(() => {
      if (!entry.removing) this.removeEntry(entry, { destroy: false });
    });

    this.entriesById.set(id, entry);
    this.entryByRepository.set(repository, entry);
    entry.operations = new RepositoryOperations(this, repository);
    repository.setOperations?.(entry.operations);

    if (emit) {
      entry.newlyRegistered = false;
      this.emitChange({
        added: [repository],
        removed: [],
        updated: [],
        rootsAdded: [],
        rootsRemoved: [],
        routingChangedPrefixes: [workingDirectory],
      });
    }
    return entry;
  }

  repositoryId(repository, workingDirectory) {
    let gitDirectory = repository.getPath?.() || workingDirectory;
    try {
      gitDirectory = fs.realpathSync.native(gitDirectory);
    } catch {
      // The provider has already validated the repository. Keep the resolved
      // path if a transient filesystem race prevents canonicalization.
    }
    return `${normalizePath(workingDirectory)}\0${normalizePath(gitDirectory)}`;
  }

  repositoryRelatesToRoot(entry, rootPath) {
    return pathAliases(rootPath).some((rootAlias) =>
      entry.routingDirectories.some(
        (workingDirectory) =>
          pathContainsNormalized(workingDirectory, rootAlias) ||
          pathContainsNormalized(rootAlias, workingDirectory),
      ),
    );
  }

  repositoryExists(entry) {
    return entry.repository.isPresent?.() ?? true;
  }

  hasOwners(entry) {
    return (
      entry.rootOwners.size > 0 ||
      entry.bufferOwners.size > 0 ||
      entry.manualOwners.size > 0 ||
      entry.pins.size > 0 ||
      entry.operationOwners.size > 0
    );
  }

  prune(entry) {
    if (!entry || entry.removing || this.hasOwners(entry)) return;
    this.removeEntry(entry, { destroy: true });
  }

  removeEntry(entry, { emit = true, destroy = false } = {}) {
    if (!entry || entry.removing || !this.entriesById.has(entry.id)) return;
    entry.removing = true;
    this.entriesById.delete(entry.id);
    entry.destroySubscription.dispose();
    this.disposeOperationImplementations(entry);
    entry.repository.setOperations?.(null);

    if (destroy && !entry.repository.isDestroyed?.()) entry.repository.destroy();

    if (emit && !this.destroyed) {
      this.emitChange({
        added: [],
        removed: [entry.repository],
        updated: [],
        rootsAdded: [],
        rootsRemoved: [],
        routingChangedPrefixes: [entry.workingDirectory],
      });
    }
  }

  emitChange(change) {
    if (this.destroyed) return;
    this.version++;
    const event = Object.freeze({ version: this.version, ...change });

    for (const repository of change.added) this.emitter.emit("did-add-repository", repository);
    for (const repository of change.removed) {
      this.emitter.emit("did-remove-repository", repository);
    }
    this.emitter.emit("did-change", event);
  }
};

module.exports.pathContains = pathContains;
module.exports.pathDepth = pathDepth;
