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
    this.refreshStatusSnapshotCount = 0;
    this.refreshRefsSnapshotCount = 0;
    this.statusSnapshot = { initialized: true };
    this.refsSnapshot = { initialized: true };
  }

  getStatusSnapshot() {
    return this.statusSnapshot;
  }

  getRefsSnapshot() {
    return this.refsSnapshot;
  }

  async refreshStatusSnapshot() {
    this.refreshStatusSnapshotCount++;
  }

  async refreshRefsSnapshot() {
    this.refreshRefsSnapshotCount++;
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

  it("fully releases a workspace-only provider when it is disposed", () => {
    const workdir = temp.mkdirSync("workspace-only-provider");
    const repository = new FakeRepository(workdir);
    const provider = { initializeRepository() {} };
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    const providerDisposable = registry.addOperationProvider(provider);

    expect(repository.getOperations().isAvailable("commit")).toBe(false);
    const entry = registry.entryByRepository.get(repository);
    expect(entry.operationImplementations.has(provider)).toBe(true);

    providerDisposable.dispose();
    expect(entry.operationImplementations.has(provider)).toBe(false);
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
    expect(repository.refreshStatusSnapshotCount).toBe(1);
    expect(repository.refreshRefsSnapshotCount).toBe(1);
  });

  it("uses service providers before the built-in fallback provider", async () => {
    const workdir = temp.mkdirSync("fallback-operation-provider");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    registry.addOperationProvider(
      {
        createRepositoryOperations() {
          return { commit: async () => "fallback" };
        },
      },
      { fallback: true },
    );
    const override = registry.addOperationProvider({
      createRepositoryOperations() {
        return { commit: async () => "override" };
      },
    });

    expect(await repository.getOperations().commit("Subject")).toBe("override");
    override.dispose();
    expect(await repository.getOperations().commit("Subject")).toBe("fallback");
  });

  it("does not report a successful write as failed when cache refresh fails", async () => {
    const workdir = temp.mkdirSync("failed-operation-refresh");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    repository.refreshStatusSnapshot = async () => {
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
    await Promise.resolve();
    registry.setProjectRoots([]);
    providerDisposable.dispose();
    expect(repository.isDestroyed()).toBe(false);
    expect(destroyCount).toBe(0);

    finishCommit("done");
    expect(await commit).toBe("done");
    expect(destroyCount).toBe(1);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("serializes writes to one repository and emits operation lifecycle events", async () => {
    const workdir = temp.mkdirSync("serialized-repository-operations");
    const repository = new FakeRepository(workdir);
    const calls = [];
    const events = [];
    let finishFirst;
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    registry.addOperationProvider({
      createRepositoryOperations() {
        return {
          commit(message) {
            calls.push(message);
            if (message === "first") {
              return new Promise((resolve) => (finishFirst = resolve));
            }
            return Promise.resolve(message);
          },
        };
      },
    });
    const operations = repository.getOperations();
    operations.onDidQueueOperation((event) => events.push(`queued:${event.id}`));
    operations.onDidStartOperation((event) => events.push(`started:${event.id}`));
    operations.onDidFinishOperation((event) => events.push(`${event.status}:${event.id}`));

    const first = operations.commit("first");
    const second = operations.commit("second");
    await Promise.resolve();

    expect(calls).toEqual(["first"]);
    expect(operations.getPendingOperations().map((operation) => operation.status)).toEqual([
      "running",
      "queued",
    ]);

    finishFirst("first");
    expect(await first).toBe("first");
    expect(await second).toBe("second");
    expect(calls).toEqual(["first", "second"]);
    expect(events).toEqual([
      "queued:1",
      "queued:2",
      "started:1",
      "succeeded:1",
      "started:2",
      "succeeded:2",
    ]);
    expect(operations.getPendingOperations()).toEqual([]);
  });

  it("continues a repository queue after a failed write", async () => {
    const workdir = temp.mkdirSync("failed-queued-operation");
    const repository = new FakeRepository(workdir);
    let callCount = 0;
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    registry.addOperationProvider({
      createRepositoryOperations() {
        return {
          commit() {
            callCount++;
            if (callCount === 1) throw new Error("commit failed");
            return "second-commit";
          },
        };
      },
    });

    const first = repository
      .getOperations()
      .commit("first")
      .catch((error) => error.message);
    const second = repository.getOperations().commit("second");

    expect(await first).toBe("commit failed");
    expect(await second).toBe("second-commit");
  });

  it("runs writes to different repositories in parallel", async () => {
    const firstPath = temp.mkdirSync("parallel-repository-one");
    const secondPath = temp.mkdirSync("parallel-repository-two");
    const firstRepository = new FakeRepository(firstPath);
    const secondRepository = new FakeRepository(secondPath);
    const started = [];
    let finishWrites;
    const writes = new Promise((resolve) => (finishWrites = resolve));
    repositories.push(firstRepository, secondRepository);
    registry.setProjectRoots([directoryFor(firstPath), directoryFor(secondPath)]);
    registry.addOperationProvider({
      createRepositoryOperations({ workingDirectory }) {
        return {
          commit() {
            started.push(workingDirectory);
            return writes;
          },
        };
      },
    });

    const first = firstRepository.getOperations().commit("first");
    const second = secondRepository.getOperations().commit("second");
    await Promise.resolve();

    expect(started).toEqual([firstPath, secondPath]);
    finishWrites();
    await Promise.all([first, second]);
  });

  it("initializes and registers a repository through a workspace provider", async () => {
    const workdir = temp.mkdirSync("initialized-repository");
    let initializeOptions;
    registry.addOperationProvider({
      async initializeRepository(directoryPath, options) {
        initializeOptions = options;
        repositories.push(new FakeRepository(directoryPath));
      },
    });

    expect(registry.canPerformWorkspaceOperation("initialize")).toBe(true);
    expect(registry.getWorkspaceOperationCapabilities()).toEqual(["initialize"]);
    const repository = await registry.initialize(workdir, { initialBranch: "main" });

    expect(repository).toBe(repositories[0]);
    expect(initializeOptions).toEqual({ initialBranch: "main" });
    expect(registry.getRepositories()).toEqual([repository]);
    registry.setProjectRoots([]);
    expect(repository.isDestroyed()).toBe(false);
    registry.forget(repository);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("clones and registers a repository through a workspace provider", async () => {
    const destinationPath = path.join(temp.mkdirSync("clone-parent"), "cloned");
    let cloneArguments;
    registry.addOperationProvider({
      async cloneRepository(remoteUrl, workdir, options) {
        cloneArguments = { remoteUrl, workdir, options };
        repositories.push(new FakeRepository(workdir));
      },
    });

    const repository = await registry.clone("https://example.com/repository.git", destinationPath, {
      branch: "main",
    });

    expect(cloneArguments).toEqual({
      remoteUrl: "https://example.com/repository.git",
      workdir: destinationPath,
      options: { branch: "main" },
    });
    expect(repository).toBe(repositories[0]);
    expect(registry.getForPath(path.join(destinationPath, "README.md"))).toBe(repository);
  });

  it("executes raw Git commands through the preferred transport provider", async () => {
    const calls = [];
    registry.addOperationProvider(
      {
        executeGit() {
          throw new Error("fallback provider should not be used");
        },
      },
      { fallback: true },
    );
    registry.addOperationProvider({
      executeGit(args, workingDirectory, options) {
        calls.push({ args, workingDirectory, options });
        return Promise.resolve({ exitCode: 0, stdout: "ok", stderr: "" });
      },
      getGitExecutablePath() {
        return "/embedded/git";
      },
    });
    const workingDirectory = temp.mkdirSync("raw-git-transport");

    expect(registry.canExecuteGitCommands()).toBe(true);
    expect(registry.getGitExecutablePath()).toBe("/embedded/git");
    expect(await registry.executeGit(["status"], workingDirectory, { stdin: "input" })).toEqual({
      exitCode: 0,
      stdout: "ok",
      stderr: "",
    });
    expect(calls).toEqual([
      {
        args: ["status"],
        workingDirectory,
        options: { stdin: "input" },
      },
    ]);
  });

  describe("active repository", () => {
    class FakeWorkspace {
      constructor() {
        this.emitter = new Emitter();
        this.activeItem = null;
        this.center = {
          onDidChangeActivePaneItem: (callback) =>
            this.emitter.on("did-change-active-pane-item", callback),
          getActivePaneItem: () => this.activeItem,
        };
      }

      getCenter() {
        return this.center;
      }

      setActiveItem(item) {
        this.activeItem = item;
        this.emitter.emit("did-change-active-pane-item", item);
      }
    }

    function itemFor(filePath) {
      return { getPath: () => filePath };
    }

    async function flushMicrotasks() {
      // The harness fakes timers, so drain the microtask queue directly.
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    }

    let workspace;
    let workdirA;
    let workdirB;
    let repoA;
    let repoB;

    beforeEach(() => {
      workspace = new FakeWorkspace();
      workdirA = temp.mkdirSync("active-repository-a");
      workdirB = temp.mkdirSync("active-repository-b");
      repoA = new FakeRepository(workdirA);
      repoB = new FakeRepository(workdirB);
      repositories.push(repoA, repoB);
      registry.setProjectRoots([directoryFor(workdirA), directoryFor(workdirB)]);
    });

    it("follows the active pane item, including paths outside every repository", () => {
      const events = [];
      registry.onDidChangeActiveRepository((event) => events.push(event));
      registry.attachWorkspace(workspace);

      // Registering the project roots already adopted the first repository.
      expect(registry.getActiveRepository()).toBe(repoA);
      expect(registry.isActiveRepositoryPinned()).toBe(false);
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(workdirA);

      workspace.setActiveItem(itemFor(path.join(workdirB, "file.txt")));
      expect(registry.getActiveRepository()).toBe(repoB);

      // Items without a path (settings tabs) keep the current selection.
      workspace.setActiveItem({});
      expect(registry.getActiveRepository()).toBe(repoB);

      // A path outside every repository clears the repository but keeps a
      // working directory, so consumers can offer initialize and clone.
      const outsideDir = temp.mkdirSync("active-outside");
      workspace.setActiveItem(itemFor(path.join(outsideDir, "loose.txt")));
      expect(registry.getActiveRepository()).toBeNull();
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(outsideDir);

      // Path-less items also keep a null-repository context.
      workspace.setActiveItem({});
      expect(registry.getActiveRepository()).toBeNull();
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(outsideDir);

      // Directory-backed items use their working directory as-is.
      const terminalDir = temp.mkdirSync("active-terminal");
      workspace.setActiveItem({ getWorkingDirectory: () => terminalDir });
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(terminalDir);

      workspace.setActiveItem(itemFor(path.join(workdirA, "back.txt")));
      expect(registry.getActiveRepository()).toBe(repoA);

      expect(events.map((event) => [event.repository, event.workingDirectory])).toEqual([
        [repoB, workdirB],
        [null, outsideDir],
        [null, terminalDir],
        [repoA, workdirA],
      ]);
    });

    it("anchors an out-of-repository path inside a project root to that root", () => {
      registry.attachWorkspace(workspace);
      const bareRoot = temp.mkdirSync("active-bare-root");
      registry.setProjectRoots([directoryFor(workdirA), directoryFor(bareRoot)]);

      workspace.setActiveItem(itemFor(path.join(bareRoot, "nested", "file.txt")));
      expect(registry.getActiveRepository()).toBeNull();
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(bareRoot);
    });

    it("pins a manual selection until it is cleared", () => {
      registry.attachWorkspace(workspace);
      workspace.setActiveItem(itemFor(path.join(workdirA, "file.txt")));

      registry.setActiveRepository(repoB, { pin: true });
      expect(registry.getActiveRepository()).toBe(repoB);
      expect(registry.isActiveRepositoryPinned()).toBe(true);

      workspace.setActiveItem(itemFor(path.join(workdirA, "other.txt")));
      expect(registry.getActiveRepository()).toBe(repoB);

      registry.setActiveRepository(null);
      expect(registry.isActiveRepositoryPinned()).toBe(false);
      // Recomputed from the workspace's current active item.
      expect(registry.getActiveRepository()).toBe(repoA);
    });

    it("allows an unpinned manual selection to be superseded by the next item change", () => {
      registry.attachWorkspace(workspace);

      registry.setActiveRepository(repoB);
      expect(registry.getActiveRepository()).toBe(repoB);
      expect(registry.isActiveRepositoryPinned()).toBe(false);

      workspace.setActiveItem(itemFor(path.join(workdirA, "file.txt")));
      expect(registry.getActiveRepository()).toBe(repoA);
    });

    it("keeps a null-repository context on the focused item when its repository is removed", async () => {
      const events = [];
      registry.attachWorkspace(workspace);
      workspace.setActiveItem(itemFor(path.join(workdirB, "file.txt")));
      expect(registry.getActiveRepository()).toBe(repoB);
      registry.onDidChangeActiveRepository((event) => events.push(event));

      repositories.splice(repositories.indexOf(repoB), 1);
      repoB.destroy();
      await flushMicrotasks();

      // The focused file is still inside workdirB, so the context stays there
      // instead of jumping to an unrelated repository.
      expect(registry.getActiveRepository()).toBeNull();
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(workdirB);
      expect(events.at(-1).repository).toBeNull();
      expect(events.at(-1).workingDirectory).toBe(workdirB);
    });

    it("clears the active repository when the active one is removed and a path-less item is focused", async () => {
      registry.attachWorkspace(workspace);
      workspace.setActiveItem(itemFor(path.join(workdirB, "file.txt")));
      workspace.setActiveItem({});
      expect(registry.getActiveRepository()).toBe(repoB);

      repositories.splice(repositories.indexOf(repoB), 1);
      repoB.destroy();
      await flushMicrotasks();

      // A focused path-less item means the workspace center is not empty, so the
      // registry does not adopt an unrelated repository; it goes neutral. A
      // repository is only adopted as a default when the center is empty.
      expect(registry.getActiveRepository()).toBeNull();
      expect(registry.getActiveRepositoryContext().workingDirectory).toBeNull();
    });

    it("adopts a repository when the active one is removed and the center is empty", async () => {
      registry.attachWorkspace(workspace);
      workspace.setActiveItem(itemFor(path.join(workdirB, "file.txt")));
      workspace.setActiveItem(null);
      expect(registry.getActiveRepository()).toBe(repoB);

      repositories.splice(repositories.indexOf(repoB), 1);
      repoB.destroy();
      await flushMicrotasks();

      expect(registry.getActiveRepository()).toBe(repoA);
    });

    it("gives a window whose roots hold no repositories an initialize context", async () => {
      registry.attachWorkspace(workspace);
      const bareRoot = temp.mkdirSync("active-initialize-root");
      registry.setProjectRoots([directoryFor(bareRoot)]);
      await flushMicrotasks();

      expect(registry.getActiveRepository()).toBeNull();
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(bareRoot);

      // A repository appearing at the context directory becomes active, as
      // after an initialize or clone operation completes there.
      const created = new FakeRepository(bareRoot);
      repositories.push(created);
      const registration = await registry.add(path.join(bareRoot, "file.txt"));
      await flushMicrotasks();

      expect(registration.repository).toBe(created);
      expect(registry.getActiveRepository()).toBe(created);
      expect(registry.getActiveRepositoryContext().workingDirectory).toBe(bareRoot);
    });

    it("keeps a pinned out-of-project repository alive until it is deactivated", () => {
      registry.attachWorkspace(workspace);
      const workdirC = temp.mkdirSync("active-repository-c");
      const repoC = new FakeRepository(workdirC);
      repositories.push(repoC);
      registry.resolveForPathSync(path.join(workdirC, "file.txt"));

      registry.setActiveRepository(repoC, { pin: true });
      expect(registry.getRepositories()).toContain(repoC);

      registry.setActiveRepository(repoA);
      expect(repoC.isDestroyed()).toBe(true);
    });

    it("resolves and activates a repository by path", async () => {
      registry.attachWorkspace(workspace);
      const repository = await registry.setActiveRepositoryForPath(
        path.join(workdirB, "deep", "file.txt"),
        { pin: true },
      );
      expect(repository).toBe(repoB);
      expect(registry.getActiveRepository()).toBe(repoB);
      expect(registry.isActiveRepositoryPinned()).toBe(true);
    });
  });

  it("serializes initialize and clone operations targeting the same destination", async () => {
    const destinationPath = path.join(temp.mkdirSync("workspace-operation-parent"), "repository");
    const calls = [];
    let finishInitialize;
    registry.addOperationProvider({
      initializeRepository() {
        calls.push("initialize");
        return new Promise((resolve) => (finishInitialize = resolve));
      },
      cloneRepository() {
        calls.push("clone");
        repositories.push(new FakeRepository(destinationPath));
      },
    });

    const initialize = registry.initialize(destinationPath).catch((error) => error);
    const clone = registry.clone("https://example.com/repository.git", destinationPath);
    await Promise.resolve();
    expect(calls).toEqual(["initialize"]);

    finishInitialize();
    await initialize;
    await clone;
    expect(calls).toEqual(["initialize", "clone"]);
  });

  it("rejects workspace operations after the registry is destroyed", async () => {
    registry.addOperationProvider({ initializeRepository() {} });
    registry.destroy();

    let error;
    try {
      await registry.initialize(temp.mkdirSync("destroyed-registry-operation"));
    } catch (caughtError) {
      error = caughtError;
    }
    expect(error.message).toContain("destroyed RepositoryRegistry");
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
        "git.watchDiscovery": true,
        "git.watchDepth": 1,
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
