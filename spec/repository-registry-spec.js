const fs = require("fs");
const path = require("path");

const { Disposable, Emitter } = require("event-kit");
const temp = require("temp").track();

const RepositoryRegistry = require("../src/repository-registry");

class FakeRepository {
  constructor(workingDirectory) {
    this.workingDirectory = workingDirectory;
    this.gitDirectory = path.join(workingDirectory, ".git");
    fs.mkdirSync(this.gitDirectory, { recursive: true });
    this.emitter = new Emitter();
    this.destroyed = false;
    this.operations = null;
    this.refreshIndexCount = 0;
    this.refreshStatusCount = 0;
  }

  getWorkingDirectory() {
    return this.workingDirectory;
  }

  getPath() {
    return this.gitDirectory;
  }

  isDestroyed() {
    return this.destroyed;
  }

  isPresent() {
    return fs.existsSync(this.gitDirectory);
  }

  setOperations(operations) {
    this.operations = operations;
  }

  getOperations() {
    return this.operations;
  }

  refreshIndex() {
    this.refreshIndexCount++;
  }

  async refreshStatus() {
    this.refreshStatusCount++;
  }

  onDidDestroy(callback) {
    return this.emitter.once("did-destroy", callback);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.emitter.emit("did-destroy");
    this.emitter.dispose();
  }
}

class FakeProject {
  constructor(repositories) {
    this.repositories = repositories;
    this.directories = [];
    this.buffers = [];
    this.emitter = new Emitter();
  }

  getBuffers() {
    return this.buffers;
  }

  addBuffer(buffer) {
    this.buffers.push(buffer);
    this.emitter.emit("did-add-buffer", buffer);
  }

  onDidAddBuffer(callback) {
    return this.emitter.on("did-add-buffer", callback);
  }

  onDidChangeFiles(callback) {
    return this.emitter.on("did-change-files", callback);
  }

  emitFileChanges(events) {
    this.emitter.emit("did-change-files", events);
  }

  getDirectories() {
    return this.directories;
  }

  getDirectoryForProjectPath(filePath) {
    return directoryFor(filePath);
  }

  repositoryForDirectoryFromProvidersSync(directory) {
    const directoryPath = directory.getPath();
    return (
      this.repositories
        .filter((repository) => contains(repository.getWorkingDirectory(), directoryPath))
        .sort(
          (left, right) => right.getWorkingDirectory().length - left.getWorkingDirectory().length,
        )[0] || null
    );
  }

  async repositoryForDirectoryFromProviders(directory) {
    return this.repositoryForDirectoryFromProvidersSync(directory);
  }
}

function normalize(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function contains(parentPath, childPath) {
  const parent = normalize(parentPath);
  const child = normalize(childPath);
  return child === parent || child.startsWith(`${parent}${path.sep}`);
}

function directoryFor(directoryPath) {
  return {
    getPath() {
      return directoryPath;
    },
    getRealPathSync() {
      return directoryPath;
    },
  };
}

function config(values = {}) {
  return {
    get(key) {
      return values[key];
    },
  };
}

function bufferFor(filePath) {
  const emitter = new Emitter();
  let currentPath = filePath;
  return {
    getPath() {
      return currentPath;
    },
    onDidChangePath(callback) {
      return emitter.on("did-change-path", callback);
    },
    onDidDestroy(callback) {
      return emitter.once("did-destroy", callback);
    },
    destroy() {
      emitter.emit("did-destroy");
      emitter.dispose();
    },
    setPath(nextPath) {
      currentPath = nextPath;
      emitter.emit("did-change-path");
    },
  };
}

describe("RepositoryRegistry", () => {
  let project;
  let registry;
  let repositories;

  beforeEach(() => {
    repositories = [];
    project = new FakeProject(repositories);
    registry = new RepositoryRegistry({ project, config: config() });
  });

  afterEach(() => registry.destroy());

  it("finds a repository containing a project root", () => {
    const workdir = temp.mkdirSync("containing-repository");
    const rootPath = path.join(workdir, "packages", "editor");
    repositories.push(new FakeRepository(workdir));

    registry.setProjectRoots([directoryFor(rootPath)]);

    expect(registry.getRepositories()).toEqual(repositories);
    expect(registry.getForPath(path.join(rootPath, "src", "main.js"))).toBe(repositories[0]);
  });

  it("routes a path to the nearest nested repository", () => {
    const outerPath = temp.mkdirSync("outer-repository");
    const nestedPath = path.join(outerPath, "packages", "nested");
    const outer = new FakeRepository(outerPath);
    const nested = new FakeRepository(nestedPath);
    repositories.push(outer, nested);

    registry.setProjectRoots([directoryFor(outerPath)]);
    registry.resolveForPathSync(path.join(nestedPath, "src", "main.js"));

    expect(registry.getForPath(path.join(outerPath, "README.md"))).toBe(outer);
    expect(registry.getForPath(path.join(nestedPath, "src", "main.js"))).toBe(nested);
  });

  it("routes cached paths without filesystem calls", () => {
    const workdir = temp.mkdirSync("cached-routing-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    spyOn(fs.realpathSync, "native").andCallThrough();

    for (let index = 0; index < 1000; index++) {
      registry.getForPath(path.join(workdir, "src", `file-${index}.js`));
    }

    expect(fs.realpathSync.native).not.toHaveBeenCalled();
  });

  it("does not remove and re-add a repository when roots are replaced inside it", () => {
    const workdir = temp.mkdirSync("reconciled-repository");
    const repository = new FakeRepository(workdir);
    const changes = [];
    repositories.push(repository);
    registry.onDidChange((change) => changes.push(change));

    registry.setProjectRoots([directoryFor(path.join(workdir, "frontend"))]);
    changes.length = 0;
    registry.setProjectRoots([directoryFor(path.join(workdir, "backend"))]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);
    expect(changes.length).toBe(1);
    expect(changes[0].added).toEqual([]);
    expect(changes[0].removed).toEqual([]);
  });

  it("keeps a repository until its last root owner is removed", () => {
    const workdir = temp.mkdirSync("multi-root-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);

    registry.setProjectRoots([
      directoryFor(path.join(workdir, "frontend")),
      directoryFor(path.join(workdir, "backend")),
    ]);
    registry.setProjectRoots([directoryFor(path.join(workdir, "backend"))]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);

    registry.setProjectRoots([]);
    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("keeps a pinned repository after its root is removed", () => {
    const workdir = temp.mkdirSync("pinned-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);

    registry.setProjectRoots([directoryFor(workdir)]);
    const pin = registry.retain(repository);
    registry.setProjectRoots([]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);

    pin.dispose();
    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("keeps a repository alive until an operation completes", async () => {
    const workdir = temp.mkdirSync("operation-owned-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);

    let completeOperation;
    const operation = registry.runOperation(
      repository,
      () => new Promise((resolve) => (completeOperation = resolve)),
    );
    registry.setProjectRoots([]);
    expect(repository.isDestroyed()).toBe(false);

    completeOperation("done");
    expect(await operation).toBe("done");
    expect(repository.isDestroyed()).toBe(true);
  });

  it("assigns a stable write facade when a repository is registered", () => {
    const workdir = temp.mkdirSync("repository-operations-facade");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);

    registry.setProjectRoots([directoryFor(workdir)]);

    expect(repository.getOperations()).toBe(registry.getOperations(repository));
    expect(repository.getOperations().isAvailable()).toBe(false);
  });

  it("consumes operation providers directly from the package service hub", async () => {
    registry.destroy();
    let consumeService;
    let consumeVersion;
    let consumeCallback;
    const packageManager = {
      serviceHub: {
        consume(service, version, callback) {
          consumeService = service;
          consumeVersion = version;
          consumeCallback = callback;
          return new Disposable();
        },
      },
    };
    registry = new RepositoryRegistry({ project, config: config(), packageManager });
    const workdir = temp.mkdirSync("operation-provider-service");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);

    consumeCallback({
      createRepositoryOperations() {
        return { commit: async () => "service-commit" };
      },
    });

    expect(consumeService).toBe("atom.repository-operation-provider");
    expect(consumeVersion).toBe("^1.0.0");
    expect(await repository.getOperations().commit("Subject")).toBe("service-commit");
  });

  it("dispatches writes through a provider that arrives after discovery", async () => {
    const workdir = temp.mkdirSync("late-operation-provider");
    const repository = new FakeRepository(workdir);
    const commits = [];
    let providerContext;
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    const operations = repository.getOperations();

    registry.addOperationProvider({
      createRepositoryOperations(context) {
        providerContext = context;
        return {
          async commit(message, options) {
            commits.push({ message, options });
            return "created-commit";
          },
        };
      },
    });

    expect(operations.isAvailable("commit")).toBe(true);
    expect(operations.getCapabilities()).toContain("commit");
    expect(await operations.commit("Subject", { amend: true })).toBe("created-commit");
    expect(providerContext).toEqual({
      repository,
      workingDirectory: workdir,
      gitDirectory: repository.getPath(),
    });
    expect(commits).toEqual([{ message: "Subject", options: { amend: true } }]);
    expect(repository.refreshIndexCount).toBe(1);
    expect(repository.refreshStatusCount).toBe(1);
  });

  it("does not report a successful write as failed when cache refresh fails", async () => {
    const workdir = temp.mkdirSync("failed-operation-refresh");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    repository.refreshStatus = async () => {
      throw new Error("refresh failed");
    };
    registry.addOperationProvider({
      createRepositoryOperations() {
        return { commit: async () => "created-commit" };
      },
    });

    expect(await repository.getOperations().commit("Subject")).toBe("created-commit");
  });

  it("reports an unavailable operation with a stable error code", async () => {
    const workdir = temp.mkdirSync("unavailable-operation");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);

    let error;
    try {
      await repository.getOperations().push("origin", "main");
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error.code).toBe("ERR_REPOSITORY_OPERATION_UNAVAILABLE");
    expect(error.operation).toBe("push");
  });

  it("only exposes explicitly declared provider extensions", async () => {
    const workdir = temp.mkdirSync("custom-operation-capability");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    registry.addOperationProvider({
      createRepositoryOperations() {
        return {
          customWrite: async () => "custom-result",
          internalHelper: async () => "must-not-be-public",
          getCapabilities: () => ["customWrite"],
        };
      },
    });

    const operations = repository.getOperations();
    expect(operations.getCapabilities()).toContain("customWrite");
    expect(await operations.execute("customWrite")).toBe("custom-result");
    expect(operations.isAvailable("internalHelper")).toBe(false);
  });

  it("keeps an active provider implementation alive until its write completes", async () => {
    const workdir = temp.mkdirSync("active-operation-provider");
    const repository = new FakeRepository(workdir);
    let finishCommit;
    let destroyCount = 0;
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    const providerDisposable = registry.addOperationProvider({
      createRepositoryOperations() {
        return {
          commit() {
            return new Promise((resolve) => (finishCommit = resolve));
          },
          destroy() {
            destroyCount++;
          },
        };
      },
    });

    const commit = repository.getOperations().commit("Subject");
    registry.setProjectRoots([]);
    providerDisposable.dispose();
    expect(repository.isDestroyed()).toBe(false);
    expect(destroyCount).toBe(0);

    finishCommit("done");
    expect(await commit).toBe("done");
    expect(destroyCount).toBe(1);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("keeps a repository until its last open buffer is destroyed", async () => {
    const workdir = temp.mkdirSync("buffer-owned-repository");
    const repository = new FakeRepository(workdir);
    const buffer = bufferFor(path.join(workdir, "src", "main.js"));
    repositories.push(repository);

    registry.setProjectRoots([directoryFor(workdir)]);
    project.addBuffer(buffer);
    registry.setProjectRoots([]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);

    buffer.destroy();
    await Promise.resolve();
    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("releases an old buffer repository after all path listeners run", async () => {
    const workdir = temp.mkdirSync("moved-buffer-repository");
    const repository = new FakeRepository(workdir);
    const buffer = bufferFor(path.join(workdir, "main.js"));
    repositories.push(repository);

    registry.setProjectRoots([directoryFor(workdir)]);
    project.addBuffer(buffer);
    registry.setProjectRoots([]);
    buffer.onDidChangePath(() => expect(repository.isDestroyed()).toBe(false));
    buffer.setPath(path.join(temp.mkdirSync("outside-repository"), "main.js"));

    await Promise.resolve();
    expect(repository.isDestroyed()).toBe(true);
  });

  it("discovers repositories below a project root to the requested depth", async () => {
    const rootPath = temp.mkdirSync("scanned-root");
    const nestedPath = path.join(rootPath, "packages", "nested");
    fs.mkdirSync(path.join(nestedPath, ".git"), { recursive: true });
    const nested = new FakeRepository(nestedPath);
    repositories.push(nested);

    registry.setProjectRoots([directoryFor(rootPath)]);
    await registry.scanProjectRoots({ depth: 2 });

    expect(registry.getRepositories()).toContain(nested);
  });

  it("removes repositories that disappeared during a manual rescan", async () => {
    const workdir = temp.mkdirSync("removed-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    project.directories = [directoryFor(workdir)];

    registry.setProjectRoots(project.directories);
    fs.rmSync(repository.getPath(), { recursive: true });
    await registry.rescan();

    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("optionally detects repositories added and removed below a root", () => {
    registry.destroy();
    registry = new RepositoryRegistry({
      project,
      config: config({
        "core.repositoryWatchDiscovery": true,
        "core.repositoryWatchDepth": 1,
      }),
    });
    const rootPath = temp.mkdirSync("watched-root");
    const nestedPath = path.join(rootPath, "nested");
    fs.mkdirSync(nestedPath);
    registry.setProjectRoots([directoryFor(rootPath)]);

    const repository = new FakeRepository(nestedPath);
    repositories.push(repository);
    project.emitFileChanges([{ path: repository.getPath() }]);
    expect(registry.getForPath(nestedPath)).toBe(repository);

    fs.rmSync(repository.getPath(), { recursive: true });
    project.emitFileChanges([{ path: repository.getPath() }]);
    expect(registry.getForPath(nestedPath)).toBeNull();
    expect(repository.isDestroyed()).toBe(true);
  });
});
